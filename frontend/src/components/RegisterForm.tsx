import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

export function RegisterForm() {
  const [registrationType, setRegistrationType] = useState<'create' | 'join'>('create');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    firmName: '',
    firmCode: '',
  });
  const [generatedFirmCode, setGeneratedFirmCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGeneratedFirmCode(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registrationType === 'create' && !formData.firmName.trim()) {
      setError('Please enter your law firm name');
      return;
    }

    if (registrationType === 'join' && !formData.firmCode.trim()) {
      setError('Please enter the firm code');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://legaledge-backend-production.up.railway.app/api/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        firmName: registrationType === 'create' ? formData.firmName : undefined,
        firmCode: registrationType === 'join' ? formData.firmCode : undefined,
      });

      const { user, token, firmCode, requiresApproval, message } = response.data;
      
      // If account requires approval (joined existing firm)
      if (requiresApproval) {
        setError(''); // Clear any errors
        setGeneratedFirmCode('PENDING_APPROVAL'); // Use special flag to show approval message
        return;
      }
      
      // If we created a firm, show the code before redirecting
      if (firmCode) {
        setGeneratedFirmCode(firmCode);
        // Still log them in
        setAuth(user, token);
      } else {
        setAuth(user, token);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl w-full relative">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-3 rounded-lg shadow-lg">
              <svg className="w-8 h-8 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="heading-font text-3xl font-bold text-white">Lawravel</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">Create Your Account</h2>
          <p className="text-slate-400">Join the future of legal practice management</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/50 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {generatedFirmCode ? (
          <div className="text-center space-y-4">
            {generatedFirmCode === 'PENDING_APPROVAL' ? (
              // Pending approval message
              <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 backdrop-blur-sm border-2 border-orange-500/50 rounded-xl p-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Registration Successful! ⏳</h3>
                <div className="text-left space-y-3">
                  <p className="text-slate-300">
                    Your account has been created and is <strong className="text-orange-400">pending admin approval</strong>.
                  </p>
                  <p className="text-slate-300">
                    You will be able to log in once a firm administrator approves your account.
                  </p>
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 mt-4">
                    <p className="text-sm text-slate-400 font-semibold mb-2">
                      What happens next:
                    </p>
                    <ol className="text-sm text-slate-400 list-decimal list-inside space-y-2">
                      <li>A firm administrator will review your request</li>
                      <li>Once approved, you can log in with your credentials</li>
                      <li>The admin will assign your role (Partner, Associate, etc.)</li>
                    </ol>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">
                    💡 <strong>Tip:</strong> Contact your firm administrator to expedite the approval process.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 py-3 px-6 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold shadow-lg hover:shadow-amber-500/50"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              // Firm created successfully message
              <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm border-2 border-emerald-500/50 rounded-xl p-6">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Firm Created Successfully! 🎉</h3>
                <p className="text-slate-300 mb-4">
                  Your firm code is:
                </p>
                <div className="bg-slate-800/80 backdrop-blur-sm border-2 border-amber-500/50 rounded-lg p-6 mb-4">
                  <code className="text-4xl font-mono font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{generatedFirmCode}</code>
                </div>
                <p className="text-slate-300 mb-2">
                  ⚠️ <strong className="text-amber-400">Save this code!</strong> Share it with team members to invite them to your firm.
                </p>
                <p className="text-sm text-slate-500">
                  You can also find this code in your firm settings later.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 py-3 px-6 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold shadow-lg hover:shadow-amber-500/50"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-3 mb-8">
              <button
                type="button"
                onClick={() => setRegistrationType('create')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  registrationType === 'create'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
                }`}
              >
                Create New Firm
              </button>
              <button
                type="button"
                onClick={() => setRegistrationType('join')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  registrationType === 'join'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 shadow-lg'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
                }`}
              >
                Join Existing Firm
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., 08012345678 or +2348012345678"
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-500 mt-2">
                  For SMS notifications (case assignments, urgent deadlines)
                </p>
              </div>

              {registrationType === 'create' ? (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Law Firm Name *
                  </label>
                  <input
                    type="text"
                    name="firmName"
                    value={formData.firmName}
                    onChange={handleChange}
                    required={registrationType === 'create'}
                    placeholder="e.g., Smith & Associates Law Firm"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    You'll receive a unique code to share with your team
                  </p>
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Firm Code *
                  </label>
                  <input
                    type="text"
                    name="firmCode"
                    value={formData.firmCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData({ ...formData, firmCode: value });
                    }}
                    required={registrationType === 'join'}
                    placeholder="e.g., ABCD-1234"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition font-mono uppercase"
                    maxLength={9}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Enter the code provided by your firm admin
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Min 8 characters, include uppercase, lowercase, and number
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 py-4 px-6 rounded-lg hover:from-amber-400 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-amber-500/50"
            >
              {loading ? 'Processing...' : (registrationType === 'create' ? 'Create Firm & Register' : 'Join Firm & Register')}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-slate-400">
          Already have an account?{' '}
          <a href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
            Login
          </a>
        </p>
        </div>
      </div>
    </div>
  );
}
