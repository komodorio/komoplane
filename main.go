package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/signal"
	"syscall"

	"github.com/jessevdk/go-flags"
	"github.com/komodorio/komoplane/pkg/backend"
	"github.com/pkg/errors"
	log "github.com/sirupsen/logrus"
)

var (
	version = "0.0.0"
	commit  = "none"
	date    = "unknown"
)

type options struct {
	Version    bool   `long:"version" description:"Show tool version"`
	Verbose    bool   `short:"v" long:"verbose" description:"Show verbose debug information"`
	NoTracking bool   `long:"no-analytics" description:"Disable user analytics (Heap, DataDog etc.)"`
	BindHost   string `long:"bind" description:"Host binding to start server (default: localhost)"` // default should be printed but not assigned as the precedence: flag > env > default
	Port       uint   `short:"p" long:"port" description:"Port to start server on" default:"8090"`
	Namespace  string `short:"n" long:"namespace" description:"Namespace for operations"`
}

func main() {
	err := os.Setenv("KP_VERSION", version) // for anyone willing to access it
	if err != nil {
		fmt.Println("Failed to remember app version because of error: " + err.Error())
	}

	opts := parseFlags()
	if opts.BindHost == "" {
		host := os.Getenv("KP_BIND")
		if host == "" {
			host = "localhost"
		}
		opts.BindHost = host
	}

	opts.Verbose = opts.Verbose || os.Getenv("DEBUG") != ""
	setupLogging(opts.Verbose)

	server := backend.Server{
		Version:    version,
		Namespace:  opts.Namespace,
		Address:    fmt.Sprintf("%s:%d", opts.BindHost, opts.Port),
		Debug:      opts.Verbose,
		NoTracking: opts.NoTracking,
	}

	ctx, cancel := context.WithCancel(context.Background())

	osSignal := make(chan os.Signal, 1)
	signal.Notify(osSignal, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		oscall := <-osSignal
		log.Warnf("Stopping on signal: %s\n", oscall)
		cancel()
	}()

	address, webServerDone, err := server.StartServer(ctx)
	if err != nil {
		if errors.Is(err, io.EOF) { // FIXME: revise this
			log.Debugf("Full error: %+v", err)
			log.Errorf("No Kubernetes cluster connection possible. Make sure you have valid kubeconfig file or run dashboard from inside cluster. See https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/")
			os.Exit(1)
		} else {
			log.Fatalf("Failed to start: %+v", err)
		}
	}

	if !opts.NoTracking {
		log.Infof("User analytics is collected to improve the quality, disable it with --no-analytics")
	}

	log.Infof("Access web UI at: %s", address)

	<-webServerDone
	log.Infof("Done.")
}

func parseFlags() options {
	opts := options{}
	args, err := flags.Parse(&opts)
	if err != nil {
		if e, ok := err.(*flags.Error); ok {
			if e.Type == flags.ErrHelp {
				os.Exit(0)
			}
		}

		// we rely on default behavior to print the problem inside `flags` library
		os.Exit(1)
	}

	if opts.Version {
		fmt.Println(version)
		os.Exit(0)
	}

	if len(args) > 0 {
		fmt.Println("The program does not take arguments, see --help for usage")
		os.Exit(1)
	}
	return opts
}

func setupLogging(verbose bool) {
	if verbose {
		log.SetLevel(log.DebugLevel)
		log.Debugf("Debug logging is enabled")
	} else {
		log.SetLevel(log.InfoLevel)
	}
	log.Infof("komoplane, version %s (%s @ %s)", version, commit, date)
}
