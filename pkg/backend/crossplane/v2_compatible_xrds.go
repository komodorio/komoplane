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

// V2CompatibleXRDClient handles both v1 and v2 API versions of CompositeResourceDefinitions
type V2CompatibleXRDClient struct {
	config          *rest.Config
	dynamicClient   dynamic.Interface
	discoveryClient discovery.DiscoveryInterface
	preferredVersion string
	supportedVersions []string
}

// NewV2CompatibleXRDClient creates a client that prefers v2 APIs but falls back to v1
func NewV2CompatibleXRDClient(config *rest.Config) (*V2CompatibleXRDClient, error) {
	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	discoveryClient, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create discovery client: %w", err)
	}

	client := &V2CompatibleXRDClient{
		config:          config,
		dynamicClient:   dynamicClient,
		discoveryClient: discoveryClient,
	}

	// Discover supported versions and determine preferred version
	err = client.discoverSupportedVersions()
	if err != nil {
		log.Warnf("Failed to discover supported XRD versions: %v", err)
		// Fall back to v1 as default
		client.supportedVersions = []string{"v1"}
		client.preferredVersion = "v1"
	}

	return client, nil
}

// discoverSupportedVersions finds what versions of XRDs are available and determines preference
func (c *V2CompatibleXRDClient) discoverSupportedVersions() error {
	apiGroups, err := c.discoveryClient.ServerGroups()
	if err != nil {
		return err
	}

	for _, group := range apiGroups.Groups {
		if group.Name == "apiextensions.crossplane.io" {
			log.Infof("Found Crossplane apiextensions group")
			versions := make([]string, 0, len(group.Versions))
			hasV2 := false
			
			for _, version := range group.Versions {
				versions = append(versions, version.Version)
				log.Infof("Discovered XRD API version: %s", version.Version)
				if version.Version == "v2" {
					hasV2 = true
				}
			}
			
			c.supportedVersions = versions
			
			// Prefer v2 if available, otherwise use v1
			if hasV2 {
				c.preferredVersion = "v2"
				log.Infof("Using preferred API version: v2 (avoids deprecation warnings)")
			} else {
				c.preferredVersion = "v1"
				log.Infof("Using API version: v1 (v2 not available)")
			}
			
			return nil
		}
	}

	return fmt.Errorf("crossplane apiextensions group not found")
}

// List implements XRDInterface using the preferred API version
func (c *V2CompatibleXRDClient) List(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	// Try preferred version first
	if c.preferredVersion == "v2" {
		log.Debugf("Attempting to list XRDs using v2 API")
		result, err := c.listXRDsV2(ctx)
		if err == nil {
			log.Infof("Successfully listed %d XRDs using v2 API", len(result.Items))
			return result, nil
		}
		log.Warnf("Failed to list XRDs with v2 API: %v, falling back to v1", err)
	}

	// Fall back to v1
	log.Debugf("Listing XRDs using v1 API")
	return c.listXRDsV1(ctx)
}

// Get implements XRDInterface using the preferred API version
func (c *V2CompatibleXRDClient) Get(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error) {
	// Try preferred version first
	if c.preferredVersion == "v2" {
		log.Debugf("Attempting to get XRD %s using v2 API", name)
		result, err := c.getXRDV2(ctx, name)
		if err == nil {
			log.Infof("Successfully retrieved XRD %s using v2 API", name)
			return result, nil
		}
		log.Warnf("Failed to get XRD %s with v2 API: %v, falling back to v1", name, err)
	}

	// Fall back to v1
	log.Debugf("Getting XRD %s using v1 API", name)
	return c.getXRDV1(ctx, name)
}

// listXRDsV2 lists XRDs using the v2 API
func (c *V2CompatibleXRDClient) listXRDsV2(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	gvr := schema.GroupVersionResource{
		Group:    "apiextensions.crossplane.io",
		Version:  "v2",
		Resource: "compositeresourcedefinitions",
	}

	unstructuredList, err := c.dynamicClient.Resource(gvr).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	// Convert unstructured list to v1 format for backward compatibility
	result := &v1.CompositeResourceDefinitionList{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "apiextensions.crossplane.io/v1",
			Kind:       "CompositeResourceDefinitionList",
		},
		Items: make([]v1.CompositeResourceDefinition, 0, len(unstructuredList.Items)),
	}

	for _, item := range unstructuredList.Items {
		xrd, err := c.convertV2ToV1XRD(&item)
		if err != nil {
			log.Warnf("Failed to convert v2 XRD %s: %v", item.GetName(), err)
			continue
		}
		result.Items = append(result.Items, *xrd)
	}

	return result, nil
}

