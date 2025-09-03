package backend

import (
	"io"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/komodorio/komoplane/pkg/backend"
	"github.com/stretchr/testify/assert"
)

// Mock FileSystem for testing
type mockFileSystem struct {
	files map[string]string
}

func (m *mockFileSystem) Open(name string) (http.File, error) {
	if content, exists := m.files[name]; exists {
		return &mockFile{content: content, name: name}, nil
	}
	return nil, fs.ErrNotExist
}

// Mock File for testing
type mockFile struct {
	content string
	name    string
	pos     int
}

func (m *mockFile) Close() error {
	return nil
}

func (m *mockFile) Read(p []byte) (n int, err error) {
	if m.pos >= len(m.content) {
		return 0, io.EOF
	}
	n = copy(p, m.content[m.pos:])
	m.pos += n
	return n, nil
}

func (m *mockFile) Seek(offset int64, whence int) (int64, error) {
	switch whence {
	case 0: // Relative to start
		m.pos = int(offset)
	case 1: // Relative to current
		m.pos += int(offset)
	case 2: // Relative to end
		m.pos = len(m.content) + int(offset)
	}
	return int64(m.pos), nil
}

func (m *mockFile) Readdir(count int) ([]fs.FileInfo, error) {
	return []fs.FileInfo{
		&mockFileInfo{name: m.name, size: int64(len(m.content))},
	}, nil
}

func (m *mockFile) Stat() (fs.FileInfo, error) {
	return &mockFileInfo{name: m.name, size: int64(len(m.content))}, nil
}

// Mock FileInfo for testing
type mockFileInfo struct {
	name string
	size int64
}

func (m *mockFileInfo) Name() string       { return m.name }
func (m *mockFileInfo) Size() int64        { return m.size }
func (m *mockFileInfo) Mode() fs.FileMode  { return 0644 }
func (m *mockFileInfo) ModTime() time.Time { return time.Now() }
func (m *mockFileInfo) IsDir() bool        { return false }
func (m *mockFileInfo) Sys() any           { return nil }

func TestNewPrefixedFS(t *testing.T) {
	mockFS := &mockFileSystem{
		files: map[string]string{
			"/test/file.txt": "test content",
			"/prefix/test/file.txt": "prefixed content",
		},
	}
	
	t.Run("create prefixed file system", func(t *testing.T) {
		prefixedFS := backend.NewPrefixedFS(mockFS, "/prefix")
		assert.NotNil(t, prefixedFS)
	})
	
	t.Run("open file with prefix", func(t *testing.T) {
		prefixedFS := backend.NewPrefixedFS(mockFS, "/prefix")
		
		file, err := prefixedFS.Open("/test/file.txt")
		
		assert.NoError(t, err)
		assert.NotNil(t, file)
		
		// Read content
		buf := make([]byte, 100)
		n, _ := file.Read(buf)
		content := string(buf[:n])
		
		assert.Equal(t, "prefixed content", content)
		file.Close()
	})
	
	t.Run("open root directory", func(t *testing.T) {
		prefixedFS := backend.NewPrefixedFS(mockFS, "/prefix")
		
		file, err := prefixedFS.Open("/")
		
		assert.NoError(t, err)
		assert.NotNil(t, file)
		
		// Should be a directory
		stat, err := file.Stat()
		assert.NoError(t, err)
		assert.True(t, stat.IsDir())
		
		file.Close()
	})
	
	t.Run("open non-existent file", func(t *testing.T) {
		prefixedFS := backend.NewPrefixedFS(mockFS, "/prefix")
		
		file, err := prefixedFS.Open("/nonexistent.txt")
		
		assert.Error(t, err)
		assert.Nil(t, file)
	})
}

func TestPrefixedFSWithHTTPServer(t *testing.T) {
	mockFS := &mockFileSystem{
		files: map[string]string{
			"/static/index.html": "<html><body>Test</body></html>",
			"/static/style.css":  "body { color: red; }",
		},
	}
	
	t.Run("serve files through HTTP", func(t *testing.T) {
		prefixedFS := backend.NewPrefixedFS(mockFS, "/static")
		
		server := httptest.NewServer(http.FileServer(prefixedFS))
		defer server.Close()
		
		// Test serving index.html
		resp, err := http.Get(server.URL + "/index.html")
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		resp.Body.Close()
		
		// Test serving CSS file
		resp, err = http.Get(server.URL + "/style.css")
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		resp.Body.Close()
		
		// Test non-existent file
		resp, err = http.Get(server.URL + "/nonexistent.txt")
		assert.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
		resp.Body.Close()
	})
}
