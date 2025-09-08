# Build Scripts

This directory contains bash scripts that replicate the functionality of the GitHub Actions workflows for local development and CI/CD.

## Scripts Overview

### `ci-pipeline.sh` - Main CI Pipeline
The complete CI/CD pipeline that runs all checks, builds, and optionally creates Docker images.

**Usage:**
```bash
# Run complete pipeline
./scripts/ci-pipeline.sh

# Skip certain steps
./scripts/ci-pipeline.sh --skip-static --skip-docker

# Build and push Docker image
./scripts/ci-pipeline.sh --docker-push --docker-tag v1.0.0

# Show help
./scripts/ci-pipeline.sh --help
```

**Options:**
- `--skip-static`: Skip static analysis and linting
- `--skip-build`: Skip the build and test phase
- `--skip-docker`: Skip Docker image creation
- `--docker-push`: Push Docker image to registry
- `--docker-tag TAG`: Specify Docker tag (default: unstable)

### `static-check.sh` - Static Analysis
Runs all static analysis tools including linting, formatting, and complexity checks.

**What it does:**
- Creates required frontend dist directory
- Runs golangci-lint (installs if missing)
- Runs `go vet` static analysis
- Checks cyclomatic complexity with gocyclo
- Runs frontend linting (npm run lint)
- Validates Helm charts

**Usage:**
```bash
./scripts/static-check.sh
```

### `build.sh` - Build and Test
Builds the frontend, runs tests, and creates binaries.

**What it does:**
- Builds frontend with npm
- Runs Go unit tests with race detection
- Generates code coverage report
- Builds binaries with GoReleaser (or fallback to `go build`)
- Tests the built binary
- Optionally uploads coverage to Codecov

**Usage:**
```bash
./scripts/build.sh
```

### `docker-build.sh` - Docker Image Creation
Creates multi-platform Docker images.

**Usage:**
```bash
# Build locally with default settings
./scripts/docker-build.sh

# Build with specific tag and version
./scripts/docker-build.sh v1.0.0 1.0.0

# Build for specific platforms and push
./scripts/docker-build.sh v1.0.0 1.0.0 linux/amd64,linux/arm64 true
```

**Parameters:**
1. Docker tag (default: unstable)
2. Version string (default: 0.0.0-dev)
3. Target platforms (default: linux/amd64,linux/arm64)
4. Push to registry (default: false)

### `dev-build.sh` - Quick Development Build
Fast build for local development with minimal checks.

**Usage:**
```bash
./scripts/dev-build.sh
```

## Prerequisites

### Required Tools
- **Go 1.22+**: For building the backend
- **Node.js/npm**: For frontend builds
- **Docker**: For container builds (optional)

### Optional Tools (auto-installed if missing)
- **golangci-lint**: Static analysis (auto-installed)
- **gocyclo**: Complexity analysis (auto-installed)
- **goreleaser**: Multi-platform builds
- **helm**: Chart validation
- **chart-testing (ct)**: Chart linting
- **codecov**: Coverage reporting

## Migration from GitHub Actions

The scripts replicate the functionality of `.github/workflows/build.yml`:

| GitHub Actions Job | Bash Script | Description |
|-------------------|-------------|-------------|
| `static` | `static-check.sh` | Linting, formatting, static analysis |
| `build` | `build.sh` | Frontend build, Go tests, binary creation |
| `image` | `docker-build.sh` | Multi-platform Docker image builds |
| All jobs | `ci-pipeline.sh` | Complete pipeline orchestration |

## Environment Variables

The scripts respect these environment variables:

- `GOPATH`: Go workspace path
- `PATH`: Extended automatically for installed tools
- `DOCKER_BUILDKIT`: Enabled automatically for Docker builds

## Error Handling

All scripts use `set -e` to exit on first error and include:
- Colored output for better visibility
- Informative error messages
- Prerequisite checking
- Graceful handling of missing optional tools

## Examples

### Local Development Workflow
```bash
# Quick development build
./scripts/dev-build.sh

# Full local testing (without Docker)
./scripts/ci-pipeline.sh --skip-docker

# Complete pipeline including Docker build
./scripts/ci-pipeline.sh
```

### Release Workflow
```bash
# Build and push release
./scripts/ci-pipeline.sh --docker-push --docker-tag v1.2.3
```

### Debugging Failed Builds
```bash
# Run only static checks
./scripts/static-check.sh

# Run only build and tests
./scripts/build.sh

# Skip problematic steps
./scripts/ci-pipeline.sh --skip-static
```
