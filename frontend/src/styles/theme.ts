import type { ThemeConfig } from 'antd';

// PropAgent Pro 房地產 CRM 專業主題配置
export const theme: ThemeConfig = {
  token: {
    // 主要色彩系統 - 極簡藍色調
    colorPrimary: '#2563EB', // 藍色 600 - 主色調
    colorSuccess: '#10B981', // 翡翠綠 500 - 成功色
    colorWarning: '#F59E0B', // 琥珀色 500 - 警告色
    colorError: '#EF4444', // 紅色 500 - 錯誤色
    colorInfo: '#3B82F6', // 藍色 500 - 信息色
    
    // 文字色彩系統 - 優化對比度符合 WCAG AA 標準
    colorTextBase: '#111827', // 主要文字 - 深灰黑
    colorTextSecondary: '#374151', // 次要文字 - 提升對比度
    colorTextTertiary: '#4B5563', // 三級文字 - 調整為更深色
    colorTextQuaternary: '#6B7280', // 禁用文字
    
    // 背景色彩 - 極簡背景系統
    colorBgBase: '#FFFFFF',
    colorBgLayout: '#F9FAFB',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBgSpotlight: '#F8FAFC',
    
    // 邊框色彩
    colorBorder: '#E2E8F0',
    colorBorderSecondary: '#F1F5F9',
    
    // 字體系統 - 專業級字體配置
    fontFamily: '"Inter", "SF Pro Display", "Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 14, // 基礎字體大小
    fontSizeHeading1: 40, // 2.5rem - 頁面主標題
    fontSizeHeading2: 32, // 2rem - 區塊標題
    fontSizeHeading3: 24, // 1.5rem - 子區塊標題
    fontSizeHeading4: 20, // 1.25rem - 卡片標題
    fontSizeHeading5: 18, // 1.125rem - 小標題
    fontSizeLG: 18, // 大號文字
    fontSizeSM: 12, // 小號文字
    fontSizeXL: 20, // 特大文字
    
    // 字體重量 - 專業級配置
    fontWeightStrong: 600, // 加粗文字
    
    // 邊框圓角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    
    // 控制項高度
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
    controlHeightXS: 24,
    
    // 陰影 - 極簡風格
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.15)',
    boxShadowTertiary: '0 8px 25px rgba(0, 0, 0, 0.15)',
    
    // 間距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // 線條寬度
    lineWidth: 1,
    lineWidthBold: 2,
    
    // 動畫
    motionDurationFast: '150ms',
    motionDurationMid: '300ms',
    motionDurationSlow: '500ms',
    motionEaseInOut: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    motionEaseOut: 'cubic-bezier(0, 0, 0.58, 1)',
    // motionEaseIn: 'cubic-bezier(0.42, 0, 1, 1)', // 暫時移除不支援的屬性
  },
  
  components: {
    // 按鈕組件
    Button: {
      borderRadius: 8,
      controlHeight: 44,
      controlHeightLG: 52,
      controlHeightSM: 36,
      fontWeight: 500,
      boxShadow: 'none',
      primaryShadow: 'none',
    },
    
    // 輸入框組件
    Input: {
      borderRadius: 8,
      controlHeight: 44,
      controlHeightLG: 52,
      controlHeightSM: 36,
      paddingBlock: 12,
      paddingInline: 16,
      fontSize: 14,
      activeBorderColor: '#10B981',
      hoverBorderColor: '#34D399',
    },
    
    // 卡片組件
    Card: {
      borderRadius: 12,
      paddingLG: 24,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      headerBg: '#FAFAFA',
      headerHeight: 56,
    },
    
    // 表格組件
    Table: {
      borderRadius: 0,
      headerBg: '#FAFAFA',
      headerColor: '#1E293B',
      headerSplitColor: '#E2E8F0',
      rowHoverBg: '#F8FAFC',
      cellPaddingBlock: 16,
      cellPaddingInline: 20,
    },
    
    // 選單組件
    Menu: {
      itemBorderRadius: 8,
      itemHeight: 48,
      iconSize: 16,
      fontSize: 14,
      horizontalItemHoverBg: 'rgba(37, 99, 235, 0.06)',
      itemActiveBg: 'rgba(37, 99, 235, 0.1)',
      itemSelectedBg: 'rgba(37, 99, 235, 0.1)',
      itemSelectedColor: '#2563EB',
    },
    
    // 標籤組件
    Tag: {
      borderRadius: 8,
      // paddingInline: 12, // 暫時移除不支援的屬性
      fontSize: 12,
      // fontWeight: 500, // 暫時移除不支援的屬性
    },
    
    // 統計組件
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 32,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    
    // 進度條組件
    Progress: {
      remainingColor: 'rgba(16, 185, 129, 0.1)',
      circleTextFontSize: '1.2em',
    },
    
    // 分割線組件
    Divider: {
      colorSplit: '#D1FAE5',
      marginLG: 24,
    },
    
    // 頭像組件
    Avatar: {
      borderRadius: 12,
      fontSize: 18,
      // fontWeight: 500, // 暫時移除不支援的屬性
    },
    
    // 徽章組件
    Badge: {
      fontSize: 12,
      // fontWeight: 500, // 暫時移除不支援的屬性
      fontSizeSM: 10,
    },
    
    // 工具提示組件
    Tooltip: {
      borderRadius: 8,
      fontSize: 12,
    },
    
    // 彈出框組件
    Popover: {
      borderRadius: 12,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    },
    
    // 抽屜組件
    Drawer: {
      borderRadius: 0,
      paddingLG: 32,
    },
    
    // 模態框組件
    Modal: {
      borderRadius: 16,
      paddingLG: 32,
      titleFontSize: 20,
      titleLineHeight: 1.4,
    },
    
    // 通知組件
    Notification: {
      borderRadius: 12,
      paddingLG: 20,
      fontSize: 14,
    },
    
    // 訊息組件
    Message: {
      borderRadius: 8,
      fontSize: 14,
      // fontWeight: 500, // 暫時移除不支援的屬性
    },
    
    // 佈局組件
    Layout: {
      headerBg: '#FFFFFF',
      siderBg: '#1E293B',
      bodyBg: '#F9FAFB',
      headerHeight: 72,
      headerPadding: '0 32px',
      triggerBg: 'transparent',
      triggerColor: '#FFFFFF',
    },
    
    // 選擇器組件
    Select: {
      borderRadius: 8,
      controlHeight: 44,
      fontSize: 14,
      optionPadding: '8px 16px',
      optionSelectedBg: 'rgba(16, 185, 129, 0.1)',
    },
    
    // 日期選擇器組件
    DatePicker: {
      borderRadius: 8,
      controlHeight: 44,
      cellWidth: 36,
      cellHeight: 28,
    },
    
    // 時間選擇器組件 - 暫時移除，可能不支援單獨配置
    // TimePicker: {
    //   borderRadius: 8,
    //   controlHeight: 44,
    // },
    
    // 上傳組件
    Upload: {
      borderRadius: 8,
    },
    
    // 步驟條組件
    Steps: {
      iconSize: 32,
      iconFontSize: 16,
      titleLineHeight: 1.5,
    },
    
    // 分頁組件
    Pagination: {
      itemSize: 36,
      // itemBorderRadius: 8, // 暫時移除不支援的屬性
      fontSize: 14,
    },
    
    // 錨點組件
    Anchor: {
      linkPaddingBlock: 8,
      // linkPaddingInline: 16, // 暫時移除不支援的屬性
    },
  },
  
  // 算法配置
  algorithm: undefined, // 可以根據需要設置暗色主題算法
};

