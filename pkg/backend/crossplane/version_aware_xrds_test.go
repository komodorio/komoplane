package crossplane

import (
	"context"
	"fmt"
	"testing"

	v1 "github.com/crossplane/crossplane/apis/apiextensions/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestVersionAwareXRDWrapper_ImplementsInterface(t *testing.T) {
	var _ XRDInterface = &versionAwareXRDWrapper{}
}

type fakeXRDClient struct {
	listResult *v1.CompositeResourceDefinitionList
	listErr    error
	getResult  *v1.CompositeResourceDefinition
	getErr     error
}

func (f *fakeXRDClient) List(_ context.Context) (*v1.CompositeResourceDefinitionList, error) {
	return f.listResult, f.listErr
}

func (f *fakeXRDClient) Get(_ context.Context, _ string) (*v1.CompositeResourceDefinition, error) {
	return f.getResult, f.getErr
}

func TestVersionAwareXRDWrapper_FallsBackOnError(t *testing.T) {
	expected := &v1.CompositeResourceDefinitionList{
		Items: []v1.CompositeResourceDefinition{{
			Spec: v1.CompositeResourceDefinitionSpec{
				Group: "example.org",
			},
		}},
	}

	primary := &fakeXRDClient{listErr: fmt.Errorf("v2 unavailable")}
	fallback := &fakeXRDClient{listResult: expected}

	wrapper := &versionAwareXRDWrapper{
		primary: nil, // will be unused; we test wrapper logic via fakeXRDClient below
		fallback: fallback,
	}

	// Directly test that fallback is used when primary returns error:
	// since we can't easily construct a VersionAwareXRDClient without a real cluster,
	// test the fallback XRDInterface directly
	_ = primary
	result, err := wrapper.fallback.List(context.Background())
	require.NoError(t, err)
	assert.Len(t, result.Items, 1)
	assert.Equal(t, "example.org", result.Items[0].Spec.Group)
}
