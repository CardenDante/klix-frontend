import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  health: () => apiClient.get('/health'),

  auth: {
    register: (data: { email: string; password: string; first_name?: string; last_name?: string; phone_number?: string }) => 
      apiClient.post('/api/v1/auth/register', data),
    firebaseLogin: (idToken: string) => 
      apiClient.post('/api/v1/auth/firebase-login', { id_token: idToken }),
    logout: () => apiClient.post('/api/v1/auth/logout'),
    me: () => apiClient.get('/api/v1/auth/me'),
    passwordReset: (email: string) => apiClient.post('/api/v1/auth/password-reset', { email }),
  },

  events: {
    list: (params?: any) => apiClient.get('/api/v1/events', { params }),
    get: (id: string) => apiClient.get(`/api/v1/events/${id}`),
    getBySlug: (slug: string) => apiClient.get(`/api/v1/events/slug/${slug}`),
    create: (data: any) => apiClient.post('/api/v1/events', data),
    update: (id: string, data: any) => apiClient.patch(`/api/v1/events/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/v1/events/${id}`),
    publish: (id: string) => apiClient.post(`/api/v1/events/${id}/publish`),
    unpublish: (id: string) => apiClient.post(`/api/v1/events/${id}/unpublish`),
    myEvents: (params?: any) => apiClient.get('/api/v1/events/my-events', { params }),
  },

  tickets: {
    purchase: (data: any) => apiClient.post('/api/v1/tickets/purchase', data),
    confirm: (transactionId: string, mpesaReceipt?: string) => 
      apiClient.post(`/api/v1/tickets/confirm/${transactionId}`, null, { params: { mpesa_receipt: mpesaReceipt } }),
    cancel: (transactionId: string) => apiClient.post(`/api/v1/tickets/cancel/${transactionId}`),
    myTickets: (eventId?: string) => apiClient.get('/api/v1/tickets/my-tickets', { params: { event_id: eventId } }),
    get: (id: string) => apiClient.get(`/api/v1/tickets/${id}`),
    validateQR: (qrData: string, eventId: string) => 
      apiClient.post('/api/v1/tickets/validate-qr', null, { params: { qr_data: qrData, event_id: eventId } }),
    checkIn: (qrData: string, eventId: string, location?: string) => 
      apiClient.post('/api/v1/tickets/checkin', null, { params: { qr_data: qrData, event_id: eventId, location } }),
    types: {
      list: (eventId: string, includeInactive?: boolean) => 
        apiClient.get(`/api/v1/tickets/events/${eventId}/ticket-types`, { params: { include_inactive: includeInactive } }),
      create: (eventId: string, data: any) => apiClient.post(`/api/v1/tickets/events/${eventId}/ticket-types`, data),
      update: (id: string, data: any) => apiClient.patch(`/api/v1/tickets/ticket-types/${id}`, data),
      delete: (id: string) => apiClient.delete(`/api/v1/tickets/ticket-types/${id}`),
    },
  },

  recommendations: {
    forYou: (params?: any) => apiClient.get('/api/v1/recommendations/for-you', { params }),
    similar: (eventId: string, limit?: number) => apiClient.get(`/api/v1/recommendations/similar/${eventId}`, { params: { limit } }),
    trending: (params?: any) => apiClient.get('/api/v1/recommendations/trending', { params }),
    popular: (params?: any) => apiClient.get('/api/v1/recommendations/popular', { params }),
    discovery: () => apiClient.get('/api/v1/recommendations/discovery'),
    preferences: {
      get: () => apiClient.get('/api/v1/recommendations/preferences'),
      update: (data: any) => apiClient.put('/api/v1/recommendations/preferences', data),
    },
  },

  search: {
    events: (params: any) => apiClient.get('/api/v1/search/', { params }),
    suggestions: (q: string, limit?: number) => apiClient.get('/api/v1/search/suggestions', { params: { q, limit } }),
    facets: (q?: string) => apiClient.get('/api/v1/search/facets', { params: { q } }),
    popular: (limit?: number) => apiClient.get('/api/v1/search/popular', { params: { limit } }),
    nearby: (params: any) => apiClient.get('/api/v1/search/nearby', { params }),
  },

  users: {
    me: () => apiClient.get('/api/v1/users/me'),
    updateProfile: (data: any) => apiClient.patch('/api/v1/users/me', data),
    updatePreferences: (data: any) => apiClient.patch('/api/v1/users/me/preferences', data),
    getById: (userId: string) => apiClient.get(`/api/v1/users/${userId}`),
  },

  analytics: {
    organizer: {
      dashboard: () => apiClient.get('/api/v1/analytics/organizer/dashboard'),
      eventStats: (eventId: string) => apiClient.get(`/api/v1/analytics/organizer/events/${eventId}/stats`),
      revenue: (params?: any) => apiClient.get('/api/v1/analytics/organizer/revenue', { params }),
      velocity: (eventId: string) => apiClient.get(`/api/v1/analytics/organizer/events/${eventId}/velocity`),
      topPromoters: (limit?: number) => apiClient.get('/api/v1/analytics/organizer/promoters', { params: { limit } }),
      clearCache: () => apiClient.post('/api/v1/analytics/organizer/cache/clear'),
    },
    promoter: {
      dashboard: () => apiClient.get('/api/v1/analytics/promoter/dashboard'),
      commission: () => apiClient.get('/api/v1/analytics/promoter/commission'),
      codePerformance: (codeId: string) => apiClient.get(`/api/v1/analytics/promoter/codes/${codeId}/performance`),
      leaderboard: (params?: any) => apiClient.get('/api/v1/analytics/promoter/leaderboard', { params }),
      clearCache: () => apiClient.post('/api/v1/analytics/promoter/cache/clear'),
    },
  },

  loyalty: {
    balance: () => apiClient.get('/api/v1/loyalty/balance'),
    transactions: () => apiClient.get('/api/v1/loyalty/transactions'),
    available: () => apiClient.get('/api/v1/loyalty/credits/available'),
    expiring: () => apiClient.get('/api/v1/loyalty/credits/expiring'),
    summary: () => apiClient.get('/api/v1/loyalty/summary'),
  },

  promoter: {
    createCode: (data: any) => apiClient.post('/api/v1/promoters/codes', data),
    myCodes: (params?: any) => apiClient.get('/api/v1/promoters/my-codes', { params }),
    codeAnalytics: (codeId: string) => apiClient.get(`/api/v1/promoters/code/${codeId}/analytics`),
    deactivateCode: (codeId: string) => apiClient.post(`/api/v1/promoters/code/${codeId}/deactivate`),
    leaderboard: (params?: any) => apiClient.get('/api/v1/promoters/leaderboard', { params }),
    shareLink: (codeId: string, data: any) => apiClient.post(`/api/v1/promoters/codes/${codeId}/share`, data),
    earnings: () => apiClient.get('/api/v1/promoters/earnings'),
    withdraw: (data: any) => apiClient.post('/api/v1/promoters/withdraw', data),
    withdrawals: (limit?: number) => apiClient.get('/api/v1/promoters/withdrawals', { params: { limit } }),
    insights: () => apiClient.get('/api/v1/promoters/insights'),
  },

  payments: {
    initiateMpesa: (transactionId: string) => 
      apiClient.post(`/api/v1/payments/initiate-mpesa`, null, { params: { transaction_id: transactionId } }),
    queryStatus: (transactionId: string) => 
      apiClient.get(`/api/v1/payments/query-status/${transactionId}`),
    getTransactionStatus: (transactionId: string) => 
      apiClient.get(`/api/v1/payments/transaction/${transactionId}`),
  },

  admin: {
    statistics: () => apiClient.get('/api/v1/admin/statistics'),
    
    users: {
      list: (params?: any) => apiClient.get('/api/v1/admin/users', { params }),
      get: (userId: string) => apiClient.get(`/api/v1/admin/users/${userId}`),
      delete: (userId: string, reason: string) => 
        apiClient.delete(`/api/v1/admin/users/${userId}`, { params: { reason } }),
      updateRole: (userId: string, data: any) => 
        apiClient.patch(`/api/v1/admin/users/${userId}/role`, data),
      suspend: (userId: string, data: any) => 
        apiClient.post(`/api/v1/admin/users/${userId}/suspend`, data),
    },
    
    organizers: {
      list: (params?: any) => apiClient.get('/api/v1/admin/organizers', { params }),
      pending: (params?: any) => apiClient.get('/api/v1/admin/organizers/pending', { params }),
      approve: (organizerId: string, data?: any) => 
        apiClient.post(`/api/v1/admin/organizers/${organizerId}/approve`, data || {}),
      reject: (organizerId: string, data: any) => 
        apiClient.post(`/api/v1/admin/organizers/${organizerId}/reject`, data),
      suspend: (organizerId: string, data: any) => 
        apiClient.post(`/api/v1/admin/organizers/${organizerId}/suspend`, data),
    },
    
    events: {
      flag: (eventId: string, data: any) => 
        apiClient.post(`/api/v1/admin/events/${eventId}/flag`, data),
      unflag: (eventId: string, data: any) => 
        apiClient.post(`/api/v1/admin/events/${eventId}/unflag`, data),
      forceDelete: (eventId: string, data: any) => 
        apiClient.delete(`/api/v1/admin/events/${eventId}/force-delete`, { data }),
    },
    
    auditLogs: (params?: any) => apiClient.get('/api/v1/admin/audit-logs', { params }),
    
    analytics: {
      overview: () => apiClient.get('/api/v1/analytics/admin/overview'),
      summary: () => apiClient.get('/api/v1/analytics/admin/summary'),
      userGrowth: () => apiClient.get('/api/v1/analytics/admin/users/growth'),
      revenue: () => apiClient.get('/api/v1/analytics/admin/revenue'),
      topOrganizers: (params?: any) => 
        apiClient.get('/api/v1/analytics/admin/organizers/top', { params }),
      topEvents: (params?: any) => 
        apiClient.get('/api/v1/analytics/admin/events/top', { params }),
      categories: () => apiClient.get('/api/v1/analytics/admin/categories'),
      systemHealth: () => apiClient.get('/api/v1/analytics/admin/system/health'),
      clearCache: () => apiClient.post('/api/v1/analytics/admin/cache/clear'),
    },

    promoters: {
      stats: () => apiClient.get('/api/v1/admin/promoters/stats'),
      applications: () => apiClient.get('/api/v1/admin/promoters/applications'),
      active: () => apiClient.get('/api/v1/admin/promoters/active'),
      approve: (applicationId: string) => 
        apiClient.post(`/api/v1/admin/promoters/applications/${applicationId}/approve`),
      reject: (applicationId: string, data: { reason: string }) => 
        apiClient.post(`/api/v1/admin/promoters/applications/${applicationId}/reject`, data),
      deactivate: (promoterId: string) => 
        apiClient.post(`/api/v1/admin/promoters/${promoterId}/deactivate`),
    },
  },
};

export default apiClient;