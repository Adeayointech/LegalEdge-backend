import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deadlineAPI } from '../lib/api';
import { Calendar, X } from 'lucide-react';

interface CreateDeadlineProps {
  caseId: string;
  deadline?: any; // For editing existing deadline
  onSuccess?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

const DEADLINE_TYPES = [
  { value: 'FILING_DEADLINE', label: 'Filing Deadline' },
  { value: 'RESPONSE_DEADLINE', label: 'Response Deadline' },
  { value: 'HEARING_DATE', label: 'Hearing Date' },
  { value: 'JUDGMENT_DATE', label: 'Judgment Date' },
  { value: 'APPEAL_DEADLINE', label: 'Appeal Deadline' },
  { value: 'SUBMISSION_DEADLINE', label: 'Submission Deadline' },
  { value: 'OTHER', label: 'Other' },
];

export function CreateDeadline({ caseId, deadline, onSuccess, onCancel, onClose }: CreateDeadlineProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const isEditing = !!deadline;
  
  const [formData, setFormData] = useState({
    title: deadline?.title || '',
    description: deadline?.description || '',
    deadlineType: deadline?.deadlineType || 'OTHER',
    dueDate: deadline?.dueDate ? deadline.dueDate.split('T')[0] : '',
    reminderDays: deadline?.reminderDays || [3, 1, 0],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => 
      isEditing 
        ? deadlineAPI.update(deadline.id, data)
        : deadlineAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} deadline`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.dueDate) {
      setError('Title and due date are required');
      return;
    }

    if (formData.reminderDays.length === 0) {
      setError('Please select at least one reminder day');
      return;
    }

    createMutation.mutate({
      ...formData,
      caseId,
      reminderDays: formData.reminderDays,
    });
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Deadline' : 'Add Deadline'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="E.g., File response to motion"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline Type
          </label>
          <select
            value={formData.deadlineType}
            onChange={(e) => setFormData({ ...formData, deadlineType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEADLINE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Days
          </label>
          <div className="space-y-2">
            {[
              { value: 7, label: '7 days before' },
              { value: 3, label: '3 days before' },
              { value: 1, label: '1 day before' },
              { value: 0, label: 'Same day' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminderDays.includes(option.value)}
                  onChange={(e) => {
                    const newReminderDays = e.target.checked
                      ? [...formData.reminderDays, option.value].sort((a, b) => b - a)
                      : formData.reminderDays.filter((d: number) => d !== option.value);
                    setFormData({ ...formData, reminderDays: newReminderDays });
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {formData.reminderDays.length === 0 
              ? 'Select at least one reminder' 
              : `You'll receive ${formData.reminderDays.length} notification${formData.reminderDays.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Add any additional details..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Deadline'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
