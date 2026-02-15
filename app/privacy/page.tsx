import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | RetireZest',
  description: 'Privacy Policy for RetireZest - Learn how we protect and handle your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">
            Last Updated: December 30, 2024
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                RetireZest ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our retirement planning application and services.
              </p>
              <p className="text-gray-700 mb-4">
                By using RetireZest, you agree to the collection and use of information in accordance with this policy. This Privacy Policy complies with the Personal Information Protection and Electronic Documents Act (PIPEDA) and other applicable Canadian privacy laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">
                We collect information that you voluntarily provide when using RetireZest, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Account information: email address, name, date of birth</li>
                <li>Profile information: province of residence, marital status</li>
                <li>Partner information (if applicable): partner's name and date of birth</li>
                <li>Retirement planning details: target retirement age, life expectancy planning horizon</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Financial Information</h3>
              <p className="text-gray-700 mb-4">
                To provide retirement planning services, we collect financial information you choose to share:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Asset balances (TFSA, RRSP, RRIF, non-registered, corporate accounts)</li>
                <li>Income sources and amounts</li>
                <li>Monthly expenses</li>
                <li>Debt information</li>
                <li>Government benefits calculations (CPP, OAS, GIS)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Automatically Collected Information</h3>
              <p className="text-gray-700 mb-4">
                We automatically collect certain information when you use our services:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Usage data: pages visited, features used, time spent on the application</li>
                <li>Device information: browser type, operating system, IP address</li>
                <li>Analytics data: aggregated usage patterns to improve our service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>To provide and maintain our retirement planning services</li>
                <li>To perform retirement calculations and simulations</li>
                <li>To personalize your experience and provide tailored recommendations</li>
                <li>To send you important updates about your account and our services</li>
                <li>To improve our application and develop new features</li>
                <li>To ensure security and prevent fraud</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit using 256-bit SSL/TLS encryption</li>
                <li><strong>Password Security:</strong> Passwords are hashed using industry-standard bcrypt algorithms</li>
                <li><strong>Authentication:</strong> Secure session management and email verification required</li>
                <li><strong>Database Security:</strong> Data stored in secure, encrypted databases with restricted access</li>
                <li><strong>Regular Security Audits:</strong> Ongoing monitoring and security assessments</li>
              </ul>
              <p className="text-gray-700 mb-4">
                While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 No Sale of Personal Information</h3>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Service Providers</h3>
              <p className="text-gray-700 mb-4">
                We may share information with trusted service providers who assist us in operating our application, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Cloud hosting providers (Vercel, Neon)</li>
                <li>Analytics services (Google Analytics, Vercel Analytics)</li>
                <li>Error tracking services (Sentry)</li>
              </ul>
              <p className="text-gray-700 mb-4">
                These service providers are contractually obligated to protect your information and use it only for the purposes we specify.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required by law or in response to valid requests by public authorities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Privacy Rights</h2>
              <p className="text-gray-700 mb-4">
                Under PIPEDA and applicable privacy laws, you have the following rights:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Export:</strong> Download your data in a portable format</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing</li>
                <li><strong>Complaint:</strong> File a complaint with the Privacy Commissioner of Canada</li>
              </ul>
              <p className="text-gray-700 mb-4">
                To exercise these rights, please contact us at the email address provided below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as your account is active or as needed to provide our services. You may request account deletion at any time:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Account deletion requests trigger a 30-day grace period</li>
                <li>During the grace period, you can recover your account</li>
                <li>After 30 days, all personal data is permanently deleted from our systems</li>
                <li>Some information may be retained for legal or regulatory compliance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Understand how you use our application</li>
                <li>Improve our services</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookies through your browser settings. Disabling cookies may affect the functionality of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Links</h2>
              <p className="text-gray-700 mb-4">
                Our application may contain links to third-party websites (e.g., Canada Revenue Agency calculators, Service Canada). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                RetireZest is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email notification for material changes</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Your continued use of RetireZest after changes are posted constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@retirezest.com
                </p>
                <p className="text-gray-700 mt-2">
                  We will respond to your inquiry within 30 days.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Disclaimer</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-gray-700">
                  <strong>Important:</strong> RetireZest is an educational planning tool and does not provide personalized financial advice. The information and calculations provided are for planning purposes only. Always consult with a licensed financial advisor for recommendations specific to your situation.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
