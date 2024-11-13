package web

import (
	"embed"
	"io/fs"
	"net/http"
)

// go:embed templates/*
var content embed.FS

// GetFileSystem returns an http.FileSystem that serves embedded files
func GetFileSystem() http.FileSystem {
	fsys, err := fs.Sub(content, "templates")
	if err != nil {
		panic(err)
	}
	return http.FS(fsys)
}

// GetStaticFileSystem returns an http.FileSystem for static files
// func GetStaticFileSystem() http.FileSystem {
// 	fsys, err := fs.Sub(content, "static")
// 	if err != nil {
// 		panic(err)
// 	}
// 	return http.FS(fsys)
// }
