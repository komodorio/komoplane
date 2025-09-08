package crossplane

import (
	"context"

	cpext "github.com/crossplane/crossplane/apis/apiextensions/v1"
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
	XRDs  XRDInterface // Version-aware XRD client
}

func (c *crdClient) Get(ctx context.Context, result resource.Object, ref *v1.ObjectReference) error {
	gvk := ref.GroupVersionKind()
	log.Debugf("CRDs.Get: Looking up resource Name='%s', Namespace='%s', GVK='%s'", ref.Name, ref.Namespace, gvk)
	
	version := gvk.GroupVersion()
	config := *c.cfg
	config.ContentConfig.GroupVersion = &version
	config.APIPath = "/apis"
	config.NegotiatedSerializer = scheme.Codecs.WithoutConversion()
	config.UserAgent = rest.DefaultKubernetesUserAgent()

	plural, err := c.getPluralKind(ctx, ref)
	if err != nil {
		log.Debugf("CRDs.Get: Failed to get plural kind: %v", err)
		return err
	}

	log.Debugf("CRDs.Get: Using plural resource name: %s", plural)

	client, err := rest.RESTClientFor(&config)
	if err != nil {
		log.Debugf("CRDs.Get: Failed to create REST client: %v", err)
		return err
	}

	log.Debugf("CRDs.Get: Making API call to group=%s, version=%s, resource=%s, name=%s, namespace=%s", gvk.Group, gvk.Version, plural, ref.Name, ref.Namespace)

	err = client.
		Get().
		NamespaceIfScoped(ref.Namespace, ref.Namespace != "").Name(ref.Name).
		Resource(plural).
		Do(ctx).
		Into(result)

	if err != nil {
		log.Debugf("CRDs.Get: API call failed: %v", err)
	} else {
		log.Debugf("CRDs.Get: API call succeeded")
	}

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

	// The Kind field in GVK should contain the plural resource name for listing
	resourceName := gvk.Kind
	
	log.Debugf("CRDs.List: Making API call to group=%s, version=%s, resource=%s", gvk.Group, gvk.Version, resourceName)
	
	result := unstructured.UnstructuredList{}
	err = client.
		Get().
		Namespace(""). // Empty namespace means list across all namespaces
		Resource(resourceName).
		Do(ctx).
		Into(&result)

	if err != nil {
		log.Debugf("CRDs.List failed: %v", err)
	} else {
		log.Debugf("CRDs.List succeeded: got %d items", len(result.Items))
	}

	return &result, err
}

func (c *crdClient) getPluralKind(ctx context.Context, ref *v1.ObjectReference) (string, error) {
	log.Debugf("getPluralKind: Looking for plural for Kind='%s', Group='%s'", ref.Kind, ref.GroupVersionKind().Group)
	
	// Use version-aware XRD client if available, otherwise fall back to ExtV1
	var xrds *cpext.CompositeResourceDefinitionList
	var err error
	
	if c.XRDs != nil {
		log.Debugf("getPluralKind: Using version-aware XRD client")
		xrds, err = c.XRDs.List(ctx)
	} else {
		log.Debugf("getPluralKind: Using fallback ExtV1 client")
		xrds, err = c.ExtV1.XRDs().List(ctx)
	}
	
	if err != nil {
		log.Debugf("getPluralKind: Failed to list XRDs: %v", err)
		return "", err
	}

	log.Debugf("getPluralKind: Found %d XRDs to check", len(xrds.Items))
	
	for _, xrd := range xrds.Items {
		log.Debugf("getPluralKind: Checking XRD %s (group=%s, kind=%s, plural=%s)", xrd.Name, xrd.Spec.Group, xrd.Spec.Names.Kind, xrd.Spec.Names.Plural)
		
		if xrd.Spec.ClaimNames != nil && xrd.Spec.ClaimNames.Kind == ref.Kind && xrd.Spec.Group == ref.GroupVersionKind().Group {
			log.Debugf("getPluralKind: Found match via ClaimNames, returning plural: %s", xrd.Spec.ClaimNames.Plural)
			return xrd.Spec.ClaimNames.Plural, nil
		}

		if xrd.Spec.Names.Kind == ref.Kind && xrd.Spec.Group == ref.GroupVersionKind().Group {
			log.Debugf("getPluralKind: Found match via Names, returning plural: %s", xrd.Spec.Names.Plural)
			return xrd.Spec.Names.Plural, nil
		}
	}

	log.Debugf("Could not find plural for kind '%s', defaulted to -s suffix", ref.Kind)
	fallback := utils.Plural(ref.Kind)
	log.Debugf("getPluralKind: Using fallback plural: %s", fallback)
	return fallback, nil // poor man's fallback
}

func NewCRDsClient(cfg *rest.Config, ext *ExtensionsV1Client) CRDInterface {
	return &crdClient{
		cfg:   cfg,
		ExtV1: ext,
	}
}

func NewVersionAwareCRDsClient(cfg *rest.Config, ext *ExtensionsV1Client, xrds XRDInterface) CRDInterface {
	return &crdClient{
		cfg:   cfg,
		ExtV1: ext,
		XRDs:  xrds,
	}
}
