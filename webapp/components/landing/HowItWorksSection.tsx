'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Create Account',
      subtitle: '30 seconds',
      description: 'Sign up with just your email. No credit card required.',
      icon: '👤',
    },
    {
      number: '2',
      title: 'Enter Your Info',
      subtitle: '5 minutes',
      description: 'Add your income, assets, and retirement goals through our simple guided forms.',
      icon: '📝',
    },
    {
      number: '3',
      title: 'Get Your Plan',
      subtitle: 'Instantly',
      description: 'View projections, compare scenarios, and download professional reports.',
      icon: '📊',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-blue-50" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Start Planning in 3 Simple Steps
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            From signup to your complete retirement plan in under 10 minutes
          </p>
        </div>

        {/* Steps - Horizontal on desktop, vertical on mobile */}
        <div className="relative">
          {/* Connection line - hidden on mobile */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 mx-24"></div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step number circle */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg relative z-10">
                    {step.number}
                  </div>
                </div>

                {/* Content card */}
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center">
                  <div className="text-6xl mb-4">{step.icon}</div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>

                  <div className="text-blue-600 font-semibold mb-4">
                    {step.subtitle}
                  </div>

                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow - only between steps on desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-6 text-blue-400 text-4xl">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/register">
            <Button
              size="lg"
              className="text-lg px-10 py-6 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
            >
              Start Planning Free - It&apos;s Easy →
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-600">
            No credit card required • 5-minute setup • Cancel anytime
          </p>
        </div>

      </div>
    </section>
  );
}
