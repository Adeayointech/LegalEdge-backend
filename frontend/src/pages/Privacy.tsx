export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <a href="/" className="text-amber-400 hover:text-amber-300 text-sm">← Back to Home</a>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mb-8">Last updated: April 2026</p>

          <div className="space-y-6 text-slate-300">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
              <p>We collect information you provide directly: firm name, user names, email addresses, phone numbers, and all case/document data you upload to the Platform.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>To provide and operate the Lawravel Platform</li>
                <li>To send deadline and hearing reminders</li>
                <li>To process subscription payments via Paystack</li>
                <li>To send transactional emails (verification, password reset)</li>
                <li>To respond to support requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">3. Data Storage & Security</h2>
              <p>Your data is stored on secure servers. Documents are stored in Cloudflare R2 cloud storage. We implement industry-standard security measures including encryption in transit (HTTPS/TLS) and at rest.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">4. Third-Party Services</h2>
              <p>We use the following third-party services to operate the Platform:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong className="text-slate-200">Cloudflare R2</strong> — Document storage</li>
                <li><strong className="text-slate-200">Paystack</strong> — Payment processing</li>
                <li><strong className="text-slate-200">Resend</strong> — Transactional email delivery</li>
              </ul>
              <p className="mt-2">We do not sell your data to any third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">5. Data Retention</h2>
              <p>Your data is retained while your account is active. Upon account deletion, data is removed within 30 days except where required by law.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">6. Your Rights</h2>
              <p>You have the right to access, correct, or request deletion of your personal data. Contact us at <a href="mailto:support@lawravel.com" className="text-amber-400 hover:text-amber-300">support@lawravel.com</a> to exercise these rights.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">7. Cookies</h2>
              <p>The Platform uses minimal cookies necessary for authentication and session management only. We do not use tracking or advertising cookies.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">8. Changes to This Policy</h2>
              <p>We may update this policy from time to time. We will notify users of significant changes via email.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">9. Contact</h2>
              <p>For privacy-related questions, contact us at <a href="mailto:support@lawravel.com" className="text-amber-400 hover:text-amber-300">support@lawravel.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
