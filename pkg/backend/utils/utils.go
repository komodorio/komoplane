package utils

import "strings"

func Plural(resName string) string {
	return strings.ToLower(resName) + "s" // TODO: is this the best way to obtain endpoint name?
}
