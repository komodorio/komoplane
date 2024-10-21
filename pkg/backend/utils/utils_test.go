package utils

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestPluralize(t *testing.T) {
	tests := []struct {
		in  string
		out string
	}{
		{"cat", "cats"},
		{"dog", "dogs"},
		{"box", "boxes"},
		{"church", "churches"},
		{"baby", "babies"},
		{"knife", "knives"},
		{"leaf", "leaves"},
		{"hero", "heroes"},
		{"bus", "buses"},

		{"policy", "policies"},
	}
	for _, test := range tests {
		t.Run(test.in, func(t *testing.T) {
			assert.Equal(t, Plural(test.in), test.out)
		})
	}
}
