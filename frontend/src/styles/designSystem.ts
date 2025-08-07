/**
 * PropAgent Pro 房地產 CRM 設計系統
 * 專業、現代、可訪問的視覺設計標準
 */

// ==================== 色彩系統 ====================

export const colors = {
  // 主色調系統 - 翡翠綠（信任、穩定、成長）
  primary: {
    50: '#ECFDF5',   // 極淺背景
    100: '#D1FAE5',  // 淺背景/邊框
    200: '#A7F3D0',  // 淺色強調
    300: '#6EE7B7',  // 中淺色
    400: '#34D399',  // 懸停色
    500: '#10B981',  // 主色調
    600: '#059669',  // 深色主調
    700: '#047857',  // 深色強調
    800: '#065F46',  // 側邊欄背景
    900: '#064E3B'   // 最深背景
  },

  // 中性色系統 - 藍灰色（專業、科技感）
  neutral: {
    50: '#F8FAFC',   // 極淺背景
    100: '#F1F5F9',  // 淺背景
    200: '#E2E8F0',  // 分割線
    300: '#CBD5E1',  // 邊框
    400: '#94A3B8',  // 占位符
    500: '#64748B',  // 次要文字
    600: '#475569',  // 正文
    700: '#334155',  // 標題
    800: '#1E293B',  // 深色文字
    900: '#0F172A'   // 最深文字
  },

  // 功能色彩系統
  functional: {
    success: '#059669',    // 成功 - 深翡翠綠
    warning: '#F59E0B',    // 警告 - 琥珀色
    error: '#EF4444',      // 錯誤 - 紅色
    info: '#3B82F6',       // 信息 - 藍色
    purple: '#8B5CF6'      // 紫色強調
  },

  // 房地產業務特定色彩
  business: {
    // 物業狀態
    available: '#3B82F6',  // 可售 - 藍色
    sold: '#059669',       // 已售 - 綠色
    pending: '#F59E0B',    // 待定 - 黃色
    reserved: '#8B5CF6',   // 保留 - 紫色
    
    // 價值等級
    luxury: '#7C2D12',     // 奢華 - 深棕
    highValue: '#DC2626',  // 高價值 - 紅色
    premium: '#9333EA',    // 優質 - 紫色
    standard: '#059669'    // 標準 - 綠色
  },

  // 文字色彩
  text: {
    primary: '#111827',    // 主要文字
    secondary: '#4B5563',  // 次要文字
    tertiary: '#6B7280',   // 三級文字
    disabled: '#9CA3AF',   // 禁用文字
    inverse: '#FFFFFF',    // 反色文字
    link: '#10B981'        // 連結色
  }
};

// ==================== 字體系統 ====================

export const typography = {
  // 字體系列
  fontFamily: {
    primary: '"Inter", "SF Pro Display", "Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, Monaco, monospace',
    numbers: '"Inter", "SF Mono", -apple-system, BlinkMacSystemFont, sans-serif'
  },

  // 標題層級
  headings: {
    h1: {
      fontSize: '2.5rem',      // 40px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em'
    },
    h2: {
      fontSize: '2rem',        // 32px
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.025em'
    },
    h3: {
      fontSize: '1.5rem',      // 24px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em'
    },
    h4: {
      fontSize: '1.25rem',     // 20px
      fontWeight: 600,
      lineHeight: 1.4
    },
    h5: {
      fontSize: '1.125rem',    // 18px
      fontWeight: 600,
      lineHeight: 1.4
    },
    h6: {
      fontSize: '1rem',        // 16px
      fontWeight: 600,
      lineHeight: 1.5
    }
  },

  // 正文層級
  body: {
    large: {
      fontSize: '1.125rem',    // 18px
      lineHeight: 1.6,
      fontWeight: 400
    },
    base: {
      fontSize: '1rem',        // 16px
      lineHeight: 1.6,
      fontWeight: 400
    },
    small: {
      fontSize: '0.875rem',    // 14px
      lineHeight: 1.5,
      fontWeight: 400
    },
    xs: {
      fontSize: '0.75rem',     // 12px
      lineHeight: 1.4,
      fontWeight: 400
    }
  },

  // 數據展示專用
  data: {
    large: {
      fontSize: '2rem',        // 32px
      fontWeight: 700,
      lineHeight: 1.2,
      fontFamily: 'Inter, sans-serif'
    },
    medium: {
      fontSize: '1.5rem',      // 24px
      fontWeight: 600,
      lineHeight: 1.3,
      fontFamily: 'Inter, sans-serif'
    },
    small: {
      fontSize: '1.25rem',     // 20px
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: 'Inter, sans-serif'
    }
  }
};

// ==================== 間距系統 ====================

export const spacing = {
  // 基礎間距單位（8px 基準）
  xs: '4px',     // 0.5 單位
  sm: '8px',     // 1 單位
  md: '16px',    // 2 單位
  lg: '24px',    // 3 單位
  xl: '32px',    // 4 單位
  '2xl': '48px', // 6 單位
  '3xl': '64px', // 8 單位
  '4xl': '96px', // 12 單位

  // 組件專用間距
  component: {
    cardPadding: '24px',       // 卡片內邊距
    sectionGap: '32px',        // 區塊間距
    listItemGap: '16px',       // 列表項間距
    formItemGap: '20px',       // 表單項間距
    buttonGap: '12px',         // 按鈕間距
    iconGap: '8px'             // 圖標間距
  }
};

