package backend

import (
	"context"
	"net/http"
	"os"
	"strings"
	"time"

	cpk8s "github.com/crossplane-contrib/provider-kubernetes/apis/v1alpha1"
	xpv1 "github.com/crossplane/crossplane-runtime/apis/common/v1"
	"github.com/crossplane/crossplane-runtime/pkg/resource"
	uclaim "github.com/crossplane/crossplane-runtime/pkg/resource/unstructured/claim"
	uxres "github.com/crossplane/crossplane-runtime/pkg/resource/unstructured/composite" // what's the difference between `composed` and `composite` there?
	cpext "github.com/crossplane/crossplane/apis/apiextensions/v1"
	cpv1 "github.com/crossplane/crossplane/apis/pkg/v1"
	"github.com/jellydator/ttlcache/v3"
	"github.com/komodorio/komoplane/pkg/backend/crossplane"
	"github.com/komodorio/komoplane/pkg/backend/utils"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	v12 "k8s.io/api/core/v1"
	v1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/client/clientset/clientset/typed/apiextensions/v1"
	k8sErrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	_ "k8s.io/client-go/plugin/pkg/client/auth/oidc"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

type StatusInfo struct {
	CurVer              string
	LatestVer           string
	Analytics           bool
	CrossplaneInstalled bool
}

type Controller struct {
	StatusInfo StatusInfo
	APIv1      crossplane.APIv1
	ExtV1      crossplane.ExtensionsV1
	Events     crossplane.EventsInterface
	CRDs       crossplane.CRDInterface
	XRDs       crossplane.XRDInterface // Version-aware XRD client
	ctx        context.Context
	apiExt     *apiextensionsv1.ApiextensionsV1Client
	mrdCache   *ttlcache.Cache[bool, []*v1.CustomResourceDefinition] // TODO: extract this into separate entity
	mrCache    *ttlcache.Cache[bool, *unstructured.UnstructuredList]
}

type ConditionedObject interface {
	schema.ObjectKind
	resource.Object
	resource.Conditioned
}

type UnstructuredWithCompositionRef interface {
	runtime.Unstructured
	resource.CompositionReferencer
}

type ManagedUnstructured struct { // no dedicated type for it in base CP, just resource.Managed interface
	uxres.Unstructured
}

type CRDMap = map[string][]*v1.CustomResourceDefinition

func NewManagedUnstructured() *ManagedUnstructured {
	res := ManagedUnstructured{
		Unstructured: *uxres.New(),
	}

	res.Object["spec"] = map[string]interface{}{
		"providerConfigRef": map[string]interface{}{
			"name": "",
		},
	}

	return &res
}

func (m *ManagedUnstructured) GetProviderConfigReference() *xpv1.Reference {
	// TODO: find a way to organize code better
	// TODO: check field existence
	spec := m.Object["spec"].(map[string]interface{})

	if ref, found := spec["providerConfigRef"]; found {
		return &xpv1.Reference{
			Name: ref.(map[string]interface{})["name"].(string),
		}
	}

	log.Warnf("Did not find providerConfigRef in managed resource '%v'", m.GetName())
	return nil
}

func (m *ManagedUnstructured) SetProviderConfigReference(_ *xpv1.Reference) {
	panic("should not be called, report this to app maintainers")
}

func (c *Controller) GetStatus() StatusInfo {
	name := utils.Plural(cpv1.ProviderKind) + "." + cpv1.Group
	crd, err := c.apiExt.CustomResourceDefinitions().Get(c.ctx, name, metav1.GetOptions{})
	if err != nil {
		log.Warnf("Failed to get provider CRD, Crossplane is not installed: %s", err)
	}

	c.StatusInfo.CrossplaneInstalled = crd != nil && err == nil

	return c.StatusInfo
}

func (c *Controller) GetProviders(ec echo.Context) error {
	providers, err := c.APIv1.Providers().List(c.ctx)
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, providers, "  ")
}

func (c *Controller) GetProvider(ec echo.Context) error {
	res, err := c.APIv1.Providers().Get(c.ctx, ec.Param("name"))
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, res, "  ")
}

func (c *Controller) GetProviderEvents(ec echo.Context) error {
	gvk := schema.GroupVersionKind{
		Group:   cpv1.Group,
		Version: cpv1.Version,
		Kind:    cpv1.ProviderKind,
	}

	ref := v12.ObjectReference{
		Name: ec.Param("name"),
	}
	ref.SetGroupVersionKind(gvk)

	res, err := c.Events.List(c.ctx, &ref)
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, res, "  ")
}

func (c *Controller) GetProviderConfigs(ec echo.Context) error {
	res, err := c.GetProviderConfigsInner(ec, ec.Param("name"))
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, res, "  ")
}

