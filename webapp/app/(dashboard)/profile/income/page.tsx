'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Income {
  id: string;
  type: string;
  description: string | null;
  amount: number;
  frequency: string;
  isTaxable: boolean;
}

export default function IncomePage() {
  const router = useRouter();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'employment',
    description: '',
    amount: '',
    frequency: 'annual',
    isTaxable: true,
  });

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      const res = await fetch('/api/profile/income');
      if (res.ok) {
        const data = await res.json();
        setIncomes(data);
      }
    } catch (error) {
      console.error('Error fetching incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = editingId ? 'PUT' : 'POST';
    const body = editingId
      ? { id: editingId, ...formData }
      : formData;

    try {
      const res = await fetch('/api/profile/income', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchIncomes();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          type: 'employment',
          description: '',
          amount: '',
          frequency: 'annual',
          isTaxable: true,
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save income');
      }
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Failed to save income');
    }
  };

  const handleEdit = (income: Income) => {
    setFormData({
      type: income.type,
      description: income.description || '',
      amount: income.amount.toString(),
      frequency: income.frequency,
      isTaxable: income.isTaxable,
    });
    setEditingId(income.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income source?')) {
      return;
    }

    try {
      const res = await fetch(`/api/profile/income?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchIncomes();
      } else {
        alert('Failed to delete income');
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      alert('Failed to delete income');
    }
  };

  const calculateTotalIncome = () => {
    return incomes.reduce((total, income) => {
      const amount = income.frequency === 'monthly' ? income.amount * 12 : income.amount;
      return total + amount;
    }, 0);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income Sources</h1>
          <p className="mt-2 text-gray-600">
            Manage your income sources for retirement planning
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              type: 'employment',
              description: '',
              amount: '',
              frequency: 'annual',
              isTaxable: true,
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Income Source
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Income Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">Total Annual Income</div>
            <div className="text-2xl font-bold text-gray-900">
              ${calculateTotalIncome().toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Income Sources</div>
            <div className="text-2xl font-bold text-gray-900">{incomes.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Monthly Average</div>
            <div className="text-2xl font-bold text-gray-900">
              ${(calculateTotalIncome() / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? 'Edit Income Source' : 'Add Income Source'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="employment">Employment</option>
                  <option value="pension">Pension</option>
                  <option value="investment">Investment Income</option>
                  <option value="rental">Rental Income</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Full-time salary"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isTaxable"
                checked={formData.isTaxable}
                onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isTaxable" className="ml-2 block text-sm text-gray-900">
                This income is taxable
              </label>
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
                {editingId ? 'Update' : 'Add'} Income
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Income List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Income Sources</h2>
        </div>
        {incomes.length === 0 ? (
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No income sources yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first income source to start planning your retirement.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Income Source
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {incomes.map((income) => (
              <div key={income.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {income.type.replace('_', ' ')}
                      </h3>
                      {!income.isTaxable && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          Tax-Free
                        </span>
                      )}
                    </div>
                    {income.description && (
                      <p className="text-sm text-gray-600 mt-1">{income.description}</p>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="font-medium text-lg text-gray-900">
                        ${income.amount.toLocaleString()} / {income.frequency}
                      </span>
                      {income.frequency === 'monthly' && (
                        <span>
                          ${(income.amount * 12).toLocaleString()} / year
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(income)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
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
