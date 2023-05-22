package crossplane

import (
	v1 "github.com/crossplane/crossplane/apis/pkg/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
)

type APIv1 interface {
	Providers() ProviderInterface
	// TODO: Configurations live here, if needed
}

type APIv1Client struct {
	restClient rest.Interface
}

func NewAPIv1Client(c *rest.Config) (*APIv1Client, error) {
	config := *c
	config.ContentConfig.GroupVersion = &schema.GroupVersion{Group: v1.Group, Version: v1.Version}
	config.APIPath = "/apis"
	config.NegotiatedSerializer = scheme.Codecs.WithoutConversion()
	config.UserAgent = rest.DefaultKubernetesUserAgent()

	client, err := rest.RESTClientFor(&config)
	if err != nil {
		return nil, err
	}

	return &APIv1Client{restClient: client}, nil
}

func (c *APIv1Client) Providers() ProviderInterface {
	return &providerClient{
		restClient: c.restClient,
	}
}