// getXRDV2 gets a specific XRD using the v2 API
func (c *V2CompatibleXRDClient) getXRDV2(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error) {
	gvr := schema.GroupVersionResource{
		Group:    "apiextensions.crossplane.io",
		Version:  "v2",
		Resource: "compositeresourcedefinitions",
	}

	unstructuredXRD, err := c.dynamicClient.Resource(gvr).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return c.convertV2ToV1XRD(unstructuredXRD)
}

// listXRDsV1 lists XRDs using the v1 API (existing logic)
func (c *V2CompatibleXRDClient) listXRDsV1(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	gvr := schema.GroupVersionResource{
		Group:    "apiextensions.crossplane.io",
		Version:  "v1",
		Resource: "compositeresourcedefinitions",
	}

	unstructuredList, err := c.dynamicClient.Resource(gvr).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	result := &v1.CompositeResourceDefinitionList{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "apiextensions.crossplane.io/v1",
			Kind:       "CompositeResourceDefinitionList",
		},
		Items: make([]v1.CompositeResourceDefinition, 0, len(unstructuredList.Items)),
	}

	for _, item := range unstructuredList.Items {
		var xrd v1.CompositeResourceDefinition
		err := runtime.DefaultUnstructuredConverter.FromUnstructured(item.UnstructuredContent(), &xrd)
		if err != nil {
			log.Warnf("Failed to convert v1 XRD %s: %v", item.GetName(), err)
			continue
		}
		
		// Add annotation to track that this was retrieved via v1 API
		if xrd.Annotations == nil {
			xrd.Annotations = make(map[string]string)
		}
		xrd.Annotations["komoplane.io/retrieved-api-version"] = "apiextensions.crossplane.io/v1"
		
		result.Items = append(result.Items, xrd)
	}

	return result, nil
}

// getXRDV1 gets a specific XRD using the v1 API
func (c *V2CompatibleXRDClient) getXRDV1(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error) {
	gvr := schema.GroupVersionResource{
		Group:    "apiextensions.crossplane.io",
		Version:  "v1",
		Resource: "compositeresourcedefinitions",
	}

	unstructuredXRD, err := c.dynamicClient.Resource(gvr).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	var xrd v1.CompositeResourceDefinition
	err = runtime.DefaultUnstructuredConverter.FromUnstructured(unstructuredXRD.UnstructuredContent(), &xrd)
	if err != nil {
		return nil, fmt.Errorf("failed to convert v1 XRD: %w", err)
	}

	// Add annotation to track that this was retrieved via v1 API
	if xrd.Annotations == nil {
		xrd.Annotations = make(map[string]string)
	}
	xrd.Annotations["komoplane.io/retrieved-api-version"] = "apiextensions.crossplane.io/v1"

	return &xrd, nil
}

// convertV2ToV1XRD converts a v2 XRD structure to v1 format for backward compatibility
func (c *V2CompatibleXRDClient) convertV2ToV1XRD(unstructured *unstructured.Unstructured) (*v1.CompositeResourceDefinition, error) {
	// For now, we'll use a basic conversion since we don't have the actual v2 types
	// This is a placeholder that handles the key differences we know about from the documentation
	
	var xrd v1.CompositeResourceDefinition
	err := runtime.DefaultUnstructuredConverter.FromUnstructured(unstructured.UnstructuredContent(), &xrd)
	if err != nil {
		return nil, fmt.Errorf("failed to convert v2 XRD to v1: %w", err)
	}

	// Add annotations to track original v2 structure
	if xrd.Annotations == nil {
		xrd.Annotations = make(map[string]string)
	}
	xrd.Annotations["komoplane.io/retrieved-api-version"] = "apiextensions.crossplane.io/v2"
	xrd.Annotations["komoplane.io/original-api-version"] = "apiextensions.crossplane.io/v2"

	// Handle scope field from v2 if present
	if spec, found := unstructured.Object["spec"].(map[string]interface{}); found {
		if scope, scopeFound := spec["scope"].(string); scopeFound {
			xrd.Annotations["komoplane.io/v2-scope"] = scope
			log.Debugf("XRD %s has v2 scope: %s", xrd.Name, scope)
		}
	}

	// Ensure we show the correct API version in the response
	xrd.APIVersion = "apiextensions.crossplane.io/v2"

	return &xrd, nil
}

// GetSupportedVersions returns the list of discovered API versions
func (c *V2CompatibleXRDClient) GetSupportedVersions() []string {
	return c.supportedVersions
}

// GetPreferredVersion returns the preferred API version being used
func (c *V2CompatibleXRDClient) GetPreferredVersion() string {
	return c.preferredVersion
}
