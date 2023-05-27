package backend

import (
	"context"
	cpk8s "github.com/crossplane-contrib/provider-kubernetes/apis/v1alpha1"
	cpv1 "github.com/crossplane/crossplane/apis/pkg/v1"
	"github.com/komodorio/komoplane/pkg/backend/crossplane"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
	v1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/client/clientset/clientset/typed/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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
	res, err := c.Events.List(c.ctx, ec.Param("name"), cpv1.ProviderKind, cpv1.Group, cpv1.Version)
	if err != nil {
		return err
	}

	return ec.JSONPretty(http.StatusOK, res, "  ")
}

func (c *Controller) GetProviderConfigs(ec echo.Context) error {
	provCRDs, ok := c.provCRDs[ec.Param("name")]
	if ok {
		for _, crd := range provCRDs {
			if crd.Spec.Names.Kind == cpk8s.ProviderConfigKind {
				gvk := metav1.GroupVersionKind{
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

func NewController(ctx context.Context, cfg *rest.Config, ns string, version string) (*Controller, error) {
	apiV1, err := crossplane.NewAPIv1Client(cfg)
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
