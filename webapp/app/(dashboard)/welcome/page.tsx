'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

export default function WelcomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePathSelection = async (path: 'guided' | 'experienced') => {
    setIsLoading(true);

    try {
      // Update user's path selection
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPath: path,
          hasSeenWelcome: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user preferences');
      }

      // Route based on selection
      if (path === 'guided') {
        router.push('/onboarding/wizard?step=1');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error updating user path:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to RetireZest!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your path to get started with your retirement planning journey
          </p>
        </div>

        {/* Path Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* First-Time User Path */}
          <button
            onClick={() => handlePathSelection('guided')}
            disabled={isLoading}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col h-full">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-indigo-100 rounded-full group-hover:bg-indigo-200 transition-colors">
                  <SparklesIcon className="h-12 w-12 text-indigo-600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                I'm New Here
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 flex-grow">
                Perfect for first-time users! We'll guide you step-by-step through:
              </p>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">✓</span>
                  <span className="text-sm text-gray-700">Setting up your profile and retirement goals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">✓</span>
                  <span className="text-sm text-gray-700">Adding your assets and income sources</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">✓</span>
                  <span className="text-sm text-gray-700">Estimating government benefits (CPP & OAS)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">✓</span>
                  <span className="text-sm text-gray-700">Creating your first retirement simulation</span>
                </li>
              </ul>

              {/* Time Estimate */}
              <div className="bg-indigo-50 rounded-lg p-3 mb-6">
                <p className="text-sm text-indigo-900 text-center">
                  <span className="font-semibold">Time:</span> 30-45 minutes
                </p>
              </div>

              {/* Action */}
              <div className="flex items-center justify-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                Guide Me Through Setup
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Experienced User Path */}
          <button
            onClick={() => handlePathSelection('experienced')}
            disabled={isLoading}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col h-full">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <RocketLaunchIcon className="h-12 w-12 text-green-600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                I'm Experienced
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 flex-grow">
                For users familiar with retirement planning. Get immediate access to:
              </p>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-sm text-gray-700">Full dashboard with all features unlocked</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-sm text-gray-700">Advanced scenario comparison tools</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-sm text-gray-700">Withdrawal strategy optimization</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-sm text-gray-700">Tax-efficient planning calculations</span>
                </li>
              </ul>

              {/* Time Estimate */}
              <div className="bg-green-50 rounded-lg p-3 mb-6">
                <p className="text-sm text-green-900 text-center">
                  <span className="font-semibold">Time:</span> Start immediately
                </p>
              </div>

              {/* Action */}
              <div className="flex items-center justify-center text-green-600 font-semibold group-hover:text-green-700">
                Take Me to the App
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Don't worry - you can always access the guided wizard later from the Help & FAQ section
          </p>
        </div>
      </div>
    </div>
  );
}
