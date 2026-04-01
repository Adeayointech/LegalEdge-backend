import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

type Status = 'loading' | 'success' | 'error' | 'expired';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  // Resend state
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setStatus('success');
      })
      .catch((err: any) => {
        const msg: string = err?.response?.data?.error ?? 'Verification failed.';
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setMessage(msg);
      });
  }, [searchParams]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError('');
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setResendSent(true);
    } catch {
      setResendError('Something went wrong. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-600">Verifying your email address…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h1>
            <p className="text-gray-600 mb-6">Your email address has been verified. You can now sign in to Lawravel.</p>
            <Link
              to="/login"
              className="inline-block w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Sign in
            </Link>
          </>
        )}

        {(status === 'expired' || status === 'error') && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'expired' ? 'Link expired' : 'Verification failed'}
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            {!resendSent ? (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  {status === 'expired'
                    ? 'Enter your email to get a new verification link.'
                    : 'If you need a new link, enter your email below.'}
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {resendError && <p className="text-sm text-red-600">{resendError}</p>}
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {resendLoading ? 'Sending…' : 'Resend verification email'}
                  </button>
                </form>
              </>
            ) : (
              <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                A new verification link has been sent — check your inbox.
              </p>
            )}

            <div className="mt-4">
              <Link to="/login" className="text-sm text-blue-600 hover:underline">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
