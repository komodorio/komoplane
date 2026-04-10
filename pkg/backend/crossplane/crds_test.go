package crossplane

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	xpv1 "github.com/crossplane/crossplane/apis/apiextensions/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	v1 "k8s.io/api/core/v1"
	extv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/rest"
)

type mockXRDClient struct {
	items []xpv1.CompositeResourceDefinition
}

func (m *mockXRDClient) List(_ context.Context) (*xpv1.CompositeResourceDefinitionList, error) {
	return &xpv1.CompositeResourceDefinitionList{Items: m.items}, nil
}

func (m *mockXRDClient) Get(_ context.Context, _ string) (*xpv1.CompositeResourceDefinition, error) {
	return nil, nil
}

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
		_ = json.NewEncoder(w).Encode(response)
	}))
	defer testServer.Close()

	client := &crdClient{cfg: &rest.Config{Host: testServer.URL}}
	gvk := schema.GroupVersionKind{Group: "test.example.com", Version: "v1", Kind: "testresources"}

	result, err := client.List(context.Background(), gvk)
	require.NoError(t, err)
	assert.Len(t, result.Items, 3)
}

func TestCRDClient_Get_Namespaced(t *testing.T) {
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.Contains(t, r.URL.Path, "namespaces/default", "should target the specific namespace")
		assert.Contains(t, r.URL.Path, "xapps/reference-data")

		response := map[string]interface{}{
			"apiVersion": "vpi.test.io/v1",
			"kind":       "XApp",
			"metadata":   map[string]interface{}{"name": "reference-data", "namespace": "default"},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
	}))
	defer testServer.Close()

	xrds := &mockXRDClient{items: []xpv1.CompositeResourceDefinition{
		{Spec: xpv1.CompositeResourceDefinitionSpec{
			Group: "vpi.test.io",
			Names: extv1.CustomResourceDefinitionNames{Kind: "XApp", Plural: "xapps"},
		}},
	}}
	client := &crdClient{cfg: &rest.Config{Host: testServer.URL}, XRDs: xrds}

	ref := &v1.ObjectReference{Name: "reference-data", Namespace: "default"}
	ref.SetGroupVersionKind(schema.FromAPIVersionAndKind("vpi.test.io/v1", "XApp"))

	result := &unstructured.Unstructured{}
	err := client.Get(context.Background(), result, ref)
	require.NoError(t, err)
	assert.Equal(t, "reference-data", result.GetName())
	assert.Equal(t, "default", result.GetNamespace())
}

func TestCRDClient_Get_ClusterScoped(t *testing.T) {
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.NotContains(t, r.URL.Path, "namespaces/", "should not target a specific namespace")
		assert.Contains(t, r.URL.Path, "xkomodorchartsets/my-test-set1")

		response := map[string]interface{}{
			"apiVersion": "xrd.komodor.com/v1alpha1",
			"kind":       "XKomodorChartSet",
			"metadata":   map[string]interface{}{"name": "my-test-set1"},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(response)
	}))
	defer testServer.Close()

	xrds := &mockXRDClient{items: []xpv1.CompositeResourceDefinition{
		{Spec: xpv1.CompositeResourceDefinitionSpec{
			Group: "xrd.komodor.com",
			Names: extv1.CustomResourceDefinitionNames{Kind: "XKomodorChartSet", Plural: "xkomodorchartsets"},
		}},
	}}
	client := &crdClient{cfg: &rest.Config{Host: testServer.URL}, XRDs: xrds}

	ref := &v1.ObjectReference{Name: "my-test-set1"}
	ref.SetGroupVersionKind(schema.FromAPIVersionAndKind("xrd.komodor.com/v1alpha1", "XKomodorChartSet"))

	result := &unstructured.Unstructured{}
	err := client.Get(context.Background(), result, ref)
	require.NoError(t, err)
	assert.Equal(t, "my-test-set1", result.GetName())
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
