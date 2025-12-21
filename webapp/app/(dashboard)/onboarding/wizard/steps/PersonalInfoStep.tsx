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
  const [firstName, setFirstName] = useState(formData.firstName || '');
  const [lastName, setLastName] = useState(formData.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(formData.dateOfBirth || '');
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
      firstName,
      lastName,
      dateOfBirth,
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
        const errorMessage = errorData.error || errorData.message || 'Failed to save personal information';
        throw new Error(errorMessage);
      }

      updateFormData(data);
      onNext();
    } catch (error) {
      console.error('Error saving personal information:', error);
      const message = error instanceof Error ? error.message : 'Failed to save personal information. Please try again.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">
          Let's start with your basic information to personalize your retirement plan.
        </p>
      </div>

      <div className="space-y-6">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your first name"
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter your last name"
            required
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              min="1900-01-01"
              max={new Date().toISOString().split('T')[0]}
              placeholder="YYYY-MM-DD"
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
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

        {/* Province */}
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
            Province <span className="text-red-500">*</span>
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
            Your province affects tax calculations and some benefit amounts
          </p>
        </div>

        {/* Marital Status */}
        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-2">
            Marital Status <span className="text-red-500">*</span>
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
            This helps us provide accurate tax and benefit calculations
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
          disabled={isLoading || !firstName || !lastName || !dateOfBirth}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {isLoading ? 'Saving...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
}
