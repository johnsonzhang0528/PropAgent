import { Page, Locator } from '@playwright/test';

export class LoginPageHelpers {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('郵箱地址');
    this.passwordInput = page.getByPlaceholder('密碼');
    this.loginButton = page.getByRole('button', { name: '登入系統' });
    this.errorAlert = page.locator('.ant-alert-error');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginWithTestCredentials() {
    await this.login('test@example.com', 'test123');
  }
}

export class DashboardPageHelpers {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly content: Locator;
  readonly userAvatar: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('.ant-layout-sider');
    this.header = page.locator('.ant-layout-header');
    this.content = page.locator('.ant-layout-content');
    this.userAvatar = page.locator('.ant-avatar');
    this.logoutButton = page.getByText('登出');
  }

  async navigateToPage(pageName: '儀表板' | '客戶管理' | '房產管理' | '分析報告') {
    await this.page.getByText(pageName).click();
  }

  async logout() {
    await this.userAvatar.click();
    await this.logoutButton.click();
  }
}

export class NavigationHelpers {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForNavigation(url: string) {
    await this.page.waitForURL(url);
  }

  async checkCurrentUrl(expectedUrl: string) {
    return this.page.url().includes(expectedUrl);
  }

  async goBack() {
    await this.page.goBack();
  }

  async goForward() {
    await this.page.goForward();
  }
}

export class ResponsiveHelpers {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async checkElementVisibility(selector: string, shouldBeVisible: boolean) {
    const element = this.page.locator(selector);
    if (shouldBeVisible) {
      await element.waitFor({ state: 'visible' });
    } else {
      await element.waitFor({ state: 'hidden' });
    }
  }
}

export class MockHelpers {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async mockLoginAPI(success = true) {
    if (success) {
      await this.page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: '1',
                name: '測試用戶',
                email: 'test@example.com',
                role: 'admin'
              },
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token'
            }
          })
        });
      });
    } else {
      await this.page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: '登錄失敗' }
          })
        });
      });
    }
  }

  async mockCustomersAPI() {
    await this.page.route('**/api/customers', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              name: '王小明',
              email: 'wang@example.com',
              phone: '0912345678',
              status: 'active'
            },
            {
              id: '2',
              name: '李小華',
              email: 'li@example.com',
              phone: '0987654321',
              status: 'pending'
            }
          ]
        })
      });
    });
  }

  async mockPropertiesAPI() {
    await this.page.route('**/api/properties', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              title: '信義區豪宅',
              address: '台北市信義區信義路五段',
              price: 15000000,
              type: 'apartment',
              status: 'available'
            },
            {
              id: '2',
              title: '大安區公寓',
              address: '台北市大安區敦化南路',
              price: 8000000,
              type: 'apartment',
              status: 'sold'
            }
          ]
        })
      });
    });
  }
}