import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Building2, Users, Ticket, Filter, MessageSquare, CheckCircle, Clock, XCircle, Eye, Calendar, AlertCircle } from 'lucide-react';

export function PlatformAdmin() {
  const queryClient = useQueryClient();
  const [selectedFirm, setSelectedFirm] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [viewingFirmId, setViewingFirmId] = useState<string | null>(null);

  // Fetch platform stats
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await api.get('/platform-admin/stats');
      return res.data;
    },
  });

  // Fetch all firms
  const { data: firmsData } = useQuery({
    queryKey: ['platform-firms'],
    queryFn: async () => {
      const res = await api.get('/platform-admin/firms');
      return res.data;
    },
  });

  const firms = firmsData?.firms || [];

  // Fetch firm details
  const { data: firmDetails } = useQuery({
    queryKey: ['firm-details', viewingFirmId],
    queryFn: async () => {
      const res = await api.get(`/platform-admin/firms/${viewingFirmId}`);
      return res.data;
    },
    enabled: !!viewingFirmId,
  });

  // Fetch all support tickets
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['platform-tickets', selectedFirm, selectedStatus, selectedPriority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFirm !== 'all') params.append('firmId', selectedFirm);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedPriority !== 'all') params.append('priority', selectedPriority);
      
      const res = await api.get(`/platform-admin/tickets?${params.toString()}`);
      return res.data;
    },
  });

  const tickets = ticketsData?.tickets || [];

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, status, response }: { ticketId: string; status?: string; response?: string }) => {
      return await api.put(`/platform-admin/tickets/${ticketId}`, { status, response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
      setRespondingTo(null);
      setResponse('');
      setNewStatus('');
      alert('Ticket updated successfully!');
    },
    onError: () => {
      alert('Failed to update ticket');
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRespond = (ticketId: string) => {
    if (!response.trim()) {
      alert('Please enter a response');
      return;
    }

    updateTicketMutation.mutate({
      ticketId,
      response,
      status: newStatus || undefined,
    });
  };

  const statusColors = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };

  const priorityColors = {
    URGENT: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    LOW: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Manage all chambers and support tickets</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Chambers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalFirms || 0}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalTickets || 0}</p>
            </div>
            <Ticket className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.openTickets || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Firms Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Registered Chambers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chamber Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {firms.map((firm: any) => (
                <tr key={firm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{firm.name}</div>
                    <div className="text-sm text-gray-500">{firm.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {firm.users[0] ? `${firm.users[0].firstName} ${firm.users[0].lastName}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div>{firm.phone}</div>
                    {firm.users[0] && <div className="text-gray-500">{firm.users[0].email}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      {firm._count.users}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {firm._count.branches}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {formatDate(firm.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setViewingFirmId(firm.id)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Support Ticket Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chamber</label>
            <select
              value={selectedFirm}
              onChange={(e) => setSelectedFirm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Chambers</option>
              {firms.map((firm: any) => (
                <option key={firm.id} value={firm.id}>
                  {firm.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tickets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>From:</strong> {ticket.user.firstName} {ticket.user.lastName} ({ticket.user.email})</p>
                        <p><strong>Role:</strong> {ticket.user.role}</p>
                        {ticket.user.firm && <p><strong>Chamber:</strong> {ticket.user.firm.name}</p>}
                        <p><strong>Submitted:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md mb-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                  </div>

                  {ticket.response ? (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-3">
                      <p className="text-sm font-medium text-green-900 mb-1">Your Response:</p>
                      <p className="text-sm text-green-800 whitespace-pre-wrap">{ticket.response}</p>
                      <p className="text-xs text-green-600 mt-2">
                        Responded on {new Date(ticket.respondedAt).toLocaleString()}
                      </p>
                    </div>
                  ) : null}

                  {respondingTo === ticket.id ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                        <textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Type your response..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Keep current status</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(ticket.id)}
                          disabled={updateTicketMutation.isPending}
                          className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50"
                        >
                          {updateTicketMutation.isPending ? 'Sending...' : 'Send Response'}
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTo(null);
                            setResponse('');
                            setNewStatus('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(ticket.id)}
                      className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 text-sm"
                    >
                      {ticket.response ? 'Update Response' : 'Respond to Ticket'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Firm Details Modal */}
      {viewingFirmId && firmDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">{firmDetails.name} - Details</h2>
              <button
                onClick={() => setViewingFirmId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Firm Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Firm Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{firmDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{firmDetails.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{firmDetails.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Joined</p>
                    <p className="font-medium text-gray-900">{formatDate(firmDetails.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Staff</p>
                    <p className="font-medium text-gray-900">{firmDetails._count.users} users</p>
                  </div>
                </div>
              </div>

              {/* Branches */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Branches ({firmDetails._count.branches})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {firmDetails.branches.map((branch: any) => (
                    <div key={branch.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-900">{branch.name}</p>
                      <p className="text-sm text-gray-600">Code: {branch.code}</p>
                      <p className="text-sm text-gray-600">{branch.city}, {branch.state}</p>
                      <p className="text-sm text-gray-500 mt-2">{branch._count.users} staff members</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff Members */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Staff Members ({firmDetails.users.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {firmDetails.users.map((user: any) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            <div className="text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {user.role.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {user.branch?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.isActive && user.isApproved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.isActive && user.isApproved ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
