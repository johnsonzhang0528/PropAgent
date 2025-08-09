import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  company_id?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string; remember?: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error?.message || error.message || '登錄失敗');
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        return rejectWithValue(data.error?.message || '登錄失敗');
      }
    } catch (error) {
      return rejectWithValue('網絡錯誤，請稍後再試');
    }
  }
);

export const sendSmsCode = createAsyncThunk(
  'auth/sendSmsCode',
  async ({ phone }: { phone: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error?.message || error.message || '發送驗證碼失敗');
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        return rejectWithValue(data.error?.message || '發送驗證碼失敗');
      }
    } catch (error) {
      return rejectWithValue('網絡錯誤，請稍後再試');
    }
  }
);

export const loginWithSms = createAsyncThunk(
  'auth/loginWithSms',
  async (credentials: { phone: string; smsCode: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error?.message || error.message || '手機驗證登錄失敗');
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        return rejectWithValue(data.error?.message || '手機驗證登錄失敗');
      }
    } catch (error) {
      return rejectWithValue('網絡錯誤，請稍後再試');
    }
  }
);

// 從localStorage恢復用戶信息
const getUserFromStorage = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getUserFromStorage(),
  token: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string; refreshToken?: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      localStorage.setItem('access_token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      if (action.payload.refreshToken) {
        localStorage.setItem('refresh_token', action.payload.refreshToken);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login user cases
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('access_token', action.payload.access_token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        if (action.payload.refresh_token) {
          localStorage.setItem('refresh_token', action.payload.refresh_token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })
      // SMS login cases
      .addCase(loginWithSms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithSms.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('access_token', action.payload.access_token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        if (action.payload.refresh_token) {
          localStorage.setItem('refresh_token', action.payload.refresh_token);
        }
      })
      .addCase(loginWithSms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send SMS cases
      .addCase(sendSmsCode.pending, (state) => {
        state.error = null;
      })
      .addCase(sendSmsCode.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(sendSmsCode.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { loginSuccess, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
