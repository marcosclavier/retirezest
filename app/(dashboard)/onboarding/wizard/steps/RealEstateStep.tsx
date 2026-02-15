'use client';

import { useState, useEffect } from 'react';

interface RealEstateStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function RealEstateStep({
  formData,
  updateFormData,
  onNext,
}: RealEstateStepProps) {
  const [skipForNow, setSkipForNow] = useState(false);
  const [hasProperty, setHasProperty] = useState<boolean | null>(null);
  const [hasExistingProperties, setHasExistingProperties] = useState(false);
  const [existingPropertiesCount, setExistingPropertiesCount] = useState(0);

  // Fetch existing real estate properties
  useEffect(() => {
    const fetchExistingProperties = async () => {
      try {
        const response = await fetch('/api/profile/real-estate', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const properties = data.realEstateAssets || [];

          if (Array.isArray(properties) && properties.length > 0) {
            setHasExistingProperties(true);
            setExistingPropertiesCount(properties.length);
            setHasProperty(true);
          }
        }
      } catch (error) {
        console.error('Error fetching real estate:', error);
      }
    };

    fetchExistingProperties();
  }, []);

  // Initialize from formData
  useEffect(() => {
    if (formData.hasRealEstate !== undefined) {
      setHasProperty(formData.hasRealEstate);
    }
  }, [formData.hasRealEstate]);

  const handleNext = () => {
    // Update formData with the choice
    updateFormData({
      ...formData,
      hasRealEstate: skipForNow ? false : hasProperty,
    });

    onNext();
  };

  const handleSkip = () => {
    setSkipForNow(true);
    updateFormData({
      ...formData,
      hasRealEstate: false,
    });
    onNext();
  };

  const handleManageProperties = () => {
    // Open real estate page in new tab
    window.open('/profile/real-estate', '_blank');
  };

  const canProceed = hasProperty !== null || skipForNow;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Real Estate</h2>
        <p className="mt-2 text-sm text-gray-600">
          Do you own any real estate? (home, rental properties, etc.)
        </p>
      </div>

      {/* Existing Properties Info */}
      {hasExistingProperties && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-green-400 mt-0.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Properties Found
              </h3>
              <p className="mt-1 text-sm text-green-700">
                We found {existingPropertiesCount} {existingPropertiesCount === 1 ? 'property' : 'properties'} in your profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Question: Do you own property? */}
      {!hasExistingProperties && (
        <div className="space-y-4">
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">
              Do you own any real estate?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setHasProperty(true)}
                className={`p-4 border-2 rounded-lg text-center transition ${
                  hasProperty === true
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">🏠</div>
                <div className="font-medium text-gray-900">Yes</div>
                <div className="text-xs text-gray-600 mt-1">
                  I own property
                </div>
              </button>
              <button
                type="button"
                onClick={() => setHasProperty(false)}
                className={`p-4 border-2 rounded-lg text-center transition ${
                  hasProperty === false
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">📋</div>
                <div className="font-medium text-gray-900">No</div>
                <div className="text-xs text-gray-600 mt-1">
                  I don't own property
                </div>
              </button>
            </div>
          </div>

          {/* Info card about property types */}
          {hasProperty === true && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Property Types We Track
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Principal Residence:</strong> Your primary home (100% tax-free gains)</li>
                <li>• <strong>Rental Properties:</strong> Investment properties with rental income</li>
                <li>• <strong>Vacation Properties:</strong> Cottages, cabins, second homes</li>
                <li>• <strong>Commercial Properties:</strong> Business real estate</li>
              </ul>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleManageProperties}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Add Properties Now (opens in new tab)
                </button>
                <p className="mt-2 text-xs text-blue-600">
                  You can also add properties later from your profile
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manage existing properties */}
      {hasExistingProperties && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Manage Your Properties
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            Your real estate will be included in retirement simulations. You can update property values, mortgages, and rental income anytime.
          </p>
          <button
            type="button"
            onClick={handleManageProperties}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View & Edit Properties (opens in new tab)
          </button>
        </div>
      )}

      {/* Skip option */}
      {!hasExistingProperties && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-yellow-400 mt-0.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Optional Step</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You can skip this step and add properties later from your profile.
                Real estate can significantly impact retirement planning (equity, downsizing, rental income).
              </p>
              <button
                type="button"
                onClick={handleSkip}
                className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={handleSkip}
          className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
