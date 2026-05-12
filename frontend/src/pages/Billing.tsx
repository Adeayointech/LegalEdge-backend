import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle, CreditCard, AlertTriangle, Clock, XCircle,
  Bell, Search, BarChart2, Shield, GitBranch, FileText,
  Users, Lock, Zap, Smartphone, PenLine, MessageSquare, Rocket,
} from 'lucide-react';

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
  monthly:   { label: 'Monthly',   price: 20000,  duration: 'month',    perMonth: '₦20,000 / mo', badge: null },
  quarterly: { label: 'Quarterly', price: 55000,  duration: '3 months', perMonth: '₦18,333 / mo', badge: 'Save ₦5,000' },
  biannual:  { label: '6 Months',  price: 110000, duration: '6 months', perMonth: '₦18,333 / mo', badge: 'Save ₦10,000' },
  annual:    { label: 'Yearly',    price: 205000, duration: 'year',     perMonth: '₦17,083 / mo', badge: 'Best Value' },
};

const CURRENT_FEATURES: { icon: React.ReactNode; label: string }[] = [
  { icon: <FileText className="w-4 h-4 text-amber-400" />,   label: 'Unlimited cases & documents' },
  { icon: <Users className="w-4 h-4 text-amber-400" />,      label: 'Unlimited team members' },
  { icon: <Bell className="w-4 h-4 text-amber-400" />,       label: 'Real-time in-app notifications' },
  { icon: <Clock className="w-4 h-4 text-amber-400" />,      label: 'Deadline & hearing email reminders' },
  { icon: <Search className="w-4 h-4 text-amber-400" />,     label: 'Advanced search across all records' },
  { icon: <BarChart2 className="w-4 h-4 text-amber-400" />,  label: 'Full analytics dashboard & charts' },
  { icon: <Shield className="w-4 h-4 text-amber-400" />,     label: 'Audit trail & activity logs' },
  { icon: <GitBranch className="w-4 h-4 text-amber-400" />,  label: 'Multi-branch support' },
  { icon: <Lock className="w-4 h-4 text-amber-400" />,       label: 'Two-factor authentication (2FA)' },
  { icon: <CreditCard className="w-4 h-4 text-amber-400" />, label: 'CSV exports for cases & deadlines' },
];

