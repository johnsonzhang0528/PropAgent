import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { theme } from '../../styles/theme';
import { store } from '../../store';
import type { RootState } from '../../store';

// Create a custom render function that includes providers
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  route?: string;
}

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ConfigProvider theme={theme} locale={zhCN}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: ExtendedRenderOptions
) => {
  const { route = '/', ...renderOptions } = options || {};
  
  // Set the route if provided
  if (route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }
  
  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// Mock authenticated user state
export const mockAuthenticatedState = {
  auth: {
    isAuthenticated: true,
    user: {
      id: '1',
      name: '測試用戶',
      email: 'test@example.com',
      role: 'admin'
    },
    token: 'mock-token',
    refreshToken: 'mock-refresh-token',
    loading: false,
    error: null
  }
};

// Mock unauthenticated user state
export const mockUnauthenticatedState = {
  auth: {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    loading: false,
    error: null
  }
};

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to mock fetch responses
export const mockFetch = (response: any, ok = true, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(response),
    })
  ) as jest.Mock;
};

// Screen size helpers for responsive testing
export const setMobileViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667,
  });
  window.dispatchEvent(new Event('resize'));
};

export const setTabletViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 768,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  window.dispatchEvent(new Event('resize'));
};

export const setDesktopViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080,
  });
  window.dispatchEvent(new Event('resize'));
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };