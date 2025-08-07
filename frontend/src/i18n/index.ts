import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 導入翻譯資源
import zhTW from './locales/zh-TW.json';
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

console.log('Loading i18n resources:', { zhTW, zhCN, en });

const resources = {
  'zh-TW': {
    translation: zhTW
  },
  'zh-CN': {
    translation: zhCN
  },
  'en': {
    translation: en
  }
};

console.log('i18n resources object:', resources);

// 同步初始化 i18n - 確保在 React 應用啟動前完成
i18n
  // 檢測用戶語言
  .use(LanguageDetector)
  // 連接 react-i18next
  .use(initReactI18next)
  // 初始化 i18next
  .init({
    resources,
    
    // 默認語言
    lng: 'zh-TW',
    
    // 回退語言
    fallbackLng: 'zh-TW',
    
    // 調試模式
    debug: process.env.NODE_ENV === 'development',
    
    // 語言檢測選項
    detection: {
      // 檢測順序
      order: ['localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      
      // 緩存用戶語言
      caches: ['localStorage', 'sessionStorage'],
      
      // 排除的路徑
      excludeCacheFor: ['cimode']
    },
    
    // 插值選項
    interpolation: {
      // React 已經處理了 XSS
      escapeValue: false
    },
    
    // 命名空間
    ns: ['translation'],
    defaultNS: 'translation',
    
    // 返回對象而不是字符串
    returnObjects: false,
    
    // 返回空字符串而不是 key
    returnEmptyString: false,
    
    // React 選項
    react: {
      // 不使用 Suspense 以避免延遲載入問題
      useSuspense: false,
      
      // 綁定 i18n 實例
      bindI18n: 'languageChanged loaded',
      
      // 綁定 i18n store
      bindI18nStore: 'added removed',
      
      // 轉義傳遞給翻譯函數的值
      transEmptyNodeValue: '',
      
      // 翻譯函數的默認父元素
      transSupportBasicHtmlNodes: true,
      
      // 允許的節點
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p']
    },
    
    // 支援的語言
    supportedLngs: ['zh-TW', 'zh-CN', 'en'],
    
    // 非明確語言的回退
    nonExplicitSupportedLngs: true,
    
    // 載入選項
    load: 'languageOnly',
    
    // 預載入語言
    preload: ['zh-TW'],
    
    // 清理代碼
    cleanCode: true,
    
    // 處理分隔符
    keySeparator: '.',
    nsSeparator: ':',
    
    // 缺失的翻譯處理函數
    missingKeyHandler: function(lng: string[], ns: string, key: string, fallbackValue: string) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng.join(', ')}`);
      }
    }
  }, (err, t) => {
    if (err) {
      console.error('i18n initialization failed:', err);
    } else {
      console.log('i18n initialized successfully');
      console.log('Current language:', i18n.language);
      console.log('Available resources:', Object.keys(i18n.store.data));
    }
  });

// 語言變更監聽
i18n.on('languageChanged', (lng) => {
  console.log(`Language changed to: ${lng}`);
  
  // 更新 HTML lang 屬性
  document.documentElement.lang = lng;
  
  // 更新頁面標題的語言
  document.title = i18n.t('common.appName');
  
  // 觸發自定義事件
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: lng }));
});

// 載入完成監聽
i18n.on('loaded', () => {
  console.log('i18n resources loaded');
});

// 初始化失敗監聽
i18n.on('failedLoading', (lng, ns, msg) => {
  console.error(`Failed loading translation: ${lng}/${ns}:`, msg);
});

export default i18n;