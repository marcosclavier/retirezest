'use client';

import { useState, useEffect } from 'react';

interface PartnerInfoStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function PartnerInfoStep({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: PartnerInfoStepProps) {
  const [includePartner, setIncludePartner] = useState(formData.includePartner || false);
  const [partnerFirstName, setPartnerFirstName] = useState(formData.partnerFirstName || '');
  const [partnerLastName, setPartnerLastName] = useState(formData.partnerLastName || '');
  const [partnerDateOfBirth, setPartnerDateOfBirth] = useState(formData.partnerDateOfBirth || '');
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
      includePartner,
      partnerFirstName: includePartner ? partnerFirstName : null,
      partnerLastName: includePartner ? partnerLastName : null,
      partnerDateOfBirth: includePartner ? partnerDateOfBirth : null,
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
        const errorMessage = errorData.error || errorData.message || 'Failed to save partner information';
        throw new Error(errorMessage);
      }

      updateFormData(data);
      onNext();
    } catch (error) {
      console.error('Error saving partner information:', error);
      const message = error instanceof Error ? error.message : 'Failed to save partner information. Please try again.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = !includePartner || (partnerFirstName && partnerLastName && partnerDateOfBirth);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner Information</h2>
        <p className="text-gray-600">
          Are you planning retirement with a partner or spouse?
        </p>
      </div>

      <div className="space-y-6">
        {/* Include Partner Toggle */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="includePartner"
                type="checkbox"
                checked={includePartner}
                onChange={(e) => setIncludePartner(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="includePartner" className="font-medium text-gray-900">
                I'm planning retirement with a partner
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Including your partner allows for joint retirement planning, combined income strategies,
                and household benefit calculations.
              </p>
            </div>
          </div>
        </div>

        {/* Partner Details (shown when includePartner is true) */}
        {includePartner && (
          <div className="space-y-6 pl-4 border-l-4 border-indigo-200">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Partner planning features include joint tax calculations, income
                splitting strategies, and combined CPP/OAS benefit optimization.
              </p>
            </div>

            {/* Partner First Name */}
            <div>
              <label htmlFor="partnerFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                Partner's First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="partnerFirstName"
                value={partnerFirstName}
                onChange={(e) => setPartnerFirstName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter partner's first name"
                required={includePartner}
              />
            </div>

            {/* Partner Last Name */}
            <div>
              <label htmlFor="partnerLastName" className="block text-sm font-medium text-gray-700 mb-2">
                Partner's Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="partnerLastName"
                value={partnerLastName}
                onChange={(e) => setPartnerLastName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter partner's last name"
                required={includePartner}
              />
            </div>

            {/* Partner Date of Birth */}
            <div>
              <label htmlFor="partnerDateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Partner's Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="partnerDateOfBirth"
                  value={partnerDateOfBirth}
                  onChange={(e) => setPartnerDateOfBirth(e.target.value)}
                  min="1900-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required={includePartner}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-blue-600 font-medium mt-1">
                Safari users: Click the calendar icon above to select the date. Do not type the year directly.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Or type the complete date at once: YYYY-MM-DD (e.g., 1959-12-20)
              </p>
            </div>
          </div>
        )}

        {/* Skip Option */}
        {!includePartner && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              No problem! You can always add partner information later from your profile settings.
              We'll focus on individual planning for now.
            </p>
          </div>
        )}
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
          disabled={isLoading || !canProceed}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {isLoading ? 'Saving...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
}
