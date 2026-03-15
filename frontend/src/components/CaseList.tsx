import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { caseAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { FileText, Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSelectedBranch } from './BranchSelector';

export function CaseList() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showMyOnly, setShowMyOnly] = useState(false);
  const selectedBranchId = useSelectedBranch();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['cases', debouncedSearch, statusFilter, selectedBranchId, showMyOnly],
    queryFn: () => caseAPI.getAll({ 
      search: debouncedSearch, 
      status: statusFilter || undefined,
      branchId: selectedBranchId || undefined,
      assignedToMe: showMyOnly ? 'true' : undefined,
    }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Failed to load cases
      </div>
    );
  }

  const cases = data?.data?.cases || [];

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 heading-font">Cases</h2>
          <p className="text-gray-600 mt-1">Manage and track all your legal cases</p>
        </div>
        {['SENIOR_PARTNER', 'PARTNER', 'ASSOCIATE'].includes(user?.role || '') && (
          <Link
            to="/cases/new"
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-all shadow-sm hover:shadow font-medium"
          >
            <Plus size={20} />
            New Case
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex gap-1">
        <button
          onClick={() => setShowMyOnly(false)}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            !showMyOnly
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          All Cases
        </button>
        <button
          onClick={() => setShowMyOnly(true)}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            showMyOnly
              ? 'bg-blue-900 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          My Cases
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search cases by title, suit number, plaintiff, defendant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition text-base"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-6 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent font-medium transition"
        >
          <option value="">All Statuses</option>
          <option value="PRE_TRIAL">Pre-Trial</option>
          <option value="ONGOING">Ongoing</option>
          <option value="JUDGMENT">Judgment</option>
          <option value="APPEAL">Appeal</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-gray-400" size={40} />
          </div>
          <p className="text-gray-600 text-lg font-medium">No cases found</p>
          <p className="text-gray-500 text-sm mt-1 mb-6">Start by creating your first case</p>
          <Link
            to="/cases/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-all font-medium shadow-sm hover:shadow"
          >
            <Plus size={18} />
            Create your first case
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 table-professional">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Case Information
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Resources
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {cases.map((caseItem: any) => (
                <tr key={caseItem.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{caseItem.title}</div>
                    {caseItem.suitNumber && (
                      <div className="text-sm text-gray-600 font-mono mt-1">{caseItem.suitNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {caseItem.client.clientType === 'CORPORATE'
                      ? caseItem.client.companyName
                      : `${caseItem.client.firstName} ${caseItem.client.lastName}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {caseItem.caseType.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full ${
                        caseItem.status === 'ONGOING'
                          ? 'bg-emerald-100 text-emerald-800'
                          : caseItem.status === 'PRE_TRIAL'
                          ? 'bg-blue-100 text-blue-800'
                          : caseItem.status === 'CLOSED'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {caseItem.status.replace('_', '-')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <FileText size={16} className="text-blue-600" />
                        <span className="font-semibold">{caseItem._count.documents}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      to={`/cases/${caseItem.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-all font-medium shadow-sm hover:shadow"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
