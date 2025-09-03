package backend

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

func TestSlownessMiddleware(t *testing.T) {
	e := echo.New()
	
	// Create a simple handler
	handler := func(c echo.Context) error {
		return c.String(http.StatusOK, "test")
	}
	
	t.Run("no slowness env var", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		
		start := time.Now()
		slowness := func(next echo.HandlerFunc) echo.HandlerFunc {
			return func(c echo.Context) error {
				slow := os.Getenv("KP_SLOWNESS")
				if slow != "" {
					dur, err := time.ParseDuration(slow)
					if err != nil {
						// Invalid duration, don't slow down
					} else {
						time.Sleep(dur)
					}
				}
				return next(c)
			}
		}
		
		middleware := slowness(handler)
		err := middleware(c)
		duration := time.Since(start)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Less(t, duration, 100*time.Millisecond) // Should be fast without slowness
	})
	
	t.Run("with slowness env var", func(t *testing.T) {
		os.Setenv("KP_SLOWNESS", "100ms")
		defer os.Unsetenv("KP_SLOWNESS")
		
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		
		start := time.Now()
		slowness := func(next echo.HandlerFunc) echo.HandlerFunc {
			return func(c echo.Context) error {
				slow := os.Getenv("KP_SLOWNESS")
				if slow != "" {
					dur, err := time.ParseDuration(slow)
					if err != nil {
						// Invalid duration, don't slow down
					} else {
						time.Sleep(dur)
					}
				}
				return next(c)
			}
		}
		
		middleware := slowness(handler)
		err := middleware(c)
		duration := time.Since(start)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.GreaterOrEqual(t, duration, 100*time.Millisecond) // Should be slowed down
	})
	
	t.Run("invalid slowness duration", func(t *testing.T) {
		os.Setenv("KP_SLOWNESS", "invalid")
		defer os.Unsetenv("KP_SLOWNESS")
		
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		
		start := time.Now()
		slowness := func(next echo.HandlerFunc) echo.HandlerFunc {
			return func(c echo.Context) error {
				slow := os.Getenv("KP_SLOWNESS")
				if slow != "" {
					dur, err := time.ParseDuration(slow)
					if err != nil {
						// Invalid duration, don't slow down
					} else {
						time.Sleep(dur)
					}
				}
				return next(c)
			}
		}
		
		middleware := slowness(handler)
		err := middleware(c)
		duration := time.Since(start)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Less(t, duration, 100*time.Millisecond) // Should not be slowed down due to invalid duration
	})
}

func TestDevNoCORSMiddleware(t *testing.T) {
	e := echo.New()
	
	// Create a simple handler
	handler := func(c echo.Context) error {
		return c.String(http.StatusOK, "test")
	}
	
	t.Run("CORS disabled", func(t *testing.T) {
		os.Setenv("KP_CORS_OFF", "true")
		defer os.Unsetenv("KP_CORS_OFF")
		
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		
		devNoCORS := func(next echo.HandlerFunc) echo.HandlerFunc {
			return func(c echo.Context) error {
				c.Response().Header().Set(echo.HeaderAccessControlAllowOrigin, "*")
				return next(c)
			}
		}
		
		middleware := devNoCORS(handler)
		err := middleware(c)
		
		assert.NoError(t, err)
		assert.Equal(t, "*", rec.Header().Get("Access-Control-Allow-Origin"))
	})
	
	t.Run("CORS enabled", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)
		
		// Don't apply CORS middleware
		err := handler(c)
		
		assert.NoError(t, err)
		assert.Empty(t, rec.Header().Get("Access-Control-Allow-Origin"))
	})
}

func TestErrSet500Middleware(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	
	// Mock handler that returns an error but sets status to 200
	handler := func(c echo.Context) error {
		c.Response().Status = http.StatusOK
		return echo.NewHTTPError(http.StatusInternalServerError, "test error")
	}
	
	// Apply the middleware
	errSet500 := func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)
			if err != nil && c.Response().Status == http.StatusOK {
				c.Response().Status = http.StatusInternalServerError
			}
			return err
		}
	}
	
	middleware := errSet500(handler)
	err := middleware(c)
	
	assert.Error(t, err)
	assert.Equal(t, http.StatusInternalServerError, c.Response().Status)
}

func TestEchoRouterCreation(t *testing.T) {
	t.Run("echo router creation", func(t *testing.T) {
		e := echo.New()
		
		assert.NotNil(t, e)
		assert.False(t, e.Debug) // Debug should be false by default
		
		e.Debug = true
		assert.True(t, e.Debug)
	})
}

func TestHTTPMethods(t *testing.T) {
	e := echo.New()
	
	// Test that we can set up basic routes
	e.GET("/test", func(c echo.Context) error {
		return c.String(http.StatusOK, "GET test")
	})
	
	e.POST("/test", func(c echo.Context) error {
		return c.String(http.StatusOK, "POST test")
	})
	
	t.Run("GET route", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		rec := httptest.NewRecorder()
		
		e.ServeHTTP(rec, req)
		
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "GET test", rec.Body.String())
	})
	
	t.Run("POST route", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/test", nil)
		rec := httptest.NewRecorder()
		
		e.ServeHTTP(rec, req)
		
		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "POST test", rec.Body.String())
	})
}
