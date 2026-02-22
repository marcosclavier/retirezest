'use client';

export default function FeaturesShowcase() {
  const features = [
    {
      title: 'Single & Couples Planning',
      description: 'Plan for yourself or together with your partner. Optimize strategies for both individual and household retirement goals.',
      icon: '👥',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'CPP/QPP Optimizer',
      description: 'Calculate your CPP or QPP based on earnings history. Find the optimal start age (60-70) with break-even analysis.',
      icon: '📊',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'OAS & GIS Calculator',
      description: 'Estimate OAS based on residency. Calculate income clawback and determine GIS eligibility.',
      icon: '💰',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Retirement Projection',
      description: 'Year-by-year income and expenses. Asset balance tracking to age 95+ with full tax calculations.',
      icon: '📈',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Scenario Planning',
      description: 'Compare multiple retirement plans. Test what-if scenarios and retirement age comparisons.',
      icon: '🔄',
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Financial Profile',
      description: 'Track income, assets, expenses, and debts. Manage RRSP, TFSA, and non-registered accounts.',
      icon: '💼',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      title: 'Professional Reports',
      description: 'Generate PDF retirement reports with executive summaries. Share with financial advisors.',
      icon: '📄',
      color: 'from-pink-500 to-pink-600',
    },
    {
      title: 'Provincial Tax Support',
      description: 'Accurate tax calculations for all provinces including Quebec QPP and provincial benefits.',
      icon: '🍁',
      color: 'from-red-500 to-red-600',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Plan Your Retirement
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful tools designed specifically for Canadian seniors
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-blue-200 hover:shadow-xl transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} mb-6`}>
                <span className="text-4xl">{feature.icon}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Ready to explore all these features?
          </p>
          <a
            href="/register"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started Free
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}