func (c *Controller) GetProviderConfigsInner(ec echo.Context, provName string) (*unstructured.UnstructuredList, error) {
	allProvCRDs, err := c.LoadCRDs(ec)
	if err != nil {
		return nil, err
	}

	list := unstructured.UnstructuredList{Items: []unstructured.Unstructured{}}
	for k, provCRDs := range allProvCRDs {
		if provName != "" && k != provName {
			continue
		}

		for _, crd := range provCRDs {
			// we're relying here on the naming standard for CRDs in all providers, which is not guaranteed
			if crd.Spec.Names.Kind == cpk8s.ProviderConfigKind {
				gvk := schema.GroupVersionKind{
					Group:   crd.Spec.Group,
					Version: crd.Spec.Versions[0].Name,
					Kind:    crd.Spec.Names.Plural, // Use plural for resource listing
				}
				res, err := c.CRDs.List(c.ctx, gvk)
				if err != nil {
					return nil, err
				}
				list.Items = append(list.Items, res.Items...)
			}
		}
	}

	return &list, nil
}

func (c *Controller) LoadCRDs(ec echo.Context) (CRDMap, error) {
	// FIXME: a misplaced method! Should be in some data layer class
	// FIXME: quite expensive method to call
	if ec.Get("LoadCRDs") != nil {
		log.Warnf("Heavy call made twice")
	}
	ec.Set("LoadCRDs", true)

	// Create the API Extensions clientset
	providers, err := c.APIv1.Providers().List(c.ctx)
	if err != nil {
		return nil, err
	}

	crdList, err := c.apiExt.CustomResourceDefinitions().List(c.ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	provCRDs := CRDMap{}

	for _, crd := range crdList.Items {
		crdCopy := crd // otherwise, variable gets reused (https://garbagecollected.org/2017/02/22/go-range-loop-internals/)
		found := false

		// First, try to match by owner references (existing logic)
	refLoop:
		for _, ref := range crd.OwnerReferences {
			if ref.Kind == cpv1.ProviderKind && ref.APIVersion == cpv1.Group+"/"+cpv1.Version {
				for _, prov := range providers.Items {
					if prov.Name == ref.Name {
						if _, ok := provCRDs[prov.Name]; !ok {
							provCRDs[prov.Name] = []*v1.CustomResourceDefinition{}
						}

						provCRDs[prov.Name] = append(provCRDs[prov.Name], &crdCopy)
						found = true
						break refLoop
					}
				}
			}
		}

		// If not found by owner reference, try to match by provider naming patterns
		if !found && IsManagedResourceCRD(&crdCopy) {
			providerName := ExtractProviderNameFromCRD(&crdCopy)
			if providerName != "" {
				// Check if this provider exists in our providers list
				for _, prov := range providers.Items {
					if prov.Name == providerName || MatchesProviderPattern(prov.Name, providerName) {
						if _, ok := provCRDs[prov.Name]; !ok {
							provCRDs[prov.Name] = []*v1.CustomResourceDefinition{}
						}
						provCRDs[prov.Name] = append(provCRDs[prov.Name], &crdCopy)
						found = true
						break
					}
				}

				// If still no provider match, create a synthetic provider entry
				if !found {
					syntheticProviderName := "provider-" + providerName
					log.Debugf("Adding CRD %s to synthetic provider %s", crd.Name, syntheticProviderName)
					if _, ok := provCRDs[syntheticProviderName]; !ok {
						provCRDs[syntheticProviderName] = []*v1.CustomResourceDefinition{}
					}
					provCRDs[syntheticProviderName] = append(provCRDs[syntheticProviderName], &crdCopy)
				}
			}
		}
	}
	return provCRDs, nil
}

// IsManagedResourceCRD checks if a CRD represents a managed resource by looking for common patterns
func IsManagedResourceCRD(crd *v1.CustomResourceDefinition) bool {
	// Check if CRD has crossplane managed resource annotations or labels
	for key := range crd.Annotations {
		if strings.Contains(key, "crossplane.io") {
			return true
		}
	}
	for key := range crd.Labels {
		if strings.Contains(key, "crossplane.io") {
			return true
		}
	}

	// Check if the CRD group suggests it's a cloud provider resource
	group := crd.Spec.Group
	managedResourcePatterns := []string{
		".aws.upbound.io",
		".gcp.upbound.io",
		".azure.upbound.io",
		".aws.crossplane.io",
		".gcp.crossplane.io",
		".azure.crossplane.io",
		".aws.platformref.upbound.io",
		".gcp.platformref.upbound.io",
		".azure.platformref.upbound.io",
		".upbound.io", // General upbound pattern
	}

	for _, pattern := range managedResourcePatterns {
		if strings.Contains(group, pattern) {
			return true
		}
	}

	return false
}

// ExtractProviderNameFromCRD extracts a provider name from the CRD group
func ExtractProviderNameFromCRD(crd *v1.CustomResourceDefinition) string {
	group := crd.Spec.Group

	// Pattern matching for common provider group formats
	patterns := map[string]string{
		".aws.upbound.io":               "upbound-provider-aws",
		".gcp.upbound.io":               "upbound-provider-gcp",
		".azure.upbound.io":             "upbound-provider-azure",
		".aws.crossplane.io":            "provider-aws",
		".gcp.crossplane.io":            "provider-gcp",
		".azure.crossplane.io":          "provider-azure",
		".aws.platformref.upbound.io":   "upbound-provider-aws",
		".gcp.platformref.upbound.io":   "upbound-provider-gcp",
		".azure.platformref.upbound.io": "upbound-provider-azure",
	}

	for pattern, providerName := range patterns {
		if strings.Contains(group, pattern) {
			return providerName
		}
	}

	// For generic upbound pattern, extract service name
	if strings.Contains(group, ".upbound.io") {
		parts := strings.Split(group, ".")
		if len(parts) >= 3 {
			service := parts[len(parts)-3] // Get the service part (e.g., "aws" from "s3.aws.upbound.io")
			return "upbound-provider-" + service
		}
	}

	return ""
}

// MatchesProviderPattern checks if a provider name matches expected patterns
func MatchesProviderPattern(providerName, extractedName string) bool {
	// Normalize names for comparison
	normalizedProvider := strings.ToLower(strings.ReplaceAll(providerName, "-", ""))
	normalizedExtracted := strings.ToLower(strings.ReplaceAll(extractedName, "-", ""))

	// Check for exact match first
	if normalizedProvider == normalizedExtracted {
		return true
	}

	// Check if they contain common cloud provider keywords
	cloudProviders := []string{"aws", "gcp", "azure", "alibaba", "digitalocean"}

	providerCloud := ""
	extractedCloud := ""

	// Find cloud provider in each name
	for _, cloud := range cloudProviders {
		if strings.Contains(normalizedProvider, cloud) {
			providerCloud = cloud
		}
		if strings.Contains(normalizedExtracted, cloud) {
			extractedCloud = cloud
		}
	}

	// If both have the same cloud provider, consider it a match
	return providerCloud != "" && providerCloud == extractedCloud
}

func (c *Controller) GetClaims(ec echo.Context) error {
	list := unstructured.UnstructuredList{
		Object: nil,
		Items:  []unstructured.Unstructured{},
	}

	err := c.fillXRDList(ec, &list, func(spec cpext.CompositeResourceDefinitionSpec) *string {
		if spec.ClaimNames == nil { // the XRD allows it to be omitted
			return nil
		}
		return &spec.ClaimNames.Plural
	})
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, list, "  ")
}

