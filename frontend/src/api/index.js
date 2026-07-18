import api from './axios';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  // If data is FormData (has avatar file), let the browser set Content-Type with boundary
  updateProfile: (data) => api.put('/auth/me', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const businessAPI = {
  getAll: (params) => api.get('/businesses', { params }),
  getById: (id) => api.get(`/businesses/${id}`),
  getMy: () => api.get('/businesses/my'),
  getAnalytics: () => api.get('/businesses/analytics'),
  create: (data) => api.post('/businesses', data),
  update: (id, data) => api.put(`/businesses/${id}`, data),
  delete: (id) => api.delete(`/businesses/${id}`),
  getSlots: (id, params) => api.get(`/businesses/${id}/slots`, { params }),
  updateBlockedDates: (id, data) => api.put(`/businesses/${id}/blocked-dates`, data),
  getSuggestions: (q) => api.get('/businesses/suggestions', { params: { q } }),
};

export const appointmentAPI = {
  book: (data) => api.post('/appointments', data),
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
};

export const reviewAPI = {
  getByBusiness: (businessId, params) => api.get(`/reviews/business/${businessId}`, { params }),
  getMy: () => api.get('/reviews/my'),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  reply: (id, data) => api.put(`/reviews/${id}/reply`, data),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

export const serviceAPI = {
  getAll: (params) => api.get('/services', { params }),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

export const favoriteAPI = {
  getAll: () => api.get('/favorites'),
  toggle: (businessId) => api.post('/favorites/toggle', { businessId }),
  check: (businessId) => api.get(`/favorites/check/${businessId}`),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markOneRead: (id) => api.put(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Note: No admin API — the system has two roles only: customer and business_owner
