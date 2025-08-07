import React from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { useTranslation } from '../../hooks/useTranslation';

const { Title, Text } = Typography;

const I18nTest: React.FC = () => {
  const { t, i18n, getCurrentLanguage } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <Card title="i18n 翻譯測試" style={{ margin: 20 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>當前語言: {getCurrentLanguage()}</Title>
        </div>
        
        <div>
          <Title level={5}>測試翻譯鍵值:</Title>
          <div>
            <Text>common.appName: <strong>{t('common.appName')}</strong></Text>
          </div>
          <div>
            <Text>common.appSubtitle: <strong>{t('common.appSubtitle')}</strong></Text>
          </div>
          <div>
            <Text>auth.loginSubtitle: <strong>{t('auth.loginSubtitle')}</strong></Text>
          </div>
          <div>
            <Text>auth.loginButton: <strong>{t('auth.loginButton')}</strong></Text>
          </div>
        </div>
        
        <div>
          <Title level={5}>語言切換測試:</Title>
          <Space>
            <Button onClick={() => handleLanguageChange('zh-TW')}>
              繁體中文
            </Button>
            <Button onClick={() => handleLanguageChange('zh-CN')}>
              简体中文
            </Button>
            <Button onClick={() => handleLanguageChange('en')}>
              English
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default I18nTest;