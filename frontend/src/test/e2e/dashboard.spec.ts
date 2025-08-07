import { test, expect } from '@playwright/test';
import { LoginPageHelpers, DashboardPageHelpers, MockHelpers } from '../utils/e2e-helpers';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockHelpers = new MockHelpers(page);
    await mockHelpers.mockLoginAPI(true);
    
    // Login first
    await page.goto('/login');
    const loginHelpers = new LoginPageHelpers(page);
    await loginHelpers.loginWithTestCredentials();
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard correctly after login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible();
    
    // Check statistics cards
    await expect(page.getByText('總客戶數')).toBeVisible();
    await expect(page.getByText('156')).toBeVisible();
    
    await expect(page.getByText('可售房產')).toBeVisible();
    await expect(page.getByText('89')).toBeVisible();
    
    await expect(page.getByText('本月成交')).toBeVisible();
    await expect(page.getByText('12')).toBeVisible();
    
    await expect(page.getByText('成交金額')).toBeVisible();
    await expect(page.getByText('NT$ 2,850,000')).toBeVisible();
  });

  test('should display activity and todo sections', async ({ page }) => {
    await expect(page.getByText('最近活動')).toBeVisible();
    await expect(page.getByText('📞 與張先生通話 - 2 小時前')).toBeVisible();
    await expect(page.getByText('🏠 新增房產信息 - 3 小時前')).toBeVisible();
    
    await expect(page.getByText('待辦事項')).toBeVisible();
    await expect(page.getByText('📅 明天 10:00 - 王先生看房')).toBeVisible();
    await expect(page.getByText('📞 回電陳女士詢價')).toBeVisible();
  });

  test('should show user information in header', async ({ page }) => {
    const dashboardHelpers = new DashboardPageHelpers(page);
    
    await expect(page.getByText('房地產智能客戶管理系統')).toBeVisible();
    await expect(page.getByText('測試用戶')).toBeVisible();
    await expect(dashboardHelpers.userAvatar).toBeVisible();
  });

  test('should have working navigation menu', async ({ page }) => {
    const dashboardHelpers = new DashboardPageHelpers(page);
    
    // Check all menu items are visible
    await expect(page.getByText('儀表板')).toBeVisible();
    await expect(page.getByText('客戶管理')).toBeVisible();
    await expect(page.getByText('房產管理')).toBeVisible();
    await expect(page.getByText('分析報告')).toBeVisible();
    
    // Test navigation to customers
    await dashboardHelpers.navigateToPage('客戶管理');
    await expect(page).toHaveURL('/customers');
    
    // Navigate back to dashboard
    await dashboardHelpers.navigateToPage('儀表板');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should highlight current page in navigation', async ({ page }) => {
    // Dashboard should be highlighted
    const dashboardMenuItem = page.getByText('儀表板').locator('..');
    await expect(dashboardMenuItem).toHaveClass(/ant-menu-item-selected/);
    
    // Navigate to customers and check highlight
    await page.getByText('客戶管理').click();
    await expect(page).toHaveURL('/customers');
    
    const customersMenuItem = page.getByText('客戶管理').locator('..');
    await expect(customersMenuItem).toHaveClass(/ant-menu-item-selected/);
  });

  test('should handle logout correctly', async ({ page }) => {
    const dashboardHelpers = new DashboardPageHelpers(page);
    
    // Open user dropdown
    await dashboardHelpers.userAvatar.click();
    await expect(page.getByText('登出')).toBeVisible();
    
    // Click logout
    await page.getByText('登出').click();
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('PropAgent Pro')).toBeVisible();
    await expect(page.getByPlaceholder('郵箱地址')).toBeVisible();
  });

  test('should maintain layout integrity', async ({ page }) => {
    const dashboardHelpers = new DashboardPageHelpers(page);
    
    // Check main layout components
    await expect(dashboardHelpers.sidebar).toBeVisible();
    await expect(dashboardHelpers.header).toBeVisible();
    await expect(dashboardHelpers.content).toBeVisible();
    
    // Check sidebar width
    const sidebarBox = await dashboardHelpers.sidebar.boundingBox();
    expect(sidebarBox?.width).toBe(200);
  });

  test('should handle page refresh correctly', async ({ page }) => {
    await page.reload();
    
    // Should remain on dashboard and maintain authentication
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible();
    await expect(page.getByText('測試用戶')).toBeVisible();
  });
});