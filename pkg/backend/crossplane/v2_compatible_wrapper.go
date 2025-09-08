package crossplane

import (
	"context"

	v1 "github.com/crossplane/crossplane/apis/apiextensions/v1"
	log "github.com/sirupsen/logrus"
)

// v2CompatibleXRDClientWrapper wraps the V2CompatibleXRDClient to implement XRDInterface
type v2CompatibleXRDClientWrapper struct {
	v2Client *V2CompatibleXRDClient
	fallback XRDInterface
}

// List implements XRDInterface by using the v2-compatible client
func (w *v2CompatibleXRDClientWrapper) List(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	result, err := w.v2Client.List(ctx)
	if err != nil {
		log.Warnf("V2-compatible client failed, using fallback: %v", err)
		return w.fallback.List(ctx)
	}
	return result, nil
}

// Get implements XRDInterface by using the v2-compatible client
func (w *v2CompatibleXRDClientWrapper) Get(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error) {
	result, err := w.v2Client.Get(ctx, name)
	if err != nil {
		log.Warnf("V2-compatible client failed for XRD %s, using fallback: %v", name, err)
		return w.fallback.Get(ctx, name)
	}
	return result, nil
}
