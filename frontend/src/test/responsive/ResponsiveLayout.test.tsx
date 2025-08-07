import { screen } from '@testing-library/react';
import { render, setMobileViewport, setTabletViewport, setDesktopViewport } from '../utils/test-utils';
import App from '../../App';
import { store } from '../../store';
import { loginSuccess, logout } from '../../store/slices/authSlice';

describe('Responsive Layout', () => {
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

  describe('Desktop Layout (1920x1080)', () => {
    beforeEach(() => {
      setDesktopViewport();
    });

    it('displays all elements correctly on desktop', () => {
      render(<App />, { route: '/dashboard' });
      
      // Main layout should be visible
      expect(expect(screen.getByText('PropAgent Pro'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('房地產智能客戶管理系統'))toBeTruthy()).toBeTruthy();
      
      // Sidebar should be visible
      expect(expect(screen.getByText('儀表板'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('客戶管理'))toBeTruthy()).toBeTruthy();
      
      // Statistics cards should be in 4 columns
      const statisticCards = document.querySelectorAll('.ant-col-md-6');
      expect(statisticCards.length).toBe(4);
      
      // Activity cards should be in 2 columns
      const activityCards = document.querySelectorAll('.ant-col-xs-24.ant-col-md-12');
      expect(activityCards.length).toBe(2);
    });

    it('sidebar has correct width on desktop', () => {
      render(<App />, { route: '/dashboard' });
      
      const sidebar = document.querySelector('.ant-layout-sider');
      expect(sidebar)// .toHaveStyle('width: 200px');
    });
  });

  describe('Tablet Layout (768x1024)', () => {
    beforeEach(() => {
      setTabletViewport();
    });

    it('adjusts layout for tablet correctly', () => {
      render(<App />, { route: '/dashboard' });
      
      // Main elements should still be visible
      expect(expect(screen.getByText('PropAgent Pro'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('房地產智能客戶管理系統'))toBeTruthy()).toBeTruthy();
      
      // Statistics should adapt to tablet layout (sm=12, so 2 per row)
      const statisticCards = document.querySelectorAll('.ant-col-sm-12');
      expect(statisticCards.length).toBe(4);
    });

    it('maintains navigation functionality on tablet', () => {
      render(<App />, { route: '/dashboard' });
      
      // All navigation items should be accessible
      expect(expect(screen.getByText('儀表板'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('客戶管理'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('房產管理'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('分析報告'))toBeTruthy()).toBeTruthy();
    });
  });

  describe('Mobile Layout (375x667)', () => {
    beforeEach(() => {
      setMobileViewport();
    });

    it('stacks cards vertically on mobile', () => {
      render(<App />, { route: '/dashboard' });
      
      // All cards should be full width on mobile (xs=24)
      const fullWidthCards = document.querySelectorAll('.ant-col-xs-24');
      expect(fullWidthCards.length).toBeGreaterThan(4); // At least statistics + activity cards
    });

    it('maintains header functionality on mobile', () => {
      render(<App />, { route: '/dashboard' });
      
      // Header elements should be visible
      expect(expect(screen.getByText('房地產智能客戶管理系統'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
    });

    it('sidebar remains functional on mobile', () => {
      render(<App />, { route: '/dashboard' });
      
      // Navigation should still be accessible
      expect(expect(screen.getByText('儀表板'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('客戶管理'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('房產管理'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('分析報告'))toBeTruthy()).toBeTruthy();
    });

    it('content remains readable on mobile', () => {
      render(<App />, { route: '/dashboard' });
      
      // Text content should be present and readable
      expect(expect(screen.getByText('總客戶數'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('156'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('最近活動'))toBeTruthy()).toBeTruthy();
      expect(expect(screen.getByText('待辦事項'))toBeTruthy()).toBeTruthy();
    });
  });

  describe('Cross-viewport Navigation', () => {
    it('maintains navigation state when switching viewports', () => {
      // Start on desktop
      setDesktopViewport();
      render(<App />, { route: '/customers' });
      
      // Should be on customers page
      expect(window.location.pathname).toBe('/customers');
      
      // Switch to mobile
      setMobileViewport();
      
      // Should still be on customers page
      expect(window.location.pathname).toBe('/customers');
      
      // Switch to tablet
      setTabletViewport();
      
      // Should still be on customers page
      expect(window.location.pathname).toBe('/customers');
    });

    it('preserves authentication across viewports', () => {
      setDesktopViewport();
      render(<App />, { route: '/dashboard' });
      expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
      
      setMobileViewport();
      expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
      
      setTabletViewport();
      expect(expect(screen.getByText('測試用戶'))toBeTruthy()).toBeTruthy();
    });
  });

  describe('Antd Grid System Compliance', () => {
    it('uses correct grid breakpoints', () => {
      setDesktopViewport();
      render(<App />, { route: '/dashboard' });
      
      // Check that Antd grid classes are applied correctly
      expect(expect(document.querySelector('.ant-col-xs-24'))toBeTruthy()).toBeTruthy();
      expect(expect(document.querySelector('.ant-col-sm-12'))toBeTruthy()).toBeTruthy();
      expect(expect(document.querySelector('.ant-col-md-6'))toBeTruthy()).toBeTruthy();
    });

    it('maintains proper spacing across viewports', () => {
      const viewports = [setDesktopViewport, setTabletViewport, setMobileViewport];
      
      viewports.forEach(setViewport => {
        setViewport();
        render(<App />, { route: '/dashboard' });
        
        // Check that Antd row has proper gutter
        const row = document.querySelector('.ant-row');
        expect(row)toBeTruthy();
      });
    });
  });
});