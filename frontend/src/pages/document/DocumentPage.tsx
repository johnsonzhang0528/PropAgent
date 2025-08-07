import React, { useState } from 'react';
import { Tabs, Card, Grid } from 'antd';
import { FileOutlined, UploadOutlined, BarChartOutlined } from '@ant-design/icons';
import FileUpload from '../../components/document/FileUpload';
import DocumentList from '../../components/document/DocumentList';

const { useBreakpoint } = Grid;

const DocumentPage: React.FC = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  
  const [activeTab, setActiveTab] = useState('list');
  const [refreshKey, setRefreshKey] = useState(0);

  // 處理上傳完成
  const handleUploadComplete = () => {
    // 刷新文檔列表
    setRefreshKey(prev => prev + 1);
    // 切換到列表頁籤
    setActiveTab('list');
  };

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <FileOutlined />
          {!isMobile && ' 文檔列表'}
        </span>
      ),
      children: (
        <DocumentList 
          key={refreshKey}
          showFilters={true}
          showStats={true}
        />
      )
    },
    {
      key: 'upload',
      label: (
        <span>
          <UploadOutlined />
          {!isMobile && ' 文件上傳'}
        </span>
      ),
      children: (
        <FileUpload 
          showAdvancedOptions={true}
          onUploadComplete={handleUploadComplete}
        />
      )
    }
  ];

  return (
    <div className="page-container" style={{ padding: isMobile ? '16px' : '24px' }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size={isMobile ? 'small' : 'large'}
          tabPosition={isMobile ? 'top' : 'top'}
        />
      </Card>
    </div>
  );
};

export default DocumentPage;