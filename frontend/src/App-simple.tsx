import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import TestPage from './pages/test/TestPage';
import './styles/global.css';

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <div className="App">
        <TestPage />
      </div>
    </ConfigProvider>
  );
}