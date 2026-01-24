'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [skipForNow, setSkipForNow] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [hasExistingExpenses, setHasExistingExpenses] = useState(false);

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

  // Initialize state from formData.expenses if available
  const getMonthlyExpenses = useCallback(() => {
    if (formData.expenses && Array.isArray(formData.expenses)) {
      // Find the "Total Monthly Expenses" entry
      const totalExpense = formData.expenses.find(
        (e: any) => e.description === 'Total Monthly Expenses' && e.frequency === 'monthly'
      );
      return totalExpense ? formatWithCommas(totalExpense.amount) : '';
    }
    return '';
  }, [formData.expenses]);

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

  // Fetch existing expenses and calculate total monthly expenses
  useEffect(() => {
    const fetchExistingExpenses = async () => {
      try {
        const response = await fetch('/api/profile/expenses', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const expenses = data.expenses || [];

          if (Array.isArray(expenses) && expenses.length > 0) {
            setHasExistingExpenses(true);

            // Calculate total monthly expenses from all recurring expenses
            let totalMonthly = 0;
            expenses.forEach((expense: any) => {
              // Only include recurring expenses in the total
              if (expense.isRecurring !== false) {
                const amount = parseFloat(expense.amount) || 0;

                // Convert to monthly based on frequency
                switch (expense.frequency) {
                  case 'monthly':
                    totalMonthly += amount;
                    break;
                  case 'annual':
                    totalMonthly += amount / 12;
                    break;
                  case 'weekly':
                    totalMonthly += amount * 52 / 12;
                    break;
                  case 'biweekly':
                    totalMonthly += amount * 26 / 12;
                    break;
                  default:
                    totalMonthly += amount; // Default to monthly
                }
              }
            });

            // Pre-populate with calculated total (read-only)
            if (totalMonthly > 0) {
              setMonthlyExpenses(formatWithCommas(totalMonthly));
            }

            console.log('[Expenses] User has', expenses.length, 'existing expenses. Total monthly:', totalMonthly);
          }
        }
      } catch (error) {
        console.error('[Expenses] Failed to fetch existing expenses:', error);
      }
    };

    fetchExistingExpenses();
  }, []);

  // Update state when formData changes (only if no existing expenses)
  useEffect(() => {
    if (!hasExistingExpenses && formData.expenses && Array.isArray(formData.expenses)) {
      setMonthlyExpenses(getMonthlyExpenses());
    }
  }, [formData.expenses, getMonthlyExpenses, hasExistingExpenses]);

  const handleSave = async () => {
    setIsLoading(true);

    // If user has existing expenses, field is read-only - just continue to next step
    if (hasExistingExpenses) {
      updateFormData({ expensesViewed: true });
      onNext();
      setIsLoading(false);
      return;
    }

    // Validation: Either skip is checked OR monthly expenses has a value
    if (!skipForNow && !monthlyExpenses) {
      alert('Please enter your monthly expenses or check "Skip for now" to continue.');
      setIsLoading(false);
      return;
    }

    if (skipForNow) {
      updateFormData({ expensesSkipped: true });
      onNext();
      setIsLoading(false);
      return;
    }

    try {
      if (monthlyExpenses && parseFloat(removeCommas(monthlyExpenses)) > 0) {
        // Check if "Total Monthly Expenses" already exists
        const existingExpense = formData.expenses?.find(
          (e: any) => e.description === 'Total Monthly Expenses' && e.frequency === 'monthly'
        );

        let response;
        if (existingExpense) {
          // Update existing expense
          response = await fetch('/api/profile/expenses', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
            body: JSON.stringify({
              id: existingExpense.id,
              category: 'other',
              description: 'Total Monthly Expenses',
              amount: parseFloat(removeCommas(monthlyExpenses)),
              frequency: 'monthly',
              essential: true,
            }),
          });
        } else {
          // Create new expense
          response = await fetch('/api/profile/expenses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
            body: JSON.stringify({
              category: 'other',
              description: 'Total Monthly Expenses',
              amount: parseFloat(removeCommas(monthlyExpenses)),
              frequency: 'monthly',
              essential: true,
            }),
          });
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error Response:', errorData);
          const errorMessage = errorData.error || errorData.message || 'Failed to save expenses';
          throw new Error(errorMessage);
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
        {/* Warning for Existing Expenses */}
        {hasExistingExpenses && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Your Current Monthly Expenses (Read-Only)
                </h3>
                <p className="text-sm text-blue-700 mt-1 mb-3">
                  The value shown below is calculated from all your recurring expenses in your financial profile. This field is read-only in the wizard.
                </p>
                <a
                  href="/profile/expenses"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
                >
                  Edit in Financial Profile →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Skip Option - only show if no existing expenses */}
        {!hasExistingExpenses && (
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
        )}

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
                  type="text"
                  id="monthlyExpenses"
                  value={monthlyExpenses}
                  onChange={(e) => handleNumberInput(e.target.value, setMonthlyExpenses)}
                  onBlur={(e) => handleNumberBlur(e.target.value, setMonthlyExpenses)}
                  disabled={hasExistingExpenses}
                  className={`w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-bold ${hasExistingExpenses ? 'bg-gray-100 text-gray-700 cursor-not-allowed' : 'text-gray-900'}`}
                  placeholder="0"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter an approximate total. You can break this down into categories later.
              </p>

              {/* Annual Preview */}
              {monthlyExpenses && parseFloat(removeCommas(monthlyExpenses)) > 0 && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                  <p className="text-sm text-indigo-900">
                    <strong>Annual Expenses:</strong> ${(parseFloat(removeCommas(monthlyExpenses)) * 12).toLocaleString()}
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
