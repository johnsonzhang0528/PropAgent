import { useTranslation as useI18nTranslation } from 'react-i18next';

// 自定義翻譯 Hook，提供額外的功能
export const useTranslation = (namespace?: string) => {
  const { t, i18n } = useI18nTranslation(namespace);

  // 格式化數字
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(value);
  };

  // 格式化貨幣
  const formatCurrency = (value: number, currency: string = 'TWD') => {
    const currencyMap = {
      'zh-TW': 'TWD',
      'zh-CN': 'CNY', 
      'en': 'USD'
    };
    
    const actualCurrency = currencyMap[i18n.language as keyof typeof currencyMap] || currency;
    
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: actualCurrency
    }).format(value);
  };

  // 格式化日期
  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateValue = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(i18n.language, options).format(dateValue);
  };

  // 格式化相對時間
  const formatRelativeTime = (date: Date | string) => {
    const dateValue = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = (now.getTime() - dateValue.getTime()) / 1000;

    if (diffInSeconds < 60) {
      return t('common.justNow', '剛剛');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('common.minutesAgo', '{{count}} 分鐘前', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('common.hoursAgo', '{{count}} 小時前', { count: hours });
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return t('common.daysAgo', '{{count}} 天前', { count: days });
    } else {
      return formatDate(dateValue, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化百分比
  const formatPercentage = (value: number, decimalPlaces: number = 1) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value / 100);
  };

  // 格式化面積（根據語言選擇單位）
  const formatArea = (value: number) => {
    const unit = i18n.language === 'en' ? 'sqft' : '坪';
    return `${formatNumber(value)} ${unit}`;
  };

  // 格式化距離
  const formatDistance = (value: number) => {
    if (value < 1) {
      return `${Math.round(value * 1000)} ${t('units.m', 'm')}`;
    } else {
      return `${formatNumber(value, { maximumFractionDigits: 1 })} ${t('units.km', 'km')}`;
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      active: '#52c41a',
      inactive: '#d9d9d9',
      pending: '#faad14',
      completed: '#52c41a',
      cancelled: '#ff4d4f',
      available: '#52c41a',
      sold: '#ff4d4f',
      reserved: '#faad14'
    };
    
    return colorMap[status] || '#d9d9d9';
  };

  // 翻譯狀態文字
  const translateStatus = (status: string) => {
    return t(`status.${status}`, status);
  };

  // 翻譯枚舉值
  const translateEnum = (enumType: string, value: string) => {
    return t(`enums.${enumType}.${value}`, value);
  };

  // 複數形式處理
  const pluralize = (count: number, singularKey: string, pluralKey?: string) => {
    if (count === 1) {
      return t(singularKey, { count });
    } else {
      return t(pluralKey || `${singularKey}_plural`, { count });
    }
  };

  // 條件翻譯
  const conditionalTranslate = (condition: boolean, trueKey: string, falseKey: string) => {
    return t(condition ? trueKey : falseKey);
  };

  // 獲取當前語言
  const getCurrentLanguage = () => {
    return i18n.language;
  };

  // 檢查是否為中文
  const isChinese = () => {
    return i18n.language.startsWith('zh');
  };

  // 檢查是否為英文
  const isEnglish = () => {
    return i18n.language === 'en';
  };

  // 獲取語言顯示名稱
  const getLanguageDisplayName = (lang?: string) => {
    const language = lang || i18n.language;
    const nameMap = {
      'zh-TW': '繁體中文',
      'zh-CN': '简体中文',
      'en': 'English'
    };
    
    return nameMap[language as keyof typeof nameMap] || language;
  };

  // 獲取語言方向
  const getLanguageDirection = () => {
    // 目前支援的語言都是從左到右
    return 'ltr';
  };

  // 翻譯並返回 HTML
  const translateHTML = (key: string, options?: any) => {
    return {
      __html: t(key, options)
    };
  };

  return {
    t,
    i18n,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    formatFileSize,
    formatPercentage,
    formatArea,
    formatDistance,
    getStatusColor,
    translateStatus,
    translateEnum,
    pluralize,
    conditionalTranslate,
    getCurrentLanguage,
    isChinese,
    isEnglish,
    getLanguageDisplayName,
    getLanguageDirection,
    translateHTML
  };
};