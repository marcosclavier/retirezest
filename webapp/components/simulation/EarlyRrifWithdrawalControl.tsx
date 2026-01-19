'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface EarlyRrifWithdrawalControlProps {
  enabled: boolean;
  startAge: number;
  endAge: number;
  annualAmount: number;
  percentage: number;
  mode: 'fixed' | 'percentage';
  personName: string;
  currentAge: number;
  onUpdate: (settings: {
    enabled: boolean;
    startAge: number;
    endAge: number;
    annualAmount: number;
    percentage: number;
    mode: 'fixed' | 'percentage';
  }) => void;
}

export default function EarlyRrifWithdrawalControl({
  enabled,
  startAge,
  endAge,
  annualAmount,
  percentage,
  mode,
  personName,
  currentAge,
  onUpdate,
}: EarlyRrifWithdrawalControlProps) {
  const [showAdvanced, setShowAdvanced] = useState(enabled);

  const handleToggle = (newEnabled: boolean) => {
    setShowAdvanced(newEnabled);
    onUpdate({
      enabled: newEnabled,
      startAge,
      endAge,
      annualAmount,
      percentage,
      mode,
    });
  };

  const handleUpdate = (field: string, value: any) => {
    onUpdate({
      enabled,
      startAge,
      endAge,
      annualAmount,
      percentage,
      mode,
      [field]: value,
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-900">
            Early RRIF/RRSP Withdrawals {personName && `(${personName})`}
          </h4>
          <div className="group relative">
            <Info className="h-4 w-4 text-gray-400 cursor-help" />
            <div className="invisible group-hover:visible absolute left-0 top-6 z-10 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
              Configure custom RRSP/RRIF withdrawals before age 71 (when minimum withdrawals become mandatory).
              This is useful for filling lower tax brackets, income splitting, or avoiding future OAS clawback.
            </div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {showAdvanced && (
        <div className="space-y-4 mt-4">
          {/* Withdrawal Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Method
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fixed"
                  checked={mode === 'fixed'}
                  onChange={() => handleUpdate('mode', 'fixed')}
                  className="mr-2"
                />
                <span className="text-sm">Fixed Amount</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="percentage"
                  checked={mode === 'percentage'}
                  onChange={() => handleUpdate('mode', 'percentage')}
                  className="mr-2"
                />
                <span className="text-sm">Percentage of Balance</span>
              </label>
            </div>
          </div>

          {/* Age Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Age
              </label>
              <input
                type="number"
                min={currentAge}
                max={70}
                value={startAge}
                onChange={(e) => handleUpdate('startAge', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Age
              </label>
              <input
                type="number"
                min={startAge}
                max={70}
                value={endAge}
                onChange={(e) => handleUpdate('endAge', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be before age 71 (mandatory minimum)
              </p>
            </div>
          </div>

          {/* Amount/Percentage */}
          {mode === 'fixed' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Withdrawal Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={annualAmount}
                  onChange={(e) => handleUpdate('annualAmount', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Fixed amount withdrawn each year between start and end age
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={percentage}
                  onChange={(e) => handleUpdate('percentage', parseFloat(e.target.value))}
                  className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Percentage of RRIF balance withdrawn each year
              </p>
            </div>
          )}

          {/* Strategy Hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-800">
              <strong>Strategy Tip:</strong> Consider withdrawing from the lower-income spouse's
              RRSP to utilize their lower tax brackets, especially before CPP/OAS starts. This can
              significantly reduce household tax and avoid OAS clawback.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
