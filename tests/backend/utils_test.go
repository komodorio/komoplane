package backend

import (
	"testing"

	"github.com/komodorio/komoplane/pkg/backend/utils"
	"github.com/stretchr/testify/assert"
)

func TestPluralFunction(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
		name     string
	}{
		// Basic pluralization
		{"cat", "cats", "basic noun"},
		{"dog", "dogs", "basic noun ending in consonant"},
		{"book", "books", "basic noun ending in k"},
		
		// Words ending in s, x, z, sh, ch
		{"class", "classes", "word ending in s"},
		{"box", "boxes", "word ending in x"},
		{"buzz", "buzzes", "word ending in z"},
		{"brush", "brushes", "word ending in sh"},
		{"church", "churches", "word ending in ch"},
		{"dish", "dishes", "word ending in sh"},
		{"match", "matches", "word ending in ch"},
		
		// Words ending in y (preceded by consonant)
		{"city", "cities", "word ending in consonant + y"},
		{"baby", "babies", "word ending in consonant + y"},
		{"story", "stories", "word ending in consonant + y"},
		{"party", "parties", "word ending in consonant + y"},
		{"family", "families", "word ending in consonant + y"},
		
		// Words ending in y (preceded by vowel) - should just add s
		{"boy", "boys", "word ending in vowel + y"},
		{"day", "days", "word ending in vowel + y"},
		{"key", "keys", "word ending in vowel + y"},
		{"play", "plays", "word ending in vowel + y"},
		{"monkey", "monkeys", "word ending in vowel + y"},
		
		// Words ending in f
		{"leaf", "leaves", "word ending in f"},
		{"wolf", "wolves", "word ending in f"},
		{"shelf", "shelves", "word ending in f"},
		{"half", "halves", "word ending in f"},
		
		// Words ending in fe
		{"life", "lives", "word ending in fe"},
		{"wife", "wives", "word ending in fe"},
		{"knife", "knives", "word ending in fe"},
		
		// Words ending in o
		{"hero", "heroes", "word ending in o"},
		{"potato", "potatoes", "word ending in o"},
		{"tomato", "tomatoes", "word ending in o"},
		{"echo", "echoes", "word ending in o"},
		
		// Case sensitivity tests
		{"CAT", "cats", "uppercase input"},
		{"Dog", "dogs", "mixed case input"},
		{"BOOK", "books", "all uppercase input"},
		
		// Edge cases
		{"", "s", "empty string"},
		{"a", "as", "single character"},
		
		// Real Kubernetes resource names
		{"pod", "pods", "Kubernetes pod"},
		{"service", "services", "Kubernetes service"},
		{"deployment", "deployments", "Kubernetes deployment"},
		{"configmap", "configmaps", "Kubernetes configmap"},
		{"secret", "secrets", "Kubernetes secret"},
		{"namespace", "namespaces", "Kubernetes namespace"},
		{"node", "nodes", "Kubernetes node"},
		{"persistentvolume", "persistentvolumes", "Kubernetes PV"},
		{"persistentvolumeclaim", "persistentvolumeclaims", "Kubernetes PVC"},
		
		// Crossplane resource names
		{"provider", "providers", "Crossplane provider"},
		{"composition", "compositions", "Crossplane composition"},
		{"claim", "claims", "Crossplane claim"},
		{"composite", "composites", "Crossplane composite"},
		{"managed", "manageds", "Crossplane managed"},
		
		// Words that might be tricky
		{"analysis", "analysises", "word ending in sis"},
		{"database", "databases", "word ending in se"},
		{"response", "responses", "word ending in se"},
		{"index", "indexes", "word ending in x"},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := utils.Plural(tc.input)
			assert.Equal(t, tc.expected, result, "Expected %s to pluralize to %s, got %s", tc.input, tc.expected, result)
		})
	}
}

func TestPluralFunctionEdgeCases(t *testing.T) {
	t.Run("special characters", func(t *testing.T) {
		// Test with strings containing special characters
		result := utils.Plural("test-name")
		assert.Equal(t, "test-names", result)
		
		result = utils.Plural("test_name")
		assert.Equal(t, "test_names", result)
		
		result = utils.Plural("test.name")
		assert.Equal(t, "test.names", result)
	})
	
	t.Run("numeric strings", func(t *testing.T) {
		result := utils.Plural("123")
		assert.Equal(t, "123s", result)
		
		result = utils.Plural("v1")
		assert.Equal(t, "v1s", result)
	})
	
	t.Run("very long strings", func(t *testing.T) {
		longString := "verylongresourcenamethatexceedstypicallimits"
		result := utils.Plural(longString)
		// The string ends with 's', so it should get 'es' appended according to pluralization rules
		assert.Equal(t, longString+"es", result)
	})
}

func TestPluralFunctionConsistency(t *testing.T) {
	t.Run("idempotency test", func(t *testing.T) {
		// Test that running plural multiple times gives consistent results
		input := "service"
		result1 := utils.Plural(input)
		result2 := utils.Plural(input)
		assert.Equal(t, result1, result2, "Plural function should be deterministic")
	})
	
	t.Run("different case variations", func(t *testing.T) {
		// All these should give the same result since the function converts to lowercase
		inputs := []string{"Service", "SERVICE", "service", "sErViCe"}
		var results []string
		
		for _, input := range inputs {
			results = append(results, utils.Plural(input))
		}
		
		// All results should be the same
		for i := 1; i < len(results); i++ {
			assert.Equal(t, results[0], results[i], "All case variations should produce the same result")
		}
	})
}

func TestPluralFunctionRealWorldScenarios(t *testing.T) {
	t.Run("kubernetes API resources", func(t *testing.T) {
		// Test with actual Kubernetes API resource kinds
		k8sResources := map[string]string{
			"Pod":                     "pods",
			"Service":                 "services",
			"Deployment":              "deployments",
			"ReplicaSet":              "replicasets",
			"StatefulSet":             "statefulsets",
			"DaemonSet":               "daemonsets",
			"Job":                     "jobs",
			"CronJob":                 "cronjobs",
			"ConfigMap":               "configmaps",
			"Secret":                  "secrets",
			"PersistentVolume":        "persistentvolumes",
			"PersistentVolumeClaim":   "persistentvolumeclaims",
			"StorageClass":            "storageclasses",
			"Ingress":                 "ingresses",
			"NetworkPolicy":           "networkpolicies",
		}
		
		for input, expected := range k8sResources {
			result := utils.Plural(input)
			assert.Equal(t, expected, result, "Kubernetes resource %s should pluralize correctly", input)
		}
	})
	
	t.Run("crossplane resources", func(t *testing.T) {
		// Test with Crossplane resource kinds
		crossplaneResources := map[string]string{
			"Provider":                        "providers",
			"Configuration":                   "configurations",
			"Composition":                     "compositions",
			"CompositeResourceDefinition":     "compositeresourcedefinitions",
			"ProviderConfig":                  "providerconfigs",
			"ProviderRevision":               "providerrevisions",
		}
		
		for input, expected := range crossplaneResources {
			result := utils.Plural(input)
			assert.Equal(t, expected, result, "Crossplane resource %s should pluralize correctly", input)
		}
	})
}

// Benchmark test to ensure the function performs well
func BenchmarkPlural(b *testing.B) {
	testWords := []string{
		"service", "deployment", "pod", "configmap", "secret",
		"provider", "composition", "claim", "composite", "managed",
		"analysis", "box", "city", "leaf", "hero",
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		for _, word := range testWords {
			utils.Plural(word)
		}
	}
}
