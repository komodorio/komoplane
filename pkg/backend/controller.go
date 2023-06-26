package backend

import (
	"context"
	cpk8s "github.com/crossplane-contrib/provider-kubernetes/apis/v1alpha1"
	xpv1 "github.com/crossplane/crossplane-runtime/apis/common/v1"
	"github.com/crossplane/crossplane-runtime/pkg/resource"
	uclaim "github.com/crossplane/crossplane-runtime/pkg/resource/unstructured/claim"
	uxres "github.com/crossplane/crossplane-runtime/pkg/resource/unstructured/composite" // what's the difference between `composed` and `composite` there?
	v13 "github.com/crossplane/crossplane/apis/apiextensions/v1"
	cpv1 "github.com/crossplane/crossplane/apis/pkg/v1"
	"github.com/komodorio/komoplane/pkg/backend/crossplane"
	"github.com/komodorio/komoplane/pkg/backend/utils"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	v12 "k8s.io/api/core/v1"
	v1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/client/clientset/clientset/typed/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"net/http"
	"os"
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
}

type ConditionedObject interface {
	schema.ObjectKind
	resource.Object
	resource.Conditioned
}

type ManagedUnstructured struct { // no dedicated type for it in base CP
	uxres.Unstructured
}

func (m *ManagedUnstructured) GetProviderConfigReference() *xpv1.Reference {
	// TODO: find a way to organize code better
	// TODO: check field existence
	spec := m.Object["spec"].(map[string]interface{})
	ref := spec["providerConfigRef"].(map[string]interface{})

	return &xpv1.Reference{
		Name: ref["name"].(string),
	}
}

func (m *ManagedUnstructured) SetProviderConfigReference(p *xpv1.Reference) {
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
	res, err := c.GetProviderConfigsInner(ec.Param("name"))
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, res, "  ")
}

func (c *Controller) GetProviderConfigsInner(provName string) (*unstructured.UnstructuredList, error) {
	allProvCRDs, err := c.LoadCRDs()
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

func (c *Controller) LoadCRDs() (map[string][]*v1.CustomResourceDefinition, error) {
	// FIXME: a misplaced method!
	// FIXME: quite expensive method to call

	// Create the API Extensions clientset
	providers, err := c.APIv1.Providers().List(c.ctx)
	if err != nil {
		return nil, err
	}

	crdList, err := c.apiExt.CustomResourceDefinitions().List(c.ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	provCRDs := map[string][]*v1.CustomResourceDefinition{}

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

	xrds, err := c.ExtV1.XRDs().List(c.ctx)
	if err != nil {
		return err
	}

	for _, xrd := range xrds.Items {
		gvk := schema.GroupVersionKind{ // TODO: xrd.Status.Controllers.CompositeResourceClaimTypeRef is more logical here
			Group:   xrd.Spec.Group,
			Version: xrd.Spec.Versions[0].Name,
			Kind:    xrd.Spec.ClaimNames.Plural,
		}
		res, err := c.CRDs.List(c.ctx, gvk)
		if err != nil {
			return err
		}

		list.Items = append(list.Items, res.Items...)
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

	claim := uclaim.Unstructured{}
	err := c.getDynamicResource(&claimRef, &claim)
	if err != nil {
		return err
	}

	if ec.QueryParam("full") != "" {
		xrRef := claim.GetResourceReference()

		xr := uxres.New()
		_ = c.getDynamicResource(xrRef, xr)
		claim.Object["compositeResource"] = xr

		MRs := []*ManagedUnstructured{}
		for _, mrRef := range xr.GetResourceReferences() {
			mr := ManagedUnstructured{}
			_ = c.getDynamicResource(&mrRef, &mr)

			MRs = append(MRs, &mr)
		}
		claim.Object["managedResources"] = MRs

		compRef := claim.GetCompositionReference()
		compRef.SetGroupVersionKind(v13.CompositionGroupVersionKind)

		comp := uxres.New()
		_ = c.getDynamicResource(compRef, comp)
		claim.Object["composition"] = comp

	}
	return ec.JSONPretty(http.StatusOK, claim.Object, "  ")
}

func (c *Controller) getDynamicResource(ref *v12.ObjectReference, res ConditionedObject) (err error) {
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
	provCRDs, err := c.LoadCRDs()
	if err != nil {
		return err
	}

	res := &unstructured.UnstructuredList{Items: []unstructured.Unstructured{}}
	for _, mrd := range c.allMRDs(provCRDs) {
		if mrd.Spec.Names.Kind == cpk8s.ProviderConfigKind || mrd.Spec.Names.Kind == cpk8s.ProviderConfigUsageKind {
			log.Debugf("Skipping %s/%s from listing of all MRs", mrd.Spec.Group, mrd.Spec.Names.Kind)
			continue
		}

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
	return ec.JSONPretty(http.StatusOK, res, "  ")
}

func (c *Controller) allMRDs(provCRDs map[string][]*v1.CustomResourceDefinition) []*v1.CustomResourceDefinition {
	res := []*v1.CustomResourceDefinition{}
	for _, crds := range provCRDs {
		res = append(res, crds...)
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

	xr := ManagedUnstructured{}
	err := c.getDynamicResource(&ref, &xr)
	if err != nil {
		return err
	}

	if ec.QueryParam("full") != "" {
		// provider config
		provConfigRef := xr.GetProviderConfigReference()

		if provConfigRef != nil {
			pcs, err := c.GetProviderConfigsInner("")
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

	xrds, err := c.ExtV1.XRDs().List(c.ctx)
	if err != nil {
		return err
	}

	for _, xrd := range xrds.Items {
		gvk := schema.GroupVersionKind{ // TODO: xrd.Status.Controllers.CompositeResourceTypeRef is more logical here
			Group:   xrd.Spec.Group,
			Version: xrd.Spec.Versions[0].Name,
			Kind:    xrd.Spec.Names.Plural,
		}
		res, err := c.CRDs.List(c.ctx, gvk)
		if err != nil {
			return err
		}

		list.Items = append(list.Items, res.Items...)
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
	items, err := c.ExtV1.XRDs().List(c.ctx)
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

		// composition ref
		compRef := xr.GetCompositionReference()
		compRef.SetGroupVersionKind(v13.CompositionGroupVersionKind)

		comp := uxres.New()
		_ = c.getDynamicResource(compRef, comp)
		xr.Object["composition"] = comp

		// MR refs
		MRs := []*ManagedUnstructured{}
		for _, mrRef := range xr.GetResourceReferences() {
			mr := ManagedUnstructured{}
			_ = c.getDynamicResource(&mrRef, &mr)

			MRs = append(MRs, &mr)
		}
		xr.Object["managedResources"] = MRs
	}

	return ec.JSONPretty(http.StatusOK, xr, "  ")
}

func NewController(ctx context.Context, cfg *rest.Config, ns string, version string) (*Controller, error) {
	_ = ns // TODO

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

	controller := Controller{
		ctx:    ctx,
		APIv1:  apiV1,
		ExtV1:  ext,
		Events: evt,
		apiExt: apiExt,
		CRDs:   crossplane.NewCRDsClient(cfg),
		StatusInfo: StatusInfo{
			CurVer: version,
		},
	}

	return &controller, nil
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
