import nodemailer from 'nodemailer';
import { ICustomer } from '../models/Customer';
import { IProperty } from '../models/Property';

// 電子郵件配置介面
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 電子郵件模板介面
interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// 電子郵件服務類
class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // 檢查是否有必要的配置
      if (!this.config.auth.user || !this.config.auth.pass) {
        console.warn('⚠️ 電子郵件服務未配置：缺少 SMTP 認證信息');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass
        },
        tls: {
          rejectUnauthorized: false // 用於開發環境
        }
      });

      this.isConfigured = true;
      console.log('✅ 電子郵件服務已初始化');
    } catch (error) {
      console.error('❌ 電子郵件服務初始化失敗:', error);
    }
  }

  // 驗證郵件配置
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 電子郵件服務未配置，跳過連接驗證');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ 電子郵件服務器連接成功');
      return true;
    } catch (error) {
      console.error('❌ 電子郵件服務器連接失敗:', error);
      return false;
    }
  }

  // 發送通用郵件
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    attachments?: any[];
  }): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 電子郵件服務未配置，模擬發送郵件:', options.subject);
      return true; // 模擬成功，用於開發測試
    }

    try {
      const mailOptions = {
        from: options.from || process.env.SMTP_FROM || this.config.auth.user,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ 郵件發送成功:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ 郵件發送失敗:', error);
      return false;
    }
  }

  // 新客戶註冊通知
  async sendNewCustomerNotification(customer: ICustomer, agentEmail: string): Promise<boolean> {
    const template = this.getNewCustomerTemplate(customer);
    
    return await this.sendEmail({
      to: agentEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // 客戶狀態變更通知
  async sendCustomerStatusChangeNotification(
    customer: ICustomer, 
    oldStatus: string, 
    newStatus: string, 
    agentEmail: string
  ): Promise<boolean> {
    const template = this.getCustomerStatusChangeTemplate(customer, oldStatus, newStatus);
    
    return await this.sendEmail({
      to: agentEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // 新房產上架通知
  async sendNewPropertyNotification(property: IProperty, agentEmail: string): Promise<boolean> {
    const template = this.getNewPropertyTemplate(property);
    
    return await this.sendEmail({
      to: agentEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // 房產價格變更通知
  async sendPropertyPriceChangeNotification(
    property: IProperty, 
    oldPrice: number, 
    newPrice: number, 
    interestedCustomers: string[]
  ): Promise<boolean> {
    const template = this.getPropertyPriceChangeTemplate(property, oldPrice, newPrice);
    
    return await this.sendEmail({
      to: interestedCustomers,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // 客戶跟進提醒
  async sendFollowUpReminder(customer: ICustomer, agentEmail: string, daysOverdue: number): Promise<boolean> {
    const template = this.getFollowUpReminderTemplate(customer, daysOverdue);
    
    return await this.sendEmail({
      to: agentEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // 合約到期提醒
  async sendContractExpiryReminder(
    customer: ICustomer, 
    property: IProperty, 
    agentEmail: string, 
    daysUntilExpiry: number
  ): Promise<boolean> {
    const template = this.getContractExpiryTemplate(customer, property, daysUntilExpiry);
    
    return await this.sendEmail({
      to: [agentEmail, customer.email].filter(Boolean),
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // 文檔上傳通知
  async sendDocumentUploadNotification(
    fileName: string, 
    uploaderName: string, 
    recipientEmail: string,
    category: string
  ): Promise<boolean> {
    const template = this.getDocumentUploadTemplate(fileName, uploaderName, category);
    
    return await this.sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // 系統維護通知
  async sendMaintenanceNotification(
    message: string, 
    startTime: Date, 
    endTime: Date, 
    userEmails: string[]
  ): Promise<boolean> {
    const template = this.getMaintenanceTemplate(message, startTime, endTime);
    
    return await this.sendEmail({
      to: userEmails,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // 模板方法 - 新客戶
  private getNewCustomerTemplate(customer: ICustomer): EmailTemplate {
    const subject = `🎉 新客戶註冊：${customer.first_name} ${customer.last_name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1890ff;">新客戶註冊通知</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>客戶信息</h3>
          <p><strong>姓名：</strong>${customer.first_name} ${customer.last_name}</p>
          <p><strong>電話：</strong>${customer.phone}</p>
          <p><strong>郵箱：</strong>${customer.email || '未提供'}</p>
          <p><strong>註冊時間：</strong>${new Date(customer.created_at).toLocaleString('zh-TW')}</p>
          <p><strong>購買意願分數：</strong>${customer.purchase_intent_score}/10</p>
          ${customer.preferred_location?.length ? `<p><strong>偏好地區：</strong>${customer.preferred_location.join(', ')}</p>` : ''}
          ${customer.notes ? `<p><strong>備註：</strong>${customer.notes}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/customers" 
             style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            查看客戶詳情
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px;">
          此郵件由 PropAgent Pro 系統自動發送，請勿回覆。
        </p>
      </div>
    `;
    
    const text = `新客戶註冊：${customer.first_name} ${customer.last_name} (${customer.phone})`;
    
    return { subject, html, text };
  }

  // 模板方法 - 客戶狀態變更
  private getCustomerStatusChangeTemplate(customer: ICustomer, oldStatus: string, newStatus: string): EmailTemplate {
    const statusNames = {
      active: '活躍',
      inactive: '非活躍',
      completed: '已成交',
      lost: '流失'
    };
    
    const subject = `📋 客戶狀態變更：${customer.first_name} ${customer.last_name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1890ff;">客戶狀態變更通知</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${customer.first_name} ${customer.last_name}</h3>
          <p><strong>電話：</strong>${customer.phone}</p>
          <p><strong>狀態變更：</strong>
            <span style="color: #faad14;">${statusNames[oldStatus as keyof typeof statusNames] || oldStatus}</span>
            →
            <span style="color: #52c41a;">${statusNames[newStatus as keyof typeof statusNames] || newStatus}</span>
          </p>
          <p><strong>變更時間：</strong>${new Date().toLocaleString('zh-TW')}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/customers" 
             style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            查看客戶詳情
          </a>
        </div>
      </div>
    `;
    
    return { subject, html };
  }

  // 模板方法 - 新房產
  private getNewPropertyTemplate(property: IProperty): EmailTemplate {
    const subject = `🏠 新房產上架：${property.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1890ff;">新房產上架通知</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${property.title}</h3>
          <p><strong>價格：</strong>NT$ ${property.price.toLocaleString()}</p>
          <p><strong>地址：</strong>${property.location.address}</p>
          <p><strong>類型：</strong>${property.type}</p>
          <p><strong>面積：</strong>${property.area} 坪</p>
          ${property.description ? `<p><strong>描述：</strong>${property.description}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/properties" 
             style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            查看房產詳情
          </a>
        </div>
      </div>
    `;
    
    return { subject, html };
  }

  // 模板方法 - 房產價格變更
  private getPropertyPriceChangeTemplate(property: IProperty, oldPrice: number, newPrice: number): EmailTemplate {
    const priceChange = newPrice - oldPrice;
    const changeType = priceChange > 0 ? '上漲' : '下調';
    const changeColor = priceChange > 0 ? '#ff4d4f' : '#52c41a';
    
    const subject = `💰 房產價格${changeType}：${property.title}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1890ff;">房產價格變更通知</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${property.title}</h3>
          <p><strong>原價格：</strong>NT$ ${oldPrice.toLocaleString()}</p>
          <p><strong>新價格：</strong>
            <span style="color: ${changeColor}; font-weight: bold;">
              NT$ ${newPrice.toLocaleString()}
            </span>
          </p>
          <p><strong>價格變動：</strong>
            <span style="color: ${changeColor};">
              ${priceChange > 0 ? '+' : ''}NT$ ${priceChange.toLocaleString()} (${changeType})
            </span>
          </p>
          <p><strong>地址：</strong>${property.location.address}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/properties" 
             style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            查看房產詳情
          </a>
        </div>
      </div>
    `;
    
    return { subject, html };
  }

  // 模板方法 - 跟進提醒
  private getFollowUpReminderTemplate(customer: ICustomer, daysOverdue: number): EmailTemplate {
    const subject = `⏰ 客戶跟進提醒：${customer.first_name} ${customer.last_name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #faad14;">客戶跟進提醒</h2>
        
        <div style="background: #fff7e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #faad14;">
          <h3>${customer.first_name} ${customer.last_name}</h3>
          <p><strong>電話：</strong>${customer.phone}</p>
          <p><strong>最後聯繫：</strong>${customer.last_contact_at ? new Date(customer.last_contact_at).toLocaleDateString('zh-TW') : '未記錄'}</p>
          <p><strong>已過期：</strong><span style="color: #ff4d4f; font-weight: bold;">${daysOverdue} 天</span></p>
          <p><strong>購買意願：</strong>${customer.purchase_intent_score}/10</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/customers" 
             style="background: #faad14; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            立即跟進
          </a>
        </div>
      </div>
    `;
    
    return { subject, html };
  }

  // 模板方法 - 合約到期提醒
  private getContractExpiryTemplate(customer: ICustomer, property: IProperty, daysUntilExpiry: number): EmailTemplate {
    const subject = `📋 合約到期提醒：${daysUntilExpiry} 天後到期`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff4d4f;">合約到期提醒</h2>
        
        <div style="background: #fff1f0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff4d4f;">
          <h3>合約信息</h3>
          <p><strong>客戶：</strong>${customer.first_name} ${customer.last_name}</p>
          <p><strong>房產：</strong>${property.title}</p>
          <p><strong>到期時間：</strong><span style="color: #ff4d4f; font-weight: bold;">${daysUntilExpiry} 天後</span></p>
          <p><strong>聯繫電話：</strong>${customer.phone}</p>
        </div>
        
        <div style="background: #f6ffed; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #389e0d; margin: 0;">
            <strong>建議行動：</strong>請及時聯繫客戶確認續約意向或安排交接事宜。
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/customers" 
             style="background: #ff4d4f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            處理合約
          </a>
        </div>
      </div>
    `;
    
    return { subject, html };
  }

  // 模板方法 - 文檔上傳通知
  private getDocumentUploadTemplate(fileName: string, uploaderName: string, category: string): EmailTemplate {
    const subject = `📄 新文檔上傳：${fileName}`;
    
    const categoryNames = {
      property: '房產相關',
      customer: '客戶相關',
      contract: '合約文件',
      other: '其他'
    };
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1890ff;">文檔上傳通知</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>文件名：</strong>${fileName}</p>
          <p><strong>上傳者：</strong>${uploaderName}</p>
          <p><strong>分類：</strong>${categoryNames[category as keyof typeof categoryNames] || category}</p>
          <p><strong>上傳時間：</strong>${new Date().toLocaleString('zh-TW')}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/documents" 
             style="background: #1890ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            查看文檔
          </a>
        </div>
      </div>
    `;
    
    return { subject, html };
  }

  // 模板方法 - 系統維護通知
  private getMaintenanceTemplate(message: string, startTime: Date, endTime: Date): EmailTemplate {
    const subject = `🔧 系統維護通知`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #faad14;">系統維護通知</h2>
        
        <div style="background: #fff7e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #faad14;">
          <p><strong>維護內容：</strong>${message}</p>
          <p><strong>開始時間：</strong>${startTime.toLocaleString('zh-TW')}</p>
          <p><strong>結束時間：</strong>${endTime.toLocaleString('zh-TW')}</p>
          <p><strong>預計時長：</strong>${Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} 分鐘</p>
        </div>
        
        <div style="background: #fff1f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #cf1322; margin: 0;">
            <strong>注意：</strong>維護期間系統將暫時無法使用，請提前安排工作。
          </p>
        </div>
      </div>
    `;
    
    return { subject, html };
  }
}

// 創建單例實例
export const emailService = new EmailService();

// 導出類型
export { EmailService };
export default emailService;