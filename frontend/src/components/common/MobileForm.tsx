import React from 'react';
import { Form, Card, Space, Button, Row, Col } from 'antd';
import { useMobile } from '../../hooks/useMobile';
import type { FormProps } from 'antd';

interface MobileFormProps extends FormProps {
  title?: string;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  loading?: boolean;
  showActions?: boolean;
  cardStyle?: React.CSSProperties;
}

const MobileForm: React.FC<MobileFormProps> = ({
  title,
  submitText = '提交',
  cancelText = '取消',
  onCancel,
  loading = false,
  showActions = true,
  cardStyle,
  children,
  ...formProps
}) => {
  const { isMobile, isSmallMobile } = useMobile();

  const formLayout = isMobile ? 'vertical' : 'horizontal';
  const colSpan = isSmallMobile ? 24 : isMobile ? 12 : 8;

  return (
    <Card 
      title={title}
      style={{ 
        marginBottom: '16px',
        ...cardStyle
      }}
      bodyStyle={{ 
        padding: isMobile ? '16px' : '24px'
      }}
    >
      <Form
        {...formProps}
        layout={formLayout}
        size={isMobile ? 'large' : 'middle'}
        scrollToFirstError
        validateTrigger="onBlur"
      >
        <Row gutter={[16, 16]}>
          {Array.isArray(children) ? children.map((child, index) => {
            if (React.isValidElement(child) && child.type === Form.Item) {
              return (
                <Col span={colSpan} key={index}>
                  {child}
                </Col>
              );
            }
            return child;
          }) : React.isValidElement(children) ? children : null}
        </Row>

        {showActions && (
          <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
            <Space 
              style={{ 
                width: '100%',
                justifyContent: isMobile ? 'center' : 'flex-end'
              }}
              size="middle"
            >
              {onCancel && (
                <Button 
                  onClick={onCancel}
                  size={isMobile ? 'large' : 'middle'}
                  style={{ 
                    minWidth: isMobile ? '120px' : '80px'
                  }}
                >
                  {cancelText}
                </Button>
              )}
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                size={isMobile ? 'large' : 'middle'}
                style={{ 
                  minWidth: isMobile ? '120px' : '80px'
                }}
              >
                {submitText}
              </Button>
            </Space>
          </Form.Item>
        )}
      </Form>
    </Card>
  );
};

export default MobileForm;