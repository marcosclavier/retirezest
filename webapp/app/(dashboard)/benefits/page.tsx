'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  estimateCPPSimple,
  MAX_CPP_2025,
} from '@/lib/calculations/cpp';
import {
  calculateNetOAS,
  MAX_OAS_65_2025,
  MAX_OAS_75_2025,
} from '@/lib/calculations/oas';
import {
  calculateGIS,
  MAX_GIS_SINGLE_2025,
  GIS_INCOME_THRESHOLD_SINGLE_2025,
} from '@/lib/calculations/gis';

export default function BenefitsPage() {
  // Quick estimate inputs
  const [age, setAge] = useState('65');
  const [yearsInCanada, setYearsInCanada] = useState('40');
  const [averageIncome, setAverageIncome] = useState('60000');
  const [yearsOfCPPContributions, setYearsOfCPPContributions] = useState('35');
  const [showQuickEstimate, setShowQuickEstimate] = useState(false);

  const [cppEstimate, setCppEstimate] = useState<any>(null);
  const [oasEstimate, setOasEstimate] = useState<any>(null);
  const [gisEstimate, setGisEstimate] = useState<any>(null);

  const handleQuickEstimate = () => {
    const currentAge = parseInt(age);
    const income = parseFloat(averageIncome);

    // Estimate CPP
    const cpp = estimateCPPSimple(income, parseInt(yearsOfCPPContributions), currentAge);
    setCppEstimate(cpp);

    // Estimate OAS
    const oas = calculateNetOAS(parseInt(yearsInCanada), income, currentAge);
    setOasEstimate(oas);

    // Estimate GIS (if eligible - low income)
    const totalIncome = cpp.annualAmount + income;
    if (totalIncome < GIS_INCOME_THRESHOLD_SINGLE_2025) {
      const gis = calculateGIS(totalIncome - oas.annualAmount, 'single', false);
      setGisEstimate(gis);
    } else {
      setGisEstimate(null);
    }

    setShowQuickEstimate(true);
  };

  const getTotalMonthly = () => {
    let total = 0;
    if (cppEstimate) total += cppEstimate.monthlyAmount;
    if (oasEstimate) total += oasEstimate.monthlyAmount;
    if (gisEstimate) total += gisEstimate.monthlyAmount;
    return total;
  };

  const getTotalAnnual = () => {
    let total = 0;
    if (cppEstimate) total += cppEstimate.annualAmount;
    if (oasEstimate) total += oasEstimate.annualAmount;
    if (gisEstimate) total += gisEstimate.annualAmount;
    return total;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Government Benefits</h1>
        <p className="mt-2 text-gray-600">
          Explore Canadian retirement benefits: CPP, OAS, and GIS
        </p>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPP Card */}
        <Link href="/benefits/cpp">
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">CPP Calculator</h3>
              <div className="text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Canada Pension Plan retirement benefit based on your contributions and earnings.
            </p>
            <div className="bg-blue-50 rounded p-3">
              <div className="text-xs text-blue-600 font-medium">Maximum (2025)</div>
              <div className="text-xl font-bold text-blue-900">${MAX_CPP_2025.toLocaleString()}/mo</div>
            </div>
            <div className="mt-4 text-sm text-blue-600 font-medium flex items-center">
              Calculate Your CPP
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* OAS Card */}
        <Link href="/benefits/oas">
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">OAS Calculator</h3>
              <div className="text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Old Age Security pension for Canadians 65+ based on years of residence.
            </p>
            <div className="bg-green-50 rounded p-3">
              <div className="text-xs text-green-600 font-medium">Maximum (2025)</div>
              <div className="text-xl font-bold text-green-900">${MAX_OAS_65_2025.toLocaleString()}/mo</div>
              <div className="text-xs text-green-600 mt-1">Ages 65-74</div>
            </div>
            <div className="mt-4 text-sm text-green-600 font-medium flex items-center">
              Calculate Your OAS
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* GIS Card */}
        <Link href="/benefits/gis">
          <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">GIS Calculator</h3>
              <div className="text-purple-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Guaranteed Income Supplement for low-income OAS recipients.
            </p>
            <div className="bg-purple-50 rounded p-3">
              <div className="text-xs text-purple-600 font-medium">Maximum (2025)</div>
              <div className="text-xl font-bold text-purple-900">${MAX_GIS_SINGLE_2025.toLocaleString()}/mo</div>
              <div className="text-xs text-purple-600 mt-1">Single recipients</div>
            </div>
            <div className="mt-4 text-sm text-purple-600 font-medium flex items-center">
              Calculate Your GIS
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Benefit Estimator */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg rounded-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Quick Benefits Estimator</h2>
        <p className="text-sm opacity-90 mb-4">
          Get a rough estimate of your combined government benefits
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="block w-full rounded-md border-white bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 focus:ring-2 focus:ring-white px-3 py-2"
              min="60"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Years in Canada</label>
            <input
              type="number"
              value={yearsInCanada}
              onChange={(e) => setYearsInCanada(e.target.value)}
              className="block w-full rounded-md border-white bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 focus:ring-2 focus:ring-white px-3 py-2"
              min="0"
              max="50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Average Income</label>
            <input
              type="number"
              value={averageIncome}
              onChange={(e) => setAverageIncome(e.target.value)}
              className="block w-full rounded-md border-white bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 focus:ring-2 focus:ring-white px-3 py-2"
              min="0"
              step="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Years CPP Contrib.</label>
            <input
              type="number"
              value={yearsOfCPPContributions}
              onChange={(e) => setYearsOfCPPContributions(e.target.value)}
              className="block w-full rounded-md border-white bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 focus:ring-2 focus:ring-white px-3 py-2"
              min="0"
              max="47"
            />
          </div>
        </div>

        <button
          onClick={handleQuickEstimate}
          className="w-full px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-opacity-90 font-medium"
        >
          Get Quick Estimate
        </button>
      </div>

      {/* Quick Estimate Results */}
      {showQuickEstimate && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Estimated Benefits Summary</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {cppEstimate && (
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="text-sm text-blue-600 font-medium mb-1">CPP</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${cppEstimate.monthlyAmount.toLocaleString()}/mo
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  ${cppEstimate.annualAmount.toLocaleString()}/year
                </div>
              </div>
            )}

            {oasEstimate && (
              <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <div className="text-sm text-green-600 font-medium mb-1">OAS</div>
                <div className="text-2xl font-bold text-green-900">
                  ${oasEstimate.monthlyAmount.toLocaleString()}/mo
                </div>
                <div className="text-sm text-green-700 mt-1">
                  ${oasEstimate.annualAmount.toLocaleString()}/year
                </div>
              </div>
            )}

            {gisEstimate && gisEstimate.monthlyAmount > 0 && (
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="text-sm text-purple-600 font-medium mb-1">GIS</div>
                <div className="text-2xl font-bold text-purple-900">
                  ${gisEstimate.monthlyAmount.toLocaleString()}/mo
                </div>
                <div className="text-sm text-purple-700 mt-1">
                  ${gisEstimate.annualAmount.toLocaleString()}/year
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-6 text-white">
            <div className="text-center">
              <div className="text-sm font-medium mb-2">Combined Benefits</div>
              <div className="text-4xl font-bold mb-2">
                ${getTotalMonthly().toLocaleString()}<span className="text-xl">/month</span>
              </div>
              <div className="text-lg">
                ${getTotalAnnual().toLocaleString()} per year
              </div>
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-2">ℹ️</div>
              <div className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a rough estimate. Use the individual calculators for more accurate results based on your specific situation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPP vs OAS */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">CPP vs OAS</h3>
          <div className="space-y-4">
            <div>
              <div className="font-medium text-blue-900 mb-1">CPP (Canada Pension Plan)</div>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Based on your contributions while working</li>
                <li>• Requires work history in Canada</li>
                <li>• Amount varies based on earnings</li>
                <li>• Can start as early as age 60</li>
                <li>• Indexed to inflation</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-green-900 mb-1">OAS (Old Age Security)</div>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Based on years lived in Canada</li>
                <li>• No work history required</li>
                <li>• Same amount for everyone (if full residency)</li>
                <li>• Starts at age 65</li>
                <li>• Clawback for high earners</li>
              </ul>
            </div>
          </div>
        </div>

        {/* GIS Eligibility */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">GIS Eligibility</h3>
          <p className="text-sm text-gray-600 mb-4">
            The Guaranteed Income Supplement provides additional income to low-income seniors.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <div className="text-purple-600 mr-2">✓</div>
              <div className="text-gray-700">Must be receiving OAS</div>
            </div>
            <div className="flex items-start">
              <div className="text-purple-600 mr-2">✓</div>
              <div className="text-gray-700">Income below ${GIS_INCOME_THRESHOLD_SINGLE_2025.toLocaleString()} (single)</div>
            </div>
            <div className="flex items-start">
              <div className="text-purple-600 mr-2">✓</div>
              <div className="text-gray-700">Age 65 or older</div>
            </div>
            <div className="flex items-start">
              <div className="text-purple-600 mr-2">✓</div>
              <div className="text-gray-700">Canadian resident</div>
            </div>
          </div>
          <div className="mt-4 bg-purple-50 rounded p-3">
            <div className="text-xs text-purple-700 font-medium mb-1">Special Note</div>
            <div className="text-xs text-purple-600">
              OAS income does NOT count toward GIS income test. First $5,000 of CPP is also exempt.
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="text-blue-600 mr-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Ready for Detailed Estimates?</h3>
            <p className="text-sm text-blue-700 mb-4">
              Use our individual calculators to get personalized estimates based on your specific situation,
              including optimal timing strategies and tax implications.
            </p>
            <div className="flex space-x-3">
              <Link href="/benefits/cpp">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                  CPP Calculator
                </button>
              </Link>
              <Link href="/benefits/oas">
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">
                  OAS Calculator
                </button>
              </Link>
              <Link href="/benefits/gis">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium">
                  GIS Calculator
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