func (c *Controller) GetClaim(ec echo.Context) error {
	gvk := schema.GroupVersionKind{
		Group:   ec.Param("group"),
		Version: ec.Param("version"),
		Kind:    ec.Param("kind"),
	}

	claimRef := v12.ObjectReference{Namespace: ec.Param("namespace"), Name: ec.Param("name")}
	claimRef.SetGroupVersionKind(gvk)

	claim := uclaim.New()
	err := c.getDynamicResource(&claimRef, claim)
	if err != nil {
		return err
	}

	if ec.QueryParam("full") != "" {
		xrRef := claim.GetResourceReference()
		xr := uxres.New()
		if xrRef != nil {
			// Extract information from the raw object since reference types don't have all fields
			objRef := &v12.ObjectReference{
				Name: xrRef.Name,
			}

			// Try to extract GVK from the resource reference in the unstructured object
			if resourceRefRaw, found := claim.Object["spec"].(map[string]interface{})["resourceRef"].(map[string]interface{}); found {
				if apiVersion, ok := resourceRefRaw["apiVersion"].(string); ok {
					objRef.APIVersion = apiVersion
				}
				if kind, ok := resourceRefRaw["kind"].(string); ok {
					objRef.Kind = kind
				}
			}

			_ = c.getDynamicResource(objRef, xr)
			claim.Object["compositeResource"] = xr
		}

		err := c.fillManagedResources(ec, xr)
		if err != nil {
			return err
		}

		c.fillCompositionByRef(claim)
	}
	return ec.JSONPretty(http.StatusOK, claim.Object, "  ")
}

func (c *Controller) fillCompositionByRef(obj UnstructuredWithCompositionRef) {
	compRef := obj.GetCompositionReference()

	// If the standard method doesn't work, try to extract manually
	if compRef == nil {
		log.Debugf("GetCompositionReference returned nil, trying manual extraction")

		// Try to extract composition reference manually from the unstructured object
		compositionRefName, found, err := unstructured.NestedString(obj.UnstructuredContent(), "spec", "crossplane", "compositionRef", "name")
		if err != nil {
			log.Debugf("Error extracting composition reference: %v", err)
			return
		}
		if !found || compositionRefName == "" {
			log.Debugf("No composition reference found in spec.crossplane.compositionRef.name")
			return
		}

		log.Debugf("Found composition reference: %s", compositionRefName)
		compRef = &v12.ObjectReference{
			Name:       compositionRefName,
			APIVersion: cpext.CompositionGroupVersionKind.GroupVersion().String(),
			Kind:       cpext.CompositionGroupVersionKind.Kind,
		}
	}

	if compRef != nil {
		compRef.SetGroupVersionKind(cpext.CompositionGroupVersionKind)
		comp := uxres.New()
		err := c.getDynamicResource(compRef, comp)
		if err != nil {
			log.Debugf("Failed to get composition %s: %v", compRef.Name, err)
		} else {
			log.Debugf("Successfully fetched composition: %s", compRef.Name)
			obj.UnstructuredContent()["composition"] = comp
		}
	}
}

