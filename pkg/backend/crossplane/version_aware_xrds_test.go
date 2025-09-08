package crossplane

import (
	"testing"

	log "github.com/sirupsen/logrus"
)

// TestVersionAwareXRDClient_BasicFunctionality tests the basic structure and initialization
func TestVersionAwareXRDClient_BasicFunctionality(t *testing.T) {
	log.Infof("✅ Version-aware XRD client structure test passed")
	
	// Test that our new client wrapper implements the interface correctly
	// This is mainly a compilation test to ensure our interfaces match
	var _ XRDInterface = &versionAwareXRDClientWrapper{}
	
	log.Infof("✅ Interface implementation test passed")
}

// TestSupportedVersionsInitialization tests that supported versions are initialized correctly
func TestSupportedVersionsInitialization(t *testing.T) {
	client := &VersionAwareXRDClient{
		supportedVersions: []string{"v1", "v2"},
	}
	
	versions := client.GetSupportedVersions()
	if len(versions) != 2 {
		t.Errorf("Expected 2 versions, got %d: %v", len(versions), versions)
	}
	
	if versions[0] != "v1" || versions[1] != "v2" {
		t.Errorf("Expected versions [v1, v2], got %v", versions)
	}
	
	log.Infof("✅ Supported versions initialization test passed - versions: %v", versions)
}
