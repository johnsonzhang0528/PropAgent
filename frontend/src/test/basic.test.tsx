/**
 * Basic functionality test to verify system is working
 */
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Create a simple test store
const testStore = configureStore({
  reducer: {
    auth: authReducer,
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={testStore}>
    <ConfigProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ConfigProvider>
  </Provider>
);

describe('Basic System Tests', () => {
  test('Redux store can be created', () => {
    expect(testStore).toBeDefined();
    expect(testStore.getState()).toBeDefined();
    expect(testStore.getState().auth).toBeDefined();
  });

  test('Auth slice has correct initial state', () => {
    const authState = testStore.getState().auth;
    expect(authState.loading).toBe(false);
    expect(authState.error).toBe(null);
  });

  test('Simple component renders without crashing', () => {
    const TestComponent = () => <div>Test Component</div>;
    
    const { container } = render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );
    
    expect(container).toBeDefined();
    expect(container.textContent).toContain('Test Component');
  });

  test('Antd components can be rendered', () => {
    const { Button } = require('antd');
    
    const { container } = render(
      <TestWrapper>
        <Button type="primary">Test Button</Button>
      </TestWrapper>
    );
    
    expect(container).toBeDefined();
    expect(container.textContent).toContain('Test Button');
  });
});