package crossplane

import (
	"context"
	"github.com/crossplane/crossplane/apis/apiextensions/v1"
	"github.com/komodorio/komoplane/pkg/backend/utils"
	"k8s.io/client-go/rest"
)

type CompositionInterface interface {
	List(ctx context.Context) (*v1.CompositionList, error)
	Get(ctx context.Context, name string) (*v1.Composition, error)
}

type compositionClient struct {
	restClient rest.Interface
}

func (c *compositionClient) List(ctx context.Context) (*v1.CompositionList, error) {
	result := v1.CompositionList{}
	err := c.restClient.
		Get().
		Resource(utils.Plural(v1.CompositionKind)).
		Do(ctx).
		Into(&result)

	return &result, err
}

func (c *compositionClient) Get(ctx context.Context, name string) (*v1.Composition, error) {
	result := v1.Composition{}
	err := c.restClient.
		Get().
		Resource(utils.Plural(v1.CompositionKind)).
		Name(name).
		Do(ctx).
		Into(&result)

	return &result, err
}
