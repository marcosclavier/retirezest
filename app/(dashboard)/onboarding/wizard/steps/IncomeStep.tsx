'use client';

import { useState, useEffect, useCallback } from 'react';

interface IncomeStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function IncomeStep({
  formData,
  updateFormData,
  onNext,
}: IncomeStepProps) {
  const [skipForNow, setSkipForNow] = useState(false);
  const [employmentIncome, setEmploymentIncome] = useState('');
  const [pensionIncome, setPensionIncome] = useState('');
  const [rentalIncome, setRentalIncome] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Helper functions for number formatting
  const formatWithCommas = (value: string | number): string => {
    const numValue = typeof value === 'string' ? value.replace(/,/g, '') : String(value);
    const num = parseFloat(numValue);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const removeCommas = (value: string): string => {
    return value.replace(/,/g, '');
  };

  const handleNumberInput = (value: string, setter: (val: string) => void) => {
    // Allow only numbers and commas
    const cleaned = value.replace(/[^\d,]/g, '');
    setter(cleaned);
  };

  const handleNumberBlur = (value: string, setter: (val: string) => void) => {
    // Format with commas on blur
    if (value) {
      const formatted = formatWithCommas(removeCommas(value));
      setter(formatted);
    }
  };

  // Initialize state from formData.incomes if available
  const getIncomeAmount = useCallback((type: string) => {
    if (formData.incomes && Array.isArray(formData.incomes)) {
      const income = formData.incomes.find((i: any) => i.type === type);
      return income ? formatWithCommas(income.amount) : '';
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
      setEmploymentIncome(getIncomeAmount('employment'));
      setPensionIncome(getIncomeAmount('pension'));
      setRentalIncome(getIncomeAmount('rental'));
      setOtherIncome(getIncomeAmount('other'));
    }
  }, [formData.incomes, getIncomeAmount]);

  const handleSave = async () => {
    // Validation: Either skip is checked OR at least one field has a value
    const hasAnyIncome = employmentIncome || pensionIncome || rentalIncome || otherIncome;

    if (!skipForNow && !hasAnyIncome) {
      alert('Please enter at least one income amount or check "Skip for now" to continue.');
      return;
    }

    setIsLoading(true);

    if (skipForNow) {
      updateFormData({ incomeSkipped: true });
      onNext();
      setIsLoading(false);
      return;
    }

    try {
      const incomes = [];

      if (employmentIncome && parseFloat(removeCommas(employmentIncome)) > 0) {
        incomes.push({
          type: 'employment',
          description: 'Employment Income',
          amount: parseFloat(removeCommas(employmentIncome)),
          frequency: 'annual',
          owner: 'person1',
          isTaxable: true,
        });
      }

      if (pensionIncome && parseFloat(removeCommas(pensionIncome)) > 0) {
        incomes.push({
          type: 'pension',
          description: 'Employer Pension',
          amount: parseFloat(removeCommas(pensionIncome)),
          frequency: 'annual',
          owner: 'person1',
          isTaxable: true,
        });
      }

      if (rentalIncome && parseFloat(removeCommas(rentalIncome)) > 0) {
        incomes.push({
          type: 'rental',
          description: 'Rental Income',
          amount: parseFloat(removeCommas(rentalIncome)),
          frequency: 'annual',
          owner: 'person1',
          isTaxable: true,
        });
      }

      if (otherIncome && parseFloat(removeCommas(otherIncome)) > 0) {
        incomes.push({
          type: 'other',
          description: 'Other Income',
          amount: parseFloat(removeCommas(otherIncome)),
          frequency: 'annual',
          owner: 'person1',
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
          const errorMessage = errorData.error || errorData.message || 'Failed to save income';
          throw new Error(errorMessage);
        }
      }

      updateFormData({ incomeAdded: true, incomeCount: incomes.length });
      onNext();
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Failed to save income. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Income Sources</h2>
        <p className="text-gray-600">
          Add your current income sources. This helps us project your retirement savings potential.
        </p>
      </div>

      <div className="space-y-6">
        {/* Skip Option */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="skipIncome"
                type="checkbox"
                checked={skipForNow}
                onChange={(e) => setSkipForNow(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="skipIncome" className="font-medium text-gray-900">
                Skip for now - I'll add my income later
              </label>
              <p className="text-sm text-gray-600 mt-1">
                You can add detailed income information from the Financial Profile page anytime.
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
              <label htmlFor="employment" className="block text-sm font-medium text-gray-700 mb-2">
                Employment Income (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="employment"
                  value={employmentIncome}
                  onChange={(e) => handleNumberInput(e.target.value, setEmploymentIncome)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setEmploymentIncome)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your salary or wages from employment (before taxes and deductions)
              </p>
            </div>

            {/* Pension Income */}
            <div>
              <label htmlFor="pension" className="block text-sm font-medium text-gray-700 mb-2">
                Employer Pension (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="pension"
                  value={pensionIncome}
                  onChange={(e) => handleNumberInput(e.target.value, setPensionIncome)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setPensionIncome)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                If you're already receiving a workplace pension (DB or DC)
              </p>
            </div>

            {/* Rental Income */}
            <div>
              <label htmlFor="rental" className="block text-sm font-medium text-gray-700 mb-2">
                Rental Income (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="rental"
                  value={rentalIncome}
                  onChange={(e) => handleNumberInput(e.target.value, setRentalIncome)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setRentalIncome)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Net rental income from investment properties
              </p>
            </div>

            {/* Other Income */}
            <div>
              <label htmlFor="other" className="block text-sm font-medium text-gray-700 mb-2">
                Other Income (Annual)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="text"
                  id="other"
                  value={otherIncome}
                  onChange={(e) => handleNumberInput(e.target.value, setOtherIncome)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setOtherIncome)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold text-gray-900"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Side business, dividends, or any other regular income
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
