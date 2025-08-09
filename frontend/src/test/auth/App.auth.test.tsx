import { screen, waitFor } from '@testing-library/react';
import { render } from '../utils/test-utils';
import App from '../../App';
import { store } from '../../store';
import { loginSuccess, logout } from '../../store/slices/authSlice';

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('App Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.dispatch(logout()); // Reset auth state
  });

  it('redirects unauthenticated users to login page', () => {
    render(<App />, { route: '/dashboard' });
    
    expect(window.location.pathname).toBe('/login');
    expect(screen.getByText('PropAgent Pro').toBeInTheDocument();
    expect(screen.getByPlaceholderText('郵箱地址').toBeInTheDocument();
  });

  it('shows dashboard for authenticated users visiting login page', () => {
    // Authenticate user
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

    render(<App />, { route: '/login' });
    
    // Should redirect to dashboard
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('shows main layout for authenticated users', async () => {
    // Authenticate user
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

    render(<App />, { route: '/dashboard' });
    
    await waitFor(() => {
      expect(screen.getByText('PropAgent Pro').toBeInTheDocument();
      expect(screen.getByText('房地產智能客戶管理系統').toBeInTheDocument();
      expect(screen.getByText('儀表板').toBeInTheDocument();
      expect(screen.getByText('客戶管理').toBeInTheDocument();
      expect(screen.getByText('房產管理').toBeInTheDocument();
      expect(screen.getByText('分析報告').toBeInTheDocument();
    });
  });

  it('redirects to dashboard when accessing root path authenticated', () => {
    // Authenticate user
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

    render(<App />, { route: '/' });
    
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('protects all main routes for unauthenticated users', () => {
    const protectedRoutes = ['/dashboard', '/customers', '/properties', '/analytics'];
    
    protectedRoutes.forEach(route => {
      render(<App />, { route });
      expect(window.location.pathname).toBe('/login');
    });
  });

  it('allows access to all main routes for authenticated users', () => {
    // Authenticate user
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

    const authenticatedRoutes = ['/dashboard', '/customers', '/properties', '/analytics'];
    
    authenticatedRoutes.forEach(route => {
      render(<App />, { route });
      expect(window.location.pathname).toBe(route);
    });
  });
});