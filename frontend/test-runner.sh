#!/bin/bash

# Test Runner Script for PropAgent Pro Frontend
# This script runs all tests and provides comprehensive reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    PropAgent Pro Testing Suite               ║"
echo "║                     Comprehensive Test Runner                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the frontend directory.${NC}"
    exit 1
fi

# Function to print step headers
print_step() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print info message
print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Variables to track test results
UNIT_TESTS_PASSED=false
E2E_TESTS_PASSED=false
VISUAL_TESTS_PASSED=false
LINT_PASSED=false
BUILD_PASSED=false

# Parse command line arguments
RUN_UNIT=true
RUN_E2E=true
RUN_VISUAL=true
RUN_LINT=true
RUN_BUILD=true
COVERAGE=false
WATCH=false
CI_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --unit-only)
            RUN_E2E=false
            RUN_VISUAL=false
            shift
            ;;
        --e2e-only)
            RUN_UNIT=false
            RUN_VISUAL=false
            shift
            ;;
        --visual-only)
            RUN_UNIT=false
            RUN_E2E=false
            shift
            ;;
        --no-lint)
            RUN_LINT=false
            shift
            ;;
        --no-build)
            RUN_BUILD=false
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --unit-only    Run only unit tests"
            echo "  --e2e-only     Run only E2E tests"
            echo "  --visual-only  Run only visual regression tests"
            echo "  --no-lint      Skip linting"
            echo "  --no-build     Skip build verification"
            echo "  --coverage     Generate coverage report"
            echo "  --watch        Run tests in watch mode"
            echo "  --ci           Run in CI mode"
            echo "  --help, -h     Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create test results directory
mkdir -p test-results

# Start timing
START_TIME=$(date +%s)

print_step "🚀 Starting Test Suite Execution"
print_info "Test configuration:"
echo "   • Unit Tests: $([ "$RUN_UNIT" = true ] && echo "✅" || echo "❌")"
echo "   • E2E Tests: $([ "$RUN_E2E" = true ] && echo "✅" || echo "❌")"
echo "   • Visual Tests: $([ "$RUN_VISUAL" = true ] && echo "✅" || echo "❌")"
echo "   • Linting: $([ "$RUN_LINT" = true ] && echo "✅" || echo "❌")"
echo "   • Build Check: $([ "$RUN_BUILD" = true ] && echo "✅" || echo "❌")"
echo "   • Coverage: $([ "$COVERAGE" = true ] && echo "✅" || echo "❌")"
echo "   • Watch Mode: $([ "$WATCH" = true ] && echo "✅" || echo "❌")"

# Check dependencies
print_step "📦 Checking Dependencies"
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Linting
if [ "$RUN_LINT" = true ]; then
    print_step "🔍 Running ESLint"
    if npm run lint; then
        print_success "Linting passed"
        LINT_PASSED=true
    else
        print_error "Linting failed"
        if [ "$CI_MODE" = true ]; then
            exit 1
        fi
    fi
fi

# Unit Tests
if [ "$RUN_UNIT" = true ]; then
    print_step "🧪 Running Unit Tests (Jest + React Testing Library)"
    
    JEST_COMMAND="npm run test"
    if [ "$COVERAGE" = true ]; then
        JEST_COMMAND="npm run test:coverage"
    fi
    if [ "$WATCH" = true ]; then
        JEST_COMMAND="npm run test:watch"
    else
        JEST_COMMAND="$JEST_COMMAND -- --watchAll=false"
    fi
    
    if $JEST_COMMAND; then
        print_success "Unit tests passed"
        UNIT_TESTS_PASSED=true
        
        if [ "$COVERAGE" = true ]; then
            print_info "Coverage report generated in ./coverage/"
            if command -v open >/dev/null 2>&1; then
                print_info "Opening coverage report..."
                open coverage/lcov-report/index.html
            fi
        fi
    else
        print_error "Unit tests failed"
        if [ "$CI_MODE" = true ]; then
            exit 1
        fi
    fi
fi

# Build Check
if [ "$RUN_BUILD" = true ]; then
    print_step "🏗️  Running Build Check"
    if npm run build; then
        print_success "Build passed"
        BUILD_PASSED=true
        print_info "Build artifacts created in ./dist/"
    else
        print_error "Build failed"
        if [ "$CI_MODE" = true ]; then
            exit 1
        fi
    fi
fi

# Install Playwright browsers if needed for E2E tests
if [ "$RUN_E2E" = true ] || [ "$RUN_VISUAL" = true ]; then
    print_step "🎭 Checking Playwright Installation"
    if ! npm run test:install --silent; then
        print_info "Installing Playwright browsers..."
        npm run test:install
        print_success "Playwright browsers installed"
    else
        print_success "Playwright browsers already installed"
    fi
