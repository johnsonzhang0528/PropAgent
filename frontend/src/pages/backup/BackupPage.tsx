import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Space,
  Typography,
  message,
  Modal,
  Select,
  Form,
  Row,
  Col,
  Statistic,
  Tag,
  Progress,
  Tooltip,
  Popconfirm,
  Alert,
  Divider
} from 'antd';
import {
  CloudDownloadOutlined,
  DatabaseOutlined,
  FolderOutlined,
  FileTextOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SettingOutlined,
  ExportOutlined,
  ImportOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { backupService, type BackupItem, type BackupConfig } from '../../services/backupService';
import { useMobile } from '../../hooks/useMobile';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const BackupPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [form] = Form.useForm();
  const { isMobile } = useMobile();

  // 載入數據
  useEffect(() => {
    loadBackups();
    loadConfig();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const data = await backupService.getBackupList();
      setBackups(data);
    } catch (error) {
      message.error('載入備份列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const configData = await backupService.getBackupConfig();
      setConfig(configData);
    } catch (error) {
      console.error('載入配置失敗:', error);
    }
  };

  // 創建備份
  const handleCreateBackup = async (values: { type: string }) => {
    setCreating(true);
    try {
      await backupService.createBackup(values.type as any);
      message.success('備份創建成功');
      setShowCreateModal(false);
      form.resetFields();
      loadBackups();
    } catch (error) {
      message.error('備份創建失敗');
    } finally {
      setCreating(false);
    }
  };

  // 導出數據
  const handleExportData = async (values: { format: string; collection?: string }) => {
    setExporting(true);
    try {
      const path = await backupService.exportData(values.format as any, values.collection);
      message.success(`數據導出成功: ${path}`);
      setShowExportModal(false);
      form.resetFields();
      loadBackups();
    } catch (error) {
      message.error('數據導出失敗');
    } finally {
      setExporting(false);
    }
  };

  // 下載備份
  const handleDownload = async (filename: string) => {
    try {
      await backupService.downloadBackup(filename);
      message.success('下載開始');
    } catch (error) {
      message.error('下載失敗');
    }
  };

  // 刪除備份
  const handleDelete = async (filename: string) => {
    try {
      await backupService.deleteBackup(filename);
      message.success('備份已刪除');
      loadBackups();
    } catch (error) {
      message.error('刪除失敗');
    }
  };

  // 恢復數據庫
  const handleRestore = async (values: { backupPath: string }) => {
    setRestoring(true);
    try {
      await backupService.restoreDatabase(values.backupPath);
      message.success('數據庫恢復成功');
      setShowRestoreModal(false);
      form.resetFields();
    } catch (error) {
      message.error('數據庫恢復失敗');
    } finally {
      setRestoring(false);
    }
  };

  // 清理過期備份
  const handleCleanup = async () => {
    try {
      await backupService.cleanupOldBackups();
      message.success('過期備份已清理');
      loadBackups();
    } catch (error) {
      message.error('清理失敗');
    }
  };

  // 計算統計數據
  const stats = backupService.calculateBackupStats(backups);

  // 表格列配置
  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: BackupItem) => (
        <Space>
          <span>{backupService.getBackupTypeIcon(record.type)}</span>
          <Text>{name}</Text>
        </Space>
      )
    },
    {
      title: '類型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>
          {backupService.formatBackupType(type)}
        </Tag>
      )
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => backupService.formatFileSize(size)
    },
    {
      title: '創建時間',
      dataIndex: 'created',
      key: 'created',
      render: (created: Date) => new Date(created).toLocaleString('zh-TW')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: BackupItem) => (
        <Space size="small">
          <Tooltip title="下載">
            <Button 
              type="text" 
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record.name)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="確定要刪除這個備份嗎？"
            onConfirm={() => handleDelete(record.name)}
            okText="確定"
            cancelText="取消"
          >
            <Tooltip title="刪除">
              <Button 
                type="text" 
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const getTypeColor = (type: string) => {
    const colorMap = {
      database: 'blue',
      files: 'green',
      full: 'purple',
      json: 'orange',
      csv: 'cyan',
      unknown: 'default'
    };
    return colorMap[type as keyof typeof colorMap] || 'default';
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: isMobile ? '16px' : '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 頁面標題 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              備份與數據導出
            </Title>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadBackups}
              loading={loading}
            >
              刷新
            </Button>
          </div>

          {/* 統計卡片 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="總備份數量"
                  value={stats.totalCount}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="總大小"
                  value={backupService.formatFileSize(stats.totalSize)}
                  prefix={<FolderOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="最新備份"
                  value={stats.newestBackup ? 
                    stats.newestBackup.toLocaleDateString('zh-TW') : 
                    '無'}
                  prefix={<CloudDownloadOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="保留天數"
                  value={config?.retention || 30}
                  suffix="天"
                  prefix={<SettingOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 操作按鈕 */}
          <Card>
            <Space wrap>
              <Button 
                type="primary" 
                icon={<DatabaseOutlined />}
                onClick={() => setShowCreateModal(true)}
                loading={creating}
              >
                創建備份
              </Button>
              <Button 
                icon={<ExportOutlined />}
                onClick={() => setShowExportModal(true)}
                loading={exporting}
              >
                導出數據
              </Button>
              <Button 
                icon={<ImportOutlined />}
                onClick={() => setShowRestoreModal(true)}
                loading={restoring}
              >
                恢復數據庫
              </Button>
              <Popconfirm
                title="確定要清理過期備份嗎？"
                onConfirm={handleCleanup}
                okText="確定"
                cancelText="取消"
              >
                <Button 
                  icon={<ClearOutlined />}
                  danger
                >
                  清理過期備份
                </Button>
              </Popconfirm>
            </Space>
          </Card>

          {/* 配置信息 */}
          {config && (
            <Alert
              message="備份配置"
              description={
                <Space direction="vertical" size="small">
                  <Text>備份路徑: {config.backupPath}</Text>
                  <Text>保留天數: {config.retention} 天</Text>
                  <Text>壓縮: {config.compression ? '啟用' : '停用'}</Text>
                  <Text>包含文件: {config.includeFiles ? '是' : '否'}</Text>
                </Space>
              }
              type="info"
              showIcon
            />
          )}

          {/* 備份列表 */}
          <Card title="備份文件列表">
            <Table
              columns={columns}
              dataSource={backups}
              rowKey="name"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 項，共 ${total} 項`
              }}
              scroll={{ x: isMobile ? 800 : undefined }}
            />
          </Card>
        </Space>

        {/* 創建備份對話框 */}
        <Modal
          title="創建備份"
          open={showCreateModal}
          onCancel={() => setShowCreateModal(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateBackup}
          >
            <Form.Item
              name="type"
              label="備份類型"
              rules={[{ required: true, message: '請選擇備份類型' }]}
            >
              <Select placeholder="選擇備份類型">
                <Option value="full">完整備份（數據庫 + 文件）</Option>
                <Option value="database">僅數據庫備份</Option>
                <Option value="files">僅文件備份</Option>
              </Select>
            </Form.Item>
            
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowCreateModal(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={creating}
              >
                創建備份
              </Button>
            </Space>
          </Form>
        </Modal>

        {/* 導出數據對話框 */}
        <Modal
          title="導出數據"
          open={showExportModal}
          onCancel={() => setShowExportModal(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleExportData}
          >
            <Form.Item
              name="format"
              label="導出格式"
              rules={[{ required: true, message: '請選擇導出格式' }]}
            >
              <Select placeholder="選擇導出格式">
                <Option value="json">JSON 格式</Option>
                <Option value="csv">CSV 格式</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="collection"
              label="集合名稱"
              extra="CSV 格式需要指定集合名稱"
            >
              <Select placeholder="選擇集合（CSV 格式必填）" allowClear>
                <Option value="customers">客戶資料</Option>
                <Option value="properties">房產資料</Option>
                <Option value="users">用戶資料</Option>
                <Option value="documents">文檔資料</Option>
              </Select>
            </Form.Item>
            
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowExportModal(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={exporting}
              >
                導出數據
              </Button>
            </Space>
          </Form>
        </Modal>

        {/* 恢復數據庫對話框 */}
        <Modal
          title="恢復數據庫"
          open={showRestoreModal}
          onCancel={() => setShowRestoreModal(false)}
          footer={null}
        >
          <Alert
            message="警告"
            description="恢復數據庫將覆蓋現有數據，請確保您已經備份了當前數據。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRestore}
          >
            <Form.Item
              name="backupPath"
              label="備份路徑"
              rules={[{ required: true, message: '請輸入備份路徑' }]}
            >
              <Select placeholder="選擇要恢復的備份">
                {backups
                  .filter(backup => backup.type === 'database' || backup.type === 'full')
                  .map(backup => (
                    <Option key={backup.path} value={backup.path}>
                      {backup.name} ({new Date(backup.created).toLocaleString('zh-TW')})
                    </Option>
                  ))
                }
              </Select>
            </Form.Item>
            
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowRestoreModal(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={restoring}
                danger
              >
                恢復數據庫
              </Button>
            </Space>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default BackupPage;