import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { firmAPI } from './lib/api';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { CaseList } from './components/CaseList';
import { CreateCase } from './components/CreateCase';
import { CaseDetails } from './components/CaseDetails';
import { CaseDetailsDocuments } from './components/CaseDetailsDocuments';
import { AuditLogList } from './components/AuditLogList';
import { BranchList } from './components/BranchList';
import { BranchSelector } from './components/BranchSelector';
import { NotificationBell } from './components/NotificationBell';
import { AdvancedSearch } from './components/AdvancedSearch';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { UserManagement } from './components/UserManagement';
import { Profile } from './components/Profile';
import { PlatformAdmin } from './pages/PlatformAdmin';
import Notifications from './pages/Notifications';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <Layout>
                <CaseList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/new"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateCase />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CaseDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:id/documents"
          element={
            <ProtectedRoute>
              <Layout>
                <CaseDetailsDocuments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <Layout>
                <AuditLogList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/branches"
          element={
            <ProtectedRoute>
              <Layout>
                <BranchList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Layout>
                <AdvancedSearch />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <AnalyticsDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/platform-admin"
          element={
            <ProtectedRoute>
              <PlatformAdminRoute>
                <Layout>
                  <PlatformAdmin />
                </Layout>
              </PlatformAdminRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = window.location.pathname;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect platform admin away from regular firm pages
  if (user?.role === 'PLATFORM_ADMIN' && 
      ['/dashboard', '/cases', '/branches', '/search', '/analytics', '/users', '/audit-logs'].includes(location)) {
    return <Navigate to="/platform-admin" replace />;
  }
  
  return <>{children}</>;
}

// Platform admin route wrapper
function PlatformAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  if (user?.role !== 'PLATFORM_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Home page
function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="absolute w-full z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2 sm:p-2.5 rounded-lg shadow-lg">
              <svg className="w-5 h-5 sm:w-7 sm:h-7 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="heading-font text-lg sm:text-2xl font-bold text-white tracking-tight">Lawravel</span>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <a href="/login" className="px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-white hover:text-amber-400 transition-colors font-medium">
              Login
            </a>
            <a href="/register" className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-semibold shadow-lg hover:shadow-amber-500/50">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div className="inline-block">
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs sm:text-sm font-semibold tracking-wide">
                  ENTERPRISE LEGAL MANAGEMENT
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Elevate Your
                <span className="block bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Legal Practice
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed">
                Transform your chambers with our sophisticated case management platform. Built for excellence, designed for professionals who demand the very best.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <a href="/register" className="px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold text-lg shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transform">
                  Start Free Trial
                </a>
                <a href="#features" className="px-8 py-4 bg-white/5 backdrop-blur-sm border-2 border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-semibold text-lg">
                  Explore Features
                </a>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-4">
                <div className="text-center">
                  <div className="text-xl sm:text-3xl font-bold text-amber-400">500+</div>
                  <div className="text-xs sm:text-sm text-slate-400">Law Firms</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-3xl font-bold text-amber-400">50K+</div>
                  <div className="text-xs sm:text-sm text-slate-400">Cases Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-3xl font-bold text-amber-400">99.9%</div>
                  <div className="text-xs sm:text-sm text-slate-400">Uptime</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Case Update</div>
                      <div className="text-slate-400 text-sm">Smith vs. Johnson - Court date scheduled</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Deadline Reminder</div>
                      <div className="text-slate-400 text-sm">3 cases require attention today</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold">New Document</div>
                      <div className="text-slate-400 text-sm">Contract uploaded by Sarah Mitchell</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Comprehensive Legal Management Suite</h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-400">Everything your firm needs, elegantly integrated</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: "Case Management",
                description: "Centralized control of all your cases with intelligent organization and quick access to critical information."
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Smart Deadlines",
                description: "Never miss a critical date. Automated reminders via email and SMS keep your team synchronized."
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Bank-Grade Security",
                description: "Your sensitive legal data protected with enterprise-level encryption and compliance standards."
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: "Team Collaboration",
                description: "Seamless coordination across partners, associates, and staff with role-based access controls."
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Advanced Analytics",
                description: "Data-driven insights to optimize your practice and track performance metrics that matter."
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                ),
                title: "Cloud-Based Access",
                description: "Work from anywhere, on any device. Your entire practice accessible wherever justice calls."
              }
            ].map((feature, index) => (
              <div key={index} className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-xl border border-white/10 hover:border-amber-500/50 transition-all hover:scale-105 transform">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-lg flex items-center justify-center mb-6 text-amber-400 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-12 border border-white/10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6">Built for Legal Professionals, By Legal Experts</h2>
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                  Our platform was designed in collaboration with leading law firms to address real-world challenges. Every feature is crafted to enhance your practice, not complicate it.
                </p>
                <div className="space-y-4">
                  {[
                    "ISO 27001 Certified Security",
                    "GDPR & Data Protection Compliant",
                    "24/7 Priority Support",
                    "Regular Feature Updates"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-300 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 text-center">
                  <div className="text-4xl font-bold text-amber-400 mb-2">100%</div>
                  <div className="text-slate-400">Client Satisfaction</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 text-center">
                  <div className="text-4xl font-bold text-amber-400 mb-2">24/7</div>
                  <div className="text-slate-400">Expert Support</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 text-center">
                  <div className="text-4xl font-bold text-amber-400 mb-2">256-bit</div>
                  <div className="text-slate-400">Encryption</div>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 text-center">
                  <div className="text-4xl font-bold text-amber-400 mb-2">Fast</div>
                  <div className="text-slate-400">Setup Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">Ready to Transform Your Practice?</h2>
          <p className="text-xl text-slate-300 mb-10">
            Join hundreds of law firms who have elevated their legal practice with Lawravel
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/register" className="px-10 py-5 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold text-xl shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transform">
              Start Your Free Trial
            </a>
            <a href="/login" className="px-10 py-5 bg-white/5 backdrop-blur-sm border-2 border-white/10 text-white rounded-lg hover:bg-white/10 transition-all font-semibold text-xl">
              Sign In
            </a>
          </div>
          <p className="text-slate-500 mt-6">No credit card required • 30-day free trial • Cancel anytime</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                </div>
                    <span className="heading-font text-xl font-bold text-white">Lawravel</span>
              </div>
              <p className="text-slate-400 text-sm">Enterprise legal management for modern law firms.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-slate-400 hover:text-amber-400 transition-colors">Features</a>
                <a href="#" className="block text-slate-400 hover:text-amber-400 transition-colors">Pricing</a>
                <a href="#" className="block text-slate-400 hover:text-amber-400 transition-colors">Security</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <div className="space-y-2">
                <a href="#" className="block text-slate-400 hover:text-amber-400 transition-colors">About</a>
                <a href="#" className="block text-slate-400 hover:text-amber-400 transition-colors">Contact</a>
                <a href="#" className="block text-slate-400 hover:text-amber-400 transition-colors">Support</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-slate-400 hover:text-amber-400 transition-colors">Privacy</a>
                <a href="#" className="block text-slate-400 hover:text-amber-400 transition-colors">Terms</a>
                <a href="#" className="block text-slate-400 hover:text-amber-400 transition-colors">Compliance</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-slate-500 text-sm">
            © 2026 Lawravel. All rights reserved. Empowering legal excellence worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const [firmName, setFirmName] = useState('Lawravel');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  
  useEffect(() => {
    if (user) {
      firmAPI.getDetails()
        .then(res => setFirmName(res.data.name))
        .catch(() => setFirmName('Lawravel'));
    }
  }, [user]);
  
  const handleLogout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  const getDropdownPosition = () => {
    if (!buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
    };
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getLinkClass = (path: string) => {
    return isActive(path)
      ? 'px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg transition-colors font-medium'
      : 'px-4 py-2 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 rounded-lg transition-colors font-medium';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <nav className="relative z-10 bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 items-center">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2 rounded-lg shadow-lg">
                  <svg className="w-8 h-8 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white heading-font">{firmName}</h1>
                  <p className="text-xs text-slate-400">Legal Case Management</p>
                </div>
              </div>
              <div className="hidden md:flex gap-1 ml-4">
                {user?.role === 'PLATFORM_ADMIN' ? (
                  <a href="/platform-admin" className={getLinkClass('/platform-admin')}>Platform Admin</a>
                ) : (
                  <>
                    <a href="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</a>
                    <a href="/cases" className={getLinkClass('/cases')}>Cases</a>
                    <a href="/branches" className={getLinkClass('/branches')}>Branches</a>
                    <a href="/search" className={getLinkClass('/search')}>Search</a>
                    <a href="/analytics" className={getLinkClass('/analytics')}>Analytics</a>
                    {user?.role && ['SUPER_ADMIN', 'SENIOR_PARTNER', 'PARTNER'].includes(user.role) && (
                      <a href="/users" className={getLinkClass('/users')}>Users</a>
                    )}
                    <a href="/audit-logs" className={getLinkClass('/audit-logs')}>Audit Trail</a>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user?.role !== 'PLATFORM_ADMIN' && <BranchSelector />}
              <NotificationBell />
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                {showMobileMenu ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              <div className="relative hidden md:block">
                <button 
                  ref={buttonRef}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="relative flex items-center gap-2 px-4 py-2 text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-amber-400 uppercase tracking-wide">{user?.role?.replace('_', ' ')}</div>
                  </div>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showDropdown && createPortal(
                  <>
                    <div 
                      className="fixed inset-0 z-[9998]" 
                      onClick={() => setShowDropdown(false)}
                    />
                    <div 
                      className="fixed w-48 bg-gradient-to-br from-slate-800 to-slate-900 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 py-2 z-[9999]"
                      style={getDropdownPosition()}
                    >
                      <a 
                        href="/profile" 
                        className="block px-4 py-2 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
                      >
                        My Profile
                      </a>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white">{firmName}</span>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent flex-shrink-0">
              <div className="text-sm font-semibold text-white">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-amber-400 uppercase tracking-wide mt-1">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="p-4 space-y-1 flex-1 overflow-y-auto">
              {user?.role === 'PLATFORM_ADMIN' ? (
                <a
                  href="/platform-admin"
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-4 py-3 rounded-lg transition-colors ${
                    isActive('/platform-admin')
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  Platform Admin
                </a>
              ) : (
                <>
                  <a
                    href="/dashboard"
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      isActive('/dashboard')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    Dashboard
                  </a>
                  <a
                    href="/cases"
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      isActive('/cases')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    Cases
                  </a>
                  <a
                    href="/branches"
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      isActive('/branches')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    Branches
                  </a>
                  <a
                    href="/search"
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      isActive('/search')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    Search
                  </a>
                  <a
                    href="/analytics"
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      isActive('/analytics')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    Analytics
                  </a>
                  {user?.role && ['SUPER_ADMIN', 'SENIOR_PARTNER', 'PARTNER'].includes(user.role) && (
                    <a
                      href="/users"
                      onClick={() => setShowMobileMenu(false)}
                      className={`block px-4 py-3 rounded-lg transition-colors ${
                        isActive('/users')
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      Users
                    </a>
                  )}
                  <a
                    href="/audit-logs"
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      isActive('/audit-logs')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    Audit Trail
                  </a>
                  <a
                    href="/notifications"
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      isActive('/notifications')
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    Notifications
                  </a>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/10 bg-gradient-to-t from-slate-900 to-transparent space-y-2 flex-shrink-0">
              <a
                href="/profile"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full px-4 py-3 text-center text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors"
              >
                My Profile
              </a>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  handleLogout();
                }}
                className="block w-full px-4 py-3 text-center text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}

// Dashboard page
function DashboardPage() {
  const [stats, setStats] = useState({
    activeCases: 0,
    pendingDeadlines: 0,
    totalDocuments: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [caseStats, deadlineStats, documentStats] = await Promise.all([
          firmAPI.getCaseStats(),
          firmAPI.getDeadlineStats(),
          firmAPI.getDocumentStats(),
        ]);

        // Count active cases (PRE_TRIAL and ONGOING status)
        const activeCases = caseStats.data?.byStatus?.filter((s: any) => 
          s.status === 'PRE_TRIAL' || s.status === 'ONGOING'
        ).reduce((sum: number, s: any) => sum + s._count, 0) || 0;

        // Count pending deadlines
        const pendingDeadlines = deadlineStats.data?.pending || 0;

        // Count total documents
        const totalDocuments = documentStats.data?.total || 0;

        setStats({
          activeCases,
          pendingDeadlines,
          totalDocuments,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white heading-font">Dashboard</h2>
        <p className="text-slate-400 mt-2">Welcome back! Here's your firm overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 hover:border-amber-500/50 transition-all">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-2">Active Cases</h3>
          <p className="text-4xl font-bold text-white">
            {stats.loading ? '...' : stats.activeCases}
          </p>
          <a href="/cases" className="text-sm text-amber-400 hover:text-amber-300 font-medium mt-3 inline-flex items-center gap-1">
            View all cases →
          </a>
        </div>
        <div className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 hover:border-amber-500/50 transition-all">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-2">Pending Deadlines</h3>
          <p className="text-4xl font-bold text-white">
            {stats.loading ? '...' : stats.pendingDeadlines}
          </p>
        </div>
        <div className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 hover:border-amber-500/50 transition-all">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-2">Documents</h3>
          <p className="text-4xl font-bold text-white">
            {stats.loading ? '...' : stats.totalDocuments}
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 p-6 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 heading-font">Quick Actions</h3>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <a
            href="/cases/new"
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all font-bold shadow-lg hover:shadow-amber-500/50 text-center"
          >
            Create New Case
          </a>
          <a
            href="/cases"
            className="px-6 py-3 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-all font-semibold border border-slate-600 text-center"
          >
            Browse Cases
          </a>
        </div>
      </div>
    </Layout>
  );
}

export default App;