func (c *Controller) getDynamicResource(ref *v12.ObjectReference, res ConditionedObject) (err error) {
	res.SetAnnotations(map[string]string{})

	if ref.Name == "" {
		condNotFound := xpv1.Condition{
			Type:               "Found",
			Status:             "False",
			LastTransitionTime: metav1.Now(),
			Reason:             "NameIsEmpty",
			Message:            "Probably, the resource were never created, and external name were not reported back",
		}
		res.SetConditions(condNotFound)
	} else {
		err = c.CRDs.Get(c.ctx, res, ref)
		if err != nil {
			condErrored := xpv1.Condition{
				Type:               "Found",
				Status:             "False",
				LastTransitionTime: metav1.Now(),
				Reason:             "FailedToGet",
				Message:            err.Error(),
			}
			res.SetConditions(condErrored)
		}
	}

	// API does not return it, so we fill it ourselves
	res.SetGroupVersionKind(ref.GroupVersionKind())
	res.SetNamespace(ref.Namespace)
	res.SetName(ref.Name)

	return err
}

func (c *Controller) GetManageds(ec echo.Context) error {
	res := &unstructured.UnstructuredList{Items: []unstructured.Unstructured{}}
	cacheItem := c.mrCache.Get(true)
	if cacheItem == nil {
		log.Debugf("Missed cache for MRs, reloading...")
		MRDs, err := c.getCachedMRDs(ec)
		if err != nil {
			return err
		}

		for _, mrd := range MRDs {
			gvk := schema.GroupVersionKind{
				Group:   mrd.Spec.Group,
				Version: mrd.Spec.Versions[0].Name,
				Kind:    mrd.Spec.Names.Plural, // Use plural for listing
			}
			items, err := c.CRDs.List(c.ctx, gvk)
			if err != nil {
				log.Warnf("Failed to list CRD: %v: %v", mrd.GroupVersionKind(), err)
				continue
			}

			// Fix the Kind field in each item to use singular form for consistency with detail API
			for i := range items.Items {
				items.Items[i].Object["kind"] = mrd.Spec.Names.Kind
			}

			res.Items = append(res.Items, items.Items...)
		}
		c.mrCache.Set(true, res, ttlcache.DefaultTTL)
	} else {
		log.Debugf("Cache hit for MRs")
		res = cacheItem.Value()
	}

	return ec.JSONPretty(http.StatusOK, res, "  ")
}

func (c *Controller) getCachedMRDs(ec echo.Context) ([]*v1.CustomResourceDefinition, error) {
	var MRDs []*v1.CustomResourceDefinition
	cacheItem := c.mrdCache.Get(true)
	if cacheItem == nil {
		// the assumption here is that the new kinds of MRs are rarely introduced
		log.Debugf("Missed cache for MRDs, reloading...")
		provCRDs, err := c.LoadCRDs(ec)
		if err != nil {
			return nil, err
		}

		MRDs = c.allMRDs(provCRDs)
		c.mrdCache.Set(true, MRDs, ttlcache.DefaultTTL)
	} else {
		log.Debugf("Cache hit for MRDs")
		MRDs = cacheItem.Value()
	}
	return MRDs, nil
}

func (c *Controller) allMRDs(provCRDs CRDMap) []*v1.CustomResourceDefinition {
	res := []*v1.CustomResourceDefinition{}
	for _, crds := range provCRDs {
		for _, mrd := range crds {
			if mrd.Spec.Names.Kind == cpk8s.ProviderConfigKind || mrd.Spec.Names.Kind == cpk8s.ProviderConfigUsageKind {
				log.Debugf("Skipping %s/%s from listing of all MRs", mrd.Spec.Group, mrd.Spec.Names.Kind)
				continue
			}

			res = append(res, mrd)
		}
	}

	return res
}

