'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, Save, X, Calendar, DollarSign } from 'lucide-react';

interface IncomeSource {
  id?: string;
  type: string;
  amount: number;
  frequency: string;
  startAge?: number;
  endAge?: number;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  owner?: string;
  notes?: string;
  inflationIndexed?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EnhancedIncomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<IncomeSource | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [includePartner, setIncludePartner] = useState(false);
  const [userProvince, setUserProvince] = useState<string>('ON');
  const [retirementYear, setRetirementYear] = useState<number>(new Date().getFullYear() + 1);
  const [planEndYear, setPlanEndYear] = useState<number>(new Date().getFullYear() + 30);

  const [formData, setFormData] = useState<IncomeSource>({
    type: 'employment',
    amount: 0,
    frequency: 'annual',
    startAge: undefined,
    endAge: undefined,
    startMonth: undefined,
    startYear: retirementYear,
    endMonth: undefined,
    endYear: planEndYear,
    owner: 'person1',
    notes: '',
    inflationIndexed: true,
  });

  // Helper functions
  const getPensionLabel = () => userProvince === 'QC' ? 'QPP' : 'CPP';
  const getPensionFullName = () => userProvince === 'QC' ? 'Quebec Pension Plan (QPP)' : 'Canada Pension Plan (CPP)';

  useEffect(() => {
    fetchIncomeSources();
    fetchCsrfToken();
    fetchSettings();
    // Get retirement settings to set default dates
    fetchRetirementSettings();
  }, []);

