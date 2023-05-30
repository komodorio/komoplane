package crossplane

import (
	"context"
	"github.com/crossplane/crossplane-runtime/pkg/resource"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
)

type CRDInterface interface {
	List(ctx context.Context, gvk schema.GroupVersionKind) (*unstructured.UnstructuredList, error)
	Get(ctx context.Context, dst resource.Object, reference *v1.ObjectReference) error // todo: migrate it onto ObjectReference
}

type crdClient struct {
	cfg *rest.Config
}

func (c *crdClient) Get(ctx context.Context, result resource.Object, ref *v1.ObjectReference) error {
	version := ref.GroupVersionKind().GroupVersion()
	config := *c.cfg
	config.ContentConfig.GroupVersion = &version
	config.APIPath = "/apis"
	config.NegotiatedSerializer = scheme.Codecs.WithoutConversion()
	config.UserAgent = rest.DefaultKubernetesUserAgent()

	client, err := rest.RESTClientFor(&config)
	if err != nil {
		return err
	}

	err = client.
		Get().
		NamespaceIfScoped(ref.Namespace, ref.Namespace != "").Name(ref.Name).
		Resource(ref.Kind + "s"). // TODO: better way to pluralize?
		Do(ctx).
		Into(result)

	return err
}

func (c *crdClient) List(ctx context.Context, gvk schema.GroupVersionKind) (*unstructured.UnstructuredList, error) {
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
