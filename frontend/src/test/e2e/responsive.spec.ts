import { test, expect } from '@playwright/test';
import { LoginPageHelpers, DashboardPageHelpers, MockHelpers, ResponsiveHelpers } from '../utils/e2e-helpers';

test.describe('Responsive Design E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockHelpers = new MockHelpers(page);
    await mockHelpers.mockLoginAPI(true);
    
    // Login first
    await page.goto('/login');
    const loginHelpers = new LoginPageHelpers(page);
    await loginHelpers.loginWithTestCredentials();
    
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Desktop Layout (1920x1080)', () => {
    test('should display optimal layout on desktop', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // Sidebar should be visible and have correct width
      const sidebar = page.locator('.ant-layout-sider');
      await expect(sidebar).toBeVisible();
      
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox?.width).toBe(200);
      
      // Statistics cards should be in 4 columns
      const statisticCards = page.locator('.ant-col-md-6');
      await expect(statisticCards).toHaveCount(4);
      
      // Activity cards should be in 2 columns
      const activityCards = page.locator('.ant-col:has-text("最近活動"), .ant-col:has-text("待辦事項")');
      await expect(activityCards).toHaveCount(2);
    });

    test('should maintain functionality on desktop', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setDesktopViewport();
      
      // All navigation should work
      await page.getByText('客戶管理').click();
      await expect(page).toHaveURL('/customers');
      
      // User dropdown should work
      await page.getByRole('img', { name: 'user' }).click();
      await expect(page.getByText('登出')).toBeVisible();
    });
  });

  test.describe('Tablet Layout (768x1024)', () => {
    test('should adapt layout for tablet', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setTabletViewport();
      
      // Sidebar should still be visible
      await expect(page.locator('.ant-layout-sider')).toBeVisible();
      
      // Content should adapt to tablet layout
      await expect(page.getByText('PropAgent Pro')).toBeVisible();
      await expect(page.getByText('房地產智能客戶管理系統')).toBeVisible();
      
      // Statistics should be in 2 columns on tablet
      const statisticCards = page.locator('.ant-col-sm-12');
      await expect(statisticCards).toHaveCount(4);
    });

    test('should maintain navigation on tablet', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setTabletViewport();
      
      // All menu items should be clickable
      await page.getByText('房產管理').click();
      await expect(page).toHaveURL('/properties');
      
      await page.getByText('分析報告').click();
      await expect(page).toHaveURL('/analytics');
      
      // User dropdown should still work
      await page.getByRole('img', { name: 'user' }).click();
      await expect(page.getByText('個人設置')).toBeVisible();
    });
  });

  test.describe('Mobile Layout (375x667)', () => {
    test('should stack content vertically on mobile', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setMobileViewport();
      
      // All cards should be full width
      const fullWidthCards = page.locator('.ant-col-xs-24');
      const cardCount = await fullWidthCards.count();
      expect(cardCount).toBeGreaterThan(4); // At least statistics + activity cards
      
      // Content should still be visible
      await expect(page.getByText('總客戶數')).toBeVisible();
      await expect(page.getByText('156')).toBeVisible();
    });

    test('should maintain usability on mobile', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setMobileViewport();
      
      // Navigation should still work on mobile
      await page.getByText('客戶管理').click();
      await expect(page).toHaveURL('/customers');
      
      // User interactions should still work
      await page.getByRole('img', { name: 'user' }).click();
      await expect(page.getByText('登出')).toBeVisible();
    });

    test('should handle touch interactions on mobile', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      await responsiveHelpers.setMobileViewport();
      
      // Test touch/tap interactions
      await page.getByText('房產管理').tap();
      await expect(page).toHaveURL('/properties');
      
      // Test user menu tap
      await page.getByRole('img', { name: 'user' }).tap();
      await expect(page.getByText('登出')).toBeVisible();
    });
  });

  test.describe('Cross-Viewport Navigation', () => {
    test('should maintain state when switching viewports', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      
      // Start on desktop and navigate
      await responsiveHelpers.setDesktopViewport();
      await page.getByText('客戶管理').click();
      await expect(page).toHaveURL('/customers');
      
      // Switch to tablet - should stay on same page
      await responsiveHelpers.setTabletViewport();
      await expect(page).toHaveURL('/customers');
      await expect(page.getByText('測試用戶')).toBeVisible();
      
      // Switch to mobile - should stay on same page
      await responsiveHelpers.setMobileViewport();
      await expect(page).toHaveURL('/customers');
      await expect(page.getByText('測試用戶')).toBeVisible();
    });

    test('should preserve authentication across viewports', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      const viewports = [
        () => responsiveHelpers.setDesktopViewport(),
        () => responsiveHelpers.setTabletViewport(),
        () => responsiveHelpers.setMobileViewport()
      ];
      
      for (const setViewport of viewports) {
        await setViewport();
        
        // Should remain authenticated
        await expect(page.getByText('測試用戶')).toBeVisible();
        await expect(page.getByText('PropAgent Pro')).toBeVisible();
        
        // Navigation should work
        await expect(page.getByText('儀表板')).toBeVisible();
        await expect(page.getByText('客戶管理')).toBeVisible();
      }
    });
  });

  test.describe('Responsive Breakpoint Tests', () => {
    const breakpoints = [
      { name: 'xs', width: 375, height: 667 },
      { name: 'sm', width: 576, height: 768 },
      { name: 'md', width: 768, height: 1024 },
      { name: 'lg', width: 992, height: 768 },
      { name: 'xl', width: 1200, height: 768 },
      { name: 'xxl', width: 1600, height: 900 }
    ];

    for (const breakpoint of breakpoints) {
      test(`should work correctly at ${breakpoint.name} breakpoint (${breakpoint.width}x${breakpoint.height})`, async ({ page }) => {
        await page.setViewportSize({ 
          width: breakpoint.width, 
          height: breakpoint.height 
        });
        
        // Basic functionality should work at all breakpoints
        await expect(page.getByText('PropAgent Pro')).toBeVisible();
        await expect(page.getByText('測試用戶')).toBeVisible();
        
        // Navigation should work
        await page.getByText('分析報告').click();
        await expect(page).toHaveURL('/analytics');
        
        // Go back to dashboard
        await page.getByText('儀表板').click();
        await expect(page).toHaveURL('/dashboard');
      });
    }
  });

  test.describe('Content Readability', () => {
    test('should maintain text readability across viewports', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      const viewports = [
        () => responsiveHelpers.setDesktopViewport(),
        () => responsiveHelpers.setTabletViewport(),
        () => responsiveHelpers.setMobileViewport()
      ];
      
      for (const setViewport of viewports) {
        await setViewport();
        
        // Text should be visible and readable
        await expect(page.getByText('總客戶數')).toBeVisible();
        await expect(page.getByText('156')).toBeVisible();
        await expect(page.getByText('最近活動')).toBeVisible();
        await expect(page.getByText('待辦事項')).toBeVisible();
        
        // Text should not be cut off or overlapping
        const textElements = await page.locator('text=總客戶數').boundingBox();
        expect(textElements?.width).toBeGreaterThan(0);
        expect(textElements?.height).toBeGreaterThan(0);
      }
    });

    test('should ensure buttons remain clickable across viewports', async ({ page }) => {
      const responsiveHelpers = new ResponsiveHelpers(page);
      const viewports = [
        () => responsiveHelpers.setDesktopViewport(),
        () => responsiveHelpers.setTabletViewport(),
        () => responsiveHelpers.setMobileViewport()
      ];
      
      for (const setViewport of viewports) {
        await setViewport();
        
        // User avatar should be clickable
        await page.getByRole('img', { name: 'user' }).click();
        await expect(page.getByText('登出')).toBeVisible();
        
        // Close dropdown by clicking elsewhere
        await page.getByText('PropAgent Pro').click();
        
        // Menu items should be clickable
        await page.getByText('房產管理').click();
        await expect(page).toHaveURL('/properties');
        
        // Go back to dashboard for next iteration
        await page.getByText('儀表板').click();
        await expect(page).toHaveURL('/dashboard');
      }
    });
  });
});