// ==================== 陰影系統 ====================

export const shadows = {
  // 卡片陰影
  card: '0 4px 20px rgba(0, 0, 0, 0.08)',
  cardHover: '0 8px 30px rgba(0, 0, 0, 0.12)',
  cardActive: '0 12px 40px rgba(0, 0, 0, 0.15)',

  // 按鈕陰影
  button: '0 2px 8px rgba(0, 0, 0, 0.06)',
  buttonHover: '0 4px 12px rgba(0, 0, 0, 0.1)',
  buttonPrimary: '0 4px 15px rgba(16, 185, 129, 0.3)',
  buttonPrimaryHover: '0 6px 20px rgba(16, 185, 129, 0.4)',

  // 彈窗陰影
  modal: '0 20px 60px rgba(0, 0, 0, 0.15)',
  dropdown: '0 8px 25px rgba(0, 0, 0, 0.15)',
  tooltip: '0 4px 12px rgba(0, 0, 0, 0.15)',

  // 數據可視化陰影
  dataCard: '0 6px 24px rgba(16, 185, 129, 0.1)',
  chart: '0 4px 16px rgba(0, 0, 0, 0.08)'
};

// ==================== 邊框圓角系統 ====================

export const borderRadius = {
  none: '0',
  sm: '6px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px'
};

// ==================== 動畫系統 ====================

export const animations = {
  // 動畫持續時間
  duration: {
    fast: '150ms',
    base: '300ms',
    slow: '500ms'
  },

  // 緩動函數
  easing: {
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
    easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)'
  },

  // 常用動畫效果
  transitions: {
    all: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    opacity: 'opacity 300ms ease',
    transform: 'transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    colors: 'background-color 300ms ease, border-color 300ms ease, color 300ms ease'
  }
};

// ==================== 響應式斷點 ====================

export const breakpoints = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px'
};

export const mediaQueries = {
  xs: '@media (max-width: 479px)',
  sm: '@media (min-width: 480px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 992px)',
  xl: '@media (min-width: 1200px)',
  xxl: '@media (min-width: 1600px)'
};

// ==================== 房地產業務特定設計 ====================

export const businessDesign = {
  // 物業狀態樣式
  propertyStatus: {
    available: {
      color: colors.business.available,
      background: '#EFF6FF',
      border: '#DBEAFE'
    },
    sold: {
      color: colors.business.sold,
      background: '#ECFDF5',
      border: '#D1FAE5'
    },
    pending: {
      color: colors.business.pending,
      background: '#FFFBEB',
      border: '#FED7AA'
    },
    reserved: {
      color: colors.business.reserved,
      background: '#F3F4F6',
      border: '#E5E7EB'
    }
  },

  // 價格等級樣式
  priceLevel: {
    luxury: {
      gradient: 'linear-gradient(135deg, #7C2D12 0%, #A16207 100%)',
      shadow: '0 4px 15px rgba(124, 45, 18, 0.3)'
    },
    premium: {
      gradient: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)',
      shadow: '0 4px 15px rgba(147, 51, 234, 0.3)'
    },
    standard: {
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      shadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
    }
  },

  // 數據視覺化配色
  dataVisualization: {
    // 主要圖表色彩
    primary: [
      colors.primary[500],   // 翡翠綠
      colors.functional.info, // 藍色
      colors.functional.warning, // 琥珀色
      colors.functional.purple, // 紫色
      colors.functional.error   // 紅色
    ],
    
    // 次要圖表色彩
    secondary: [
      colors.primary[400],
      colors.neutral[400],
      colors.primary[300],
      colors.neutral[300],
      colors.primary[200]
    ]
  }
};

// ==================== 組件樣式預設 ====================

export const componentStyles = {
  // 卡片樣式
  card: {
    stats: {
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      boxShadow: shadows.card,
      border: `1px solid ${colors.neutral[200]}`
    },
    content: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
      background: colors.neutral[50],
      boxShadow: shadows.button,
      border: `1px solid ${colors.neutral[100]}`
    },
    featured: {
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      boxShadow: shadows.dataCard,
      border: `1px solid ${colors.primary[200]}`
    }
  },

  // 按鈕樣式
  button: {
    primary: {
      background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
      boxShadow: shadows.buttonPrimary,
      borderRadius: borderRadius.base,
      transition: animations.transitions.all
    },
    secondary: {
      background: colors.neutral[50],
      border: `1px solid ${colors.primary[200]}`,
      color: colors.primary[600],
      borderRadius: borderRadius.base,
      transition: animations.transitions.all
    }
  }
};

// ==================== 導出設計系統 ====================

export const designSystem = {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  animations,
  breakpoints,
  mediaQueries,
  businessDesign,
  componentStyles
};

export default designSystem;