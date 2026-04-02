import { api } from './api';

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
