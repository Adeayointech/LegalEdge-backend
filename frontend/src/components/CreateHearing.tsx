import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hearingAPI } from '../lib/api';
import { Calendar, X } from 'lucide-react';

interface CreateHearingProps {
  caseId: string;
  hearing?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function CreateHearing({ caseId, hearing, onSuccess, onCancel, onClose }: CreateHearingProps) {
  const queryClient = useQueryClient();
  const isEditing = !!hearing;
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: hearing?.title || '',
    hearingDate: hearing?.hearingDate ? hearing.hearingDate.split('T')[0] : '',
    hearingTime: hearing?.hearingDate ? new Date(hearing.hearingDate).toTimeString().slice(0, 5) : '',
    courtRoom: hearing?.courtRoom || '',
    judgeName: hearing?.judgeName || '',
    notes: hearing?.notes || '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEditing) {
        return hearingAPI.update(hearing.id, data);
      }
      return hearingAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hearings'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || `Failed to ${isEditing ? 'update' : 'create'} hearing`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.hearingDate) {
      setError('Title and hearing date are required');
      return;
    }

    // Combine date and time
    const hearingDateTime = formData.hearingTime
      ? `${formData.hearingDate}T${formData.hearingTime}`
      : `${formData.hearingDate}T09:00`;

    createMutation.mutate({
      caseId,
      title: formData.title,
      hearingDate: hearingDateTime,
      courtRoom: formData.courtRoom,
      judgeName: formData.judgeName,
      notes: formData.notes,
    });
  };

  const handleClose = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Hearing' : 'Add Hearing'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hearing Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="E.g., Hearing on Motion for Stay"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hearing Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.hearingDate}
              onChange={(e) => setFormData({ ...formData, hearingDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={formData.hearingTime}
              onChange={(e) => setFormData({ ...formData, hearingTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Court Room
            </label>
            <input
              type="text"
              value={formData.courtRoom}
              onChange={(e) => setFormData({ ...formData, courtRoom: e.target.value })}
              placeholder="E.g., Court Room 5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judge Name
            </label>
            <input
              type="text"
              value={formData.judgeName}
              onChange={(e) => setFormData({ ...formData, judgeName: e.target.value })}
              placeholder="E.g., Hon. Justice Smith"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Add any preparation notes or details..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-lg flex-shrink-0 border-t border-gray-200">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
          >
            {createMutation.isPending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Hearing' : 'Create Hearing')}
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
