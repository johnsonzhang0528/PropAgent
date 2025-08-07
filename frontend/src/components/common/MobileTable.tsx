import React, { useState } from 'react';
import { Table, Card, List, Button, Space, Typography, Tag, Avatar, Drawer } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { useMobile } from '../../hooks/useMobile';
import type { TableProps } from 'antd';

const { Text, Title } = Typography;

interface MobileTableProps extends Omit<TableProps<any>, 'title'> {
  title?: string;
  renderMobileItem?: (record: any) => React.ReactNode;
  onView?: (record: any) => void;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  showActions?: boolean;
}

const MobileTable: React.FC<MobileTableProps> = ({
  title,
  dataSource = [],
  columns = [],
  renderMobileItem,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  loading = false,
  pagination,
  ...tableProps
}) => {
  const { isMobile, isSmallMobile } = useMobile();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);

  // 非移動端使用標準 Table
  if (!isMobile) {
    return <Table {...tableProps} dataSource={dataSource} columns={columns} pagination={pagination} loading={loading} />;
  }

  // 默認移動端項目渲染器
  const defaultMobileItemRenderer = (record: any) => {
    const firstCol = columns[0] as any;
    const secondCol = columns[1] as any;
    const thirdCol = columns[2] as any;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: '14px' }}>
              {firstCol?.render ? firstCol.render(record[firstCol.dataIndex], record) : record[firstCol?.dataIndex]}
            </Text>
          </div>
          {showActions && (
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              onClick={() => {
                setSelectedRecord(record);
                setDetailDrawerVisible(true);
              }}
            />
          )}
        </div>
        
        {secondCol && (
          <div style={{ marginBottom: '4px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {secondCol.render ? secondCol.render(record[secondCol.dataIndex], record) : record[secondCol?.dataIndex]}
            </Text>
          </div>
        )}
        
        {thirdCol && (
          <div>
            <Text style={{ fontSize: '12px' }}>
              {thirdCol.render ? thirdCol.render(record[thirdCol.dataIndex], record) : record[thirdCol?.dataIndex]}
            </Text>
          </div>
        )}
      </div>
    );
  };

  // 行操作按鈕
  const renderActions = (record: any) => (
    <Space direction="vertical" style={{ width: '100%' }}>
      {onView && (
        <Button 
          type="default" 
          icon={<EyeOutlined />} 
          onClick={() => onView(record)}
          style={{ width: '100%' }}
        >
          查看詳情
        </Button>
      )}
      {onEdit && (
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={() => onEdit(record)}
          style={{ width: '100%' }}
        >
          編輯
        </Button>
      )}
      {onDelete && (
        <Button 
          type="primary" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={() => onDelete(record)}
          style={{ width: '100%' }}
        >
          刪除
        </Button>
      )}
    </Space>
  );

  return (
    <>
      <Card 
        title={title}
        bodyStyle={{ padding: 0 }}
        style={{ marginBottom: '16px' }}
      >
        <List
          dataSource={[...dataSource]}
          loading={loading}
          pagination={pagination ? {
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showQuickJumper: false,
            simple: isSmallMobile
          } : false}
          renderItem={(record, index) => (
            <List.Item
              style={{
                padding: isSmallMobile ? '12px 16px' : '16px 20px',
                borderBottom: index === dataSource.length - 1 ? 'none' : '1px solid #f0f0f0'
              }}
            >
              {renderMobileItem ? renderMobileItem(record) : defaultMobileItemRenderer(record)}
            </List.Item>
          )}
        />
      </Card>

      {/* 詳情抽屜 */}
      <Drawer
        title="詳細信息"
        placement="bottom"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        height="60%"
      >
        {selectedRecord && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 詳細信息 */}
            <div>
              <Title level={5}>詳細信息</Title>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {columns.map((col: any) => (
                  <div 
                    key={col.dataIndex} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <Text type="secondary" style={{ minWidth: '80px' }}>
                      {col.title}:
                    </Text>
                    <Text style={{ textAlign: 'right', flex: 1, marginLeft: '16px' }}>
                      {col.render ? 
                        col.render(selectedRecord[col.dataIndex], selectedRecord) : 
                        selectedRecord[col.dataIndex]
                      }
                    </Text>
                  </div>
                ))}
              </Space>
            </div>

            {/* 操作按鈕 */}
            {showActions && (
              <div>
                <Title level={5}>操作</Title>
                {renderActions(selectedRecord)}
              </div>
            )}
          </Space>
        )}
      </Drawer>
    </>
  );
};

export default MobileTable;