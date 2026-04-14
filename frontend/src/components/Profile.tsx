import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { User, Mail, Phone, Building, MapPin, Calendar, Shield, Key, Eye, EyeOff, MessageSquare, Send } from 'lucide-react';
import { SupportTicketList } from './SupportTicketList';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isApproved: boolean;
  twoFactorEnabled: boolean;
  firmId?: string;
  branchId?: string;
  firm?: {
    id: string;
    name: string;
    inviteCode: string;
    address?: string;
    city?: string;
    state?: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  lastLoginAt?: string;
}

const roleDisplayNames: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SENIOR_PARTNER: 'Senior Partner',
  PARTNER: 'Partner',
  ASSOCIATE: 'Associate',
  SECRETARY: 'Secretary',
  INTERN: 'Intern',
  CLIENT: 'Client',
};

export function Profile() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const location = useLocation();
  const ticketRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [supportData, setSupportData] = useState({
    subject: '',
    message: '',
    priority: 'MEDIUM',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/profile');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user's support tickets
  const { data: ticketsData } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const response = await api.get('/support/my-tickets');
      return response.data;
    },
  });

  const tickets = ticketsData?.tickets || [];

  // Handle deep linking to specific ticket
  useEffect(() => {
    const state = location.state as { scrollToTicket?: string };
    const ticketId = state?.scrollToTicket;
    if (ticketId && ticketRefs.current[ticketId]) {
      // Wait a bit for render to complete
      setTimeout(() => {
        const element = ticketRefs.current[ticketId];
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          // Highlight the ticket briefly
          element.style.transition = 'box-shadow 0.3s';
          element.style.boxShadow = '0 0 0 3px rgb(251 191 36 / 50%)';
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 2000);
        }
      }, 100);
    }
  }, [location.state, tickets]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string; phone?: string }) =>
      api.put('/profile', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAuth(response.data.user, localStorage.getItem('token') || '');
      setIsEditing(false);
      alert('Profile updated successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put('/profile/password', data),
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Password changed successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to change password');
    },
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone || '',
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
    });
  };

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('First name and last name are required');
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleSubmitSupport = () => {
    if (!supportData.subject.trim() || !supportData.message.trim()) {
      alert('Please fill in subject and message');
      return;
    }

    submitSupportMutation.mutate(supportData);
  };

  const submitSupportMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string; priority: string }) => {
      const response = await api.post('/support', data);
      return response.data;
    },
    onSuccess: () => {
      alert('Support ticket submitted successfully! We will get back to you soon.');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setShowSupportModal(false);
      setSupportData({
        subject: '',
        message: '',
        priority: 'MEDIUM',
      });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to submit support ticket');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Failed to load profile
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white heading-font">My Profile</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your personal information and settings
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-colors border border-slate-600"
          >
            <Key size={16} />
            Change Password
          </button>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold shadow-lg hover:shadow-amber-500/50"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-colors border border-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold shadow-lg hover:shadow-amber-500/50 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* First Name */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              First Name
            </div>
            <div className="col-span-2">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.firstName}</p>
              )}
            </div>
          </div>

          {/* Last Name */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              Last Name
            </div>
            <div className="col-span-2">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-gray-400" />
              Email
            </div>
            <div className="col-span-2">
              <p className="text-gray-900">{profile.email}</p>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Phone */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone size={16} className="text-gray-400" />
              Phone
            </div>
            <div className="col-span-2">
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234 123 456 7890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Shield size={16} className="text-gray-400" />
              Role
            </div>
            <div className="col-span-2">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {roleDisplayNames[profile.role] || profile.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Organization Details</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Firm */}
          {profile.firm && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building size={16} className="text-gray-400" />
                  Law Firm
                </div>
                <div className="col-span-2">
                  <p className="text-gray-900 font-medium">{profile.firm.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Invite Code: {profile.firm.inviteCode}
                  </p>
                </div>
              </div>

              {profile.firm.address && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />
                    Address
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-900">{profile.firm.address}</p>
                    {profile.firm.city && profile.firm.state && (
                      <p className="text-sm text-gray-600 mt-1">
                        {profile.firm.city}, {profile.firm.state}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Branch */}
          {profile.branch && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building size={16} className="text-gray-400" />
                Branch
              </div>
              <div className="col-span-2">
                <p className="text-gray-900 font-medium">{profile.branch.name}</p>
                {profile.branch.address && (
                  <p className="text-sm text-gray-600 mt-1">
                    {profile.branch.address}
                    {profile.branch.city && profile.branch.state && (
                      <>, {profile.branch.city}, {profile.branch.state}</>
                    )}
                  </p>
                )}
                {profile.branch.phone && (
                  <p className="text-sm text-gray-600 mt-1">
                    Phone: {profile.branch.phone}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              Member Since
            </div>
            <div className="col-span-2">
              <p className="text-gray-900">
                {new Date(profile.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {profile.lastLoginAt && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                Last Login
              </div>
              <div className="col-span-2">
                <p className="text-gray-900">
                  {new Date(profile.lastLoginAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Shield size={16} className="text-gray-400" />
              2FA Status
            </div>
            <div className="col-span-2">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  profile.twoFactorEnabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" />
            Contact Support
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Have a question or issue with your account? Our support team is here to help.
          </p>
          <button
            onClick={() => setShowSupportModal(true)}
            className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 flex items-center gap-2"
          >
            <Send size={16} />
            Submit Support Request
          </button>
        </div>
      </div>

      {/* My Support Tickets Section */}
      <SupportTicketList tickets={tickets} ticketRefs={ticketRefs} />

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Contact Support
              </h3>
              <button
                onClick={() => setShowSupportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={supportData.subject}
                  onChange={(e) => setSupportData({ ...supportData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={supportData.priority}
                  onChange={(e) => setSupportData({ ...supportData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={supportData.message}
                  onChange={(e) => setSupportData({ ...supportData, message: e.target.value })}
                  placeholder="Please describe your issue in detail..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>

            <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-lg flex-shrink-0 border-t border-gray-200">
              <button
                onClick={() => setShowSupportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSupport}
                disabled={submitSupportMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {submitSupportMutation.isPending ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
                className="flex-1 bg-blue-900 text-white py-2 px-4 rounded-md hover:bg-blue-800 disabled:opacity-50"
              >
                Change Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
