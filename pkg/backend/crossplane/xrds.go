package crossplane

import (
	"context"
	"github.com/crossplane/crossplane/apis/apiextensions/v1"
	"github.com/komodorio/komoplane/pkg/backend/utils"
	"k8s.io/client-go/rest"
)

type XRDInterface interface {
	List(ctx context.Context) (*v1.CompositeResourceDefinitionList, error)
	Get(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error)
}

type xrdClient struct {
	restClient rest.Interface
}

func (c *xrdClient) List(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	result := v1.CompositeResourceDefinitionList{}
	err := c.restClient.
		Get().
		Resource(utils.Plural(v1.CompositeResourceDefinitionKind)).
		Do(ctx).
		Into(&result)

	return &result, err
}

func (c *xrdClient) Get(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error) {
	result := v1.CompositeResourceDefinition{}
	err := c.restClient.
		Get().
		Resource(utils.Plural(v1.CompositeResourceDefinitionKind)).
		Name(name).
		Do(ctx).
		Into(&result)

	return &result, err
}
