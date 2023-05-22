package pkg

import "embed"

//go:embed frontend/*
var StaticFS embed.FS
