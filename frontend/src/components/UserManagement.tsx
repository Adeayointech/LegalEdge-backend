import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  UserMinus,
  UserPlus,
  Shield,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isApproved: boolean;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  createdAt: string;
  lastLoginAt?: string;
}

const roleDisplayNames: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SENIOR_PARTNER: 'Senior Partner',
  PARTNER: 'Partner',
  ASSOCIATE: 'Associate',
  PARALEGAL: 'Paralegal',
  SECRETARY: 'Secretary',
  CLIENT: 'Client',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  SENIOR_PARTNER: 'bg-blue-100 text-blue-800',
  PARTNER: 'bg-green-100 text-green-800',
  ASSOCIATE: 'bg-yellow-100 text-yellow-800',
  PARALEGAL: 'bg-orange-100 text-orange-800',
  SECRETARY: 'bg-pink-100 text-pink-800',
  CLIENT: 'bg-gray-100 text-gray-800',
};

export function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Check if current user can manage users
  const canManageUsers = ['SUPER_ADMIN', 'SENIOR_PARTNER', 'PARTNER'].includes(
    currentUser?.role || ''
  );

  const canManageRoles = ['SUPER_ADMIN', 'SENIOR_PARTNER'].includes(
    currentUser?.role || ''
  );

  // Fetch all users
  const { data: usersData, isLoading, error: queryError } = useQuery({
    queryKey: ['users', 'management'],
    queryFn: async () => {
      console.log('[USER MANAGEMENT] Fetching users...');
      const response = await api.get('/users/management/all');
      console.log('[USER MANAGEMENT] Response:', response.data);
      return response;
    },
    enabled: canManageUsers,
  });

  console.log('[USER MANAGEMENT] Can manage users:', canManageUsers);
  console.log('[USER MANAGEMENT] Users data:', usersData);
  console.log('[USER MANAGEMENT] Query error:', queryError);

  // Fetch branches
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches');
      return response;
    },
    enabled: canManageUsers,
  });

  const branches = branchesData?.data || [];

  // Approve user mutation
  const approveMutation = useMutation({
    mutationFn: ({ userId, branchId }: { userId: string; branchId?: string }) => 
      api.post(`/users/${userId}/approve`, { branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowApproveModal(false);
      setSelectedUser(null);
      setSelectedBranch('');
    },
  });

  // Reject user mutation
  const rejectMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Deactivate user mutation
  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Reactivate user mutation
  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
      alert('Role updated successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update role');
    },
  });

  const handleApprove = (user: User) => {
    setSelectedUser(user);
    setSelectedBranch(user.branchId || '');
    setShowApproveModal(true);
  };

  const confirmApprove = () => {
    if (!selectedUser) return;
    
    // For non-admin roles, require branch assignment
    if (!['SUPER_ADMIN', 'SENIOR_PARTNER'].includes(selectedUser.role) && !selectedBranch) {
      alert('Please assign a branch for non-admin users');
      return;
    }
    
    approveMutation.mutate({ 
      userId: selectedUser.id, 
      branchId: selectedBranch || undefined 
    });
  };

  const handleReject = (userId: string) => {
    if (
      confirm(
        'Reject this user? Their account will be permanently deleted and they will need to sign up again.'
      )
    ) {
      rejectMutation.mutate(userId);
    }
  };

  const handleDeactivate = (userId: string) => {
    if (
      confirm(
        'Deactivate this user? They will not be able to log in until reactivated.'
      )
    ) {
      deactivateMutation.mutate(userId);
    }
  };

  const handleReactivate = (userId: string) => {
    if (confirm('Reactivate this user? They will be able to log in again.')) {
      reactivateMutation.mutate(userId);
    }
  };

  const handleChangeRole = (user: User) => {
    console.log('[CHANGE ROLE] Button clicked for user:', user);
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
    console.log('[CHANGE ROLE] Modal should now be visible');
  };

  const handleRoleUpdate = () => {
    if (!selectedUser) {
      alert('No user selected');
      return;
    }
    
    if (!newRole) {
      alert('Please select a role');
      return;
    }
    
    if (newRole === selectedUser.role) {
      alert('User already has this role');
      setShowRoleModal(false);
      return;
    }

    updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
  };

  if (!canManageUsers) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        You do not have permission to manage users.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error loading users</p>
        <p className="text-sm mt-1">{(queryError as any)?.response?.data?.error || (queryError as any)?.message || 'Unknown error'}</p>
      </div>
    );
  }

  const users: User[] = usersData?.data?.users || [];
  
  console.log('[USER MANAGEMENT] Processed users:', users.length, users);
  console.log('[USER MANAGEMENT] showRoleModal:', showRoleModal);
  console.log('[USER MANAGEMENT] selectedUser:', selectedUser);
  console.log('[USER MANAGEMENT] showApproveModal:', showApproveModal);
  
  const pendingUsers = users.filter((u) => !u.isApproved);
  const activeUsers = users.filter((u) => u.isApproved && u.isActive);
  const deactivatedUsers = users.filter((u) => u.isApproved && !u.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white heading-font">User Management</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="text-2xl font-bold text-orange-600">{pendingUsers.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{activeUsers.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Deactivated</p>
              <p className="text-2xl font-bold text-red-600">{deactivatedUsers.length}</p>
            </div>
            <UserMinus className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">
              Pending Approvals ({pendingUsers.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Signed up: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(user)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Users */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        roleColors[user.role] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {roleDisplayNames[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.branch?.name || 'No branch'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.role !== 'SUPER_ADMIN' && (
                      <div className="flex gap-2">
                        {canManageRoles && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleChangeRole(user);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            type="button"
                          >
                            <Shield size={18} />
                          </button>
                        )}
                        {(currentUser?.role === 'SUPER_ADMIN' ||
                          currentUser?.role === 'SENIOR_PARTNER') && (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            disabled={deactivateMutation.isPending}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <UserMinus size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivated Users */}
      {deactivatedUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Deactivated Users</h3>
          </div>
          <div className="space-y-3 p-4">
            {deactivatedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-red-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      roleColors[user.role] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {roleDisplayNames[user.role] || user.role}
                  </span>
                </div>
                {(currentUser?.role === 'SUPER_ADMIN' ||
                  currentUser?.role === 'SENIOR_PARTNER') && (
                  <button
                    onClick={() => handleReactivate(user.id)}
                    disabled={reactivateMutation.isPending}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
                  >
                    <UserPlus size={16} />
                    Reactivate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Role for {selectedUser.firstName} {selectedUser.lastName}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SENIOR_PARTNER">Senior Partner</option>
                <option value="PARTNER">Partner</option>
                <option value="ASSOCIATE">Associate</option>
                <option value="SECRETARY">Secretary</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRoleUpdate}
                disabled={updateRoleMutation.isPending}
                className="flex-1 bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-blue-800 disabled:opacity-50"
              >
                Update Role
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setNewRole('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve User Modal */}
      {showApproveModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Approve User: {selectedUser.firstName} {selectedUser.lastName}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Email: {selectedUser.email}</p>
              <p className="text-sm text-gray-600 mb-4">
                Role: <span className="font-medium">{roleDisplayNames[selectedUser.role]}</span>
              </p>
              
              {!['SUPER_ADMIN', 'SENIOR_PARTNER'].includes(selectedUser.role) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a branch...</option>
                    {branches.map((branch: any) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Non-admin users must be assigned to a branch
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmApprove}
                disabled={approveMutation.isPending}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Approve User
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedUser(null);
                  setSelectedBranch('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
