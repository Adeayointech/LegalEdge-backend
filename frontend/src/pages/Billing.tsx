import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
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

type PlanKey = 'monthly' | 'quarterly' | 'biannual' | 'annual';

const PLANS: Record<PlanKey, { label: string; price: number; duration: string; perMonth: string; badge: string | null }> = {
  monthly:   { label: 'Monthly',   price: 30000,  duration: 'month',    perMonth: '₦30,000 / mo',         badge: null },
  quarterly: { label: 'Quarterly', price: 80000,  duration: '3 months', perMonth: '₦26,667 / mo',         badge: 'Save ₦10,000' },
  biannual:  { label: '6 Months',  price: 150000, duration: '6 months', perMonth: '₦25,000 / mo',         badge: 'Save ₦30,000' },
  annual:    { label: 'Yearly',    price: 270000, duration: 'year',     perMonth: '₦22,500 / mo',         badge: 'Best Value' },
};

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
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');

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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      if (res.data.status === 'success') {
        navigate('/billing', { replace: true });
      }
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // Paystack appends trxref and reference to the callback URL
    const ref = params.get('trxref') || params.get('reference') || params.get('ref');
    if (ref) {
      verifyMutation.mutate(ref);
    }
  }, []);

  const payMutation = useMutation({
    mutationFn: (plan: PlanKey) => billingAPI.initializePayment(plan),
    onSuccess: (res) => {
      window.location.href = res.data.url;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => billingAPI.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
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

      {/* Plan selector */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-400" /> Professional Plan
        </h2>

        {/* Features */}
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

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const plan = PLANS[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                  selectedPlan === key
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 right-3 text-xs font-bold bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <p className="font-semibold text-white text-sm">{plan.label}</p>
                <p className="text-xl font-bold text-white mt-1">₦{plan.price.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-0.5">{plan.perMonth}</p>
              </button>
            );
          })}
        </div>

        {/* Subscribe */}
        <div className="pt-2 border-t border-slate-700 flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold text-white">₦{PLANS[selectedPlan].price.toLocaleString()}</span>
            <span className="text-slate-400 ml-1">/ {PLANS[selectedPlan].duration}</span>
          </div>
          {isSuperAdmin && (
            <div className="flex gap-3 items-center">
              {subscriptionStatus === 'ACTIVE' && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel your subscription? You will lose access when the current period ends.')) {
                      cancelMutation.mutate();
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="text-red-400 hover:text-red-300 text-sm underline disabled:opacity-50 transition-colors"
                >
                  {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Subscription'}
                </button>
              )}
              <button
                onClick={() => payMutation.mutate(selectedPlan)}
                disabled={payMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 px-6 py-2.5 rounded-lg font-semibold hover:from-amber-400 hover:to-yellow-500 disabled:opacity-50 transition-all shadow-lg"
              >
                {payMutation.isPending ? 'Redirecting…' : subscriptionStatus === 'ACTIVE' ? 'Renew Now' : 'Subscribe Now'}
              </button>
            </div>
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
