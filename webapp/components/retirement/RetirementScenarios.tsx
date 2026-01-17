import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Award } from 'lucide-react';

interface RetirementScenario {
  retirementAge: number;
  totalNeeded: number;
  successRate: number;
  monthlySavingsRequired: number;
  projectedSavings: number;
  shortfall: number;
}

interface RetirementScenariosProps {
  scenarios: RetirementScenario[];
  currentAge: number;
  assumptions: {
    returnRate: number;
    inflationRate: number;
  };
}

export function RetirementScenarios({
  scenarios,
  currentAge,
  assumptions,
}: RetirementScenariosProps) {
  // Find recommended scenario (highest success rate with earliest age)
  const recommendedScenario = scenarios.reduce((best, current) =>
    current.successRate >= 90 && current.retirementAge < best.retirementAge
      ? current
      : best
  , scenarios[0]);

  const getScenarioStatus = (scenario: RetirementScenario) => {
    if (scenario.successRate >= 90) {
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        label: 'Recommended',
        badgeColor: 'bg-green-600',
      };
    } else if (scenario.successRate >= 75) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        label: 'Moderate Risk',
        badgeColor: 'bg-yellow-600',
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        label: 'High Risk',
        badgeColor: 'bg-red-600',
      };
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Compare Retirement Scenarios
      </h2>
      <p className="text-gray-600 mb-6">
        See how different retirement ages impact your savings needs and success probability
      </p>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {scenarios.map((scenario) => {
          const status = getScenarioStatus(scenario);
          const StatusIcon = status.icon;
          const yearsUntil = scenario.retirementAge - currentAge;
          const isRecommended = scenario.retirementAge === recommendedScenario.retirementAge;

          return (
            <div
              key={scenario.retirementAge}
              className={`relative border-2 ${status.borderColor} ${status.bgColor} rounded-lg p-5 transition-all hover:shadow-lg`}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-3 -right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                  <Award className="h-3 w-3" />
                  Best Option
                </div>
              )}

              {/* Age Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Age {scenario.retirementAge}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {yearsUntil > 0 ? `In ${yearsUntil} years` : 'Ready now'}
                  </p>
                </div>
                <StatusIcon className={`h-8 w-8 ${status.color}`} />
              </div>

              {/* Status Badge */}
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${status.badgeColor} mb-4`}>
                {status.label}
              </div>

              {/* Key Metrics */}
              <div className="space-y-3">
                {/* Success Rate */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Success Probability</span>
                    <span className={`font-bold ${status.color}`}>
                      {scenario.successRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        scenario.successRate >= 90 ? 'bg-green-500' :
                        scenario.successRate >= 75 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${scenario.successRate}%` }}
                    />
                  </div>
                </div>

                {/* Total Needed */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Needed</span>
                  <span className="font-semibold text-gray-900">
                    ${(scenario.totalNeeded / 1000).toFixed(0)}K
                  </span>
                </div>

                {/* You'll Have */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">You'll Have</span>
                  <span className={`font-semibold ${
                    scenario.shortfall === 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    ${(scenario.projectedSavings / 1000).toFixed(0)}K
                  </span>
                </div>

                {/* Monthly Savings Required */}
                {scenario.monthlySavingsRequired > 0 && (
                  <div className="pt-3 border-t border-gray-300">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Extra Savings/Month</span>
                      <span className="font-bold text-red-600">
                        +${Math.round(scenario.monthlySavingsRequired)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Surplus */}
                {scenario.shortfall < 0 && (
                  <div className="pt-3 border-t border-gray-300">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Surplus</span>
                      <span className="font-bold text-green-600">
                        +${Math.abs(scenario.shortfall / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scenario Description */}
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-xs text-gray-600 leading-relaxed">
                  {scenario.shortfall === 0 ? (
                    <>
                      You're on track to retire comfortably at age {scenario.retirementAge}
                      with your current savings plan.
                    </>
                  ) : scenario.shortfall > 0 ? (
                    <>
                      Requires ${Math.round(scenario.monthlySavingsRequired)}/month more
                      in savings to reach this retirement age.
                    </>
                  ) : (
                    <>
                      You'll have extra savings, providing a comfortable buffer
                      for unexpected expenses.
                    </>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assumptions Footer */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Calculation Assumptions
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Return Rate:</span>
                <span className="ml-1">{(assumptions.returnRate * 100).toFixed(1)}%/year</span>
              </div>
              <div>
                <span className="font-medium">Inflation:</span>
                <span className="ml-1">{(assumptions.inflationRate * 100).toFixed(1)}%/year</span>
              </div>
              <div>
                <span className="font-medium">Withdrawal:</span>
                <span className="ml-1">4% rule (25x)</span>
              </div>
              <div>
                <span className="font-medium">Method:</span>
                <span className="ml-1">Conservative</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 italic">
              These scenarios use conservative assumptions. Actual results may vary based on
              market performance, spending changes, and other factors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
