import React from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/hardcoded';
import { useTranslation } from './hooks/useTranslation';

// 測試元件來驗證國際化修復
const I18nTestComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>國際化修復測試</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>通用翻譯測試:</h3>
        <p>應用名稱: <strong>{t('common.appName')}</strong></p>
        <p>應用副標題: <strong>{t('common.appSubtitle')}</strong></p>
        <p>測試用戶: <strong>{t('common.testUser')}</strong></p>
        <p>測試郵箱: <strong>{t('common.testEmail')}</strong></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>認證頁面翻譯測試:</h3>
        <p>登入副標題: <strong>{t('auth.loginSubtitle')}</strong></p>
        <p>電子郵件: <strong>{t('auth.email')}</strong></p>
        <p>密碼: <strong>{t('auth.password')}</strong></p>
        <p>登入按鈕: <strong>{t('auth.loginButton')}</strong></p>
        <p>測試帳號資訊: <strong>{t('auth.testAccount')}</strong></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>導航翻譯測試:</h3>
        <p>儀表板: <strong>{t('navigation.dashboard')}</strong></p>
        <p>客戶管理: <strong>{t('navigation.customers')}</strong></p>
        <p>房產管理: <strong>{t('navigation.properties')}</strong></p>
        <p>分析報告: <strong>{t('navigation.analytics')}</strong></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>儀表板翻譯測試:</h3>
        <p>標題: <strong>{t('dashboard.title')}</strong></p>
        <p>總客戶數: <strong>{t('dashboard.totalCustomers')}</strong></p>
        <p>總房產數: <strong>{t('dashboard.totalProperties')}</strong></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>輸入框提示翻譯測試:</h3>
        <p>輸入郵箱: <strong>{t('placeholders.enterEmail')}</strong></p>
        <p>輸入密碼: <strong>{t('placeholders.enterPassword')}</strong></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>錯誤訊息翻譯測試:</h3>
        <p>網絡錯誤: <strong>{t('messages.networkError')}</strong></p>
        <p>郵箱必填: <strong>{t('auth.emailRequired')}</strong></p>
        <p>密碼必填: <strong>{t('auth.passwordRequired')}</strong></p>
      </div>

      <div style={{ 
        padding: '15px',
        background: t('common.appName') === 'PropAgent Pro' ? '#d4edda' : '#f8d7da',
        borderRadius: '5px',
        border: `1px solid ${t('common.appName') === 'PropAgent Pro' ? '#c3e6cb' : '#f5c6cb'}`
      }}>
        <strong>
          修復狀態: {t('common.appName') === 'PropAgent Pro' ? '✅ 成功' : '❌ 失敗'}
        </strong>
        <p>
          {t('common.appName') === 'PropAgent Pro' 
            ? '翻譯顯示正常，key 已正確轉換為翻譯文字' 
            : '翻譯顯示異常，仍然顯示 key 而非翻譯文字'
          }
        </p>
      </div>
    </div>
  );
};

export default I18nTestComponent;