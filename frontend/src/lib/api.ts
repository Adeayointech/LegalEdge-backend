import axios from 'axios';

// Force production backend URL
const API_URL = import.meta.env.VITE_API_URL || 'https://legaledge-backend-production.up.railway.app/api';

console.log('🚀 API_URL configured as:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  setupTwoFactor: () => api.post('/auth/setup-2fa'),
  enableTwoFactor: (token: string) => api.post('/auth/enable-2fa', { token }),
  disableTwoFactor: (token: string) => api.post('/auth/disable-2fa', { token }),
};

// Case API
export const caseAPI = {
  create: (data: any) => api.post('/cases', data),
  getAll: (params?: any) => api.get('/cases', { params }),
  getById: (id: string) => api.get(`/cases/${id}`),
  update: (id: string, data: any) => api.put(`/cases/${id}`, data),
  delete: (id: string) => api.delete(`/cases/${id}`),
  assignLawyer: (id: string, data: any) => api.post(`/cases/${id}/assign-lawyer`, data),
  unassignLawyer: (id: string, lawyerId: string) => api.delete(`/cases/${id}/assign-lawyer/${lawyerId}`),
  getStats: () => api.get('/cases/stats'),
  exportCSV: (params?: { status?: string; caseType?: string }) =>
    api.get('/cases/export/csv', { params, responseType: 'blob' }),
};

// Client API
export const clientAPI = {
  create: (data: any) => api.post('/clients', data),
  getAll: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// Document API
export const documentAPI = {
  upload: (formData: FormData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  getAll: (params?: {
    caseId?: string;
    documentType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/documents', { params }),
  
  getById: (id: string) => api.get(`/documents/${id}`),
  
  download: (id: string, version?: number) => 
    api.get(`/documents/${id}/download`, {
      params: version ? { version } : undefined,
      responseType: 'blob',
    }),
  
  updateStatus: (id: string, data: {
    status: string;
    filedDate?: string;
    filedBy?: string;
  }) => api.patch(`/documents/${id}/status`, data),
  
  uploadNewVersion: (id: string, formData: FormData) =>
    api.post(`/documents/${id}/version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  delete: (id: string) => api.delete(`/documents/${id}`),
  
  getFilingStats: (caseId?: string) =>
    api.get('/documents/stats/filing', { params: caseId ? { caseId } : undefined }),
};

// Firm API
export const firmAPI = {
  getDetails: () => api.get('/firm/details'),
  getCaseStats: () => api.get('/cases/stats'),
  getDeadlineStats: () => api.get('/deadlines/stats'),
  getDocumentStats: () => api.get('/documents/stats'),
};

// Deadline API
export const deadlineAPI = {
  create: (data: any) => api.post('/deadlines', data),
  
  getAll: (params?: {
    caseId?: string;
    status?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/deadlines', { params }),
  
  getById: (id: string) => api.get(`/deadlines/${id}`),
  
  update: (id: string, data: any) => api.put(`/deadlines/${id}`, data),
  
  markComplete: (id: string) => api.patch(`/deadlines/${id}/complete`),
  
  delete: (id: string) => api.delete(`/deadlines/${id}`),

  exportCSV: (params?: { caseId?: string; status?: string }) =>
    api.get('/deadlines/export/csv', { params, responseType: 'blob' }),
};

// Hearing API
export const hearingAPI = {
  create: (data: any) => api.post('/hearings', data),
  
  getAll: (params?: {
    caseId?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
  }) => api.get('/hearings', { params }),
  
  getById: (id: string) => api.get(`/hearings/${id}`),
  
  update: (id: string, data: any) => api.put(`/hearings/${id}`, data),
  
  delete: (id: string) => api.delete(`/hearings/${id}`),
};

// Calendar API
export const calendarAPI = {
  getEvents: (params: { year?: number; month?: number; start?: string; end?: string }) =>
    api.get('/calendar/events', { params }),
};

// Audit Log API
export const auditLogAPI = {
  getAll: (params?: {
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/audit-logs', { params }),
  
  getById: (id: string) => api.get(`/audit-logs/${id}`),
  
  getStats: () => api.get('/audit-logs/stats'),
};

// Branch API
export const branchAPI = {
  create: (data: any) => api.post('/branches', data),
  
  getAll: (params?: { isActive?: boolean }) => api.get('/branches', { params }),
  
  getById: (id: string) => api.get(`/branches/${id}`),
  
  update: (id: string, data: any) => api.put(`/branches/${id}`, data),
  
  delete: (id: string) => api.delete(`/branches/${id}`),
};

// Search API
export const searchAPI = {
  globalSearch: (params?: {
    query?: string;
    searchType?: 'all' | 'cases' | 'documents' | 'clients';
    status?: string;
    caseType?: string;
    documentType?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get('/search', { params }),
};

// Analytics API
export const analyticsAPI = {
  getAnalytics: (params?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
  }) => api.get('/analytics', { params }),
};
