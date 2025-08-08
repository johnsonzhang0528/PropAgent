import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Input, 
  Select, 
  Tag, 
  Space, 
  Tooltip,
  Rate,
  Avatar,
  Modal,
  Form,
  message,
  Pagination
} from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined
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
      render: (score: number) => (
        <div style={{ textAlign: 'center' }}>
          <Rate disabled value={score / 2} style={{ fontSize: '16px' }} />
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            {score.toFixed(1)}分
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
      render: (tags: string[]) => (
        <Space wrap>
          {tags.slice(0, 2).map((tag, index) => (
            <Tag key={index} color="blue" style={{ fontSize: '11px' }}>
              {tag}
            </Tag>
          ))}
          {tags.length > 2 && (
            <Tooltip title={tags.slice(2).join(', ')}>
              <Tag color="default" style={{ fontSize: '11px' }}>
                +{tags.length - 2}
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
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
        <Space>
          <Tooltip title="編輯客戶">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="聯繫客戶">
            <Button 
              type="text" 
              icon={<PhoneOutlined />} 
              onClick={() => handleContact(record)}
            />
          </Tooltip>
          <Tooltip title="刪除客戶">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
      width: 120,
    },
  ];

  // 編輯客戶
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalVisible(true);
  };

  // 聯繫客戶
  const handleContact = (customer: Customer) => {
    // 更新最後聯繫時間
    message.info(`聯繫客戶: ${customer.name}`);
  };

  // 刪除客戶
  const handleDelete = (customer: Customer) => {
    Modal.confirm({
      title: '確認刪除',
      content: `確定要刪除客戶 ${customer.name} 嗎？`,
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
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize
    }));
    loadCustomers(page);
  };

  // 處理表單提交
  const handleFormSubmit = (customer: Customer) => {
    setIsModalVisible(false);
    setEditingCustomer(null);
    loadCustomers(pagination.current); // 重新載入當前頁
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>客戶管理</h2>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCustomer(null);
              setIsModalVisible(true);
            }}
          >
            新增客戶
          </Button>
        </div>

        {/* 搜尋和篩選區域 */}
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Search
              placeholder="搜尋客戶姓名、電話或郵箱"
              style={{ width: 300 }}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onSearch={() => loadCustomers(1)}
            />
            <Select
              style={{ width: 120 }}
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <Option value="all">全部狀態</Option>
              <Option value="active">活躍</Option>
              <Option value="inactive">非活躍</Option>
              <Option value="completed">已成交</Option>
              <Option value="lost">已流失</Option>
            </Select>
            <Button icon={<FilterOutlined />}>進階篩選</Button>
          </Space>
        </div>

        {/* 客戶列表表格 */}
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="_id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1000 }}
        />

        {/* 分頁控制 */}
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
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
          />
        </div>
      </Card>

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
    </div>
  );
};

export default CustomerList;