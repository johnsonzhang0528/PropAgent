import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Input, 
  InputNumber,
  Select, 
  Tag, 
  Space, 
  Tooltip,
  Rate,
  Avatar,
  Modal,
  Form,
  message,
  Pagination,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  StarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import CustomerForm from './CustomerForm';

const { Search } = Input;
const { Option } = Select;

interface Customer {
  _id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  line_id?: string;
  wechat_id?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  occupation?: string;
  annual_income?: number;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  family_members?: number;
  source?: string;
  referral_source?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'completed' | 'lost';
  tags: string[];
  purchase_intent_score: number;
  last_contact_at?: string;
  created_at: string;
  agent_id: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface CustomerListResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  // 篩選狀態
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    minScore: 0
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // 查看客戶詳情模態框狀態
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  
  // 意願評分模態框狀態
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [scoringCustomer, setScoringCustomer] = useState<Customer | null>(null);
  const [scoreForm] = Form.useForm();

  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  // 載入客戶列表
  const loadCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status })
      });

      const response = await fetch(`/api/customers?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data: { success: boolean; data: CustomerListResponse } = await response.json();
        if (data.success) {
          setCustomers(data.data.customers);
          setPagination(prev => ({
            ...prev,
            current: data.data.pagination.page,
            total: data.data.pagination.total
          }));
        }
      } else {
        message.error('載入客戶列表失敗');
      }
    } catch (error) {
      console.error('載入客戶列表錯誤:', error);
      message.error('網路錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 元件載入時載入資料
  useEffect(() => {
    loadCustomers(1); // 搜尋時重置到第一頁
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [filters.status]); // 只監聽狀態篩選變化

  // 首次載入
  useEffect(() => {
    loadCustomers();
  }, []);

  // 狀態標籤顏色
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      inactive: 'default',
      completed: 'blue',
      lost: 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  // 狀態標籤文字
  const getStatusText = (status: string) => {
    const texts = {
      active: '活躍',
      inactive: '非活躍',
      completed: '已成交',
      lost: '已流失'
    };
    return texts[status as keyof typeof texts] || status;
  };

  // 表格欄位定義
  const columns = [
    {
      title: '客戶',
      key: 'customer',
      render: (record: Customer) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{`${record.first_name} ${record.last_name}`}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <PhoneOutlined /> {record.phone}
            </div>
            {record.email && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                <MailOutlined /> {record.email}
              </div>
            )}
          </div>
        </Space>
      ),
      width: 200,
    },
    {
      title: '意願評分',
      dataIndex: 'purchase_intent_score',
      key: 'score',
      render: (score: number, record: Customer) => (
        <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleScoreClick(record)}>
          <Rate disabled value={score / 2} style={{ fontSize: '16px' }} />
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#1890ff' }}>
            {score.toFixed(1)}分 <StarOutlined />
          </div>
        </div>
      ),
      width: 120,
      sorter: true,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      width: 100,
    },
    {
      title: '標籤',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => {
        if (!tags || tags.length === 0) {
          return <span style={{ color: '#999', fontSize: '12px' }}>-</span>;
        }
        return (
          <Space wrap size={6}>
            {tags.slice(0, 3).map((tag, index) => (
              <Tag 
                key={index} 
                color="processing" 
                style={{ 
                  fontSize: '12px',
                  fontWeight: '500',
                  margin: '1px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {tag}
              </Tag>
            ))}
            {tags.length > 3 && (
              <Tooltip title={tags.slice(3).join(', ')}>
                <Tag 
                  color="default" 
                  style={{ 
                    fontSize: '12px',
                    fontWeight: '500',
                    margin: '1px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: '#f0f0f0',
                    color: '#666',
                    border: '1px solid #d9d9d9'
                  }}
                >
                  +{tags.length - 3}
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
      width: 150,
    },
    {
      title: '最後聯繫',
      dataIndex: 'last_contact_at',
      key: 'last_contact',
      render: (date: string) => {
        if (!date) return '-';
        const contactDate = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let color = 'default';
        let text = '';
        
        if (diffDays === 0) {
          color = 'green';
          text = '今天';
        } else if (diffDays === 1) {
          color = 'blue';
          text = '昨天';
        } else if (diffDays <= 7) {
          color = 'orange';
          text = `${diffDays}天前`;
        } else {
          color = 'red';
          text = `${diffDays}天前`;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
      width: 120,
      sorter: true,
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: Customer) => (
        <Space size={8} wrap>
          <Button 
            type="primary"
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
            style={{ 
              backgroundColor: '#1890ff',
              borderColor: '#1890ff'
            }}
          >
            查看
          </Button>
          <Button 
            type="primary"
            size="small"
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            style={{ 
              backgroundColor: '#52c41a',
              borderColor: '#52c41a'
            }}
          >
            編輯
          </Button>
          <Button 
            size="small"
            icon={<PhoneOutlined />} 
            onClick={() => handleContact(record)}
            style={{ 
              backgroundColor: '#faad14',
              borderColor: '#faad14',
              color: '#ffffff'
            }}
          >
            聯繫
          </Button>
          <Button 
            danger
            size="small"
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
          >
            刪除
          </Button>
        </Space>
      ),
      width: 200,
    },
  ];

  // 查看客戶詳情
  const handleView = (customer: Customer) => {
    setViewingCustomer(customer);
    setViewModalVisible(true);
  };

  // 編輯客戶
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalVisible(true);
  };

  // 點擊評分
  const handleScoreClick = (customer: Customer) => {
    setScoringCustomer(customer);
    scoreForm.setFieldsValue({
      score: customer.purchase_intent_score,
      reason: ''
    });
    setScoreModalVisible(true);
  };

  // 更新意願評分
  const handleScoreUpdate = async (values: { score: number; reason?: string }) => {
    if (!scoringCustomer) return;

    try {
      const response = await fetch(`/api/customers/${scoringCustomer._id}/intent-score`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success('意願評分更新成功');
        setScoreModalVisible(false);
        setScoringCustomer(null);
        scoreForm.resetFields();
        loadCustomers(pagination.current); // 重新載入數據
      } else {
        const errorData = await response.json();
        message.error(errorData.error?.message || '更新評分失敗');
      }
    } catch (error) {
      console.error('更新評分錯誤:', error);
      message.error('網路錯誤，請稍後再試');
    }
  };

  // 聯繫客戶
  const handleContact = async (customer: Customer) => {
    console.log('點擊聯繫按鈕:', customer);
    Modal.confirm({
      title: '聯繫客戶',
      content: (
        <div>
          <p>選擇聯繫方式：</p>
          <p><strong>客戶：</strong>{customer.first_name} {customer.last_name}</p>
          <p><strong>電話：</strong>{customer.phone}</p>
          {customer.email && <p><strong>郵箱：</strong>{customer.email}</p>}
        </div>
      ),
      okText: '已聯繫',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/customers/${customer._id}/contact`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contact_type: 'phone',
              notes: '電話聯繫'
            })
          });

          if (response.ok) {
            message.success(`已記錄對 ${customer.first_name} ${customer.last_name} 的聯繫`);
            loadCustomers(pagination.current);
          } else {
            message.warning('聯繫記錄更新失敗，但您可以繼續聯繫客戶');
          }
        } catch (error) {
          console.error('聯繫記錄錯誤:', error);
          message.warning('聯繫記錄更新失敗，但您可以繼續聯繫客戶');
        }
      },
      onCancel: () => {
        // 提供直接撥打電話的選項
        if (customer.phone) {
          window.open(`tel:${customer.phone}`);
        }
      }
    });
  };

  // 刪除客戶
  const handleDelete = (customer: Customer) => {
    console.log('點擊刪除按鈕:', customer);
    Modal.confirm({
      title: '確認刪除',
      content: `確定要刪除客戶 ${customer.first_name} ${customer.last_name} 嗎？`,
      okText: '確認',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await fetch(`/api/customers/${customer._id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            message.success('客戶已刪除');
            loadCustomers(pagination.current);
          } else {
            message.error('刪除失敗');
          }
        } catch (error) {
          message.error('網路錯誤');
        }
      }
    });
  };

  // 處理分頁變更
  const handlePageChange = (page: number, pageSize?: number) => {
    const newPagination = {
      current: page,
      pageSize: pageSize || pagination.pageSize,
      total: pagination.total
    };
    setPagination(newPagination);
    
    // 如果 pageSize 變更，重置到第一頁
    if (pageSize && pageSize !== pagination.pageSize) {
      newPagination.current = 1;
      setPagination(newPagination);
      loadCustomers(1);
    } else {
      loadCustomers(page);
    }
  };

  // 處理表單提交
  const handleFormSubmit = (customer: Customer) => {
    setIsModalVisible(false);
    setEditingCustomer(null);
    loadCustomers(pagination.current); // 重新載入當前頁
  };

  // 處理搜尋
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    loadCustomers(1);
  };

  return (
    <div className="page-container" style={{ 
      padding: '24px',
      maxWidth: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <Card style={{
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <div className="header-row" style={{ 
          marginBottom: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ 
            margin: 0,
            flex: '1 1 auto',
            minWidth: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>客戶管理</h2>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCustomer(null);
              setIsModalVisible(true);
            }}
            style={{
              flex: '0 0 auto',
              whiteSpace: 'nowrap'
            }}
          >
            新增客戶
          </Button>
        </div>

        {/* 搜尋和篩選區域 - 修復響應式佈局 */}
        <div className="search-filters-container" style={{ marginBottom: '16px' }}>
          <div className="search-row" style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'stretch',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <div className="search-input-container" style={{ 
              flex: '1 1 300px',
              minWidth: '250px',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <Search
                placeholder="搜尋客戶姓名、電話或郵箱"
                style={{ 
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onSearch={handleSearch}
                allowClear
              />
            </div>
            <div className="filter-container" style={{ 
              flex: '0 0 auto',
              minWidth: '120px',
              width: '120px',
              boxSizing: 'border-box'
            }}>
              <Select
                style={{ 
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <Option value="all">全部狀態</Option>
                <Option value="active">活躍</Option>
                <Option value="inactive">非活躍</Option>
                <Option value="completed">已成交</Option>
                <Option value="lost">已流失</Option>
              </Select>
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <Button 
                icon={<FilterOutlined />}
                style={{
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box'
                }}
              >
                進階篩選
              </Button>
            </div>
          </div>
        </div>

        {/* 客戶列表表格 - 修復響應式溢出 */}
        <div className="table-container" style={{ 
          maxWidth: '100%',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <div style={{ 
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <Table
              columns={columns}
              dataSource={customers}
              rowKey="_id"
              loading={loading}
              pagination={false}
              scroll={{ x: 'max-content' }}
              style={{
                minWidth: '100%'
              }}
              size="small"
            />
          </div>
        </div>

        {/* 分頁控制 - 修復響應式佈局 */}
        <div style={{ 
          marginTop: '16px', 
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) => 
              `顯示 ${range[0]}-${range[1]} 項，共 ${total} 項`
            }
            onChange={handlePageChange}
            style={{
              maxWidth: '100%',
              overflow: 'hidden'
            }}
            responsive
          />
        </div>
      </Card>

      {/* 查看客戶詳情模態框 */}
      <Modal
        title="客戶詳細資料"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setViewingCustomer(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalVisible(false);
            setViewingCustomer(null);
          }}>
            關閉
          </Button>
        ]}
        width={800}
      >
        {viewingCustomer && (
          <div style={{ padding: '16px 0' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="基本資訊" size="small" style={{ marginBottom: 16, height: '100%' }}>
                  <p><strong>姓名:</strong> {viewingCustomer.first_name} {viewingCustomer.last_name}</p>
                  <p><strong>手機號碼:</strong> {viewingCustomer.phone}</p>
                  {viewingCustomer.email && <p><strong>電子郵箱:</strong> {viewingCustomer.email}</p>}
                  {viewingCustomer.line_id && <p><strong>Line ID:</strong> {viewingCustomer.line_id}</p>}
                  {viewingCustomer.wechat_id && <p><strong>WeChat ID:</strong> {viewingCustomer.wechat_id}</p>}
                  <p><strong>狀態:</strong> <Tag color={getStatusColor(viewingCustomer.status)}>{getStatusText(viewingCustomer.status)}</Tag></p>
                  <p><strong>意願評分:</strong> {viewingCustomer.purchase_intent_score}分</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="個人資訊" size="small" style={{ marginBottom: 16, height: '100%' }}>
                  {viewingCustomer.gender && (
                    <p><strong>性別:</strong> {
                      viewingCustomer.gender === 'male' ? '男性' : 
                      viewingCustomer.gender === 'female' ? '女性' : '其他'
                    }</p>
                  )}
                  {viewingCustomer.age && <p><strong>年齡:</strong> {viewingCustomer.age}歲</p>}
                  {viewingCustomer.occupation && <p><strong>職業:</strong> {viewingCustomer.occupation}</p>}
                  {viewingCustomer.annual_income && (
                    <p><strong>年收入:</strong> {viewingCustomer.annual_income.toLocaleString()}元</p>
                  )}
                  {viewingCustomer.marital_status && (
                    <p><strong>婚姻狀態:</strong> {
                      viewingCustomer.marital_status === 'single' ? '單身' :
                      viewingCustomer.marital_status === 'married' ? '已婚' :
                      viewingCustomer.marital_status === 'divorced' ? '離婚' : '喪偶'
                    }</p>
                  )}
                  {viewingCustomer.family_members && <p><strong>家庭成員:</strong> {viewingCustomer.family_members}人</p>}
                </Card>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Card title="來源資訊" size="small" style={{ marginBottom: 16 }}>
                  {viewingCustomer.source && <p><strong>客戶來源:</strong> {viewingCustomer.source}</p>}
                  {viewingCustomer.referral_source && <p><strong>推薦來源:</strong> {viewingCustomer.referral_source}</p>}
                  <p><strong>創建時間:</strong> {new Date(viewingCustomer.created_at).toLocaleString('zh-TW')}</p>
                  {viewingCustomer.last_contact_at && (
                    <p><strong>最後聯繫時間:</strong> {new Date(viewingCustomer.last_contact_at).toLocaleString('zh-TW')}</p>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="負責業務員" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>姓名:</strong> {viewingCustomer.agent_id.first_name} {viewingCustomer.agent_id.last_name}</p>
                  <p><strong>郵箱:</strong> {viewingCustomer.agent_id.email}</p>
                </Card>
              </Col>
            </Row>
            
            <Card title="標籤與備註" size="small">
              {viewingCustomer.tags && viewingCustomer.tags.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <strong>標籤: </strong>
                  <Space wrap>
                    {viewingCustomer.tags.map((tag, index) => 
                      <Tag key={index} color="processing" style={{ marginRight: 8, marginBottom: 4 }}>{tag}</Tag>
                    )}
                  </Space>
                </div>
              ) : (
                <p><strong>標籤:</strong> <span style={{ color: '#999' }}>無</span></p>
              )}
              {viewingCustomer.notes ? (
                <div>
                  <strong>備註:</strong>
                  <div style={{ 
                    marginTop: 8, 
                    padding: '12px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '6px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {viewingCustomer.notes}
                  </div>
                </div>
              ) : (
                <p><strong>備註:</strong> <span style={{ color: '#999' }}>無</span></p>
              )}
            </Card>
          </div>
        )}
      </Modal>

      {/* 編輯客戶模態框 */}
      <Modal
        title={editingCustomer ? '編輯客戶' : '新增客戶'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingCustomer(null);
        }}
        footer={null}
        width={600}
      >
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingCustomer(null);
          }}
          loading={loading}
        />
      </Modal>

      {/* 意願評分更新模態框 */}
      <Modal
        title="更新客戶意願評分"
        open={scoreModalVisible}
        onCancel={() => {
          setScoreModalVisible(false);
          setScoringCustomer(null);
          scoreForm.resetFields();
        }}
        onOk={() => scoreForm.submit()}
        okText="更新評分"
        cancelText="取消"
      >
        {scoringCustomer && (
          <div style={{ marginBottom: '16px' }}>
            <p><strong>客戶:</strong> {scoringCustomer.first_name} {scoringCustomer.last_name}</p>
            <p><strong>目前評分:</strong> {scoringCustomer.purchase_intent_score}分</p>
          </div>
        )}
        <Form
          form={scoreForm}
          layout="vertical"
          onFinish={handleScoreUpdate}
        >
          <Form.Item
            label="意願評分 (0-10分)"
            name="score"
            rules={[
              { required: true, message: '請輸入評分' },
              { type: 'number', min: 0, max: 10, message: '評分必須在0-10之間' }
            ]}
          >
            <InputNumber 
              min={0} 
              max={10} 
              step={0.1}
              style={{ width: '100%' }}
              placeholder="請輸入0-10之間的評分"
            />
          </Form.Item>
          <Form.Item
            label="評分原因 (選填)"
            name="reason"
          >
            <Input.TextArea 
              rows={3}
              placeholder="請簡述調整評分的原因..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerList;