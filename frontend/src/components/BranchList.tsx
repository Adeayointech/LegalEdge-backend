import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchAPI } from '../lib/api';
import { Building2, Plus, Edit, Trash2, MapPin, Users, Briefcase, X } from 'lucide-react';

export function BranchList() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchAPI.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to delete branch');
    },
  });

  const handleDelete = (branch: any) => {
    if (confirm(`Are you sure you want to delete branch "${branch.name}"?`)) {
      deleteMutation.mutate(branch.id);
    }
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingBranch(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white heading-font">Branch Management</h2>
          <p className="text-slate-400 mt-1">Manage your law firm's office locations</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold shadow-lg hover:shadow-amber-500/50"
        >
          <Plus className="w-5 h-5" />
          Add Branch
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <CreateBranchForm
          branch={editingBranch}
          onClose={handleCloseForm}
          onSuccess={handleCloseForm}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Loading branches...</p>
        </div>
      )}

      {/* Branches Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches?.data?.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No branches yet</p>
              <p className="text-sm text-gray-500 mt-1">Create your first branch to get started</p>
            </div>
          ) : (
            branches?.data?.map((branch: any) => (
              <div
                key={branch.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  branch.isHeadquarters ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                      <span className="text-sm font-medium text-gray-500">{branch.code}</span>
                    </div>
                  </div>
                  {branch.isHeadquarters && (
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                      HQ
                    </span>
                  )}
                </div>

                {/* Address */}
                {(branch.address || branch.city || branch.state) && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      {branch.address && <div>{branch.address}</div>}
                      {(branch.city || branch.state) && (
                        <div>
                          {branch.city}
                          {branch.city && branch.state && ', '}
                          {branch.state}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact */}
                {(branch.phone || branch.email) && (
                  <div className="text-sm text-gray-600 mb-4 space-y-1">
                    {branch.phone && <div>📞 {branch.phone}</div>}
                    {branch.email && <div>📧 {branch.email}</div>}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 py-3 border-t border-gray-200 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {branch._count?.users || 0} users
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {branch._count?.cases || 0} cases
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      branch.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit branch"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Create/Edit Branch Form Component
function CreateBranchForm({ branch, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: branch?.name || '',
    code: branch?.code || '',
    address: branch?.address || '',
    city: branch?.city || '',
    state: branch?.state || '',
    phone: branch?.phone || '',
    email: branch?.email || '',
    isHeadquarters: branch?.isHeadquarters || false,
    isActive: branch?.isActive ?? true,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => branchAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to create branch');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => branchAPI.update(branch.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update branch');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      alert('Branch name and code are required');
      return;
    }

    if (branch) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {branch ? 'Edit Branch' : 'Create New Branch'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Lagos Office"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="e.g., LAG"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+234 123 456 7890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="branch@lawfirm.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 py-4 border-t border-gray-200">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isHeadquarters"
              checked={formData.isHeadquarters}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Mark as Headquarters
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : branch ? 'Update Branch' : 'Create Branch'}
          </button>
        </div>
      </form>
    </div>
  );
}
