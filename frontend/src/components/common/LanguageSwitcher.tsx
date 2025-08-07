import React from 'react';
import { Dropdown, Button, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from '../../hooks/useTranslation';

interface LanguageSwitcherProps {
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  placement = 'bottomRight',
  size = 'middle',
  type = 'default'
}) => {
  const { i18n } = useTranslation();

  const languages = [
    {
      key: 'zh-TW',
      label: '繁體中文',
      flag: '🇹🇼'
    },
    {
      key: 'zh-CN',
      label: '简体中文',
      flag: '🇨🇳'
    },
    {
      key: 'en',
      label: 'English',
      flag: '🇺🇸'
    }
  ];

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  };

  const menuItems: MenuProps['items'] = languages.map(lang => ({
    key: lang.key,
    label: (
      <Space>
        <span>{lang.flag}</span>
        <span>{lang.label}</span>
        {i18n.language === lang.key && <span style={{ color: '#1890ff' }}>✓</span>}
      </Space>
    ),
    onClick: () => handleLanguageChange(lang.key)
  }));

  const currentLanguage = languages.find(lang => lang.key === i18n.language);

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement={placement}
      trigger={['click']}
    >
      <Button
        type={type}
        size={size}
        icon={<GlobalOutlined />}
        className="language-switcher"
      >
        <Space>
          <span>{currentLanguage?.flag}</span>
          <span>{currentLanguage?.label || 'Language'}</span>
        </Space>
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;