'use client';

import { useState, useEffect, useCallback } from 'react';

interface PartnerIncomeStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function PartnerIncomeStep({
  formData,
  updateFormData,
  onNext,
}: PartnerIncomeStepProps) {
  const [skipForNow, setSkipForNow] = useState(false);
  const [employmentIncome, setEmploymentIncome] = useState('');
  const [pensionIncome, setPensionIncome] = useState('');
  const [rentalIncome, setRentalIncome] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Initialize state from formData.incomes if available (filter for person2/partner)
  const getPartnerIncomeAmount = useCallback((type: string) => {
    if (formData.incomes && Array.isArray(formData.incomes)) {
      const income = formData.incomes.find((i: any) => i.type === type && i.owner === 'person2');
      return income ? String(income.amount) : '';
    }
    return '';
  }, [formData.incomes]);

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

  // Update state when formData changes
  useEffect(() => {
    if (formData.incomes && Array.isArray(formData.incomes)) {
      setEmploymentIncome(getPartnerIncomeAmount('employment'));
      setPensionIncome(getPartnerIncomeAmount('pension'));
      setRentalIncome(getPartnerIncomeAmount('rental'));
      setOtherIncome(getPartnerIncomeAmount('other'));
    }
  }, [formData.incomes, getPartnerIncomeAmount]);

  const handleSave = async () => {
    // Validation: Either skip is checked OR at least one field has a value
    const hasAnyIncome = employmentIncome || pensionIncome || rentalIncome || otherIncome;

    if (!skipForNow && !hasAnyIncome) {
      alert('Please enter at least one income amount for your partner or check "Skip for now" to continue.');
      return;
    }

    setIsLoading(true);

    if (skipForNow) {
      updateFormData({ partnerIncomeSkipped: true });
      onNext();
      setIsLoading(false);
      return;
    }

    try {
      const incomes = [];

      if (employmentIncome && parseFloat(employmentIncome) > 0) {
        incomes.push({
          type: 'employment',
          description: `${formData.partnerFirstName || 'Partner'} Employment Income`,
          amount: parseFloat(employmentIncome),
          frequency: 'annual',
          owner: 'person2',
          isTaxable: true,
        });
      }

      if (pensionIncome && parseFloat(pensionIncome) > 0) {
        incomes.push({
          type: 'pension',
          description: `${formData.partnerFirstName || 'Partner'} Employer Pension`,
          amount: parseFloat(pensionIncome),
          frequency: 'annual',
          owner: 'person2',
          isTaxable: true,
        });
      }

      if (rentalIncome && parseFloat(rentalIncome) > 0) {
        incomes.push({
          type: 'rental',
          description: `${formData.partnerFirstName || 'Partner'} Rental Income`,
          amount: parseFloat(rentalIncome),
          frequency: 'annual',
          owner: 'person2',
          isTaxable: true,
        });
      }

      if (otherIncome && parseFloat(otherIncome) > 0) {
        incomes.push({
          type: 'other',
          description: `${formData.partnerFirstName || 'Partner'} Other Income`,
          amount: parseFloat(otherIncome),
          frequency: 'annual',
          owner: 'person2',
          isTaxable: true,
        });
      }

      for (const income of incomes) {
        const response = await fetch('/api/profile/income', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify(income),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', errorData);
          const errorMessage = errorData.error || errorData.message || 'Failed to save partner income';
          throw new Error(errorMessage);
        }
      }

      updateFormData({ partnerIncomeAdded: true, partnerIncomeCount: incomes.length });
      onNext();
    } catch (error) {
      console.error('Error saving partner income:', error);
      alert('Failed to save partner income. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const partnerName = formData.partnerFirstName || 'Your Partner';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{partnerName}'s Income Sources</h2>
        <p className="text-gray-600">
          Add {partnerName}'s current income sources. This helps us project your combined retirement savings potential.
        </p>
      </div>

      <div className="space-y-6">
        {/* Skip Option */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="skipPartnerIncome"
                type="checkbox"
                checked={skipForNow}
                onChange={(e) => setSkipForNow(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="skipPartnerIncome" className="font-medium text-gray-900">
                Skip for now - I'll add partner income later
              </label>
              <p className="text-sm text-gray-600 mt-1">
                You can add detailed partner income information from the Financial Profile page anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Income Input Fields */}
        {!skipForNow && (
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Enter annual amounts (before taxes). CPP and OAS can be calculated later from the Benefits page.
              </p>
            </div>

            {/* Employment Income */}
            <div>
              <label htmlFor="partner-employment" className="block text-sm font-medium text-gray-700 mb-2">
                Employment Income (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-employment"
                  value={employmentIncome}
                  onChange={(e) => setEmploymentIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {partnerName}'s salary or wages from employment (before taxes and deductions)
              </p>
            </div>

            {/* Pension Income */}
            <div>
              <label htmlFor="partner-pension" className="block text-sm font-medium text-gray-700 mb-2">
                Employer Pension (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-pension"
                  value={pensionIncome}
                  onChange={(e) => setPensionIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                If {partnerName} is already receiving a workplace pension (DB or DC)
              </p>
            </div>

            {/* Rental Income */}
            <div>
              <label htmlFor="partner-rental" className="block text-sm font-medium text-gray-700 mb-2">
                Rental Income (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-rental"
                  value={rentalIncome}
                  onChange={(e) => setRentalIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Net rental income from {partnerName}'s investment properties
              </p>
            </div>

            {/* Other Income */}
            <div>
              <label htmlFor="partner-other" className="block text-sm font-medium text-gray-700 mb-2">
                Other Income (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="partner-other"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0.00"
                  min="0"
                  step="500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {partnerName}'s side business, dividends, or any other regular income
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save and Continue Button */}
      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {isLoading ? 'Saving...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
}