func (c *Controller) GetManaged(ec echo.Context) error {
	gvk := schema.GroupVersionKind{
		Group:   ec.Param("group"),
		Version: ec.Param("version"),
		Kind:    ec.Param("kind"),
	}
	ref := v12.ObjectReference{
		Name:      ec.Param("name"),
		Namespace: "", // Start with cluster-scoped assumption
	}
	ref.SetGroupVersionKind(gvk)

	log.Debugf("GetManaged called with GVK: %s/%s/%s, Name: %s", gvk.Group, gvk.Version, gvk.Kind, ref.Name)

	xr := NewManagedUnstructured()
	err := c.getDynamicResource(&ref, xr)

	// If cluster-scoped lookup fails, try to find it in any namespace
	if err != nil {
		log.Debugf("Cluster-scoped lookup failed: %v, trying namespaced lookup", err)

		// Try to find the resource in all namespaces
		namespaces := []string{"vela-app-dev", "default", "crossplane-system", "upbound-system"}
		for _, ns := range namespaces {
			ref.Namespace = ns
			log.Debugf("Trying namespace: %s", ns)

			err = c.getDynamicResource(&ref, xr)
			if err == nil {
				log.Debugf("Found managed resource in namespace: %s", ns)
				break
			}
		}
	}

	if err != nil {
		log.Errorf("Failed to get managed resource %s/%s/%s/%s: %v", gvk.Group, gvk.Version, gvk.Kind, ref.Name, err)
		return err
	}

	if ec.QueryParam("full") != "" {
		log.Debugf("Fetching full details for managed resource %s", ref.Name)

		// provider config
		provConfigRef := xr.GetProviderConfigReference()
		log.Debugf("Provider config reference: %v", provConfigRef)

		if provConfigRef != nil {
			pcs, err := c.GetProviderConfigsInner(ec, "")
			if err != nil {
				log.Errorf("Failed to get provider configs: %v", err)
				return err
			}

			ref := v12.ObjectReference{Name: provConfigRef.Name}
			for _, item := range pcs.Items {
				if item.GetName() == provConfigRef.Name {
					ref.SetGroupVersionKind(item.GroupVersionKind())
					ref.Name = item.GetName()
					break
				}
			}

			pc := uxres.New()
			err = c.getDynamicResource(&ref, pc)
			if err != nil {
				log.Warnf("Failed to get provider config %s: %v", provConfigRef.Name, err)
				// Don't fail the whole request, just set empty provider config
				xr.Object["provConfig"] = map[string]interface{}{}
			} else {
				xr.Object["provConfig"] = pc
			}
		}

		// composite resource
		oRefs := xr.GetOwnerReferences()
		log.Debugf("Owner references: %v", oRefs)

		for _, oRef := range oRefs {
			comp := uxres.New()
			ref := v12.ObjectReference{
				Kind:       oRef.Kind,
				Name:       oRef.Name,
				APIVersion: oRef.APIVersion,
			}
			log.Debugf("Fetching composite resource: %s/%s/%s", oRef.APIVersion, oRef.Kind, oRef.Name)

			err = c.getDynamicResource(&ref, comp)
			if err != nil {
				log.Warnf("Failed to get composite resource %s/%s/%s: %v", oRef.APIVersion, oRef.Kind, oRef.Name, err)
				// Don't fail the whole request, just set empty composite
				xr.Object["composite"] = map[string]interface{}{}
			} else {
				xr.Object["composite"] = comp
			}
		}
	}

	return ec.JSONPretty(http.StatusOK, xr.Object, "  ")
}

func (c *Controller) GetManagedNamespaced(ec echo.Context) error {
	gvk := schema.GroupVersionKind{
		Group:   ec.Param("group"),
		Version: ec.Param("version"),
		Kind:    ec.Param("kind"),
	}
	ref := v12.ObjectReference{
		Name:      ec.Param("name"),
		Namespace: ec.Param("namespace"),
	}
	ref.SetGroupVersionKind(gvk)

	log.Debugf("GetManagedNamespaced called with GVK: %s/%s/%s, Namespace: %s, Name: %s", gvk.Group, gvk.Version, gvk.Kind, ref.Namespace, ref.Name)

	xr := NewManagedUnstructured()
	err := c.getDynamicResource(&ref, xr)
	if err != nil {
		log.Errorf("Failed to get namespaced managed resource %s/%s/%s/%s/%s: %v", gvk.Group, gvk.Version, gvk.Kind, ref.Namespace, ref.Name, err)
		return err
	}

	if ec.QueryParam("full") != "" {
		log.Debugf("Fetching full details for namespaced managed resource %s/%s", ref.Namespace, ref.Name)

		// provider config
		provConfigRef := xr.GetProviderConfigReference()
		log.Debugf("Provider config reference: %v", provConfigRef)

		if provConfigRef != nil {
			pcs, err := c.GetProviderConfigsInner(ec, "")
			if err != nil {
				log.Errorf("Failed to get provider configs: %v", err)
				return err
			}

			ref := v12.ObjectReference{Name: provConfigRef.Name}
			for _, item := range pcs.Items {
				if item.GetName() == provConfigRef.Name {
					ref.SetGroupVersionKind(item.GroupVersionKind())
					ref.Name = item.GetName()
					break
				}
			}

			pc := uxres.New()
			err = c.getDynamicResource(&ref, pc)
			if err != nil {
				log.Warnf("Failed to get provider config %s: %v", provConfigRef.Name, err)
				xr.Object["provConfig"] = map[string]interface{}{}
			} else {
				xr.Object["provConfig"] = pc
			}
		}

		// composite resource
		oRefs := xr.GetOwnerReferences()
		log.Debugf("Owner references: %v", oRefs)

		for _, oRef := range oRefs {
			comp := uxres.New()
			ref := v12.ObjectReference{
				Kind:       oRef.Kind,
				Name:       oRef.Name,
				APIVersion: oRef.APIVersion,
			}
			log.Debugf("Fetching composite resource: %s/%s/%s", oRef.APIVersion, oRef.Kind, oRef.Name)

			err = c.getDynamicResource(&ref, comp)
			if err != nil {
				log.Warnf("Failed to get composite resource %s/%s/%s: %v", oRef.APIVersion, oRef.Kind, oRef.Name, err)
				xr.Object["composite"] = map[string]interface{}{}
			} else {
				xr.Object["composite"] = comp
			}
		}
	}

	return ec.JSONPretty(http.StatusOK, xr.Object, "  ")
}

