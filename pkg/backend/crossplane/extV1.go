package crossplane

import (
	v1 "github.com/crossplane/crossplane/apis/apiextensions/v1"
	log "github.com/sirupsen/logrus"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
)

type ExtensionsV1 interface {
	XRDs() XRDInterface
	Compositions() CompositionInterface
}

type ExtensionsV1Client struct {
	restClient rest.Interface
	config     *rest.Config
}

func NewEXTv1Client(c *rest.Config) (*ExtensionsV1Client, error) {
	config := *c
	config.ContentConfig.GroupVersion = &schema.GroupVersion{Group: v1.Group, Version: v1.Version}
	config.APIPath = "/apis"
	config.NegotiatedSerializer = scheme.Codecs.WithoutConversion()
	config.UserAgent = rest.DefaultKubernetesUserAgent()

	client, err := rest.RESTClientFor(&config)
	if err != nil {
		return nil, err
	}

	return &ExtensionsV1Client{restClient: client, config: c}, nil
}

func (c *ExtensionsV1Client) XRDs() XRDInterface {
	fallback := &xrdClient{restClient: c.restClient}
	wrapper, err := NewVersionAwareXRDWrapper(c.config, fallback)
	if err != nil {
		log.Warnf("Failed to create version-aware XRD client, using v1 fallback: %v", err)
		return fallback
	}
	return wrapper
}
func (c *ExtensionsV1Client) Compositions() CompositionInterface {
	return &compositionClient{
		restClient: c.restClient,
	}
}
