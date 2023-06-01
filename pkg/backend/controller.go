package backend

import (
	"context"
	cpk8s "github.com/crossplane-contrib/provider-kubernetes/apis/v1alpha1"
	xpv1 "github.com/crossplane/crossplane-runtime/apis/common/v1"
	uclaim "github.com/crossplane/crossplane-runtime/pkg/resource/unstructured/claim"
	uxres "github.com/crossplane/crossplane-runtime/pkg/resource/unstructured/composite" // what's the difference between `composed` and `composite` there?
	v13 "github.com/crossplane/crossplane/apis/apiextensions/v1"
	cpv1 "github.com/crossplane/crossplane/apis/pkg/v1"
	"github.com/komodorio/komoplane/pkg/backend/crossplane"
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
)

type StatusInfo struct {
	CurVer    string
	LatestVer string
	Analytics bool
}

type Controller struct {
	StatusInfo StatusInfo
	APIv1      crossplane.APIv1
	ExtV1      crossplane.ExtensionsV1
	Events     crossplane.EventsInterface
	CRDs       crossplane.CRDInterface
	ctx        context.Context

	provCRDs map[string][]*v1.CustomResourceDefinition
}

func (c *Controller) PeriodicTasks(ctx context.Context) {
	//TODO needed?
}

func (c *Controller) GetStatus() StatusInfo {
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
	provCRDs, ok := c.provCRDs[ec.Param("name")]
	if ok {
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
					return err
				}
				return ec.JSONPretty(http.StatusOK, res, "  ")
			}
		}
	}

	return ec.NoContent(http.StatusNotFound)
}

func (c *Controller) LoadCRDs(ctx context.Context, config *rest.Config) error {
	// FIXME: a misplaced method!

	// Create the API Extensions clientset
	apiExtensionsClientset, err := apiextensionsv1.NewForConfig(config)
	if err != nil {
		return err
	}

	providers, err := c.APIv1.Providers().List(ctx)
	if err != nil {
		return err
	}

	crdList, err := apiExtensionsClientset.CustomResourceDefinitions().List(ctx, metav1.ListOptions{})
	if err != nil {
		return err
	}

	c.provCRDs = map[string][]*v1.CustomResourceDefinition{}

	for _, crd := range crdList.Items {
		crdCopy := crd // otherwise, variable gets reused (https://garbagecollected.org/2017/02/22/go-range-loop-internals/)
	refLoop:
		for _, ref := range crd.OwnerReferences {
			if ref.Kind == cpv1.ProviderKind && ref.APIVersion == cpv1.Group+"/"+cpv1.Version {
				for _, prov := range providers.Items {
					if prov.Name == ref.Name {
						if _, ok := c.provCRDs[prov.Name]; !ok {
							c.provCRDs[prov.Name] = []*v1.CustomResourceDefinition{}
						}

						c.provCRDs[prov.Name] = append(c.provCRDs[prov.Name], &crdCopy)
						break refLoop
					}
				}
			}
		}
	}
	return nil
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
	// FIXME: refactor a lot of duplications
	gvk := schema.GroupVersionKind{
		Group:   ec.Param("group"),
		Version: ec.Param("version"),
		Kind:    ec.Param("kind"),
	}

	claim := uclaim.Unstructured{}
	claimRef := v12.ObjectReference{Namespace: ec.Param("namespace"), Name: ec.Param("name")}
	claimRef.SetGroupVersionKind(gvk)
	err := c.CRDs.Get(c.ctx, &claim, &claimRef)
	if err != nil {
		return err
	}
	claim.SetGroupVersionKind(claimRef.GroupVersionKind())
	claim.SetNamespace(claimRef.Namespace)
	claim.SetName(claimRef.Name)

	if ec.QueryParam("full") != "" {
		xrRef := claim.GetResourceReference()

		xr := uxres.New()
		err = c.CRDs.Get(c.ctx, xr, xrRef)
		if err != nil {
			condErrored := xpv1.Condition{
				Type:               "Found",
				Status:             "False",
				LastTransitionTime: metav1.Now(),
				Reason:             "FailedToGet",
				Message:            err.Error(),
			}
			xr.SetConditions(condErrored)
		}
		xr.SetGroupVersionKind(gvk)
		xr.SetNamespace(xrRef.Namespace)
		xr.SetName(xrRef.Name)

		MRs := []*ManagedUnstructured{}
		for _, mrRef := range xr.GetResourceReferences() {
			mr := ManagedUnstructured{Unstructured: *uxres.New()}

			if mr.GetName() == "" {
				condNotFound := xpv1.Condition{
					Type:               "Found",
					Status:             "False",
					LastTransitionTime: metav1.Now(),
					Reason:             "NameIsEmpty",
					Message:            "Probably, the resource were never created, and external name were not reported back",
				}
				mr.SetConditions(condNotFound)
			} else {
				err := c.CRDs.Get(c.ctx, &mr, &mrRef)
				if err != nil {
					return err
				}
			}

			mr.SetGroupVersionKind(mrRef.GroupVersionKind()) // https://github.com/kubernetes/client-go/issues/308
			mr.SetNamespace(mrRef.Namespace)
			mr.SetName(mrRef.Name)

			MRs = append(MRs, &mr)
		}

		compRef := claim.GetCompositionReference()
		compRef.SetGroupVersionKind(v13.CompositionGroupVersionKind)

		comp := uxres.New()
		err = c.CRDs.Get(c.ctx, comp, compRef)
		if err != nil {
			condErrored := xpv1.Condition{
				Type:               "Found",
				Status:             "False",
				LastTransitionTime: metav1.Now(),
				Reason:             "FailedToGet",
				Message:            err.Error(),
			}
			xr.SetConditions(condErrored)
		}
		xr.SetGroupVersionKind(gvk)
		xr.SetNamespace(xrRef.Namespace)
		xr.SetName(xrRef.Name)

		claim.Object["managedResources"] = MRs
		claim.Object["compositeResource"] = xr
		claim.Object["composition"] = comp
	}
	return ec.JSONPretty(http.StatusOK, claim.Object, "  ")
}

func (c *Controller) GetManaged(ec echo.Context) error {
	res := &unstructured.UnstructuredList{Items: []unstructured.Unstructured{}}
	for _, mrd := range c.allMRDs() {
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

func (c *Controller) allMRDs() []*v1.CustomResourceDefinition {
	res := []*v1.CustomResourceDefinition{}
	for _, crds := range c.provCRDs {
		res = append(res, crds...)
	}

	return res
}

func (c *Controller) GetComposite(ec echo.Context) error {
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

type ManagedUnstructured struct { // no dedicated type for it in base CP
	uxres.Unstructured
}

func NewController(ctx context.Context, cfg *rest.Config, ns string, version string) (*Controller, error) {
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

	controller := Controller{
		ctx:    ctx,
		APIv1:  apiV1,
		ExtV1:  ext,
		Events: evt,
		CRDs:   crossplane.NewCRDsClient(cfg),
		StatusInfo: StatusInfo{
			CurVer: version,
		},
	}

	err = controller.LoadCRDs(ctx, cfg)
	if err != nil {
		return nil, err
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
	configOverrides := &clientcmd.ConfigOverrides{}
	kubeConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides)

	return kubeConfig.ClientConfig()
}
