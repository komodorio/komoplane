package crossplane

import (
	"context"
	"fmt"

	v1 "github.com/crossplane/crossplane/apis/apiextensions/v1"
	log "github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
)

// VersionAwareXRDClient discovers available Crossplane API versions and
// prefers v2 when available, falling back to v1.
type VersionAwareXRDClient struct {
	dynamicClient    dynamic.Interface
	preferredVersion string
}

// NewVersionAwareXRDClient creates a client that auto-discovers XRD API versions.
func NewVersionAwareXRDClient(config *rest.Config) (*VersionAwareXRDClient, error) {
	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	discoveryClient, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create discovery client: %w", err)
	}

	preferred, err := discoverPreferredVersion(discoveryClient)
	if err != nil {
		log.Warnf("Failed to discover XRD API versions, defaulting to v1: %v", err)
		preferred = "v1"
	}

	return &VersionAwareXRDClient{
		dynamicClient:    dynamicClient,
		preferredVersion: preferred,
	}, nil
}

func discoverPreferredVersion(dc discovery.DiscoveryInterface) (string, error) {
	apiGroups, err := dc.ServerGroups()
	if err != nil {
		return "", err
	}

	for _, group := range apiGroups.Groups {
		if group.Name != "apiextensions.crossplane.io" {
			continue
		}
		for _, ver := range group.Versions {
			if ver.Version == "v2" {
				log.Infof("Crossplane apiextensions v2 API available, using v2")
				return "v2", nil
			}
		}
		log.Infof("Crossplane apiextensions using v1 API (v2 not available)")
		return "v1", nil
	}

	return "", fmt.Errorf("apiextensions.crossplane.io group not found")
}

func (c *VersionAwareXRDClient) xrdGVR() schema.GroupVersionResource {
	return schema.GroupVersionResource{
		Group:    "apiextensions.crossplane.io",
		Version:  c.preferredVersion,
		Resource: "compositeresourcedefinitions",
	}
}

// List returns XRDs using the preferred API version, converted to v1 types.
func (c *VersionAwareXRDClient) List(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	uList, err := c.dynamicClient.Resource(c.xrdGVR()).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list XRDs via %s: %w", c.preferredVersion, err)
	}

	result := &v1.CompositeResourceDefinitionList{}
	for _, item := range uList.Items {
		var xrd v1.CompositeResourceDefinition
		if err := runtime.DefaultUnstructuredConverter.FromUnstructured(item.UnstructuredContent(), &xrd); err != nil {
			log.Warnf("Failed to convert XRD %s: %v", item.GetName(), err)
			continue
		}
		result.Items = append(result.Items, xrd)
	}

	log.Debugf("Listed %d XRDs via %s API", len(result.Items), c.preferredVersion)
	return result, nil
}

// Get returns a single XRD by name, converted to v1 type.
func (c *VersionAwareXRDClient) Get(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error) {
	u, err := c.dynamicClient.Resource(c.xrdGVR()).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("get XRD %s via %s: %w", name, c.preferredVersion, err)
	}

	var xrd v1.CompositeResourceDefinition
	if err := runtime.DefaultUnstructuredConverter.FromUnstructured(u.UnstructuredContent(), &xrd); err != nil {
		return nil, fmt.Errorf("convert XRD %s: %w", name, err)
	}

	return &xrd, nil
}

// versionAwareXRDWrapper implements XRDInterface, falling back to the
// original REST-based client when the version-aware client fails.
type versionAwareXRDWrapper struct {
	primary  *VersionAwareXRDClient
	fallback XRDInterface
}

func (w *versionAwareXRDWrapper) List(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	result, err := w.primary.List(ctx)
	if err != nil {
		log.Warnf("Version-aware XRD list failed, using fallback: %v", err)
		return w.fallback.List(ctx)
	}
	return result, nil
}

func (w *versionAwareXRDWrapper) Get(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error) {
	result, err := w.primary.Get(ctx, name)
	if err != nil {
		log.Warnf("Version-aware XRD get(%s) failed, using fallback: %v", name, err)
		return w.fallback.Get(ctx, name)
	}
	return result, nil
}

// NewVersionAwareXRDWrapper creates an XRDInterface that uses version-aware
// discovery with fallback to the provided client.
func NewVersionAwareXRDWrapper(config *rest.Config, fallback XRDInterface) (XRDInterface, error) {
	primary, err := NewVersionAwareXRDClient(config)
	if err != nil {
		log.Warnf("Failed to create version-aware XRD client, using fallback: %v", err)
		return fallback, nil
	}
	return &versionAwareXRDWrapper{primary: primary, fallback: fallback}, nil
}
