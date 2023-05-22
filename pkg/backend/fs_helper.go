package backend

import (
	"github.com/pkg/errors"
	"io/fs"
	"net/http"
	"time"
)

// this file contains objects that help serving root directory from NPM-generated files
// TODO: if anyone knows more elegant way to achieve it - help out!

func NewPrefixedFS(fs http.FileSystem, prefix string) http.FileSystem {
	wrapper := &prefixedFS{
		fs:     fs,
		prefix: prefix,
	}
	return wrapper
}

type prefixedFS struct {
	fs     http.FileSystem
	prefix string
}

func (f *prefixedFS) Open(name string) (http.File, error) {
	if name == "/" {
		return &fakeDir{}, nil
	}
	return f.fs.Open(f.prefix + name)
}

type fakeDir struct {
}

func (f *fakeDir) Close() error {
	return nil
}

func (f *fakeDir) Read([]byte) (n int, err error) {
	return 0, errors.New("function not implemented")
}

func (f *fakeDir) Seek(int64, int) (int64, error) {
	return 0, errors.New("function not implemented")
}

func (f *fakeDir) Readdir(int) ([]fs.FileInfo, error) {
	return nil, errors.New("function not implemented")
}

func (f *fakeDir) Stat() (fs.FileInfo, error) {
	return &dirEntry{}, nil
}

type dirEntry struct {
}

func (d *dirEntry) Name() string {
	return ""
}

func (d *dirEntry) Size() int64 {
	return 0
}

func (d *dirEntry) Mode() fs.FileMode {
	return 0
}

func (d *dirEntry) ModTime() time.Time {
	return time.Now()
}

func (d *dirEntry) IsDir() bool {
	return true
}

func (d *dirEntry) Sys() any {
	return nil
}
