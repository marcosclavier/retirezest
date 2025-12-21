'use client';

import { useState, useEffect } from 'react';

interface RetirementGoalsStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function RetirementGoalsStep({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: RetirementGoalsStepProps) {
  const [targetRetirementAge, setTargetRetirementAge] = useState(formData.targetRetirementAge || '65');
  const [lifeExpectancy, setLifeExpectancy] = useState(formData.lifeExpectancy || '95');
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Initialize CSRF token on mount
  useEffect(() => {
    const initCsrf = async () => {
      try {
        const response = await fetch('/api/csrf');
        const data = await response.json();
        setCsrfToken(data.token);
        console.log('[CSRF] Token initialized');
      } catch (error) {
        console.error('[CSRF] Failed to initialize token:', error);
      }
    };
    initCsrf();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);

    const data = {
      targetRetirementAge: parseInt(targetRetirementAge, 10),
      lifeExpectancy: parseInt(lifeExpectancy, 10),
    };

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        const errorMessage = errorData.error || errorData.message || 'Failed to save retirement goals';
        throw new Error(errorMessage);
      }

      updateFormData(data);
      onNext();
    } catch (error) {
      console.error('Error saving retirement goals:', error);
      const message = error instanceof Error ? error.message : 'Failed to save retirement goals. Please try again.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const retirementYears = parseInt(lifeExpectancy, 10) - parseInt(targetRetirementAge, 10);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Retirement Goals</h2>
        <p className="text-gray-600">
          When do you want to retire, and how long should we plan for?
        </p>
      </div>

      <div className="space-y-6">
        {/* Target Retirement Age */}
        <div>
          <label htmlFor="retirementAge" className="block text-sm font-medium text-gray-700 mb-2">
            Target Retirement Age <span className="text-red-500">*</span>
          </label>
          <select
            id="retirementAge"
            value={targetRetirementAge}
            onChange={(e) => setTargetRetirementAge(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            {Array.from({ length: 21 }, (_, i) => i + 55).map((age) => (
              <option key={age} value={age}>
                {age} years old
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            The age at which you plan to stop working full-time
          </p>
        </div>

        {/* Life Expectancy */}
        <div>
          <label htmlFor="lifeExpectancy" className="block text-sm font-medium text-gray-700 mb-2">
            Planning Horizon (Life Expectancy) <span className="text-red-500">*</span>
          </label>
          <select
            id="lifeExpectancy"
            value={lifeExpectancy}
            onChange={(e) => setLifeExpectancy(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            {Array.from({ length: 26 }, (_, i) => i + 80).map((age) => (
              <option key={age} value={age}>
                {age} years old
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            We'll plan your finances to last until this age. Average Canadian life expectancy is 82-84.
          </p>
        </div>

        {/* Retirement Duration Preview */}
        {retirementYears > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-indigo-900">Retirement Duration</h4>
                <p className="text-sm text-indigo-700 mt-1">
                  Your plan will cover {retirementYears} years of retirement
                </p>
              </div>
              <div className="text-3xl font-bold text-indigo-600">
                {retirementYears} yrs
              </div>
            </div>
          </div>
        )}

        {/* Government Benefits Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Government Benefits (CPP, OAS & GIS)
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            After completing this setup wizard, you'll be able to calculate your government retirement benefits:
            Canada Pension Plan (CPP), Old Age Security (OAS), and Guaranteed Income Supplement (GIS) from the Benefits page.
          </p>
          <div className="space-y-2">
            <a
              href="/benefits"
              className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition font-medium"
            >
              Calculate Government Benefits (Optional)
            </a>
            <p className="text-xs text-blue-700 text-center">
              You can skip this for now and calculate benefits later from the Benefits page
            </p>
          </div>
        </div>

        {/* Key Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Good to know:</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• CPP can start as early as age 60 or as late as age 70</li>
            <li>• OAS begins at age 65 (or can be delayed to age 70)</li>
            <li>• GIS provides additional support for low-income seniors</li>
            <li>• Delaying CPP and OAS increases your monthly payment</li>
            <li>• Our simulations will help you find the optimal claiming strategy</li>
          </ul>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={onPrevious}
          disabled={isLoading}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading || !targetRetirementAge || !lifeExpectancy}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {isLoading ? 'Saving...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
}
