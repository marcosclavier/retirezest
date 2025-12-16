'use client';

import { useState, useEffect } from 'react';
import {
  calculateNetOAS,
  calculateOASDeferral,
  suggestClawbackStrategies,
  MAX_OAS_65_2025,
  MAX_OAS_75_2025,
  OAS_CLAWBACK_THRESHOLD_2025,
  FULL_OAS_YEARS,
} from '@/lib/calculations/oas';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { getShortHelp } from '@/lib/help/helpContent';

export default function OASCalculatorPage() {
  const [yearsInCanada, setYearsInCanada] = useState('40');
  const [age, setAge] = useState('65');
  const [annualIncome, setAnnualIncome] = useState('50000');
  const [deferMonths, setDeferMonths] = useState('0');
  const [result, setResult] = useState<any>(null);
  const [strategies, setStrategies] = useState<any>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
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
    fetchCsrfToken();
  }, []);

  const recordCalculatorUsage = async () => {
    if (!csrfToken) return;

    try {
      await fetch('/api/profile/calculator-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ calculator: 'oas' }),
      });
    } catch (error) {
      // Silently fail - this is just for tracking
      console.error('Error recording calculator usage:', error);
    }
  };

  const handleCalculate = () => {
    // Record that the user used the OAS calculator
    recordCalculatorUsage();
    const years = parseInt(yearsInCanada);
    const currentAge = parseInt(age);
    const income = parseFloat(annualIncome);

    // Calculate base OAS
    const oasResult = calculateNetOAS(years, income, currentAge);

    // Calculate with deferral if applicable
    let deferralResult = null;
    if (parseInt(deferMonths) > 0) {
      deferralResult = calculateOASDeferral(years, parseInt(deferMonths), currentAge);
    }

    // Get clawback strategies if applicable
    const clawbackStrategies = income > OAS_CLAWBACK_THRESHOLD_2025
      ? suggestClawbackStrategies(income, years, currentAge)
      : null;

    setResult({ ...oasResult, deferralResult });
    setStrategies(clawbackStrategies);
  };

  const calculatePercentage = () => {
    const years = parseInt(yearsInCanada);
    return Math.min((years / FULL_OAS_YEARS) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">OAS Calculator</h1>
        <p className="mt-2 text-gray-600">
          Calculate your Old Age Security pension benefit
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years in Canada (After Age 18)
            </label>
            <input
              type="number"
              value={yearsInCanada}
              onChange={(e) => setYearsInCanada(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="0"
              max="50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum 10 years required. 40 years for full OAS.
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>0 years</span>
                <span className="font-medium">{calculatePercentage().toFixed(0)}% of full OAS</span>
                <span>40 years</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${calculatePercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="65"
              max="80"
            />
            <p className="mt-1 text-xs text-gray-500">
              OAS starts at age 65. Age 75+ receives increased amount.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              Annual Retirement Income
              <HelpTooltip content={getShortHelp('oasClawback')} />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="1000"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Clawback starts at ${OAS_CLAWBACK_THRESHOLD_2025.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Defer OAS (Optional)
            </label>
            <select
              value={deferMonths}
              onChange={(e) => setDeferMonths(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="0">No deferral</option>
              <option value="12">1 year (+7.2%)</option>
              <option value="24">2 years (+14.4%)</option>
              <option value="36">3 years (+21.6%)</option>
              <option value="48">4 years (+28.8%)</option>
              <option value="60">5 years (+36.0%)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Delay OAS for 0.6% increase per month (max 5 years)
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleCalculate}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Calculate OAS Benefits
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Main Result */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 shadow-lg rounded-lg p-8 text-white">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                Your Estimated OAS {parseInt(deferMonths) > 0 ? `(with ${parseInt(deferMonths)} month deferral)` : ''}
              </h3>
              <div className="text-5xl font-bold mb-2">
                ${result.monthlyAmount.toLocaleString()}<span className="text-2xl">/mo</span>
              </div>
              <div className="text-xl">
                ${result.annualAmount.toLocaleString()} per year
              </div>
              {result.clawback > 0 && (
                <div className="mt-4 bg-red-500 bg-opacity-20 rounded-lg p-3">
                  <div className="text-sm">OAS Clawback Applied</div>
                  <div className="text-lg font-semibold">
                    -${result.clawback.toLocaleString()} per year
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Residency Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Residency Qualification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-500">Years in Canada</div>
                <div className="text-2xl font-bold text-gray-900">{yearsInCanada}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Qualification</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(result.residencyRatio * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="text-lg font-medium text-green-600">
                  {result.residencyRatio >= 1 ? 'Full OAS' : 'Partial OAS'}
                </div>
              </div>
            </div>
            {result.residencyRatio < 1 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                You qualify for {(result.residencyRatio * 100).toFixed(0)}% of full OAS.
                {FULL_OAS_YEARS - parseInt(yearsInCanada)} more years needed for full OAS.
              </div>
            )}
          </div>

          {/* Deferral Comparison */}
          {parseInt(deferMonths) === 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Benefit of Deferring OAS
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[0, 12, 24, 36, 48, 60].map((months) => {
                  const deferred = calculateOASDeferral(
                    parseInt(yearsInCanada),
                    months,
                    parseInt(age)
                  );
                  return (
                    <div
                      key={months}
                      className={`p-4 rounded-lg border-2 ${
                        months === 0
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-600">
                        {months === 0 ? 'Now (65)' : `+${months / 12} yr${months / 12 > 1 ? 's' : ''}`}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${deferred.monthlyAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {months > 0 && `+${deferred.increasePercent}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Each year you defer OAS (up to age 70) increases your benefit by 7.2%
              </p>
            </div>
          )}

          {/* Clawback Strategies */}
          {strategies && strategies.potentialStrategies.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reduce OAS Clawback
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-red-800">Current OAS (After Clawback)</div>
                    <div className="text-2xl font-bold text-red-900">
                      ${strategies.currentOAS.toLocaleString()}/year
                    </div>
                  </div>
                  <div className="text-red-600">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {strategies.potentialStrategies.map((strategy: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{strategy.strategy}</h4>
                        <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                      </div>
                      {strategy.potentialSavings > 0 && (
                        <div className="ml-4 text-right">
                          <div className="text-sm text-gray-500">Potential Savings</div>
                          <div className="text-lg font-bold text-green-600">
                            +${strategy.potentialSavings.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Facts */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">OAS Key Facts (2025)</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Maximum OAS (65-74): ${MAX_OAS_65_2025.toLocaleString()}/month</li>
              <li>• Maximum OAS (75+): ${MAX_OAS_75_2025.toLocaleString()}/month</li>
              <li>• Clawback threshold: ${OAS_CLAWBACK_THRESHOLD_2025.toLocaleString()}/year</li>
              <li>• Clawback rate: 15% of income above threshold</li>
              <li>• Deferral bonus: 0.6% per month (7.2% per year)</li>
              <li>• OAS is indexed to inflation (increases quarterly)</li>
            </ul>
          </div>
        </>
      )}

      {/* How It Works */}
      {!result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How OAS Works</h3>
          <div className="prose prose-sm text-gray-600">
            <p>
              Old Age Security (OAS) is a monthly payment available to most Canadians age 65 and older.
              Unlike CPP, you don't need to have worked or made contributions to receive OAS.
            </p>
            <p className="font-medium mt-4">OAS Eligibility Requirements:</p>
            <ul>
              <li>Be 65 years of age or older</li>
              <li>Be a Canadian citizen or legal resident</li>
              <li>Have lived in Canada for at least 10 years after age 18</li>
            </ul>
            <p className="font-medium mt-4">Important OAS Features:</p>
            <ul>
              <li><strong>Full vs Partial:</strong> 40 years in Canada = full OAS, 10-39 years = partial</li>
              <li><strong>Clawback:</strong> High-income earners may have OAS reduced or eliminated</li>
              <li><strong>Age 75 Increase:</strong> OAS increases by 10% at age 75</li>
              <li><strong>Deferral:</strong> Delay up to 5 years for 36% higher monthly amount</li>
              <li><strong>Automatic Application:</strong> Most Canadians receive OAS automatically</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
