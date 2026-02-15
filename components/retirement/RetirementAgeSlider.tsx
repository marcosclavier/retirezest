import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface RetirementScenario {
  retirementAge: number;
  totalNeeded: number;
  successRate: number;
  monthlySavingsRequired: number;
  projectedSavings: number;
  shortfall: number;
}

interface RetirementAgeSliderProps {
  currentAge: number;
  selectedAge: number;
  earliestAge: number;
  onAgeChange: (age: number) => void;
  scenarios: RetirementScenario[];
  isLoading?: boolean;
}

export function RetirementAgeSlider({
  currentAge,
  selectedAge,
  earliestAge,
  onAgeChange,
  scenarios,
  isLoading = false,
}: RetirementAgeSliderProps) {
  const [localAge, setLocalAge] = useState(selectedAge);
  const minAge = Math.max(currentAge + 1, 55);
  const maxAge = 75;

  useEffect(() => {
    setLocalAge(selectedAge);
  }, [selectedAge]);

  // Find scenario for selected age (or closest match)
  const selectedScenario = scenarios && scenarios.length > 0
    ? (scenarios.find(s => s.retirementAge === localAge) ||
        scenarios.reduce((prev, curr) =>
          Math.abs(curr.retirementAge - localAge) < Math.abs(prev.retirementAge - localAge)
            ? curr
            : prev
        , scenarios[0]))
    : null;

  // Check feasibility: shortfall is always >= 0 due to Math.max, so we need to check if it's 0 OR if projectedSavings >= totalNeeded
  const isFeasible = selectedScenario && (selectedScenario.shortfall === 0 || selectedScenario.projectedSavings >= selectedScenario.totalNeeded);
  const isRisky = selectedScenario && selectedScenario.successRate < 80 && selectedScenario.successRate >= 60;
  const isUnlikely = selectedScenario && selectedScenario.successRate < 60;

  const getStatusInfo = () => {
    if (localAge < earliestAge) {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Not Feasible',
        message: `Too early - earliest possible age is ${earliestAge}`,
      };
    } else if (isFeasible) {
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'On Track',
        message: 'You can retire at this age with your current savings',
      };
    } else if (isRisky) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'Risky',
        message: 'Possible but requires additional savings or has lower success rate',
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Challenging',
        message: 'Requires significant additional savings',
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = parseInt(e.target.value);
    setLocalAge(newAge);
  };

  const handleSliderRelease = () => {
    if (localAge !== selectedAge) {
      onAgeChange(localAge);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        When Can You Retire?
      </h2>

      {/* Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Age {minAge}</span>
          <span className="text-3xl font-bold text-blue-600">Age {localAge}</span>
          <span className="text-sm text-gray-600">Age {maxAge}</span>
        </div>

        <input
          type="range"
          min={minAge}
          max={maxAge}
          value={localAge}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          disabled={isLoading}
          style={{
            background: `linear-gradient(to right,
              ${localAge < earliestAge ? '#ef4444' : '#3b82f6'} 0%,
              ${localAge < earliestAge ? '#ef4444' : '#3b82f6'} ${((localAge - minAge) / (maxAge - minAge)) * 100}%,
              #e5e7eb ${((localAge - minAge) / (maxAge - minAge)) * 100}%,
              #e5e7eb 100%)`
          }}
        />

        {/* Age Markers */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Early</span>
          <span className="text-blue-600 font-semibold">Earliest: {earliestAge}</span>
          <span>Traditional (65)</span>
        </div>
      </div>

      {/* Status Card */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Calculating...</span>
        </div>
      ) : selectedScenario ? (
        <div className={`border-2 ${statusInfo.borderColor} ${statusInfo.bgColor} rounded-lg p-4`}>
          <div className="flex items-start gap-3 mb-4">
            <StatusIcon className={`h-6 w-6 ${statusInfo.color} flex-shrink-0 mt-0.5`} />
            <div>
              <h3 className={`text-lg font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </h3>
              <p className="text-sm text-gray-700">{statusInfo.message}</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Needed</p>
              <p className="text-lg font-bold text-gray-900">
                ${(selectedScenario.totalNeeded / 1000).toFixed(0)}K
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">You'll Have</p>
              <p className="text-lg font-bold text-gray-900">
                ${(selectedScenario.projectedSavings / 1000).toFixed(0)}K
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Monthly Gap</p>
              <p className={`text-lg font-bold ${selectedScenario.monthlySavingsRequired > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {selectedScenario.monthlySavingsRequired > 0
                  ? `$${Math.round(selectedScenario.monthlySavingsRequired)}`
                  : 'None'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Success Rate</p>
              <p className={`text-lg font-bold ${
                selectedScenario.successRate >= 80 ? 'text-green-600' :
                selectedScenario.successRate >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {selectedScenario.successRate}%
              </p>
            </div>
          </div>

          {/* Shortfall Warning */}
          {selectedScenario.shortfall > 0 && (
            <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>Shortfall: ${(selectedScenario.shortfall / 1000).toFixed(0)}K</strong>
                {' '}— You need to save an additional{' '}
                <strong>${Math.round(selectedScenario.monthlySavingsRequired)}/month</strong>
                {' '}to retire at age {localAge}.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          <p>Select an age to see retirement feasibility</p>
        </div>
      )}
    </div>
  );
}
