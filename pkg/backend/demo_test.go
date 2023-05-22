package backend

import (
	"context"
	"github.com/komodorio/komoplane/pkg/backend/crossplane"
	"log"
	"testing"
	"time"

	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func TestSome(t *testing.T) {
	ctx, _ := context.WithTimeout(context.Background(), 1*time.Second)

	var config *rest.Config
	var err error

	config, err = getConfig(t)
	if err != nil {
		t.Fatal(err)
	}

	//err = AddToScheme(scheme.Scheme)
	//if err != nil {
	//	t.Fatal(err)
	//}

	clientSet1, err := crossplane.NewEXTv1Client(config)
	if err != nil {
		t.Fatalf("%+v", err)
	}

	xrds, err := clientSet1.XRDs().List(ctx)
	if err != nil {
		t.Fatalf("%+v", err)
	}

	t.Logf("%v", xrds)

	clientSet, err := crossplane.NewAPIv1Client(config)
	if err != nil {
		t.Fatalf("%+v", err)
	}

	providers, err := clientSet.Providers().List(ctx)
	if err != nil {
		t.Fatalf("%+v", err)
	}

	t.Logf("%v", providers)
}

func getConfig(t *testing.T) (*rest.Config, error) {
	kubeconfig := ""
	if kubeconfig != "" {
		log.Printf("using in-cluster configuration")
		return rest.InClusterConfig()
	} else {
		loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
		// if you want to change the loading rules (which files in which order), you can do so here

		configOverrides := &clientcmd.ConfigOverrides{}
		// if you want to change override values or bind them to flags, there are methods to help you

		kubeConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides)
		return kubeConfig.ClientConfig()
	}
}
