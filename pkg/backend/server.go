package backend

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/hashicorp/go-version"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

type ControlChan = chan struct{}

type Server struct {
	Version    string
	Namespace  string
	Address    string
	Debug      bool
	NoTracking bool
}

func (s *Server) StartServer(ctx context.Context) (string, ControlChan, error) {
	cfg, err := getK8sConfig()
	if err != nil {
		return "", nil, err
	}

	data, err := NewController(ctx, cfg, s.Namespace, s.Version)
	if err != nil {
		return "", nil, err
	}

	isDevModeWithAnalytics := os.Getenv("HD_DEV_ANALYTICS") == "true"
	data.StatusInfo.CurVer = os.Getenv("KP_VERSION")
	data.StatusInfo.LatestVer = os.Getenv("KP_VERSION")
	if s.Debug {
		data.StatusInfo.LatestVer += ".1-dev" // for testing the notifications
	}
	data.StatusInfo.Analytics = (!s.NoTracking && s.Version != "0.0.0") || isDevModeWithAnalytics

	if data.StatusInfo.Analytics {
		log.Infof("User analytics is collected to improve the quality, disable it with --no-analytics")
	}

	go checkUpgrade(&data.StatusInfo)

	api := NewRouter(data, s.Debug)
	done := s.startBackgroundServer(api, ctx)

	return "http://" + s.Address, done, nil
}

func (s *Server) startBackgroundServer(routes *echo.Echo, ctx context.Context) ControlChan {
	done := make(ControlChan)
	server := &http.Server{
		Addr:    s.Address,
		Handler: routes,
	}

	go func() {
		<-ctx.Done()
		err := server.Shutdown(context.Background())
		if err != nil {
			log.Warnf("Had problems shutting down the server: %s", err)
		}
		log.Infof("Web server has been shut down.")
	}()

	go func() {
		err := server.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			log.Warnf("Looks like port is busy for %s", s.Address)
			panic(err)
		}
		done <- struct{}{}
	}()

	return done
}

func checkUpgrade(d *StatusInfo) { // TODO: check it once an hour
	url := "https://api.github.com/repos/komodorio/komoplane/releases/latest"
	type GHRelease struct {
		Name string `json:"name"`
	}

	var myClient = &http.Client{Timeout: 5 * time.Second}
	r, err := myClient.Get(url)
	if err != nil {
		log.Warnf("Failed to check for new version: %s", err)
		return
	}
	defer func() { _ = r.Body.Close() }()

	if r.StatusCode >= http.StatusBadRequest {
		log.Warnf("Failed to check for new version: status %d", r.StatusCode)
	} else {
		target := new(GHRelease)
		err = json.NewDecoder(r.Body).Decode(target)
		if err != nil {
			log.Warnf("Failed to decode new release version: %s", err)
		} else {
			d.LatestVer = target.Name
		}
	}

	v1, err := version.NewVersion(d.CurVer)
	if err != nil {
		log.Warnf("Failed to parse CurVer: %s", err)
		v1 = &version.Version{}
	}

	v2, err := version.NewVersion(d.LatestVer)
	if err != nil {
		log.Warnf("Failed to parse RepoLatestVer: %s", err)
	} else {
		if v1.LessThan(v2) {
			log.Warnf("Newer version is available: %s", d.LatestVer)
			log.Warnf("Upgrade instructions: https://github.com/komodorio/komoplane#installing")
		} else {
			log.Debugf("Got latest version from GH: %s", d.LatestVer)
		}
	}
}
