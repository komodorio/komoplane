package crossplane

import (
	"context"
	"fmt"

	v1 "github.com/crossplane/crossplane/apis/apiextensions/v1"
	log "github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
)

// VersionAwareXRDClient can discover and work with multiple API versions of XRDs
type VersionAwareXRDClient struct {
	config          *rest.Config
	dynamicClient   dynamic.Interface
	discoveryClient discovery.DiscoveryInterface
	supportedVersions []string
}

// NewVersionAwareXRDClient creates a client that can auto-discover XRD API versions
func NewVersionAwareXRDClient(config *rest.Config) (*VersionAwareXRDClient, error) {
	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	discoveryClient, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create discovery client: %w", err)
	}

	client := &VersionAwareXRDClient{
		config:          config,
		dynamicClient:   dynamicClient,
		discoveryClient: discoveryClient,
	}

	// Discover supported versions
	err = client.discoverSupportedVersions()
	if err != nil {
		log.Warnf("Failed to discover supported XRD versions: %v", err)
		// Fall back to v1 as default
		client.supportedVersions = []string{"v1"}
	}

	return client, nil
}

// discoverSupportedVersions finds what versions of XRDs are available in the cluster
func (c *VersionAwareXRDClient) discoverSupportedVersions() error {
	apiGroups, err := c.discoveryClient.ServerGroups()
	if err != nil {
		return err
	}

	for _, group := range apiGroups.Groups {
		if group.Name == "apiextensions.crossplane.io" {
			log.Infof("Found Crossplane apiextensions group")
			versions := make([]string, 0, len(group.Versions))
			for _, version := range group.Versions {
				versions = append(versions, version.Version)
				log.Infof("Discovered XRD API version: %s", version.Version)
			}
			c.supportedVersions = versions
			return nil
		}
	}

	return fmt.Errorf("crossplane apiextensions group not found")
}

// ListXRDsAllVersions attempts to list XRDs from all supported versions and merge results
func (c *VersionAwareXRDClient) ListXRDsAllVersions(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	result := &v1.CompositeResourceDefinitionList{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "apiextensions.crossplane.io/v1",
			Kind:       "CompositeResourceDefinitionList",
		},
		Items: []v1.CompositeResourceDefinition{},
	}

	// Try each supported version
	for _, version := range c.supportedVersions {
		log.Debugf("Attempting to list XRDs using version: %s", version)
		
		gvr := schema.GroupVersionResource{
			Group:    "apiextensions.crossplane.io", 
			Version:  version,
			Resource: "compositeresourcedefinitions",
		}

		unstructuredList, err := c.dynamicClient.Resource(gvr).List(ctx, metav1.ListOptions{})
		if err != nil {
			log.Warnf("Failed to list XRDs with version %s: %v", version, err)
			continue
		}

		log.Infof("Successfully listed %d XRDs using version %s", len(unstructuredList.Items), version)

		// Convert unstructured to v1 XRDs
		for _, item := range unstructuredList.Items {
			xrd, err := c.convertToV1XRD(&item, version)
			if err != nil {
				log.Warnf("Failed to convert XRD %s: %v", item.GetName(), err)
				continue
			}
			result.Items = append(result.Items, *xrd)
		}
	}

	log.Infof("Total XRDs discovered across all versions: %d", len(result.Items))
	return result, nil
}

// GetXRD attempts to get a specific XRD by trying all supported versions
func (c *VersionAwareXRDClient) GetXRD(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error) {
	for _, version := range c.supportedVersions {
		gvr := schema.GroupVersionResource{
			Group:    "apiextensions.crossplane.io",
			Version:  version, 
			Resource: "compositeresourcedefinitions",
		}

		unstructuredXRD, err := c.dynamicClient.Resource(gvr).Get(ctx, name, metav1.GetOptions{})
		if err != nil {
			log.Debugf("Failed to get XRD %s with version %s: %v", name, version, err)
			continue
		}

		log.Infof("Successfully retrieved XRD %s using version %s", name, version)
		return c.convertToV1XRD(unstructuredXRD, version)
	}

	return nil, fmt.Errorf("XRD %s not found in any supported version", name)
}

// convertToV1XRD converts an unstructured XRD to v1 format, preserving original version info
func (c *VersionAwareXRDClient) convertToV1XRD(unstructured *unstructured.Unstructured, originalVersion string) (*v1.CompositeResourceDefinition, error) {
	// Convert to v1 XRD
	var xrd v1.CompositeResourceDefinition
	err := c.convertUnstructuredToTyped(unstructured, &xrd)
	if err != nil {
		return nil, fmt.Errorf("failed to convert unstructured to v1 XRD: %w", err)
	}

	// Preserve information about the original API version
	if xrd.Annotations == nil {
		xrd.Annotations = make(map[string]string)
	}
	xrd.Annotations["komoplane.io/original-api-version"] = fmt.Sprintf("apiextensions.crossplane.io/%s", originalVersion)
	
	// Set the APIVersion to reflect what version was actually used
	if originalVersion != "v1" {
		// If it was retrieved from a different version, note it in the display
		xrd.APIVersion = fmt.Sprintf("apiextensions.crossplane.io/%s", originalVersion)
	} else {
		xrd.APIVersion = "apiextensions.crossplane.io/v1"
	}

	return &xrd, nil
}

// convertUnstructuredToTyped converts unstructured data to a typed struct
func (c *VersionAwareXRDClient) convertUnstructuredToTyped(unstructured *unstructured.Unstructured, target interface{}) error {
	// Use runtime conversion from unstructured to typed
	err := runtime.DefaultUnstructuredConverter.FromUnstructured(unstructured.UnstructuredContent(), target)
	if err != nil {
		return fmt.Errorf("failed to convert unstructured to typed: %w", err)
	}
	return nil
}

// GetSupportedVersions returns the list of discovered API versions
func (c *VersionAwareXRDClient) GetSupportedVersions() []string {
	return c.supportedVersions
}

// versionAwareXRDClientWrapper implements XRDInterface using the version-aware client
type versionAwareXRDClientWrapper struct {
	versionAware *VersionAwareXRDClient
	fallback     XRDInterface
}

// List implements XRDInterface by using the version-aware client
func (w *versionAwareXRDClientWrapper) List(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	// Try the version-aware client first
	result, err := w.versionAware.ListXRDsAllVersions(ctx)
	if err != nil {
		log.Warnf("Version-aware XRD client failed, falling back to original client: %v", err)
		return w.fallback.List(ctx)
	}
	return result, nil
}

// Get implements XRDInterface by using the version-aware client
func (w *versionAwareXRDClientWrapper) Get(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error) {
	// Try the version-aware client first
	result, err := w.versionAware.GetXRD(ctx, name)
	if err != nil {
		log.Warnf("Version-aware XRD client failed for %s, falling back to original client: %v", name, err)
		return w.fallback.Get(ctx, name)
	}
	return result, nil
}
