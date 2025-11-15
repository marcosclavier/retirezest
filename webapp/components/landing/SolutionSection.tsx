'use client';

export default function SolutionSection() {
  const benefits = [
    {
      icon: '🎯',
      title: 'Accurate Projections',
      features: [
        'Government benefit calculators (CPP, OAS, GIS)',
        'Year-by-year income and expense tracking',
        'Tax-efficient withdrawal strategies',
        'Updated with 2025 government rates',
      ],
    },
    {
      icon: '✨',
      title: 'Easy to Use',
      features: [
        'Step-by-step guided setup',
        'Visual charts and graphs',
        'Professional PDF reports',
        'No financial jargon',
      ],
    },
    {
      icon: '🇨🇦',
      title: 'Built for Canadians',
      features: [
        'Provincial tax calculations',
        'RRSP, TFSA, RRIF support',
        'Canadian government benefit rules',
        'All provinces supported',
      ],
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Retire Zest Gives You Clear Answers
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
              Retire Zest is a comprehensive retirement planning tool designed specifically for Canadian seniors.
              Our calculators use the latest 2025 government rates to project your CPP, OAS, and GIS benefits,
              while our powerful projection engine shows you exactly how your savings will support your retirement lifestyle.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="text-6xl mb-6 text-center">{benefit.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {benefit.title}
              </h3>
              <ul className="space-y-3">
                {benefit.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg
                      className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5"
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

      </div>
    </section>
  );
}