// 深色主題配置
export const darkTheme: ThemeConfig = {
  ...theme,
  token: {
    ...theme.token,
    colorTextBase: '#FFFFFF',
    colorTextSecondary: '#E6E6E6',
    colorTextTertiary: '#CCCCCC',
    colorTextQuaternary: '#999999',
    
    colorBgBase: '#141414',
    colorBgLayout: '#000000',
    colorBgContainer: '#1F1F1F',
    colorBgElevated: '#262626',
    colorBgSpotlight: '#1C1C1C',
    
    colorBorder: '#303030',
    colorBorderSecondary: '#424242',
  },
};

// 主題工具函數
export const themeUtils = {
  // 獲取主題令牌值
  getToken: (token: string) => {
    return (theme.token as any)?.[token];
  },
  
  // 扁平化色彩系統
  colors: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    textPrimary: '#1E293B',
    textSecondary: '#475569',
    textTertiary: '#64748B',
    border: '#E2E8F0',
    bgWhite: '#FFFFFF',
    bgLight: '#F8FAFC',
  },
  
  // 扁平化設計變體
  flat: {
    card: {
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    button: {
      primary: {
        background: '#2563EB',
        color: '#FFFFFF',
        border: '1px solid #2563EB',
        borderRadius: '8px',
      },
      secondary: {
        background: '#FFFFFF',
        color: '#2563EB',
        border: '1px solid #2563EB',
        borderRadius: '8px',
      },
    },
    input: {
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '6px',
      boxShadow: 'none',
    },
  },
  
  // 陰影變體 - 極簡風格
  shadow: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 12px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 25px rgba(0, 0, 0, 0.15)',
    none: 'none',
  },
  
  // 響應式斷點
  breakpoints: {
    xs: '480px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1600px',
  },
  
  // 媒體查詢生成器
  media: {
    xs: '@media (max-width: 479px)',
    sm: '@media (min-width: 480px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 992px)',
    xl: '@media (min-width: 1200px)',
    xxl: '@media (min-width: 1600px)',
  },
};

export default theme;
