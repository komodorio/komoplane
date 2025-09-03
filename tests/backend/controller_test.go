package backend_test

import (
	"testing"

	"github.com/komodorio/komoplane/pkg/backend"
	"github.com/stretchr/testify/assert"
	v1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestManagedResourceDetection(t *testing.T) {
	// Create a test CRD that represents an S3 bucket from Upbound
	s3BucketCRD := &v1.CustomResourceDefinition{
		ObjectMeta: metav1.ObjectMeta{
			Name: "buckets.s3.aws.upbound.io",
			Labels: map[string]string{
				"crossplane.io/scope": "managed",
			},
		},
		Spec: v1.CustomResourceDefinitionSpec{
			Group: "s3.aws.upbound.io",
			Names: v1.CustomResourceDefinitionNames{
				Kind:   "Bucket",
				Plural: "buckets",
			},
			Versions: []v1.CustomResourceDefinitionVersion{
				{
					Name:   "v1beta1",
					Served: true,
					Storage: true,
				},
			},
		},
	}

	// Test that it's correctly identified as a managed resource CRD
	assert.True(t, backend.IsManagedResourceCRD(s3BucketCRD), "S3 bucket CRD should be identified as managed resource")

	// Test provider name extraction
	providerName := backend.ExtractProviderNameFromCRD(s3BucketCRD)
	assert.Equal(t, "upbound-provider-aws", providerName, "Should extract correct provider name")

	// Test provider pattern matching
	assert.True(t, backend.MatchesProviderPattern("upbound-provider-aws", "upbound-provider-aws"), "Exact match should work")
	assert.True(t, backend.MatchesProviderPattern("provider-aws-s3", "upbound-provider-aws"), "Partial match should work")
	assert.False(t, backend.MatchesProviderPattern("provider-gcp", "upbound-provider-aws"), "Different providers should not match")
}

func TestNonManagedResourceCRD(t *testing.T) {
	// Create a test CRD that's not a managed resource
	regularCRD := &v1.CustomResourceDefinition{
		ObjectMeta: metav1.ObjectMeta{
			Name: "deployments.apps",
		},
		Spec: v1.CustomResourceDefinitionSpec{
			Group: "apps",
			Names: v1.CustomResourceDefinitionNames{
				Kind:   "Deployment",
				Plural: "deployments",
			},
		},
	}

	// Test that it's correctly identified as NOT a managed resource CRD
	assert.False(t, backend.IsManagedResourceCRD(regularCRD), "Regular Kubernetes CRD should not be identified as managed resource")

	// Test that no provider name is extracted
	providerName := backend.ExtractProviderNameFromCRD(regularCRD)
	assert.Empty(t, providerName, "Should not extract provider name from non-managed resource CRD")
}

func TestVariousProviderPatterns(t *testing.T) {
	testCases := []struct {
		group            string
		expectedProvider string
		shouldMatch      bool
	}{
		{
			group:            "s3.aws.upbound.io",
			expectedProvider: "upbound-provider-aws",
			shouldMatch:      true,
		},
		{
			group:            "compute.gcp.upbound.io",
			expectedProvider: "upbound-provider-gcp",
			shouldMatch:      true,
		},
		{
			group:            "network.azure.upbound.io", 
			expectedProvider: "upbound-provider-azure",
			shouldMatch:      true,
		},
		{
			group:            "s3.aws.crossplane.io",
			expectedProvider: "provider-aws",
			shouldMatch:      true,
		},
		{
			group:            "some.random.io",
			expectedProvider: "",
			shouldMatch:      false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.group, func(t *testing.T) {
			crd := &v1.CustomResourceDefinition{
				ObjectMeta: metav1.ObjectMeta{
					Name: "test." + tc.group,
				},
				Spec: v1.CustomResourceDefinitionSpec{
					Group: tc.group,
				},
			}

			providerName := backend.ExtractProviderNameFromCRD(crd)
			if tc.shouldMatch {
				assert.Equal(t, tc.expectedProvider, providerName, "Should extract correct provider name for group: "+tc.group)
			} else {
				assert.Empty(t, providerName, "Should not extract provider name for group: "+tc.group)
			}
		})
	}
}
