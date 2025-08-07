import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Tag,
  Button,
  message,
  Descriptions,
  Typography,
  Divider
} from 'antd';
import { documentService, type DocumentInfo } from '../../services/documentService';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface DocumentEditorProps {
  document: DocumentInfo | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (document: DocumentInfo) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  visible,
  onClose,
  onUpdate
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && document) {
      form.setFieldsValue({
        description: document.description || '',
        tags: document.tags?.join(', ') || '',
        category: document.category,
        isPublic: document.isPublic
      });
    }
  }, [visible, document, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (!document) return;

      const updateData = {
        description: values.description,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
        category: values.category,
        isPublic: values.isPublic
      };

      const response = await documentService.updateDocument(document._id, updateData);
      
      if (response.success) {
        message.success('文檔信息更新成功');
        onUpdate(response.document);
        onClose();
      }
    } catch (error) {
      console.error('更新文檔失敗:', error);
      message.error('更新文檔失敗');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (cat: string) => {
    const names = {
      property: '房產相關',
      customer: '客戶相關',
      contract: '合約文件',
      other: '其他'
    };
    return names[cat as keyof typeof names] || cat;
  };

  if (!document) return null;

  return (
    <Modal
      title="編輯文檔信息"
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 文檔基本信息 */}
        <Descriptions title="文檔信息" column={1} size="small" bordered>
          <Descriptions.Item label="文件名">
            {document.originalName}
          </Descriptions.Item>
          <Descriptions.Item label="文件大小">
            {document.sizeFormatted}
          </Descriptions.Item>
          <Descriptions.Item label="文件類型">
            {document.mimetype}
          </Descriptions.Item>
          <Descriptions.Item label="上傳時間">
            {new Date(document.uploadedAt).toLocaleString('zh-TW')}
          </Descriptions.Item>
          <Descriptions.Item label="上傳者">
            {document.uploadedBy.name}
          </Descriptions.Item>
          <Descriptions.Item label="版本">
            v{document.version}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* 編輯表單 */}
        <Form
          form={form}
          layout="vertical"
          size="middle"
        >
          <Form.Item
            label="文檔分類"
            name="category"
            rules={[{ required: true, message: '請選擇文檔分類' }]}
          >
            <Select placeholder="選擇文檔分類">
              <Option value="property">房產相關</Option>
              <Option value="customer">客戶相關</Option>
              <Option value="contract">合約文件</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ max: 1000, message: '描述不能超過1000字符' }]}
          >
            <TextArea
              placeholder="輸入文檔描述（可選）"
              rows={4}
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            label="標籤"
            name="tags"
            help="多個標籤用逗號分隔，例如：合同,重要,2024"
          >
            <Input
              placeholder="輸入標籤，用逗號分隔"
            />
          </Form.Item>

          <Form.Item
            label="公開設置"
            name="isPublic"
            valuePropName="checked"
          >
            <Space>
              <Switch />
              <Text type="secondary">設為公開文檔（其他用戶可查看）</Text>
            </Space>
          </Form.Item>
        </Form>

        {/* 當前標籤顯示 */}
        {document.tags && document.tags.length > 0 && (
          <div>
            <Text strong>當前標籤：</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                {document.tags.map(tag => (
                  <Tag key={tag} color="blue">{tag}</Tag>
                ))}
              </Space>
            </div>
          </div>
        )}

        {/* 關聯信息 */}
        {document.relatedTo && (
          <div>
            <Text strong>關聯對象：</Text>
            <Tag color="green" style={{ marginLeft: 8 }}>
              {document.relatedTo.type === 'property' ? '房產' : '客戶'}: {document.relatedTo.id}
            </Tag>
          </div>
        )}

        {/* 元數據信息 */}
        {document.metadata && Object.keys(document.metadata).length > 0 && (
          <div>
            <Text strong>文件元數據：</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                {document.metadata.width && document.metadata.height && (
                  <Tag>尺寸: {document.metadata.width}x{document.metadata.height}</Tag>
                )}
                {document.metadata.duration && (
                  <Tag>時長: {Math.round(document.metadata.duration)}秒</Tag>
                )}
                {document.metadata.pages && (
                  <Tag>頁數: {document.metadata.pages}</Tag>
                )}
              </Space>
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default DocumentEditor;