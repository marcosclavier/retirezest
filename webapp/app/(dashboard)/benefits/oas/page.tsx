'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [yearsInCanada, setYearsInCanada] = useState('40');
  const [age, setAge] = useState('65');
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

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const profile = await res.json();
          if (profile.dateOfBirth) {
            // Calculate age from date of birth
            const today = new Date();
            const birthDate = new Date(profile.dateOfBirth);
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              calculatedAge--;
            }
            setAge(String(calculatedAge));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchCsrfToken();
    fetchProfile();
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
    // Use 0 for income since we're not collecting it anymore
    const income = 0;

    // Calculate base OAS
    const oasResult = calculateNetOAS(years, income, currentAge);

    // Calculate with deferral if applicable
    let deferralResult = null;
    if (parseInt(deferMonths) > 0) {
      deferralResult = calculateOASDeferral(years, parseInt(deferMonths), currentAge);
    }

    // Don't show clawback strategies since we're not collecting income
    const clawbackStrategies = null;

    setResult({ ...oasResult, deferralResult });
    setStrategies(clawbackStrategies);

    // Save OAS calculation result to localStorage for easy import to income page
    localStorage.setItem('oas_calculator_result', JSON.stringify({
      monthlyAmount: oasResult.monthlyAmount,
      annualAmount: oasResult.annualAmount,
      yearsInCanada: years,
      age: currentAge,
      calculatedAt: new Date().toISOString(),
    }));
  };

  const calculatePercentage = () => {
    const years = parseInt(yearsInCanada);
    return Math.min((years / FULL_OAS_YEARS) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">OAS Calculator</h1>
        <p className="mt-2 text-gray-600">
          Calculate your Old Age Security pension benefit
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Information</h2>

        {/* OAS Clawback Information Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                OAS Clawback Information (2026)
              </h3>
              <p className="text-sm text-blue-800">
                For OAS payments from <strong>July 2026 to June 2027</strong>, the clawback (recovery tax) starts at a net world income of <strong>$93,454</strong> (based on your 2025 income). If your income exceeds this threshold, you will have to repay 15% of the excess amount.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years in Canada (After Age 18)
            </label>
            <input
              type="number"
              value={yearsInCanada}
              onChange={(e) => setYearsInCanada(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
              min="0"
              max="50"
            />
            <p className="mt-1 text-xs text-gray-600">
              Minimum 10 years required. 40 years for full OAS.
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-700 mb-1">
                <span>0 years</span>
                <span className="font-medium text-gray-900">{calculatePercentage().toFixed(0)}% of full OAS</span>
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
              min="18"
              max="95"
            />
            {(() => {
              const currentAge = parseInt(age) || 65;
              if (currentAge < 64) {
                return (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    OAS is not available until age 65. You can apply at age 64.
                  </p>
                );
              } else if (currentAge === 64) {
                return (
                  <p className="mt-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                    At age 64, you can apply for OAS, but payments start at age 65.
                  </p>
                );
              } else if (currentAge >= 75) {
                return (
                  <p className="mt-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded px-2 py-1">
                    Age 75+ receives a 10% increase in OAS benefits.
                  </p>
                );
              } else {
                return (
                  <p className="mt-1 text-xs text-gray-600">
                    OAS starts at age 65. Age 75+ receives increased amount.
                  </p>
                );
              }
            })()}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Defer OAS (Optional)
            </label>
            <select
              value={deferMonths}
              onChange={(e) => setDeferMonths(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 font-semibold"
              disabled={parseInt(age) >= 70}
            >
              <option value="0">No deferral</option>
              {(() => {
                const currentAge = parseInt(age) || 65;
                const maxYearsToDefer = Math.max(0, 70 - currentAge);
                const deferralOptions = [];

                if (maxYearsToDefer >= 1) deferralOptions.push({ months: 12, years: 1, percent: 7.2 });
                if (maxYearsToDefer >= 2) deferralOptions.push({ months: 24, years: 2, percent: 14.4 });
                if (maxYearsToDefer >= 3) deferralOptions.push({ months: 36, years: 3, percent: 21.6 });
                if (maxYearsToDefer >= 4) deferralOptions.push({ months: 48, years: 4, percent: 28.8 });
                if (maxYearsToDefer >= 5) deferralOptions.push({ months: 60, years: 5, percent: 36.0 });

                return deferralOptions.map(opt => (
                  <option key={opt.months} value={opt.months}>
                    {opt.years} year{opt.years > 1 ? 's' : ''} (+{opt.percent}%)
                  </option>
                ));
              })()}
            </select>
            {(() => {
              const currentAge = parseInt(age) || 65;
              const maxYearsToDefer = Math.max(0, 70 - currentAge);

              if (currentAge >= 70) {
                return (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    OAS cannot be deferred past age 70
                  </p>
                );
              } else if (currentAge > 65) {
                return (
                  <p className="mt-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                    At age {currentAge}, you can defer OAS for up to {maxYearsToDefer} more year{maxYearsToDefer > 1 ? 's' : ''} (until age 70)
                  </p>
                );
              } else {
                return (
                  <p className="mt-1 text-xs text-gray-600">
                    Delay OAS for 0.6% increase per month (max 5 years until age 70)
                  </p>
                );
              }
            })()}
          </div>
        </div>

        {/* Warning for age < 65 */}
        {parseInt(age) < 65 && (
          <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 mb-1">
                  OAS Not Yet Available
                </h4>
                <p className="text-sm text-yellow-800">
                  {parseInt(age) === 64
                    ? 'At age 64, you can apply for OAS, but payments will not start until you turn 65. This calculator will show your benefits starting at age 65.'
                    : `OAS benefits are not available until age 65. You are currently ${parseInt(age)} years old. You can apply for OAS at age 64, and payments will begin at age 65.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleCalculate}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {parseInt(age) < 65 ? 'Calculate Future OAS Benefits (at Age 65)' : 'Calculate OAS Benefits'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Age Warning for Results */}
          {parseInt(age) < 65 && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> These amounts represent your OAS benefits <strong>when you turn 65</strong>.
                  {parseInt(age) === 64 && ' You can apply now, but payments start at age 65.'}
                </p>
              </div>
            </div>
          )}

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
          {parseInt(deferMonths) === 0 && parseInt(age) < 70 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Benefit of Deferring OAS
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(() => {
                  const currentAge = parseInt(age);
                  const maxDeferralAge = 70;
                  const monthsAlreadyDeferred = Math.max(0, (currentAge - 65) * 12);
                  const remainingMonths = (maxDeferralAge - currentAge) * 12;

                  // Generate deferral options based on current age
                  const deferralOptions = [0];
                  if (remainingMonths >= 12) deferralOptions.push(12);
                  if (remainingMonths >= 24) deferralOptions.push(24);
                  if (remainingMonths >= 36) deferralOptions.push(36);
                  if (remainingMonths >= 48) deferralOptions.push(48);
                  if (remainingMonths >= 60) deferralOptions.push(60);

                  return deferralOptions.map((months) => {
                    const totalMonths = monthsAlreadyDeferred + months;
                    const deferred = calculateOASDeferral(
                      parseInt(yearsInCanada),
                      totalMonths,
                      65 // Base calculation from age 65
                    );
                    const targetAge = currentAge + (months / 12);

                    return (
                      <div
                        key={months}
                        className={`p-4 rounded-lg border-2 ${
                          months === 0
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-700">
                          {months === 0
                            ? `Now (${currentAge})`
                            : `+${months / 12} yr${months / 12 > 1 ? 's' : ''} (${targetAge})`
                          }
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${deferred.monthlyAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          ${deferred.annualAmount.toLocaleString()}/year
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {totalMonths > 0 && `+${deferred.increasePercent}%`}
                        </div>
                      </div>
                    );
                  });
                })()}
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
            <h4 className="text-sm font-medium text-blue-900 mb-2">OAS Key Facts (2026)</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Maximum OAS (65-74): $742.31/month (2026)</li>
              <li>• Maximum OAS (75+): $816.54/month (2026)</li>
              <li>• Clawback threshold (July 2026-June 2027): $93,454/year (based on 2025 income)</li>
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
