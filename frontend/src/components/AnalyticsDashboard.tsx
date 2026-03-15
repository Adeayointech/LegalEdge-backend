import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, branchAPI } from '../lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, FileText, Calendar, Building2, Clock, CheckCircle } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export function AnalyticsDashboard() {
  const [branchId, setBranchId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch branches for filter
  const { data: branchesData } = useQuery({
    queryKey: ['branches', true],
    queryFn: () => branchAPI.getAll({ isActive: true }),
  });

  const branches = branchesData?.data || [];

  // Fetch analytics
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', branchId, startDate, endDate],
    queryFn: () => analyticsAPI.getAnalytics({ branchId, startDate, endDate }),
  });

  const analytics = analyticsData?.data || {
    cases: { byStatus: [], byType: [], overTime: [], avgDuration: 0 },
    documents: { byType: [], byStatus: [], overTime: [] },
    deadlines: { byStatus: [], overdue: 0, upcoming: 0, completedOnTime: 0, completedLate: 0, complianceRate: 0 },
    hearings: { byOutcome: [] },
    branches: [],
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading analytics...</div>
        </div>
      </div>
    );
  }

  // Format data for charts
  const caseStatusData = analytics.cases.byStatus.map((item: any) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
  }));

  const caseTypeData = analytics.cases.byType.map((item: any) => ({
    name: item.type,
    value: item.count,
  }));

  const documentTypeData = analytics.documents.byType.map((item: any) => ({
    name: item.type,
    count: item.count,
  }));

  const documentStatusData = analytics.documents.byStatus.map((item: any) => ({
    name: item.status,
    value: item.count,
  }));

  const casesTimeData = analytics.cases.overTime.map((item: any) => ({
    month: item.month,
    cases: item.count,
  }));

  const documentsTimeData = analytics.documents.overTime.map((item: any) => ({
    month: item.month,
    documents: item.count,
  }));

  // Merge timeline data
  const timelineData = casesTimeData.map((item: any) => {
    const docData = documentsTimeData.find((d: any) => d.month === item.month);
    return {
      month: item.month,
      cases: item.cases,
      documents: docData?.documents || 0,
    };
  });

  const deadlineComplianceData = [
    { name: 'On Time', value: analytics.deadlines.completedOnTime, color: '#10B981' },
    { name: 'Late', value: analytics.deadlines.completedLate, color: '#F59E0B' },
    { name: 'Overdue', value: analytics.deadlines.overdue, color: '#EF4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 heading-font">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2 text-base">Comprehensive insights and performance metrics for your law firm</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Branch
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 transition"
            >
              <option value="">All Branches</option>
              {branches.map((branch: any) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 transition"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Cases</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {analytics.cases.byStatus.reduce((sum: number, item: any) => sum + item.count, 0)}
              </p>
            </div>
            <div className="bg-blue-200 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-900" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide">Total Documents</p>
              <p className="text-3xl font-bold text-emerald-900 mt-2">
                {analytics.documents.byType.reduce((sum: number, item: any) => sum + item.count, 0)}
              </p>
            </div>
            <div className="bg-emerald-200 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-emerald-900" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm border border-amber-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 uppercase tracking-wide">Upcoming Deadlines</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">{analytics.deadlines.upcoming}</p>
            </div>
            <div className="bg-amber-200 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-amber-900" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 uppercase tracking-wide">Avg Duration</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{analytics.cases.avgDuration}<span className="text-lg ml-1">days</span></p>
            </div>
            <div className="bg-purple-200 p-3 rounded-lg">
              <Clock className="w-8 h-8 text-purple-900" />
            </div>
          </div>
        </div>
      </div>

      {/* Deadline Compliance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 heading-font flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
            Deadline Compliance
          </h2>
          <div className="text-right">
            <div className="text-4xl font-bold text-green-600">{analytics.deadlines.complianceRate}%</div>
            <div className="text-sm text-gray-600 font-medium">Completion Rate</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{analytics.deadlines.completedOnTime}</div>
            <div className="text-sm text-gray-600">Completed On Time</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{analytics.deadlines.completedLate}</div>
            <div className="text-sm text-gray-600">Completed Late</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{analytics.deadlines.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </div>
        {deadlineComplianceData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={deadlineComplianceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deadlineComplianceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Cases and Documents Over Time */}
      {timelineData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cases & Documents Trend (Last 12 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cases" stroke="#3B82F6" strokeWidth={2} name="Cases" />
              <Line type="monotone" dataKey="documents" stroke="#10B981" strokeWidth={2} name="Documents" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cases by Status */}
        {caseStatusData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cases by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {caseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cases by Type */}
        {caseTypeData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cases by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caseTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6">
                  {caseTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Documents by Type */}
        {documentTypeData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={documentTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Documents by Status */}
        {documentStatusData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents by Filing Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Branch Statistics */}
      {!branchId && analytics.branches.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Branch Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.branches.map((branch: any) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {branch.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {branch._count.cases}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {branch._count.users}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
