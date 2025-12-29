'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickStartPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Only the bare essentials
  const [age, setAge] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [includePartner, setIncludePartner] = useState(false);
  const [retirementAge, setRetirementAge] = useState('65');
  const [currentSavings, setCurrentSavings] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf');
        const data = await response.json();
        setCsrfToken(data.token);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };
    fetchCsrfToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Calculate date of birth from age
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(age);
      const dateOfBirth = `${birthYear}-01-01`;

      // Save the minimum required data
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          dateOfBirth,
          maritalStatus: maritalStatus || null,
          includePartner,
          targetRetirementAge: parseInt(retirementAge),
          lifeExpectancy: 95, // Use reasonable default
          province: 'ON', // Default province
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile update error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to save information');
      }

      // Create a simple asset if they have savings
      if (currentSavings && parseInt(currentSavings) > 0) {
        await fetch('/api/profile/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Current Savings',
            type: 'tfsa',
            balance: parseInt(currentSavings),
            person: 'person1',
          }),
        });
      }

      // Create a simple income source if they provided one
      if (monthlyIncome && parseInt(monthlyIncome) > 0) {
        await fetch('/api/profile/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Current Income',
            type: 'employment',
            amount: parseInt(monthlyIncome) * 12, // Convert to annual
            frequency: 'annually',
            person: 'person1',
          }),
        });
      }

      // Mark welcome as seen
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasSeenWelcome: true }),
      });

      // Redirect to simulation
      router.push('/simulation');
    } catch (err) {
      setError('Failed to save information. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Let's See Your Retirement Picture
            </h1>
            <p className="text-lg text-gray-600">
              Just 5 quick questions to get started. Takes less than 2 minutes.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-base font-medium text-gray-800 mb-2">
                How old are you?
              </label>
              <input
                type="number"
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="18"
                max="100"
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="e.g., 45"
              />
            </div>

            {/* Marital Status */}
            <div>
              <label htmlFor="maritalStatus" className="block text-base font-medium text-gray-800 mb-2">
                What's your marital status?
              </label>
              <select
                id="maritalStatus"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value="">Select your marital status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="common_law">Common Law</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            {/* Include Partner Toggle - only show for married/common law */}
            {(maritalStatus === 'married' || maritalStatus === 'common_law') && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    <label htmlFor="includePartner" className="block text-base font-medium text-gray-800 mb-1">
                      Plan together with your partner?
                    </label>
                    <p className="text-sm text-gray-600">
                      Joint planning helps optimize taxes and government benefits
                    </p>
                  </div>
                  <div className="flex items-center h-10">
                    <input
                      type="checkbox"
                      id="includePartner"
                      checked={includePartner}
                      onChange={(e) => setIncludePartner(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Retirement Age */}
            <div>
              <label htmlFor="retirementAge" className="block text-base font-medium text-gray-800 mb-2">
                When do you want to retire?
              </label>
              <select
                id="retirementAge"
                value={retirementAge}
                onChange={(e) => setRetirementAge(e.target.value)}
                required
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                {Array.from({ length: 21 }, (_, i) => i + 55).map((retAge) => (
                  <option key={retAge} value={retAge}>
                    Age {retAge}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Savings */}
            <div>
              <label htmlFor="savings" className="block text-base font-medium text-gray-800 mb-2">
                How much have you saved for retirement? (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  id="savings"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  min="0"
                  step="1000"
                  className="w-full pl-8 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="e.g., 50000"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Include RRSP, TFSA, and other retirement savings</p>
            </div>

            {/* Monthly Income */}
            <div>
              <label htmlFor="income" className="block text-base font-medium text-gray-800 mb-2">
                What's your monthly income? (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input
                  type="number"
                  id="income"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  min="0"
                  step="100"
                  className="w-full pl-8 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="e.g., 5000"
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Helps calculate your RRSP contribution room and pre-retirement planning
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">You can add more details later</p>
                  <p>This quick start gives you an initial retirement projection. You can refine it by adding CPP/OAS estimates, detailed asset breakdowns, expenses, and tax optimization strategies from your profile.</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !age || !maritalStatus}
              className="w-full py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Setting up...' : 'Show Me My Retirement Plan'}
            </button>
          </form>

          {/* Skip Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
