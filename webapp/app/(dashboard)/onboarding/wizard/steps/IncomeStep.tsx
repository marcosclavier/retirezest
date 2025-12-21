'use client';

import { useState, useEffect } from 'react';

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
  // Initialize state from formData.incomes if available
  const getIncomeAmount = (type: string) => {
    if (formData.incomes && Array.isArray(formData.incomes)) {
      const income = formData.incomes.find((i: any) => i.type === type);
      return income ? String(income.amount) : '';
    }
    return '';
  };

  const [skipForNow, setSkipForNow] = useState(false);
  const [employmentIncome, setEmploymentIncome] = useState(() => getIncomeAmount('employment'));
  const [pensionIncome, setPensionIncome] = useState(() => getIncomeAmount('pension'));
  const [rentalIncome, setRentalIncome] = useState(() => getIncomeAmount('rental'));
  const [otherIncome, setOtherIncome] = useState(() => getIncomeAmount('other'));
  const [isLoading, setIsLoading] = useState(false);

  // Update state when formData changes
  useEffect(() => {
    if (formData.incomes && Array.isArray(formData.incomes)) {
      setEmploymentIncome(getIncomeAmount('employment'));
      setPensionIncome(getIncomeAmount('pension'));
      setRentalIncome(getIncomeAmount('rental'));
      setOtherIncome(getIncomeAmount('other'));
    }
  }, [formData.incomes]);

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

      if (employmentIncome && parseFloat(employmentIncome) > 0) {
        incomes.push({
          type: 'employment',
          description: 'Employment Income',
          amount: parseFloat(employmentIncome),
          frequency: 'annual',
          owner: 'person1',
          isTaxable: true,
        });
      }

      if (pensionIncome && parseFloat(pensionIncome) > 0) {
        incomes.push({
          type: 'pension',
          description: 'Employer Pension',
          amount: parseFloat(pensionIncome),
          frequency: 'annual',
          owner: 'person1',
          isTaxable: true,
        });
      }

      if (rentalIncome && parseFloat(rentalIncome) > 0) {
        incomes.push({
          type: 'rental',
          description: 'Rental Income',
          amount: parseFloat(rentalIncome),
          frequency: 'annual',
          owner: 'person1',
          isTaxable: true,
        });
      }

      if (otherIncome && parseFloat(otherIncome) > 0) {
        incomes.push({
          type: 'other',
          description: 'Other Income',
          amount: parseFloat(otherIncome),
          frequency: 'annual',
          owner: 'person1',
          isTaxable: true,
        });
      }

      for (const income of incomes) {
        const response = await fetch('/api/user/income', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(income),
        });

        if (!response.ok) {
          throw new Error('Failed to save income');
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
                  type="number"
                  id="employment"
                  value={employmentIncome}
                  onChange={(e) => setEmploymentIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="1000"
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
                  type="number"
                  id="pension"
                  value={pensionIncome}
                  onChange={(e) => setPensionIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="1000"
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
                  type="number"
                  id="rental"
                  value={rentalIncome}
                  onChange={(e) => setRentalIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="500"
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
                  type="number"
                  id="other"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="500"
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
