import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, AlertTriangle, Clock, XCircle } from 'lucide-react';

type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED';

interface BillingStatus {
  id: string;
  name: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  gracePeriodEndsAt: string | null;
  lastPaymentAt: string | null;
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function BillingPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: billing, isLoading } = useQuery<BillingStatus>({
    queryKey: ['billing-status'],
    queryFn: async () => {
      const res = await billingAPI.getStatus();
      return res.data;
    },
    enabled: !!user?.firmId,
  });

  // After Paystack redirects back with ?ref=...
  const verifyMutation = useMutation({
    mutationFn: (ref: string) => billingAPI.verifyPayment(ref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      navigate('/billing', { replace: true });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref') || params.get('reference') || params.get('trxref');
    if (ref) {
      verifyMutation.mutate(ref);
    }
  }, [location.search]);

  const payMutation = useMutation({
    mutationFn: () => billingAPI.initializePayment(),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!billing) return null;

  const { subscriptionStatus } = billing;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const statusConfig: Record<SubscriptionStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    TRIAL: {
      label: 'Free Trial',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: <Clock className="w-5 h-5 text-blue-400" />,
    },
    ACTIVE: {
      label: 'Active',
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/30',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
    },
    GRACE_PERIOD: {
      label: 'Grace Period',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    },
    EXPIRED: {
      label: 'Expired',
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
      icon: <XCircle className="w-5 h-5 text-red-400" />,
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
      icon: <XCircle className="w-5 h-5 text-red-400" />,
    },
  };

  const cfg = statusConfig[subscriptionStatus];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>

      {/* Verify payment loading */}
      {verifyMutation.isPending && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
          Verifying your payment, please wait…
        </div>
      )}

      {/* Status card */}
      <div className={`rounded-xl border p-6 ${cfg.bg}`}>
        <div className="flex items-center gap-3 mb-4">
          {cfg.icon}
          <span className={`font-semibold text-lg ${cfg.color}`}>{cfg.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Firm</p>
            <p className="text-white font-medium">{billing.name}</p>
          </div>
          <div>
            <p className="text-slate-400">Plan</p>
            <p className="text-white font-medium">Professional — ₦30,000/month</p>
          </div>

          {subscriptionStatus === 'TRIAL' && billing.trialEndsAt && (
            <>
              <div>
                <p className="text-slate-400">Trial ends</p>
                <p className="text-white font-medium">{formatDate(billing.trialEndsAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Days remaining</p>
                <p className={`font-bold text-lg ${daysUntil(billing.trialEndsAt) <= 5 ? 'text-red-400' : 'text-blue-400'}`}>
                  {daysUntil(billing.trialEndsAt)} days
                </p>
              </div>
            </>
          )}

          {subscriptionStatus === 'ACTIVE' && billing.subscriptionEndsAt && (
            <>
              <div>
                <p className="text-slate-400">Next renewal</p>
                <p className="text-white font-medium">{formatDate(billing.subscriptionEndsAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Last payment</p>
                <p className="text-white font-medium">{formatDate(billing.lastPaymentAt)}</p>
              </div>
            </>
          )}

          {subscriptionStatus === 'GRACE_PERIOD' && billing.gracePeriodEndsAt && (
            <>
              <div>
                <p className="text-slate-400">Grace period ends</p>
                <p className="text-white font-medium">{formatDate(billing.gracePeriodEndsAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Days until lockout</p>
                <p className="font-bold text-lg text-red-400">
                  {daysUntil(billing.gracePeriodEndsAt)} days
                </p>
              </div>
            </>
          )}

          {(subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'CANCELLED') && (
            <div className="col-span-2">
              <p className="text-red-300">Your subscription has ended. Subscribe below to restore access.</p>
            </div>
          )}
        </div>
      </div>

      {/* Plan details */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-400" /> Professional Plan
        </h2>
        <ul className="space-y-2 text-sm text-slate-300">
          {[
            'Unlimited cases and documents',
            'Unlimited team members',
            'Deadline & hearing reminders (email + SMS)',
            'Cloud document storage (Cloudflare R2)',
            'CSV exports and audit logs',
            'Multi-branch support',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <div className="pt-2 border-t border-slate-700 flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold text-white">₦30,000</span>
            <span className="text-slate-400 ml-1">/month</span>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => payMutation.mutate()}
              disabled={payMutation.isPending}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 px-6 py-2.5 rounded-lg font-semibold hover:from-amber-400 hover:to-yellow-500 disabled:opacity-50 transition-all shadow-lg"
            >
              {payMutation.isPending ? 'Redirecting…' : subscriptionStatus === 'ACTIVE' ? 'Renew Now' : 'Subscribe Now'}
            </button>
          )}
          {!isSuperAdmin && (
            <p className="text-slate-400 text-sm">Only the firm admin can manage billing.</p>
          )}
        </div>
      </div>

      {payMutation.isError && (
        <p className="text-red-400 text-sm">Failed to start payment. Please try again.</p>
      )}
    </div>
  );
}
