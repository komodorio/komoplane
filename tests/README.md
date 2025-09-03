# Komoplane Test Suite

This directory contains comprehensive unit tests for the Komoplane project, covering all major functions and components in both the Go backend and TypeScript frontend.

## Test Structure

```
tests/
├── backend/          # Go backend tests
│   ├── api_test.go          # API router and middleware tests
│   ├── fs_helper_test.go    # File system helper tests
│   ├── server_test.go       # Server initialization and configuration tests
│   └── utils_test.go        # Utility function tests (Plural function)
├── frontend/         # TypeScript frontend tests
│   ├── api.test.ts          # API client tests
│   ├── graphData.test.ts    # Graph data structure tests
│   └── utils.test.ts        # Utility function tests (getAge, sendStatsToHeap)
├── main/             # Main package tests
│   └── main_test.go         # Main function logic tests
├── package.json      # Frontend test dependencies and scripts
├── tsconfig.json     # TypeScript configuration for tests
├── setupTests.ts     # Jest setup file
└── README.md         # This file
```

## Running Tests

### Prerequisites

For Go tests:
- Go 1.19 or later
- Required Go dependencies (automatically handled by `go mod`)

For TypeScript tests:
- Node.js 16 or later
- npm or yarn

### Backend Tests (Go)

Run all backend tests:
```bash
cd /path/to/komoplane
go test ./tests/backend/... -v
```

Run tests with coverage:
```bash
go test ./tests/backend/... -v -coverprofile=coverage.out
go tool cover -html=coverage.out
```

Run specific test packages:
```bash
go test ./tests/backend/ -v                    # API and server tests
go test ./pkg/backend/utils/ -v                # Existing utils tests
```

### Frontend Tests (TypeScript)

First, install dependencies:
```bash
cd tests/
npm install
```

Run all frontend tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run specific test files:
```bash
npm test utils.test.ts
npm test api.test.ts
npm test graphData.test.ts
```

### Main Package Tests

Run main package tests:
```bash
cd /path/to/komoplane
go test ./tests/main/... -v
```

### All Tests

Run all tests (requires both Go and Node.js):
```bash
cd tests/
npm run test:all
```

## Test Coverage

### Backend Tests Cover:

1. **API Layer (`api_test.go`)**:
   - Echo router creation and configuration
   - Middleware functions (slowness, CORS, error handling)
   - HTTP request/response handling
   - Route registration and basic functionality

2. **File System Helpers (`fs_helper_test.go`)**:
   - Prefixed file system implementation
   - Static file serving functionality
   - HTTP file server integration
   - Mock file system operations

3. **Server Logic (`server_test.go`)**:
   - Server structure initialization
   - Configuration handling
   - Environment variable processing

4. **Utility Functions (`utils_test.go`)**:
   - Comprehensive testing of the `Plural` function
   - Edge cases and special characters
   - Real-world Kubernetes and Crossplane resource names
   - Performance benchmarks

### Frontend Tests Cover:

1. **Utility Functions (`utils.test.ts`)**:
   - `getAge` function with various time differences
   - `getAgeParse` function with ISO string parsing
   - `sendStatsToHeap` function with analytics tracking
   - Edge cases and error handling

2. **API Client (`api.test.ts`)**:
   - All API client methods
   - HTTP request/response handling
   - Error scenarios and network failures
   - Analytics event tracking
   - Mock fetch and response handling

3. **Graph Data Structure (`graphData.test.ts`)**:
   - Node creation and management
   - Edge creation and styling
   - Status determination logic
   - Navigation URL generation
   - Integration scenarios

### Main Package Tests Cover:

1. **Environment Variables**:
   - `KP_BIND`, `DEBUG`, `CGO_CFLAGS`, `KP_VERSION`
   - Default value handling
   - Configuration logic

2. **Application Setup**:
   - Signal handling
   - Server address formatting
   - Basic application flow

## Test Quality Features

### Comprehensive Coverage:
- **Unit Tests**: Every function is tested in isolation
- **Integration Tests**: Components are tested together
- **Edge Cases**: Boundary conditions and error scenarios
- **Performance Tests**: Benchmarks for critical functions

### Mock and Stub Usage:
- HTTP requests and responses
- File system operations
- External dependencies (analytics, logging)
- Kubernetes client interactions (where applicable)

### Assertion Quality:
- Specific expected values rather than just "not null"
- Error message validation
- State verification after operations
- Side effect testing (function calls, analytics events)

### Test Organization:
- Descriptive test names following "should X when Y" pattern
- Grouped related tests using subtests
- Clear setup and teardown
- Isolated test cases (no shared state)

## Expected Test Results

When all tests pass, you should see:
- **Go Backend**: ~95%+ code coverage for tested modules
- **TypeScript Frontend**: ~90%+ code coverage for utility functions
- **Zero failing tests** in normal operation
- **Performance benchmarks** showing acceptable function execution times

## Adding New Tests

When adding new functionality to Komoplane:

1. **Add corresponding tests** in the appropriate directory
2. **Follow existing patterns** for test structure and naming
3. **Include edge cases** and error scenarios
4. **Update this README** if adding new test categories
5. **Ensure tests are deterministic** and don't depend on external services

## Test Dependencies

### Go Dependencies:
```go
github.com/stretchr/testify/assert
github.com/stretchr/testify/require
```

### TypeScript Dependencies:
```json
{
  "@types/jest": "^29.5.0",
  "jest": "^29.5.0",
  "jest-environment-jsdom": "^29.5.0",
  "ts-jest": "^29.1.0"
}
```

## Continuous Integration

These tests are designed to run in CI/CD environments:
- **No external dependencies** required for most tests
- **Deterministic results** through mocking and fixed test data
- **Fast execution** suitable for automated testing
- **Clear failure messages** for debugging

## Troubleshooting

### Common Issues:

1. **Go tests fail**: Ensure you're in the correct directory and have all Go dependencies
2. **TypeScript tests fail**: Run `npm install` in the tests directory
3. **Coverage reports not generated**: Check write permissions in the test directory
4. **Mock functions not working**: Verify jest configuration and imports

### Performance Considerations:

- Backend tests should complete in < 5 seconds
- Frontend tests should complete in < 10 seconds
- If tests are slow, check for unnecessary network calls or heavy computations

## Future Improvements

Potential areas for test enhancement:
1. **Integration tests** with actual Kubernetes clusters (using test environments)
2. **End-to-end tests** for complete user workflows
3. **Load testing** for API endpoints
4. **Security testing** for input validation
5. **Accessibility testing** for frontend components
