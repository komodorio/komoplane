package crossplane

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/rest"
)

func TestCRDClient_List_AllNamespaces(t *testing.T) {
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.NotContains(t, r.URL.Path, "namespaces/", "should not target a specific namespace")

		response := map[string]interface{}{
			"apiVersion": "test.example.com/v1",
			"kind":       "TestResourceList",
			"metadata":   map[string]interface{}{"resourceVersion": "1"},
			"items": []interface{}{
				map[string]interface{}{
					"apiVersion": "test.example.com/v1",
					"kind":       "TestResource",
					"metadata":   map[string]interface{}{"name": "res-ns1", "namespace": "namespace1"},
				},
				map[string]interface{}{
					"apiVersion": "test.example.com/v1",
					"kind":       "TestResource",
					"metadata":   map[string]interface{}{"name": "res-ns2", "namespace": "namespace2"},
				},
				map[string]interface{}{
					"apiVersion": "test.example.com/v1",
					"kind":       "TestResource",
					"metadata":   map[string]interface{}{"name": "cluster-scoped"},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer testServer.Close()

	client := &crdClient{cfg: &rest.Config{Host: testServer.URL}}
	gvk := schema.GroupVersionKind{Group: "test.example.com", Version: "v1", Kind: "testresources"}

	result, err := client.List(context.Background(), gvk)
	require.NoError(t, err)
	assert.Len(t, result.Items, 3)
}

func TestCRDClient_List_ErrorHandling(t *testing.T) {
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer testServer.Close()

	client := &crdClient{cfg: &rest.Config{Host: testServer.URL}}
	gvk := schema.GroupVersionKind{Group: "test.crossplane.io", Version: "v1", Kind: "managedresources"}

	_, err := client.List(context.Background(), gvk)
	assert.Error(t, err)
}
