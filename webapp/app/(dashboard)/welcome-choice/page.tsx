'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function WelcomeChoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleChoice = async (choice: 'wizard' | 'dashboard') => {
    setIsLoading(true);

    // Mark welcome as seen
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasSeenWelcome: true }),
      });
    } catch (error) {
      console.error('Failed to update welcome status:', error);
    }

    // Navigate to chosen destination
    if (choice === 'wizard') {
      router.push('/onboarding/wizard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-5xl w-full mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to RetireZest!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose how you'd like to get started with your retirement planning
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Wizard Option - Recommended for First-Time Users */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-200 relative">
            {/* Recommended Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                Recommended
              </span>
            </div>

            <div className="text-center mb-6 mt-2">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Guided Setup Wizard
              </h2>
              <p className="text-gray-600 mb-6">
                Perfect for first-time users
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Step-by-step guidance through the entire setup</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Helps you understand what information you need</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Ensures you don't miss important details</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Leads you directly to your first simulation</span>
              </div>
            </div>

            <button
              onClick={() => handleChoice('wizard')}
              disabled={isLoading}
              className="w-full py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              Start Guided Setup
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Takes about 5-10 minutes
            </p>
          </div>

          {/* Dashboard Option - For Experienced Users */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Go to Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                For experienced users
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Jump directly to your dashboard</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Add your information at your own pace</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Access all tools immediately</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">You can always run the wizard later</span>
              </div>
            </div>

            <button
              onClick={() => handleChoice('dashboard')}
              disabled={isLoading}
              className="w-full py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Skip to Dashboard
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Start exploring right away
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-left text-sm text-gray-700">
                <p className="font-semibold mb-1">Not sure which to choose?</p>
                <p>
                  We recommend the <strong>Guided Setup Wizard</strong> for most users. It will help you set up your profile correctly and guide you through your first retirement simulation. You can always access the wizard later from your dashboard if you skip it now.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
