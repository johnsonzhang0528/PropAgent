# PropAgent Pro 設計系統指南

## 📖 概述

PropAgent Pro 房地產 CRM 系統採用現代化、專業的設計語言，專為房地產行業量身定制。設計系統基於信任、穩定、成長的核心價值，使用翡翠綠作為主色調，輔以專業的藍灰色系，營造出可信賴的商業環境。

## 🎨 設計原則

### 1. 專業可信
- 使用穩定的翡翠綠色系建立信任感
- 清晰的層次結構和資訊架構
- 一致的視覺語言和交互模式

### 2. 現代優雅
- 柔和的圓角和漸變效果
- 精緻的陰影和動畫
- 優雅的字體排版

### 3. 數據導向
- 突出重要業務數據的展示
- 清晰的狀態標識系統
- 高效的資訊密度管理

### 4. 響應式友好
- 多設備適配的佈局系統
- 靈活的間距和尺寸系統
- 移動端優化的交互設計

## 🌈 色彩系統

### 主色調 - 翡翠綠系
```css
/* 主要翡翠綠色調 */
--primary-50: #ECFDF5;   /* 極淺背景 */
--primary-100: #D1FAE5;  /* 淺背景/邊框 */
--primary-500: #10B981;  /* 主色調 */
--primary-600: #059669;  /* 深色主調 */
--primary-900: #064E3B;  /* 最深背景 */
```

### 中性色系 - 藍灰色
```css
/* 專業藍灰色系 */
--neutral-50: #F8FAFC;   /* 極淺背景 */
--neutral-100: #F1F5F9;  /* 淺背景 */
--neutral-500: #64748B;  /* 次要文字 */
--neutral-700: #334155;  /* 標題 */
--neutral-900: #0F172A;  /* 最深文字 */
```

### 功能色彩
```css
--success: #059669;    /* 成功 */
--warning: #F59E0B;    /* 警告 */
--error: #EF4444;      /* 錯誤 */
--info: #3B82F6;       /* 信息 */
```

### 房地產業務色彩
```css
--business-available: #3B82F6;  /* 可售 */
--business-sold: #059669;       /* 已售 */
--business-pending: #F59E0B;    /* 待定 */
--business-reserved: #8B5CF6;   /* 保留 */
--business-luxury: #7C2D12;     /* 奢華 */
```

## 🔤 字體系統

### 字體家族
```css
/* 主要字體 */
font-family: "Inter", "SF Pro Display", "Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif;

/* 等寬字體 */
font-family: "JetBrains Mono", "Fira Code", Consolas, Monaco, monospace;

/* 數據展示字體 */
font-family: "Inter", "SF Mono", -apple-system, BlinkMacSystemFont, sans-serif;
```

### 標題層級
- **H1**: 2.5rem (40px) - 頁面主標題
- **H2**: 2rem (32px) - 區塊標題
- **H3**: 1.5rem (24px) - 子區塊標題
- **H4**: 1.25rem (20px) - 卡片標題
- **H5**: 1.125rem (18px) - 小標題
- **H6**: 1rem (16px) - 最小標題

### 正文層級
- **大號正文**: 1.125rem (18px) - 重要內容
- **標準正文**: 1rem (16px) - 一般內容
- **小號正文**: 0.875rem (14px) - 次要內容
- **極小正文**: 0.75rem (12px) - 標籤、說明

## 📐 間距系統

基於 8px 網格系統：

```css
--spacing-xs: 4px;     /* 0.5 單位 */
--spacing-sm: 8px;     /* 1 單位 */
--spacing-md: 16px;    /* 2 單位 */
--spacing-lg: 24px;    /* 3 單位 */
--spacing-xl: 32px;    /* 4 單位 */
--spacing-2xl: 48px;   /* 6 單位 */
--spacing-3xl: 64px;   /* 8 單位 */
--spacing-4xl: 96px;   /* 12 單位 */
```

### 組件專用間距
```css
--card-padding: 24px;      /* 卡片內邊距 */
--section-gap: 32px;       /* 區塊間距 */
--list-item-gap: 16px;     /* 列表項間距 */
--form-item-gap: 20px;     /* 表單項間距 */
```

## 🎯 組件使用指南

### 1. 統計卡片 (Statistic Cards)

用於展示重要業務數據：

