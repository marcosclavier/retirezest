'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { EarlyRetirementScore } from '@/components/retirement/EarlyRetirementScore';
import { RetirementAgeSlider } from '@/components/retirement/RetirementAgeSlider';
import { SavingsGapAnalysis } from '@/components/retirement/SavingsGapAnalysis';
import { RetirementScenarios } from '@/components/retirement/RetirementScenarios';
import { ActionPlan } from '@/components/retirement/ActionPlan';
import { CalculationInputs } from '@/components/retirement/CalculationInputs';
import { WhatIfSliders } from '@/components/early-retirement/WhatIfSliders';

interface EarlyRetirementData {
  readinessScore: number;
  earliestRetirementAge: number;
  targetAgeFeasible: boolean;
  projectedSavingsAtTarget: number;
  requiredSavings: number;
  savingsGap: number;
  additionalMonthlySavings: number;
  alternativeRetirementAge: number | null;
  ageScenarios: RetirementScenario[];
  assumptions: {
    pessimistic: { returnRate: number; inflationRate: number };
    neutral: { returnRate: number; inflationRate: number };
    optimistic: { returnRate: number; inflationRate: number };
  };
  governmentBenefits?: {
    cppAnnual: number;
    oasAnnual: number;
    totalAnnual: number;
    notes: string[];
  };
  recommendedContributions?: {
    rrspMonthly: number;
    rrspAnnual: number;
    tfsaMonthly: number;
    tfsaAnnual: number;
    nonRegisteredMonthly: number;
    nonRegisteredAnnual: number;
    totalMonthly: number;
    totalAnnual: number;
    warnings: string[];
    notes: string[];
  };
  craInfo?: {
    rrspToRrifAge: number;
    cppEarliestAge: number;
    cppStandardAge: number;
    oasStartAge: number;
    notes: string[];
  };
}

interface RetirementScenario {
  retirementAge: number;
  totalNeeded: number;
  successRate: number;
  monthlySavingsRequired: number;
  projectedSavings: number;
  shortfall: number;
}

interface UserProfile {
  currentAge: number;
  currentSavings: {
    rrsp: number;
    tfsa: number;
    nonRegistered: number;
    corporate: number;
  };
  annualIncome: number;
  annualSavings: number;
  targetRetirementAge: number;
  targetAnnualExpenses: number;
  lifeExpectancy: number;
  province?: string;
  cppStartAge?: number;
  oasStartAge?: number;
  includePartner?: boolean;
  partner?: {
    age: number;
    currentSavings: {
      rrsp: number;
      tfsa: number;
      nonRegistered: number;
      corporate: number;
    };
    annualIncome: number;
    targetRetirementAge: number;
  };
  householdIncome?: number;
  jointAssets?: {
    rrsp: number;
    tfsa: number;
    nonRegistered: number;
    corporate: number;
  };
}

