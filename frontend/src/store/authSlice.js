import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api';

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('bizconnect_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('bizconnect_token', data.token);
    localStorage.setItem('bizconnect_user', JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('bizconnect_token', data.token);
    localStorage.setItem('bizconnect_user', JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.getMe();
    localStorage.setItem('bizconnect_user', JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.updateProfile(formData);
    localStorage.setItem('bizconnect_user', JSON.stringify(data.user));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getStoredUser(),
    token: localStorage.getItem('bizconnect_token'),
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('bizconnect_token'),
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('bizconnect_token');
      localStorage.removeItem('bizconnect_user');
    },
    clearError: (state) => { state.error = null; },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('bizconnect_user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, rejected)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, rejected)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
      });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
