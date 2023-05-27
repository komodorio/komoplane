package crossplane

import (
	"context"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
)

type CRDInterface interface {
	List(ctx context.Context, gvk metav1.GroupVersionKind) (*unstructured.UnstructuredList, error)
}

type crdClient struct {
	cfg *rest.Config
}

func (c *crdClient) List(ctx context.Context, gvk metav1.GroupVersionKind) (*unstructured.UnstructuredList, error) {
	config := *c.cfg
	config.ContentConfig.GroupVersion = &schema.GroupVersion{Group: gvk.Group, Version: gvk.Version}
	config.APIPath = "/apis"
	config.NegotiatedSerializer = scheme.Codecs.WithoutConversion()
	config.UserAgent = rest.DefaultKubernetesUserAgent()

	client, err := rest.RESTClientFor(&config)
	if err != nil {
		return nil, err
	}

	result := unstructured.UnstructuredList{}
	err = client.
		Get().
		Resource(gvk.Kind).
		Do(ctx).
		Into(&result)

	return &result, err
}

func NewCRDsClient(cfg *rest.Config) CRDInterface {
	return &crdClient{
		cfg: cfg,
	}
}
