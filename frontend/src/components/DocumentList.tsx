import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../lib/api';
import { Download, FileText, Trash2, Clock, CheckCircle, XCircle, Pencil, X } from 'lucide-react';

interface DocumentListProps {
  caseId: string;
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  READY_TO_FILE: 'bg-yellow-100 text-yellow-800',
  FILED: 'bg-green-100 text-green-800',
  SERVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const STATUS_ICONS = {
  DRAFT: Clock,
  READY_TO_FILE: CheckCircle,
  FILED: CheckCircle,
  SERVED: CheckCircle,
  REJECTED: XCircle,
};

export function DocumentList({ caseId }: DocumentListProps) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({
    documentType: '',
    status: '',
    search: '',
  });
  const [statusModal, setStatusModal] = useState<{ docId: string; title: string; currentStatus: string } | null>(null);
  const [statusForm, setStatusForm] = useState({ status: '', filedDate: '', filedBy: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['documents', caseId, filter],
    queryFn: () => documentAPI.getAll({
      caseId,
      ...filter,
      limit: 100,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: documentAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 'Failed to delete document';
      alert(`Error: ${errorMsg}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentAPI.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['filing-stats', caseId] });
      setStatusModal(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update status');
    },
  });

  const openStatusModal = (doc: any) => {
    setStatusForm({
      status: doc.status,
      filedDate: doc.filedDate ? new Date(doc.filedDate).toISOString().split('T')[0] : '',
      filedBy: doc.filedBy || '',
    });
    setStatusModal({ docId: doc.id, title: doc.title, currentStatus: doc.status });
  };

  const handleStatusSave = () => {
    if (!statusModal) return;
    updateStatusMutation.mutate({
      id: statusModal.docId,
      data: {
        status: statusForm.status,
        filedDate: statusForm.filedDate || undefined,
        filedBy: statusForm.filedBy || undefined,
      },
    });
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const response = await documentAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const documents = data?.data?.documents || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-300">Loading documents...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search documents..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-gray-400"
        />
        <select
          value={filter.documentType}
          onChange={(e) => setFilter({ ...filter, documentType: e.target.value })}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
        >
          <option value="">All Types</option>
          <option value="COMPLAINT">Complaint</option>
          <option value="MOTION">Motion</option>
          <option value="BRIEF">Brief</option>
          <option value="AFFIDAVIT">Affidavit</option>
          <option value="EXHIBIT">Exhibit</option>
          <option value="PLEADING">Pleading</option>
          <option value="COURT_ORDER">Court Order</option>
          <option value="JUDGMENT">Judgment</option>
          <option value="CONTRACT">Contract</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="READY_TO_FILE">Ready to File</option>
          <option value="FILED">Filed</option>
          <option value="SERVED">Served</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Document List */}
      {documents.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-300">No documents found</p>
          <p className="text-sm text-gray-400 mt-1">Upload your first document to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc: any) => {
            const StatusIcon = STATUS_ICONS[doc.status as keyof typeof STATUS_ICONS];
            const currentVersion = doc.versions?.[0]?.versionNumber || 1;
            
            return (
              <div
                key={doc.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 hover:shadow-lg hover:border-amber-500/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white truncate">
                          {doc.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status as keyof typeof STATUS_COLORS]}`}>
                          {doc.status.replace(/_/g, ' ')}
                        </span>
                        {currentVersion > 1 && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            v{currentVersion}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{doc.documentType.replace(/_/g, ' ')}</p>
                      {doc.description && (
                        <p className="text-sm text-gray-400 mb-2">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{doc.fileName}</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>Uploaded {formatDate(doc.createdAt)}</span>
                        <span>by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                      </div>
                      {doc.filedDate && (
                        <div className="mt-2 text-xs text-gray-300">
                          <strong>Filed:</strong> {formatDate(doc.filedDate)}
                          {/* Filing number not available */}
                          {doc.filedBy && ` • by ${doc.filedBy}`}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDownload(doc.id, doc.fileName)}
                      className="p-2 text-amber-400 hover:bg-slate-700/50 rounded-md transition"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openStatusModal(doc)}
                      className="p-2 text-blue-400 hover:bg-slate-700/50 rounded-md transition"
                      title="Change Status"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="p-2 text-red-400 hover:bg-slate-700/50 rounded-md transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Change Status Modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Change Document Status</h3>
              <button onClick={() => setStatusModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-400 truncate">{statusModal.title}</p>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="READY_TO_FILE">Ready to File</option>
                  <option value="FILED">Filed</option>
                  <option value="SERVED">Served</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {(statusForm.status === 'FILED' || statusForm.status === 'SERVED') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Filed Date</label>
                    <input
                      type="date"
                      value={statusForm.filedDate}
                      onChange={(e) => setStatusForm({ ...statusForm, filedDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Filed By</label>
                    <input
                      type="text"
                      value={statusForm.filedBy}
                      onChange={(e) => setStatusForm({ ...statusForm, filedBy: e.target.value })}
                      placeholder="Name of person who filed"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-700">
              <button
                onClick={() => setStatusModal(null)}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusSave}
                disabled={updateStatusMutation.isPending}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
