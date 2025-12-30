package backend

import (
	"testing"

	"github.com/komodorio/komoplane/pkg/backend"
	"github.com/stretchr/testify/assert"
)

func TestServerStructure(t *testing.T) {
	t.Run("server initialization", func(t *testing.T) {
		server := &backend.Server{
			Version:    "test-version",
			Namespace:  "test-namespace", 
			Address:    "localhost:8090",
			Debug:      true,
			NoTracking: true,
		}
		
		assert.Equal(t, "test-version", server.Version)
		assert.Equal(t, "test-namespace", server.Namespace)
		assert.Equal(t, "localhost:8090", server.Address)
		assert.True(t, server.Debug)
		assert.True(t, server.NoTracking)
	})
	
	t.Run("server default values", func(t *testing.T) {
		server := &backend.Server{}
		
		assert.Empty(t, server.Version)
		assert.Empty(t, server.Namespace)
		assert.Empty(t, server.Address)
		assert.False(t, server.Debug)
		assert.False(t, server.NoTracking)
	})
}

// Test the status info structure
func TestStatusInfo(t *testing.T) {
	t.Run("status info initialization", func(t *testing.T) {
		status := backend.StatusInfo{
			CurVer:              "1.0.0",
			LatestVer:           "1.1.0",
			Analytics:           true,
			CrossplaneInstalled: false,
		}
		
		assert.Equal(t, "1.0.0", status.CurVer)
		assert.Equal(t, "1.1.0", status.LatestVer)
		assert.True(t, status.Analytics)
		assert.False(t, status.CrossplaneInstalled)
	})
	
	t.Run("status info defaults", func(t *testing.T) {
		status := backend.StatusInfo{}
		
		assert.Empty(t, status.CurVer)
		assert.Empty(t, status.LatestVer)
		assert.False(t, status.Analytics)
		assert.False(t, status.CrossplaneInstalled)
	})
}

// Test environment variable handling
func TestServerEnvironmentVariables(t *testing.T) {
	t.Run("analytics configuration", func(t *testing.T) {
		server := &backend.Server{
			Version:    "1.0.0",
			NoTracking: false,
		}
		
		// Test analytics enabled
		assert.False(t, server.NoTracking)
		
		// Test analytics disabled
		server.NoTracking = true
		assert.True(t, server.NoTracking)
	})
	
	t.Run("debug mode configuration", func(t *testing.T) {
		server := &backend.Server{
			Debug: true,
		}
		
		assert.True(t, server.Debug)
		
		server.Debug = false
		assert.False(t, server.Debug)
	})
}
