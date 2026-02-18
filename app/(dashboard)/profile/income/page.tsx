'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface IncomeSource {
  id?: string;
  type: string;
  amount: number;
  frequency: string;
  startAge?: number;
  endAge?: number;
  owner?: string;
  notes?: string;
  inflationIndexed?: boolean;
}

export default function IncomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [includePartner, setIncludePartner] = useState(false);
  const [showImportBanner, setShowImportBanner] = useState(false);
  const [availableCalculations, setAvailableCalculations] = useState<{
    cpp?: any;
    oas?: any;
  }>({});
  const [selectedImports, setSelectedImports] = useState<{
    cpp: boolean;
    oas: boolean;
  }>({ cpp: false, oas: false });
  const [formData, setFormData] = useState<IncomeSource>({
    type: 'employment',
    amount: 0,
    frequency: 'annual',
    startAge: undefined,
    endAge: undefined,
    owner: 'person1',
    notes: '',
    inflationIndexed: true, // Default to true for pensions
  });

  useEffect(() => {
    fetchIncomeSources();
    fetchCsrfToken();
    fetchSettings();
    checkForCalculatedBenefits();
  }, []);

  const checkForCalculatedBenefits = () => {
    const calculations: any = {};

    // Check for CPP calculation
    const cppResult = localStorage.getItem('cpp_calculator_result');
    if (cppResult) {
      try {
        calculations.cpp = JSON.parse(cppResult);
      } catch (e) {
        console.error('Error parsing CPP result:', e);
      }
    }

    // Check for OAS calculation
    const oasResult = localStorage.getItem('oas_calculator_result');
    if (oasResult) {
      try {
        calculations.oas = JSON.parse(oasResult);
      } catch (e) {
        console.error('Error parsing OAS result:', e);
      }
    }

    // Show banner if we have calculations and user doesn't already have CPP/OAS in their income sources
    if (Object.keys(calculations).length > 0) {
      setAvailableCalculations(calculations);
      setShowImportBanner(true);
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
        // Clear localStorage if CPP or OAS was added
        if (formData.type === 'cpp') {
          localStorage.removeItem('cpp_calculator_result');
          setAvailableCalculations(prev => ({ ...prev, cpp: undefined }));
        } else if (formData.type === 'oas') {
          localStorage.removeItem('oas_calculator_result');
          setAvailableCalculations(prev => ({ ...prev, oas: undefined }));
        }

        // Check if banner should be hidden (no more calculations available)
        if ((!availableCalculations.cpp || formData.type === 'cpp') &&
            (!availableCalculations.oas || formData.type === 'oas')) {
          setShowImportBanner(false);
        }

        await fetchIncomeSources();
        setShowForm(false);
        setFormData({
          type: 'employment',
          amount: 0,
          frequency: 'annual',
          startAge: undefined,
          endAge: undefined,
          owner: 'person1',
          notes: '',
          inflationIndexed: true,
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

  const handleImportSelected = async () => {
    if (!selectedImports.cpp && !selectedImports.oas) {
      return; // Nothing selected
    }

    setLoading(true);

    try {
      const promises = [];

      if (selectedImports.cpp && availableCalculations.cpp) {
        const cppData = {
          type: 'cpp',
          amount: availableCalculations.cpp.annualAmount,
          frequency: 'annual',
          startAge: availableCalculations.cpp.startAge,
          owner: 'person1',
          notes: `Imported from CPP Calculator on ${new Date(availableCalculations.cpp.calculatedAt).toLocaleDateString()}`,
        };

        promises.push(
          fetch('/api/profile/income', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
            body: JSON.stringify(cppData),
          })
        );
      }

      if (selectedImports.oas && availableCalculations.oas) {
        const oasData = {
          type: 'oas',
          amount: availableCalculations.oas.annualAmount,
          frequency: 'annual',
          startAge: 65, // OAS starts at 65
          owner: 'person1',
          notes: `Imported from OAS Calculator on ${new Date(availableCalculations.oas.calculatedAt).toLocaleDateString()}`,
        };

        promises.push(
          fetch('/api/profile/income', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
            body: JSON.stringify(oasData),
          })
        );
      }

      await Promise.all(promises);

      // Clear localStorage for imported items
      if (selectedImports.cpp) {
        localStorage.removeItem('cpp_calculator_result');
      }
      if (selectedImports.oas) {
        localStorage.removeItem('oas_calculator_result');
      }

      await fetchIncomeSources();
      setShowImportBanner(false);
      setAvailableCalculations({});
      setSelectedImports({ cpp: false, oas: false });
      alert('Benefits imported successfully!');
    } catch (error) {
      console.error('Error importing calculations:', error);
      alert('Failed to import benefits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Income Sources</h1>
          <p className="text-gray-600 mt-2">
            Add your expected income sources including employment, pensions, CPP, OAS, and other sources.
            For CPP and OAS, use RetireZest's calculators or CRA estimates for your planned retirement year.
          </p>
        </div>

        {/* Import CPP/OAS Banner */}
        {showImportBanner && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Government Benefits Calculated!
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    We found calculated benefits from your recent calculator sessions. Would you like to add them as income sources?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportBanner(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {availableCalculations.cpp && (
                <div className={`bg-white rounded-lg p-4 border-2 transition ${selectedImports.cpp ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="import-cpp"
                      checked={selectedImports.cpp}
                      onChange={(e) => setSelectedImports({ ...selectedImports, cpp: e.target.checked })}
                      className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="import-cpp" className="font-semibold text-gray-900 cursor-pointer">
                          CPP (Canada Pension Plan)
                        </label>
                        <span className="text-xs text-gray-500">
                          {new Date(availableCalculations.cpp.calculatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        ${availableCalculations.cpp.monthlyAmount.toLocaleString()}/month
                      </div>
                      <div className="text-sm text-gray-600">
                        ${availableCalculations.cpp.annualAmount.toLocaleString()}/year
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Starting at age {availableCalculations.cpp.startAge}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {availableCalculations.oas && (
                <div className={`bg-white rounded-lg p-4 border-2 transition ${selectedImports.oas ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="import-oas"
                      checked={selectedImports.oas}
                      onChange={(e) => setSelectedImports({ ...selectedImports, oas: e.target.checked })}
                      className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="import-oas" className="font-semibold text-gray-900 cursor-pointer">
                          OAS (Old Age Security)
                        </label>
                        <span className="text-xs text-gray-500">
                          {new Date(availableCalculations.oas.calculatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${availableCalculations.oas.monthlyAmount.toLocaleString()}/month
                      </div>
                      <div className="text-sm text-gray-600">
                        ${availableCalculations.oas.annualAmount.toLocaleString()}/year
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {availableCalculations.oas.yearsInCanada} years in Canada
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleImportSelected}
              disabled={loading || (!selectedImports.cpp && !selectedImports.oas)}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Importing...' : `Import Selected (${(selectedImports.cpp ? 1 : 0) + (selectedImports.oas ? 1 : 0)})`}
            </button>
          </div>
        )}

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

              {/* CPP/OAS Quick Import Helper */}
              {((formData.type === 'cpp' && availableCalculations.cpp) ||
                (formData.type === 'oas' && availableCalculations.oas)) && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 text-sm mb-1">
                        {formData.type === 'cpp' ? 'CPP' : 'OAS'} Calculation Available!
                      </h4>
                      <p className="text-sm text-blue-800 mb-2">
                        We found a recent {formData.type === 'cpp' ? 'CPP' : 'OAS'} calculation.
                        Annual amount: ${formData.type === 'cpp'
                          ? availableCalculations.cpp.annualAmount.toLocaleString()
                          : availableCalculations.oas.annualAmount.toLocaleString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const calc = formData.type === 'cpp' ? availableCalculations.cpp : availableCalculations.oas;
                          setFormData({
                            ...formData,
                            amount: calc.annualAmount,
                            frequency: 'annual',
                            startAge: formData.type === 'cpp' ? calc.startAge : 65,
                            notes: `Imported from ${formData.type === 'cpp' ? 'CPP' : 'OAS'} Calculator on ${new Date(calc.calculatedAt).toLocaleDateString()}`
                          });
                        }}
                        className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium"
                      >
                        Use Calculated Amount
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Amount (CAD) *
                </label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., 60000"
                  min="0"
                  step="0.01"
                  required
                />
                {(formData.type === 'cpp' || formData.type === 'oas') && (
                  <p className="text-xs text-gray-600 mt-2 bg-blue-50 p-2 rounded border border-blue-200">
                    <strong>Tip:</strong> Enter the annual {formData.type === 'cpp' ? 'CPP' : 'OAS'} amount you expect to receive in your first year of retirement.
                    RetireZest provides {formData.type === 'cpp' ? 'CPP' : 'OAS'} calculators in the Tools section, or for the most accurate estimates,
                    visit <a href={formData.type === 'cpp' ? 'https://www.canada.ca/en/services/benefits/publicpensions/cpp/retirement-income-calculator.html' : 'https://www.canada.ca/en/services/benefits/publicpensions/oas/oas-benefit-estimator.html'}
                    target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      CRA's official {formData.type === 'cpp' ? 'CPP' : 'OAS'} estimator
                    </a>.
                  </p>
                )}
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

              {/* End Age field for employment, rental, business, and other income types */}
              {(formData.type === 'employment' || formData.type === 'rental' || formData.type === 'business' || formData.type === 'other') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Age (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.endAge || ''}
                    onChange={(e) => setFormData({ ...formData, endAge: parseInt(e.target.value) || undefined })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., 70"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.type === 'employment' && 'Age when employment income will stop (e.g., retirement age)'}
                    {formData.type === 'rental' && 'Age when rental income will stop (e.g., when property is sold)'}
                    {formData.type === 'business' && 'Age when business income will stop (e.g., when business is sold)'}
                    {formData.type === 'other' && 'Age when this income will stop'}
                  </p>
                </div>
              )}

              {(formData.type === 'cpp' || formData.type === 'oas' || formData.type === 'pension') && (
                <>
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

                  {/* Inflation Indexing Checkbox */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.inflationIndexed !== false}
                        onChange={(e) => setFormData({ ...formData, inflationIndexed: e.target.checked })}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="block text-sm font-medium text-gray-900">
                          Inflation Indexed
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          {formData.type === 'cpp' && 'CPP is automatically indexed to inflation each year'}
                          {formData.type === 'oas' && 'OAS is automatically indexed to inflation each year'}
                          {formData.type === 'pension' && 'Check this if your pension increases with inflation each year (most Canadian DB pensions are indexed)'}
                        </p>
                      </div>
                    </label>
                  </div>
                </>
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
                      endAge: undefined,
                      owner: 'person1',
                      notes: '',
                      inflationIndexed: true,
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
                          {income.type === 'pension' && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              income.inflationIndexed === false
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {income.inflationIndexed === false ? 'Fixed' : 'Inflation Indexed'}
                            </span>
                          )}
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
                        {(income.startAge || income.endAge) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {income.startAge && `Starts at age ${income.startAge}`}
                            {income.startAge && income.endAge && ' • '}
                            {income.endAge && `Ends at age ${income.endAge}`}
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
