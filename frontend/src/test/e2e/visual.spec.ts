import { test, expect } from '@playwright/test';
import { LoginPageHelpers, MockHelpers, ResponsiveHelpers } from '../utils/e2e-helpers';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockHelpers = new MockHelpers(page);
    await mockHelpers.mockLoginAPI(true);
    await mockHelpers.mockCustomersAPI();
    await mockHelpers.mockPropertiesAPI();
  });

  test.describe('Login Page Visual Tests', () => {
    test('should match login page screenshot on desktop', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      await page.goto('/login');
      await expect(page.getByText('PropAgent Pro')).toBeVisible();
      
      // Take screenshot and compare
      await expect(page).toHaveScreenshot('login-desktop.png');
    });

    test('should match login page screenshot on mobile', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setMobileViewport();
      
      await page.goto('/login');
      await expect(page.getByText('PropAgent Pro')).toBeVisible();
      
      // Take screenshot and compare
      await expect(page).toHaveScreenshot('login-mobile.png');
    });

    test('should match login page with error message', async ({ page }) => {
      const mockHelpers = new MockHelpers(page);
      await mockHelpers.mockLoginAPI(false);
      
      await page.goto('/login');
      
      const loginHelpers = new LoginPageHelpers(page);
      await loginHelpers.login('wrong@example.com', 'wrongpassword');
      
      await expect(page.getByText('登錄失敗')).toBeVisible();
      await expect(page).toHaveScreenshot('login-error.png');
    });
  });

  test.describe('Dashboard Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      const loginHelpers = new LoginPageHelpers(page);
      await loginHelpers.loginWithTestCredentials();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should match dashboard screenshot on desktop', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible();
      await expect(page).toHaveScreenshot('dashboard-desktop.png');
    });

    test('should match dashboard screenshot on tablet', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setTabletViewport();
      
      await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible();
      await expect(page).toHaveScreenshot('dashboard-tablet.png');
    });

    test('should match dashboard screenshot on mobile', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setMobileViewport();
      
      await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible();
      await expect(page).toHaveScreenshot('dashboard-mobile.png');
    });

    test('should match sidebar navigation', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // Focus on sidebar for detailed comparison
      const sidebar = page.locator('.ant-layout-sider');
      await expect(sidebar).toHaveScreenshot('sidebar-navigation.png');
    });

    test('should match header layout', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // Focus on header for detailed comparison
      const header = page.locator('.ant-layout-header');
      await expect(header).toHaveScreenshot('header-layout.png');
    });

    test('should match statistics cards layout', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // Focus on statistics section
      const statisticsRow = page.locator('.ant-row').first();
      await expect(statisticsRow).toHaveScreenshot('statistics-cards.png');
    });
  });

  test.describe('Navigation Pages Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      const loginHelpers = new LoginPageHelpers(page);
      await loginHelpers.loginWithTestCredentials();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should match customers page', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      await page.getByText('客戶管理').click();
      await expect(page).toHaveURL('/customers');
      
      // Wait for any loading to complete
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('customers-page.png');
    });

    test('should match properties page', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      await page.getByText('房產管理').click();
      await expect(page).toHaveURL('/properties');
      
      // Wait for any loading to complete
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('properties-page.png');
    });

    test('should match analytics page', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      await page.getByText('分析報告').click();
      await expect(page).toHaveURL('/analytics');
      
      // Wait for any loading to complete
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot('analytics-page.png');
    });
  });

  test.describe('Interactive States Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      const loginHelpers = new LoginPageHelpers(page);
      await loginHelpers.loginWithTestCredentials();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should match user dropdown opened state', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // Open user dropdown
      await page.getByRole('img', { name: 'user' }).click();
      await expect(page.getByText('登出')).toBeVisible();
      
      await expect(page).toHaveScreenshot('user-dropdown-open.png');
    });

    test('should match active menu state', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // Navigate to customers to show active state
      await page.getByText('客戶管理').click();
      await expect(page).toHaveURL('/customers');
      
      // Focus on sidebar to show active menu item
      const sidebar = page.locator('.ant-layout-sider');
      await expect(sidebar).toHaveScreenshot('active-menu-state.png');
    });

    test('should match hover states (if applicable)', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // Hover over menu item
      await page.getByText('房產管理').hover();
      
      // Take screenshot to capture hover state
      const sidebar = page.locator('.ant-layout-sider');
      await expect(sidebar).toHaveScreenshot('menu-hover-state.png');
    });
  });

  test.describe('Responsive Layout Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      const loginHelpers = new LoginPageHelpers(page);
      await loginHelpers.loginWithTestCredentials();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should compare dashboard across all breakpoints', async ({ page }) => {
      const breakpoints = [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1920, height: 1080 }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ 
          width: breakpoint.width, 
          height: breakpoint.height 
        });
        
        await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible();
        await expect(page).toHaveScreenshot(`dashboard-${breakpoint.name}-comparison.png`);
      }
    });
  });

  test.describe('Component-Level Visual Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      const loginHelpers = new LoginPageHelpers(page);
      await loginHelpers.loginWithTestCredentials();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should match individual statistic cards', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // Test each statistic card individually
      const cards = [
        { text: '總客戶數', filename: 'statistic-customers.png' },
        { text: '可售房產', filename: 'statistic-properties.png' },
        { text: '本月成交', filename: 'statistic-sales.png' },
        { text: '成交金額', filename: 'statistic-revenue.png' }
      ];

      for (const card of cards) {
        const cardElement = page.getByText(card.text).locator('../..');
        await expect(cardElement).toHaveScreenshot(card.filename);
      }
    });

    test('should match activity and todo cards', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // Activity card
      const activityCard = page.getByText('最近活動').locator('../..');
      await expect(activityCard).toHaveScreenshot('activity-card.png');
      
      // Todo card
      const todoCard = page.getByText('待辦事項').locator('../..');
      await expect(todoCard).toHaveScreenshot('todo-card.png');
    });
  });
});