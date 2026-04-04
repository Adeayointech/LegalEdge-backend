import { useQuery } from '@tanstack/react-query';
import { billingAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED';

interface BillingStatus {
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  gracePeriodEndsAt: string | null;
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SubscriptionBanner() {
  const { user } = useAuthStore();

  const { data: billing } = useQuery<BillingStatus>({
    queryKey: ['billing-status'],
    queryFn: async () => {
      const res = await billingAPI.getStatus();
      return res.data;
    },
    enabled: !!user?.firmId && user?.role !== 'PLATFORM_ADMIN',
    staleTime: 5 * 60 * 1000,
  });

  if (!billing) return null;

  const { subscriptionStatus, trialEndsAt, gracePeriodEndsAt } = billing;

  // ACTIVE — no banner needed
  if (subscriptionStatus === 'ACTIVE') return null;

  // TRIAL — only show when ≤ 7 days left AND trialEndsAt is known
  if (subscriptionStatus === 'TRIAL') {
    if (!trialEndsAt) return null; // date not set yet — don't show misleading banner
    const days = daysUntil(trialEndsAt);
    if (days > 7) return null;
    return (
      <div className="bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Your free trial ends in <strong>{days} day{days !== 1 ? 's' : ''}</strong>.
          </span>
        </div>
        <Link
          to="/billing"
          className="shrink-0 bg-white text-blue-700 font-semibold px-3 py-1 rounded-md hover:bg-blue-50 transition"
        >
          Subscribe
        </Link>
      </div>
    );
  }

  // GRACE_PERIOD
  if (subscriptionStatus === 'GRACE_PERIOD') {
    const days = daysUntil(gracePeriodEndsAt);
    return (
      <div className="bg-amber-500/90 backdrop-blur-sm text-slate-900 px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Subscription expired. Your account will be locked in <strong>{days} day{days !== 1 ? 's' : ''}</strong>.
          </span>
        </div>
        <Link
          to="/billing"
          className="shrink-0 bg-slate-900 text-white font-semibold px-3 py-1 rounded-md hover:bg-slate-800 transition"
        >
          Renew Now
        </Link>
      </div>
    );
  }

  // EXPIRED / CANCELLED
  if (subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'CANCELLED') {
    return (
      <div className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Your subscription has expired. Access is restricted.</span>
        </div>
        <Link
          to="/billing"
          className="shrink-0 bg-white text-red-700 font-semibold px-3 py-1 rounded-md hover:bg-red-50 transition"
        >
          Reactivate
        </Link>
      </div>
    );
  }

  return null;
}