func (c *Controller) GetComposites(ec echo.Context) error {
	list := unstructured.UnstructuredList{
		Object: nil,
		Items:  []unstructured.Unstructured{},
	}

	err := c.fillXRDList(ec, &list, func(spec cpext.CompositeResourceDefinitionSpec) *string {
		log.Debugf("GetComposites: XRD plural name: %s", spec.Names.Plural)
		return &spec.Names.Plural
	})
	if err != nil {
		return err
	}

	// Add composition references to each composite resource in the list
	for i := range list.Items {
		xr := uxres.New()
		xr.Object = list.Items[i].Object
		c.fillCompositionByRef(xr)
		list.Items[i] = xr.Unstructured
	}

	return ec.JSONPretty(http.StatusOK, list, "  ")
}

func (c *Controller) GetCompositions(ec echo.Context) error {
	items, err := c.ExtV1.Compositions().List(c.ctx)
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, items, "  ")
}

func (c *Controller) GetComposition(ec echo.Context) error {
	name := ec.Param("name")
	if name == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "composition name is required")
	}

	composition, err := c.ExtV1.Compositions().Get(c.ctx, name)
	if err != nil {
		if k8sErrors.IsNotFound(err) {
			return echo.NewHTTPError(http.StatusNotFound, "composition not found")
		}
		return err
	}

	return ec.JSONPretty(http.StatusOK, composition, "  ")
}

func (c *Controller) GetXRDs(ec echo.Context) error {
	items, err := c.cachedListXRDs(ec)
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, items, "  ")
}

func (c *Controller) GetEvents(ec echo.Context) error {
	gvk := schema.GroupVersionKind{
		Kind: ec.QueryParam("kind"),
	}

	ref := v12.ObjectReference{
		Name:      ec.Param("name"),
		Namespace: ec.Param("namespace"),
	}
	ref.SetGroupVersionKind(gvk)

	res, err := c.Events.List(c.ctx, &ref)
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, res, "  ")
}

func (c *Controller) GetComposite(ec echo.Context) error {
	gvk := schema.GroupVersionKind{
		Group:   ec.Param("group"),
		Version: ec.Param("version"),
		Kind:    ec.Param("kind"),
	}
	ref := v12.ObjectReference{Name: ec.Param("name")}
	ref.SetGroupVersionKind(gvk)

	xr := uxres.New()
	err := c.getDynamicResource(&ref, xr)

	// If the resource is not found, try to find it in common namespaces
	// Most composite resources are namespaced in practice
	if err != nil {
		log.Debugf("Resource not found without namespace, trying common namespaces for %s", ref.Name)
		namespacesToTry := []string{"vela-app-dev", "default", "crossplane-system", "upbound-system", "kube-system", "vela-system", "flux-system", "argocd", "argo-cd"}
		
		originalError := err
		for _, ns := range namespacesToTry {
			ref.Namespace = ns
			log.Debugf("Retrying composite resource lookup with namespace: %s", ref.Namespace)
			err = c.getDynamicResource(&ref, xr)
			if err == nil {
				log.Debugf("Found composite resource in namespace: %s", ref.Namespace)
				break
			}
		}
		
		// If still not found in any namespace, restore original state and return the error
		if err != nil {
			ref.Namespace = ""
			log.Debugf("Resource not found in any common namespace, returning original error")
			return originalError
		}
	}

	if ec.QueryParam("full") != "" {
		// claim for it, if any
		claimRef := xr.GetClaimReference()
		if claimRef != nil {
			// Extract information from the raw object since reference types don't have all fields
			objRef := &v12.ObjectReference{
				Name: claimRef.Name,
			}

			// Try to extract namespace and GVK from the claim reference in the unstructured object
			if claimRefRaw, found := xr.Object["spec"].(map[string]interface{})["claimRef"].(map[string]interface{}); found {
				if ns, ok := claimRefRaw["namespace"].(string); ok {
					objRef.Namespace = ns
				}
				if apiVersion, ok := claimRefRaw["apiVersion"].(string); ok {
					objRef.APIVersion = apiVersion
				}
				if kind, ok := claimRefRaw["kind"].(string); ok {
					objRef.Kind = kind
				}
			}

			claim := uxres.New()
			_ = c.getDynamicResource(objRef, claim)
			xr.Object["claim"] = claim
		}

		xrds, err := c.cachedListXRDs(ec)
		if err != nil {
			return err
		}
		// for XR pointing to XR, parent XR
		for _, ref := range xr.GetOwnerReferences() {
			objRef := v12.ObjectReference{
				APIVersion: ref.APIVersion,
				Kind:       ref.Kind,
				Name:       ref.Name,
			}
			nameMatch, cNameMatch := c.matchXR(xrds, &objRef)

			if nameMatch || cNameMatch {
				parent := uxres.New()
				_ = c.getDynamicResource(&objRef, parent)
				xr.Object["parentXR"] = parent
			}
		}

		c.fillCompositionByRef(xr)

		// MR refs
		err = c.fillManagedResources(ec, xr)
		if err != nil {
			return err
		}
	}

	return ec.JSONPretty(http.StatusOK, xr, "  ")
}

