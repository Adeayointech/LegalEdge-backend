import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function SubscriptionExpiredScreen() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <Lock className="w-10 h-10 text-red-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Subscription Expired</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isSuperAdmin
              ? 'Your firm\'s subscription has expired. Please renew to restore full access for your team.'
              : 'Your firm\'s subscription has expired. Please contact your firm administrator to renew.'}
          </p>
        </div>

        {isSuperAdmin ? (
          <Link
            to="/billing"
            className="inline-block w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 py-3 px-6 rounded-lg font-semibold hover:from-amber-400 hover:to-yellow-500 transition-all shadow-lg"
          >
            Renew Subscription
          </Link>
        ) : (
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 text-sm">
            Contact your firm administrator (SUPER_ADMIN) to renew the subscription.
          </div>
        )}
      </div>
    </div>
  );
}
