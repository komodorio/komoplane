package backend

import (
	"context"
	"net/http"
	"os"
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
					Kind:    crd.Spec.Names.Plural,
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
	refLoop:
		for _, ref := range crd.OwnerReferences {
			if ref.Kind == cpv1.ProviderKind && ref.APIVersion == cpv1.Group+"/"+cpv1.Version {
				for _, prov := range providers.Items {
					if prov.Name == ref.Name {
						if _, ok := provCRDs[prov.Name]; !ok {
							provCRDs[prov.Name] = []*v1.CustomResourceDefinition{}
						}

						provCRDs[prov.Name] = append(provCRDs[prov.Name], &crdCopy)
						break refLoop
					}
				}
			}
		}
	}
	return provCRDs, nil
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
		_ = c.getDynamicResource(xrRef, xr)
		claim.Object["compositeResource"] = xr

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
	if compRef != nil {
		compRef.SetGroupVersionKind(cpext.CompositionGroupVersionKind)
		comp := uxres.New()
		_ = c.getDynamicResource(compRef, comp)
		obj.UnstructuredContent()["composition"] = comp
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
				Kind:    mrd.Spec.Names.Plural,
			}
			items, err := c.CRDs.List(c.ctx, gvk)
			if err != nil {
				log.Warnf("Failed to list CRD: %v: %v", mrd.GroupVersionKind(), err)
				continue
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
	ref := v12.ObjectReference{Name: ec.Param("name")}
	ref.SetGroupVersionKind(gvk)

	xr := NewManagedUnstructured()
	err := c.getDynamicResource(&ref, xr)
	if err != nil {
		return err
	}

	if ec.QueryParam("full") != "" {
		// provider config
		provConfigRef := xr.GetProviderConfigReference()

		if provConfigRef != nil {
			pcs, err := c.GetProviderConfigsInner(ec, "")
			if err != nil {
				return err
			}

			ref := v12.ObjectReference{Name: provConfigRef.Name}
			for _, item := range pcs.Items {
				if item.GetName() == provConfigRef.Name {
					ref.SetGroupVersionKind(item.GroupVersionKind())
					ref.Name = item.GetName()
				}
			}

			pc := uxres.New()
			_ = c.getDynamicResource(&ref, pc)
			xr.Object["provConfig"] = pc
		}

		// composite resource
		oRefs := xr.GetOwnerReferences()
		for _, oRef := range oRefs {
			comp := uxres.New()
			ref := v12.ObjectReference{
				Kind:       oRef.Kind,
				Name:       oRef.Name,
				APIVersion: oRef.APIVersion,
			}
			_ = c.getDynamicResource(&ref, comp)
			xr.Object["composite"] = comp
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
		return &spec.Names.Plural
	})
	if err != nil {
		return err
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
	if err != nil {
		return err
	}

	if ec.QueryParam("full") != "" {
		// claim for it, if any
		claimRef := xr.GetClaimReference()
		if claimRef != nil {
			claim := uxres.New()
			_ = c.getDynamicResource(claimRef, claim)
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

		gvk := schema.GroupVersionKind{ // TODO: xrd.Status.Controllers.CompositeResourceClaimTypeRef is more logical here
			Group:   xrd.Spec.Group,
			Version: xrd.Spec.Versions[0].Name,
			Kind:    *kind,
		}
		res, err := c.CRDs.List(c.ctx, gvk)
		if err != nil {
			return err
		}

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
		items, err = c.ExtV1.XRDs().List(c.ctx)
		if err != nil {
			return nil, err
		}
		ec.Set(cacheKey, items)
	} else {
		items = cached.(*cpext.CompositeResourceDefinitionList)
	}

	return items, nil
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

	mrdCacheTTL := durationFromEnv("KP_MRD_CACHE_TTL", 5*time.Minute)
	mrCacheTTL := durationFromEnv("KP_MR_CACHE_TTL", 1*time.Minute)

	controller := Controller{
		ctx:    ctx,
		APIv1:  apiV1,
		ExtV1:  ext,
		Events: evt,
		apiExt: apiExt,
		CRDs:   crossplane.NewCRDsClient(cfg, ext),
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
