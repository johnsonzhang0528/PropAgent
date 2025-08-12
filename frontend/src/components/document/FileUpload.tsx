import React, { useState, useRef } from 'react';
import {
  Upload,
  Button,
  Progress,
  Card,
  Typography,
  Space,
  Tag,
  Alert,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  List,
  Divider
} from 'antd';
import {
  UploadOutlined,
  FileOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { documentService, type UploadOptions, type UploadResult } from '../../services/documentService';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface FileUploadProps {
  category?: string;
  relatedType?: 'property' | 'customer';
  relatedId?: string;
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  allowedTypes?: string[];
  showAdvancedOptions?: boolean;
}

interface FileItem extends File {
  uid: string;
  status: 'uploading' | 'done' | 'error' | 'removed';
  progress?: number;
  response?: any;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  category = 'other',
  relatedType,
  relatedId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  allowedTypes,
  showAdvancedOptions = true
}) => {
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
    category,
    relatedType,
    relatedId
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 文件類型配置
  const fileTypeConfig = {
    image: {
      accept: '.jpg,.jpeg,.png,.gif,.webp,.bmp',
      maxSize: 10, // MB
      description: '圖片文件 (JPG, PNG, GIF, WebP, BMP)'
    },
    document: {
      accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
      maxSize: 50, // MB
      description: '文檔文件 (PDF, Word, Excel, PowerPoint, TXT)'
    },
    video: {
      accept: '.mp4,.avi,.mov,.wmv,.flv',
      maxSize: 100, // MB
      description: '視頻文件 (MP4, AVI, MOV, WMV, FLV)'
    },
    audio: {
      accept: '.mp3,.wav,.flac,.aac',
      maxSize: 20, // MB
      description: '音頻文件 (MP3, WAV, FLAC, AAC)'
    },
    archive: {
      accept: '.zip,.rar,.7z',
      maxSize: 100, // MB
      description: '壓縮文件 (ZIP, RAR, 7Z)'
    },
    all: {
      accept: '.jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp4,.avi,.mov,.wmv,.flv,.mp3,.wav,.flac,.aac,.zip,.rar,.7z',
      maxSize: 100, // MB
      description: '所有支持的文件類型'
    }
  };

  // 獲取接受的文件類型
  const getAcceptedTypes = () => {
    if (allowedTypes && allowedTypes.length > 0) {
      return allowedTypes.join(',');
    }
    return fileTypeConfig.all.accept;
  };

  // 驗證文件
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 檢查文件大小
    const maxSizeBytes = fileTypeConfig.all.maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `文件大小超過限制 (${fileTypeConfig.all.maxSize}MB)`
      };
    }

    // 檢查文件類型
    const acceptedTypes = getAcceptedTypes().split(',');
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExt)) {
      return {
        valid: false,
        error: '不支持的文件類型'
      };
    }

    return { valid: true };
  };

  // 處理文件選擇
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileItem[] = [];
    const errors: string[] = [];

    // 檢查文件數量限制
    if (fileList.length + files.length > maxFiles) {
      message.error(`最多只能上傳 ${maxFiles} 個文件`);
      return;
    }

    Array.from(files).forEach((file, index) => {
      const validation = validateFile(file);
      if (validation.valid) {
        const fileItem: FileItem = Object.assign(file, {
          uid: `${Date.now()}-${index}`,
          status: 'done' as const
        });
        newFiles.push(fileItem);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      Modal.error({
        title: '文件驗證失敗',
        content: (
          <div>
            <p>以下文件無法上傳：</p>
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )
      });
    }

    if (newFiles.length > 0) {
      setFileList(prev => [...prev, ...newFiles]);
    }

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 移除文件
  const handleRemoveFile = (uid: string) => {
    setFileList(prev => prev.filter(file => file.uid !== uid));
  };

  // 預覽文件
  const handlePreviewFile = (file: FileItem) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        Modal.info({
          title: file.name,
          content: (
            <div style={{ textAlign: 'center' }}>
              <img 
                src={reader.result as string} 
                alt={file.name}
                style={{ maxWidth: '100%', maxHeight: '400px' }}
              />
            </div>
          ),
          width: 600
        });
      };
      reader.readAsDataURL(file);
    } else {
      message.info('此文件類型不支持預覽');
    }
  };

  // 開始上傳
  const handleUpload = async () => {
    console.log('點擊開始上傳按鈕');
    if (fileList.length === 0) {
      message.warning('請選擇要上傳的文件');
      return;
    }

    if (showAdvancedOptions && !uploadOptions.category) {
      setShowOptionsModal(true);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 更新文件狀態為上傳中
      setFileList(prev => prev.map(file => ({
        ...file,
        status: 'uploading' as const,
        progress: 0
      })));

      const filesToUpload = fileList.filter(file => file.status !== 'removed');
      
      console.log('開始上傳文件:', filesToUpload.map(f => f.name));
      
      const response = await documentService.uploadFiles(filesToUpload, {
        ...uploadOptions,
        onProgress: (progress) => {
          console.log('上傳進度:', progress);
          setUploadProgress(progress);
          // 更新文件進度
          setFileList(prev => prev.map(file => ({
            ...file,
            progress: file.status === 'uploading' ? progress : file.progress
          })));
        }
      });

      console.log('上傳響應:', response);

      // 更新文件狀態
      setFileList(prev => prev.map(file => {
        const result = response.results.find(r => r.filename === file.name);
        const failed = response.failed.find(f => f.filename === file.name);
        
        if (result) {
          return {
            ...file,
            status: 'done' as const,
            progress: 100,
            response: result
          };
        } else if (failed) {
          return {
            ...file,
            status: 'error' as const,
            error: failed.error
          };
        }
        return file;
      }));

      // 顯示結果
      if (response.successful > 0) {
        message.success(`成功上傳 ${response.successful} 個文件`);
      }
      
      if (response.failed_count > 0) {
        message.error(`${response.failed_count} 個文件上傳失敗`);
        // 顯示詳細錯誤信息
        response.failed.forEach(fail => {
          console.error(`文件 ${fail.filename} 上傳失敗:`, fail.error);
        });
      }

      // 調用回調
      if (onUploadComplete) {
        onUploadComplete(response.results);
      }

      // 清空文件列表（成功的文件）
      setTimeout(() => {
        setFileList(prev => prev.filter(file => file.status === 'error'));
      }, 2000);

    } catch (error) {
      console.error('上傳失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '上傳失敗';
      message.error(`上傳失敗: ${errorMessage}`);
      
      // 更新文件狀態為錯誤
      setFileList(prev => prev.map(file => ({
        ...file,
        status: file.status === 'uploading' ? 'error' as const : file.status,
        error: errorMessage
      })));

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 處理上傳選項確認
  const handleOptionsConfirm = () => {
    setShowOptionsModal(false);
    handleUpload();
  };

  // 清空文件列表
  const handleClearAll = () => {
    setFileList([]);
  };

  // 渲染文件列表項
  const renderFileItem = (file: FileItem) => {
    const actions = [];

    if (file.status === 'done' || file.status === 'error') {
      if (file.type.startsWith('image/')) {
        actions.push(
          <Button
            key="preview"
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreviewFile(file)}
          />
        );
      }
    }

    actions.push(
      <Button
        key="remove"
        type="text"
        size="small"
        danger
        icon={<DeleteOutlined />}
        onClick={() => handleRemoveFile(file.uid)}
      />
    );

    const getStatusIcon = () => {
      switch (file.status) {
        case 'done':
          return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        case 'error':
          return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
        case 'uploading':
          return <Progress type="circle" size={20} percent={file.progress || 0} />;
        default:
          return <FileOutlined />;
      }
    };

    return (
      <List.Item actions={actions}>
        <List.Item.Meta
          avatar={getStatusIcon()}
          title={
            <Space>
              <Text>{file.name}</Text>
              {file.status === 'done' && file.response?.isDuplicate && (
                <Tag color="orange">重複文件</Tag>
              )}
              {file.status === 'error' && (
                <Tag color="red">失敗</Tag>
              )}
            </Space>
          }
          description={
            <Space direction="vertical" size="small">
              <Text type="secondary">
                {documentService.formatFileSize(file.size)}
              </Text>
              {file.status === 'uploading' && file.progress && (
                <Progress percent={file.progress} size="small" />
              )}
              {file.status === 'error' && file.error && (
                <Text type="danger">{file.error}</Text>
              )}
              {file.status === 'done' && file.response?.message && (
                <Text type="success">{file.response.message}</Text>
              )}
            </Space>
          }
        />
      </List.Item>
    );
  };

  return (
    <Card title="文件上傳">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 文件類型說明 */}
        <Alert
          message="支持的文件類型"
          description={fileTypeConfig.all.description}
          type="info"
          showIcon
        />

        {/* 上傳區域 */}
        <div 
          style={{ 
            textAlign: 'center', 
            padding: '20px', 
            border: '2px dashed #d9d9d9', 
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'border-color 0.3s'
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#1890ff';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#d9d9d9';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#d9d9d9';
            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles) {
              const event = { target: { files: droppedFiles } } as React.ChangeEvent<HTMLInputElement>;
              handleFileSelect(event);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={getAcceptedTypes()}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div>
            <FileOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <div>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
                size="large"
              >
                選擇文件
              </Button>
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">
                  支持拖拽上傳，最多 {maxFiles} 個文件，單個文件最大 {fileTypeConfig.all.maxSize}MB
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* 文件列表 */}
        {fileList.length > 0 && (
          <>
            <Divider>
              <Space>
                <Text>文件列表 ({fileList.length})</Text>
                <Button type="text" size="small" onClick={handleClearAll}>
                  清空全部
                </Button>
              </Space>
            </Divider>
            
            <List
              dataSource={fileList}
              renderItem={renderFileItem}
              size="small"
            />
          </>
        )}

        {/* 上傳進度 */}
        {uploading && (
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>上傳進度</Text>
              <Progress percent={uploadProgress} status="active" />
            </Space>
          </Card>
        )}

        {/* 操作按鈕 */}
        <Space>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={fileList.length === 0 || uploading}
            loading={uploading}
            size="large"
          >
            開始上傳
          </Button>
          
          {showAdvancedOptions && (
            <Button
              onClick={() => setShowOptionsModal(true)}
              disabled={uploading}
            >
              上傳選項
            </Button>
          )}
        </Space>
      </Space>

      {/* 上傳選項模態框 */}
      <Modal
        title="上傳選項"
        open={showOptionsModal}
        onOk={handleOptionsConfirm}
        onCancel={() => setShowOptionsModal(false)}
        okText="確認上傳"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="文檔分類">
            <Select
              value={uploadOptions.category}
              onChange={(value) => setUploadOptions(prev => ({ ...prev, category: value }))}
              placeholder="選擇文檔分類"
            >
              <Option value="property">房產相關</Option>
              <Option value="customer">客戶相關</Option>
              <Option value="contract">合約文件</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item label="描述">
            <TextArea
              value={uploadOptions.description}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, description: e.target.value }))}
              placeholder="輸入文檔描述（可選）"
              rows={3}
            />
          </Form.Item>

          <Form.Item label="標籤">
            <Input
              value={uploadOptions.tags}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="輸入標籤，用逗號分隔（可選）"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Switch
                checked={uploadOptions.isPublic}
                onChange={(checked) => setUploadOptions(prev => ({ ...prev, isPublic: checked }))}
              />
              <Text>公開文檔</Text>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default FileUpload;