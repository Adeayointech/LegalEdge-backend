import axios from './axios';

export const documentAPI = {
  upload: (formData: FormData) => axios.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  getAll: (params?: {
    caseId?: string;
    documentType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => axios.get('/documents', { params }),
  
  getById: (id: string) => axios.get(`/documents/${id}`),
  
  download: (id: string, version?: number) => 
    axios.get(`/documents/${id}/download`, {
      params: version ? { version } : undefined,
      responseType: 'blob',
    }),
  
  updateStatus: (id: string, data: {
    status: string;
    filedDate?: string;
    filedBy?: string;
  }) => axios.patch(`/documents/${id}/status`, data),
  
  uploadNewVersion: (id: string, formData: FormData) =>
    axios.post(`/documents/${id}/version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  delete: (id: string) => axios.delete(`/documents/${id}`),
  
  getFilingStats: (caseId?: string) =>
    axios.get('/documents/stats/filing', { params: caseId ? { caseId } : undefined }),
};
