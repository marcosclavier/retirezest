'use client';

import { useState } from 'react';
import {
  calculateGIS,
  isEligibleForGIS,
  calculateGISIncome,
  suggestGISStrategies,
  MAX_GIS_SINGLE_2025,
  MAX_GIS_MARRIED_BOTH_2025,
  MAX_GIS_MARRIED_ONE_2025,
  GIS_INCOME_THRESHOLD_SINGLE_2025,
  GIS_INCOME_THRESHOLD_MARRIED_2025,
} from '@/lib/calculations/gis';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { getShortHelp } from '@/lib/help/helpContent';

export default function GISCalculatorPage() {
  const [age, setAge] = useState('65');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');
  const [spouseReceivesOAS, setSpouseReceivesOAS] = useState(false);
  const [receivesOAS, setReceivesOAS] = useState(true);

  // Income breakdown
  const [employment, setEmployment] = useState('0');
  const [pension, setPension] = useState('0');
  const [rrspWithdrawals, setRrspWithdrawals] = useState('0');
  const [investmentIncome, setInvestmentIncome] = useState('0');
  const [rentalIncome, setRentalIncome] = useState('0');
  const [cpp, setCpp] = useState('0');
  const [oasAmount, setOasAmount] = useState('0');

  const [result, setResult] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [incomeBreakdown, setIncomeBreakdown] = useState<any>(null);
  const [strategies, setStrategies] = useState<any>(null);

  const handleCalculate = () => {
    // Calculate GIS-countable income
    const incomeData = calculateGISIncome({
      employment: parseFloat(employment) || 0,
      pension: parseFloat(pension) || 0,
      rrspWithdrawals: parseFloat(rrspWithdrawals) || 0,
      investmentIncome: parseFloat(investmentIncome) || 0,
      rentalIncome: parseFloat(rentalIncome) || 0,
      cpp: parseFloat(cpp) || 0,
      oasAmount: parseFloat(oasAmount) || 0,
    });

    setIncomeBreakdown(incomeData);

    // Check eligibility
    const eligible = isEligibleForGIS(
      parseInt(age),
      receivesOAS,
      incomeData.totalGISIncome,
      maritalStatus
    );

    setEligibility(eligible);

    // Calculate GIS
    if (eligible.eligible) {
      const gisResult = calculateGIS(
        incomeData.totalGISIncome,
        maritalStatus,
        spouseReceivesOAS
      );
      setResult(gisResult);

      // Get strategies
      const hasRRSP = parseFloat(rrspWithdrawals) > 0;
      const gisStrategies = suggestGISStrategies(
        incomeData.totalGISIncome,
        maritalStatus,
        hasRRSP,
        true // Assume TFSA available
      );
      setStrategies(gisStrategies);
    } else {
      setResult(null);
      setStrategies(null);
    }
  };

  const getTotalIncome = () => {
    return (
      (parseFloat(employment) || 0) +
      (parseFloat(pension) || 0) +
      (parseFloat(rrspWithdrawals) || 0) +
      (parseFloat(investmentIncome) || 0) +
      (parseFloat(rentalIncome) || 0) +
      (parseFloat(cpp) || 0) +
      (parseFloat(oasAmount) || 0)
    );
  };

  const getMaxGIS = () => {
    if (maritalStatus === 'single') {
      return MAX_GIS_SINGLE_2025;
    } else {
      return spouseReceivesOAS ? MAX_GIS_MARRIED_BOTH_2025 : MAX_GIS_MARRIED_ONE_2025;
    }
  };

  const getIncomeThreshold = () => {
    return maritalStatus === 'single'
      ? GIS_INCOME_THRESHOLD_SINGLE_2025
      : GIS_INCOME_THRESHOLD_MARRIED_2025;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">GIS Calculator</h1>
        <p className="mt-2 text-gray-600">
          Calculate your Guaranteed Income Supplement benefit
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Information</h2>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="60"
              max="100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Must be 65+ to qualify for GIS
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marital Status
            </label>
            <select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as 'single' | 'married')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="single">Single</option>
              <option value="married">Married/Common-Law</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OAS Status
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="receivesOAS"
                  checked={receivesOAS}
                  onChange={(e) => setReceivesOAS(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="receivesOAS" className="ml-2 block text-sm text-gray-900">
                  I receive OAS
                </label>
              </div>
              {maritalStatus === 'married' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="spouseReceivesOAS"
                    checked={spouseReceivesOAS}
                    onChange={(e) => setSpouseReceivesOAS(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="spouseReceivesOAS" className="ml-2 block text-sm text-gray-900">
                    Spouse receives OAS
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Income Sources */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Annual Income Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pension Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={pension}
                  onChange={(e) => setPension(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPP Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={cpp}
                  onChange={(e) => setCpp(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">First $5,000 exempt</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RRSP/RRIF Withdrawals
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={rrspWithdrawals}
                  onChange={(e) => setRrspWithdrawals(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={investmentIncome}
                  onChange={(e) => setInvestmentIncome(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rental Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={rentalIncome}
                  onChange={(e) => setRentalIncome(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OAS Income (Exempt)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={oasAmount}
                  onChange={(e) => setOasAmount(e.target.value)}
                  className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
              </div>
              <p className="mt-1 text-xs text-green-600">Not counted for GIS</p>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Annual Income:</span>
              <span className="text-xl font-bold text-gray-900">
                ${getTotalIncome().toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleCalculate}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Calculate GIS Benefits
          </button>
        </div>
      </div>

      {/* Results */}
      {eligibility && (
        <>
          {eligibility.eligible ? (
            <>
              {/* Income Breakdown */}
              {incomeBreakdown && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    GIS Income Calculation
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(incomeBreakdown.breakdown).map(([source, amount]) => (
                      <div key={source} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{source}</span>
                        <span className="font-medium text-gray-900">
                          ${(amount as number).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {incomeBreakdown.excludedIncome.length > 0 && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="text-sm font-medium text-green-700 mb-2">
                          Excluded Income (Does Not Count):
                        </div>
                        {incomeBreakdown.excludedIncome.map((item: string, index: number) => (
                          <div key={index} className="text-xs text-green-600 ml-2">
                            • {item}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">
                          Total GIS-Countable Income
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          ${incomeBreakdown.totalGISIncome.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Threshold: ${getIncomeThreshold().toLocaleString()} ({maritalStatus})
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Result */}
              {result && (
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg rounded-lg p-8 text-white">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">
                      Your Estimated GIS
                    </h3>
                    <div className="text-5xl font-bold mb-2">
                      ${result.monthlyAmount.toLocaleString()}<span className="text-2xl">/mo</span>
                    </div>
                    <div className="text-xl">
                      ${result.annualAmount.toLocaleString()} per year
                    </div>
                    <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3">
                      <div className="text-sm">Maximum GIS ({maritalStatus})</div>
                      <div className="text-lg font-semibold">
                        ${getMaxGIS().toLocaleString()}/month
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Strategies */}
              {strategies && strategies.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Strategies to Maximize GIS
                  </h3>
                  <div className="space-y-3">
                    {strategies.map((strategy: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{strategy.strategy}</h4>
                            <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-sm text-green-600 font-medium">
                              {strategy.estimatedBenefit}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Facts */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-900 mb-2">GIS Key Facts (2025)</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Maximum GIS (single): ${MAX_GIS_SINGLE_2025.toLocaleString()}/month</li>
                  <li>• Maximum GIS (married, both OAS): ${MAX_GIS_MARRIED_BOTH_2025.toLocaleString()}/month</li>
                  <li>• Income threshold (single): ${GIS_INCOME_THRESHOLD_SINGLE_2025.toLocaleString()}/year</li>
                  <li>• Income threshold (married): ${GIS_INCOME_THRESHOLD_MARRIED_2025.toLocaleString()}/year</li>
                  <li>• GIS reduces by $0.50 for every $1 of income (single)</li>
                  <li>• OAS income does NOT count towards GIS income test</li>
                  <li>• First $5,000 of CPP is exempt from GIS income test</li>
                  <li>• TFSA withdrawals do NOT count as income</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="text-red-600 mr-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-red-900 mb-2">Not Eligible for GIS</h3>
                  <p className="text-sm text-red-700">{eligibility.reason}</p>

                  {incomeBreakdown && incomeBreakdown.totalGISIncome > 0 && (
                    <div className="mt-4 bg-white rounded p-3">
                      <div className="text-sm text-gray-700">
                        <div className="font-medium mb-2">Your GIS-countable income:</div>
                        <div className="text-xl font-bold text-gray-900 mb-1">
                          ${incomeBreakdown.totalGISIncome.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          Income must be below ${getIncomeThreshold().toLocaleString()} to qualify
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* How It Works */}
      {!eligibility && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How GIS Works</h3>
          <div className="prose prose-sm text-gray-600">
            <p>
              The Guaranteed Income Supplement (GIS) is a monthly non-taxable benefit paid to low-income
              seniors who receive Old Age Security (OAS).
            </p>
            <p className="font-medium mt-4">GIS Eligibility Requirements:</p>
            <ul>
              <li>Be 65 years of age or older</li>
              <li>Be receiving Old Age Security (OAS)</li>
              <li>Have annual income below the threshold</li>
              <li>Be a Canadian citizen or legal resident living in Canada</li>
            </ul>
            <p className="font-medium mt-4">Important GIS Features:</p>
            <ul>
              <li><strong>Income-Tested:</strong> GIS is reduced as your income increases</li>
              <li><strong>OAS Exempt:</strong> OAS income does NOT count toward GIS income test</li>
              <li><strong>CPP Exemption:</strong> First $5,000 of CPP is exempt (2025)</li>
              <li><strong>TFSA Advantage:</strong> TFSA withdrawals do not count as income</li>
              <li><strong>Automatic Renewal:</strong> GIS renews automatically based on tax return</li>
              <li><strong>Tax-Free:</strong> GIS benefits are not taxable</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
