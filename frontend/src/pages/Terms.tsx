export function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-amber-400 hover:text-amber-300 text-sm">← Back to Home</a>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-slate-400 text-sm mb-8">Last updated: April 2026</p>

          <div className="space-y-6 text-slate-300">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
              <p>By accessing or using Lawravel ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
              <p>Lawravel provides a cloud-based legal practice management platform for law firms in Nigeria and beyond, including case management, document storage, deadline tracking, and team collaboration tools.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">3. Account Registration</h2>
              <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and all activities under your account.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">4. Subscription & Payment</h2>
              <p>Lawravel offers a 30-day free trial followed by paid subscription plans. Payments are processed via Paystack. Subscriptions do not auto-renew — firms must manually renew before expiry to maintain access.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">5. Data Ownership</h2>
              <p>You retain full ownership of all data, documents, and information you upload to the Platform. Lawravel does not claim ownership over your content.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. Confidentiality</h2>
              <p>Lawravel treats all firm data as strictly confidential. We do not access, share, or sell your data to third parties except as required to operate the Platform (e.g., cloud storage providers).</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">7. Acceptable Use</h2>
              <p>You agree not to use the Platform for any unlawful purpose, to upload malicious content, or to attempt to gain unauthorized access to other accounts or systems.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">8. Service Availability</h2>
              <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. We are not liable for losses resulting from downtime or service interruptions.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">9. Termination</h2>
              <p>Lawravel reserves the right to suspend or terminate accounts that violate these terms. You may stop using the Platform at any time.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">10. Contact</h2>
              <p>For questions about these terms, contact us at <a href="mailto:support@lawravel.com" className="text-amber-400 hover:text-amber-300">support@lawravel.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
