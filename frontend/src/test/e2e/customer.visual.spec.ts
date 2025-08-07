import { test, expect } from '@playwright/test';

test.describe('👥 Customer Management Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 模擬登入狀態
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        name: '測試用戶',
        email: 'test@example.com',
        role: 'agent'
      }));
    });

    // 模擬客戶 API 回應
    await page.route('**/api/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          customers: [
            {
              _id: '1',
              first_name: '張',
              last_name: '小明',
              email: 'zhang@example.com',
              phone: '0912000001',
              status: 'active',
              purchase_intent_score: 8.5,
              budget_min: 2000000,
              budget_max: 3000000,
              preferred_location: ['大安區', '信義區'],
              notes: '尋找大安區2房公寓',
              created_at: '2024-01-15',
              last_contact_at: '2024-03-01'
            },
            {
              _id: '2',
              first_name: '李',
              last_name: '美女',
              email: 'li@example.com',
              phone: '0912000002',
              status: 'active',
              purchase_intent_score: 9.2,
              budget_min: 1500000,
              budget_max: 2500000,
              preferred_location: ['松山區', '中山區'],
              notes: '新婚夫妻，希望找到3房住宅',
              created_at: '2024-01-20',
              last_contact_at: '2024-02-28'
            },
            {
              _id: '3',
              first_name: '王',
              last_name: '總',
              email: 'wang@example.com',
              phone: '0912000003',
              status: 'completed',
              purchase_intent_score: 7.8,
              budget_min: 5000000,
              budget_max: 10000000,
              preferred_location: ['信義區', '大安區'],
              notes: '企業老闆，已成交高級住宅',
              created_at: '2024-01-10',
              last_contact_at: '2024-02-15'
            }
          ],
          total: 3,
          page: 1,
          limit: 10
        })
      });
    });
  });

  test('📋 Customer List - Desktop View', async ({ page }) => {
    console.log('🧪 Testing Customer List desktop view...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/customers');
    
    // 等待客戶列表載入
    await expect(page.getByText('總客戶數')).toBeVisible();
    await expect(page.getByText('張小明')).toBeVisible();
    await expect(page.getByText('李美女')).toBeVisible();
    
    // 等待統計卡片和表格載入完成
    await page.waitForTimeout(1500);
    
    // 全頁截圖
    await expect(page).toHaveScreenshot('customer-list-desktop.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('📱 Customer List - Mobile View', async ({ page }) => {
    console.log('🧪 Testing Customer List mobile view...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/customers');
    
    // 等待移動端客戶列表載入
    await expect(page.getByText('總客戶數')).toBeVisible();
    await expect(page.getByText('張小明')).toBeVisible();
    
    // 等待載入完成
    await page.waitForTimeout(1500);
    
    // 移動端全頁截圖
    await expect(page).toHaveScreenshot('customer-list-mobile.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('📊 Customer Statistics Cards', async ({ page }) => {
    console.log('🧪 Testing Customer statistics cards...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/customers');
    
    // 等待統計卡片載入
    await expect(page.getByText('總客戶數')).toBeVisible();
    await expect(page.getByText('活躍客戶')).toBeVisible();
    await expect(page.getByText('高意願客戶')).toBeVisible();
    await expect(page.getByText('成功率')).toBeVisible();
    
    // 截圖統計卡片區域
    const statsCards = page.locator('.ant-row').first();
    await expect(statsCards).toHaveScreenshot('customer-stats-cards.png', {
      threshold: 0.3
    });
  });

  test('🔍 Search and Filter Interface', async ({ page }) => {
    console.log('🧪 Testing search and filter interface...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/customers');
    
    // 等待搜索和篩選器載入
    await expect(page.getByPlaceholderText('搜索客戶姓名或電話')).toBeVisible();
    await expect(page.getByText('狀態篩選')).toBeVisible();
    await expect(page.getByText('新增客戶')).toBeVisible();
    
    // 截圖搜索和篩選區域
    const searchSection = page.locator('.ant-card').nth(1); // 假設是第二個卡片
    await expect(searchSection).toHaveScreenshot('customer-search-filter.png', {
      threshold: 0.3
    });
  });

  test('📋 Data Table - Desktop', async ({ page }) => {
    console.log('🧪 Testing data table desktop view...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/customers');
    
    // 等待表格載入
    await expect(page.getByText('張小明')).toBeVisible();
    await expect(page.locator('.ant-table')).toBeVisible();
    
    // 等待表格完全載入
    await page.waitForTimeout(1000);
    
    // 截圖表格區域
    const table = page.locator('.ant-table');
    await expect(table).toHaveScreenshot('customer-table-desktop.png', {
      threshold: 0.3
    });
  });

  test('📱 Mobile List View', async ({ page }) => {
    console.log('🧪 Testing mobile list view...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/customers');
    
    // 等待移動端列表載入
    await expect(page.getByText('張小明')).toBeVisible();
    await expect(page.locator('.ant-list')).toBeVisible();
    
    // 等待列表完全載入
    await page.waitForTimeout(1000);
    
    // 截圖移動端列表
    const mobileList = page.locator('.ant-list');
    await expect(mobileList).toHaveScreenshot('customer-list-mobile-items.png', {
      threshold: 0.3
    });
  });

  test('🎯 Customer Detail Modal', async ({ page }) => {
    console.log('🧪 Testing customer detail modal...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/customers');
    
    // 等待頁面載入
    await expect(page.getByText('張小明')).toBeVisible();
    
    // 點擊查看詳情按鈕
    const viewButton = page.locator('[data-icon="eye"]').first();
    await viewButton.click();
    
    // 等待詳情抽屜打開
    await expect(page.getByText('客戶詳情')).toBeVisible();
    await expect(page.getByText('基本信息')).toBeVisible();
    
    // 等待詳情載入完成
    await page.waitForTimeout(1000);
    
    // 截圖詳情抽屜
    await expect(page).toHaveScreenshot('customer-detail-drawer.png', {
      threshold: 0.3,
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
  });

  test('📱 Mobile Customer Detail', async ({ page }) => {
    console.log('🧪 Testing mobile customer detail...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/customers');
    
    // 等待移動端頁面載入
    await expect(page.getByText('張小明')).toBeVisible();
    
    // 點擊查看詳情按鈕
    const viewButton = page.locator('[data-icon="eye"]').first();
    await viewButton.click();
    
    // 等待詳情抽屜打開（移動端全屏）
    await expect(page.getByText('客戶詳情')).toBeVisible();
    
    // 等待載入完成
    await page.waitForTimeout(1000);
    
    // 截圖移動端詳情
    await expect(page).toHaveScreenshot('customer-detail-mobile.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('🏷️ Status Tags and Badges', async ({ page }) => {
    console.log('🧪 Testing status tags and badges...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/customers');
    
    // 等待狀態標籤載入
    await expect(page.getByText('活躍')).toBeVisible();
    await expect(page.getByText('已成交')).toBeVisible();
    
    // 等待意願分數徽章載入
    await expect(page.locator('.ant-badge')).toBeVisible();
    
    // 截圖包含各種狀態標籤的區域
    const customerCard = page.locator('.ant-table-tbody tr').first();
    await expect(customerCard).toHaveScreenshot('customer-status-tags.png', {
      threshold: 0.3
    });
  });

  test('📊 Empty State', async ({ page }) => {
    console.log('🧪 Testing empty state...');
    
    // 模擬空的客戶列表
    await page.route('**/api/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          customers: [],
          total: 0,
          page: 1,
          limit: 10
        })
      });
    });
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/customers');
    
    // 等待空狀態載入
    await expect(page.locator('.ant-empty')).toBeVisible();
    
    // 截圖空狀態
    await expect(page).toHaveScreenshot('customer-empty-state.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('🔄 Loading State', async ({ page }) => {
    console.log('🧪 Testing loading state...');
    
    // 模擬慢速載入
    await page.route('**/api/customers', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          customers: [],
          total: 0,
          page: 1,
          limit: 10
        })
      });
    });
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/customers');
    
    // 捕獲載入狀態
    await expect(page.locator('.ant-spin')).toBeVisible();
    await expect(page.locator('.ant-spin')).toHaveScreenshot('customer-loading-spinner.png', {
      threshold: 0.3
    });
  });

  test('📱 Responsive Breakpoints - Customer Page', async ({ page }) => {
    console.log('🧪 Testing customer page responsive breakpoints...');
    
    const breakpoints = [
      { name: 'mobile-small', width: 320, height: 568 },
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1200, height: 800 }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      await page.goto('/customers');
      await expect(page.getByText('總客戶數')).toBeVisible();
      await page.waitForTimeout(1500);
      
      await expect(page).toHaveScreenshot(`customer-page-${breakpoint.name}.png`, {
        fullPage: true,
        threshold: 0.3,
        animations: 'disabled'
      });
    }
  });
});