package backend

import (
	"context"
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
	ctx        context.Context
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

func (c *Controller) LoadCRDs(ctx context.Context, config *rest.Config) error {
	// Create the API Extensions clientset
	apiExtensionsClientset, err := apiextensionsv1.NewForConfig(config)
	if err != nil {
		return err
	}

	providers, err := c.APIv1.Providers().List(ctx)
	if err != nil {
		return err
	}

	pmap := map[string][]*v1.CustomResourceDefinition{}

	log.Infof("Begin")

	// List the CRDs
	crdList, err := apiExtensionsClientset.CustomResourceDefinitions().List(ctx, metav1.ListOptions{})
	if err != nil {
		return err
	}

	// Print the CRD names
	for _, crd := range crdList.Items {
		crdCopy := crd // otherwise, variable gets reused (https://garbagecollected.org/2017/02/22/go-range-loop-internals/)
	refLoop:
		for _, ref := range crd.OwnerReferences {
			if ref.Kind == cpv1.ProviderKind && ref.APIVersion == cpv1.Group+"/"+cpv1.Version {
				for _, prov := range providers.Items {
					if prov.Name == ref.Name {
						if _, ok := pmap[prov.Name]; !ok {
							pmap[prov.Name] = []*v1.CustomResourceDefinition{}
						}

						pmap[prov.Name] = append(pmap[prov.Name], &crdCopy)
						break refLoop
					}
				}
			}
		}
	}
	log.Infof("End")
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

	return &Controller{
		ctx:    ctx,
		APIv1:  apiV1,
		Events: evt,
		StatusInfo: StatusInfo{
			CurVer: version,
		},
	}, nil
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
