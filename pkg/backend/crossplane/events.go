package crossplane

// TODO: maybe it's not for `crossplane`

import (
	"context"
	"k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

type EventsInterface interface {
	List(ctx context.Context, name string, kind string, group string, version string) (*v1.EventList, error)
}

type eventsClient struct {
	clientset *kubernetes.Clientset
}

func (c *eventsClient) List(ctx context.Context, name string, kind string, group string, version string) (*v1.EventList, error) {
	meta := metav1.TypeMeta{
		Kind:       kind,
		APIVersion: version,
	}
	options := metav1.ListOptions{
		FieldSelector: "involvedObject.name=" + name,
		TypeMeta:      meta,
	}
	events, err := c.clientset.CoreV1().Events("").List(context.TODO(), options)
	return events, err
}

func NewEventsClient(c *rest.Config) (EventsInterface, error) {
	clientset, err := kubernetes.NewForConfig(c)
	if err != nil {
		return nil, err
	}

	return &eventsClient{
		clientset: clientset,
	}, nil
}