  const fetchRetirementSettings = async () => {
    try {
      const res = await fetch('/api/profile/settings');
      if (res.ok) {
        const data = await res.json();
        const currentYear = new Date().getFullYear();
        const userAge = data.dateOfBirth ?
          currentYear - new Date(data.dateOfBirth).getFullYear() : 50;
        const retirementAge = data.targetRetirementAge || 65;
        const lifeExpectancy = data.lifeExpectancy || 95;

        const calculatedRetirementYear = currentYear + (retirementAge - userAge);
        const calculatedEndYear = currentYear + (lifeExpectancy - userAge);

        setRetirementYear(calculatedRetirementYear);
        setPlanEndYear(calculatedEndYear);

        // Update form defaults
        setFormData(prev => ({
          ...prev,
          startYear: calculatedRetirementYear,
          endYear: calculatedEndYear
        }));
      }
    } catch (error) {
      console.error('Error fetching retirement settings:', error);
    }
  };

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
        setUserProvince(data.province || 'ON');
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
        setIncomeSources(Array.isArray(data) ? data : data.incomes || []);
      }
    } catch (error) {
      console.error('Error fetching income sources:', error);
    }
  };

  const handleEdit = (income: IncomeSource) => {
    setEditingId(income.id || null);
    setEditingData({ ...income });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingData) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/profile/income/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(editingData),
      });

      if (res.ok) {
        await fetchIncomeSources();
        setEditingId(null);
        setEditingData(null);
      } else {
        alert('Failed to update income source');
      }
    } catch (error) {
      console.error('Error updating income:', error);
      alert('Failed to update income source');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/profile/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchIncomeSources();
        setShowForm(false);
        // Reset form
        setFormData({
          type: 'employment',
          amount: 0,
          frequency: 'annual',
          startAge: undefined,
          endAge: undefined,
          startMonth: undefined,
          startYear: retirementYear,
          endMonth: undefined,
          endYear: planEndYear,
          owner: 'person1',
          notes: '',
          inflationIndexed: true,
        });
      } else {
        alert('Failed to add income source');
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

    setLoading(true);
    try {
      const res = await fetch(`/api/profile/income/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
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
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (month?: number, year?: number) => {
    if (!month || !year) return '';
    return `${MONTHS[month - 1]} ${year}`;
  };

  const calculateAnnualAmount = (income: IncomeSource) => {
    const multipliers: { [key: string]: number } = {
      'annual': 1,
      'monthly': 12,
      'biweekly': 26,
      'weekly': 52
    };
    return income.amount * (multipliers[income.frequency] || 1);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Income Sources</h1>
          <p className="text-gray-600 mt-1">
            Manage your expected income sources including employment, pensions, CPP/QPP, OAS, and other sources.
          </p>
        </div>

        <div className="p-6">
          {/* Add Income Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Add Income Source
            </button>
          )}

          {/* Income Form */}
          {showForm && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Add Income Source</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Income Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="employment">Employment / Salary</option>
                      <option value="cpp">{getPensionFullName()}</option>
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="person1">Person 1 (You)</option>
                        <option value="person2">Person 2 (Partner)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (CAD) *
                    </label>
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="annual">Annual</option>
                      <option value="monthly">Monthly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                {/* Start Date Fields */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Start Month
                      </label>
                      <select
                        value={formData.startMonth || ''}
                        onChange={(e) => setFormData({ ...formData, startMonth: parseInt(e.target.value) || undefined })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Month</option>
                        {MONTHS.map((month, idx) => (
                          <option key={idx} value={idx + 1}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Start Year
                      </label>
                      <input
                        type="number"
                        value={formData.startYear || ''}
                        onChange={(e) => setFormData({ ...formData, startYear: parseInt(e.target.value) || undefined })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`e.g., ${retirementYear}`}
                        min={new Date().getFullYear()}
                        max={new Date().getFullYear() + 50}
                      />
                    </div>
                  </div>
                </div>

                {/* End Date Fields (conditional based on income type) */}
                {(formData.type === 'employment' || formData.type === 'rental' ||
                  formData.type === 'business' || formData.type === 'other') && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      End Date (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          End Month
                        </label>
                        <select
                          value={formData.endMonth || ''}
                          onChange={(e) => setFormData({ ...formData, endMonth: parseInt(e.target.value) || undefined })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Month</option>
                          {MONTHS.map((month, idx) => (
                            <option key={idx} value={idx + 1}>{month}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          End Year
                        </label>
                        <input
                          type="number"
                          value={formData.endYear || ''}
                          onChange={(e) => setFormData({ ...formData, endYear: parseInt(e.target.value) || undefined })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`e.g., ${planEndYear}`}
                          min={new Date().getFullYear()}
                          max={new Date().getFullYear() + 50}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Inflation Indexing for Pensions */}
                {(formData.type === 'cpp' || formData.type === 'oas' || formData.type === 'pension') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.inflationIndexed !== false}
                        onChange={(e) => setFormData({ ...formData, inflationIndexed: e.target.checked })}
                        className="mt-1 rounded text-blue-600"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Inflation Indexed</span>
                        <p className="text-sm text-gray-600 mt-1">
                          {formData.type === 'cpp' && `${getPensionLabel()} benefits are indexed to inflation`}
                          {formData.type === 'oas' && 'OAS benefits are indexed to inflation'}
                          {formData.type === 'pension' && 'Check if this pension increases with inflation'}
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Add any additional notes..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Income Source'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Income Sources List */}
          {incomeSources.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No income sources added yet.</p>
              <p className="text-sm text-gray-500 mt-1">
                Click "Add Income Source" to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Income Sources</h3>
              {incomeSources.map((income) => (
                <div key={income.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {editingId === income.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={editingData?.amount || ''}
                            onChange={(e) => setEditingData({
                              ...editingData!,
                              amount: parseFloat(e.target.value) || 0
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frequency
                          </label>
                          <select
                            value={editingData?.frequency || 'annual'}
                            onChange={(e) => setEditingData({
                              ...editingData!,
                              frequency: e.target.value
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="annual">Annual</option>
                            <option value="monthly">Monthly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Start Month</label>
                          <select
                            value={editingData?.startMonth || ''}
                            onChange={(e) => setEditingData({
                              ...editingData!,
                              startMonth: parseInt(e.target.value) || undefined
                            })}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                          >
                            <option value="">-</option>
                            {MONTHS.map((month, idx) => (
                              <option key={idx} value={idx + 1}>{month.slice(0, 3)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Start Year</label>
                          <input
                            type="number"
                            value={editingData?.startYear || ''}
                            onChange={(e) => setEditingData({
                              ...editingData!,
                              startYear: parseInt(e.target.value) || undefined
                            })}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                            min={new Date().getFullYear()}
                            max={new Date().getFullYear() + 50}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">End Month</label>
                          <select
                            value={editingData?.endMonth || ''}
                            onChange={(e) => setEditingData({
                              ...editingData!,
                              endMonth: parseInt(e.target.value) || undefined
                            })}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                          >
                            <option value="">-</option>
                            {MONTHS.map((month, idx) => (
                              <option key={idx} value={idx + 1}>{month.slice(0, 3)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">End Year</label>
                          <input
                            type="number"
                            value={editingData?.endYear || ''}
                            onChange={(e) => setEditingData({
                              ...editingData!,
                              endYear: parseInt(e.target.value) || undefined
                            })}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                            min={new Date().getFullYear()}
                            max={new Date().getFullYear() + 50}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-300 text-sm font-medium flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {income.type === 'cpp' ? getPensionLabel() :
                             income.type === 'oas' ? 'OAS' :
                             income.type.charAt(0).toUpperCase() + income.type.slice(1)}
                          </h4>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {income.frequency}
                          </span>
                          {includePartner && income.owner && (
                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {income.owner === 'person1' ? 'Person 1' : 'Person 2'}
                            </span>
                          )}
                          {income.inflationIndexed && (
                            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                              Indexed
                            </span>
                          )}
                        </div>

                        <p className="text-2xl font-bold text-green-600 mb-2">
                          ${income.amount.toLocaleString('en-CA', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                          <span className="text-sm text-gray-500 font-normal ml-2">
                            (${calculateAnnualAmount(income).toLocaleString('en-CA', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })}/year)
                          </span>
                        </p>

                        <div className="text-sm text-gray-600 space-y-1">
                          {(income.startMonth && income.startYear) && (
                            <p>
                              <span className="font-medium">Starts:</span> {formatDate(income.startMonth, income.startYear)}
                            </p>
                          )}
                          {(income.endMonth && income.endYear) && (
                            <p>
                              <span className="font-medium">Ends:</span> {formatDate(income.endMonth, income.endYear)}
                            </p>
                          )}
                          {income.startAge && !income.startYear && (
                            <p>
                              <span className="font-medium">Starts at age:</span> {income.startAge}
                            </p>
                          )}
                          {income.endAge && !income.endYear && (
                            <p>
                              <span className="font-medium">Ends at age:</span> {income.endAge}
                            </p>
                          )}
                          {income.notes && (
                            <p className="italic text-gray-500">{income.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(income)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => income.id && handleDelete(income.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Total Annual Income */}
          {incomeSources.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">
                  Total Estimated Annual Income:
                </span>
                <span className="text-3xl font-bold text-blue-600">
                  ${incomeSources.reduce((sum, income) => sum + calculateAnnualAmount(income), 0)
                    .toLocaleString('en-CA', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}