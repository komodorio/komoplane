package crossplane

import (
	"context"
	v1 "github.com/crossplane/crossplane/apis/pkg/v1"
	"github.com/komodorio/komoplane/pkg/backend/utils"
	log "github.com/sirupsen/logrus"
	"k8s.io/client-go/rest"
)

type ProviderInterface interface {
	List(ctx context.Context) (*v1.ProviderList, error)
	Get(ctx context.Context, name string) (*v1.Provider, error)
}

type providerClient struct {
	restClient rest.Interface
}

func (c *providerClient) List(ctx context.Context) (*v1.ProviderList, error) {
	result := v1.ProviderList{}
	err := c.restClient.
		Get().
		Resource(utils.Plural(v1.ProviderKind)).
		Do(ctx).
		Into(&result)

	for _, p := range result.Items {
		addProviderConfigType(&p)
	}

	return &result, err
}

func (c *providerClient) Get(ctx context.Context, name string) (*v1.Provider, error) {
	result := v1.Provider{}
	err := c.restClient.
		Get().
		Resource(utils.Plural(v1.ProviderKind)).
		Name(name).
		Do(ctx).
		Into(&result)

	addProviderConfigType(&result)
	return &result, err
}

func addProviderConfigType(p *v1.Provider) {
	switch p.Kind {
	default:
		log.Warnf("Did not recognize provider type: %s", p.Kind)
	}
}
