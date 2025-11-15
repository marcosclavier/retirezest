'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  type ProjectionInput,
  type ProjectionSummary,
} from '@/lib/calculations/projection';

interface DBScenario {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  province: string;
  rrspBalance: number;
  tfsaBalance: number;
  nonRegBalance: number;
  realEstateValue: number;
  employmentIncome: number;
  pensionIncome: number;
  rentalIncome: number;
  otherIncome: number;
  cppStartAge: number;
  oasStartAge: number;
  averageCareerIncome: number;
  yearsOfCPPContributions: number;
  yearsInCanada: number;
  annualExpenses: number;
  expenseInflationRate: number;
  investmentReturnRate: number;
  inflationRate: number;
  rrspToRrifAge: number;
  projectionResults: string | null;
  isBaseline: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Scenario {
  id: string;
  name: string;
  inputs: ProjectionInput;
  projection?: ProjectionSummary;
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Default scenario template
  const defaultInputs: ProjectionInput = {
    currentAge: 55,
    retirementAge: 65,
    lifeExpectancy: 90,
    province: 'ON',
    rrspBalance: 500000,
    tfsaBalance: 100000,
    nonRegBalance: 150000,
    realEstateValue: 0,
    employmentIncome: 80000,
    pensionIncome: 20000,
    rentalIncome: 0,
    otherIncome: 0,
    cppStartAge: 65,
    oasStartAge: 65,
    averageCareerIncome: 70000,
    yearsOfCPPContributions: 35,
    yearsInCanada: 40,
    annualExpenses: 60000,
    expenseInflationRate: 0.02,
    investmentReturnRate: 0.05,
    inflationRate: 0.02,
    rrspToRrifAge: 71,
  };

  const [newScenario, setNewScenario] = useState<Partial<Scenario>>({
    name: '',
    inputs: defaultInputs,
  });

  // Convert database scenario to UI scenario
  const dbScenarioToScenario = (dbScenario: DBScenario): Scenario => {
    const inputs: ProjectionInput = {
      currentAge: dbScenario.currentAge,
      retirementAge: dbScenario.retirementAge,
      lifeExpectancy: dbScenario.lifeExpectancy,
      province: dbScenario.province,
      rrspBalance: dbScenario.rrspBalance,
      tfsaBalance: dbScenario.tfsaBalance,
      nonRegBalance: dbScenario.nonRegBalance,
      realEstateValue: dbScenario.realEstateValue,
      employmentIncome: dbScenario.employmentIncome,
      pensionIncome: dbScenario.pensionIncome,
      rentalIncome: dbScenario.rentalIncome,
      otherIncome: dbScenario.otherIncome,
      cppStartAge: dbScenario.cppStartAge,
      oasStartAge: dbScenario.oasStartAge,
      averageCareerIncome: dbScenario.averageCareerIncome,
      yearsOfCPPContributions: dbScenario.yearsOfCPPContributions,
      yearsInCanada: dbScenario.yearsInCanada,
      annualExpenses: dbScenario.annualExpenses,
      expenseInflationRate: dbScenario.expenseInflationRate,
      investmentReturnRate: dbScenario.investmentReturnRate,
      inflationRate: dbScenario.inflationRate,
      rrspToRrifAge: dbScenario.rrspToRrifAge,
    };

    const projection = dbScenario.projectionResults
      ? JSON.parse(dbScenario.projectionResults)
      : undefined;

    return {
      id: dbScenario.id,
      name: dbScenario.name,
      inputs,
      projection,
    };
  };

  // Load scenarios from API
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const response = await fetch('/api/scenarios');
        if (response.ok) {
          const dbScenarios: DBScenario[] = await response.json();
          const uiScenarios = dbScenarios.map(dbScenarioToScenario);
          setScenarios(uiScenarios);
        }
      } catch (error) {
        console.error('Error loading scenarios:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScenarios();
  }, []);

