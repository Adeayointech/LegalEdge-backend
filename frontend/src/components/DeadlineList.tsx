import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deadlineAPI } from '../lib/api';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Trash2, Bell, Edit2, Download } from 'lucide-react';
import { CreateDeadline } from './CreateDeadline';
import { ReminderSettings } from './ReminderSettings';

interface DeadlineListProps {
  caseId: string;
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  MISSED: 'bg-red-100 text-red-800 border-red-300',
  EXTENDED: 'bg-blue-100 text-blue-800 border-blue-300',
};

const STATUS_ICONS = {
  PENDING: Clock,
  COMPLETED: CheckCircle,
  MISSED: XCircle,
  EXTENDED: AlertCircle,
};

const DEADLINE_TYPES = {
  FILING_DEADLINE: 'Filing Deadline',
  RESPONSE_DEADLINE: 'Response Deadline',
  HEARING_DATE: 'Hearing Date',
  JUDGMENT_DATE: 'Judgment Date',
  APPEAL_DEADLINE: 'Appeal Deadline',
  SUBMISSION_DEADLINE: 'Submission Deadline',
  OTHER: 'Other',
};

export function DeadlineList({ caseId }: DeadlineListProps) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editDeadline, setEditDeadline] = useState<any>(null);
  const [filter, setFilter] = useState({ status: '' });
  const [reminderDeadline, setReminderDeadline] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['deadlines', caseId, filter],
    queryFn: () => deadlineAPI.getAll({ caseId, ...filter }),
  });

  const markCompleteMutation = useMutation({
    mutationFn: deadlineAPI.markComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deadlineAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to delete deadline');
    },
  });

  const handleMarkComplete = (id: string, title: string) => {
    if (window.confirm(`Mark "${title}" as completed?`)) {
      markCompleteMutation.mutate(id);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await deadlineAPI.exportCSV({ caseId, status: filter.status || undefined });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `deadlines-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const deadlines = data?.data?.deadlines || [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntil = (date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (showCreate) {
    return (
      <CreateDeadline
        caseId={caseId}
        onSuccess={() => setShowCreate(false)}
        onCancel={() => setShowCreate(false)}
      />
    );
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading deadlines...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Deadlines</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
          >
            <Plus className="w-4 h-4" />
            Add Deadline
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="MISSED">Missed</option>
          <option value="EXTENDED">Extended</option>
        </select>
      </div>

      {/* Deadline List */}
      {deadlines.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No deadlines found</p>
          <p className="text-sm text-gray-500 mt-1">Add your first deadline to track important dates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deadlines.map((deadline: any) => {
            const StatusIcon = STATUS_ICONS[deadline.status as keyof typeof STATUS_ICONS];
            const daysUntil = getDaysUntil(deadline.dueDate);
            const isUrgent = daysUntil <= 3 && deadline.status === 'PENDING';
            const isPast = daysUntil < 0 && deadline.status === 'PENDING';

            return (
              <div
                key={deadline.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition ${
                  isUrgent ? 'border-red-300 bg-red-50' : isPast ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <StatusIcon className={`w-5 h-5 ${isPast ? 'text-red-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{deadline.title}</h4>
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[deadline.status as keyof typeof STATUS_COLORS]}`}>
                            {deadline.status}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            {DEADLINE_TYPES[deadline.deadlineType as keyof typeof DEADLINE_TYPES]}
                          </span>
                        </div>
                        
                        {deadline.description && (
                          <p className="text-sm text-gray-600 mb-2">{deadline.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {formatDate(deadline.dueDate)}</span>
                          </div>
                          {deadline.status === 'PENDING' && (
                            <span className={`font-medium ${isPast ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-700'}`}>
                              {isPast ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days remaining`}
                            </span>
                          )}
                          {deadline.completedDate && (
                            <span className="text-green-600">
                              Completed: {formatDate(deadline.completedDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setReminderDeadline(deadline);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                      title="Reminder settings"
                      type="button"
                    >
                      <Bell className={`w-5 h-5 ${deadline.reminderEnabled ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditDeadline(deadline);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition"
                      title="Edit deadline"
                      type="button"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {deadline.status === 'PENDING' && (
                      <button
                        onClick={() => handleMarkComplete(deadline.id, deadline.title)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-md transition"
                        title="Mark as completed"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(deadline.id, deadline.title)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
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

      {/* Create/Edit Deadline Modal */}
      {(showCreate || editDeadline) && (
        <CreateDeadline
          caseId={caseId}
          deadline={editDeadline}
          onClose={() => {
            setShowCreate(false);
            setEditDeadline(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['deadlines'] });
            setShowCreate(false);
            setEditDeadline(null);
          }}
        />
      )}

      {/* Reminder Settings Modal */}
      {reminderDeadline && (
        <ReminderSettings
          deadlineId={reminderDeadline.id}
          currentSettings={{
            reminderEnabled: reminderDeadline.reminderEnabled || false,
            reminderDays: Array.isArray(reminderDeadline.reminderDays) 
              ? reminderDeadline.reminderDays 
              : [1, 3, 7],
          }}
          onClose={() => setReminderDeadline(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['deadlines'] });
          }}
        />
      )}
    </div>
  );
}
