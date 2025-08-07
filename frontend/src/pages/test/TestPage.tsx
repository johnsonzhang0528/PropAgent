import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import I18nTest from '../../components/test/I18nTest';

const { Title, Paragraph } = Typography;

const TestPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 20 }}>
        <Title level={2}>🎉 PropAgent Pro 測試頁面</Title>
        <Paragraph>
          如果您看到這個頁面，說明前端已經正常啟動！
        </Paragraph>
        <Space>
          <Button type="primary">主要按鈕</Button>
          <Button>次要按鈕</Button>
        </Space>
      </Card>
      
      <I18nTest />
    </div>
  );
};

export default TestPage;