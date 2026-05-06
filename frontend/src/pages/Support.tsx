import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  adminResponse?: string;
  resolvedAt?: string;
}

const priorityColors: Record<Priority, string> = {
  LOW: 'bg-slate-500/20 text-slate-300',
  MEDIUM: 'bg-blue-500/20 text-blue-300',
  HIGH: 'bg-amber-500/20 text-amber-300',
  URGENT: 'bg-red-500/20 text-red-300',
};

const statusColors: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-500/20 text-blue-300',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-300',
  RESOLVED: 'bg-green-500/20 text-green-300',
  CLOSED: 'bg-slate-500/20 text-slate-400',
};

export function SupportPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get('/support/my-tickets').then(r => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const tickets: Ticket[] = data?.tickets || [];

  // When user visits Support, mark all tickets with admin responses as "seen"
  useEffect(() => {
    if (tickets.length === 0) return;
    const respondedIds = tickets.filter(t => t.adminResponse).map(t => t.id);
    if (respondedIds.length === 0) return;
    const current: string[] = JSON.parse(localStorage.getItem('seenSupportReplies') || '[]');
    const updated = [...new Set([...current, ...respondedIds])];
    localStorage.setItem('seenSupportReplies', JSON.stringify(updated));
    // Invalidate so the sidebar badge re-computes
    queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
  }, [tickets.length]);

  const createMutation = useMutation({
    mutationFn: () => api.post('/support', { subject, message, priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setSubject('');
      setMessage('');
      setPriority('MEDIUM');
      setShowForm(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-slate-400 text-sm mt-0.5">Raise a ticket and our team will get back to you.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">New Support Ticket</h2>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              placeholder="Brief description of your issue"
              className="w-full px-3 py-2 bg-slate-700/60 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Describe your issue in detail…"
              className="w-full px-3 py-2 bg-slate-700/60 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="px-3 py-2 bg-slate-700/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {createMutation.isPending ? 'Submitting…' : 'Submit Ticket'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-slate-300 hover:text-white rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-red-400 text-xs">Failed to submit ticket. Please try again.</p>
          )}
        </form>
      )}

      {/* Tickets list */}
      {isLoading ? (
        <div className="text-slate-400 text-sm text-center py-10">Loading tickets…</div>
      ) : tickets.length === 0 ? (
        <div className="bg-slate-800/40 border border-white/10 rounded-xl p-10 text-center">
          <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
          </svg>
          <p className="text-slate-400 text-sm">No tickets yet. Click <span className="text-amber-400">New Ticket</span> to get help.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{ticket.subject}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === ticket.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedId === ticket.id && (
                <div className="px-5 pb-5 space-y-3 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Your message</p>
                    <p className="text-slate-200 text-sm whitespace-pre-wrap">{ticket.message}</p>
                  </div>
                  {ticket.adminResponse && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-xs text-amber-400 mb-1 font-medium">Response from support</p>
                      <p className="text-slate-200 text-sm whitespace-pre-wrap">{ticket.adminResponse}</p>
                    </div>
                  )}
                  {ticket.resolvedAt && (
                    <p className="text-xs text-green-400">Resolved on {new Date(ticket.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