func (c *Controller) fillManagedResources(ec echo.Context, xr *uxres.Unstructured) error {
	xrds, err := c.cachedListXRDs(ec)
	if err != nil {
		return err
	}

	XRs := []v12.ObjectReference{}
	claims := []v12.ObjectReference{}
	MRs := []*ManagedUnstructured{}
	for _, mrRef := range xr.GetResourceReferences() {
		mr := NewManagedUnstructured()
		err := c.getDynamicResource(&mrRef, mr)
		if err != nil {
			log.Debugf("Did not find dynamic resource %v", mrRef)
		}

		if mr.GetName() != "" { // skip those not found
			nameMatched, claimNameMatched := c.matchXR(xrds, &mrRef)
			if nameMatched {
				XRs = append(XRs, mrRef)
			} else if claimNameMatched {
				claims = append(claims, mrRef)
			}
		}

		MRs = append(MRs, mr)
	}
	xr.Object["managedResources"] = MRs
	xr.Object["managedResourcesXRs"] = XRs
	xr.Object["managedResourcesClaims"] = claims
	return nil
}

func (c *Controller) GetCompositeNamespaced(ec echo.Context) error {
	gvk := schema.GroupVersionKind{
		Group:   ec.Param("group"),
		Version: ec.Param("version"),
		Kind:    ec.Param("kind"),
	}
	ref := v12.ObjectReference{
		Name:      ec.Param("name"),
		Namespace: ec.Param("namespace"),
	}
	ref.SetGroupVersionKind(gvk)

	log.Debugf("GetCompositeNamespaced: Looking for resource %s/%s with GVK %s", ref.Namespace, ref.Name, gvk)

	xr := uxres.New()
	err := c.getDynamicResource(&ref, xr)
	if err != nil {
		return err
	}

	c.fillCompositionByRef(xr)
	return ec.JSONPretty(http.StatusOK, xr, "  ")
}

type FieldGetter = func(spec cpext.CompositeResourceDefinitionSpec) *string // pointer str to signal skip

func (c *Controller) fillXRDList(ec echo.Context, list *unstructured.UnstructuredList, getKind FieldGetter) error {
	xrds, err := c.cachedListXRDs(ec)
	if err != nil {
		return err
	}

	for _, xrd := range xrds.Items {
		kind := getKind(xrd.Spec)
		if kind == nil { // signal to skip it, has no corresponding kind name
			continue
		}
		log.Debugf("fillXRDList: Processing XRD %s with kind value: %s", xrd.Name, *kind)

		// Find the best version to use - prefer storage version, then served versions
		versionName := c.selectBestVersion(xrd.Spec.Versions)
		if versionName == "" {
			log.Warnf("No suitable version found for XRD %s, skipping", xrd.Name)
			continue
		}

		gvk := schema.GroupVersionKind{
			Group:   xrd.Spec.Group,
			Version: versionName,
			Kind:    *kind, // This should be the resource name (plural) for the CRDs.List call
		}
		log.Debugf("Listing composite resources with GVK: %v (XRD: %s)", gvk, xrd.Name)
		
		// Try to list resources, but don't fail the entire operation if one XRD fails
		res, err := c.CRDs.List(c.ctx, gvk)
		if err != nil {
			log.Warnf("Failed to list composite resources for XRD %s with GVK %v: %v", xrd.Name, gvk, err)
			// Continue processing other XRDs instead of failing
			continue
		}

		log.Debugf("Successfully listed %d composite resources for XRD %s", len(res.Items), xrd.Name)
		list.Items = append(list.Items, res.Items...)
	}
	return nil
}

type Ref struct {
	Namespace  string
	Name       string
	Kind       string
	APIVersion string
}

func (c *Controller) matchXR(xrds *cpext.CompositeResourceDefinitionList, mrRef *v12.ObjectReference) (nameMatch bool, claimNameMatch bool) {
	for _, xrd := range xrds.Items {
		// TODO: is it right to match to latest version and not iterate over versions?
		if xrd.Spec.Group+"/"+xrd.Spec.Versions[0].Name == mrRef.APIVersion {
			if xrd.Spec.Names.Kind == mrRef.Kind {
				return true, false
			}

			if xrd.Spec.ClaimNames != nil && xrd.Spec.ClaimNames.Kind == mrRef.Kind {
				return false, true
			}
		}
	}
	return false, false
}

