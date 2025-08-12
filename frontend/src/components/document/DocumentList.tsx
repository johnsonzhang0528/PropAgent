import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Avatar,
  Tooltip,
  Modal,
  message,
  Dropdown,
  Typography,
  Row,
  Col,
  Statistic,
  Grid,
  List,
  Image,
  Descriptions,
  Badge
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FileOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { documentService, type DocumentInfo } from '../../services/documentService';
import DocumentEditor from './DocumentEditor';

const { Text, Title } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

interface DocumentListProps {
  category?: string;
  relatedType?: 'property' | 'customer';
  relatedId?: string;
  showFilters?: boolean;
  showStats?: boolean;
  onDocumentSelect?: (document: DocumentInfo) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  category,
  relatedType,
  relatedId,
  showFilters = true,
  showStats = true,
  onDocumentSelect
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: isMobile ? 10 : 20,
    total: 0
  });

  // 搜索和篩選狀態
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(category || '');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 模態框狀態
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    document: DocumentInfo | null;
  }>({ visible: false, document: null });

  const [editModal, setEditModal] = useState<{
    visible: boolean;
    document: DocumentInfo | null;
  }>({ visible: false, document: null });

  // 統計數據
  const [stats, setStats] = useState<{
    totalDocuments: number;
    totalStorage: string;
    categoriesStats: Array<{ _id: string; count: number; size: number }>;
  } | null>(null);

  // 載入文檔列表
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined,
        category: categoryFilter || undefined,
        tags: tagFilter || undefined,
        relatedType: relatedType || undefined,
        relatedId: relatedId || undefined,
        sortBy,
        sortOrder
      };

      const response = await documentService.getDocuments(params);
      setDocuments(response.documents);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total
      }));

    } catch (error) {
      console.error('載入文檔列表失敗:', error);
      message.error('載入文檔列表失敗');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, categoryFilter, tagFilter, relatedType, relatedId, sortBy, sortOrder]);

  // 載入統計數據
  const loadStats = useCallback(async () => {
    if (!showStats) return;

    try {
      const response = await documentService.getDocumentStats();
      setStats({
        totalDocuments: response.stats.totalDocuments,
        totalStorage: response.stats.totalStorageFormatted,
        categoriesStats: response.stats.categoriesStats
      });
    } catch (error) {
      console.error('載入統計數據失敗:', error);
    }
  }, [showStats]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // 處理搜索
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    // 觸發重新載入
    loadDocuments();
  }, [loadDocuments]);

  // 處理篩選
  const handleFilter = useCallback((type: 'category' | 'tag', value: string) => {
    if (type === 'category') {
      setCategoryFilter(value);
    } else {
      setTagFilter(value);
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  // 處理排序
  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, []);

  // 處理分頁
  const handleTableChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
  };

  // 下載文檔
  const handleDownload = async (document: DocumentInfo) => {
    try {
      await documentService.downloadDocument(document._id, document.originalName);
      message.success('文件下載開始');
    } catch (error) {
      console.error('下載失敗:', error);
      message.error('下載失敗');
    }
  };

  // 預覽文檔
  const handlePreview = (document: DocumentInfo) => {
    setPreviewModal({ visible: true, document });
  };

  // 編輯文檔
  const handleEdit = (document: DocumentInfo) => {
    setEditModal({ visible: true, document });
  };

  // 刪除文檔
  const handleDelete = (document: DocumentInfo) => {
    Modal.confirm({
      title: '確認刪除',
      content: `確定要刪除文檔 "${document.originalName}" 嗎？`,
      okText: '確認',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await documentService.deleteDocument(document._id);
          message.success('文檔刪除成功');
          loadDocuments();
        } catch (error) {
          console.error('刪除失敗:', error);
          message.error('刪除失敗');
        }
      }
    });
  };

  // 獲取分類顏色
  const getCategoryColor = (cat: string) => {
    const colors = {
      property: 'blue',
      customer: 'green',
      contract: 'orange',
      other: 'default'
    };
    return colors[cat as keyof typeof colors] || 'default';
  };

  // 獲取分類名稱
  const getCategoryName = (cat: string) => {
    const names = {
      property: '房產相關',
      customer: '客戶相關', 
      contract: '合約文件',
      other: '其他'
    };
    return names[cat as keyof typeof names] || cat;
  };

  // 桌面端表格列定義
  const columns: ColumnsType<DocumentInfo> = [
    {
      title: '文檔信息',
      key: 'document',
      width: 300,
      render: (_, record) => (
        <Space>
          <Avatar
            size="large"
            icon={<FileOutlined />}
            style={{ backgroundColor: '#f56a00' }}
          >
            {record.icon}
          </Avatar>
          <div>
            <Text strong>{record.originalName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.sizeFormatted} • {new Date(record.uploadedAt).toLocaleDateString('zh-TW')}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '分類',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => (
        <Tag color={getCategoryColor(category)}>
          {getCategoryName(category)}
        </Tag>
      )
    },
    {
      title: '標籤',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags) => (
        <Space wrap>
          {tags?.slice(0, 2).map((tag: string) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {tags && tags.length > 2 && (
            <Tag>+{tags.length - 2}</Tag>
          )}
        </Space>
      )
    },
    {
      title: '上傳者',
      dataIndex: 'uploadedBy',
      key: 'uploader',
      width: 120,
      render: (uploader) => (
        <Tooltip title={uploader.email}>
          <Text>{uploader.name}</Text>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="下載">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          
          {documentService.isImageFile(record.mimetype) && (
            <Tooltip title="預覽">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handlePreview(record)}
              />
            </Tooltip>
          )}

          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: '編輯',
                  icon: <EditOutlined />,
                  onClick: () => handleEdit(record)
                },
                {
                  key: 'delete',
                  label: '刪除',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDelete(record)
                }
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  // 移動端列表項渲染
  const renderMobileItem = (document: DocumentInfo) => (
    <List.Item
      key={document._id}
      actions={[
        <Button
          key="download"
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(document)}
        />,
        <Dropdown
          key="more"
          menu={{
            items: [
              {
                key: 'preview',
                label: '預覽',
                icon: <EyeOutlined />,
                disabled: !documentService.isImageFile(document.mimetype),
                onClick: () => handlePreview(document)
              },
              {
                key: 'edit',
                label: '編輯',
                icon: <EditOutlined />,
                onClick: () => handleEdit(document)
              },
              {
                key: 'delete',
                label: '刪除',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDelete(document)
              }
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" size="small" icon={<MoreOutlined />} />
        </Dropdown>
      ]}
      onClick={() => onDocumentSelect?.(document)}
    >
      <List.Item.Meta
        avatar={
          <Avatar size="large">
            {document.icon}
          </Avatar>
        }
        title={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{document.originalName}</Text>
            <Space wrap>
              <Tag color={getCategoryColor(document.category)}>
                {getCategoryName(document.category)}
              </Tag>
              {document.tags?.slice(0, 1).map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </Space>
        }
        description={
          <Space direction="vertical" size="small">
            <Text type="secondary">{document.sizeFormatted}</Text>
            <Text type="secondary">
              {document.uploadedBy.name} • {new Date(document.uploadedAt).toLocaleDateString('zh-TW')}
            </Text>
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: isMobile ? '0' : '24px' }}>
      {/* 統計卡片 */}
      {showStats && stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="總文檔數"
                value={stats.totalDocuments}
                prefix={<FileOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="存儲使用"
                value={stats.totalStorage}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card title="分類統計" size="small">
              <Space wrap>
                {stats.categoriesStats.map(stat => (
                  <Badge key={stat._id} count={stat.count} showZero>
                    <Tag color={getCategoryColor(stat._id)}>
                      {getCategoryName(stat._id)}
                    </Tag>
                  </Badge>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和篩選 */}
      {showFilters && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <Input
                placeholder="搜索文檔名稱或描述"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
                allowClear
                onClear={() => handleSearch('')}
              />
            </Col>
            <Col xs={12} sm={4}>
              <Select
                placeholder="分類篩選"
                style={{ width: '100%' }}
                value={categoryFilter}
                onChange={(value) => handleFilter('category', value)}
                allowClear
              >
                <Option value="property">房產相關</Option>
                <Option value="customer">客戶相關</Option>
                <Option value="contract">合約文件</Option>
                <Option value="other">其他</Option>
              </Select>
            </Col>
            <Col xs={12} sm={4}>
              <Select
                placeholder="排序方式"
                style={{ width: '100%' }}
                value={`${sortBy}-${sortOrder}`}
                onChange={(value) => {
                  const [field, order] = value.split('-');
                  handleSort(field, order as 'asc' | 'desc');
                }}
              >
                <Option value="uploadedAt-desc">最新上傳</Option>
                <Option value="uploadedAt-asc">最早上傳</Option>
                <Option value="originalName-asc">名稱 A-Z</Option>
                <Option value="originalName-desc">名稱 Z-A</Option>
                <Option value="size-desc">文件大小（大到小）</Option>
                <Option value="size-asc">文件大小（小到大）</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadDocuments}
                  loading={loading}
                >
                  刷新
                </Button>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setCategoryFilter('');
                    setTagFilter('');
                    setSortBy('uploadedAt');
                    setSortOrder('desc');
                  }}
                >
                  清除篩選
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* 文檔列表 */}
      <Card title={`文檔列表 (${pagination.total})`}>
        {isMobile ? (
          <List
            loading={loading}
            dataSource={documents}
            renderItem={renderMobileItem}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: false,
              showQuickJumper: false,
              simple: true,
              onChange: handleTableChange
            }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={documents}
            rowKey="_id"
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 項，共 ${total} 項`,
              onChange: handleTableChange,
              onShowSizeChange: handleTableChange
            }}
            onRow={(record) => ({
              onClick: () => onDocumentSelect?.(record)
            })}
          />
        )}
      </Card>

      {/* 預覽模態框 */}
      <Modal
        title="文檔預覽"
        open={previewModal.visible}
        onCancel={() => setPreviewModal({ visible: false, document: null })}
        footer={[
          <Button key="download" onClick={() => previewModal.document && handleDownload(previewModal.document)}>
            下載
          </Button>,
          <Button key="close" onClick={() => setPreviewModal({ visible: false, document: null })}>
            關閉
          </Button>
        ]}
        width={800}
      >
        {previewModal.document && (
          <div style={{ textAlign: 'center' }}>
            {documentService.isImageFile(previewModal.document.mimetype) ? (
              <Image
                src={documentService.getPreviewUrl(previewModal.document._id)}
                alt={previewModal.document.originalName}
                style={{ maxWidth: '100%', maxHeight: '600px' }}
              />
            ) : (
              <div style={{ padding: '40px' }}>
                <FileOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
                <div style={{ marginTop: '16px' }}>
                  <Text>此文件類型不支持預覽</Text>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 編輯模態框 */}
      <DocumentEditor
        document={editModal.document}
        visible={editModal.visible}
        onClose={() => setEditModal({ visible: false, document: null })}
        onUpdate={(updatedDocument) => {
          // 更新本地文檔列表
          setDocuments(prev => prev.map(doc => 
            doc._id === updatedDocument._id ? updatedDocument : doc
          ));
          setEditModal({ visible: false, document: null });
        }}
      />
    </div>
  );
};

export default DocumentList;