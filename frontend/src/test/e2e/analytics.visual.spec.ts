import { test, expect } from '@playwright/test';

test.describe('🎨 Analytics Dashboard Visual Regression Tests', () => {
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

    // 模擬 API 回應
    await page.route('**/api/analytics/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/customer-stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total_customers: 156,
            active_customers: 89,
            potential_customers: 34,
            completed_customers: 42,
            success_rate: '26.9'
          })
        });
      } else if (url.includes('/customer-status-distribution')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { status: 'active', count: 89 },
            { status: 'inactive', count: 25 },
            { status: 'completed', count: 42 },
            { status: 'lost', count: 0 }
          ])
        });
      } else if (url.includes('/purchase-intent-distribution')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { scoreRange: '9-10', count: 18 },
            { scoreRange: '8-9', count: 16 },
            { scoreRange: '7-8', count: 45 },
            { scoreRange: '6-7', count: 32 },
            { scoreRange: '5-6', count: 28 },
            { scoreRange: '0-5', count: 17 }
          ])
        });
      } else if (url.includes('/property-stats')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total_properties: 89,
            available_properties: 67,
            sold_properties: 15,
            reserved_properties: 7,
            average_price: 2850000
          })
        });
      } else if (url.includes('/price-range-distribution')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { priceRange: '100萬以下', count: 5 },
            { priceRange: '100-200萬', count: 12 },
            { priceRange: '200-300萬', count: 28 },
            { priceRange: '300-500萬', count: 25 },
            { priceRange: '500-1000萬', count: 15 },
            { priceRange: '1000萬以上', count: 4 }
          ])
        });
      } else if (url.includes('/monthly-trends')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            customer_trends: [
              { year: 2024, month: 1, count: 15 },
              { year: 2024, month: 2, count: 18 },
              { year: 2024, month: 3, count: 22 }
            ],
            property_trends: [
              { year: 2024, month: 1, count: 8 },
              { year: 2024, month: 2, count: 12 },
              { year: 2024, month: 3, count: 15 }
            ]
          })
        });
      } else if (url.includes('/location-distribution')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            property_distribution: [
              { district: '大安區', count: 25, averagePrice: 3500000 },
              { district: '信義區', count: 18, averagePrice: 4200000 },
              { district: '中山區', count: 15, averagePrice: 2800000 }
            ],
            customer_preferences: [
              { location: '大安區', count: 45 },
              { location: '信義區', count: 32 },
              { location: '松山區', count: 28 }
            ]
          })
        });
      }
    });
  });

  test('📊 Analytics Dashboard - Desktop Full Page', async ({ page }) => {
    console.log('🧪 Testing Analytics Dashboard desktop view...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/analytics');
    
    // 等待圖表載入完成
    await expect(page.getByText('數據分析儀表板')).toBeVisible();
    await expect(page.getByText('總客戶數')).toBeVisible();
    await expect(page.getByText('客戶狀態分布')).toBeVisible();
    
    // 等待圖表動畫完成
    await page.waitForTimeout(2000);
    
    // 全頁截圖
    await expect(page).toHaveScreenshot('analytics-dashboard-desktop.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('📱 Analytics Dashboard - Mobile View', async ({ page }) => {
    console.log('🧪 Testing Analytics Dashboard mobile view...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/analytics');
    
    // 等待內容載入
    await expect(page.getByText('數據分析儀表板')).toBeVisible();
    await expect(page.getByText('總客戶數')).toBeVisible();
    
    // 等待圖表動畫完成
    await page.waitForTimeout(2000);
    
    // 移動端全頁截圖
    await expect(page).toHaveScreenshot('analytics-dashboard-mobile.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('📊 Individual Chart Components', async ({ page }) => {
    console.log('🧪 Testing individual chart components...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/analytics');
    
    // 等待所有圖表載入
    await expect(page.getByText('客戶狀態分布')).toBeVisible();
    await expect(page.getByText('客戶購買意願分布')).toBeVisible();
    await expect(page.getByText('房產價格分布')).toBeVisible();
    await expect(page.getByText('月度趨勢分析')).toBeVisible();
    
    // 等待圖表動畫完成
    await page.waitForTimeout(2000);
    
    // 客戶狀態圓餅圖
    const statusChart = page.locator('text=客戶狀態分布').locator('..').locator('..');
    await expect(statusChart).toHaveScreenshot('customer-status-chart.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // 購買意願條形圖
    const intentChart = page.locator('text=客戶購買意願分布').locator('..').locator('..');
    await expect(intentChart).toHaveScreenshot('purchase-intent-chart.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // 價格分布面積圖
    const priceChart = page.locator('text=房產價格分布').locator('..').locator('..');
    await expect(priceChart).toHaveScreenshot('property-price-chart.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
    
    // 月度趨勢線圖
    const trendsChart = page.locator('text=月度趨勢分析').locator('..').locator('..');
    await expect(trendsChart).toHaveScreenshot('monthly-trends-chart.png', {
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('📈 Statistics Cards Layout', async ({ page }) => {
    console.log('🧪 Testing statistics cards layout...');
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/analytics');
    
    // 等待統計卡片載入
    await expect(page.getByText('總客戶數')).toBeVisible();
    await expect(page.getByText('活躍客戶')).toBeVisible();
    await expect(page.getByText('總房產數')).toBeVisible();
    await expect(page.getByText('平均房價')).toBeVisible();
    
    // 截圖統計卡片區域
    const statsSection = page.locator('[data-testid="stats-cards"]').first();
    if (await statsSection.count() === 0) {
      // 如果沒有 test-id，則使用包含統計卡片的容器
      const firstStatCard = page.getByText('總客戶數').locator('..').locator('..');
      const statsContainer = firstStatCard.locator('..').locator('..');
      await expect(statsContainer).toHaveScreenshot('statistics-cards.png', {
        threshold: 0.3
      });
    } else {
      await expect(statsSection).toHaveScreenshot('statistics-cards.png', {
        threshold: 0.3
      });
    }
  });

  test('🎨 Dark Mode Compatibility', async ({ page }) => {
    console.log('🧪 Testing dark mode appearance...');
    
    // 模擬暗色主題
    await page.addInitScript(() => {
      // 設置暗色主題
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/analytics');
    
    // 等待載入
    await expect(page.getByText('數據分析儀表板')).toBeVisible();
    await page.waitForTimeout(2000);
    
    // 暗色主題截圖
    await expect(page).toHaveScreenshot('analytics-dashboard-dark.png', {
      fullPage: true,
      threshold: 0.3,
      animations: 'disabled'
    });
  });

  test('🔄 Loading States', async ({ page }) => {
    console.log('🧪 Testing loading states...');
    
    // 模擬慢速 API 回應來捕獲載入狀態
    await page.route('**/api/analytics/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_customers: 0 })
      });
    });
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/analytics');
    
    // 捕獲載入狀態
    await expect(page.locator('.ant-spin')).toBeVisible();
    await expect(page.locator('.ant-spin')).toHaveScreenshot('loading-spinner.png', {
      threshold: 0.3
    });
  });

  test('❌ Error States', async ({ page }) => {
    console.log('🧪 Testing error states...');
    
    // 模擬 API 錯誤
    await page.route('**/api/analytics/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/analytics');
    
    // 等待錯誤狀態出現
    await expect(page.getByText('載入失敗')).toBeVisible();
    
    // 截圖錯誤狀態
    await expect(page).toHaveScreenshot('analytics-error-state.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('📱 Responsive Breakpoints', async ({ page }) => {
    console.log('🧪 Testing responsive breakpoints...');
    
    const breakpoints = [
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
      
      await page.goto('/analytics');
      await expect(page.getByText('數據分析儀表板')).toBeVisible();
      await page.waitForTimeout(1500);
      
      await expect(page).toHaveScreenshot(`analytics-${breakpoint.name}.png`, {
        fullPage: true,
        threshold: 0.3,
        animations: 'disabled'
      });
    }
  });
});