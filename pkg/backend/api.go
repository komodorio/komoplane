package backend

import (
	"github.com/komodorio/komoplane/pkg/frontend"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	log "github.com/sirupsen/logrus"
	"io/fs"
	"net/http"
	"os"
	"time"
)

func NewRouter(data *Controller, debug bool) *echo.Echo {
	api := echo.New()
	api.Debug = debug
	if debug {
		api.Use(middleware.Recover())
	} else {

	}

	configureRoutes(data, api)
	configureStatic(api)

	api.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogStatus: true,
		LogURI:    true,
		LogMethod: true,
		LogError:  true,

		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			// FIXME: latency measurement always reports zero
			if v.Status < 400 && v.Error == nil {
				log.Infof("HTTP %d %s - %s %s", v.Status, v.Latency, v.Method, v.URI)
			} else {
				log.Warnf("HTTP %d %s - %s %s: %v", v.Status, v.Latency, v.Method, v.URI, v.Error)
			}
			return nil
		},
	}))

	api.Use(errSet500)
	//api.Use(slowness)

	if os.Getenv("KP_CORS_OFF") != "" {
		api.Use(devNoCORS)
	}

	return api
}

func slowness(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		log.Warnf("Slowing down for debugging")
		time.Sleep(1 * time.Second)
		return next(c)
	}
}

func devNoCORS(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Set(echo.HeaderAccessControlAllowOrigin, "*")
		return next(c)
	}
}

func errSet500(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		err := next(c)
		if err != nil && c.Response().Status == http.StatusOK {
			c.Response().Status = http.StatusInternalServerError
		}

		return err
	}
}

func configureRoutes(data *Controller, eng *echo.Echo) {
	eng.GET("/status", func(c echo.Context) error {
		return c.JSONPretty(http.StatusOK, data.GetStatus(), "  ")
	})

	// TODO needed? then implement
	eng.GET("/api-docs", func(c echo.Context) error { // https://github.com/OAI/OpenAPI-Specification/search?q=api-docs
		return c.Redirect(http.StatusFound, "static/api-docs.html")
	})

	api := eng.Group("/api")

	rels := api.Group("/providers")
	rels.GET("", data.GetProviders)
	rels.GET("/:name", data.GetProvider)
	rels.GET("/:name/events", data.GetProviderEvents)
	rels.GET("/:name/configs", data.GetProviderConfigs)

	claims := api.Group("/claims")
	claims.GET("", data.GetClaims)
	claims.GET("/:group/:version/:kind/:namespace/:name", data.GetClaim)

	managed := api.Group("/managed")
	managed.GET("", data.GetManaged)

	composite := api.Group("/composite")
	composite.GET("", data.GetComposite)

	compositions := api.Group("/compositions")
	compositions.GET("", data.GetCompositions)

	xrds := api.Group("/xrds")
	xrds.GET("", data.GetXRDs)
}

func configureStatic(api *echo.Echo) {
	var fsys fs.FS
	// local dev speed-up
	localDevPath := "pkg/frontend/assets"
	if _, err := os.Stat(localDevPath); err == nil {
		log.Warnf("Using local development path to serve static files")
		fsys = os.DirFS("pkg")
	} else {
		fsys = frontend.StaticFS
	}

	api.StaticFS("/", echo.MustSubFS(fsys, "frontend"))
}
