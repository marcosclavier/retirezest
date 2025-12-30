import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions | RetireZest',
  description: 'Terms and Conditions for using RetireZest retirement planning services.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-sm text-gray-600 mb-8">
            Last Updated: December 30, 2024
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using RetireZest ("Service," "Application," "we," "our," or "us"), you accept and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our Service.
              </p>
              <p className="text-gray-700 mb-4">
                These Terms constitute a legally binding agreement between you and RetireZest. We reserve the right to modify these Terms at any time. Your continued use of the Service after changes are posted constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                RetireZest is an educational retirement planning tool designed for Canadian residents. The Service provides:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Retirement simulation and projection calculations</li>
                <li>Government benefits estimation (CPP, OAS, GIS)</li>
                <li>Asset and income tracking</li>
                <li>Scenario comparison tools</li>
                <li>Tax-efficient withdrawal strategy planning</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <p className="text-gray-700">
                  <strong>Important:</strong> RetireZest is an educational tool and does NOT provide personalized financial advice, investment recommendations, or professional tax advice. Always consult with licensed financial advisors, tax professionals, and other qualified experts for advice specific to your situation.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Eligibility</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Registration</h3>
              <p className="text-gray-700 mb-4">
                To use RetireZest, you must:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Provide accurate and complete registration information</li>
                <li>Verify your email address</li>
                <li>Create a secure password</li>
                <li>Maintain the security and confidentiality of your account credentials</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>All activities that occur under your account</li>
                <li>Maintaining the confidentiality of your password</li>
                <li>Immediately notifying us of any unauthorized use of your account</li>
                <li>Ensuring your account information remains accurate and up-to-date</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Account Termination</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to suspend or terminate your account if:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>You violate these Terms</li>
                <li>You provide false or misleading information</li>
                <li>You engage in fraudulent or illegal activities</li>
                <li>Your account has been inactive for an extended period</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Responsibilities and Prohibited Conduct</h2>
              <p className="text-gray-700 mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated scripts, bots, or scrapers to access the Service</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Remove or modify any copyright, trademark, or proprietary notices</li>
                <li>Upload malicious code, viruses, or any harmful software</li>
                <li>Misrepresent your identity or affiliation</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property Rights</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 RetireZest Property</h3>
              <p className="text-gray-700 mb-4">
                All content, features, and functionality of the Service, including but not limited to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Software code and algorithms</li>
                <li>Design, layout, and user interface</li>
                <li>Text, graphics, logos, and images</li>
                <li>Calculation methodologies</li>
                <li>Trademarks and service marks</li>
              </ul>
              <p className="text-gray-700 mb-4">
                are owned by RetireZest and are protected by Canadian and international copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Your Data</h3>
              <p className="text-gray-700 mb-4">
                You retain all rights to the personal and financial data you input into the Service. By using RetireZest, you grant us a limited license to use your data solely for the purpose of providing the Service to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Service Availability and Modifications</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Service Availability</h3>
              <p className="text-gray-700 mb-4">
                While we strive to maintain continuous availability, we do not guarantee that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>The Service will be uninterrupted or error-free</li>
                <li>Defects will be corrected immediately</li>
                <li>The Service will be available at all times</li>
                <li>The Service will be free from viruses or harmful components</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Modifications to Service</h3>
              <p className="text-gray-700 mb-4">
                We reserve the right to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Modify, suspend, or discontinue any part of the Service</li>
                <li>Update calculation methodologies and features</li>
                <li>Change pricing or introduce fees (with advance notice)</li>
                <li>Implement maintenance windows and updates</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Disclaimers and Limitations</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 No Financial Advice</h3>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                <p className="text-gray-700 mb-2">
                  <strong>IMPORTANT DISCLAIMER:</strong>
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>RetireZest is an EDUCATIONAL TOOL ONLY</li>
                  <li>We do NOT provide personalized financial, investment, tax, or legal advice</li>
                  <li>Calculations and projections are estimates based on assumptions you provide</li>
                  <li>Past performance and projections do NOT guarantee future results</li>
                  <li>We are NOT registered financial advisors, investment advisors, or tax professionals</li>
                  <li>Always consult qualified professionals before making financial decisions</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Accuracy of Information</h3>
              <p className="text-gray-700 mb-4">
                While we make reasonable efforts to provide accurate calculations based on current Canadian tax laws and government benefit rules:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Tax laws and regulations change frequently</li>
                <li>Government benefit amounts are subject to change</li>
                <li>Individual circumstances vary significantly</li>
                <li>Projections involve assumptions about future conditions</li>
                <li>Results depend on the accuracy of data you provide</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.3 Limitation of Liability</h3>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>RetireZest is provided "AS IS" and "AS AVAILABLE"</li>
                <li>We make no warranties, express or implied</li>
                <li>We are not liable for any financial losses, damages, or decisions made based on information from the Service</li>
                <li>We are not responsible for errors, omissions, or inaccuracies in calculations</li>
                <li>Our total liability shall not exceed the amount you paid to use the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand how we collect, use, and protect your information.
              </p>
              <p className="text-gray-700 mb-4">
                Key privacy commitments:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>We do not sell your personal information</li>
                <li>All data is encrypted in transit and at rest</li>
                <li>You can export or delete your data at any time</li>
                <li>We comply with PIPEDA and Canadian privacy laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Links and Services</h2>
              <p className="text-gray-700 mb-4">
                The Service may contain links to third-party websites, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Canada Revenue Agency (CRA) calculators and resources</li>
                <li>Service Canada benefit information</li>
                <li>Government of Canada websites</li>
              </ul>
              <p className="text-gray-700 mb-4">
                We are not responsible for the content, privacy policies, or practices of third-party sites. Use of third-party sites is at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Pricing and Payment</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.1 Free Service</h3>
              <p className="text-gray-700 mb-4">
                RetireZest is currently offered as a free service. We reserve the right to introduce fees or premium features in the future with advance notice to users.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.2 Future Pricing</h3>
              <p className="text-gray-700 mb-4">
                If we introduce paid features:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>We will provide at least 30 days' notice</li>
                <li>Existing users may receive grandfathered pricing</li>
                <li>You will have the option to continue or cancel before charges apply</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify, defend, and hold harmless RetireZest, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses arising from:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any financial decisions you make based on information from the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">12.1 Governing Law</h3>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">12.2 Dispute Resolution</h3>
              <p className="text-gray-700 mb-4">
                Any disputes arising from these Terms or your use of the Service shall be resolved through:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Good faith negotiation</li>
                <li>Mediation (if negotiation fails)</li>
                <li>Binding arbitration in Ontario, Canada</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Severability</h2>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Entire Agreement</h2>
              <p className="text-gray-700 mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and RetireZest regarding the Service and supersede all prior agreements and understandings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms and Conditions, please contact us:
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@retirezest.com
                </p>
                <p className="text-gray-700 mt-2">
                  We will respond to your inquiry within 30 days.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Acknowledgment</h2>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  <strong>BY USING RETIREZEST, YOU ACKNOWLEDGE THAT:</strong>
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>You have read and understood these Terms</li>
                  <li>You agree to be bound by these Terms</li>
                  <li>RetireZest is an educational tool, not financial advice</li>
                  <li>You will consult with qualified professionals before making financial decisions</li>
                  <li>You use the Service at your own risk</li>
                  <li>You are responsible for the accuracy of data you input</li>
                </ul>
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