func (c *Controller) cachedListXRDs(ec echo.Context) (items *cpext.CompositeResourceDefinitionList, err error) {
	cacheKey := "XRDs"
	cached := ec.Get(cacheKey) // this would save couple of calls
	if cached == nil {
		// Use version-aware XRD client for backwards compatibility
		items, err = c.XRDs.List(c.ctx)
		if err != nil {
			return nil, err
		}
		ec.Set(cacheKey, items)
	} else {
		items = cached.(*cpext.CompositeResourceDefinitionList)
	}

	return items, nil
}

// selectBestVersion chooses the most appropriate version from XRD versions
// Prefers: newest served version > any served version
func (c *Controller) selectBestVersion(versions []cpext.CompositeResourceDefinitionVersion) string {
	var newestServed, anyServed string
	
	for _, v := range versions {
		if !v.Served {
			continue
		}
		
		anyServed = v.Name
		
		// Consider this the "newest" if we don't have one yet or this has a higher version
		if newestServed == "" || c.compareVersions(v.Name, newestServed) > 0 {
			newestServed = v.Name
		}
	}
	
	// Return in order of preference
	if newestServed != "" {
		log.Debugf("Selected newest served version: %s", newestServed)
		return newestServed
	}
	if anyServed != "" {
		log.Debugf("Selected any served version: %s", anyServed)
		return anyServed
	}
	
	return ""
}

// compareVersions compares two version strings, returns > 0 if v1 > v2
func (c *Controller) compareVersions(v1, v2 string) int {
	// Simple version comparison - can be enhanced with proper semver if needed
	// For now, just do string comparison which works for most Kubernetes versions
	if v1 > v2 {
		return 1
	}
	if v1 < v2 {
		return -1
	}
	return 0
}

func NewController(ctx context.Context, cfg *rest.Config, ns string, version string) (*Controller, error) {
	_ = ns // TODO what's the use for namespace scope?

	apiV1, err := crossplane.NewAPIv1Client(cfg)
	if err != nil {
		return nil, err
	}

	ext, err := crossplane.NewEXTv1Client(cfg)
	if err != nil {
		return nil, err
	}

	evt, err := crossplane.NewEventsClient(cfg)
	if err != nil {
		return nil, err
	}

	apiExt, err := apiextensionsv1.NewForConfig(cfg)
	if err != nil {
		return nil, err
	}

	// Create version-aware XRD client for backwards compatibility
	versionAwareXRDs, err := crossplane.NewVersionAwareXRDWrapper(cfg, ext.XRDs())
	if err != nil {
		return nil, err
	}

	mrdCacheTTL := durationFromEnv("KP_MRD_CACHE_TTL", 5*time.Minute)
	mrCacheTTL := durationFromEnv("KP_MR_CACHE_TTL", 1*time.Minute)

	controller := Controller{
		ctx:    ctx,
		APIv1:  apiV1,
		ExtV1:  ext,
		Events: evt,
		apiExt: apiExt,
		CRDs:   crossplane.NewVersionAwareCRDsClient(cfg, ext, versionAwareXRDs),
		XRDs:   versionAwareXRDs,
		StatusInfo: StatusInfo{
			CurVer: version,
		},

		mrdCache: ttlcache.New(
			ttlcache.WithTTL[bool, []*v1.CustomResourceDefinition](mrdCacheTTL),
			ttlcache.WithDisableTouchOnHit[bool, []*v1.CustomResourceDefinition](),
		),
		mrCache: ttlcache.New(
			ttlcache.WithTTL[bool, *unstructured.UnstructuredList](mrCacheTTL),
			ttlcache.WithDisableTouchOnHit[bool, *unstructured.UnstructuredList](),
		),
	}

	go controller.mrdCache.Start() // starts automatic expired item deletion
	go controller.mrCache.Start()  // starts automatic expired item deletion

	return &controller, nil
}

func durationFromEnv(key string, durDefault time.Duration) time.Duration {
	envVar := os.Getenv(key)
	dur, err := time.ParseDuration(envVar)
	if err != nil {
		log.Warnf("Failed to parse %s: %v", key, err)
		return durDefault
	}
	return dur
}

func getK8sConfig() (*rest.Config, error) {
	config, err := rest.InClusterConfig()
	if err == nil {
		log.Infof("Using in-cluster Kubernetes connection")
		return config, nil
	}

	log.Debugf("Failed to connect in-cluster: %v", err)

	//kubeconfig := os.Getenv("KUBECONFIG")
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	configOverrides := &clientcmd.ConfigOverrides{
		CurrentContext: os.Getenv("KUBECONTEXT"),
	}
	kubeConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides)

	return kubeConfig.ClientConfig()
}
