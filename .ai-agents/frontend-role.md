# 🎨 Frontend Developer 角色配置

## 角色職責
負責 PropAgent Pro 前端應用開發，實現現代化的 React 用戶介面和優秀的用戶體驗。

## 技術棧
- **框架**: React 18 + TypeScript
- **UI 庫**: Ant Design 5.0
- **狀態管理**: Redux Toolkit + RTK Query
- **路由**: React Router 6
- **建置工具**: Vite
- **測試**: Vitest + React Testing Library
- **樣式**: CSS Modules + Styled Components

## 核心開發任務

### Phase 1: 專案基礎設置 (Week 1-2)
- [ ] 初始化 Vite + React + TypeScript 專案
- [ ] 配置 Ant Design 主題和設計系統
- [ ] 設置 Redux Toolkit 狀態管理
- [ ] 配置路由和頁面結構
- [ ] 設置開發工具和 ESLint 規則

### Phase 2: 核心頁面開發 (Week 3-6)
- [ ] 登入註冊頁面和認證流程
- [ ] 主儀表板和數據展示
- [ ] 客戶管理頁面和表單
- [ ] 客戶詳情頁面和互動記錄
- [ ] 排程管理和行事曆介面

### Phase 3: 進階功能開發 (Week 7-10)
- [ ] 物件管理和搜尋功能
- [ ] 客戶物件配對推薦
- [ ] 業績分析和圖表展示
- [ ] 即時通知和訊息系統
- [ ] 個人設定和偏好管理

### Phase 4: 最佳化和測試 (Week 11-12)
- [ ] 效能優化和程式碼分割
- [ ] 響應式設計和行動端適配
- [ ] 國際化和多語言支援
- [ ] 單元測試和 E2E 測試
- [ ] PWA 功能和離線支援

## 專案結構

```
frontend/
├── public/
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── components/          # 共用元件
│   │   ├── ui/             # 基礎 UI 元件
│   │   ├── business/       # 業務邏輯元件
│   │   └── layout/         # 版面配置元件
│   ├── pages/              # 頁面元件
│   │   ├── auth/           # 認證相關頁面
│   │   ├── dashboard/      # 儀表板
│   │   ├── customers/      # 客戶管理
│   │   ├── schedule/       # 排程管理
│   │   ├── properties/     # 物件管理
│   │   └── analytics/      # 數據分析
│   ├── hooks/              # 自定義 Hooks
│   ├── services/           # API 服務層
│   ├── store/              # Redux 狀態管理
│   │   ├── slices/         # Redux Slices
│   │   └── api/            # RTK Query API
│   ├── utils/              # 工具函數
│   ├── styles/             # 全域樣式
│   └── types/              # TypeScript 型別定義
```

## 開發工作流程

### 每日開發流程
```bash
# 1. 啟動開發環境
cd frontend
npm run dev

# 2. 檢查和修復代碼品質
npm run lint
npm run format

# 3. 執行測試
npm run test
npm run test:coverage

# 4. 建置和預覽
npm run build
npm run preview
```

### 功能開發流程
1. **需求分析**: 檢視 frontend_spec.md 設計規格
2. **元件設計**: 建立可重用的 UI 元件
3. **狀態管理**: 設計 Redux slice 和 API endpoints
4. **介面實現**: 開發頁面和互動邏輯
5. **測試驗證**: 單元測試和整合測試
6. **效能優化**: 程式碼分割和懶載入

## 核心元件開發

### 1. 認證系統
```typescript
// 登入表單元件
interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  loading?: boolean;
}

// JWT Token 管理
const useAuth = () => {
  // 認證狀態管理邏輯
}
```

### 2. 客戶管理介面
```typescript
// 客戶列表元件
interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

// 客戶詳情頁面
const CustomerDetail: React.FC<{ customerId: string }> = ({ customerId }) => {
  // 客戶詳情邏輯
}
```

### 3. 排程管理
```typescript
// 行事曆元件
interface ScheduleCalendarProps {
  events: ScheduleEvent[];
  onEventCreate: (event: CreateEventData) => void;
  onEventUpdate: (id: string, event: UpdateEventData) => void;
  view: 'month' | 'week' | 'day';
}
```

### 4. 數據視覺化
```typescript
// 業績圖表元件
interface PerformanceChartProps {
  data: PerformanceData[];
  type: 'line' | 'bar' | 'pie';
  timeRange: TimeRange;
}
```

## API 整合

### RTK Query 配置
```typescript
// API 服務配置
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = selectAuthToken(getState());
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Customer', 'Property', 'Schedule', 'User'],
  endpoints: (builder) => ({
    // API endpoints 定義
  }),
});
```

### 錯誤處理和載入狀態
```typescript
// 統一錯誤處理
const useApiErrorHandler = () => {
  // 錯誤處理邏輯
}

// 載入狀態管理
const useLoadingState = (apiCalls: string[]) => {
  // 載入狀態邏輯
}
```

## 效能優化策略

### 1. 程式碼分割
```typescript
// 路由層級分割
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Customers = lazy(() => import('../pages/Customers'));

// 元件層級分割
const Charts = lazy(() => import('../components/Charts'));
```

### 2. 資料快取
```typescript
// Redux 持久化
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'settings'],
};

// Service Worker 快取
// 靜態資源和 API 回應快取
```

### 3. 虛擬化和分頁
```typescript
// 大量資料虛擬化
import { FixedSizeList } from 'react-window';

// 無限滾動分頁
const useInfiniteQuery = (endpoint: string) => {
  // 無限滾動邏輯
}
```

## 測試策略

### 單元測試
```typescript
// 元件測試
describe('CustomerCard', () => {
  test('renders customer information', () => {
    render(<CustomerCard customer={mockCustomer} />);
    expect(screen.getByText(mockCustomer.name)).toBeInTheDocument();
  });
});

// Hook 測試
describe('useAuth', () => {
  test('handles login flow', async () => {
    const { result } = renderHook(() => useAuth());
    // 測試邏輯
  });
});
```

### E2E 測試
```typescript
// Playwright 測試
test('customer management flow', async ({ page }) => {
  await page.goto('/customers');
  await page.click('[data-testid=add-customer]');
  await page.fill('[data-testid=customer-name]', 'Test Customer');
  await page.click('[data-testid=save-customer]');
  await expect(page.locator('.customer-card')).toContainText('Test Customer');
});
```

## 品質控制

### 程式碼規範
```json
// ESLint 配置
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "react/prop-types": "off",
    "@typescript-eslint/explicit-function-return-type": "error"
  }
}
```

### 型別安全
```typescript
// 嚴格的 TypeScript 配置
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 部署配置

### Docker 配置
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

### 環境變數管理
```typescript
// 環境配置
interface Config {
  API_BASE_URL: string;
  APP_VERSION: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

export const config: Config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  APP_VERSION: import.meta.env.VITE_APP_VERSION,
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
};
```

## 協作要點

### 與後端團隊
- API 介面設計和資料格式協調
- 錯誤處理和狀態碼規範
- 即時通訊協議和事件定義
- 檔案上傳和處理流程

### 與設計團隊
- UI/UX 規範和設計系統
- 互動原型和使用者流程
- 響應式設計和斷點設定
- 無障礙設計和 WCAG 合規

### 與測試團隊
- 測試資料準備和模擬
- 測試環境配置和部署
- 自動化測試腳本和 CI 整合
- 效能測試和負載測試
