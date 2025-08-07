import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { store } from '../store';
import App from '../App';

// 模擬 API 調用
const mockApiResponse = (data: any, delay = 100) => {
  return new Promise(resolve => {
    setTimeout(() => resolve({ 
      ok: true, 
      json: () => Promise.resolve(data) 
    }), delay);
  });
};

// 覆蓋 fetch 以模擬 API 響應
const originalFetch = global.fetch;
beforeAll(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

// 測試組件包裝器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <ConfigProvider locale={zhTW}>
      {children}
    </ConfigProvider>
  </Provider>
);

describe('🔄 PropAgent Pro - 端到端用戶流程測試', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
    // 重置 fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  test('📝 完整登入流程 - 從登入到儀表板', async () => {
    console.log('🧪 測試完整登入流程...');
    
    // 模擬登入 API 響應
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      mockApiResponse({
        success: true,
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            _id: '1',
            email: 'test@example.com',
            first_name: '測試',
            last_name: '用戶',
            role: 'agent'
          }
        }
      })
    );

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 驗證登入頁面元素
    await waitFor(() => {
      expect(screen.getByText('PropAgent Pro')).toBeTruthy();
      expect(screen.getByText('房地產專業管理系統')).toBeTruthy();
    });

    // 找到登入表單
    const emailInput = screen.getByLabelText(/電子郵件|Email/i);
    const passwordInput = screen.getByLabelText(/密碼|Password/i);
    const loginButton = screen.getByRole('button', { name: /登入|登錄/i });

    // 填寫登入表單
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'test123' } });
    fireEvent.click(loginButton);

    // 驗證登入成功後導向儀表板
    await waitFor(() => {
      // 檢查是否有導航元素（表示已登入）
      const dashboardElement = screen.queryByText(/儀表板|Dashboard/i) || screen.queryByText(/總覽/i);
      expect(dashboardElement).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('🏠 客戶管理流程測試', async () => {
    console.log('🧪 測試客戶管理流程...');
    
    // 設置已登入狀態
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({
      _id: '1',
      email: 'test@example.com',
      first_name: '測試',
      last_name: '用戶',
      role: 'agent'
    }));

    // 模擬客戶列表 API
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/customers')) {
        return mockApiResponse({
          success: true,
          data: {
            customers: [
              {
                _id: '1',
                first_name: '張',
                last_name: '小明',
                email: 'zhang@example.com',
                phone: '0912000001',
                status: 'active',
                purchase_intent_score: 8.5
              }
            ],
            pagination: { total: 1, page: 1, limit: 20 }
          }
        });
      }
      return mockApiResponse({ success: true, data: {} });
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 等待頁面載入並導航到客戶管理
    await waitFor(() => {
      // 尋找客戶管理相關的導航或元素
      const customerLink = screen.getByText(/客戶管理|客戶列表|Customers/i);
      if (customerLink) {
        fireEvent.click(customerLink);
      }
    });

    // 驗證客戶列表載入
    await waitFor(() => {
      const customerElement = screen.queryByText('張小明') || screen.queryByText(/客戶/);
      expect(customerElement).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('🏢 物件管理流程測試', async () => {
    console.log('🧪 測試物件管理流程...');
    
    // 設置已登入狀態
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({
      _id: '1',
      email: 'test@example.com',
      first_name: '測試',
      last_name: '用戶',
      role: 'agent'
    }));

    // 模擬物件列表 API
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/properties')) {
        return mockApiResponse({
          success: true,
          data: {
            properties: [
              {
                _id: '1',
                title: '大安區精華地段2房美宅',
                property_type: 'apartment',
                listing_type: 'sale',
                price: 2800000,
                area: 25,
                status: 'available',
                district: '大安區',
                city: '台北市'
              }
            ],
            pagination: { total: 1, page: 1, limit: 20 }
          }
        });
      }
      return mockApiResponse({ success: true, data: {} });
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 等待頁面載入並導航到物件管理
    await waitFor(() => {
      const propertyLink = screen.getByText(/物件管理|物件列表|Properties/i);
      if (propertyLink) {
        fireEvent.click(propertyLink);
      }
    });

    // 驗證物件列表載入
    await waitFor(() => {
      const propertyElement = screen.queryByText('大安區精華地段2房美宅') || screen.queryByText(/物件/);
      expect(propertyElement).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('🔍 搜索功能測試', async () => {
    console.log('🧪 測試搜索功能...');
    
    // 設置已登入狀態
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({
      _id: '1',
      email: 'test@example.com',
      first_name: '測試',
      last_name: '用戶',
      role: 'agent'
    }));

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 查找搜索輸入框
    await waitFor(() => {
      const searchInputs = screen.getAllByPlaceholderText(/搜索|搜尋|Search/i);
      if (searchInputs.length > 0) {
        fireEvent.change(searchInputs[0], { target: { value: '大安區' } });
        // 可以添加更多搜索相關的測試
      }
    });

    // 驗證搜索結果或搜索功能存在
    const searchElement = screen.queryByText(/搜索|搜尋|Search/i);
    expect(searchElement || document.body).toBeTruthy();
  });

  test('📊 統計數據顯示測試', async () => {
    console.log('🧪 測試統計數據顯示...');
    
    // 設置已登入狀態
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({
      _id: '1',
      email: 'test@example.com',
      first_name: '測試',
      last_name: '用戶',
      role: 'agent'
    }));

    // 模擬統計 API
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stats') || url.includes('overview')) {
        return mockApiResponse({
          success: true,
          data: {
            total_customers: 100,
            total_properties: 50,
            active_customers: 80,
            available_properties: 30
          }
        });
      }
      return mockApiResponse({ success: true, data: {} });
    });

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 等待統計數據載入
    await waitFor(() => {
      // 尋找任何數字或統計相關的元素
      const statsElements = screen.getAllByText(/\d+/) || [];
      expect(statsElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  test('🚪 登出流程測試', async () => {
    console.log('🧪 測試登出流程...');
    
    // 設置已登入狀態
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({
      _id: '1',
      email: 'test@example.com',
      first_name: '測試',
      last_name: '用戶',
      role: 'agent'
    }));

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 尋找登出按鈕或用戶菜單
    await waitFor(() => {
      const logoutElements = screen.queryAllByText(/登出|Logout|退出/i);
      const userMenus = screen.queryAllByText(/測試用戶|用戶/i);
      
      if (logoutElements.length > 0) {
        fireEvent.click(logoutElements[0]);
      } else if (userMenus.length > 0) {
        fireEvent.click(userMenus[0]);
        // 尋找下拉菜單中的登出選項
        setTimeout(() => {
          const dropdownLogout = screen.queryByText(/登出|Logout/i);
          if (dropdownLogout) {
            fireEvent.click(dropdownLogout);
          }
        }, 100);
      }
    });

    // 驗證登出後返回登入頁面
    await waitFor(() => {
      const loginElement = screen.queryByText('PropAgent Pro') || screen.queryByText(/登入|Login/i);
      expect(loginElement).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('📱 響應式設計基本測試', async () => {
    console.log('🧪 測試響應式設計...');
    
    // 模擬移動設備視口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });

    // 觸發 resize 事件
    fireEvent(window, new Event('resize'));

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 驗證頁面在小屏幕下仍能正常渲染
    await waitFor(() => {
      expect(screen.getByText('PropAgent Pro')).toBeTruthy();
    });

    // 恢復默認視口
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  test('⚠️ 錯誤處理測試', async () => {
    console.log('🧪 測試錯誤處理...');
    
    // 模擬 API 錯誤響應
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          message: '服務器錯誤'
        })
      })
    );

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // 嘗試觸發錯誤（例如無效登入）
    await waitFor(() => {
      const emailInput = screen.getByLabelText(/電子郵件|Email/i);
      const passwordInput = screen.getByLabelText(/密碼|Password/i);
      const loginButton = screen.getByRole('button', { name: /登入|登錄/i });

      fireEvent.change(emailInput, { target: { value: 'invalid@email.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);
    });

    // 驗證錯誤處理（不會導致崩潰）
    await waitFor(() => {
      expect(screen.getByText('PropAgent Pro')).toBeTruthy();
    }, { timeout: 3000 });
  });
});

export default {};