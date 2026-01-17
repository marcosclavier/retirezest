import { TrendingUp, DollarSign, Calendar, AlertCircle } from 'lucide-react';

interface SavingsGapAnalysisProps {
  currentSavings: {
    rrsp: number;
    tfsa: number;
    nonRegistered: number;
  };
  projectedSavings: number;
  requiredSavings: number;
  savingsGap: number;
  additionalMonthlySavings: number;
  alternativeRetirementAge: number | null;
  targetRetirementAge: number;
  yearsToRetirement: number;
}

export function SavingsGapAnalysis({
  currentSavings,
  projectedSavings,
  requiredSavings,
  savingsGap,
  additionalMonthlySavings,
  alternativeRetirementAge,
  targetRetirementAge,
  yearsToRetirement,
}: SavingsGapAnalysisProps) {
  const totalCurrentSavings = currentSavings.rrsp + currentSavings.tfsa + currentSavings.nonRegistered;
  const projectedGrowth = projectedSavings - totalCurrentSavings;
  const hasGap = savingsGap > 0;

  // Calculate growth rate
  const growthRate = totalCurrentSavings > 0
    ? ((projectedSavings - totalCurrentSavings) / totalCurrentSavings) * 100
    : 0;

  return (
    <div className="border rounded-lg p-6 bg-white shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Savings Gap Analysis
      </h2>

      <div className="space-y-6">
        {/* Current State */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Your Current Position
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Current Savings</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(totalCurrentSavings / 1000).toFixed(0)}K
              </p>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>RRSP:</span>
                  <span>${(currentSavings.rrsp / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between">
                  <span>TFSA:</span>
                  <span>${(currentSavings.tfsa / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between">
                  <span>Other:</span>
                  <span>${(currentSavings.nonRegistered / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Projected Growth</p>
              <p className="text-2xl font-bold text-blue-600">
                +${(projectedGrowth / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-600 mt-2">
                {growthRate.toFixed(0)}% increase over {yearsToRetirement} years
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Total at {targetRetirementAge}</p>
              <p className="text-2xl font-bold text-green-600">
                ${(projectedSavings / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-600 mt-2">
                With current savings trajectory
              </p>
            </div>
          </div>
        </div>

        {/* Gap Analysis */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            What You Need
          </h3>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Required Amount */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Amount Needed at {targetRetirementAge}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  ${(requiredSavings / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-600">
                  Based on 25x annual expenses rule
                </p>
              </div>

              {/* Savings Gap */}
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  {hasGap ? 'Savings Shortfall' : 'Surplus'}
                </p>
                <p className={`text-3xl font-bold mb-1 ${hasGap ? 'text-red-600' : 'text-green-600'}`}>
                  {hasGap ? '-' : '+'}${Math.abs(savingsGap / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-600">
                  {hasGap
                    ? 'Additional savings needed'
                    : 'You\'re ahead of your goal!'}
                </p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-700 mb-2">
                <span>Progress</span>
                <span>{((projectedSavings / requiredSavings) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    hasGap ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-green-400 to-green-600'
                  }`}
                  style={{ width: `${Math.min((projectedSavings / requiredSavings) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Required */}
        {hasGap && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              How to Close the Gap
            </h3>

            <div className="space-y-4">
              {/* Option 1: Increase Savings */}
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 rounded-full p-2">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Option 1: Save More Each Month
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      Increase your monthly savings by{' '}
                      <strong className="text-red-600">
                        ${Math.round(additionalMonthlySavings)}/month
                      </strong>
                      {' '}to retire at age {targetRetirementAge}.
                    </p>
                    <p className="text-xs text-gray-600">
                      That's ${(additionalMonthlySavings * 12).toLocaleString()}/year additional savings
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Delay Retirement */}
              {alternativeRetirementAge && alternativeRetirementAge > targetRetirementAge && (
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        Option 2: Adjust Retirement Age
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        Retire at age{' '}
                        <strong className="text-blue-600">{alternativeRetirementAge}</strong>
                        {' '}instead ({alternativeRetirementAge - targetRetirementAge} years later)
                        with your current savings rate.
                      </p>
                      <p className="text-xs text-gray-600">
                        Extra years allow more time for savings to grow
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 3: Combination */}
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 rounded-full p-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Option 3: Combination Approach
                    </p>
                    <p className="text-sm text-gray-700">
                      Save a bit more each month AND delay retirement by 1-2 years
                      for the most comfortable retirement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {!hasGap && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Congratulations! You're On Track
                </h3>
                <p className="text-sm text-gray-700">
                  Your current savings trajectory will provide ${(projectedSavings / 1000).toFixed(0)}K
                  at age {targetRetirementAge}, which exceeds your target of ${(requiredSavings / 1000).toFixed(0)}K.
                  Keep up the great work!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