```jsx
// 標準統計卡片
<Card className="stat-card">
  <Statistic 
    title="總客戶數" 
    value={156} 
    prefix={<UserOutlined />} 
  />
</Card>

// 特色統計卡片
<Card className="stat-card featured-stat">
  <Statistic 
    title="本月成交" 
    value={23} 
    suffix="筆" 
  />
</Card>
```

### 2. 物業狀態標籤

用於標識物業狀態：

```jsx
// 可售狀態
<span className="property-status available">可售</span>

// 已售狀態  
<span className="property-status sold">已售</span>

// 待定狀態
<span className="property-status pending">待定</span>

// 保留狀態
<span className="property-status reserved">保留</span>
```

### 3. 價格等級標識

用於標識價格等級：

```jsx
// 奢華等級
<span className="price-level luxury">奢華</span>

// 優質等級
<span className="price-level premium">優質</span>

// 標準等級
<span className="price-level standard">標準</span>
```

### 4. 頁面容器

用於頁面佈局：

```jsx
// 主要頁面容器
<div className="page-container">
  {/* 頁面內容 */}
</div>

// 數據展示容器
<div className="stats-container">
  {/* 統計數據 */}
</div>

// 內容卡片
<div className="content-card">
  {/* 卡片內容 */}
</div>
```

## 🎨 視覺效果

### 陰影系統
```css
/* 卡片陰影 */
.shadow-card { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }

/* 按鈕陰影 */
.shadow-button { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }

/* 主要陰影 */
.shadow-primary { box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }

/* 大陰影 */
.shadow-lg { box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); }
```

### 漸變背景
```css
/* 主要漸變 */
.gradient-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* 次要漸變 */
.gradient-secondary {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* 強調漸變 */
.gradient-accent {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}
```

### 動畫效果
```css
/* 卡片懸停效果 */
.card-hover:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* 按鈕懸停效果 */
.button-hover:hover {
  transform: translateY(-1px);
  transition: all 0.2s ease;
}
```

## 📱 響應式設計

### 斷點系統
```css
/* 斷點定義 */
--breakpoint-xs: 480px;
--breakpoint-sm: 576px;
--breakpoint-md: 768px;
--breakpoint-lg: 992px;
--breakpoint-xl: 1200px;
--breakpoint-xxl: 1600px;
```

### 響應式規則
```css
/* 移動端優化 */
@media (max-width: 768px) {
  .page-container {
    margin: 1rem;
    padding: 1.25rem;
    border-radius: 0.5rem;
  }
}

@media (max-width: 576px) {
  .page-container {
    margin: 0.5rem;
    padding: 1rem;
    border-radius: 0.375rem;
  }
}
```

## 🎯 數據視覺化

### 圖表色彩
```javascript
const chartColors = [
  '#10B981', // 翡翠綠
  '#3B82F6', // 藍色
  '#F59E0B', // 琥珀色
  '#8B5CF6', // 紫色
  '#EF4444'  // 紅色
];
```

### 狀態色彩映射
```javascript
const statusColors = {
  available: '#3B82F6',  // 可售 - 藍色
  sold: '#059669',       // 已售 - 綠色
  pending: '#F59E0B',    // 待定 - 黃色
  reserved: '#8B5CF6'    // 保留 - 紫色
};
```

## 🛠️ 實施建議

### 1. 開發準則
- 優先使用設計系統定義的樣式類
- 保持一致的命名規範
- 遵循組件化開發原則

### 2. 性能優化
- 使用 CSS 變量提高維護性
- 合理使用動畫和過渡效果
- 優化圖片和圖標資源

### 3. 可訪問性
- 確保足夠的色彩對比度
- 提供鍵盤導航支持
- 添加適當的 ARIA 標籤

### 4. 測試建議
- 多設備測試響應式佈局
- 驗證色彩對比度符合 WCAG 標準
- 測試動畫效果的性能影響

## 📚 參考資源

### 設計靈感
- [Ant Design](https://ant.design/) - 基礎組件庫
- [Tailwind CSS](https://tailwindcss.com/) - 工具類參考
- [Real Estate UI Patterns](https://dribbble.com/tags/real_estate) - 行業設計參考

### 開發工具
- [Inter Font](https://fonts.google.com/specimen/Inter) - 主要字體
- [Heroicons](https://heroicons.com/) - 圖標系統
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) - CSS 變量

---

*這個設計系統將持續演進，請根據業務需求和用戶反饋及時更新。*