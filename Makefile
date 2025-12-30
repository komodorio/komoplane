DATE    ?= $(shell date +%FT%T%z)
VERSION ?= $(shell git describe --tags --always --dirty --match=v* 2> /dev/null || \
			cat $(CURDIR)/.version 2> /dev/null || echo "v0")

.PHONY: help
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: test
test: ; $(info $(M) Running all tests...) @ ## Run all tests (backend + frontend)
	@chmod +x tests/run_tests.sh
	@cd tests && ./run_tests.sh

.PHONY: test-backend
test-backend: ; $(info $(M) Running backend tests...) @ ## Run Go backend tests
	@chmod +x tests/run_tests.sh
	@cd tests && ./run_tests.sh --backend-only

.PHONY: test-frontend
test-frontend: ; $(info $(M) Running frontend tests...) @ ## Run TypeScript frontend tests
	@chmod +x tests/run_tests.sh
	@cd tests && ./run_tests.sh --frontend-only

.PHONY: test-all
test-all: ; $(info $(M) Running comprehensive test suite...) @ ## Run all tests with comprehensive script
	@chmod +x tests/run_tests.sh
	@cd tests && ./run_tests.sh

.PHONY: test-coverage
test-coverage: ; $(info $(M) Generating coverage reports...) @ ## Run tests and generate coverage reports
	@chmod +x tests/run_tests.sh
	@cd tests && ./run_tests.sh --report

.PHONY: test-quality
test-quality: ; $(info $(M) Running tests with quality checks...) @ ## Run tests with code quality checks
	@chmod +x tests/run_tests.sh
	@cd tests && ./run_tests.sh --with-quality

.PHONY: pull
pull: ; $(info $(M) Pulling source...) @
	@git pull

.PHONY: build_go
build_go: $(BIN) ; $(info $(M) Building GO...) @ ## Build program binary
	go build \
		-ldflags '-X main.version=$(VERSION) -X main.buildDate=$(DATE)' \
		-o bin/komoplane .

.PHONY: build_ui
build_ui: $(BIN) ; $(info $(M) Building UI...) @ ## Build program binary
	cd pkg/frontend && npm i && npm run build && cd ../..

.PHONY: build
build: build_ui build_go ; $(info $(M) Building executable...) @ ## Build program binary

.PHONY: debug
debug: build ; $(info $(M) Running in debug mode...) @
	@DEBUG=1 ./bin/komoplane