const COMING_SOON: { icon: React.ReactNode; label: string; desc: string }[] = [
  { icon: <Zap className="w-4 h-4" />,           label: 'AI Case Summarisation',          desc: 'Instant AI-generated summaries of any case' },
  { icon: <CreditCard className="w-4 h-4" />,    label: 'Client Invoicing & Billing',     desc: 'Create and send invoices directly from cases' },
  { icon: <FileText className="w-4 h-4" />,      label: 'Court Filing Wizard',            desc: 'Auto-fill federal e-court filing documents' },
  { icon: <MessageSquare className="w-4 h-4" />, label: 'WhatsApp & SMS Reminders',       desc: 'Deadline alerts delivered on WhatsApp and SMS' },
  { icon: <Smartphone className="w-4 h-4" />,    label: 'Mobile App (iOS & Android)',     desc: 'Full Lawravel experience on your phone' },
  { icon: <PenLine className="w-4 h-4" />,       label: 'E-Signature',                    desc: 'Sign and request signatures on documents in-platform' },
];

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

  const statusConfig: Record<SubscriptionStatus, { label: string; color: string; icon: React.ReactNode; bg: string; dot: string }> = {
    TRIAL:        { label: 'Free Trial',   color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/30',   dot: 'bg-blue-400',  icon: <Clock className="w-5 h-5 text-blue-400" /> },
    ACTIVE:       { label: 'Active',       color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', dot: 'bg-green-400', icon: <CheckCircle className="w-5 h-5 text-green-400" /> },
    GRACE_PERIOD: { label: 'Grace Period', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400', icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> },
    EXPIRED:      { label: 'Expired',      color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/30',     dot: 'bg-red-400',   icon: <XCircle className="w-5 h-5 text-red-400" /> },
    CANCELLED:    { label: 'Cancelled',    color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/30',     dot: 'bg-red-400',   icon: <XCircle className="w-5 h-5 text-red-400" /> },
  };

  const cfg = statusConfig[subscriptionStatus];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your firm's plan and see what's coming next.</p>
      </div>

      {/* Verify payment loading */}
      {verifyMutation.isPending && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-sm flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
          Verifying your payment, please wait…
        </div>
      )}

      {/* Status card */}
      <div className={`rounded-2xl border p-6 ${cfg.bg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {cfg.icon}
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</span>
                <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
              </div>
              <p className="text-slate-400 text-sm">{billing.name} — Professional Plan</p>
            </div>
          </div>

          <div className="flex gap-6 text-sm">
            {subscriptionStatus === 'TRIAL' && billing.trialEndsAt && (
              <>
                <div className="text-right">
                  <p className="text-slate-400">Trial ends</p>
                  <p className="text-white font-medium">{formatDate(billing.trialEndsAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Days left</p>
                  <p className={`font-bold text-xl ${daysUntil(billing.trialEndsAt) <= 5 ? 'text-red-400' : 'text-blue-400'}`}>
                    {daysUntil(billing.trialEndsAt)}
                  </p>
                </div>
              </>
            )}
            {subscriptionStatus === 'ACTIVE' && billing.subscriptionEndsAt && (
              <>
                <div className="text-right">
                  <p className="text-slate-400">Next renewal</p>
                  <p className="text-white font-medium">{formatDate(billing.subscriptionEndsAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Last payment</p>
                  <p className="text-white font-medium">{formatDate(billing.lastPaymentAt)}</p>
                </div>
              </>
            )}
            {subscriptionStatus === 'GRACE_PERIOD' && billing.gracePeriodEndsAt && (
              <>
                <div className="text-right">
                  <p className="text-slate-400">Grace ends</p>
                  <p className="text-white font-medium">{formatDate(billing.gracePeriodEndsAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Days until lockout</p>
                  <p className="font-bold text-xl text-red-400">{daysUntil(billing.gracePeriodEndsAt)}</p>
                </div>
              </>
            )}
            {(subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'CANCELLED') && (
              <p className="text-red-300 text-sm self-center">Subscribe below to restore access.</p>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout: features left, plans right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* What's included */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
          <div>
            <h2 className="text-white font-semibold text-base">What's included</h2>
            <p className="text-slate-400 text-xs mt-0.5">Everything in the Professional plan</p>
          </div>
          <ul className="space-y-3">
            {CURRENT_FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
                  {f.icon}
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Plan selector */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 space-y-4 flex flex-col">
          <div>
            <h2 className="text-white font-semibold text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" /> Choose a plan
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">One price covers your entire firm</p>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            {(Object.keys(PLANS) as PlanKey[]).map((key) => {
              const plan = PLANS[key];
              const isSelected = selectedPlan === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-amber-500 bg-gradient-to-br from-amber-500/15 to-yellow-500/5 shadow-lg shadow-amber-500/10'
                      : 'border-slate-600 bg-slate-700/40 hover:border-slate-500 hover:bg-slate-700/60'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-2.5 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${
                      plan.badge === 'Best Value'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900'
                        : 'bg-green-500/20 text-green-400 border border-green-500/40'
                    }`}>
                      {plan.badge}
                    </span>
                  )}
                  <p className="font-semibold text-white text-sm">{plan.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">₦{plan.price.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{plan.perMonth}</p>
                  {isSelected && (
                    <div className="absolute bottom-2 right-2">
                      <CheckCircle className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <div className="pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-3xl font-bold text-white">₦{PLANS[selectedPlan].price.toLocaleString()}</span>
                <span className="text-slate-400 text-sm ml-1">/ {PLANS[selectedPlan].duration}</span>
              </div>
              {PLANS[selectedPlan].badge && PLANS[selectedPlan].badge !== 'Best Value' && (
                <span className="text-green-400 text-sm font-medium">{PLANS[selectedPlan].badge}</span>
              )}
            </div>
            {isSuperAdmin ? (
              <button
                onClick={() => payMutation.mutate(selectedPlan)}
                disabled={payMutation.isPending}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 py-3 rounded-xl font-bold hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20 text-sm"
              >
                {payMutation.isPending ? 'Redirecting to Paystack…' : subscriptionStatus === 'ACTIVE' ? 'Renew Subscription' : 'Subscribe Now'}
              </button>
            ) : (
              <div className="w-full py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-center text-slate-400 text-sm">
                Only the firm Super Admin can manage billing
              </div>
            )}
            {payMutation.isError && (
              <p className="text-red-400 text-xs mt-2 text-center">Payment failed to start. Please try again.</p>
            )}
          </div>
        </div>
      </div>

      {/* What's Coming */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">What's Coming</h2>
            <p className="text-slate-400 text-xs">Features in development — included in your plan when live</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMING_SOON.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/30 transition-colors"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mt-0.5">
                {item.icon}
              </span>
              <div>
                <p className="text-white text-sm font-medium leading-snug">{item.label}</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-slate-500 text-xs text-center pt-1">
          All upcoming features will be available to active subscribers at no extra cost during early access.
        </p>
      </div>

    </div>
  );
}
