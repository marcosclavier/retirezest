'use client';

export default function ProblemSection() {
  const problems = [
    {
      icon: '❓',
      title: 'When should I start CPP and OAS?',
      description: 'Choosing the wrong age could cost you thousands in lifetime benefits.',
    },
    {
      icon: '💰',
      title: 'Will my savings last 30+ years?',
      description: 'Uncertainty about whether your nest egg will support your retirement lifestyle.',
    },
    {
      icon: '📊',
      title: 'How much tax will I pay?',
      description: 'Complex tax calculations and withdrawal strategies leave you guessing.',
    },
    {
      icon: '🤔',
      title: 'What\'s the best withdrawal strategy?',
      description: 'RRSP, TFSA, or non-registered? The wrong order can cost you in taxes.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Retirement Planning Doesn&apos;t Have to Be Overwhelming
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Most Canadians face these common challenges when planning for retirement
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-100"
            >
              <div className="text-5xl mb-4">{problem.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {problem.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
