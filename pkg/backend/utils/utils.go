package utils

import "strings"

func Plural(resName string) string { // TODO: is this the best way to obtain endpoint name?
	noun := strings.ToLower(resName)
	if strings.HasSuffix(noun, "s") || strings.HasSuffix(noun, "x") || strings.HasSuffix(noun, "z") || strings.HasSuffix(noun, "sh") || strings.HasSuffix(noun, "ch") {
		return noun + "es"
	} else if strings.HasSuffix(noun, "y") && !strings.HasSuffix(noun, "ay") && !strings.HasSuffix(noun, "ey") && !strings.HasSuffix(noun, "iy") && !strings.HasSuffix(noun, "oy") && !strings.HasSuffix(noun, "uy") {
		return noun[:len(noun)-1] + "ies"
	} else if strings.HasSuffix(noun, "f") {
		return noun[:len(noun)-1] + "ves"
	} else if strings.HasSuffix(noun, "fe") {
		return noun[:len(noun)-2] + "ves"
	} else if strings.HasSuffix(noun, "o") {
		return noun + "es"
	} else {
		return noun + "s"
	}
}
