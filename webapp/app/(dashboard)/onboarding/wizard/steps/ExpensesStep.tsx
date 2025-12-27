'use client';

import { useState, useEffect } from 'react';

interface ExpensesStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function ExpensesStep({
  formData,
  updateFormData,
  onNext,
}: ExpensesStepProps) {
  // Initialize state from formData.expenses if available
  const getMonthlyExpenses = () => {
    if (formData.expenses && Array.isArray(formData.expenses)) {
      // Find the "Total Monthly Expenses" entry
      const totalExpense = formData.expenses.find(
        (e: any) => e.description === 'Total Monthly Expenses' && e.frequency === 'monthly'
      );
      return totalExpense ? String(totalExpense.amount) : '';
    }
    return '';
  };

  const [skipForNow, setSkipForNow] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState(() => getMonthlyExpenses());
  const [isLoading, setIsLoading] = useState(false);

  // Update state when formData changes
  useEffect(() => {
    if (formData.expenses && Array.isArray(formData.expenses)) {
      setMonthlyExpenses(getMonthlyExpenses());
    }
  }, [formData.expenses]);

  const handleSave = async () => {
    // Validation: Either skip is checked OR monthly expenses has a value
    if (!skipForNow && !monthlyExpenses) {
      alert('Please enter your monthly expenses or check "Skip for now" to continue.');
      return;
    }

    setIsLoading(true);

    if (skipForNow) {
      updateFormData({ expensesSkipped: true });
      onNext();
      setIsLoading(false);
      return;
    }

    try {
      if (monthlyExpenses && parseFloat(monthlyExpenses) > 0) {
        const response = await fetch('/api/profile/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: 'other',
            description: 'Total Monthly Expenses',
            amount: parseFloat(monthlyExpenses),
            frequency: 'monthly',
            essential: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save expenses');
        }
      }

      updateFormData({ expensesAdded: true, monthlyExpenses });
      onNext();
    } catch (error) {
      console.error('Error saving expenses:', error);
      alert('Failed to save expenses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Monthly Expenses</h2>
        <p className="text-gray-600">
          Understanding your spending helps us calculate how much you'll need in retirement.
        </p>
      </div>

      <div className="space-y-6">
        {/* Skip Option */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="skipExpenses"
                type="checkbox"
                checked={skipForNow}
                onChange={(e) => setSkipForNow(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="skipExpenses" className="font-medium text-gray-900">
                Skip for now - I'll add my expenses later
              </label>
              <p className="text-sm text-gray-600 mt-1">
                You can add detailed expense categories from the Financial Profile page anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Expense Input */}
        {!skipForNow && (
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What to include:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Housing (mortgage/rent, utilities, property taxes)</li>
                <li>• Food and groceries</li>
                <li>• Transportation (car payments, insurance, gas)</li>
                <li>• Insurance (health, life, home)</li>
                <li>• Entertainment and hobbies</li>
                <li>• Subscriptions and memberships</li>
                <li>• Healthcare and medications</li>
                <li>• Debt payments</li>
              </ul>
            </div>

            {/* Monthly Expenses */}
            <div>
              <label htmlFor="monthlyExpenses" className="block text-sm font-medium text-gray-700 mb-2">
                Total Monthly Expenses <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="monthlyExpenses"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                  placeholder="0.00"
                  min="0"
                  step="100"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter an approximate total. You can break this down into categories later.
              </p>

              {/* Annual Preview */}
              {monthlyExpenses && parseFloat(monthlyExpenses) > 0 && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                  <p className="text-sm text-indigo-900">
                    <strong>Annual Expenses:</strong> ${(parseFloat(monthlyExpenses) * 12).toLocaleString()}
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    This will be used as your baseline retirement spending requirement
                  </p>
                </div>
              )}
            </div>

            {/* Helpful Tips */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 text-sm">Tip: Quick Estimate</h4>
              <p className="text-sm text-green-800">
                Check your bank statements from the last 2-3 months to get an accurate average.
                Don't forget irregular expenses like annual insurance premiums or property taxes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save and Continue Button */}
      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={isLoading || (!skipForNow && !monthlyExpenses)}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {isLoading ? 'Saving...' : 'Save and Continue'}
        </button>
      </div>
    </div>
  );
}
