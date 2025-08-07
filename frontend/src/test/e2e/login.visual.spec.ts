import { test, expect } from '@playwright/test';

test.describe('🔐 Login Page Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 清除本地存儲以確保未登入狀態
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // 模擬登入 API
    await page.route('**/api/auth/login', async (route) => {
      const body = await route.request().postDataJSON();
      
      if (body.email === 'test@example.com' && body.password === 'password123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            access_token: 'mock-access-token',
            user: {
              id: '1',
              name: '測試用戶',
              email: 'test@example.com',
              role: 'agent'
            }
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '帳號或密碼錯誤'
          })
        });
      }
    });
  });

  test('🖥️ Login Page - Desktop View', async ({ page }) => {
    console.log('🧪 Testing Login Page desktop view...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/login');
    
    // 等待登入頁面元素載入
    await expect(page.getByText('PropAgent Pro')).toBeVisible();
    await expect(page.getByText('登入系統')).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
    
    // 等待頁面完全載入
    await page.waitForTimeout(1000);
    
    // 全頁截圖
    await expect(page).toHaveScreenshot('login-page-desktop.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('📱 Login Page - Mobile View', async ({ page }) => {
    console.log('🧪 Testing Login Page mobile view...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // 等待移動端登入頁面載入
    await expect(page.getByText('PropAgent Pro')).toBeVisible();
    await expect(page.getByText('登入系統')).toBeVisible();
    
    // 等待頁面完全載入
    await page.waitForTimeout(1000);
    
    // 移動端全頁截圖
    await expect(page).toHaveScreenshot('login-page-mobile.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('📋 Login Form Elements', async ({ page }) => {
    console.log('🧪 Testing Login form elements...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/login');
    
    // 等待表單元素載入
    await expect(page.getByRole('textbox')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByText('登入系統')).toBeVisible();
    
    // 截圖登入卡片
    const loginCard = page.locator('.ant-card').first();
    await expect(loginCard).toHaveScreenshot('login-form-card.png', {
      threshold: 0.3
    });
  });

  test('📝 Form Input States', async ({ page }) => {
    console.log('🧪 Testing form input states...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/login');
    
    // 測試空表單狀態
    await expect(page).toHaveScreenshot('login-form-empty.png', {
      clip: { x: 400, y: 200, width: 400, height: 400 },
      threshold: 0.3
    });
    
    // 填寫表單
    await page.getByRole('textbox').first().fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    
    // 測試填寫完成狀態
    await expect(page).toHaveScreenshot('login-form-filled.png', {
      clip: { x: 400, y: 200, width: 400, height: 400 },
      threshold: 0.3
    });
  });

  test('✅ Successful Login Flow', async ({ page }) => {
    console.log('🧪 Testing successful login flow...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/login');
    
    // 填寫正確的登入信息
    await page.getByRole('textbox').first().fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    
    // 點擊登入按鈕
    await page.getByText('登入系統').click();
    
    // 等待載入狀態
    await expect(page.locator('.ant-btn-loading')).toBeVisible();
    
    // 截圖載入狀態
    await expect(page.locator('.ant-btn-loading')).toHaveScreenshot('login-loading-button.png', {
      threshold: 0.3
    });
  });

  test('❌ Failed Login Flow', async ({ page }) => {
    console.log('🧪 Testing failed login flow...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/login');
    
    // 填寫錯誤的登入信息
    await page.getByRole('textbox').first().fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    
    // 點擊登入按鈕
    await page.getByText('登入系統').click();
    
    // 等待錯誤消息出現
    await expect(page.getByText('帳號或密碼錯誤')).toBeVisible();
    
    // 截圖錯誤狀態
    await expect(page).toHaveScreenshot('login-error-state.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('📋 Form Validation States', async ({ page }) => {
    console.log('🧪 Testing form validation states...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/login');
    
    // 嘗試提交空表單觸發驗證
    await page.getByText('登入系統').click();
    
    // 等待驗證錯誤出現
    await page.waitForTimeout(500);
    
    // 截圖驗證錯誤狀態
    await expect(page).toHaveScreenshot('login-validation-errors.png', {
      clip: { x: 300, y: 150, width: 600, height: 500 },
      threshold: 0.3
    });
  });

  test('🎨 Background and Layout', async ({ page }) => {
    console.log('🧪 Testing background and layout...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/login');
    
    // 等待背景載入
    await page.waitForTimeout(1000);
    
    // 截圖整個背景和佈局
    await expect(page).toHaveScreenshot('login-background-layout.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('💡 Demo Credentials Display', async ({ page }) => {
    console.log('🧪 Testing demo credentials display...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/login');
    
    // 等待演示帳號信息顯示
    await expect(page.getByText('test@example.com')).toBeVisible();
    await expect(page.getByText('password123')).toBeVisible();
    
    // 截圖演示帳號區域
    const demoSection = page.locator('text=演示帳號').locator('..');
    if (await demoSection.count() > 0) {
      await expect(demoSection).toHaveScreenshot('login-demo-credentials.png', {
        threshold: 0.3
      });
    } else {
      // 如果沒有找到演示帳號標題，截圖包含測試帳號的區域
      const cardBody = page.locator('.ant-card-body');
      await expect(cardBody).toHaveScreenshot('login-demo-credentials.png', {
        threshold: 0.3
      });
    }
  });

  test('📱 Mobile Form Interaction', async ({ page }) => {
    console.log('🧪 Testing mobile form interaction...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    
    // 點擊輸入框觸發移動端鍵盤
    await page.getByRole('textbox').first().click();
    
    // 等待焦點狀態
    await page.waitForTimeout(500);
    
    // 截圖移動端表單焦點狀態
    await expect(page).toHaveScreenshot('login-mobile-focus.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('📱 Responsive Breakpoints - Login Page', async ({ page }) => {
    console.log('🧪 Testing login page responsive breakpoints...');
    
    const breakpoints = [
      { name: 'mobile-small', width: 320, height: 568 },
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1200, height: 800 },
      { name: 'large', width: 1600, height: 900 }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      await page.goto('/login');
      await expect(page.getByText('PropAgent Pro')).toBeVisible();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot(`login-page-${breakpoint.name}.png`, {
        fullPage: true,
        threshold: 0.3,
        animations: 'disabled'
      });
    }
  });

  test('🎯 Focus and Hover States', async ({ page }) => {
    console.log('🧪 Testing focus and hover states...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/login');
    
    // 測試按鈕懸停狀態
    const loginButton = page.getByText('登入系統');
    await loginButton.hover();
    
    // 截圖按鈕懸停狀態
    await expect(loginButton).toHaveScreenshot('login-button-hover.png', {
      threshold: 0.3
    });
    
    // 測試輸入框焦點狀態
    const emailInput = page.getByRole('textbox').first();
    await emailInput.focus();
    
    // 截圖輸入框焦點狀態
    await expect(emailInput).toHaveScreenshot('login-input-focus.png', {
      threshold: 0.3
    });
  });
});