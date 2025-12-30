'use client';

import { useState, useEffect } from 'react';

interface PersonalInfoStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function PersonalInfoStep({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: PersonalInfoStepProps) {
  const [province, setProvince] = useState(formData.province || 'ON');
  const [maritalStatus, setMaritalStatus] = useState(formData.maritalStatus || 'single');
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

  const provinces = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' },
  ];

  const handleSave = async () => {
    setIsLoading(true);

    const data = {
      province,
      maritalStatus,
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
        const errorMessage = errorData.error || errorData.message || 'Failed to save information';
        throw new Error(errorMessage);
      }

      updateFormData(data);
      onNext();
    } catch (error) {
      console.error('Error saving information:', error);
      const message = error instanceof Error ? error.message : 'Failed to save information. Please try again.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's Get Started</h2>
        <p className="text-gray-600">
          Just two quick questions to personalize your retirement plan.
        </p>
      </div>

      <div className="space-y-6">
        {/* Province */}
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
            Which province do you live in?
          </label>
          <select
            id="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            {provinces.map((prov) => (
              <option key={prov.value} value={prov.value}>
                {prov.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            This helps us calculate accurate tax and benefit amounts for your region
          </p>
        </div>

        {/* Marital Status */}
        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-2">
            What's your marital status?
          </label>
          <select
            id="maritalStatus"
            value={maritalStatus}
            onChange={(e) => setMaritalStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="common-law">Common-law</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            This affects your tax calculations and certain benefits
          </p>
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
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
