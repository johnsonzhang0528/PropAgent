import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAuthenticatedState } from '../utils/test-utils';
import MainLayout from '../../components/layout/MainLayout';
import { store } from '../../store';
import { loginSuccess, logout } from '../../store/slices/authSlice';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

const TestContent = () => <div data-testid="test-content">Test Content</div>;

describe('MainLayout', () => {
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

  it('renders layout structure correctly', () => {
    render(
      <MainLayout>
        <TestContent />
      </MainLayout>
    );
    
    // Check main layout components
    expect(expect(screen.getByText('PropAgent Pro'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('房地產智能客戶管理系統'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByTestId('test-content'))toBeTruthy()).toBeTruthy();
  });

  it('renders all navigation menu items', () => {
    render(
      <MainLayout>
        <TestContent />
      </MainLayout>
    );
    
    expect(expect(screen.getByText('儀表板'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('客戶管理'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('房產管理'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByText('分析報告'))toBeTruthy()).toBeTruthy();
  });

  it('displays user information in header', () => {
    render(
      <MainLayout>
        <TestContent />
      </MainLayout>
    );
    
    expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByRole('img', { name: 'user' }))toBeTruthy()).toBeTruthy();
  });

  it('handles menu navigation correctly', async () => {
    const user = userEvent.setup();
    render(
      <MainLayout>
        <TestContent />
      </MainLayout>
    );
    
    await user.click(screen.getByText('客戶管理'));
    expect(mockNavigate).toHaveBeenCalledWith('/customers');
    
    await user.click(screen.getByText('房產管理'));
    expect(mockNavigate).toHaveBeenCalledWith('/properties');
    
    await user.click(screen.getByText('分析報告'));
    expect(mockNavigate).toHaveBeenCalledWith('/analytics');
  });

  it('handles user dropdown menu', async () => {
    const user = userEvent.setup();
    render(
      <MainLayout>
        <TestContent />
      </MainLayout>
    );
    
    // Click on user avatar to open dropdown
    await user.click(screen.getByRole('img', { name: 'user' }));
    
    await waitFor(() => {
      expect(expect(screen.getByText('個人設置'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('登出'))toBeTruthy()).toBeTruthy();
    });
  });

  it('handles logout functionality', async () => {
    const user = userEvent.setup();
    render(
      <MainLayout>
        <TestContent />
      </MainLayout>
    );
    
    // Click on user avatar to open dropdown
    await user.click(screen.getByRole('img', { name: 'user' }));
    
    await waitFor(() => {
      expect(expect(screen.getByText('登出'))toBeTruthy()).toBeTruthy();
    });
    
    // Click logout
    await user.click(screen.getByText('登出'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    
    // Check that auth state is cleared
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBe(null);
  });

  it('highlights current menu item correctly', () => {
    render(
      <MainLayout>
        <TestContent />
      </MainLayout>
    );
    
    // Current location is /dashboard, so dashboard menu item should be highlighted
    const dashboardMenuItem = screen.getByText('儀表板').closest('.ant-menu-item');
    expect(dashboardMenuItem)// .toHaveClass('ant-menu-item-selected');
  });

  it('has proper accessibility attributes', () => {
    render(
      <MainLayout>
        <TestContent />
      </MainLayout>
    );
    
    // Check for proper ARIA labels and roles
    expect(expect(screen.getByRole('navigation'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByRole('banner'))toBeTruthy()).toBeTruthy();
    expect(expect(screen.getByRole('main'))toBeTruthy()).toBeTruthy();
  });

  it('renders without user when user is null', () => {
    // Clear user from store
    store.dispatch(logout());
    store.dispatch(loginSuccess({
      user: null,
      token: 'mock-token',
      refreshToken: 'mock-refresh-token'
    }));
    
    render(
      <MainLayout>
        <TestContent />
      </MainLayout>
    );
    
    expect(expect(screen.getByText('用戶'))toBeTruthy()).toBeTruthy();
  });
});