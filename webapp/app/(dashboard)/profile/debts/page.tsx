'use client';

import { useState, useEffect } from 'react';

interface Debt {
  id: string;
  type: string;
  description: string | null;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number | null;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [formData, setFormData] = useState({
    type: 'mortgage',
    description: '',
    currentBalance: '',
    interestRate: '',
    monthlyPayment: '',
  });

  useEffect(() => {
    fetchDebts();
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

  const fetchDebts = async () => {
    try {
      const res = await fetch('/api/profile/debts');
      if (res.ok) {
        const data = await res.json();
        setDebts(data.debts || []);
      }
    } catch (error) {
      console.error('Error fetching debts:', error);
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

    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? { id: editingId, ...formData }
      : formData;

    try {
      const res = await fetch('/api/profile/debts', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchDebts();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          type: 'mortgage',
          description: '',
          currentBalance: '',
          interestRate: '',
          monthlyPayment: '',
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save debt');
      }
    } catch (error) {
      console.error('Error saving debt:', error);
      alert('Failed to save debt');
    }
  };

  const handleEdit = (debt: Debt) => {
    setFormData({
      type: debt.type,
      description: debt.description || '',
      currentBalance: debt.currentBalance.toString(),
      interestRate: debt.interestRate.toString(),
      monthlyPayment: debt.monthlyPayment?.toString() || '',
    });
    setEditingId(debt.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this debt?')) {
      return;
    }

    try {
      const res = await fetch(`/api/profile/debts?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      if (res.ok) {
        fetchDebts();
      } else {
        alert('Failed to delete debt');
      }
    } catch (error) {
      console.error('Error deleting debt:', error);
      alert('Failed to delete debt');
    }
  };

  const calculateTotalDebt = () => {
    return debts.reduce((total, debt) => total + debt.currentBalance, 0);
  };

  const calculateMonthlyPayments = () => {
    return debts.reduce((total, debt) => total + (debt.monthlyPayment || 0), 0);
  };

  const calculateWeightedInterestRate = () => {
    const totalDebt = calculateTotalDebt();
    if (totalDebt === 0) return 0;

    const weightedSum = debts.reduce((sum, debt) => {
      return sum + (debt.currentBalance * debt.interestRate);
    }, 0);

    return weightedSum / totalDebt;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debts</h1>
          <p className="mt-2 text-gray-600">
            Track loans, mortgages, and other debts
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              type: 'mortgage',
              description: '',
              currentBalance: '',
              interestRate: '',
              monthlyPayment: '',
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Debt
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Debts Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">Total Debt</div>
            <div className="text-2xl font-bold text-red-600">
              ${calculateTotalDebt().toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Monthly Payments</div>
            <div className="text-2xl font-bold text-gray-900">
              ${calculateMonthlyPayments().toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Avg Interest Rate</div>
            <div className="text-2xl font-bold text-gray-900">
              {calculateWeightedInterestRate().toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Debt' : 'Add Debt'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="mortgage">Mortgage</option>
                  <option value="loan">Loan</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="line_of_credit">Line of Credit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Current Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Monthly Payment (optional) ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="Minimum payment amount"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g., Home mortgage with TD Bank"
                />
              </div>
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
                {editingId ? 'Update' : 'Add'} Debt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Debts List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Debts</h2>
        </div>
        {debts.length === 0 ? (
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No debts tracked</h3>
            <p className="text-gray-600 mb-4">
              Great! If you have any debts, you can add them here to track them.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Debt
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {debts.map((debt) => (
              <div key={debt.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {debt.type.replace('_', ' ')}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                        {debt.interestRate}% APR
                      </span>
                    </div>
                    {debt.description && (
                      <p className="text-sm text-gray-600 mt-1">{debt.description}</p>
                    )}
                    <div className="mt-2 flex items-center space-x-6">
                      <div>
                        <span className="text-sm text-gray-500">Balance: </span>
                        <span className="font-medium text-lg text-gray-900">
                          ${debt.currentBalance.toLocaleString()}
                        </span>
                      </div>
                      {debt.monthlyPayment && (
                        <div>
                          <span className="text-sm text-gray-500">Monthly Payment: </span>
                          <span className="font-medium text-gray-900">
                            ${debt.monthlyPayment.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(debt)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(debt.id)}
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

      {/* Tip Card */}
      {debts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debt Payoff Tips</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Consider paying off highest interest rate debts first</li>
            <li>• Extra payments can significantly reduce total interest paid</li>
            <li>• Consolidating high-interest debt may lower your overall rate</li>
          </ul>
        </div>
      )}
    </div>
  );
}
