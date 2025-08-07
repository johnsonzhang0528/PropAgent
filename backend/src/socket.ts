import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { User } from './models/User';

// Socket.io 服務器初始化
export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5175',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket 認證中間件
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('缺少認證令牌'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback-secret') as any;
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || user.status !== 'active') {
        return next(new Error('用戶未找到或已停用'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('認證失敗'));
    }
  });

  // 連接處理
  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`🔌 用戶 ${user.first_name} ${user.last_name} 已連接 (${socket.id})`);

    // 加入用戶專屬房間
    socket.join(`user:${user._id}`);
    socket.join(`role:${user.role}`);
    if (user.company_id) {
      socket.join(`company:${user.company_id}`);
    }

    // 發送歡迎消息
    socket.emit('welcome', {
      message: '歡迎使用 PropAgent Pro 實時系統',
      user: {
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role
      },
      timestamp: new Date().toISOString()
    });

    // 處理客戶更新事件
    socket.on('customer:subscribe', (customerId: string) => {
      socket.join(`customer:${customerId}`);
      console.log(`👤 用戶 ${user._id} 訂閱客戶 ${customerId}`);
    });

    socket.on('customer:unsubscribe', (customerId: string) => {
      socket.leave(`customer:${customerId}`);
      console.log(`👤 用戶 ${user._id} 取消訂閱客戶 ${customerId}`);
    });

    // 處理物件更新事件
    socket.on('property:subscribe', (propertyId: string) => {
      socket.join(`property:${propertyId}`);
      console.log(`🏠 用戶 ${user._id} 訂閱物件 ${propertyId}`);
    });

    socket.on('property:unsubscribe', (propertyId: string) => {
      socket.leave(`property:${propertyId}`);
      console.log(`🏠 用戶 ${user._id} 取消訂閱物件 ${propertyId}`);
    });

    // 處理聊天消息
    socket.on('chat:message', (data: {
      type: 'customer' | 'property' | 'general';
      target_id?: string;
      message: string;
    }) => {
      const messageData = {
        id: Date.now().toString(),
        from: {
          id: user._id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role
        },
        message: data.message,
        timestamp: new Date().toISOString()
      };

      // 根據類型廣播消息
      if (data.type === 'customer' && data.target_id) {
        io.to(`customer:${data.target_id}`).emit('chat:message', messageData);
      } else if (data.type === 'property' && data.target_id) {
        io.to(`property:${data.target_id}`).emit('chat:message', messageData);
      } else {
        io.to(`company:${user.company_id}`).emit('chat:message', messageData);
      }
    });

    // 處理活動狀態
    socket.on('user:status', (status: 'online' | 'away' | 'busy') => {
      socket.broadcast.to(`company:${user.company_id}`).emit('user:status', {
        user_id: user._id,
        status,
        timestamp: new Date().toISOString()
      });
    });

    // 斷線處理
    socket.on('disconnect', (reason) => {
      console.log(`❌ 用戶 ${user.first_name} ${user.last_name} 已斷線: ${reason}`);
      
      // 通知其他用戶
      socket.broadcast.to(`company:${user.company_id}`).emit('user:offline', {
        user_id: user._id,
        timestamp: new Date().toISOString()
      });
    });

    // 錯誤處理
    socket.on('error', (error) => {
      console.error(`Socket 錯誤 (${socket.id}):`, error);
    });
  });

  return io;
};

// 實時通知工具函數
export class NotificationService {
  private static io: Server;

  static initialize(io: Server) {
    this.io = io;
  }

  // 發送新客戶通知
  static notifyNewCustomer(customer: any) {
    this.io.to(`user:${customer.agent_id}`).emit('notification', {
      type: 'new_customer',
      title: '新客戶',
      message: `新客戶 ${customer.first_name} ${customer.last_name} 已建立`,
      data: customer,
      timestamp: new Date().toISOString()
    });

    // 通知經理
    this.io.to('role:manager').emit('notification', {
      type: 'new_customer',
      title: '團隊新客戶',
      message: `業務員新增客戶 ${customer.first_name} ${customer.last_name}`,
      data: customer,
      timestamp: new Date().toISOString()
    });
  }

  // 發送客戶更新通知
  static notifyCustomerUpdate(customer: any, changes: string[]) {
    this.io.to(`customer:${customer._id}`).emit('customer:updated', {
      customer,
      changes,
      timestamp: new Date().toISOString()
    });

    this.io.to(`user:${customer.agent_id}`).emit('notification', {
      type: 'customer_update',
      title: '客戶更新',
      message: `客戶 ${customer.first_name} ${customer.last_name} 信息已更新`,
      data: { customer, changes },
      timestamp: new Date().toISOString()
    });
  }

  // 發送新物件通知
  static notifyNewProperty(property: any) {
    this.io.to(`user:${property.agent_id}`).emit('notification', {
      type: 'new_property',
      title: '新物件',
      message: `新物件 ${property.title} 已建立`,
      data: property,
      timestamp: new Date().toISOString()
    });

    // 通知所有業務員有新物件
    this.io.to('role:agent').emit('notification', {
      type: 'new_property',
      title: '新物件上架',
      message: `${property.title} 現已可供推廣`,
      data: property,
      timestamp: new Date().toISOString()
    });
  }

  // 發送物件更新通知
  static notifyPropertyUpdate(property: any, changes: string[]) {
    this.io.to(`property:${property._id}`).emit('property:updated', {
      property,
      changes,
      timestamp: new Date().toISOString()
    });

    this.io.to(`user:${property.agent_id}`).emit('notification', {
      type: 'property_update',
      title: '物件更新',
      message: `物件 ${property.title} 信息已更新`,
      data: { property, changes },
      timestamp: new Date().toISOString()
    });
  }

  // 發送客戶匹配通知
  static notifyCustomerMatch(property: any, matches: any[]) {
    this.io.to(`user:${property.agent_id}`).emit('notification', {
      type: 'customer_match',
      title: '客戶匹配',
      message: `物件 ${property.title} 找到 ${matches.length} 個潛在客戶`,
      data: { property, matches },
      timestamp: new Date().toISOString()
    });
  }

  // 發送系統廣播
  static broadcastToRole(role: string, notification: any) {
    this.io.to(`role:${role}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // 發送公司內廣播
  static broadcastToCompany(companyId: string, notification: any) {
    this.io.to(`company:${companyId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // 發送用戶專屬通知
  static notifyUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // 發送活動追蹤
  static trackActivity(activity: {
    user_id: string;
    action: string;
    target_type: 'customer' | 'property' | 'user';
    target_id: string;
    description: string;
  }) {
    // 發送給經理層級
    this.io.to('role:manager').emit('activity:track', {
      ...activity,
      timestamp: new Date().toISOString()
    });

    // 發送給管理員
    this.io.to('role:admin').emit('activity:track', {
      ...activity,
      timestamp: new Date().toISOString()
    });
  }
}

export default { initializeSocket, NotificationService };