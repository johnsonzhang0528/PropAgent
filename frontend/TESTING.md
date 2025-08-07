# Testing Guide for PropAgent Pro Frontend

## Overview

This document provides comprehensive information about the testing system implemented for the PropAgent Pro React TypeScript application. Our testing strategy covers unit tests, integration tests, end-to-end tests, visual regression tests, and responsive design validation.

## Testing Stack

### Core Testing Tools
- **Jest**: JavaScript testing framework for unit and integration tests
- **React Testing Library**: Simple and complete testing utilities for React components
- **Playwright**: End-to-end testing framework for web applications
- **MSW (Mock Service Worker)**: API mocking for reliable testing
- **TypeScript**: Type safety for test files

### Additional Tools
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation
- **identity-obj-proxy**: CSS module mocking
- **ts-jest**: TypeScript preprocessor for Jest

## Test Structure

```
src/test/
├── __mocks__/              # Mock files for assets
│   └── fileMock.js
├── auth/                   # Authentication flow tests
│   ├── LoginPage.test.tsx
│   └── App.auth.test.tsx
├── components/             # Component unit tests
│   └── MainLayout.test.tsx
├── e2e/                   # End-to-end tests
│   ├── login.spec.ts
│   ├── dashboard.spec.ts
│   ├── navigation.spec.ts
│   ├── responsive.spec.ts
│   └── visual.spec.ts
├── mocks/                 # API mocking setup
│   └── server.ts
├── navigation/            # Navigation tests
│   └── AppNavigation.test.tsx
├── pages/                 # Page component tests
│   └── DashboardPage.test.tsx
├── responsive/            # Responsive design tests
│   └── ResponsiveLayout.test.tsx
├── utils/                 # Test utilities
│   ├── test-utils.tsx
│   └── e2e-helpers.ts
└── setupTests.ts          # Test environment setup
```

## Test Categories

### 1. Unit Tests (Jest + React Testing Library)

**Location**: `src/test/**/*.test.tsx`

**Purpose**: Test individual components and functions in isolation

**Coverage**:
- Component rendering
- User interactions
- State management
- Props validation
- Error handling

**Example**:
```typescript
import { render, screen } from '../utils/test-utils';
import LoginPage from '../../pages/auth/LoginPage';

test('renders login form correctly', () => {
  render(<LoginPage />);
  
  expect(screen.getByText('PropAgent Pro')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('郵箱地址')).toBeInTheDocument();
});
```

### 2. Integration Tests

**Purpose**: Test component interactions and data flow

**Coverage**:
- Authentication flow
- Navigation between pages
- Redux state management
- API integration with mocked endpoints

### 3. End-to-End Tests (Playwright)

**Location**: `src/test/e2e/*.spec.ts`

**Purpose**: Test complete user workflows in a real browser environment

**Coverage**:
- Login flow with test credentials (test@example.com/test123)
- Dashboard functionality
- Navigation between all pages
- User logout process
- Browser compatibility

### 4. Responsive Design Tests

**Purpose**: Ensure UI works correctly across different screen sizes

**Coverage**:
- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1920x1080)
- Layout adaptation
- Touch interactions

### 5. Visual Regression Tests

**Purpose**: Catch visual changes and layout issues

**Coverage**:
- Screenshot comparison across viewports
- Component-level visual testing
- Interactive state validation
- Cross-browser visual consistency

## Quick Start

### Prerequisites

1. Node.js (v18 or higher)
2. npm or yarn
3. Dependencies installed (`npm install`)

### Running Tests

#### All Tests (Recommended)
```bash
# Run complete test suite
./test-runner.sh

# Run with coverage report
./test-runner.sh --coverage

# Run in CI mode (fail fast)
./test-runner.sh --ci
```

#### Individual Test Types
```bash
# Unit tests only
./test-runner.sh --unit-only
npm run test

# E2E tests only
./test-runner.sh --e2e-only
npm run test:e2e

# Visual regression tests only
./test-runner.sh --visual-only
npm run test:visual

# With coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

#### Playwright Browser Installation
```bash
# Install Playwright browsers (one-time setup)
npm run test:install
```

## Test Commands Reference

| Command | Description |
|---------|-------------|
| `npm run test` | Run Jest unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:coverage` | Run unit tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI mode |
| `npm run test:visual` | Run visual regression tests |
| `npm run test:all` | Run unit and E2E tests |
| `npm run test:install` | Install Playwright browsers |
| `./test-runner.sh` | Run comprehensive test suite |

