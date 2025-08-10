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
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value) queryParams.append(key, String(value));
        });
      }

      const url = `/api/tasks${queryParams.toString() ? `?${queryParams}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('獲取任務列表失敗:', error);
      throw error;
    }
  }

  // 創建任務
  async createTask(token: string, taskData: TaskData): Promise<SingleTaskResponse> {
    if (!token) {
      throw new Error('認證 token 不存在');
    }

    try {
      // 數據清理和驗證
      const cleanData = {
        title: taskData.title?.trim(),
        description: taskData.description?.trim(),
        priority: taskData.priority,
        category: taskData.category,
        status: taskData.status || 'pending',
        dueDate: taskData.dueDate,
        assignedTo: taskData.assignedTo,
        customerId: taskData.customerId,
        propertyId: taskData.propertyId,
        tags: taskData.tags || [],
        notes: taskData.notes?.trim()
      };

      // 移除undefined值
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key as keyof typeof cleanData] === undefined) {
          delete cleanData[key as keyof typeof cleanData];
        }
      });

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(cleanData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('創建任務失敗:', error);
      throw error;
    }
  }

  // 更新任務
  async updateTask(token: string, taskId: string, updateData: Partial<TaskData>): Promise<SingleTaskResponse> {
    try {
      const url = `/api/tasks/${taskId}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('更新任務失敗:', error);
      throw error;
    }
  }

  // 刪除任務
  async deleteTask(token: string, taskId: string): Promise<void> {
    try {
      const url = `/api/tasks/${taskId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('刪除任務失敗:', error);
      throw error;
    }
  }

  // 更新任務狀態
  async updateTaskStatus(token: string, taskId: string, status: string): Promise<SingleTaskResponse> {
    try {
      const url = `/api/tasks/${taskId}/status`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      throw error;
    }
  }

  // 獲取任務統計
  async getTaskStats(token: string): Promise<{ success: boolean; data: TaskStats }> {
    try {
      const response = await fetch('/api/tasks/stats', {
        method: 'GET',
        headers: this.getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('獲取任務統計失敗:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();
export default taskService;