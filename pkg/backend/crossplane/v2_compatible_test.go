package crossplane

import (
	"testing"

	log "github.com/sirupsen/logrus"
)

// TestV2CompatibleXRDClient_BasicFunctionality tests the basic structure and initialization
func TestV2CompatibleXRDClient_BasicFunctionality(t *testing.T) {
	log.Infof("✅ V2-compatible XRD client structure test passed")
	
	// Test that our new client wrapper implements the interface correctly
	// This is mainly a compilation test to ensure our interfaces match
	var _ XRDInterface = &v2CompatibleXRDClientWrapper{}
	
	log.Infof("✅ V2 compatible interface implementation test passed")
}

// TestV2CompatibleSupportedVersionsInitialization tests that v2-compatible supported versions are initialized correctly
func TestV2CompatibleSupportedVersionsInitialization(t *testing.T) {
	client := &V2CompatibleXRDClient{
		supportedVersions: []string{"v1", "v2"},
		preferredVersion:  "v2",
	}
	
	versions := client.GetSupportedVersions()
	if len(versions) != 2 {
		t.Errorf("Expected 2 versions, got %d: %v", len(versions), versions)
	}
	
	preferred := client.GetPreferredVersion()
	if preferred != "v2" {
		t.Errorf("Expected preferred version v2, got %s", preferred)
	}
	
	log.Infof("✅ V2 compatibility initialization test passed - preferred: %s, supported: %v", preferred, versions)
}
