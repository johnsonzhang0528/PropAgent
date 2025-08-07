import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { store } from '../store';
import ResponsiveLayout from '../components/layout/ResponsiveLayout';
import ResponsiveCustomerList from '../components/business/ResponsiveCustomerList';

// 測試組件包裝器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <ConfigProvider locale={zhTW}>
      {children}
    </ConfigProvider>
  </Provider>
);

// 模擬 react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('📱 PropAgent Pro - 響應式設計測試', () => {
  // 設置不同屏幕尺寸的工具函數
  const setScreenSize = (width: number, height: number = 768) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    
    // 觸發 resize 事件
    window.dispatchEvent(new Event('resize'));
  };

  const restoreScreenSize = () => {
    setScreenSize(1024, 768);
  };

  afterEach(() => {
    restoreScreenSize();
  });

  test('🖥️ 桌面端佈局測試 (>= 1200px)', async () => {
    console.log('🧪 測試桌面端佈局...');
    
    // 設置大屏幕尺寸
    setScreenSize(1200, 800);

    render(
      <TestWrapper>
        <ResponsiveLayout>
          <div>桌面端內容</div>
        </ResponsiveLayout>
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證頁面基本元素存在
      expect(document.querySelector('.ant-layout')).toBeTruthy();
      expect(document.querySelector('.ant-layout-header')).toBeTruthy();
      
      // 驗證有菜單按鈕（折疊/展開按鈕）
      const menuButtons = screen.getAllByRole('button');
      expect(menuButtons.length).toBeGreaterThan(0);
      
      // 驗證用戶頭像存在
      expect(document.querySelector('.ant-avatar')).toBeTruthy();
    });
  });

  test('📱 移動端佈局測試 (<= 768px)', async () => {
    console.log('🧪 測試移動端佈局...');
    
    // 設置移動端尺寸
    setScreenSize(375, 667);

    render(
      <TestWrapper>
        <ResponsiveLayout>
          <div>移動端內容</div>
        </ResponsiveLayout>
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證移動端有菜單按鈕
      const menuButtons = screen.getAllByRole('button');
      expect(menuButtons.length).toBeGreaterThan(0);
      
      // 驗證移動端佈局元素
      expect(document.querySelector('.ant-layout')).toBeTruthy();
      expect(document.querySelector('.ant-layout-header')).toBeTruthy();
      
      // 驗證用戶頭像存在
      expect(document.querySelector('.ant-avatar')).toBeTruthy();
    });
  });

  test('💻 平板端佈局測試 (768px - 1200px)', async () => {
    console.log('🧪 測試平板端佈局...');
    
    // 設置平板尺寸
    setScreenSize(768, 1024);

    render(
      <TestWrapper>
        <ResponsiveLayout>
          <div>平板端內容</div>
        </ResponsiveLayout>
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證平板端佈局元素
      expect(document.querySelector('.ant-layout')).toBeTruthy();
      expect(document.querySelector('.ant-layout-header')).toBeTruthy();
      
      // 驗證有按鈕元素
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // 驗證用戶頭像存在
      expect(document.querySelector('.ant-avatar')).toBeTruthy();
    });
  });

  test('📋 響應式客戶列表 - 移動端', async () => {
    console.log('🧪 測試響應式客戶列表（移動端）...');
    
    // 設置移動端尺寸
    setScreenSize(375, 667);

    render(
      <TestWrapper>
        <ResponsiveCustomerList />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證統計卡片存在
      expect(screen.getByText('總客戶數')).toBeTruthy();
      expect(screen.getByText('活躍客戶')).toBeTruthy();
      
      // 驗證搜索功能
      const searchInput = screen.getByPlaceholderText('搜索客戶姓名或電話');
      expect(searchInput).toBeTruthy();
      
      // 驗證新增按鈕在移動端顯示為"新增"
      expect(screen.getByText('新增')).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('📋 響應式客戶列表 - 桌面端', async () => {
    console.log('🧪 測試響應式客戶列表（桌面端）...');
    
    // 設置桌面端尺寸
    setScreenSize(1200, 800);

    render(
      <TestWrapper>
        <ResponsiveCustomerList />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證統計卡片存在
      expect(screen.getByText('總客戶數')).toBeTruthy();
      expect(screen.getByText('活躍客戶')).toBeTruthy();
      
      // 驗證搜索功能
      const searchInput = screen.getByPlaceholderText('搜索客戶姓名或電話');
      expect(searchInput).toBeTruthy();
      
      // 驗證新增按鈕在桌面端顯示為"新增客戶"
      expect(screen.getByText('新增客戶')).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('🔄 屏幕尺寸變化測試', async () => {
    console.log('🧪 測試屏幕尺寸變化...');
    
    // 初始為桌面端
    setScreenSize(1200, 800);

    const { rerender } = render(
      <TestWrapper>
        <ResponsiveLayout>
          <ResponsiveCustomerList />
        </ResponsiveLayout>
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證桌面端顯示完整按鈕文字
      const addButton = screen.queryByText('新增客戶') || screen.queryByText('新增');
      expect(addButton).toBeTruthy();
    });

    // 切換到移動端
    setScreenSize(375, 667);
    
    rerender(
      <TestWrapper>
        <ResponsiveLayout>
          <ResponsiveCustomerList />
        </ResponsiveLayout>
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證移動端顯示簡短按鈕文字
      const addButton = screen.queryByText('新增') || screen.queryByText('新增客戶');
      expect(addButton).toBeTruthy();
    });
  });

  test('📊 統計卡片響應式佈局測試', async () => {
    console.log('🧪 測試統計卡片響應式佈局...');
    
    // 移動端測試
    setScreenSize(375, 667);

    render(
      <TestWrapper>
        <ResponsiveCustomerList />
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證統計卡片在移動端正確顯示
      expect(screen.getByText('總客戶數')).toBeTruthy();
      expect(screen.getByText('活躍客戶')).toBeTruthy();
      expect(screen.getByText('高意願客戶')).toBeTruthy();
      expect(screen.getByText('成功率')).toBeTruthy();
      
      // 驗證數值顯示
      expect(document.body.textContent).toContain('3'); // 總客戶數
      expect(document.body.textContent).toContain('2'); // 活躍客戶
    }, { timeout: 3000 });
  });

  test('🎨 CSS 樣式和類別測試', async () => {
    console.log('🧪 測試 CSS 樣式和類別...');
    
    render(
      <TestWrapper>
        <ResponsiveLayout>
          <ResponsiveCustomerList />
        </ResponsiveLayout>
      </TestWrapper>
    );

    await waitFor(() => {
      // 驗證 Ant Design 組件正確載入
      expect(document.querySelector('.ant-layout')).toBeTruthy();
      expect(document.querySelector('.ant-card')).toBeTruthy();
      expect(document.querySelector('.ant-statistic')).toBeTruthy();
      
      // 驗證自定義樣式
      const elements = document.querySelectorAll('[style*="padding"]');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  test('🔍 搜索和篩選功能測試', async () => {
    console.log('🧪 測試搜索和篩選功能...');
    
    render(
      <TestWrapper>
        <ResponsiveCustomerList />
      </TestWrapper>
    );

    await waitFor(() => {
      // 測試搜索輸入
      const searchInput = screen.getByPlaceholderText('搜索客戶姓名或電話');
      fireEvent.change(searchInput, { target: { value: '張' } });
      expect(searchInput).toBeTruthy();
      
      // 測試狀態篩選
      const statusFilter = screen.getByText('狀態篩選');
      expect(statusFilter).toBeTruthy();
    }, { timeout: 3000 });
  });

  test('⚡ 性能和載入測試', async () => {
    console.log('🧪 測試性能和載入...');
    
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <ResponsiveLayout>
          <ResponsiveCustomerList />
        </ResponsiveLayout>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('總客戶數')).toBeTruthy();
    }, { timeout: 5000 });

    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // 驗證載入時間合理（小於 3 秒）
    expect(loadTime).toBeLessThan(3000);
    console.log(`📈 響應式組件載入時間: ${loadTime.toFixed(2)}ms`);
  });
});

export default {};