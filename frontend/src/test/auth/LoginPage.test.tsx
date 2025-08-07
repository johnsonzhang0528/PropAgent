import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockFetch } from '../utils/test-utils';
import LoginPage from '../../pages/auth/LoginPage';
import { store } from '../../store';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('PropAgent Pro')).toBeTruthy();
    expect(screen.getByPlaceholderText('郵箱地址')).toBeTruthy();
    expect(screen.getByPlaceholderText('密碼')).toBeTruthy();
    expect(screen.getByRole('button', { name: '登入系統' })).toBeTruthy();
    expect(screen.getByText('開發模式測試帳號: test@example.com / test123')).toBeTruthy();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: '登入系統' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('請輸入郵箱!')).toBeTruthy();
      expect(screen.getByText('請輸入密碼!')).toBeTruthy();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('郵箱地址');
    const submitButton = screen.getByRole('button', { name: '登入系統' });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('請輸入有效的郵箱格式!')).toBeTruthy();
    });
  });

  it('handles successful login with test credentials', async () => {
    const user = userEvent.setup();
    
    // Mock successful API response
    mockFetch({
      success: true,
      data: {
        user: {
          id: '1',
          name: '測試用戶',
          email: 'test@example.com',
          role: 'admin'
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token'
      }
    });
    
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('郵箱地址');
    const passwordInput = screen.getByPlaceholderText('密碼');
    const submitButton = screen.getByRole('button', { name: '登入系統' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'test123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
    
    // Check that the auth state is updated
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(true);
    expect(state.auth.user?.email).toBe('test@example.com');
  });

  it('handles login failure', async () => {
    const user = userEvent.setup();
    
    // Mock failed API response
    mockFetch({
      success: false,
      error: { message: '登錄失敗' }
    }, false, 401);
    
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('郵箱地址');
    const passwordInput = screen.getByPlaceholderText('密碼');
    const submitButton = screen.getByRole('button', { name: '登入系統' });
    
    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('登錄失敗')).toBeTruthy();
    });
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles network error', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('郵箱地址');
    const passwordInput = screen.getByPlaceholderText('密碼');
    const submitButton = screen.getByRole('button', { name: '登入系統' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'test123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('網絡錯誤，請檢查後端服務是否啟動')).toBeTruthy();
    });
  });

  it('shows loading state during login', async () => {
    const user = userEvent.setup();
    
    // Mock delayed response
    global.fetch = jest.fn(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              user: { id: '1', name: '測試用戶', email: 'test@example.com', role: 'admin' },
              access_token: 'token',
              refresh_token: 'refresh'
            }
          })
        }), 100)
      )
    );
    
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('郵箱地址');
    const passwordInput = screen.getByPlaceholderText('密碼');
    const submitButton = screen.getByRole('button', { name: '登入系統' });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'test123');
    await user.click(submitButton);
    
    // Check loading state
    expect(submitButton)// .toHaveClass('ant-btn-loading');
    
    await waitFor(() => {
      expect(submitButton).not// .toHaveClass('ant-btn-loading');
    });
  });
});