package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"
)

// TestAPIEndpoints tests our key API changes
func TestAPIEndpoints(t *testing.T) {
	// This integration test connects to a running komoplane instance
	baseURL := "http://localhost:8090"
	
	// Wait for komoplane to be available
	for i := 0; i < 30; i++ {
		resp, err := http.Get(baseURL + "/api/xrds")
		if err == nil && resp.StatusCode == 200 {
			resp.Body.Close()
			break
		}
		if resp != nil {
			resp.Body.Close()
		}
		if i == 29 {
			t.Skip("Komoplane not available at " + baseURL + " - skipping integration tests")
			return
		}
		time.Sleep(1 * time.Second)
	}
	
	t.Run("TestCompositionEndpoint", func(t *testing.T) {
		// Test the new composition endpoint we added
		resp, err := http.Get(baseURL + "/api/composition/dynamo-with-bucket-with-app-v1")
		if err != nil {
			t.Skipf("Skipping test - komoplane not running: %v", err)
			return
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
		
		var composition map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&composition); err != nil {
			t.Errorf("Failed to decode composition response: %v", err)
		}
		
		// Check that composition has expected fields
		if metadata, ok := composition["metadata"].(map[string]interface{}); ok {
			if name, ok := metadata["name"].(string); ok {
				if name != "dynamo-with-bucket-with-app-v1" {
					t.Errorf("Expected composition name 'dynamo-with-bucket-with-app-v1', got '%s'", name)
				}
			} else {
				t.Error("Composition metadata.name not found or not a string")
			}
		} else {
			t.Error("Composition metadata not found")
		}
		
		fmt.Printf("✅ Composition endpoint test passed\n")
	})
	
	t.Run("TestCompositeResourceWithComposition", func(t *testing.T) {
		// Test that composite resource now includes composition data
		resp, err := http.Get(baseURL + "/api/composite/database.ns.com/v1beta1/NoSQL/nosql-database-001-eu?full=1")
		if err != nil {
			t.Skipf("Skipping test - komoplane not running: %v", err)
			return
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
		
		var compositeResource map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&compositeResource); err != nil {
			t.Errorf("Failed to decode composite resource response: %v", err)
		}
		
		// Check that composition field is populated (was null before our fix)
		if composition, exists := compositeResource["composition"]; exists && composition != nil {
			if compMap, ok := composition.(map[string]interface{}); ok {
				if metadata, ok := compMap["metadata"].(map[string]interface{}); ok {
					if name, ok := metadata["name"].(string); ok {
						if name == "dynamo-with-bucket-with-app-v1" {
							fmt.Printf("✅ Composite resource composition field test passed\n")
						} else {
							t.Errorf("Expected composition name 'dynamo-with-bucket-with-app-v1', got '%s'", name)
						}
					} else {
						t.Error("Composition name not found in composite resource")
					}
				} else {
					t.Error("Composition metadata not found in composite resource")
				}
			} else {
				t.Error("Composition is not a valid object in composite resource")
			}
		} else {
			t.Error("Composition field is missing or null in composite resource response")
		}
	})
	
	t.Run("TestNamespaceSearch", func(t *testing.T) {
		// Test that namespace search is working (resource is in vela-app-dev namespace)
		resp, err := http.Get(baseURL + "/api/composite/database.ns.com/v1beta1/NoSQL/nosql-database-001-eu?full=1")
		if err != nil {
			t.Skipf("Skipping test - komoplane not running: %v", err)
			return
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
		
		var compositeResource map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&compositeResource); err != nil {
			t.Errorf("Failed to decode composite resource response: %v", err)
		}
		
		// Check that resource was found in the correct namespace
		if metadata, ok := compositeResource["metadata"].(map[string]interface{}); ok {
			if namespace, ok := metadata["namespace"].(string); ok {
				if namespace == "vela-app-dev" {
					fmt.Printf("✅ Namespace search test passed - found resource in %s namespace\n", namespace)
				} else {
					t.Errorf("Expected namespace 'vela-app-dev', got '%s'", namespace)
				}
			} else {
				t.Error("Namespace not found in composite resource metadata")
			}
		} else {
			t.Error("Metadata not found in composite resource")
		}
	})
}

// TestV2Compatibility tests our v2 API compatibility
func TestV2Compatibility(t *testing.T) {
	baseURL := "http://localhost:8090"
	
	t.Run("TestXRDsEndpoint", func(t *testing.T) {
		resp, err := http.Get(baseURL + "/api/xrds")
		if err != nil {
			t.Skipf("Skipping test - komoplane not running: %v", err)
			return
		}
		defer resp.Body.Close()
		
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
		
		var xrds map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&xrds); err != nil {
			t.Errorf("Failed to decode XRDs response: %v", err)
		}
		
		// Check that we have XRDs in the response
		if items, ok := xrds["items"].([]interface{}); ok && len(items) > 0 {
			fmt.Printf("✅ XRDs endpoint test passed - found %d XRDs\n", len(items))
		} else {
			t.Error("No XRDs found in response")
		}
	})
}
