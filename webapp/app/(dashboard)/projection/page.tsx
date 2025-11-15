'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  projectRetirement,
  type ProjectionInput,
  type ProjectionSummary,
} from '@/lib/calculations/projection';
import { RetirementReport } from '@/components/reports/RetirementReport';
import { generatePDF } from '@/lib/reports/generatePDF';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { getShortHelp } from '@/lib/help/helpContent';

export default function ProjectionPage() {
  const [showInputForm, setShowInputForm] = useState(false);
  const [projection, setProjection] = useState<ProjectionSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProjectionInput>({
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
  });

  const handleCalculate = () => {
    const result = projectRetirement(formData);
    setProjection(result);
    setShowInputForm(false);
  };

  const updateFormData = (field: keyof ProjectionInput, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadPDF = async () => {
    if (!projection) return;

    setGeneratingPDF(true);
    try {
      const filename = `Retirement_Plan_${new Date().toISOString().split('T')[0]}.pdf`;
      await generatePDF('retirement-report', filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Retirement Projection</h1>
          <p className="mt-2 text-gray-600">
            Year-by-year projection of your retirement income, expenses, and assets
          </p>
        </div>
        <div className="flex space-x-3">
          {projection && (
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>{generatingPDF ? 'Generating...' : 'Download PDF'}</span>
            </button>
          )}
          <button
            onClick={() => setShowInputForm(!showInputForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            {showInputForm ? 'Hide Form' : projection ? 'Modify Inputs' : 'Start Projection'}
          </button>
        </div>
      </div>

      {/* Input Form */}
      {showInputForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Projection Inputs</h2>

          <div className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Current Age
                    <HelpTooltip content={getShortHelp('currentAge')} />
                  </label>
                  <input
                    type="number"
                    value={formData.currentAge}
                    onChange={(e) => updateFormData('currentAge', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Retirement Age
                    <HelpTooltip content={getShortHelp('retirementAge')} />
                  </label>
                  <input
                    type="number"
                    value={formData.retirementAge}
                    onChange={(e) => updateFormData('retirementAge', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Life Expectancy
                    <HelpTooltip content={getShortHelp('lifeExpectancy')} />
                  </label>
                  <input
                    type="number"
                    value={formData.lifeExpectancy}
                    onChange={(e) => updateFormData('lifeExpectancy', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Current Assets */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Current Assets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    RRSP Balance ($)
                    <HelpTooltip content={getShortHelp('rrsp')} />
                  </label>
                  <input
                    type="number"
                    value={formData.rrspBalance}
                    onChange={(e) => updateFormData('rrspBalance', parseFloat(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    step="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    TFSA Balance ($)
                    <HelpTooltip content={getShortHelp('tfsa')} />
                  </label>
                  <input
                    type="number"
                    value={formData.tfsaBalance}
                    onChange={(e) => updateFormData('tfsaBalance', parseFloat(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    step="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Non-Reg Balance ($)
                    <HelpTooltip content={getShortHelp('nonRegistered')} />
                  </label>
                  <input
                    type="number"
                    value={formData.nonRegBalance}
                    onChange={(e) => updateFormData('nonRegBalance', parseFloat(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    step="10000"
                  />
                </div>
              </div>
            </div>

            {/* Income Sources */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Annual Income</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Income (until retirement) ($)</label>
                  <input
                    type="number"
                    value={formData.employmentIncome}
                    onChange={(e) => updateFormData('employmentIncome', parseFloat(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pension Income (at retirement) ($)</label>
                  <input
                    type="number"
                    value={formData.pensionIncome}
                    onChange={(e) => updateFormData('pensionIncome', parseFloat(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    step="1000"
                  />
                </div>
              </div>
            </div>

            {/* CPP/OAS */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Government Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    CPP Start Age
                    <HelpTooltip content={getShortHelp('cppStartAge')} />
                  </label>
                  <input
                    type="number"
                    value={formData.cppStartAge}
                    onChange={(e) => updateFormData('cppStartAge', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="60"
                    max="70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    OAS Start Age
                    <HelpTooltip content={getShortHelp('oas')} />
                  </label>
                  <input
                    type="number"
                    value={formData.oasStartAge}
                    onChange={(e) => updateFormData('oasStartAge', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="65"
                    max="70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years in Canada</label>
                  <input
                    type="number"
                    value={formData.yearsInCanada}
                    onChange={(e) => updateFormData('yearsInCanada', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="10"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Avg Career Income ($)</label>
                  <input
                    type="number"
                    value={formData.averageCareerIncome}
                    onChange={(e) => updateFormData('averageCareerIncome', parseFloat(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years CPP Contributions</label>
                  <input
                    type="number"
                    value={formData.yearsOfCPPContributions}
                    onChange={(e) => updateFormData('yearsOfCPPContributions', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="10"
                    max="47"
                  />
                </div>
              </div>
            </div>

            {/* Expenses & Assumptions */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Expenses & Assumptions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Annual Expenses ($)
                    <HelpTooltip content={getShortHelp('annualExpenses')} />
                  </label>
                  <input
                    type="number"
                    value={formData.annualExpenses}
                    onChange={(e) => updateFormData('annualExpenses', parseFloat(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Investment Return (%)
                    <HelpTooltip content={getShortHelp('investmentReturn')} />
                  </label>
                  <input
                    type="number"
                    value={formData.investmentReturnRate * 100}
                    onChange={(e) => updateFormData('investmentReturnRate', parseFloat(e.target.value) / 100)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    step="0.5"
                    min="0"
                    max="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Inflation Rate (%)
                    <HelpTooltip content={getShortHelp('inflationRate')} />
                  </label>
                  <input
                    type="number"
                    value={formData.inflationRate * 100}
                    onChange={(e) => updateFormData('inflationRate', parseFloat(e.target.value) / 100)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    step="0.1"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCalculate}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Generate Projection
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {projection && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Retirement Years</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{projection.retirementYears}</div>
              <div className="mt-1 text-sm text-gray-600">Years</div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total Income</div>
              <div className="mt-2 text-2xl font-bold text-green-600">${(projection.totalIncome / 1000000).toFixed(2)}M</div>
              <div className="mt-1 text-sm text-gray-600">Lifetime</div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total Taxes</div>
              <div className="mt-2 text-2xl font-bold text-red-600">${(projection.totalTaxesPaid / 1000000).toFixed(2)}M</div>
              <div className="mt-1 text-sm text-gray-600">{projection.averageAnnualTaxRate}% avg</div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Remaining Assets</div>
              <div className="mt-2 text-2xl font-bold text-blue-600">
                ${projection.remainingAssets > 0 ? (projection.remainingAssets / 1000000).toFixed(2) + 'M' : '0'}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {projection.assetsDepleted ? `Depleted at ${projection.assetsDepletedAge}` : 'Sustained'}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expenses Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projection.projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="age"
                    label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    labelFormatter={(label) => `Age ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalAfterTaxIncome"
                    stroke="#10b981"
                    name="After-Tax Income"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="annualExpenses"
                    stroke="#ef4444"
                    name="Expenses"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Asset Balance Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Balance Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={projection.projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="age"
                    label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    labelFormatter={(label) => `Age ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="rrspBalance"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    name="RRSP/RRIF"
                  />
                  <Area
                    type="monotone"
                    dataKey="tfsaBalance"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    name="TFSA"
                  />
                  <Area
                    type="monotone"
                    dataKey="nonRegBalance"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    name="Non-Registered"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income Sources Breakdown Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Income Sources Breakdown</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={projection.projections.filter(p => p.isRetired)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="age"
                  label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Income ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  labelFormatter={(label) => `Age ${label}`}
                />
                <Legend />
                <Bar dataKey="cppIncome" stackId="a" fill="#3b82f6" name="CPP" />
                <Bar dataKey="oasIncome" stackId="a" fill="#10b981" name="OAS" />
                <Bar dataKey="gisIncome" stackId="a" fill="#8b5cf6" name="GIS" />
                <Bar dataKey="pensionIncome" stackId="a" fill="#f59e0b" name="Pension" />
                <Bar dataKey="rrspWithdrawal" stackId="a" fill="#ef4444" name="RRSP/RRIF" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tax Burden Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Burden</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={projection.projections.filter(p => p.isRetired)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="age"
                    label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Tax ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    labelFormatter={(label) => `Age ${label}`}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="federalTax"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    name="Federal Tax"
                  />
                  <Area
                    type="monotone"
                    dataKey="provincialTax"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    name="Provincial Tax"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cash Flow</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projection.projections.filter(p => p.isRetired)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="age"
                    label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: 'Cash Flow ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    labelFormatter={(label) => `Age ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="cashSurplusDeficit" name="Surplus/Deficit">
                    {projection.projections.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.cashSurplusDeficit >= 0 ? '#10b981' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Year-by-Year Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Year-by-Year Projection</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OAS</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Other</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RRSP/RRIF</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projection.projections.map((p) => (
                    <tr key={p.year} className={p.isRetired ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.age}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">${(p.cppIncome / 1000).toFixed(0)}k</td>
                      <td className="px-4 py-3 text-sm text-gray-600">${(p.oasIncome / 1000).toFixed(0)}k</td>
                      <td className="px-4 py-3 text-sm text-gray-600">${((p.employmentIncome + p.pensionIncome + p.rentalIncome + p.otherIncome) / 1000).toFixed(0)}k</td>
                      <td className="px-4 py-3 text-sm text-gray-600">${(p.rrspWithdrawal / 1000).toFixed(0)}k</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">${(p.totalGrossIncome / 1000).toFixed(0)}k</td>
                      <td className="px-4 py-3 text-sm text-red-600">${(p.totalTax / 1000).toFixed(0)}k</td>
                      <td className="px-4 py-3 text-sm text-gray-600">${(p.annualExpenses / 1000).toFixed(0)}k</td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">${(p.totalAssets / 1000).toFixed(0)}k</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warnings */}
          {projection.assetsDepleted && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-red-600 mr-3">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-red-900 mb-1">Assets Depleted</h3>
                  <p className="text-sm text-red-700">
                    Based on current assumptions, your assets will be depleted at age {projection.assetsDepletedAge}.
                    Consider adjusting your retirement age, expenses, or investment strategy.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!projection && !showInputForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
          <h3 className="text-lg font-medium text-blue-900 mb-2">No Projection Yet</h3>
          <p className="text-sm text-blue-700 mb-4">
            Click "Start Projection" to enter your financial information and generate a retirement projection.
          </p>
        </div>
      )}

      {/* Hidden Report Component for PDF Generation */}
      {projection && (
        <div className="hidden">
          <RetirementReport
            userName="User" // TODO: Get from user profile
            projection={projection}
            inputs={formData}
          />
        </div>
      )}
    </div>
  );
}
