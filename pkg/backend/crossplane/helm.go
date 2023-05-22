package crossplane

import (
	_ "github.com/crossplane-contrib/provider-helm/apis/release"
	_ "github.com/crossplane-contrib/provider-helm/apis/v1alpha1"
	_ "github.com/crossplane-contrib/provider-helm/apis/v1beta1"
)

func init() {
}
