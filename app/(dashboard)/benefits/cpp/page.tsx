'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  estimateCPPSimple,
  findOptimalCPPStartAge,
  calculateBreakEvenAge,
  CPP_AGE_FACTORS,
  MAX_CPP_2025,
} from '@/lib/calculations/cpp';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { getShortHelp } from '@/lib/help/helpContent';

export default function CPPCalculatorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromWizard = searchParams.get('from') === 'wizard';
  const [averageIncome, setAverageIncome] = useState('70000');
  const [displayIncome, setDisplayIncome] = useState('70,000'); // Formatted for display
  const [yearsOfContributions, setYearsOfContributions] = useState('35');
  const [currentAge, setCurrentAge] = useState('65');
  const [startAge, setStartAge] = useState('65');
  const [lifeExpectancy, setLifeExpectancy] = useState('85');
  const [result, setResult] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [ageFromProfile, setAgeFromProfile] = useState(false);

  // Format number with thousand separators
  const formatWithCommas = (value: string): string => {
    const num = value.replace(/,/g, '');
    if (!num || isNaN(Number(num))) return value;
    return Number(num).toLocaleString('en-US');
  };

  // Handle income input change
  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, ''); // Remove existing commas
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      setAverageIncome(rawValue);
      setDisplayIncome(rawValue ? formatWithCommas(rawValue) : '');
    }
  };

  // Load saved values from localStorage on mount
  useEffect(() => {
    const savedCurrentAge = localStorage.getItem('cpp_calculator_current_age');
    const savedAverageIncome = localStorage.getItem('cpp_calculator_average_income');
    const savedYearsOfContributions = localStorage.getItem('cpp_calculator_years_of_contributions');
    const savedStartAge = localStorage.getItem('cpp_calculator_start_age');
    const savedLifeExpectancy = localStorage.getItem('cpp_calculator_life_expectancy');

    if (savedCurrentAge) setCurrentAge(savedCurrentAge);
    if (savedAverageIncome) {
      setAverageIncome(savedAverageIncome);
      setDisplayIncome(formatWithCommas(savedAverageIncome));
    }
    if (savedYearsOfContributions) setYearsOfContributions(savedYearsOfContributions);
    if (savedStartAge) setStartAge(savedStartAge);
    if (savedLifeExpectancy) setLifeExpectancy(savedLifeExpectancy);
  }, []);

  // Fetch user profile to populate current age
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const profile = await res.json();
          if (profile.dateOfBirth) {
            // Calculate age from date of birth
            const today = new Date();
            const birthDate = new Date(profile.dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }

            // Only set if not already saved in localStorage
            const savedCurrentAge = localStorage.getItem('cpp_calculator_current_age');
            if (!savedCurrentAge) {
              setCurrentAge(age.toString());
              localStorage.setItem('cpp_calculator_current_age', age.toString());
              setAgeFromProfile(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

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

  // Save to localStorage whenever values change
  useEffect(() => {
    localStorage.setItem('cpp_calculator_current_age', currentAge);
  }, [currentAge]);

  useEffect(() => {
    localStorage.setItem('cpp_calculator_average_income', averageIncome);
  }, [averageIncome]);

  useEffect(() => {
    localStorage.setItem('cpp_calculator_years_of_contributions', yearsOfContributions);
  }, [yearsOfContributions]);

  useEffect(() => {
    localStorage.setItem('cpp_calculator_start_age', startAge);
  }, [startAge]);

  useEffect(() => {
    localStorage.setItem('cpp_calculator_life_expectancy', lifeExpectancy);
  }, [lifeExpectancy]);

  const recordCalculatorUsage = async () => {
    if (!csrfToken) return;

    try {
      await fetch('/api/profile/calculator-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ calculator: 'cpp' }),
      });
    } catch (error) {
      // Silently fail - this is just for tracking
      console.error('Error recording calculator usage:', error);
    }
  };

  const handleCalculate = () => {
    // Record that the user used the CPP calculator
    recordCalculatorUsage();
    const estimate = estimateCPPSimple(
      parseFloat(averageIncome),
      parseInt(yearsOfContributions),
      parseInt(startAge),
      parseInt(currentAge)
    );

    // Build proper contribution history for break-even and optimal age analysis
    const contributionHistory = [];
    const currentYear = new Date().getFullYear();
    const contributoryYears = Math.max(parseInt(startAge) - 18, 0);

    // Fill contribution history including zero-earning years
    for (let i = 0; i < contributoryYears; i++) {
      const year = currentYear - (parseInt(currentAge) - parseInt(startAge)) - i;
      const isContributionYear = i < parseInt(yearsOfContributions);

      contributionHistory.push({
        year,
        pensionableEarnings: isContributionYear ? Math.min(parseFloat(averageIncome), 71300) : 0,
      });
    }

    const optimal = findOptimalCPPStartAge(
      contributionHistory,
      parseInt(lifeExpectancy)
    );

    // Calculate break-even ages
    const breakEven60vs65 = calculateBreakEvenAge(contributionHistory, 60, 65);
    const breakEven65vs70 = calculateBreakEvenAge(contributionHistory, 65, 70);

    setResult(estimate);
    setComparison({
      optimal,
      breakEven60vs65,
      breakEven65vs70,
    });

    // Save CPP calculation result to localStorage for easy import to income page
    localStorage.setItem('cpp_calculator_result', JSON.stringify({
      monthlyAmount: estimate.monthlyAmount,
      annualAmount: estimate.annualAmount,
      startAge: estimate.startAge,
      calculatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Return to Wizard Banner */}
      {fromWizard && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-indigo-900">
                  You opened this from the Setup Wizard
                </p>
                <p className="text-sm text-indigo-700">
                  When you're done exploring CPP benefits, close this tab to return to the wizard
                </p>
              </div>
            </div>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium text-sm whitespace-nowrap ml-4"
            >
              Close Tab
            </button>
          </div>
        </div>
      )}

      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">CPP Calculator</h1>
        <p className="mt-2 text-gray-600">
          Calculate your Canada Pension Plan retirement benefit
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong className="font-semibold">This is an estimate only.</strong> For more accurate results and to see your actual CPP contribution history, please visit{' '}
              <a
                href="https://www.canada.ca/en/employment-social-development/services/my-account.html"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-blue-900"
              >
                Service Canada My Account
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Average Annual Income
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-medium">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={displayIncome}
                onChange={handleIncomeChange}
                className="pl-7 pr-3 py-2 block w-full rounded-md border-2 border-gray-400 bg-white text-gray-900 font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Your average pensionable earnings throughout your career
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Contributions
            </label>
            <input
              type="number"
              value={yearsOfContributions}
              onChange={(e) => setYearsOfContributions(e.target.value)}
              className="block w-full rounded-md border-2 border-gray-400 bg-white text-gray-900 font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="10"
              max="47"
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of years you've contributed to CPP (ages 18-65)
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Current Age
              </label>
              {ageFromProfile && (
                <span className="text-xs text-blue-600 font-medium">✓ From profile</span>
              )}
            </div>
            <input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)}
              className={`block w-full rounded-md border-2 bg-white text-gray-900 font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                ageFromProfile ? 'border-blue-200 bg-blue-50' : 'border-gray-400'
              }`}
              min="18"
              max="100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Your current age (used to calculate contributory period)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              CPP Start Age
              <HelpTooltip content={getShortHelp('cppStartAge')} />
            </label>
            <input
              type="range"
              value={startAge}
              onChange={(e) => setStartAge(e.target.value)}
              className="w-full"
              min="60"
              max="70"
            />
            <div className="flex justify-between text-sm text-gray-700 font-medium">
              <span>60</span>
              <span className="font-bold text-xl text-blue-600">{startAge}</span>
              <span>70</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Age when you plan to start receiving CPP
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              Life Expectancy
              <HelpTooltip content={getShortHelp('lifeExpectancy')} />
            </label>
            <input
              type="number"
              value={lifeExpectancy}
              onChange={(e) => setLifeExpectancy(e.target.value)}
              className="block w-full rounded-md border-2 border-gray-400 bg-white text-gray-900 font-medium shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="65"
              max="100"
            />
            <p className="mt-1 text-xs text-gray-500">
              How long you expect to live
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleCalculate}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Calculate CPP Benefits
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Main Result */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg rounded-lg p-8 text-white">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Your Estimated CPP at Age {startAge}</h3>
              <div className="text-5xl font-bold mb-2">
                ${result.monthlyAmount.toLocaleString()}<span className="text-2xl">/mo</span>
              </div>
              <div className="text-xl">
                ${result.annualAmount.toLocaleString()} per year
              </div>
              <div className="mt-4 text-sm opacity-90">
                Adjustment Factor: {(result.adjustmentFactor * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Age Comparison */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              CPP at Different Starting Ages
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(CPP_AGE_FACTORS).map(([age, factor]) => {
                const ageNum = parseInt(age);
                const estimate = estimateCPPSimple(
                  parseFloat(averageIncome),
                  parseInt(yearsOfContributions),
                  ageNum,
                  parseInt(currentAge)
                );
                const isSelected = ageNum === parseInt(startAge);

                return (
                  <div
                    key={age}
                    className={`p-4 rounded-lg border-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-700">Age {age}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${estimate.monthlyAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {factor < 1 ? '-' : '+'}{Math.abs((factor - 1) * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optimal Age Analysis */}
          {comparison && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Optimal Start Age Analysis
              </h3>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-800">
                        Optimal Age (Based on Life Expectancy of {lifeExpectancy})
                      </div>
                      <div className="text-3xl font-bold text-green-900 mt-1">
                        Age {comparison.optimal.optimalAge}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-700">Lifetime Value</div>
                      <div className="text-2xl font-bold text-green-900">
                        ${Math.round(comparison.optimal.lifetimeValue).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Break-Even: Age 60 vs 65
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      Age {Math.round(comparison.breakEven60vs65)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      At this age, total received will be equal
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Break-Even: Age 65 vs 70
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      Age {Math.round(comparison.breakEven65vs70)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      At this age, total received will be equal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">CPP Key Facts (2025)</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Maximum monthly CPP: ${MAX_CPP_2025.toLocaleString()}</li>
              <li>• Start as early as age 60 (reduced by 36%)</li>
              <li>• Standard retirement age: 65</li>
              <li>• Delay until age 70 (increased by 42%)</li>
              <li>• Each month matters: 0.6% adjustment per month before/after 65</li>
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-3 text-sm text-gray-700">
              {parseInt(startAge) < comparison.optimal.optimalAge ? (
                <div className="flex items-start">
                  <span className="text-yellow-500 mr-2">⚠️</span>
                  <div>
                    <strong>Consider delaying:</strong> Based on your life expectancy of {lifeExpectancy},
                    starting at age {comparison.optimal.optimalAge} would maximize your lifetime benefits.
                  </div>
                </div>
              ) : parseInt(startAge) > comparison.optimal.optimalAge ? (
                <div className="flex items-start">
                  <span className="text-yellow-500 mr-2">⚠️</span>
                  <div>
                    <strong>Consider starting earlier:</strong> Based on your life expectancy of {lifeExpectancy},
                    starting at age {comparison.optimal.optimalAge} would maximize your lifetime benefits.
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <div>
                    <strong>Optimal timing:</strong> Age {startAge} is the optimal age to start CPP based on
                    your life expectancy.
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <span className="text-blue-500 mr-2">ℹ️</span>
                <div>
                  <strong>Health consideration:</strong> If you have health concerns or family history of
                  shorter lifespan, consider starting earlier.
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-blue-500 mr-2">ℹ️</span>
                <div>
                  <strong>Other income:</strong> If you have other sources of retirement income, you may
                  have flexibility to delay CPP for higher monthly payments.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* How It Works */}
      {!result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How CPP Works</h3>
          <div className="prose prose-sm text-gray-600">
            <p>
              The Canada Pension Plan (CPP) is a monthly retirement benefit that replaces part of your
              income when you retire. Your CPP amount is based on:
            </p>
            <ul>
              <li>How much you've earned throughout your working life</li>
              <li>How long you've contributed to CPP</li>
              <li>The age when you start receiving it</li>
            </ul>
            <p className="font-medium mt-4">Important CPP Features:</p>
            <ul>
              <li><strong>Dropout Provision:</strong> Up to 17% of your lowest-earning years are dropped</li>
              <li><strong>Indexing:</strong> CPP payments increase with inflation</li>
              <li><strong>Lifetime Benefit:</strong> Payments continue for life</li>
              <li><strong>Survivor Benefits:</strong> Benefits can continue to your spouse</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