  const createScenario = async () => {
    if (!newScenario.name) {
      alert('Please enter a scenario name');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScenario.name,
          ...newScenario.inputs,
        }),
      });

      if (response.ok) {
        const dbScenario: DBScenario = await response.json();
        const uiScenario = dbScenarioToScenario(dbScenario);
        setScenarios([...scenarios, uiScenario]);
        setShowCreateForm(false);
        setNewScenario({ name: '', inputs: defaultInputs });
      } else {
        alert('Failed to create scenario');
      }
    } catch (error) {
      console.error('Error creating scenario:', error);
      alert('Failed to create scenario');
    } finally {
      setCreating(false);
    }
  };

  const deleteScenario = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario?')) {
      return;
    }

    try {
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setScenarios(scenarios.filter(s => s.id !== id));
        setSelectedScenarios(selectedScenarios.filter(sid => sid !== id));
      } else {
        alert('Failed to delete scenario');
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
      alert('Failed to delete scenario');
    }
  };

  const toggleScenarioSelection = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter(sid => sid !== id));
    } else if (selectedScenarios.length < 3) {
      setSelectedScenarios([...selectedScenarios, id]);
    }
  };

  const updateScenarioInput = (field: keyof ProjectionInput, value: any) => {
    setNewScenario({
      ...newScenario,
      inputs: { ...newScenario.inputs!, [field]: value },
    });
  };

  const selectedScenarioData = scenarios.filter(s => selectedScenarios.includes(s.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scenario Comparison</h1>
          <p className="mt-2 text-gray-600">
            Create and compare different retirement planning scenarios
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          disabled={creating}
        >
          {showCreateForm ? 'Cancel' : 'Create Scenario'}
        </button>
      </div>

      {/* Create Scenario Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Scenario</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scenario Name</label>
              <input
                type="text"
                value={newScenario.name}
                onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Retire at 60, Delay CPP to 70, Conservative Spending"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retirement Age</label>
                <input
                  type="number"
                  value={newScenario.inputs?.retirementAge}
                  onChange={(e) => updateScenarioInput('retirementAge', parseInt(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPP Start Age</label>
                <input
                  type="number"
                  value={newScenario.inputs?.cppStartAge}
                  onChange={(e) => updateScenarioInput('cppStartAge', parseInt(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="60"
                  max="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Expenses ($)</label>
                <input
                  type="number"
                  value={newScenario.inputs?.annualExpenses}
                  onChange={(e) => updateScenarioInput('annualExpenses', parseFloat(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="1000"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createScenario}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Scenario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios List */}
      {scenarios.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const isSelected = selectedScenarios.includes(scenario.id);
            return (
              <div
                key={scenario.id}
                className={`bg-white shadow rounded-lg p-6 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => toggleScenarioSelection(scenario.id)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{scenario.name}</h3>
                  {isSelected && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Selected
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Retirement Age:</span>
                    <span className="font-medium text-gray-900">{scenario.inputs.retirementAge}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Life Expectancy:</span>
                    <span className="font-medium text-gray-900">{scenario.inputs.lifeExpectancy}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Income:</span>
                    <span className="font-medium text-green-600">
                      ${scenario.projection ? (scenario.projection.totalIncome / 1000000).toFixed(2) : 0}M
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remaining Assets:</span>
                    <span className={`font-medium ${scenario.projection?.assetsDepleted ? 'text-red-600' : 'text-blue-600'}`}>
                      ${scenario.projection ? (scenario.projection.remainingAssets / 1000000).toFixed(2) : 0}M
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteScenario(scenario.id);
                  }}
                  className="mt-4 w-full px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No scenarios
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new retirement scenario.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Create Your First Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* What are scenarios? */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            What are Scenarios?
          </h2>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-4">
            Scenarios allow you to compare different retirement planning
            strategies side-by-side. Create multiple scenarios to answer
            questions like:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                What if I retire at 60 vs 65 vs 70?
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Should I start CPP early or delay for higher benefits?
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                What if my expenses are higher or lower than expected?
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                How do different investment returns affect my retirement?
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Scenario Comparison Charts */}
      {selectedScenarioData.length > 0 && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900">
              Comparing {selectedScenarioData.length} Scenario{selectedScenarioData.length > 1 ? 's' : ''}
            </h3>
            <p className="text-xs text-blue-700 mt-1">
              Click on scenarios above to select up to 3 for comparison
            </p>
          </div>

          {/* Summary Comparison Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Summary Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                    {selectedScenarioData.map(scenario => (
                      <th key={scenario.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {scenario.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Retirement Age</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {scenario.inputs.retirementAge}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">CPP Start Age</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {scenario.inputs.cppStartAge}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Income</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm font-medium text-green-600">
                        ${(scenario.projection!.totalIncome / 1000000).toFixed(2)}M
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Taxes</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm font-medium text-red-600">
                        ${(scenario.projection!.totalTaxesPaid / 1000000).toFixed(2)}M
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Remaining Assets</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className={`px-6 py-4 text-sm font-medium ${scenario.projection!.assetsDepleted ? 'text-red-600' : 'text-blue-600'}`}>
                        ${(scenario.projection!.remainingAssets / 1000000).toFixed(2)}M
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Assets Depleted?</td>
                    {selectedScenarioData.map(scenario => (
                      <td key={scenario.id} className="px-6 py-4 text-sm text-gray-600">
                        {scenario.projection!.assetsDepleted ? `Yes, at ${scenario.projection!.assetsDepletedAge}` : 'No'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Asset Balance Comparison Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Balance Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="age"
                  label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                  type="number"
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis
                  label={{ value: 'Assets ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  labelFormatter={(label) => `Age ${label}`}
                />
                <Legend />
                {selectedScenarioData.map((scenario, index) => {
                  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
                  return (
                    <Line
                      key={scenario.id}
                      data={scenario.projection!.projections}
                      type="monotone"
                      dataKey="totalAssets"
                      stroke={colors[index]}
                      name={scenario.name}
                      strokeWidth={2}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Income Comparison Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Income Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={selectedScenarioData.map(scenario => ({
                  name: scenario.name,
                  avgIncome: scenario.projection!.averageAnnualIncome,
                  avgTax: scenario.projection!.totalTaxesPaid / scenario.projection!.totalYears,
                  avgExpenses: scenario.projection!.averageAnnualExpenses,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="avgIncome" fill="#10b981" name="Avg Income" />
                <Bar dataKey="avgTax" fill="#ef4444" name="Avg Tax" />
                <Bar dataKey="avgExpenses" fill="#f59e0b" name="Avg Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
