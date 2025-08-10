// 任務服務 - 統一管理所有任務相關的 API 請求
const API_BASE_URL = 'http://localhost:3000/api';

export interface TaskData {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status?: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  assignedTo?: string;
  customerId?: string;
  propertyId?: string;
  tags?: string[];
  notes?: string;
}

export interface Task extends TaskData {
  _id: string;
  createdBy?: any;
  updatedBy?: any;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  daysRemaining?: number;
}

export interface TasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
  error?: {
    message: string;
  };
}

export interface SingleTaskResponse {
  success: boolean;
  data: { task: Task };
  error?: {
    message: string;
  };
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  high_priority: number;
  completion_rate: number;
}

class TaskService {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // 獲取任務列表
  async getTasks(token: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }): Promise<TasksResponse> {
    console.log('🔥 TaskService.getTasks 開始', { params });
    
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) queryParams.append(key, String(value));
        });
      }

      const url = `${API_BASE_URL}/tasks${queryParams.toString() ? `?${queryParams}` : ''}`;
      console.log('📤 發送請求到:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(token)
      });

      console.log('📊 獲取任務回應狀態:', response.status);
      
      const result = await response.json();
      console.log('📥 獲取任務回應數據:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error?.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('❌ TaskService.getTasks 錯誤:', error);
      throw error;
    }
  }

  // 創建新任務
  async createTask(token: string, taskData: TaskData): Promise<SingleTaskResponse> {
    console.log('🚀 TaskService.createTask 開始', { taskData });
    console.log('🔑 使用 token:', token?.substring(0, 20) + '...');

    if (!token) {
      throw new Error('認證 token 不存在');
    }

    try {
      // 數據清理和驗證
      const cleanData = {
        title: taskData.title?.trim(),
        description: taskData.description?.trim() || undefined,
        priority: taskData.priority || 'medium',
        category: taskData.category?.trim(),
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined,
        notes: taskData.notes?.trim() || undefined
      };

      // 移除空值
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key as keyof typeof cleanData] === undefined) {
          delete cleanData[key as keyof typeof cleanData];
        }
      });

      console.log('📝 清理後的數據:', cleanData);

      if (!cleanData.title) {
        throw new Error('任務標題為必填項');
      }
      if (!cleanData.category) {
        throw new Error('任務分類為必填項');
      }

      const url = `${API_BASE_URL}/tasks`;
      console.log('📤 發送創建請求到:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(cleanData)
      });

      console.log('📊 創建任務回應狀態:', response.status, response.statusText);
      
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('❌ JSON 解析錯誤:', parseError);
        throw new Error('服務器回應格式錯誤');
      }

      console.log('📥 創建任務回應數據:', result);

      if (!response.ok) {
        const errorMessage = result.message || result.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ 創建任務失敗:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          result
        });
        throw new Error(errorMessage);
      }

      if (!result.success) {
        throw new Error(result.error?.message || '任務創建失敗');
      }

      console.log('✅ TaskService.createTask 成功');
      return result;
    } catch (error) {
      console.error('❌ TaskService.createTask 錯誤:', error);
      throw error;
    }
  }

  // 更新任務
  async updateTask(token: string, taskId: string, updateData: Partial<TaskData>): Promise<SingleTaskResponse> {
    console.log('🔄 TaskService.updateTask 開始', { taskId, updateData });

    try {
      const url = `${API_BASE_URL}/tasks/${taskId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      console.log('📥 更新任務回應:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error?.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('❌ TaskService.updateTask 錯誤:', error);
      throw error;
    }
  }

  // 刪除任務
  async deleteTask(token: string, taskId: string): Promise<any> {
    console.log('🗑️ TaskService.deleteTask 開始', { taskId });

    try {
      const url = `${API_BASE_URL}/tasks/${taskId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token)
      });

      const result = await response.json();
      console.log('📥 刪除任務回應:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error?.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('❌ TaskService.deleteTask 錯誤:', error);
      throw error;
    }
  }

  // 更新任務狀態
  async updateTaskStatus(token: string, taskId: string, status: string): Promise<any> {
    console.log('📊 TaskService.updateTaskStatus 開始', { taskId, status });

    try {
      const url = `${API_BASE_URL}/tasks/${taskId}/status`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      console.log('📥 更新狀態回應:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error?.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('❌ TaskService.updateTaskStatus 錯誤:', error);
      throw error;
    }
  }

  // 獲取任務統計
  async getTaskStats(token: string): Promise<{ success: boolean; data: TaskStats }> {
    console.log('📈 TaskService.getTaskStats 開始');

    try {
      const url = `${API_BASE_URL}/tasks/stats/summary`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(token)
      });

      const result = await response.json();
      console.log('📥 統計數據回應:', result);

      if (!response.ok) {
        throw new Error(result.message || result.error?.message || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('❌ TaskService.getTaskStats 錯誤:', error);
      throw error;
    }
  }
}

// 創建並導出服務實例
export const taskService = new TaskService();
export default taskService;