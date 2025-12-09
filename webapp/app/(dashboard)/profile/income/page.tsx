'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface IncomeSource {
  id?: string;
  type: string;
  amount: number;
  frequency: string;
  startAge?: number;
  owner?: string;
  notes?: string;
}

export default function IncomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [includePartner, setIncludePartner] = useState(false);
  const [formData, setFormData] = useState<IncomeSource>({
    type: 'employment',
    amount: 0,
    frequency: 'annual',
    startAge: undefined,
    owner: 'person1',
    notes: '',
  });

  useEffect(() => {
    fetchIncomeSources();
    fetchCsrfToken();
    fetchSettings();
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

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/profile/settings');
      if (res.ok) {
        const data = await res.json();
        setIncludePartner(data.includePartner || false);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchIncomeSources = async () => {
    try {
      const res = await fetch('/api/profile/income');
      if (res.ok) {
        const data = await res.json();
        setIncomeSources(data.income || []);
      }
    } catch (error) {
      console.error('Error fetching income sources:', error);
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

    try {
      const res = await fetch('/api/profile/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchIncomeSources();
        setShowForm(false);
        setFormData({
          type: 'employment',
          amount: 0,
          frequency: 'annual',
          startAge: undefined,
          owner: 'person1',
          notes: '',
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add income source');
      }
    } catch (error) {
      console.error('Error adding income:', error);
      alert('Failed to add income source');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income source?')) return;

    try {
      const res = await fetch(`/api/profile/income?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      if (res.ok) {
        await fetchIncomeSources();
      } else {
        alert('Failed to delete income source');
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      alert('Failed to delete income source');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Income Sources</h1>
          <p className="text-gray-600 mt-2">
            Add your expected income sources including employment, pensions, CPP, OAS, and other sources.
          </p>
        </div>

        {/* Add Income Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Income Source
          </button>
        )}

        {/* Income Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add Income Source</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Income Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="employment">Employment / Salary</option>
                  <option value="cpp">Canada Pension Plan (CPP)</option>
                  <option value="oas">Old Age Security (OAS)</option>
                  <option value="pension">Private Pension</option>
                  <option value="rental">Rental Income</option>
                  <option value="business">Business Income</option>
                  <option value="investment">Investment Income</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {includePartner && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner *
                  </label>
                  <select
                    value={formData.owner || 'person1'}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="person1">Person 1</option>
                    <option value="person2">Person 2</option>
                    <option value="joint">Joint</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Amount (CAD) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., 60000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {(formData.type === 'cpp' || formData.type === 'oas' || formData.type === 'pension') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Age
                  </label>
                  <input
                    type="number"
                    value={formData.startAge || ''}
                    onChange={(e) => setFormData({ ...formData, startAge: parseInt(e.target.value) || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder={formData.type === 'cpp' ? '65 (or 60-70)' : formData.type === 'oas' ? '65 (or 65-70)' : 'e.g., 65'}
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.type === 'cpp' && 'CPP can start between ages 60-70'}
                    {formData.type === 'oas' && 'OAS can start between ages 65-70 (deferral increases benefits)'}
                    {formData.type === 'pension' && 'Age when pension payments begin'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Add any additional details..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Income'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      type: 'employment',
                      amount: 0,
                      frequency: 'annual',
                      startAge: undefined,
                      owner: 'person1',
                      notes: '',
                    });
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Income Sources List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Income Sources</h2>

            {incomeSources.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No income sources added yet. Click "Add Income Source" to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {incomeSources.map((income) => (
                  <div
                    key={income.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 capitalize">
                            {income.type.replace('_', ' ')}
                          </h3>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {income.frequency}
                          </span>
                          {includePartner && income.owner && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded capitalize">
                              {income.owner === 'person1' ? 'Person 1' :
                               income.owner === 'person2' ? 'Person 2' :
                               'Joint'}
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          ${income.amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {income.startAge && (
                          <p className="text-sm text-gray-600 mt-1">
                            Starts at age {income.startAge}
                          </p>
                        )}
                        {income.notes && (
                          <p className="text-sm text-gray-600 mt-2">{income.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => income.id && handleDelete(income.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total Annual Income */}
        {incomeSources.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total Estimated Annual Income:</span>
              <span className="text-3xl font-bold text-blue-600">
                ${incomeSources.reduce((sum, income) => {
                  const annualAmount = income.frequency === 'monthly' ? income.amount * 12 :
                                      income.frequency === 'biweekly' ? income.amount * 26 :
                                      income.frequency === 'weekly' ? income.amount * 52 :
                                      income.amount;
                  return sum + annualAmount;
                }, 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
