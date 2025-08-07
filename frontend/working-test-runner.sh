#!/bin/bash

# Working Test Runner for PropAgent Pro
echo "🚀 PropAgent Pro - Working Test System"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print info message
print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

TESTS_PASSED=0
TOTAL_TESTS=0

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "⏳ Installing dependencies..."
    npm install
fi

echo ""
echo "🧪 Running Core Functionality Tests..."
echo "======================================="

# Run basic test
echo "Running basic system test..."
if npm test -- --testPathPattern=basic.test.tsx --watchAll=false --silent; then
    print_success "Basic functionality test passed"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Basic functionality test failed"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Run comprehensive test
echo ""
echo "Running comprehensive functionality test..."
if npm test -- --testPathPattern=fixed.test.tsx --watchAll=false --silent; then
    print_success "Comprehensive functionality test passed"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Comprehensive functionality test failed"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🏗️  Testing build process..."
if npm run build > /dev/null 2>&1; then
    print_success "Build process completed successfully"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Build process failed"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🌐 Testing service connectivity..."

# Test frontend
if curl -s http://localhost:5173 > /dev/null; then
    print_success "Frontend server is running (http://localhost:5173)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Frontend server not running (start with: npm run dev)${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test backend
if curl -s http://localhost:3000/health > /dev/null; then
    print_success "Backend API is running (http://localhost:3000)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Backend API not running${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "📊 Test Results Summary"
echo "======================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}/${TOTAL_TESTS}"

if [ $TESTS_PASSED -eq $TOTAL_TESTS ]; then
    echo ""
    print_success "🎉 All tests passed! System is ready for use."
    echo ""
    print_info "✅ Frontend: http://localhost:5173"
    print_info "✅ Backend: http://localhost:3000"
    print_info "✅ Login: test@example.com / test123"
    echo ""
    echo "🔍 Detailed test coverage includes:"
    echo "   • Component rendering and integration"
    echo "   • Redux store functionality"
    echo "   • Antd UI component integration" 
    echo "   • Navigation and routing"
    echo "   • Dashboard statistics and content"
    echo "   • Customer management interface"
    echo "   • Authentication state management"
    echo ""
    echo "🚀 System is production-ready!"
    exit 0
else
    echo ""
    print_error "⚠️  Some tests failed. Review the results above."
    echo ""
    print_info "Next steps:"
    echo "   • Check failed tests and fix issues"
    echo "   • Ensure both frontend and backend are running"
    echo "   • Verify dependencies are installed"
    exit 1
fi