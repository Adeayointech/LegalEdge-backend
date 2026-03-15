import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hearingAPI } from '../lib/api';
import { Calendar, MapPin, User, Plus, Trash2, FileText, Edit2, Bell } from 'lucide-react';
import { CreateHearing } from './CreateHearing';
import { ReminderSettings } from './ReminderSettings';

interface HearingListProps {
  caseId: string;
}

export function HearingList({ caseId }: HearingListProps) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editHearing, setEditHearing] = useState<any>(null);
  const [reminderHearing, setReminderHearing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['hearings', caseId],
    queryFn: () => hearingAPI.getAll({ caseId }),
  });

  const deleteMutation = useMutation({
    mutationFn: hearingAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hearings'] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to delete hearing');
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const hearings = data?.data?.hearings || [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  if (showCreate) {
    return (
      <CreateHearing
        caseId={caseId}
        onSuccess={() => setShowCreate(false)}
        onCancel={() => setShowCreate(false)}
      />
    );
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading hearings...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Hearings</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800"
        >
          <Plus className="w-4 h-4" />
          Add Hearing
        </button>
      </div>

      {/* Hearing List */}
      {hearings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No hearings scheduled</p>
          <p className="text-sm text-gray-500 mt-1">Add your first hearing to track court appearances</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hearings.map((hearing: any) => {
            const upcoming = isUpcoming(hearing.hearingDate);

            return (
              <div
                key={hearing.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition ${
                  upcoming ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Calendar className={`w-5 h-5 ${upcoming ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{hearing.title}</h4>
                          {upcoming && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                              Upcoming
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {formatDate(hearing.hearingDate)} at {formatTime(hearing.hearingDate)}
                            </span>
                          </div>

                          {hearing.courtRoom && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>Court Room: {hearing.courtRoom}</span>
                            </div>
                          )}

                          {hearing.judgeName && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>Judge: {hearing.judgeName}</span>
                            </div>
                          )}

                          {hearing.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <strong>Notes:</strong> {hearing.notes}
                            </div>
                          )}

                          {hearing.outcome && (
                            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                              <div className="flex items-center gap-1 mb-1">
                                <FileText className="w-3 h-3" />
                                <strong>Outcome:</strong>
                              </div>
                              <p>{hearing.outcome}</p>
                            </div>
                          )}

                          {hearing.nextHearingDate && (
                            <div className="mt-2 text-blue-700">
                              <strong>Next Hearing:</strong> {formatDate(hearing.nextHearingDate)}
                            </div>
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
                        setReminderHearing(hearing);
                      }}
                      type="button"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                      title="Reminder Settings"
                    >
                      <Bell className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditHearing(hearing);
                      }}
                      type="button"
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(hearing.id, hearing.title)}
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

      {/* Create/Edit Hearing Modal */}
      {(showCreate || editHearing) && (
        <CreateHearing
          caseId={caseId}
          hearing={editHearing}
          onClose={() => {
            setShowCreate(false);
            setEditHearing(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
            queryClient.invalidateQueries({ queryKey: ['case', caseId] });
            setShowCreate(false);
            setEditHearing(null);
          }}
        />
      )}

      {/* Reminder Settings Modal */}
      {reminderHearing && (
        <ReminderSettings
          deadlineId={reminderHearing.id}
          currentSettings={{
            reminderEnabled: reminderHearing.reminderEnabled || true,
            reminderDays: Array.isArray(reminderHearing.reminderDays) 
              ? reminderHearing.reminderDays 
              : [1, 3, 7],
          }}
          onClose={() => setReminderHearing(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
          }}
          isHearing={true}
        />
      )}
    </div>
  );
}
