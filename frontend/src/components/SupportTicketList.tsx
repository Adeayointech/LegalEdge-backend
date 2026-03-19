import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  response?: string;
  createdAt: string;
  respondedAt?: string;
}

interface Props {
  tickets: Ticket[];
  ticketRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

export function SupportTicketList({ tickets, ticketRefs }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const filteredTickets = tickets.filter(
    (ticket) => statusFilter === 'all' || ticket.status === statusFilter
  );

  const getStatusCount = (status: string) =>
    tickets.filter((t) => t.status === status).length;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">My Support Tickets</h2>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${
                statusFilter === 'all'
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${
                statusFilter === 'OPEN'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Open ({getStatusCount('OPEN')})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress ({getStatusCount('IN_PROGRESS')})
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition ${
                statusFilter === 'RESOLVED'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved ({getStatusCount('RESOLVED')})
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No support tickets yet</p>
            <p className="text-sm mt-1">Submit a request if you need help</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No {statusFilter.toLowerCase().replace('_', ' ')} tickets</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                ref={(el) => (ticketRefs.current[ticket.id] = el)}
                className={`border-l-4 rounded-lg p-4 transition-all ${
                  ticket.status === 'OPEN'
                    ? 'border-blue-500 bg-blue-50/30'
                    : ticket.status === 'IN_PROGRESS'
                    ? 'border-yellow-500 bg-yellow-50/30'
                    : ticket.status === 'RESOLVED'
                    ? 'border-green-500 bg-green-50/30'
                    : 'border-gray-300 bg-gray-50/30'
                } hover:shadow-md`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                      {ticket.response && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                          ✓ Replied
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(ticket.createdAt).toLocaleDateString()} • {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex flex-row sm:flex-col gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        ticket.status === 'OPEN'
                          ? 'bg-blue-100 text-blue-800'
                          : ticket.status === 'IN_PROGRESS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : ticket.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        ticket.priority === 'URGENT'
                          ? 'bg-red-100 text-red-800'
                          : ticket.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : ticket.priority === 'MEDIUM'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-white rounded-md p-3 mb-3 border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                </div>

                {/* Response */}
                {ticket.response && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-md shadow-sm">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900">Support Team Response</p>
                        {ticket.respondedAt && (
                          <p className="text-xs text-green-700 mt-0.5">
                            {new Date(ticket.respondedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-green-900 whitespace-pre-wrap">{ticket.response}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-400">Ticket #{ticket.id.slice(-8)}</p>
                  {!ticket.response && ticket.status === 'OPEN' && (
                    <p className="text-xs text-gray-500 italic">Waiting for support...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
