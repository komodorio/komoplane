package backend

import (
	"context"
	"github.com/komodorio/komoplane/pkg/backend/crossplane"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
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
	ctx        context.Context
}

func (c *Controller) PeriodicTasks(ctx context.Context) {
	//TODO needed?
}

func (c *Controller) GetStatus() StatusInfo {
	return c.StatusInfo
}

func (c *Controller) GetProviders(c2 echo.Context) error {
	providers, err := c.APIv1.Providers().List(c.ctx)
	if err != nil {
		return err
	}

	return c2.JSONPretty(http.StatusOK, providers, "  ")
}

func NewController(ctx context.Context, cfg *rest.Config, ns string, version string) (*Controller, error) {
	apiV1, err := crossplane.NewAPIv1Client(cfg)
	if err != nil {
		return nil, err
	}

	return &Controller{
		ctx:   ctx,
		APIv1: apiV1,
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