export default function EarlyRetirementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [result, setResult] = useState<EarlyRetirementData | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [selectedAge, setSelectedAge] = useState<number>(60);
  const [error, setError] = useState<string | null>(null);
  const [showAgeCorrectionInfo, setShowAgeCorrectionInfo] = useState(false);

  const loadProfileData = useCallback(async () => {
    try {
      setProfileLoading(true);
      setError(null);

      // Fetch user's profile data
      const response = await fetch('/api/early-retirement/profile');

      if (!response.ok) {
        throw new Error('Failed to load profile data');
      }

      const data = await response.json();
      setProfileData(data);
      setSelectedAge(data.targetRetirementAge || 60);

      // Note: We can't directly detect if age was auto-corrected since the API already returns the corrected value
      // But we can check if the profile needs updating based on relationship between current and target age
      // This info message will show if target age seems too close to current age (suggesting it may have been corrected)
      if (data.currentAge && data.targetRetirementAge && data.targetRetirementAge - data.currentAge <= 5) {
        setShowAgeCorrectionInfo(true);
      }

      // Automatically calculate if user has data
      if (data.currentAge && data.currentAge > 0) {
        await calculateEarlyRetirement(data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load user profile data on mount
  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const calculateEarlyRetirement = async (customData?: UserProfile) => {
    const data = customData || profileData;

    if (!data) {
      setError('No profile data available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Combine corporate + non-registered for simplified calculation
      // (Corporate is displayed separately in UI but treated same as non-registered in calc)
      const requestData = {
        ...data,
        currentSavings: {
          rrsp: data.currentSavings.rrsp,
          tfsa: data.currentSavings.tfsa,
          nonRegistered: data.currentSavings.nonRegistered + data.currentSavings.corporate,
        },
      };

      const response = await fetch('/api/early-retirement/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Calculation failed');
      }

      const calculationResult = await response.json();
      setResult(calculationResult);
    } catch (err) {
      console.error('Calculation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate early retirement plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeChange = (newAge: number) => {
    setSelectedAge(newAge);

    if (profileData) {
      // Recalculate with new target retirement age
      const updatedData = {
        ...profileData,
        targetRetirementAge: newAge,
      };
      calculateEarlyRetirement(updatedData);
    }
  };

  const handleWhatIfScenarioChange = (scenario: Partial<UserProfile>) => {
    if (profileData) {
      // Merge what-if changes with current profile data
      const updatedData = {
        ...profileData,
        ...scenario,
      };

      // Update selected age if retirement age changed
      if (scenario.targetRetirementAge) {
        setSelectedAge(scenario.targetRetirementAge);
      }

      calculateEarlyRetirement(updatedData);
    }
  };

  const handleRefresh = () => {
    loadProfileData();
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Early Retirement Calculator</h1>
            <p className="text-gray-700 mt-2">
              Discover when you can retire early and what it takes to get there
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isLoading || profileLoading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-8 w-8 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Plan Your Early Retirement</h2>
              <p className="text-blue-100">
                Whether you're 40 or 55, we'll help you understand when you can retire early
                and exactly what you need to save to make it happen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Age Correction Info */}
      {showAgeCorrectionInfo && profileData && (
        <Alert className="border-blue-300 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Target Retirement Age Adjusted:</strong> Your target retirement age has been set to {profileData.targetRetirementAge}
            {' '}(must be at least {profileData.currentAge + 1} to be greater than your current age of {profileData.currentAge}).
            {' '}You can adjust this using the slider below, or{' '}
            <a href="/onboarding/wizard" className="underline font-semibold hover:text-blue-700">
              update your profile
            </a>.
          </AlertDescription>
        </Alert>
      )}

      {/* No Profile Data Warning */}
      {!profileData && !profileLoading && !error && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>Setup Required:</strong> Please complete your{' '}
            <a href="/profile" className="underline font-semibold hover:text-yellow-700">
              financial profile
            </a>
            {' '}to use the early retirement calculator.
          </AlertDescription>
        </Alert>
      )}

      {/* Disclaimer - Educational Purposes */}
      {profileData && !error && (
        <Alert className="border-blue-300 bg-blue-50">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong className="block mb-2">Important Disclaimer:</strong>
            <p className="text-sm mb-2">
              This calculator is for <strong>educational purposes only</strong> and provides estimates based on simplified assumptions.
              Actual retirement planning involves many complex factors including taxes, government benefits, healthcare costs, and market volatility.
            </p>
            <p className="text-sm">
              <strong>Please consult a qualified financial advisor</strong> before making any retirement or investment decisions.
              This tool does not constitute professional financial advice.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content - Only show if we have profile data */}
      {profileData && !error && (
        <>
          {/* Financial Profile Input Data */}
          <CalculationInputs
            currentAge={profileData.currentAge}
            targetRetirementAge={selectedAge}
            lifeExpectancy={profileData.lifeExpectancy}
            currentSavings={profileData.currentSavings}
            annualIncome={profileData.annualIncome}
            annualSavings={profileData.annualSavings}
            targetAnnualExpenses={profileData.targetAnnualExpenses}
            includePartner={profileData.includePartner}
            partner={profileData.partner}
            province={profileData.province}
          />

          {/* What-If Sliders for Interactive Scenario Planning */}
          <WhatIfSliders
            baselineScenario={{
              retirementAge: selectedAge,
              cppStartAge: profileData.cppStartAge || 65,
              oasStartAge: profileData.oasStartAge || 65,
              currentSavings: profileData.currentSavings,
              annualSavings: profileData.annualSavings,
            }}
            currentAge={profileData.currentAge}
            onScenarioChange={handleWhatIfScenarioChange}
            isCalculating={isLoading}
          />

          {/* Readiness Score - Hero Component */}
          {result && (
            <EarlyRetirementScore
              readinessScore={result.readinessScore}
              earliestRetirementAge={result.earliestRetirementAge}
              targetAgeFeasible={result.targetAgeFeasible}
              currentAge={profileData.currentAge}
              targetAge={selectedAge}
            />
          )}

          {/* Interactive Age Slider */}
          {result && (
            <RetirementAgeSlider
              currentAge={profileData.currentAge}
              selectedAge={selectedAge}
              earliestAge={result.earliestRetirementAge}
              onAgeChange={handleAgeChange}
              scenarios={result.ageScenarios}
              isLoading={isLoading}
            />
          )}

          {/* Savings Gap Analysis */}
          {result && (
            <SavingsGapAnalysis
              currentSavings={profileData.currentSavings}
              projectedSavings={result.projectedSavingsAtTarget}
              requiredSavings={result.requiredSavings}
              savingsGap={result.savingsGap}
              additionalMonthlySavings={result.additionalMonthlySavings}
              alternativeRetirementAge={result.alternativeRetirementAge}
              targetRetirementAge={selectedAge}
              yearsToRetirement={selectedAge - profileData.currentAge}
              recommendedContributions={result.recommendedContributions}
            />
          )}

          {/* Scenario Comparison */}
          {result && result.ageScenarios && result.ageScenarios.length > 0 && (
            <RetirementScenarios
              scenarios={result.ageScenarios}
              currentAge={profileData.currentAge}
              assumptions={result.assumptions.neutral}
            />
          )}

          {/* Action Plan */}
          {result && (
            <ActionPlan
              readinessScore={result.readinessScore}
              savingsGap={result.savingsGap}
              additionalMonthlySavings={result.additionalMonthlySavings}
              targetRetirementAge={selectedAge}
              currentAge={profileData.currentAge}
              targetAgeFeasible={result.targetAgeFeasible}
              alternativeRetirementAge={result.alternativeRetirementAge}
              recommendedContributions={result.recommendedContributions}
            />
          )}

          {/* Loading State for Calculations */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Calculating your early retirement plan...</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Assumptions and Limitations */}
      {result && profileData && (
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-600" />
            Calculation Assumptions
          </h3>

          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Investment Returns & Inflation:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li><strong>Pessimistic Scenario:</strong> 4% annual return, 3% inflation</li>
                <li><strong>Neutral Scenario (default):</strong> 5% annual return, 2.5% inflation</li>
                <li><strong>Optimistic Scenario:</strong> 7% annual return, 2% inflation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Withdrawal Strategy:</h4>
              <p className="text-gray-700 ml-2">
                Uses the <strong>4% safe withdrawal rule</strong> (25x annual expenses) with inflation adjustments based on retirement duration.
              </p>
            </div>

            {/* Government Benefits */}
            {result.governmentBenefits && result.governmentBenefits.totalAnnual > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  Government Benefits Included:
                </h4>
                <div className="text-sm text-gray-700 space-y-2 ml-2">
                  <p className="font-medium">Estimated Annual Benefits at Retirement:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>CPP (Canada Pension Plan): ${result.governmentBenefits.cppAnnual.toLocaleString()}/year</li>
                    <li>OAS (Old Age Security): ${result.governmentBenefits.oasAnnual.toLocaleString()}/year</li>
                    <li className="font-semibold">Total Government Benefits: ${result.governmentBenefits.totalAnnual.toLocaleString()}/year</li>
                  </ul>
                  <div className="mt-2 text-xs text-gray-600">
                    {result.governmentBenefits.notes.map((note: string, index: number) => (
                      <p key={index} className="mb-1">{note}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                CRA & Canadian Retirement Rules:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm ml-2">
                {result.craInfo?.notes.map((note: string, index: number) => (
                  <li key={index}>{note}</li>
                ))}
                <li className="mt-2">
                  <strong>Province:</strong> {profileData.province || 'Ontario'} - Provincial tax rates and credits apply.
                </li>
                {profileData.includePartner && (
                  <li>
                    <strong>Couples Planning:</strong> Pension income splitting available at age 65 to reduce household taxes.
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What's NOT Included:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                <li>Detailed tax planning and optimization strategies</li>
                <li>Healthcare costs and insurance premiums</li>
                <li>Pension income (employer pensions)</li>
                <li>Inheritance or windfalls</li>
                <li>Real estate equity or rental income</li>
                <li>Part-time work or business income in retirement</li>
                <li>Provincial tax variations and credits</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action - Link to Full Simulation */}
      {result && profileData && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Quick Estimate vs. Detailed Simulation
          </h3>
          <div className="space-y-3 mb-4">
            <div>
              <p className="font-medium text-gray-900 mb-1">This Early Retirement Calculator:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                <li>Quick estimate using simplified 4% withdrawal rule</li>
                <li>Includes estimated CPP/OAS benefits (simplified)</li>
                <li>Great for initial planning and feasibility check</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Full Simulation Tool Includes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-2">
                <li>Year-by-year Monte Carlo projections with market scenarios</li>
                <li>Detailed federal and provincial tax calculations</li>
                <li>Optimized withdrawal strategies (RRIF minimums, income splitting)</li>
                <li>CPP/OAS/GIS with actual CRA rules and clawbacks</li>
                <li>Estate planning and legacy analysis</li>
              </ul>
            </div>
          </div>
          <a
            href="/simulation"
            className="inline-flex items-center justify-center h-10 py-2 px-4 rounded-md font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
          >
            Run Full Simulation
          </a>
        </div>
      )}
    </div>
  );
}
