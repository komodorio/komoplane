#!/bin/bash

# Komoplane Test Runner
# This script runs all tests for the komoplane project

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists go; then
        print_error "Go is not installed or not in PATH"
        exit 1
    fi
    
    if ! command_exists node; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Run Go backend tests
run_backend_tests() {
    print_status "Running Go backend tests..."
    
    # Save current directory
    original_dir=$(pwd)
    
    # Go to the backend test directory
    cd "$(dirname "$0")/backend"
    
    # Run backend tests in their own module
    if go test . -v -coverprofile=backend_coverage.out; then
        print_status "Backend tests passed"
        
        # Generate coverage report
        if [ -f backend_coverage.out ]; then
            coverage=$(go tool cover -func=backend_coverage.out | grep total | awk '{print $3}')
            print_status "Backend test coverage: $coverage"
        fi
        
        # Go back to original directory
        cd "$original_dir"
        return 0
    else
        print_error "Backend tests failed"
        # Go back to original directory
        cd "$original_dir"
        return 1
    fi
}

# Run main package tests
run_main_tests() {
    print_status "Running main package tests..."
    
    # Save current directory
    original_dir=$(pwd)
    
    # Go to the main test directory
    cd "$(dirname "$0")/main"
    
    if go test . -v; then
        print_status "Main package tests passed"
        cd "$original_dir"
        return 0
    else
        print_error "Main package tests failed"
        cd "$original_dir"
        return 1
    fi
}

# Run existing utils tests
run_utils_tests() {
    print_status "Running existing utils tests..."
    
    # Save current directory
    original_dir=$(pwd)
    
    # Go to project root to run the existing utils tests
    cd "$(dirname "$0")/.."
    
    if go test ./pkg/backend/utils/... -v; then
        print_status "Utils tests passed"
        cd "$original_dir"
        return 0
    else
        print_error "Utils tests failed"
        cd "$original_dir"
        return 1
    fi
}

# Run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Save current directory
    original_dir=$(pwd)
    
    # Go to tests directory
    cd "$(dirname "$0")"
    
    # Check if integration test exists
    if [ -f "integration_test.go" ]; then
        if go test integration_test.go -v; then
            print_status "Integration tests passed"
            cd "$original_dir"
            return 0
        else
            print_error "Integration tests failed"
            cd "$original_dir"
            return 1
        fi
    else
        print_status "No integration tests found, skipping..."
        cd "$original_dir"
        return 0
    fi
}

# Run TypeScript frontend tests
run_frontend_tests() {
    print_status "Running TypeScript frontend tests..."
    
    cd "$(dirname "$0")"  # Go to tests directory
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing npm dependencies..."
        npm install
    fi
    
    # Run frontend tests
    if npm test -- --coverage --watchAll=false; then
        print_status "Frontend tests passed"
    else
        print_error "Frontend tests failed"
        return 1
    fi
}

# Run linting and formatting checks
run_quality_checks() {
    print_status "Running code quality checks..."
    
    # Go to project root from tests directory
    cd "$(dirname "$0")/.."
    
    # Go formatting check
    if ! gofmt -l . | grep -q .; then
        print_status "Go formatting check passed"
    else
        print_warning "Go files need formatting. Run 'gofmt -w .' to fix."
    fi
    
    # Go vet check
    if go vet ./...; then
        print_status "Go vet check passed"
    else
        print_warning "Go vet found issues"
    fi
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    cd "$(dirname "$0")/.."  # Go to project root
    
    report_file="test_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Komoplane Test Report"
        echo "Generated on: $(date)"
        echo "=========================="
        echo ""
        
        if [ -f backend_coverage.out ]; then
            echo "Backend Test Coverage:"
            go tool cover -func=backend_coverage.out
            echo ""
        fi
        
        if [ -f tests/coverage/lcov-report/index.html ]; then
            echo "Frontend test coverage report available at: tests/coverage/lcov-report/index.html"
            echo ""
        fi
        
        echo "Test execution completed successfully"
    } > "$report_file"
    
    print_status "Test report saved to: $report_file"
}

# Main execution function
main() {
    local start_time
    start_time=$(date +%s)
    
    print_status "Starting Komoplane test suite..."
    print_status "Working directory: $(pwd)"
    
    # Check prerequisites
    check_prerequisites
    
    # Parse command line arguments
    run_backend=true
    run_frontend=true
    run_quality=false
    generate_report_flag=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-only)
                run_frontend=false
                shift
                ;;
            --frontend-only)
                run_backend=false
                shift
                ;;
            --with-quality)
                run_quality=true
                shift
                ;;
            --report)
                generate_report_flag=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --backend-only    Run only backend tests"
                echo "  --frontend-only   Run only frontend tests"
                echo "  --with-quality    Include code quality checks"
                echo "  --report          Generate test report"
                echo "  --help            Show this help message"
                exit 0
                ;;
            *)
                print_warning "Unknown option: $1"
                shift
                ;;
        esac
    done
    
    # Run tests based on flags
    local tests_failed=false
    
    if [ "$run_backend" = true ]; then
        if ! run_backend_tests; then
            tests_failed=true
        fi
        
        if ! run_main_tests; then
            tests_failed=true
        fi
        
        if ! run_utils_tests; then
            tests_failed=true
        fi
        
        if ! run_integration_tests; then
            tests_failed=true
        fi
    fi
    
    if [ "$run_frontend" = true ]; then
        if ! run_frontend_tests; then
            tests_failed=true
        fi
    fi
    
    if [ "$run_quality" = true ]; then
        run_quality_checks
    fi
    
    if [ "$generate_report_flag" = true ]; then
        generate_report
    fi
    
    # Calculate execution time
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ "$tests_failed" = true ]; then
        print_error "Some tests failed. Check the output above for details."
        print_status "Total execution time: ${duration} seconds"
        exit 1
    else
        print_status "All tests passed successfully! 🎉"
        print_status "Total execution time: ${duration} seconds"
    fi
}

# Run main function
main "$@"
