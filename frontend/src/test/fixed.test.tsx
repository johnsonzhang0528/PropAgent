/**
 * Simplified comprehensive tests for PropAgent Pro
 * These tests verify the core functionality without jest-dom dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Components to test
import App from '../App';
import DashboardPage from '../pages/dashboard/DashboardPage';
import CustomerPage from '../pages/customer/CustomerPage';
import MainLayout from '../components/layout/MainLayout';

// Create a test store
const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      user: {
        id: '1',
        name: '測試用戶',
        email: 'test@example.com',
        role: 'agent'
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      loading: false,
      error: null
    }
  }
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={createTestStore()}>
    <ConfigProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ConfigProvider>
  </Provider>
);

describe('PropAgent Pro - Core Functionality', () => {
  describe('Basic Component Rendering', () => {
    test('Dashboard page renders without crashing', () => {
      const { container } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      expect(container).toBeTruthy();
      
      // Check for key dashboard elements
      const dashboard = screen.getByText('儀表板');
      expect(dashboard).toBeTruthy();
      
      const totalCustomers = screen.getByText('總客戶數');
      expect(totalCustomers).toBeTruthy();
      
      const activities = screen.getByText('最近活動');
      expect(activities).toBeTruthy();
    });

    test('Customer page renders without crashing', () => {
      const { container } = render(
        <TestWrapper>
          <CustomerPage />
        </TestWrapper>
      );
      
      expect(container).toBeTruthy();
      
      const customerManagement = screen.getByText('客戶管理');
      expect(customerManagement).toBeTruthy();
      
      const addButton = screen.getByText('新增客戶');
      expect(addButton).toBeTruthy();
    });

    test('MainLayout renders correctly with navigation', () => {
      const TestContent = () => <div data-testid="test-content">Test Content</div>;
      
      const { container } = render(
        <TestWrapper>
          <MainLayout>
            <TestContent />
          </MainLayout>
        </TestWrapper>
      );
      
      expect(container).toBeTruthy();
      
      // Check for layout elements
      const brand = screen.getByText('PropAgent Pro');
      expect(brand).toBeTruthy();
      
      const title = screen.getByText('房地產智能客戶管理系統');
      expect(title).toBeTruthy();
      
      // Check navigation items
      const dashboard = screen.getByText('儀表板');
      expect(dashboard).toBeTruthy();
      
      const customers = screen.getByText('客戶管理');
      expect(customers).toBeTruthy();
      
      const properties = screen.getByText('房產管理');
      expect(properties).toBeTruthy();
      
      const analytics = screen.getByText('分析報告');
      expect(analytics).toBeTruthy();
      
      // Check content is rendered
      const testContent = screen.getByTestId('test-content');
      expect(testContent).toBeTruthy();
    });
  });

  describe('Redux Store Integration', () => {
    test('Auth store works correctly', () => {
      const store = createTestStore();
      const state = store.getState();
      
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user?.name).toBe('測試用戶');
      expect(state.auth.token).toBe('mock-token');
    });

    test('Store provides data to components', () => {
      const { container } = render(
        <TestWrapper>
          <MainLayout>
            <div>Test</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // Should show user name from store
      const userName = screen.getByText('測試用戶');
      expect(userName).toBeTruthy();
    });
  });

  describe('Antd Component Integration', () => {
    test('Antd components render properly', () => {
      const { Button, Card } = require('antd');
      
      const { container } = render(
        <TestWrapper>
          <div>
            <Button type="primary">Test Button</Button>
            <Card title="Test Card">Card Content</Card>
          </div>
        </TestWrapper>
      );
      
      expect(container).toBeTruthy();
      expect(container.textContent).toContain('Test Button');
      expect(container.textContent).toContain('Test Card');
    });

    test('Statistics display correctly', () => {
      const { container } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      // Check statistic values
      expect(screen.getByText('156')).toBeTruthy(); // Total customers
      expect(screen.getByText('89')).toBeTruthy();  // Properties
      expect(screen.getByText('12')).toBeTruthy();  // Monthly deals
      expect(screen.getByText('NT$ 2,850,000')).toBeTruthy(); // Revenue
    });
  });

  describe('UI Responsiveness', () => {
    test('Grid system classes are applied', () => {
      const { container } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      // Check for Antd grid classes
      const gridItems = container.querySelectorAll('.ant-col');
      expect(gridItems.length).toBeGreaterThan(0);
      
      const rows = container.querySelectorAll('.ant-row');
      expect(rows.length).toBeGreaterThan(0);
    });

    test('Cards have proper structure', () => {
      const { container } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      const cards = container.querySelectorAll('.ant-card');
      expect(cards.length).toBeGreaterThan(4); // Statistics + activity cards
    });
  });

  describe('Navigation Structure', () => {
    test('All navigation links are present', () => {
      const { container } = render(
        <TestWrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // Check all menu items exist
      const menuItems = [
        '儀表板',
        '客戶管理', 
        '房產管理',
        '分析報告'
      ];
      
      menuItems.forEach(item => {
        const element = screen.getByText(item);
        expect(element).toBeTruthy();
      });
    });

    test('User dropdown is present', () => {
      const { container } = render(
        <TestWrapper>
          <MainLayout>
            <div>Content</div>
          </MainLayout>
        </TestWrapper>
      );
      
      // User name should be visible
      const userName = screen.getByText('測試用戶');
      expect(userName).toBeTruthy();
      
      // Avatar should be present
      const avatars = container.querySelectorAll('.ant-avatar');
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  describe('Content Verification', () => {
    test('Dashboard shows activity items', () => {
      const { container } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      // Check activity items
      expect(screen.getByText(/與張先生通話/)).toBeTruthy();
      expect(screen.getByText(/新增房產信息/)).toBeTruthy();
      expect(screen.getByText(/完成李女士看房/)).toBeTruthy();
    });

    test('Dashboard shows todo items', () => {
      const { container } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );
      
      // Check todo items
      expect(screen.getByText(/王先生看房/)).toBeTruthy();
      expect(screen.getByText(/回電陳女士詢價/)).toBeTruthy();
      expect(screen.getByText(/更新房產照片/)).toBeTruthy();
    });

    test('Customer page shows table structure', () => {
      const { container } = render(
        <TestWrapper>
          <CustomerPage />
        </TestWrapper>
      );
      
      // Check for table presence
      const tables = container.querySelectorAll('.ant-table');
      expect(tables.length).toBeGreaterThan(0);
      
      // Check for sample data
      expect(screen.getByText('張先生')).toBeTruthy();
      expect(screen.getByText('李女士')).toBeTruthy();
    });
  });
});

describe('System Integration Tests', () => {
  test('Complete app renders without errors', () => {
    // Mock localStorage for authentication
    const mockToken = 'mock-token';
    const mockUser = JSON.stringify({
      id: '1',
      name: '測試用戶',
      email: 'test@example.com',
      role: 'agent'
    });
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => {
          if (key === 'token') return mockToken;
          if (key === 'user') return mockUser;
          return null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    const { container } = render(<App />);
    
    expect(container).toBeTruthy();
  });
});