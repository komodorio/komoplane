package crossplane

import (
	"context"

	"github.com/crossplane/crossplane-runtime/pkg/resource"
	"github.com/komodorio/komoplane/pkg/backend/utils"
	log "github.com/sirupsen/logrus"
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
	cfg   *rest.Config
	ExtV1 *ExtensionsV1Client
}

func (c *crdClient) Get(ctx context.Context, result resource.Object, ref *v1.ObjectReference) error {
	version := ref.GroupVersionKind().GroupVersion()
	config := *c.cfg
	config.ContentConfig.GroupVersion = &version
	config.APIPath = "/apis"
	config.NegotiatedSerializer = scheme.Codecs.WithoutConversion()
	config.UserAgent = rest.DefaultKubernetesUserAgent()

	plural, err := c.getPluralKind(ctx, ref)
	if err != nil {
		return err
	}

	client, err := rest.RESTClientFor(&config)
	if err != nil {
		return err
	}

	err = client.
		Get().
		NamespaceIfScoped(ref.Namespace, ref.Namespace != "").Name(ref.Name).
		Resource(plural).
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
		Namespace(""). // Empty namespace means list across all namespaces
		Resource(gvk.Kind).
		Do(ctx).
		Into(&result)

	return &result, err
}

func (c *crdClient) getPluralKind(ctx context.Context, ref *v1.ObjectReference) (string, error) {
	xrds, err := c.ExtV1.XRDs().List(ctx)
	if err != nil {
		return "", err
	}

	for _, xrd := range xrds.Items {
		if xrd.Spec.ClaimNames != nil && xrd.Spec.ClaimNames.Kind == ref.Kind && xrd.Spec.Group == ref.GroupVersionKind().Group {
			return xrd.Spec.ClaimNames.Plural, nil
		}

		if xrd.Spec.Names.Kind == ref.Kind && xrd.Spec.Group == ref.GroupVersionKind().Group {
			return xrd.Spec.Names.Plural, nil
		}
	}

	log.Debugf("Could not find plural for kind '%s', defaulted to -s suffix", ref.Kind)
	return utils.Plural(ref.Kind), nil // poor man's fallback
}

func NewCRDsClient(cfg *rest.Config, ext *ExtensionsV1Client) CRDInterface {
	return &crdClient{
		cfg:   cfg,
		ExtV1: ext,
	}
}
