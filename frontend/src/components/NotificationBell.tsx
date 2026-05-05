import { useState, useRef } from 'react';
import { Bell, X, CheckCheck, ArrowRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../lib/notificationApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../hooks/useSocket';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch notifications once on mount (no polling — socket handles live updates)
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await notificationAPI.getNotifications(50);
      return response.data as Notification[];
    },
    staleTime: Infinity, // Don't auto-refetch — socket keeps it fresh
  });

  // Show only top 6 notifications in dropdown
  const displayNotifications = notifications?.slice(0, 6) || [];
  const hasMore = (notifications?.length || 0) > 6;

  // Fetch unread count once on mount (no polling)
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await notificationAPI.getUnreadCount();
      return response.data;
    },
    staleTime: Infinity,
  });

  const unreadCount = unreadData?.count || 0;

  // Listen for real-time notifications via WebSocket
  useSocket((newNotification) => {
    // Prepend new notification to the list
    queryClient.setQueryData(['notifications'], (old: Notification[] | undefined) => {
      return [newNotification, ...(old || [])];
    });
    // Increment unread count
    queryClient.setQueryData(['notifications', 'unread-count'], (old: any) => ({
      count: (old?.count || 0) + 1,
    }));
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const getDropdownPosition = () => {
    if (!buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
    };
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      DEADLINE_REMINDER: '📅',
      DEADLINE_OVERDUE: '🚨',
      SUPPORT_TICKET: '🎫',
      USER_APPROVAL: '👤',
      CASE_ASSIGNED: '⚖️',
      DOCUMENT_UPLOADED: '📄',
      HEARING_REMINDER: '⚖️',
      GENERAL: '🔔',
    };
    return icons[type] || '🔔';
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to related entity if available
    if (notification.entityType && notification.entityId) {
      switch (notification.entityType) {
        case 'Case':
          navigate(`/cases/${notification.entityId}`);
          break;
        case 'Deadline':
          navigate('/cases');
          break;
        case 'SupportTicket':
          // Deep link to specific ticket on profile page
          navigate('/profile', { state: { scrollToTicket: notification.entityId } });
          break;
        case 'User':
          navigate('/users');
          break;
        default:
          break;
      }
    }

    setShowDropdown(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showDropdown && createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setShowDropdown(false)}
            />
            <div
              className="fixed w-96 max-h-[600px] bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 z-[9999] flex flex-col"
              style={getDropdownPosition()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      className="p-1 text-amber-400 hover:text-amber-300 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {!notifications || notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <>
                    {displayNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-white/10 cursor-pointer transition-colors ${
                          notification.isRead 
                            ? 'hover:bg-slate-800/50' 
                            : 'bg-amber-500/10 hover:bg-amber-500/20'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white text-sm">
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-slate-300 text-sm line-clamp-2">
                              {notification.message}
                            </p>
                            <span className="text-xs text-slate-500 mt-2 block">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* See All Button */}
                    {(hasMore || notifications.length > 0) && (
                      <div className="p-3 border-t border-white/10">
                        <button
                          onClick={() => {
                            navigate('/notifications');
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors"
                        >
                          <span className="text-sm font-medium">See all notifications</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    </>
  );
}
