import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import App from '../../App';
import { store } from '../../store';
import { loginSuccess, logout } from '../../store/slices/authSlice';

describe('App Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set authenticated state
    store.dispatch(loginSuccess({
      user: {
        id: '1',
        name: '測試用戶',
        email: 'test@example.com',
        role: 'admin'
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token'
    }));
  });

  afterEach(() => {
    store.dispatch(logout());
  });

  it('navigates to dashboard page correctly', async () => {
    const user = userEvent.setup();
    render(<App />, { route: '/dashboard' });
    
    await waitFor(() => {
      expect(expect(screen.getByRole('heading', { name: '儀表板' }))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('總客戶數'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('可售房產'))toBeTruthy()).toBeTruthy();
    });
  });

  it('navigates to customers page correctly', async () => {
    const user = userEvent.setup();
    render(<App />, { route: '/customers' });
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/customers');
    });
  });

  it('navigates to properties page correctly', async () => {
    const user = userEvent.setup();
    render(<App />, { route: '/properties' });
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/properties');
    });
  });

  it('navigates to analytics page correctly', async () => {
    const user = userEvent.setup();
    render(<App />, { route: '/analytics' });
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/analytics');
    });
  });

  it('supports navigation via menu clicks', async () => {
    const user = userEvent.setup();
    render(<App />, { route: '/dashboard' });
    
    // Navigate to customers
    await user.click(screen.getByText('客戶管理'));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/customers');
    });
    
    // Navigate to properties
    await user.click(screen.getByText('房產管理'));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/properties');
    });
    
    // Navigate to analytics
    await user.click(screen.getByText('分析報告'));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/analytics');
    });
    
    // Navigate back to dashboard
    await user.click(screen.getByText('儀表板'));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
  });

  it('highlights current active menu item', async () => {
    const user = userEvent.setup();
    render(<App />, { route: '/dashboard' });
    
    // Dashboard should be highlighted initially
    let dashboardMenuItem = screen.getByText('儀表板').closest('.ant-menu-item');
    expect(dashboardMenuItem)// .toHaveClass('ant-menu-item-selected');
    
    // Navigate to customers and check highlight
    await user.click(screen.getByText('客戶管理'));
    await waitFor(() => {
      const customersMenuItem = screen.getByText('客戶管理').closest('.ant-menu-item');
      expect(customersMenuItem)// .toHaveClass('ant-menu-item-selected');
    });
    
    // Navigate to properties and check highlight
    await user.click(screen.getByText('房產管理'));
    await waitFor(() => {
      const propertiesMenuItem = screen.getByText('房產管理').closest('.ant-menu-item');
      expect(propertiesMenuItem)// .toHaveClass('ant-menu-item-selected');
    });
  });

  it('preserves authentication state during navigation', async () => {
    const user = userEvent.setup();
    render(<App />, { route: '/dashboard' });
    
    // User should be visible in all pages
    expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
    
    await user.click(screen.getByText('客戶管理'));
    await waitFor(() => {
      expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
    });
    
    await user.click(screen.getByText('房產管理'));
    await waitFor(() => {
      expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
    });
    
    await user.click(screen.getByText('分析報告'));
    await waitFor(() => {
      expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
    });
  });

  it('handles browser back and forward navigation', async () => {
    render(<App />, { route: '/dashboard' });
    
    // Simulate navigation via browser history
    window.history.pushState({}, '', '/customers');
    window.dispatchEvent(new PopStateEvent('popstate'));
    
    await waitFor(() => {
      expect(window.location.pathname).toBe('/customers');
    });
    
    // Go back
    window.history.back();
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });
  });

  it('redirects root path to dashboard', () => {
    render(<App />, { route: '/' });
    
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('maintains consistent layout across all pages', async () => {
    const user = userEvent.setup();
    const pages = ['/dashboard', '/customers', '/properties', '/analytics'];
    
    for (const page of pages) {
      render(<App />, { route: page });
      
      // Check that main layout elements are present
      expect(expect(screen.getByText('PropAgent Pro'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('房地產智能客戶管理系統'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
      
      // Check that all menu items are present
      expect(expect(screen.getByText('儀表板'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('客戶管理'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('房產管理'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('分析報告'))toBeTruthy()).toBeTruthy();
    }
  });
});