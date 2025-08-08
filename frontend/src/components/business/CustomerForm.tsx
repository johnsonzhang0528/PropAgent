import React, { useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Button, 
  Space, 
  message,
  Row,
  Col,
  Card,
  Divider
} from 'antd';
import { useAppSelector } from '../../hooks/redux';

const { Option } = Select;
const { TextArea } = Input;

interface Customer {
  _id?: string;
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
  tags?: string[];
  notes?: string;
}

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (values: Customer) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [form] = Form.useForm();
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        ...customer,
        tags: customer.tags?.join(', ') || ''
      });
    } else {
      form.resetFields();
    }
  }, [customer, form]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : []
      };

      const url = customer ? `/api/customers/${customer._id}` : '/api/customers';
      const method = customer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success(customer ? '客戶更新成功' : '客戶創建成功');
          onSubmit(data.data.customer);
        } else {
          message.error(data.error?.message || '操作失敗');
        }
      } else {
        const errorData = await response.json();
        message.error(errorData.error?.message || '操作失敗');
      }
    } catch (error) {
      console.error('客戶表單提交錯誤:', error);
      message.error('網路錯誤，請稍後再試');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        gender: 'other',
        marital_status: 'single',
        source: 'website'
      }}
    >
      <Card title="基本資訊" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="姓氏"
              name="first_name"
              rules={[{ required: true, message: '請輸入姓氏' }]}
            >
              <Input placeholder="請輸入姓氏" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="名字"
              name="last_name"
              rules={[{ required: true, message: '請輸入名字' }]}
            >
              <Input placeholder="請輸入名字" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="手機號碼"
              name="phone"
              rules={[
                { required: true, message: '請輸入手機號碼' },
                { pattern: /^09\d{8}$/, message: '請輸入正確的手機號碼格式' }
              ]}
            >
              <Input placeholder="0912-345-678" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="電子郵箱"
              name="email"
              rules={[
                { type: 'email', message: '請輸入正確的郵箱格式' }
              ]}
            >
              <Input placeholder="example@email.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="LINE ID" name="line_id">
              <Input placeholder="LINE ID" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="WeChat ID" name="wechat_id">
              <Input placeholder="WeChat ID" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="個人資訊" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="性別" name="gender">
              <Select>
                <Option value="male">男</Option>
                <Option value="female">女</Option>
                <Option value="other">不透露</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="年齡" name="age">
              <InputNumber 
                min={1} 
                max={120} 
                style={{ width: '100%' }}
                placeholder="年齡"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="婚姻狀況" name="marital_status">
              <Select>
                <Option value="single">單身</Option>
                <Option value="married">已婚</Option>
                <Option value="divorced">離婚</Option>
                <Option value="widowed">喪偶</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="職業" name="occupation">
              <Input placeholder="職業" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="年收入" name="annual_income">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="年收入（萬元）"
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => (value!.replace(/\$\s?|(,*)/g, '') as any)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="家庭成員數" name="family_members">
          <InputNumber 
            min={1} 
            max={20} 
            style={{ width: '100%' }}
            placeholder="家庭成員數"
          />
        </Form.Item>
      </Card>

      <Card title="客戶來源" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="客戶來源" name="source">
              <Select>
                <Option value="website">官網</Option>
                <Option value="referral">轉介紹</Option>
                <Option value="advertisement">廣告</Option>
                <Option value="social_media">社群媒體</Option>
                <Option value="phone">電話開發</Option>
                <Option value="walk_in">來店諮詢</Option>
                <Option value="exhibition">展覽會</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="轉介紹來源" name="referral_source">
              <Input placeholder="具體的轉介紹來源" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="標籤" name="tags">
          <Input 
            placeholder="標籤，使用逗號分隔。例如：VIP客戶,高意願,首次購房"
          />
        </Form.Item>

        <Form.Item label="備註" name="notes">
          <TextArea 
            rows={4} 
            placeholder="客戶備註資訊"
          />
        </Form.Item>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
          >
            {customer ? '更新' : '創建'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default CustomerForm;