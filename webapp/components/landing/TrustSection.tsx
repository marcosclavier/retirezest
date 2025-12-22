'use client';

export default function TrustSection() {
  const trustPillars = [
    {
      icon: '🔒',
      title: 'Bank-Level Security',
      features: [
        '256-bit encryption',
        'Secure authentication',
        'Privacy-first design',
        'No data selling',
      ],
    },
    {
      icon: '🇨🇦',
      title: 'Canadian-Specific',
      features: [
        '2025-2026 government rates',
        'All provinces supported',
        'CRA-aligned calculations',
        'PIPEDA compliant',
      ],
    },
    {
      icon: '📊',
      title: 'Accurate Calculations',
      features: [
        'Verified against official calculators',
        'Regular updates',
        'Transparent methodology',
        'Financial planner reviewed',
      ],
    },
    {
      icon: '🆓',
      title: 'Free to Start',
      features: [
        'No credit card required',
        'Full feature access',
        'Export your data anytime',
        'Cancel anytime',
      ],
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Secure, Private, and Accurate
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Your retirement planning deserves the highest standards of security and precision
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustPillars.map((pillar, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-blue-300 transition-colors duration-300"
            >
              <div className="text-5xl mb-4 text-center">{pillar.icon}</div>

              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                {pillar.title}
              </h3>

              <ul className="space-y-2">
                {pillar.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start text-sm">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Additional Trust Indicators */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-gray-600">Free to Use</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">2026</div>
              <div className="text-gray-600">Latest Tax Rates</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-gray-600">Access Your Plan</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Retire Zest is an educational planning tool and does not provide personalized financial advice.
                Always consult with a licensed financial advisor for recommendations specific to your situation.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
