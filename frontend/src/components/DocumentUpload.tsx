import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../lib/api';
import { Upload, X, FileText } from 'lucide-react';

interface DocumentUploadProps {
  caseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DOCUMENT_TYPES = [
  'COMPLAINT', 'MOTION', 'BRIEF', 'AFFIDAVIT', 'EXHIBIT', 'PLEADING',
  'DISCOVERY_REQUEST', 'DISCOVERY_RESPONSE', 'DEPOSITION', 'SUBPOENA',
  'COURT_ORDER', 'JUDGMENT', 'APPEAL', 'CONTRACT', 'CORRESPONDENCE',
  'INVOICE', 'RECEIPT', 'EVIDENCE', 'OTHER'
];

const DOCUMENT_STATUSES = [
  'DRAFT', 'READY_TO_FILE', 'FILED', 'SERVED', 'REJECTED'
];

export function DocumentUpload({ caseId, onSuccess, onCancel }: DocumentUploadProps) {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentType: 'OTHER',
    status: 'DRAFT',
    filedDate: '',
    filedBy: '',
  });

  const uploadMutation = useMutation({
    mutationFn: (data: FormData) => documentAPI.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      console.error('Upload error:', err);
      console.error('Error response:', err.response);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to upload document';
      setError(errorMsg);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    // Check file size (50MB max per file)
    const oversized = files.filter(f => f.size > 50 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`File(s) too large (max 50MB): ${oversized.map(f => f.name).join(', ')}`);
      return;
    }
    
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      const newFiles = files.filter(f => !existing.has(f.name + f.size));
      return [...prev, ...newFiles];
    });
    setError('');
    
    // Auto-fill title from first file if empty
    if (!formData.title && files[0]) {
      const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    if (!formData.title && selectedFiles.length === 1) {
      setError('Please enter a document title');
      return;
    }

    // Upload files sequentially
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const data = new FormData();
      data.append('file', file);
      data.append('caseId', caseId);
      // Use form title for single file, filename for multiple
      data.append('title', selectedFiles.length === 1 ? formData.title : file.name.replace(/\.[^/.]+$/, ''));
      data.append('documentType', formData.documentType);
      data.append('status', formData.status);
      if (formData.description) data.append('description', formData.description);
      if (formData.filedDate) data.append('filedDate', formData.filedDate);
      if (formData.filedBy) data.append('filedBy', formData.filedBy);
      await uploadMutation.mutateAsync(data);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-slate-700">
      <h3 className="text-2xl font-bold text-white heading-font mb-6">Upload Document</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            dragActive ? 'border-amber-500 bg-amber-500/10' : 'border-slate-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFiles.length > 0 ? (
            <div className="space-y-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-700/50 p-3 rounded">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-amber-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-medium text-white text-sm">{file.name}</p>
                      <p className="text-xs text-gray-300">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 cursor-pointer mt-1">
                <Upload className="w-4 h-4" />
                Add more files
                <input type="file" multiple onChange={handleFileInput} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt" />
              </label>
            </div>
          ) : (
            <div>
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-300 mb-2">Drag and drop a file here, or click to select</p>
              <p className="text-sm text-gray-400 mb-4">
                PDF, Word, Excel, Images, Text (Max 50MB)
              </p>
              <label className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-lg cursor-pointer hover:from-amber-400 hover:to-yellow-500 font-semibold transition-all shadow-lg">
                Choose Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                />
              </label>
            </div>
          )}
        </div>
        
        {/* Document Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Document Title {selectedFiles.length <= 1 ? '*' : '(optional — filename used for multiple files)'}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required={selectedFiles.length <= 1}
              placeholder="e.g., Motion to Dismiss"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Document Type *
            </label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
            >
              {DOCUMENT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
            >
              {DOCUMENT_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of the document..."
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-gray-400"
            />
          </div>
          
          {/* Filing Details (shown when status is FILED) */}
          {(formData.status === 'FILED' || formData.status === 'SERVED') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Filed Date
                </label>
                <input
                  type="date"
                  name="filedDate"
                  value={formData.filedDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Filed By
                </label>
                <input
                  type="text"
                  name="filedBy"
                  value={formData.filedBy}
                  onChange={handleChange}
                  placeholder="Person who filed"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-gray-400"
                />
              </div>
            </>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={uploadMutation.isPending || selectedFiles.length === 0}
            className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 py-2 px-4 rounded-lg hover:from-amber-400 hover:to-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
          >
            {uploadMutation.isPending ? `Uploading${selectedFiles.length > 1 ? ` (${selectedFiles.length} files)` : ''}...` : `Upload ${selectedFiles.length > 1 ? selectedFiles.length + ' Documents' : 'Document'}`}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700/50 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
