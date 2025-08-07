import { test, expect } from '@playwright/test';
import { LoginPageHelpers, DashboardPageHelpers, MockHelpers } from '../utils/e2e-helpers';

test.describe('Login Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    const mockHelpers = new MockHelpers(page);
    await mockHelpers.mockLoginAPI(true);
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('PropAgent Pro')).toBeVisible();
    await expect(page.getByPlaceholder('郵箱地址')).toBeVisible();
    await expect(page.getByPlaceholder('密碼')).toBeVisible();
  });

  test('should show test credentials hint', async ({ page }) => {
    await expect(page.getByText('開發模式測試帳號: test@example.com / test123')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const loginHelpers = new LoginPageHelpers(page);
    
    await loginHelpers.loginButton.click();
    
    await expect(page.getByText('請輸入郵箱!')).toBeVisible();
    await expect(page.getByText('請輸入密碼!')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const loginHelpers = new LoginPageHelpers(page);
    
    await loginHelpers.emailInput.fill('invalid-email');
    await loginHelpers.passwordInput.fill('test123');
    await loginHelpers.loginButton.click();
    
    await expect(page.getByText('請輸入有效的郵箱格式!')).toBeVisible();
  });

  test('should successfully login with test credentials', async ({ page }) => {
    const loginHelpers = new LoginPageHelpers(page);
    
    await loginHelpers.loginWithTestCredentials();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    const loginHelpers = new LoginPageHelpers(page);
    
    await loginHelpers.emailInput.fill('test@example.com');
    await loginHelpers.passwordInput.fill('test123');
    
    // Click login button and immediately check loading state
    await loginHelpers.loginButton.click();
    await expect(loginHelpers.loginButton).toHaveClass(/ant-btn-loading/);
  });

  test('should handle login failure', async ({ page }) => {
    const mockHelpers = new MockHelpers(page);
    await mockHelpers.mockLoginAPI(false);
    
    const loginHelpers = new LoginPageHelpers(page);
    await loginHelpers.login('wrong@example.com', 'wrongpassword');
    
    await expect(loginHelpers.errorAlert).toBeVisible();
    await expect(page.getByText('登錄失敗')).toBeVisible();
    
    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should maintain session after page refresh', async ({ page }) => {
    const loginHelpers = new LoginPageHelpers(page);
    await loginHelpers.loginWithTestCredentials();
    
    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated and on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: '儀表板' })).toBeVisible();
  });

  test('should redirect authenticated user away from login page', async ({ page }) => {
    const loginHelpers = new LoginPageHelpers(page);
    await loginHelpers.loginWithTestCredentials();
    
    // Navigate back to login page
    await page.goto('/login');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});