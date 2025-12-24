'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  frequency: string;
  essential: boolean;
  isEssential: boolean; // Legacy field for backwards compatibility
  notes: string | null;
  isRecurring: boolean;
  plannedYear: number | null;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [formData, setFormData] = useState({
    category: 'housing',
    description: '',
    amount: '',
    frequency: 'monthly',
    isEssential: true,
    notes: '',
    isRecurring: true,
    plannedYear: '',
  });

  useEffect(() => {
    fetchExpenses();
    fetchCsrfToken();
  }, []);

  const fetchCsrfToken = async () => {
    try {
      const res = await fetch('/api/csrf');
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.token);
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/profile/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure we have a CSRF token before submitting
    if (!csrfToken) {
      alert('Security token not loaded. Please refresh the page and try again.');
      return;
    }

    setLoading(true);

    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? {
          id: editingId,
          ...formData,
          plannedYear: formData.plannedYear ? parseInt(formData.plannedYear) : null
        }
      : {
          ...formData,
          plannedYear: formData.plannedYear ? parseInt(formData.plannedYear) : null
        };

    try {
      const res = await fetch('/api/profile/expenses', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchExpenses();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          category: 'housing',
          description: '',
          amount: '',
          frequency: 'monthly',
          isEssential: true,
          notes: '',
          isRecurring: true,
          plannedYear: '',
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      category: expense.category,
      description: expense.description || '',
      amount: expense.amount.toString(),
      frequency: expense.frequency,
      isEssential: expense.essential || expense.isEssential,
      notes: expense.notes || '',
      isRecurring: expense.isRecurring,
      plannedYear: expense.plannedYear?.toString() || '',
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const res = await fetch(`/api/profile/expenses?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      if (res.ok) {
        fetchExpenses();
      } else {
        alert('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const calculateMonthlyExpenses = () => {
    return expenses.reduce((total, expense) => {
      // Only include recurring expenses in monthly/annual totals
      if (!expense.isRecurring) return total;

      const amount = expense.frequency === 'annual' ? expense.amount / 12 : expense.amount;
      return total + amount;
    }, 0);
  };

  const calculateEssentialVsDiscretionary = () => {
    let essential = 0;
    let discretionary = 0;
    expenses.forEach(expense => {
      // Only include recurring expenses in monthly/annual totals
      if (!expense.isRecurring) return;

      const amount = expense.frequency === 'annual' ? expense.amount / 12 : expense.amount;
      const isEssential = expense.essential !== undefined ? expense.essential : expense.isEssential;
      if (isEssential) {
        essential += amount;
      } else {
        discretionary += amount;
      }
    });
    return { essential, discretionary };
  };

  // Helper function to organize ALL expenses by year and category, split by essential/discretionary
  const getExpensesByYear = () => {
    const oneTimeExpenses = expenses.filter(e => !e.isRecurring && e.plannedYear);

    // Get unique years from one-time expenses and sort them
    const oneTimeYears = [...new Set(oneTimeExpenses.map(e => e.plannedYear!))];

    // Get current year and next 5 years
    const currentYear = new Date().getFullYear();
    const next5Years = Array.from({ length: 5 }, (_, i) => currentYear + i);

    // Combine years (only show years that have one-time expenses or are in next 5 years)
    const allYears = [...new Set([...oneTimeYears, ...next5Years])].sort();

    // Get all unique categories from all expenses
    const categories = [...new Set(expenses.map(e => e.category))];

    // Build table data - separate essential and discretionary
    const tableData: {
      [year: number]: {
        [category: string]: {
          essential: number;
          discretionary: number;
        }
      }
    } = {};

    allYears.forEach(year => {
      tableData[year] = {};
      categories.forEach(category => {
        // Get one-time expenses for this year and category
        const oneTimeEssential = oneTimeExpenses
          .filter(e => e.plannedYear === year && e.category === category && (e.essential || e.isEssential))
          .reduce((sum, e) => sum + e.amount, 0);

        const oneTimeDiscretionary = oneTimeExpenses
          .filter(e => e.plannedYear === year && e.category === category && !(e.essential || e.isEssential))
          .reduce((sum, e) => sum + e.amount, 0);

        // Get recurring expenses for this category (annualized)
        const recurringEssential = expenses
          .filter(e => e.isRecurring && e.category === category && (e.essential || e.isEssential))
          .reduce((sum, e) => {
            const annualAmount = e.frequency === 'monthly' ? e.amount * 12 : e.amount;
            return sum + annualAmount;
          }, 0);

        const recurringDiscretionary = expenses
          .filter(e => e.isRecurring && e.category === category && !(e.essential || e.isEssential))
          .reduce((sum, e) => {
            const annualAmount = e.frequency === 'monthly' ? e.amount * 12 : e.amount;
            return sum + annualAmount;
          }, 0);

        const essentialTotal = oneTimeEssential + recurringEssential;
        const discretionaryTotal = oneTimeDiscretionary + recurringDiscretionary;

        if (essentialTotal > 0 || discretionaryTotal > 0) {
          tableData[year][category] = {
            essential: essentialTotal,
            discretionary: discretionaryTotal
          };
        }
      });
    });

    return { years: allYears, categories, tableData };
  };

  // Calculate totals by year (recurring annual + one-time for that year), split by essential/discretionary
  const getYearTotal = (year: number, type?: 'essential' | 'discretionary'): number => {
    if (type === 'essential') {
      const oneTimeEssential = expenses
        .filter(e => !e.isRecurring && e.plannedYear === year && (e.essential || e.isEssential))
        .reduce((sum, e) => sum + e.amount, 0);

      const recurringEssential = expenses
        .filter(e => e.isRecurring && (e.essential || e.isEssential))
        .reduce((sum, e) => {
          const annualAmount = e.frequency === 'monthly' ? e.amount * 12 : e.amount;
          return sum + annualAmount;
        }, 0);

      return oneTimeEssential + recurringEssential;
    } else if (type === 'discretionary') {
      const oneTimeDiscretionary = expenses
        .filter(e => !e.isRecurring && e.plannedYear === year && !(e.essential || e.isEssential))
        .reduce((sum, e) => sum + e.amount, 0);

      const recurringDiscretionary = expenses
        .filter(e => e.isRecurring && !(e.essential || e.isEssential))
        .reduce((sum, e) => {
          const annualAmount = e.frequency === 'monthly' ? e.amount * 12 : e.amount;
          return sum + annualAmount;
        }, 0);

      return oneTimeDiscretionary + recurringDiscretionary;
    } else {
      // Total (essential + discretionary)
      return getYearTotal(year, 'essential') + getYearTotal(year, 'discretionary');
    }
  };

  // Calculate totals by category (recurring annual + all one-time), split by essential/discretionary
  const getCategoryTotal = (category: string, years: number[], type?: 'essential' | 'discretionary'): number => {
    if (type === 'essential') {
      const recurringEssential = expenses
        .filter(e => e.isRecurring && e.category === category && (e.essential || e.isEssential))
        .reduce((sum, e) => {
          const annualAmount = e.frequency === 'monthly' ? e.amount * 12 : e.amount;
          return sum + (annualAmount * years.length);
        }, 0);

      const oneTimeEssential = expenses
        .filter(e => !e.isRecurring && e.category === category && (e.essential || e.isEssential))
        .reduce((sum, e) => sum + e.amount, 0);

      return recurringEssential + oneTimeEssential;
    } else if (type === 'discretionary') {
      const recurringDiscretionary = expenses
        .filter(e => e.isRecurring && e.category === category && !(e.essential || e.isEssential))
        .reduce((sum, e) => {
          const annualAmount = e.frequency === 'monthly' ? e.amount * 12 : e.amount;
          return sum + (annualAmount * years.length);
        }, 0);

      const oneTimeDiscretionary = expenses
        .filter(e => !e.isRecurring && e.category === category && !(e.essential || e.isEssential))
        .reduce((sum, e) => sum + e.amount, 0);

      return recurringDiscretionary + oneTimeDiscretionary;
    } else {
      // Total (essential + discretionary)
      return getCategoryTotal(category, years, 'essential') + getCategoryTotal(category, years, 'discretionary');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const { essential, discretionary } = calculateEssentialVsDiscretionary();

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/dashboard')}
        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
      >
        ← Back to Dashboard
      </button>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-2 text-gray-600">
            Track your monthly and annual expenses for retirement planning
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> One-time expenses are tracked here but not yet included in retirement simulations.
              Simulations currently use the spending amounts you set in your retirement goals.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              category: 'housing',
              description: '',
              amount: '',
              frequency: 'monthly',
              isEssential: true,
              notes: '',
              isRecurring: true,
              plannedYear: '',
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Expenses Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-gray-500">Monthly Total</div>
            <div className="text-2xl font-bold text-gray-900">
              ${calculateMonthlyExpenses().toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Annual Total</div>
            <div className="text-2xl font-bold text-gray-900">
              ${(calculateMonthlyExpenses() * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Essential</div>
            <div className="text-2xl font-bold text-red-600">
              ${essential.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500">
              {essential > 0 ? Math.round((essential / calculateMonthlyExpenses()) * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Discretionary</div>
            <div className="text-2xl font-bold text-green-600">
              ${discretionary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500">
              {discretionary > 0 ? Math.round((discretionary / calculateMonthlyExpenses()) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="housing">Housing</option>
                  <option value="food">Food & Groceries</option>
                  <option value="transportation">Transportation</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="utilities">Utilities</option>
                  <option value="insurance">Insurance</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="personal">Personal Care</option>
                  <option value="travel">Travel</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Expense Type</label>
                <select
                  value={formData.isRecurring ? 'recurring' : 'one-time'}
                  onChange={(e) => setFormData({
                    ...formData,
                    isRecurring: e.target.value === 'recurring',
                    frequency: e.target.value === 'one-time' ? 'one-time' : formData.frequency
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="recurring">Recurring Expense</option>
                  <option value="one-time">One-Time / Major Planned Expense</option>
                </select>
              </div>

              {formData.isRecurring ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Planned Year</label>
                  <input
                    type="number"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 50}
                    value={formData.plannedYear}
                    onChange={(e) => setFormData({ ...formData, plannedYear: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    placeholder="e.g., 2027"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Year when this expense will occur
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g., Mortgage payment"
                />
              </div>
            </div>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isEssential"
                checked={formData.isEssential}
                onChange={(e) => setFormData({ ...formData, isEssential: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isEssential" className="ml-2 block text-sm text-gray-900">
                This is an essential expense
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Add'} Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Expenses by Year Table */}
      {expenses.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Annual Expenses by Category</h2>
            <p className="text-sm text-gray-600 mt-1">
              Projected annual spending for the next 5 years (recurring expenses shown every year, one-time expenses in specific years)
            </p>
          </div>
          <div className="overflow-x-auto">
            {(() => {
              const { years, categories, tableData } = getExpensesByYear();
              const hasAnyExpenses = years.some(year => getYearTotal(year) > 0);

              if (!hasAnyExpenses) {
                return (
                  <div className="p-8 text-center text-gray-500">
                    No one-time expenses planned yet
                  </div>
                );
              }

              return (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 pl-12">
                        Type
                      </th>
                      {years.map(year => (
                        <th key={year} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {year}
                        </th>
                      ))}
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map(category => {
                      const categoryTotalEssential = getCategoryTotal(category, years, 'essential');
                      const categoryTotalDiscretionary = getCategoryTotal(category, years, 'discretionary');
                      const categoryTotal = categoryTotalEssential + categoryTotalDiscretionary;

                      if (categoryTotal === 0) return null;

                      return (
                        <>
                          {/* Essential Row */}
                          {categoryTotalEssential > 0 && (
                            <tr key={`${category}-essential`} className="hover:bg-red-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize sticky left-0 bg-white" rowSpan={categoryTotalDiscretionary > 0 ? 2 : 1}>
                                {category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm sticky left-0 bg-white pl-12">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  Essential
                                </span>
                              </td>
                              {years.map(year => {
                                const amount = tableData[year]?.[category]?.essential || 0;
                                return (
                                  <td key={`${category}-essential-${year}`} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                    {amount > 0 ? (
                                      <span className="font-medium text-red-700">
                                        ${amount.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-700 bg-red-50">
                                ${categoryTotalEssential.toLocaleString()}
                              </td>
                            </tr>
                          )}
                          {/* Discretionary Row */}
                          {categoryTotalDiscretionary > 0 && (
                            <tr key={`${category}-discretionary`} className="hover:bg-green-50">
                              {categoryTotalEssential === 0 && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize sticky left-0 bg-white">
                                  {category}
                                </td>
                              )}
                              <td className="px-6 py-4 whitespace-nowrap text-sm sticky left-0 bg-white pl-12">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Discretionary
                                </span>
                              </td>
                              {years.map(year => {
                                const amount = tableData[year]?.[category]?.discretionary || 0;
                                return (
                                  <td key={`${category}-discretionary-${year}`} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                    {amount > 0 ? (
                                      <span className="font-medium text-green-700">
                                        ${amount.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-700 bg-green-50">
                                ${categoryTotalDiscretionary.toLocaleString()}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    {/* Essential Subtotal Row */}
                    <tr className="bg-red-100 font-bold border-t-2 border-red-300">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-red-100" colSpan={2}>
                        Essential Subtotal
                      </td>
                      {years.map(year => {
                        const yearEssential = getYearTotal(year, 'essential');
                        return (
                          <td key={`essential-${year}`} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                            {yearEssential > 0 ? (
                              <span className="font-bold text-red-900">
                                ${yearEssential.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-900 bg-red-200">
                        ${years.reduce((sum, year) => sum + getYearTotal(year, 'essential'), 0).toLocaleString()}
                      </td>
                    </tr>
                    {/* Discretionary Subtotal Row */}
                    <tr className="bg-green-100 font-bold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-green-100" colSpan={2}>
                        Discretionary Subtotal
                      </td>
                      {years.map(year => {
                        const yearDiscretionary = getYearTotal(year, 'discretionary');
                        return (
                          <td key={`discretionary-${year}`} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                            {yearDiscretionary > 0 ? (
                              <span className="font-bold text-green-900">
                                ${yearDiscretionary.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-900 bg-green-200">
                        ${years.reduce((sum, year) => sum + getYearTotal(year, 'discretionary'), 0).toLocaleString()}
                      </td>
                    </tr>
                    {/* Grand Total Row */}
                    <tr className="bg-blue-50 font-bold border-t-2 border-blue-300">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-0 bg-blue-50" colSpan={2}>
                        Grand Total
                      </td>
                      {years.map(year => {
                        const yearTotal = getYearTotal(year);
                        return (
                          <td key={`total-${year}`} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                            {yearTotal > 0 ? (
                              <span className="font-bold text-blue-900">
                                ${yearTotal.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-900 bg-blue-100">
                        ${years.reduce((sum, year) => sum + getYearTotal(year), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Expenses</h2>
        </div>
        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first expense to track your spending.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <div key={expense.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {expense.category}
                      </h3>
                      {!expense.isRecurring && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                          One-Time ({expense.plannedYear})
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        (expense.essential !== undefined ? expense.essential : expense.isEssential)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {(expense.essential !== undefined ? expense.essential : expense.isEssential) ? 'Essential' : 'Discretionary'}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                    )}
                    {expense.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{expense.notes}</p>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="font-medium text-lg text-gray-900">
                        ${expense.amount.toLocaleString()}
                        {expense.isRecurring && ` / ${expense.frequency}`}
                      </span>
                      {expense.isRecurring && expense.frequency === 'annual' && (
                        <span>
                          ${(expense.amount / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / month
                        </span>
                      )}
                      {expense.isRecurring && expense.frequency === 'monthly' && (
                        <span>
                          ${(expense.amount * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} / year
                        </span>
                      )}
                      {!expense.isRecurring && expense.plannedYear && (
                        <span className="text-purple-600 font-medium">
                          Planned for {expense.plannedYear}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
