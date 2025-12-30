package crossplane

import (
	"context"

	v1 "github.com/crossplane/crossplane/apis/apiextensions/v1"
	"github.com/komodorio/komoplane/pkg/backend/utils"
	log "github.com/sirupsen/logrus"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/rest"
)

type XRDInterface interface {
	List(ctx context.Context) (*v1.CompositeResourceDefinitionList, error)
	Get(ctx context.Context, name string) (*v1.CompositeResourceDefinition, error)
}

type xrdClient struct {
	restClient rest.Interface
	config     *rest.Config
}

func (c *xrdClient) List(ctx context.Context) (*v1.CompositeResourceDefinitionList, error) {
	// First try to discover what API versions are available
	discoveryClient, err := discovery.NewDiscoveryClientForConfig(c.config)
	if err != nil {
		log.Warnf("Failed to create discovery client: %v", err)
	} else {
		// Check what versions of CompositeResourceDefinition are available
		apiGroups, err := discoveryClient.ServerGroups()
		if err == nil {
			for _, group := range apiGroups.Groups {
				if group.Name == "apiextensions.crossplane.io" {
					log.Debugf("Found Crossplane apiextensions group with versions: %v", group.Versions)
					for _, version := range group.Versions {
						log.Debugf("Available version: %s", version.Version)
					}
				}
			}
		}
	}

	result := v1.CompositeResourceDefinitionList{}
	err = c.restClient.
		Get().
		Resource(utils.Plural(v1.CompositeResourceDefinitionKind)).
		Do(ctx).
		Into(&result)

	if err != nil {
		log.Debugf("Failed to list XRDs with v1 API: %v", err)
	} else {
		log.Debugf("Successfully listed %d XRDs using v1 API", len(result.Items))
		// Check each XRD to see what version it was originally created with
		for i, xrd := range result.Items {
			if xrd.Annotations != nil {
				if originalVersion, exists := xrd.Annotations["crossplane.io/original-api-version"]; exists {
					log.Debugf("XRD %s was originally created with API version: %s", xrd.Name, originalVersion)
				}
			}
			// Ensure we're displaying the most appropriate API version
			if xrd.APIVersion == "" {
				result.Items[i].APIVersion = "apiextensions.crossplane.io/v1"
			}
		}
	}

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

	if err != nil {
		log.Debugf("Failed to get XRD %s with v1 API: %v", name, err)
	} else {
		log.Debugf("Successfully retrieved XRD %s using v1 API", name)
		// Check if this XRD has information about its original version
		if result.Annotations != nil {
			if originalVersion, exists := result.Annotations["crossplane.io/original-api-version"]; exists {
				log.Debugf("XRD %s was originally created with API version: %s", name, originalVersion)
			}
		}
		// Ensure we're displaying the most appropriate API version
		if result.APIVersion == "" {
			result.APIVersion = "apiextensions.crossplane.io/v1"
		}
	}

	return &result, err
}
