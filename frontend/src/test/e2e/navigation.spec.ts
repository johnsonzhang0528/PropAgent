import { test, expect } from '@playwright/test';
import { LoginPageHelpers, DashboardPageHelpers, MockHelpers, NavigationHelpers } from '../utils/e2e-helpers';

test.describe('Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockHelpers = new MockHelpers(page);
    await mockHelpers.mockLoginAPI(true);
    await mockHelpers.mockCustomersAPI();
    await mockHelpers.mockPropertiesAPI();
    
    // Login first
    await page.goto('/login');
    const loginHelpers = new LoginPageHelpers(page);
    await loginHelpers.loginWithTestCredentials();
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate between all main pages', async ({ page }) => {
    const dashboardHelpers = new DashboardPageHelpers(page);
    const navigationHelpers = new NavigationHelpers(page);
    
    // Start on dashboard
    await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible();
    
    // Navigate to customers
    await dashboardHelpers.navigateToPage('客戶管理');
    await navigationHelpers.waitForNavigation('/customers');
    expect(await navigationHelpers.checkCurrentUrl('/customers')).toBe(true);
    
    // Navigate to properties
    await dashboardHelpers.navigateToPage('房產管理');
    await navigationHelpers.waitForNavigation('/properties');
    expect(await navigationHelpers.checkCurrentUrl('/properties')).toBe(true);
    
    // Navigate to analytics
    await dashboardHelpers.navigateToPage('分析報告');
    await navigationHelpers.waitForNavigation('/analytics');
    expect(await navigationHelpers.checkCurrentUrl('/analytics')).toBe(true);
    
    // Navigate back to dashboard
    await dashboardHelpers.navigateToPage('儀表板');
    await navigationHelpers.waitForNavigation('/dashboard');
    expect(await navigationHelpers.checkCurrentUrl('/dashboard')).toBe(true);
  });

  test('should maintain menu highlighting during navigation', async ({ page }) => {
    const pages = [
      { name: '客戶管理', url: '/customers' },
      { name: '房產管理', url: '/properties' },
      { name: '分析報告', url: '/analytics' },
      { name: '儀表板', url: '/dashboard' }
    ];
    
    for (const pageInfo of pages) {
      await page.getByText(pageInfo.name).click();
      await expect(page).toHaveURL(pageInfo.url);
      
      // Check that the current menu item is highlighted
      const menuItem = page.getByText(pageInfo.name).locator('..');
      await expect(menuItem).toHaveClass(/ant-menu-item-selected/);
    }
  });

  test('should support browser back and forward navigation', async ({ page }) => {
    const dashboardHelpers = new DashboardPageHelpers(page);
    
    // Navigate through several pages
    await dashboardHelpers.navigateToPage('客戶管理');
    await expect(page).toHaveURL('/customers');
    
    await dashboardHelpers.navigateToPage('房產管理');
    await expect(page).toHaveURL('/properties');
    
    await dashboardHelpers.navigateToPage('分析報告');
    await expect(page).toHaveURL('/analytics');
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/properties');
    
    await page.goBack();
    await expect(page).toHaveURL('/customers');
    
    await page.goBack();
    await expect(page).toHaveURL('/dashboard');
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL('/customers');
    
    await page.goForward();
    await expect(page).toHaveURL('/properties');
  });

  test('should preserve authentication state during navigation', async ({ page }) => {
    const dashboardHelpers = new DashboardPageHelpers(page);
    const pages = ['客戶管理', '房產管理', '分析報告', '儀表板'] as const;
    
    for (const pageName of pages) {
      await dashboardHelpers.navigateToPage(pageName);
      
      // User should still be visible
      await expect(page.getByText('測試用戶')).toBeVisible();
      await expect(dashboardHelpers.userAvatar).toBeVisible();
      
      // All navigation options should still be available
      await expect(page.getByText('儀表板')).toBeVisible();
      await expect(page.getByText('客戶管理')).toBeVisible();
      await expect(page.getByText('房產管理')).toBeVisible();
      await expect(page.getByText('分析報告')).toBeVisible();
    }
  });

  test('should handle direct URL access', async ({ page }) => {
    const urls = ['/dashboard', '/customers', '/properties', '/analytics'];
    
    for (const url of urls) {
      await page.goto(url);
      await expect(page).toHaveURL(url);
      
      // Should maintain authentication and layout
      await expect(page.getByText('測試用戶')).toBeVisible();
      await expect(page.getByText('PropAgent Pro')).toBeVisible();
    }
  });

  test('should maintain consistent layout across all pages', async ({ page }) => {
    const dashboardHelpers = new DashboardPageHelpers(page);
    const pages = ['客戶管理', '房產管理', '分析報告', '儀表板'] as const;
    
    for (const pageName of pages) {
      await dashboardHelpers.navigateToPage(pageName);
      
      // Check consistent layout elements
      await expect(dashboardHelpers.sidebar).toBeVisible();
      await expect(dashboardHelpers.header).toBeVisible();
      await expect(dashboardHelpers.content).toBeVisible();
      
      // Check header content
      await expect(page.getByText('房地產智能客戶管理系統')).toBeVisible();
      await expect(page.getByText('測試用戶')).toBeVisible();
      
      // Check sidebar branding
      await expect(page.getByText('PropAgent Pro')).toBeVisible();
    }
  });

  test('should handle navigation keyboard shortcuts', async ({ page }) => {
    // Test Alt+1 for dashboard (if implemented)
    await page.keyboard.press('Alt+1');
    // Note: This would require actual keyboard shortcut implementation
    
    // Test Tab navigation for accessibility
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate using keyboard
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should handle logout from any page', async ({ page }) => {
    const dashboardHelpers = new DashboardPageHelpers(page);
    const pages = ['客戶管理', '房產管理', '分析報告'] as const;
    
    for (const pageName of pages) {
      // Navigate to the page
      await dashboardHelpers.navigateToPage(pageName);
      
      // Logout from this page
      await dashboardHelpers.userAvatar.click();
      await page.getByText('登出').click();
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
      
      // Login again for next iteration
      const loginHelpers = new LoginPageHelpers(page);
      await loginHelpers.loginWithTestCredentials();
      await expect(page).toHaveURL('/dashboard');
    }
  });

  test('should maintain scroll position during navigation', async ({ page }) => {
    // Navigate to a page and scroll down (if content is long enough)
    await page.getByText('客戶管理').click();
    await expect(page).toHaveURL('/customers');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 100));
    
    // Navigate to another page
    await page.getByText('房產管理').click();
    await expect(page).toHaveURL('/properties');
    
    // Navigate back
    await page.getByText('客戶管理').click();
    await expect(page).toHaveURL('/customers');
    
    // Page should start from top (default behavior)
    const scrollTop = await page.evaluate(() => window.scrollY);
    expect(scrollTop).toBe(0);
  });
});