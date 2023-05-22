package crossplane

import (
	"github.com/crossplane/crossplane/apis/apiextensions/v1"
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

	return &ExtensionsV1Client{restClient: client}, nil
}

func (c *ExtensionsV1Client) XRDs() XRDInterface {
	return &xrdClient{
		restClient: c.restClient,
	}
}
func (c *ExtensionsV1Client) Compositions() CompositionInterface {
	return &compositionClient{
		restClient: c.restClient,
	}
}