## Test Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with ts-jest
- JSDOM environment for React components
- CSS and asset mocking
- Custom test utilities
- Coverage thresholds (70% minimum)

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing (Chromium, Firefox, WebKit)
- Mobile and desktop viewports
- Automatic screenshot and video capture on failure
- Development server integration

## Writing Tests

### Best Practices

1. **Use Test Utilities**: Import from `../utils/test-utils` for consistent setup
2. **Mock External Dependencies**: Use MSW for API calls, mock external libraries
3. **Test User Behavior**: Focus on what users see and do, not implementation details
4. **Descriptive Test Names**: Use clear, descriptive test descriptions
5. **Arrange-Act-Assert**: Structure tests clearly

### Test Utilities

#### Custom Render Function
```typescript
import { render } from '../utils/test-utils';

// Automatically wraps components with providers
render(<MyComponent />, { route: '/dashboard' });
```

#### E2E Helpers
```typescript
import { LoginPageHelpers, DashboardPageHelpers } from '../utils/e2e-helpers';

const loginHelpers = new LoginPageHelpers(page);
await loginHelpers.loginWithTestCredentials();
```

#### Responsive Testing
```typescript
import { setMobileViewport, setDesktopViewport } from '../utils/test-utils';

setMobileViewport();
render(<MyComponent />);
// Test mobile layout
```

### Mock API Responses

The test suite uses MSW to mock API endpoints:

```typescript
// Login endpoint automatically mocked with test credentials
// test@example.com / test123 -> successful login
// Other credentials -> failure

// Custom mocking in tests
const mockHelpers = new MockHelpers(page);
await mockHelpers.mockLoginAPI(false); // Mock login failure
```

## Test Data

### Test Credentials
- **Email**: `test@example.com`
- **Password**: `test123`
- **User**: `測試用戶` (Test User)

### Mock Data
- Customer data with realistic Chinese names and contact info
- Property data with Taiwan addresses and pricing
- Analytics data with business metrics

## Coverage Requirements

Minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Debugging Tests

### Unit Test Debugging
```bash
# Run specific test file
npm test -- LoginPage.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="login"

# Debug mode
npm test -- --watch --verbose
```

### E2E Test Debugging
```bash
# Run with UI mode for debugging
npm run test:e2e:ui

# Run specific test file
npx playwright test login.spec.ts

# Debug mode
npx playwright test --debug
```

### Visual Test Debugging
```bash
# Update all screenshots
npx playwright test --update-snapshots

# Update specific test screenshots
npx playwright test visual.spec.ts --update-snapshots
```

## Continuous Integration

The test suite is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run Tests
  run: |
    npm ci
    ./test-runner.sh --ci --coverage
```

### CI-Specific Features
- Fail-fast mode with `--ci` flag
- Automatic browser installation
- Coverage reporting
- Test result artifacts

## Reports and Artifacts

### Generated Reports
1. **Jest Coverage**: `coverage/lcov-report/index.html`
2. **Playwright Report**: `playwright-report/index.html`
3. **Visual Diffs**: `test-results/`
4. **Test Results**: Console output and JSON reports

### Accessing Reports
```bash
# Open coverage report (macOS)
open coverage/lcov-report/index.html

# Open E2E test report
open playwright-report/index.html
```

## Performance Considerations

- Tests run in parallel where possible
- Selective test execution with command-line flags
- Efficient browser reuse in Playwright
- Fast feedback with watch mode

## Troubleshooting

### Common Issues

1. **Playwright browsers not installed**
   ```bash
   npm run test:install
   ```

2. **Visual tests failing (first run)**
   ```bash
   npx playwright test --update-snapshots
   ```

3. **Port conflicts**
   - Ensure development server is not running during E2E tests
   - Playwright will start its own server

4. **Mock API issues**
   - Check MSW handlers in `src/test/mocks/server.ts`
   - Verify test credentials match expected values

5. **Coverage threshold failures**
   - Add more unit tests for uncovered code
   - Check `jest.config.js` for threshold settings

### Getting Help

1. Check console output for specific error messages
2. Review generated test reports
3. Use debug modes for step-by-step execution
4. Verify test environment setup

## Future Enhancements

Planned testing improvements:
- Performance testing with Lighthouse
- Accessibility testing with axe-core
- Cross-browser compatibility matrix
- API contract testing
- Load testing scenarios

---

For questions or issues with the testing setup, please refer to this documentation or check the generated test reports for detailed information.