import React, { useState, useEffect, useMemo } from 'react';
import { Card, List, Tag, Button, Space, Typography, Row, Col, Input, Select, DatePicker, Modal, Form, message, Popconfirm } from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  HomeOutlined, 
  TrophyOutlined,
  SearchOutlined,
  CalendarOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useAppSelector } from '../../store/hooks';
import { taskService, TaskData } from '../../services/taskService';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'in_progress';
  category: string;
  dueDate?: string;
  assignedTo?: any;
  customerId?: any;
  propertyId?: any;
  tags?: string[];
  notes?: string;
  createdBy?: any;
  updatedBy?: any;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  daysRemaining?: number;
}

const TasksPage: React.FC = () => {
  const { user, token: reduxToken } = useAppSelector((state) => state.auth);
  
  // 使用useMemo動態獲取最新的token
  const token = useMemo(() => {
    const localToken = localStorage.getItem('access_token');
    console.log('🔍 動態更新token:', { reduxToken: !!reduxToken, localToken: !!localToken });
    return reduxToken || localToken;
  }, [reduxToken]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
    total: 0
  });

  // API 請求函數
  const fetchTasks = async () => {
    const currentToken = reduxToken || localStorage.getItem('access_token');
    if (!currentToken) {
      console.warn('⚠️ 無 token，跳過任務獲取');
      return;
    }

    try {
      setLoading(true);
      const result = await taskService.getTasks(currentToken, {
        search: searchText || undefined,
        status: filter === 'all' ? undefined : filter
      });
      
      setTasks(result.data.tasks || []);
      console.log('✅ 成功獲取任務列表，數量:', result.data.tasks?.length || 0);
    } catch (error) {
      console.error('❌ 獲取任務錯誤:', error);
      message.error(`獲取任務列表失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const currentToken = reduxToken || localStorage.getItem('access_token');
    if (!currentToken) {
      console.warn('⚠️ 無 token，跳過統計獲取');
      return;
    }

    try {
      const result = await taskService.getTaskStats(currentToken);
      setStats(result.data);
      console.log('✅ 成功獲取任務統計:', result.data);
    } catch (error) {
      console.error('❌ 獲取統計錯誤:', error);
      // 統計錯誤不顯示錯誤消息，只記錄日誌
    }
  };

  useEffect(() => {
    // 組件載入時檢查認證狀態
    console.log('📋 TasksPage載入時認證檢查:', {
      reduxToken: !!reduxToken,
      localStorageToken: !!localStorage.getItem('access_token'),
      finalToken: !!token,
      user: user?.email
    });
    
    fetchTasks();
    fetchStats();
  }, []);

  // 當認證狀態改變時重新獲取數據
  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchStats();
    }
  }, [token]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#fa8c16';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '普通';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#fa8c16';
      case 'completed': return '#52c41a';
      case 'in_progress': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'completed': return '已完成';
      case 'in_progress': return '進行中';
      default: return '未知';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchText.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // CRUD 操作函數
  const handleCreateTask = async (values: any) => {
    console.log('🚀 TasksPage.handleCreateTask 開始:', values);
    
    // 實時獲取最新的token
    const currentReduxToken = reduxToken;
    const currentLocalToken = localStorage.getItem('access_token');
    const currentToken = currentReduxToken || currentLocalToken;
    
    console.log('📋 認證狀態詳細信息:', { 
      reduxToken: currentReduxToken,
      localStorageToken: currentLocalToken,
      finalToken: currentToken,
      hasToken: !!currentToken, 
      tokenLength: currentToken?.length, 
      userEmail: user?.email,
      userId: user?.id,
      reduxHasToken: !!currentReduxToken,
      localStorageHasToken: !!currentLocalToken
    });
    
    if (!currentToken) {
      message.error('用戶未登錄，請重新登錄');
      return;
    }

    try {
      const taskData: TaskData = {
        title: values.title?.trim(),
        description: values.description?.trim(),
        priority: values.priority || 'medium',
        category: values.category,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        notes: values.notes?.trim()
      };
      
      console.log('📤 準備創建任務:', taskData);
      
      const result = await taskService.createTask(currentToken, taskData);
      
      console.log('✅ 任務創建成功:', result.data.task);
      message.success(`任務「${result.data.task.title}」創建成功！`);
      
      // 重新獲取數據
      await Promise.all([fetchTasks(), fetchStats()]);
      
      // 關閉模態框並重置表單
      setIsModalVisible(false);
      form.resetFields();
      
    } catch (error) {
      console.error('❌ TasksPage.handleCreateTask 錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '任務創建失敗';
      message.error(`創建失敗: ${errorMessage}`);
    }
  };

  const handleUpdateTask = async (values: any) => {
    const currentToken = reduxToken || localStorage.getItem('access_token');
    if (!editingTask || !currentToken) return;
    
    console.log('🔄 開始更新任務:', editingTask._id, values);
    
    try {
      const updateData: Partial<TaskData> = {
        title: values.title?.trim(),
        description: values.description?.trim(),
        priority: values.priority,
        category: values.category,
        status: values.status,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        notes: values.notes?.trim()
      };

      const result = await taskService.updateTask(currentToken, editingTask._id, updateData);
      
      console.log('✅ 任務更新成功:', result.data.task);
      message.success(`任務「${result.data.task.title}」更新成功！`);
      
      // 重新獲取數據
      await Promise.all([fetchTasks(), fetchStats()]);
      
      // 關閉模態框並重置狀態
      setIsModalVisible(false);
      setEditingTask(null);
      form.resetFields();
      
    } catch (error) {
      console.error('❌ 更新任務錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '任務更新失敗';
      message.error(`更新失敗: ${errorMessage}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const currentToken = reduxToken || localStorage.getItem('access_token');
    if (!currentToken) return;
    
    console.log('🗑️ 開始刪除任務:', taskId);
    
    try {
      await taskService.deleteTask(currentToken, taskId);
      
      console.log('✅ 任務刪除成功');
      message.success('任務刪除成功！');
      
      // 重新獲取數據
      await Promise.all([fetchTasks(), fetchStats()]);
      
    } catch (error) {
      console.error('❌ 刪除任務錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '任務刪除失敗';
      message.error(`刪除失敗: ${errorMessage}`);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    const currentToken = reduxToken || localStorage.getItem('access_token');
    if (!currentToken) return;
    
    console.log('📊 開始更新任務狀態:', taskId, newStatus);
    
    try {
      await taskService.updateTaskStatus(currentToken, taskId, newStatus);
      
      console.log('✅ 任務狀態更新成功');
      message.success(`任務狀態已更新為「${getStatusText(newStatus)}」！`);
      
      // 重新獲取數據
      await Promise.all([fetchTasks(), fetchStats()]);
      
    } catch (error) {
      console.error('❌ 更新狀態錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '任務狀態更新失敗';
      message.error(`狀態更新失敗: ${errorMessage}`);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      notes: task.notes
    });
    setIsModalVisible(true);
  };

  const getTaskIcon = (category: string) => {
    switch (category) {
      case '預約': return <UserOutlined style={{ color: '#1890ff' }} />;
      case '聯絡': return <PhoneOutlined style={{ color: '#fa8c16' }} />;
      case '維護': return <HomeOutlined style={{ color: '#52c41a' }} />;
      case '報告': return <TrophyOutlined style={{ color: '#722ed1' }} />;
      default: return <UserOutlined style={{ color: '#666' }} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '明天';
    if (days === -1) return '昨天';
    if (days > 0) return `${days}天後`;
    if (days < 0) return `${Math.abs(days)}天前`;
    
    return date.toLocaleDateString('zh-TW');
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* 頁面標題 */}
        <div>
          <Title level={2} style={{ marginBottom: '8px' }}>任務管理</Title>
          <Text style={{ color: '#666', fontSize: '16px' }}>
            管理您的所有待辦事項和已完成任務
          </Text>
        </div>

        {/* 統計卡片 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fa8c16', marginBottom: '8px' }}>
                {stats.pending}
              </div>
              <Text style={{ color: '#666' }}>待處理任務</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                {stats.in_progress}
              </div>
              <Text style={{ color: '#666' }}>進行中任務</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a', marginBottom: '8px' }}>
                {stats.completed}
              </div>
              <Text style={{ color: '#666' }}>已完成任務</Text>
            </Card>
          </Col>
        </Row>

        {/* 搜尋和篩選 */}
        <Card style={{ borderRadius: '12px' }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="搜尋任務..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '100%' }}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                value={filter}
                onChange={setFilter}
                style={{ width: '100%' }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">全部任務</Option>
                <Option value="pending">待處理</Option>
                <Option value="in_progress">進行中</Option>
                <Option value="completed">已完成</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                style={{ width: '100%' }}
              >
                新增任務
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 任務列表 */}
        <Card 
          title={`任務列表 (${filteredTasks.length})`}
          style={{ borderRadius: '12px' }}
        >
          <List
            loading={loading}
            itemLayout="horizontal"
            dataSource={filteredTasks}
            renderItem={task => {
              const icon = getTaskIcon(task.category);
              return (
                <List.Item 
                  style={{ 
                    borderBottom: '1px solid #f0f0f0', 
                    paddingBottom: '16px', 
                    marginBottom: '16px',
                    opacity: task.status === 'completed' ? 0.7 : 1
                  }}
                  actions={[
                    <Button 
                      type="text" 
                      icon={<CheckCircleOutlined />}
                      disabled={task.status === 'completed'}
                      onClick={() => handleStatusUpdate(task._id, 'completed')}
                    >
                      標記完成
                    </Button>,
                    <Button 
                      type="text" 
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(task)}
                    >
                      編輯
                    </Button>,
                    <Popconfirm
                      title="確定要刪除這個任務嗎？"
                      onConfirm={() => handleDeleteTask(task._id)}
                      okText="確定"
                      cancelText="取消"
                    >
                      <Button 
                        type="text" 
                        danger
                        icon={<DeleteOutlined />}
                      >
                        刪除
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: `${(icon as any).props?.style?.color || '#1890ff'}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {icon}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <Text 
                            strong 
                            style={{ 
                              fontSize: '16px',
                              textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                            }}
                          >
                            {task.title}
                          </Text>
                          {task.isOverdue && (
                            <Tag color="red" size="small" style={{ marginLeft: '8px' }}>逾期</Tag>
                          )}
                        </div>
                        <Space>
                          <Tag color={getStatusColor(task.status)} style={{ borderRadius: '6px' }}>
                            {getStatusText(task.status)}
                          </Tag>
                          <Tag color={getPriorityColor(task.priority)} style={{ borderRadius: '6px' }}>
                            {getPriorityText(task.priority)}
                          </Tag>
                        </Space>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: '8px' }}>
                        {task.description && (
                          <div style={{ marginBottom: '4px' }}>
                            <Text style={{ color: '#666', fontSize: '14px' }}>{task.description}</Text>
                          </div>
                        )}
                        <div>
                          {task.dueDate && (
                            <Text style={{ color: '#999', fontSize: '14px', marginRight: '16px' }}>
                              <CalendarOutlined style={{ marginRight: '4px' }} />
                              {formatDate(task.dueDate)}
                            </Text>
                          )}
                          <Tag style={{ borderRadius: '4px' }}>{task.category}</Tag>
                          {task.tags && task.tags.map(tag => (
                            <Tag key={tag} style={{ borderRadius: '4px', marginLeft: '4px' }}>{tag}</Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>

        {/* 新增/編輯任務 Modal */}
        <Modal
          title={editingTask ? '編輯任務' : '新增任務'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingTask(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={editingTask ? handleUpdateTask : handleCreateTask}
          >
            <Form.Item
              name="title"
              label="任務標題"
              rules={[{ required: true, message: '請輸入任務標題' }]}
            >
              <Input placeholder="請輸入任務標題" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="任務描述"
            >
              <Input.TextArea 
                rows={3} 
                placeholder="請輸入任務描述（可選）" 
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="priority"
                  label="優先級"
                  rules={[{ required: true, message: '請選擇優先級' }]}
                  initialValue="medium"
                >
                  <Select>
                    <Option value="high">高</Option>
                    <Option value="medium">中</Option>
                    <Option value="low">低</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="任務分類"
                  rules={[{ required: true, message: '請選擇任務分類' }]}
                >
                  <Select>
                    <Option value="預約">預約</Option>
                    <Option value="聯絡">聯絡</Option>
                    <Option value="維護">維護</Option>
                    <Option value="報告">報告</Option>
                    <Option value="跟進">跟進</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            {editingTask && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="任務狀態"
                  >
                    <Select>
                      <Option value="pending">待處理</Option>
                      <Option value="in_progress">進行中</Option>
                      <Option value="completed">已完成</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="dueDate"
                    label="截止日期"
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      placeholder="選擇截止日期（可選）"
                      showTime
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}
            
            {!editingTask && (
              <Form.Item
                name="dueDate"
                label="截止日期"
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="選擇截止日期（可選）"
                  showTime
                />
              </Form.Item>
            )}
            
            <Form.Item
              name="notes"
              label="備註"
            >
              <Input.TextArea 
                rows={2} 
                placeholder="任務備註（可選）" 
              />
            </Form.Item>
            
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button onClick={() => {
                  setIsModalVisible(false);
                  setEditingTask(null);
                  form.resetFields();
                }}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingTask ? '更新' : '創建'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

      </Space>
    </div>
  );
};

export default TasksPage;