fi

# E2E Tests
if [ "$RUN_E2E" = true ]; then
    print_step "🌐 Running E2E Tests (Playwright)"
    
    E2E_COMMAND="npm run test:e2e"
    if [ "$WATCH" = true ]; then
        E2E_COMMAND="npm run test:e2e:ui"
    fi
    
    if $E2E_COMMAND; then
        print_success "E2E tests passed"
        E2E_TESTS_PASSED=true
    else
        print_error "E2E tests failed"
        print_info "Check ./playwright-report/ for detailed results"
        if [ "$CI_MODE" = true ]; then
            exit 1
        fi
    fi
fi

# Visual Regression Tests
if [ "$RUN_VISUAL" = true ]; then
    print_step "🎨 Running Visual Regression Tests"
    
    if npm run test:visual; then
        print_success "Visual regression tests passed"
        VISUAL_TESTS_PASSED=true
    else
        print_error "Visual regression tests failed"
        print_warning "This might be due to first-time screenshot generation or visual changes"
        print_info "Check ./test-results/ for visual diffs"
        if [ "$CI_MODE" = true ]; then
            exit 1
        fi
    fi
fi

# Calculate execution time
END_TIME=$(date +%s)
EXECUTION_TIME=$((END_TIME - START_TIME))
MINUTES=$((EXECUTION_TIME / 60))
SECONDS=$((EXECUTION_TIME % 60))

# Print final results
print_step "📊 Test Results Summary"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                        Test Results                          ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"

if [ "$RUN_LINT" = true ]; then
    echo -e "${CYAN}║${NC} Linting:        $([ "$LINT_PASSED" = true ] && echo -e "${GREEN}✅ PASSED" || echo -e "${RED}❌ FAILED")                              ${CYAN}║${NC}"
fi

if [ "$RUN_UNIT" = true ]; then
    echo -e "${CYAN}║${NC} Unit Tests:     $([ "$UNIT_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ PASSED" || echo -e "${RED}❌ FAILED")                              ${CYAN}║${NC}"
fi

if [ "$RUN_BUILD" = true ]; then
    echo -e "${CYAN}║${NC} Build Check:    $([ "$BUILD_PASSED" = true ] && echo -e "${GREEN}✅ PASSED" || echo -e "${RED}❌ FAILED")                              ${CYAN}║${NC}"
fi

if [ "$RUN_E2E" = true ]; then
    echo -e "${CYAN}║${NC} E2E Tests:      $([ "$E2E_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ PASSED" || echo -e "${RED}❌ FAILED")                              ${CYAN}║${NC}"
fi

if [ "$RUN_VISUAL" = true ]; then
    echo -e "${CYAN}║${NC} Visual Tests:   $([ "$VISUAL_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ PASSED" || echo -e "${RED}❌ FAILED")                              ${CYAN}║${NC}"
fi

echo -e "${CYAN}║${NC}                                                              ${CYAN}║${NC}"
echo -e "${CYAN}║${NC} Execution Time: ${PURPLE}${MINUTES}m ${SECONDS}s${NC}                                    ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"

# Overall result
ALL_PASSED=true
if [ "$RUN_LINT" = true ] && [ "$LINT_PASSED" = false ]; then ALL_PASSED=false; fi
if [ "$RUN_UNIT" = true ] && [ "$UNIT_TESTS_PASSED" = false ]; then ALL_PASSED=false; fi
if [ "$RUN_BUILD" = true ] && [ "$BUILD_PASSED" = false ]; then ALL_PASSED=false; fi
if [ "$RUN_E2E" = true ] && [ "$E2E_TESTS_PASSED" = false ]; then ALL_PASSED=false; fi
if [ "$RUN_VISUAL" = true ] && [ "$VISUAL_TESTS_PASSED" = false ]; then ALL_PASSED=false; fi

echo ""
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All tests passed! Your application is ready for deployment.${NC}"
    
    if [ "$COVERAGE" = true ]; then
        print_info "Coverage report: file://$(pwd)/coverage/lcov-report/index.html"
    fi
    
    print_info "E2E test report: file://$(pwd)/playwright-report/index.html"
    
    exit 0
else
    echo -e "${RED}💥 Some tests failed. Please review the results above.${NC}"
    
    print_info "Available reports:"
    echo "   • Unit test results: Check console output above"
    if [ -d "coverage" ]; then
        echo "   • Coverage report: file://$(pwd)/coverage/lcov-report/index.html"
    fi
    if [ -d "playwright-report" ]; then
        echo "   • E2E test report: file://$(pwd)/playwright-report/index.html"
    fi
    if [ -d "test-results" ]; then
        echo "   • Visual diff results: ./test-results/"
    fi
    
    exit 1
fi