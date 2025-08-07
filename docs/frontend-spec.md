# 前端UI設計與實施計劃 - PropAgent Pro

## 設計理念

### 核心設計原則
1. **效率優先**：以房仲業務員的工作流程為中心，最小化操作步驟
2. **直覺易用**：符合用戶既有習慣，降低學習成本
3. **即時反饋**：重要操作提供立即的視覺和聲音提醒
4. **行動優先**：考慮業務員外出時的手機使用場景

### 視覺風格指南
- **主色調**：專業藍 (#1890FF) - 信任感和專業形象
- **輔助色**：成功綠 (#52C41A)、警告橙 (#FA8C16)、危險紅 (#FF4D4F)
- **背景色**：淺灰 (#F5F5F5)、純白 (#FFFFFF)
- **字體**：微軟正黑體、思源黑體
- **圓角**：8px 統一圓角，營造現代感

## 主要頁面架構

### 1. 登入與認證頁面

#### 登入頁面 (`/login`)
```jsx
// 特色功能
- 手機號碼 + 驗證碼登入
- 微信/Line 第三方登入
- 記住登入狀態
- 忘記密碼快速重置

// 設計重點
- 大按鈕設計，適合觸控操作
- 品牌Logo和價值主張展示
- 登入成功後直接進入工作台
```

### 2. 主工作台 (`/dashboard`)

#### 版面配置
```
+------------------+------------------+------------------+
|   今日待辦事項    |     客戶提醒      |     快速行動      |
|   - 待回電客戶    |   - 該跟進的客戶   |   - 新增客戶      |
|   - 今日看房     |   - 生日祝福      |   - 安排看房      |
|   - 合約到期     |   - 預約回訪      |   - 記錄互動      |
+------------------+------------------+------------------+
|            業績儀表板 - 本月進度              |
|   成交件數: 3/5    |   業績金額: 450萬/800萬   |
+------------------+------------------+------------------+
|              最近客戶動態              |
|   張先生 - 2小時前查看信義區物件       |
|   李小姐 - 昨日來電詢問看房時間        |
+------------------------------------------+
```

#### 核心Widget設計
1. **待辦提醒卡片**
   - 緊急度顏色標記
   - 一鍵完成操作
   - 延後提醒功能

2. **客戶動態追蹤**
   - 即時互動記錄
   - 購買意願變化圖表
   - 快速聯繫按鈕

3. **業績進度條**
   - 視覺化目標達成率
   - 月度/季度切換
   - 激勵性設計元素

### 3. 客戶管理系統 (`/customers`)

#### 客戶列表頁面
```jsx
// 功能特色
- 智能搜尋和篩選
- 客戶標籤和分類
- 批量操作功能
- 匯入/匯出客戶資料

// 介面設計
[搜尋框] [篩選器] [排序] [檢視切換: 列表/卡片]

客戶卡片設計：
+----------------------------------+
| 頭像 | 王小明 ⭐⭐⭐⭐☆ (意願度)    |
|     | 預算: 1500-2000萬           |
|     | 區域: 信義區、大安區         |
|     | 最後聯繫: 2天前             |
|     | [通話] [訊息] [安排看房]     |
+----------------------------------+
```

#### 客戶詳細資料頁面
```jsx
// 分頁架構
[基本資料] [需求分析] [互動記錄] [看房歷史] [成交評估]

// 重點功能
- 購買意願評分算法顯示
- 互動時間軸
- 客戶需求匹配度分析
- 推薦物件清單
- 跟進提醒設置
```

### 4. 看房排程管理 (`/schedule`)

#### 行事曆檢視
```jsx
// 多重檢視模式
[日檢視] [週檢視] [月檢視] [清單檢視]

// 特殊功能
- 拖拽調整預約時間
- 衝突檢測和警告
- 路線規劃建議
- 天氣預報整合

// 看房卡片設計
+-------------------------+
| 10:00-11:00            |
| 王小明 - 信義區豪宅     |
| 📱 0912-345-678        |
| 🏠 台北市信義區...      |
| [確認] [延期] [取消]    |
+-------------------------+
```

#### 快速排程工具
```jsx
// 智能建議系統
- 根據客戶位置推薦看房順序
- 避開交通尖峰時段
- 考慮客戶偏好時間
- 自動發送確認訊息

// 批量預約功能
- 選擇多個客戶
- 統一時間安排
- 群組看房設定
```

### 5. 物件管理 (`/properties`)

#### 物件列表與搜尋
```jsx
// 進階搜尋功能
[區域] [價格範圍] [房型] [坪數] [屋齡] [交通]

// 物件卡片設計
+--------------------------------+
| [主圖] | 信義區 3房2廳2衛        |
|       | 1,800萬 | 45坪 | 5年   |
|       | 🚇距捷運站5分鐘          |
|       | ⭐配對客戶: 3位         |
|       | [編輯] [推薦] [查看]    |
+--------------------------------+
```

#### 客戶物件配對系統
```jsx
// 智能推薦算法
- 根據客戶需求自動配對
- 相似物件比較分析
- 市場行情參考
- 議價建議提供

// 推薦介面
"為王小明推薦的物件 (符合度: 92%)"
[價格符合] [區域符合] [房型符合] [交通便利]
```

### 6. 數據分析儀表板 (`/analytics`)

#### 個人業績分析
```jsx
// 圖表類型
- 月度成交趨勢線圖
- 客戶來源圓餅圖
- 看房轉換率漏斗圖
- 業績目標達成率

// 關鍵指標展示
[本月成交] [平均成交週期] [客戶滿意度] [推薦率]
```

#### 客戶分析報表
```jsx
// 客戶群體分析
- 年齡分布
- 預算區間
- 偏好區域
- 購買意願分布

// 行為分析
- 看房頻率
- 回應速度
- 決策時間
- 成交機率預測
```

## 響應式設計規範

### 斷點設定
```css
/* 手機版 */
@media (max-width: 768px) {
  // 單欄布局
  // 大按鈕設計
  // 簡化功能
}

/* 平板版 */
@media (min-width: 769px) and (max-width: 1024px) {
  // 雙欄布局
  // 適中按鈕
  // 完整功能
}

/* 桌面版 */
@media (min-width: 1025px) {
  // 多欄布局
  // 完整介面
  // 進階功能
}
```

### 行動端特殊考量
1. **觸控優化**：最小點擊區域44px x 44px
2. **單手操作**：重要功能置於拇指可及範圍
3. **網路優化**：圖片懶載入、資料分頁載入
4. **離線支援**：關鍵功能支援離線使用

## 元件設計系統

### 基礎元件庫
```jsx
// 按鈕系統
<Button type="primary" size="large" icon="phone">
  立即聯繫
</Button>

// 卡片容器
<Card 
  title="客戶資訊"
  extra={<Button>編輯</Button>}
  className="customer-card"
>
  // 內容
</Card>

// 狀態標籤
<Tag color="success">高意願</Tag>
<Tag color="warning">待跟進</Tag>
<Tag color="error">已流失</Tag>

// 評分元件
<Rating value={4.5} readonly />

// 進度條
<Progress percent={75} status="active" />
```

### 業務專用元件
```jsx
// 客戶意願評分器
<CustomerScore 
  score={8.5}
  factors={["預算充足", "需求明確", "時間急迫"]}
/>

// 看房時間選擇器
<SchedulePicker
  availableSlots={timeSlots}
  customerPreference={preferences}
  onSelect={handleSchedule}
/>

// 物件配對顯示器
<PropertyMatch
  customer={customerData}
  properties={matchedProperties}
  matchScore={0.92}
/>

// 業績儀表板
<PerformanceDashboard
  current={currentPerformance}
  target={targetGoals}
  period="monthly"
/>
```

## 動畫與互動效果

### 微互動設計
1. **按鈕點擊**：輕微縮放 + 陰影變化
2. **卡片懸停**：上移2px + 陰影加深
3. **載入狀態**：骨架屏 + 漸進式載入
4. **成功操作**：綠色勾選動畫 + 震動反饋

### 頁面轉場
```css
// 路由切換動畫
.page-enter {
  opacity: 0;
  transform: translateX(30px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 300ms, transform 300ms;
}
```

## 無障礙設計 (A11y)

### 基本要求
1. **鍵盤導航**：所有功能支援Tab鍵操作
2. **螢幕閱讀器**：適當的aria-label和role屬性
3. **顏色對比**：符合WCAG 2.1 AA標準
4. **字體大小**：支援瀏覽器字體縮放

### 特殊考量
- 重要提醒支援語音播報
- 高對比度模式支援
- 大字體模式適配

## 效能優化策略

### 程式碼分割
```jsx
// 路由層級分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Schedule = lazy(() => import('./pages/Schedule'));

// 元件層級分割
const Charts = lazy(() => import('./components/Charts'));
```

### 資料快取策略
```jsx
// Redux配置
const store = configureStore({
  reducer: {
    customers: customersSlice.reducer,
    properties: propertiesSlice.reducer,
    cache: cacheSlice.reducer,
  },
  middleware: [
    ...getDefaultMiddleware(),
    cacheMiddleware,
  ],
});

// Service Worker快取
- API回應快取
- 靜態資源快取
- 離線頁面支援
```

## 測試策略

### 單元測試
```jsx
// 元件測試範例
describe('CustomerCard', () => {
  test('顯示客戶基本資訊', () => {
    render(<CustomerCard customer={mockCustomer} />);
    expect(screen.getByText('王小明')).toBeInTheDocument();
  });
  
  test('點擊聯繫按鈕觸發通話', () => {
    const mockCall = jest.fn();
    render(<CustomerCard onCall={mockCall} />);
    fireEvent.click(screen.getByText('通話'));
    expect(mockCall).toHaveBeenCalled();
  });
});
```

### E2E測試
```javascript
// Cypress測試場景
describe('客戶管理流程', () => {
  it('新增客戶並安排看房', () => {
    cy.visit('/customers');
    cy.get('[data-cy=add-customer]').click();
    cy.get('[data-cy=customer-name]').type('測試客戶');
    cy.get('[data-cy=save-customer]').click();
    cy.get('[data-cy=schedule-viewing]').click();
    cy.url().should('include', '/schedule');
  });
});
```

## 部署與監控

### 建置流程
```yaml
# GitHub Actions設定
name: Frontend Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:coverage
      - uses: aws-actions/configure-aws-credentials@v2
      - run: aws s3 sync dist/ s3://propagent-frontend
```

### 效能監控
```jsx
// 關鍵指標追蹤
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);  // Cumulative Layout Shift
getFID(console.log);  // First Input Delay
getFCP(console.log);  // First Contentful Paint
getLCP(console.log);  // Largest Contentful Paint
getTTFB(console.log); // Time to First Byte
```

### 錯誤追蹤
```jsx
// Sentry整合
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});
```

## 開發環境設定

### 專案結構
```
src/
├── components/          # 共用元件
│   ├── ui/             # 基礎UI元件
│   ├── business/       # 業務邏輯元件
│   └── layout/         # 版面元件
├── pages/              # 頁面元件
├── hooks/              # 自定義Hooks
├── services/           # API服務
├── store/              # 狀態管理
├── utils/              # 工具函數
├── styles/             # 樣式檔案
└── assets/             # 靜態資源
```

### 開發工具
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write src/**/*.{ts,tsx}"
  },
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "antd": "^5.0.0",
    "@reduxjs/toolkit": "^1.9.0",
    "react-router-dom": "^6.8.0"
  }
}
```