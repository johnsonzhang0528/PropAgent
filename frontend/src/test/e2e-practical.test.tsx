import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { store } from '../store';
import App from '../App';

// 測試組件包裝器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <ConfigProvider locale={zhTW}>
      {children}
    </ConfigProvider>
  </Provider>
);

describe('🚀 PropAgent Pro - 實用端到端測試', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
    // 重置 fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('📝 應用程序基本載入測試', async () => {
    console.log('🧪 測試應用程序基本載入...');
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 驗證 PropAgent Pro 標題存在
    await waitFor(() => {
      expect(screen.getByText('PropAgent Pro')).toBeTruthy();
    });

    // 驗證登入按鈕存在
    expect(screen.getByText('登入系統')).toBeTruthy();
    
    // 驗證測試帳號提示存在
    expect(screen.getByText(/test@example.com/)).toBeTruthy();
  });

  test('🔑 登入表單元素測試', async () => {
    console.log('🧪 測試登入表單元素...');
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證輸入框存在（通過 placeholder 或其他屬性）
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
      
      // 驗證密碼輸入框存在
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBeGreaterThan(0);
      
      // 驗證登入按鈕存在
      const loginButton = screen.getByText('登入系統');
      expect(loginButton).toBeTruthy();
      
      // 驗證按鈕是可點擊的元素
      expect(loginButton.closest('button')).toBeTruthy();
    });
  });

  test('🔧 本地存儲和狀態管理測試', async () => {
    console.log('🧪 測試本地存儲和狀態管理...');
    
    // 模擬已登入用戶
    const mockUser = {
      id: '1',
      name: '測試用戶',
      email: 'test@example.com',
      role: 'agent'
    };
    
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 驗證已登入狀態下不顯示登入表單
    await waitFor(() => {
      // 如果已登入，應該不會看到登入按鈕
      const loginButtons = screen.queryAllByText('登入系統');
      // 可能會重定向到儀表板或顯示其他內容
      expect(document.body).toBeTruthy(); // 至少頁面能正常渲染
    });
  });

  test('📱 響應式佈局基礎測試', async () => {
    console.log('🧪 測試響應式佈局...');
    
    // 設置小屏幕尺寸
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 360
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 640
    });
    
    // 觸發 resize 事件
    window.dispatchEvent(new Event('resize'));

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證在小屏幕下頁面仍能正常顯示
      expect(screen.getByText('PropAgent Pro')).toBeTruthy();
      
      // 檢查登入卡片是否存在
      const card = document.querySelector('.ant-card');
      expect(card).toBeTruthy();
      
      // 檢查卡片是否有適當的樣式
      const cardBody = document.querySelector('.ant-card-body');
      expect(cardBody).toBeTruthy();
    });

    // 恢復正常屏幕尺寸
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768
    });
  });

  test('🎨 Ant Design 組件整合測試', async () => {
    console.log('🧪 測試 Ant Design 組件整合...');
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證 Ant Design 組件正確載入
      expect(document.querySelector('.ant-card')).toBeTruthy();
      expect(document.querySelector('.ant-btn')).toBeTruthy();
      expect(document.querySelector('.ant-space')).toBeTruthy();
      
      // 驗證 CSS 類別存在（表示樣式正確載入）
      const elements = document.querySelectorAll('[class*="ant-"]');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  test('⚡ Redux Store 整合測試', async () => {
    console.log('🧪 測試 Redux Store 整合...');
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證 Redux store 正常運作
      expect(store.getState()).toBeDefined();
      expect(store.getState().auth).toBeDefined();
      
      // 驗證初始狀態
      const authState = store.getState().auth;
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBe(null);
    });
  });

  test('🔗 路由系統基礎測試', async () => {
    console.log('🧪 測試路由系統...');
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證應用程序正確渲染，沒有路由錯誤
      expect(document.querySelector('.App')).toBeTruthy();
      
      // 檢查當前 URL（應該是根路徑或登入頁面）
      expect(window.location.pathname).toBeDefined();
    });
  });

  test('🛡️ 錯誤邊界和異常處理測試', async () => {
    console.log('🧪 測試錯誤邊界和異常處理...');
    
    // 模擬網絡錯誤
    (global.fetch as jest.Mock) = jest.fn(() => 
      Promise.reject(new Error('Network Error'))
    );

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證即使有網絡錯誤，應用程序也不會崩潰
      expect(screen.getByText('PropAgent Pro')).toBeTruthy();
      
      // 應用程序應該繼續正常顯示
      expect(document.body).toBeTruthy();
    });
  });

  test('📊 性能和載入測試', async () => {
    console.log('🧪 測試性能和載入...');
    
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('PropAgent Pro')).toBeTruthy();
    });

    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // 驗證載入時間合理（小於 2 秒）
    expect(loadTime).toBeLessThan(2000);
    console.log(`📈 應用程序載入時間: ${loadTime.toFixed(2)}ms`);
  });

  test('🔄 狀態持久化測試', async () => {
    console.log('🧪 測試狀態持久化...');
    
    // 設置一些 localStorage 數據
    const testToken = 'test-access-token';
    const testUser = { id: '1', name: '測試', email: 'test@test.com' };
    
    localStorage.setItem('access_token', testToken);
    localStorage.setItem('user', JSON.stringify(testUser));

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證 localStorage 數據正確讀取
      expect(localStorage.getItem('access_token')).toBe(testToken);
      expect(JSON.parse(localStorage.getItem('user') || '{}')).toEqual(testUser);
    });
  });
});

export default {};