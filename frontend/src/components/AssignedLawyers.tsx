import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { caseAPI } from '../lib/api';
import { UserPlus, X, Users } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

interface AssignedLawyersProps {
  caseId: string;
  assignedLawyers: any[];
}

export function AssignedLawyers({ caseId, assignedLawyers }: AssignedLawyersProps) {
  const { user } = useAuthStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLawyerId, setSelectedLawyerId] = useState('');
  const [role, setRole] = useState('');
  const queryClient = useQueryClient();

  // Only PARTNER and above can assign lawyers
  const canManageLawyers = ['SUPER_ADMIN', 'SENIOR_PARTNER', 'PARTNER'].includes(user?.role || '');

  // Fetch all users (lawyers) in the firm
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'https://legaledge-backend-production.up.railway.app/api',
      });
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      return api.get('/users');
    },
    enabled: showAddForm,
  });

  const assignMutation = useMutation({
    mutationFn: (data: { lawyerId: string; role?: string }) =>
      caseAPI.assignLawyer(caseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setShowAddForm(false);
      setSelectedLawyerId('');
      setRole('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to assign lawyer');
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (lawyerId: string) => caseAPI.unassignLawyer(caseId, lawyerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to unassign lawyer');
    },
  });

  const handleAssign = () => {
    if (!selectedLawyerId) {
      alert('Please select a lawyer');
      return;
    }

    assignMutation.mutate({ lawyerId: selectedLawyerId, role });
  };

  const handleUnassign = (lawyerId: string) => {
    if (confirm('Remove this lawyer from the case?')) {
      unassignMutation.mutate(lawyerId);
    }
  };

  // Filter out already assigned lawyers
  const availableLawyers = usersData?.data?.users?.filter((user: any) =>
    ['SUPER_ADMIN', 'SENIOR_PARTNER', 'PARTNER', 'ASSOCIATE'].includes(user.role) &&
    !assignedLawyers.some((a: any) => a.lawyer.id === user.id)
  ) || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold">Assigned Lawyers</h3>
        </div>
        {canManageLawyers && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-900 text-white rounded-md hover:bg-blue-800"
          >
            <UserPlus size={16} />
            Assign Lawyer
          </button>
        )}
      </div>

      {/* Add Lawyer Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          {usersData ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Lawyer *
                </label>
                <select
                  value={selectedLawyerId}
                  onChange={(e) => setSelectedLawyerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a lawyer...</option>
                  {availableLawyers.length === 0 ? (
                    <option value="" disabled>No available lawyers to assign</option>
                  ) : (
                    availableLawyers.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))
                  )}
                </select>
                {availableLawyers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    All approved users have been assigned to this case
                  </p>
                )}
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role on Case (Optional)
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Lead Counsel, Co-Counsel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedLawyerId('');
                  setRole('');
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assignMutation.isPending || !selectedLawyerId || availableLawyers.length === 0}
                className="px-4 py-2 text-sm bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Loading available lawyers...
            </div>
          )}
        </div>
      )}

      {/* Assigned Lawyers List */}
      {assignedLawyers.length === 0 ? (
        <p className="text-sm text-gray-500">No lawyers assigned to this case yet</p>
      ) : (
        <ul className="space-y-2">
          {assignedLawyers.map((assignment: any) => (
            <li
              key={assignment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {assignment.lawyer.firstName} {assignment.lawyer.lastName}
                </p>
                <p className="text-xs text-gray-500">{assignment.lawyer.role}</p>
                {assignment.role && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Role:</span> {assignment.role}
                  </p>
                )}
              </div>
              {canManageLawyers && (
                <button
                  onClick={() => handleUnassign(assignment.lawyer.id)}
                  disabled={unassignMutation.isPending}
                  className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  title="Remove lawyer"
                >
                  <X size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
