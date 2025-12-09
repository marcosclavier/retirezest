'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Column: Text Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Plan Your Canadian Retirement with{' '}
                <span className="text-blue-600">Confidence</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Calculate CPP, OAS, and project your retirement income in minutes—no spreadsheets required.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                >
                  Start Planning Free →
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => scrollToSection('how-it-works')}
              >
                See How It Works
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇨🇦</span>
                <span className="text-sm font-medium text-gray-700">Built for Canadians</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span className="text-sm font-medium text-gray-700">Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="text-sm font-medium text-gray-700">2026 Rates</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual */}
          <div className="relative lg:ml-8">
            {/* Dashboard Preview Placeholder */}
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border-8 border-white bg-gradient-to-br from-blue-100 to-green-100">
              <div className="aspect-[4/3] flex items-center justify-center p-8">
                <div className="w-full space-y-4">
                  {/* Mock Dashboard Elements */}
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                      <div className="h-6 bg-blue-600 rounded w-1/4"></div>
                    </div>
                    <div className="h-8 bg-green-500 rounded w-1/2"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="h-3 bg-gray-300 rounded w-2/3 mb-2"></div>
                      <div className="h-6 bg-blue-400 rounded w-1/2"></div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="h-3 bg-gray-300 rounded w-2/3 mb-2"></div>
                      <div className="h-6 bg-green-400 rounded w-1/2"></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded w-full"></div>
                      <div className="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded w-3/4"></div>
                      <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-full opacity-50 blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-200 rounded-full opacity-50 blur-2xl"></div>
          </div>

        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
