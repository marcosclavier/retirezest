import { CheckCircle2, AlertCircle, XCircle, TrendingUp } from 'lucide-react';

interface EarlyRetirementScoreProps {
  readinessScore: number;
  earliestRetirementAge: number;
  targetAgeFeasible: boolean;
  currentAge: number;
  targetAge: number;
}

export function EarlyRetirementScore({
  readinessScore,
  earliestRetirementAge,
  targetAgeFeasible,
  currentAge,
  targetAge,
}: EarlyRetirementScoreProps) {
  // Determine score category and styling
  const getScoreInfo = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Excellent',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        progressColor: 'bg-green-500',
        icon: CheckCircle2,
      };
    } else if (score >= 60) {
      return {
        label: 'Good',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        progressColor: 'bg-blue-500',
        icon: TrendingUp,
      };
    } else if (score >= 40) {
      return {
        label: 'Fair',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        progressColor: 'bg-yellow-500',
        icon: AlertCircle,
      };
    } else {
      return {
        label: 'Needs Work',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        progressColor: 'bg-red-500',
        icon: XCircle,
      };
    }
  };

  const scoreInfo = getScoreInfo(readinessScore);
  const Icon = scoreInfo.icon;
  const yearsToTarget = targetAge - currentAge;
  const yearsToEarliest = earliestRetirementAge - currentAge;

  return (
    <div className={`border-2 ${scoreInfo.borderColor} ${scoreInfo.bgColor} rounded-lg p-6 shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${scoreInfo.bgColor} border ${scoreInfo.borderColor}`}>
          <Icon className={`h-8 w-8 ${scoreInfo.color}`} />
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Early Retirement Readiness
          </h2>

          {/* Score Display */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-900">{readinessScore}</span>
              <span className="text-2xl text-gray-500">/100</span>
              <span className={`ml-3 text-lg font-semibold ${scoreInfo.color}`}>
                {scoreInfo.label}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${scoreInfo.progressColor} transition-all duration-500 ease-out`}
                style={{ width: `${readinessScore}%` }}
              />
            </div>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Target Age Feasibility */}
            <div className="flex items-start gap-2">
              {targetAgeFeasible ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold text-gray-700">Target Age {targetAge}</p>
                <p className="text-xs text-gray-600">
                  {targetAgeFeasible
                    ? `On track in ${yearsToTarget} years`
                    : `Not feasible with current plan`}
                </p>
              </div>
            </div>

            {/* Earliest Retirement Age */}
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Earliest Age {earliestRetirementAge}
                </p>
                <p className="text-xs text-gray-600">
                  {yearsToEarliest > 0
                    ? `Possible in ${yearsToEarliest} years`
                    : `Ready now!`}
                </p>
              </div>
            </div>

            {/* Years to Freedom */}
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Years Until Freedom</p>
                <p className="text-xs text-gray-600">
                  {yearsToEarliest > 0
                    ? `${yearsToEarliest} years of smart saving`
                    : `You're ready to retire!`}
                </p>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="mt-4 p-4 bg-white rounded-md border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {readinessScore >= 80 && (
                <>
                  <strong>Excellent news!</strong> Your retirement savings are on track.
                  You have a strong foundation and are well-positioned for early retirement.
                </>
              )}
              {readinessScore >= 60 && readinessScore < 80 && (
                <>
                  <strong>You're on the right path!</strong> With some adjustments to your savings
                  strategy, you can achieve your early retirement goals.
                </>
              )}
              {readinessScore >= 40 && readinessScore < 60 && (
                <>
                  <strong>There's work to be done.</strong> Your current savings trajectory needs
                  improvement. Consider increasing your savings rate or adjusting your retirement age.
                </>
              )}
              {readinessScore < 40 && (
                <>
                  <strong>Significant changes needed.</strong> Your current plan is unlikely to
                  support early retirement. Major adjustments to savings or retirement age are necessary.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
