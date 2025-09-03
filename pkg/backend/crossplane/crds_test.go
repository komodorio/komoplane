package crossplane

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/rest"
)

func TestCRDClient_List_AllNamespaces(t *testing.T) {
	// Create a test server that simulates the Kubernetes API
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify that the request is made to list resources across all namespaces
		assert.Equal(t, "GET", r.Method)
		assert.Contains(t, r.URL.Path, "/apis/test.example.com/v1/testresources")
		
		// Check that namespace parameter is empty (meaning all namespaces)
		namespace := r.URL.Query().Get("namespace")
		assert.Empty(t, namespace, "Expected empty namespace parameter for all-namespaces query")

		// Return a mock response with resources from different namespaces
		response := unstructured.UnstructuredList{
			Items: []unstructured.Unstructured{
				{
					Object: map[string]interface{}{
						"apiVersion": "test.example.com/v1",
						"kind":       "TestResource",
						"metadata": map[string]interface{}{
							"name":      "resource-ns1",
							"namespace": "namespace1",
						},
					},
				},
				{
					Object: map[string]interface{}{
						"apiVersion": "test.example.com/v1",
						"kind":       "TestResource", 
						"metadata": map[string]interface{}{
							"name":      "resource-ns2",
							"namespace": "namespace2",
						},
					},
				},
				{
					Object: map[string]interface{}{
						"apiVersion": "test.example.com/v1",
						"kind":       "TestResource",
						"metadata": map[string]interface{}{
							"name": "cluster-scoped-resource",
							// No namespace for cluster-scoped resource
						},
					},
				},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer testServer.Close()

	// Create a rest config pointing to our test server
	config := &rest.Config{
		Host: testServer.URL,
	}

	// Create the CRD client
	client := &crdClient{cfg: config}

	// Test the List method
	gvk := schema.GroupVersionKind{
		Group:   "test.example.com",
		Version: "v1",
		Kind:    "testresources",
	}

	result, err := client.List(context.Background(), gvk)
	
	// Assertions
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result.Items, 3)

	// Verify we got resources from different namespaces
	namespaces := make(map[string]bool)
	for _, item := range result.Items {
		if ns, exists := item.Object["metadata"].(map[string]interface{})["namespace"]; exists {
			namespaces[ns.(string)] = true
		}
	}
	
	assert.True(t, namespaces["namespace1"], "Should include resources from namespace1")
	assert.True(t, namespaces["namespace2"], "Should include resources from namespace2")
}

func TestCRDClient_List_EmptyNamespaceQueryParameter(t *testing.T) {
	// Test that verifies the empty namespace parameter is correctly sent
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// The key assertion: verify that when we want all namespaces,
		// the request URL contains an empty namespace parameter or no namespace parameter
		url := r.URL.String()
		
		// The request should NOT contain "namespaces/specific-namespace" in the path
		assert.NotContains(t, url, "namespaces/", "Request should not target a specific namespace")
		
		// Return minimal valid response
		response := unstructured.UnstructuredList{Items: []unstructured.Unstructured{}}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer testServer.Close()

	config := &rest.Config{Host: testServer.URL}
	client := &crdClient{cfg: config}

	gvk := schema.GroupVersionKind{
		Group:   "test.crossplane.io",
		Version: "v1",
		Kind:    "managedresources",
	}

	_, err := client.List(context.Background(), gvk)
	require.NoError(t, err)
}

func TestCRDClient_List_ErrorHandling(t *testing.T) {
	// Test server that returns an error
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Internal Server Error"))
	}))
	defer testServer.Close()

	config := &rest.Config{Host: testServer.URL}
	client := &crdClient{cfg: config}

	gvk := schema.GroupVersionKind{
		Group:   "test.crossplane.io",
		Version: "v1",
		Kind:    "managedresources",
	}

	result, err := client.List(context.Background(), gvk)
	
	// Should handle errors gracefully
	assert.Error(t, err)
	assert.Nil(t, result)
}

func TestCRDClient_List_InvalidJSON(t *testing.T) {
	// Test server that returns invalid JSON
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("invalid json"))
	}))
	defer testServer.Close()

	config := &rest.Config{Host: testServer.URL}
	client := &crdClient{cfg: config}

	gvk := schema.GroupVersionKind{
		Group:   "test.crossplane.io",
		Version: "v1",
		Kind:    "managedresources",
	}

	result, err := client.List(context.Background(), gvk)
	
	// Should handle JSON parsing errors
	assert.Error(t, err)
	assert.Nil(t, result)
}
