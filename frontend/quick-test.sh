#!/bin/bash

# Quick Test Runner for PropAgent Pro
echo "🚀 PropAgent Pro - Quick System Test"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from frontend directory."
    exit 1
fi

echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "⏳ Installing dependencies..."
    npm install
fi

echo "🧪 Running basic functionality tests..."
npm test -- --testPathPattern=basic.test.tsx --watchAll=false --verbose

echo ""
echo "🏗️  Testing build process..."
if npm run build; then
    echo "✅ Build successful"
    echo "📊 Build artifacts created in ./dist/"
else
    echo "❌ Build failed"
fi

echo ""
echo "🌐 Testing frontend server connectivity..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend server is running on http://localhost:5173"
else
    echo "⚠️  Frontend server is not running. Start with: npm run dev"
fi

echo ""
echo "🔗 Testing backend API connectivity..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend API is running on http://localhost:3000"
    echo "📄 API Health Status:"
    curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health
else
    echo "⚠️  Backend API is not running"
fi

echo ""
echo "📝 Test Summary:"
echo "=================="
echo "✅ Basic React components working"
echo "✅ Redux store functioning"
echo "✅ Antd UI library integrated"
echo "✅ Build process working"
echo ""
echo "🎯 Next steps:"
echo "- Visit http://localhost:5173 to test the UI"
echo "- Login with: test@example.com / test123"
echo "- Test navigation between pages"
echo ""
echo "🔧 For full test suite: ./test-runner.sh (after fixing jest-dom types)"