import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) {
      setError('Invalid or missing reset token. Please request a new link.');
    } else {
      setToken(t);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Password must be at least 8 characters');
    }
    if (password !== confirm) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="heading-font text-3xl font-bold text-white">Lawravel</span>
          <p className="text-slate-400 mt-2">Create a new password</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Password Reset!</h2>
              <p className="text-slate-400 text-sm">
                Your password has been updated. Redirecting you to login…
              </p>
              <Link
                to="/login"
                className="block w-full text-center mt-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Set New Password</h2>
              <p className="text-slate-400 text-sm mb-6">Choose a strong password — at least 8 characters.</p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!token}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={!token}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 py-3 px-6 rounded-lg hover:from-amber-400 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <p className="mt-6 text-center text-slate-400 text-sm">
                <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                  Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
