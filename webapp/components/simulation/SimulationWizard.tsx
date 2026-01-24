'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { PersonInput, HouseholdInput } from '@/lib/types/simulation';

interface SimulationWizardProps {
  household: HouseholdInput;
  onUpdate: (updates: Partial<HouseholdInput>) => void;
  onComplete: () => void;
  onCancel: () => void;
  includePartner: boolean;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const wizardSteps: WizardStep[] = [
  {
    id: 'profile',
    title: 'Verify Your Profile',
    description: 'Confirm your basic information',
    icon: '👤',
  },
  {
    id: 'assets',
    title: 'Review Asset Balances',
    description: 'Check your savings and investments',
    icon: '💰',
  },
  {
    id: 'benefits',
    title: 'Government Benefits',
    description: 'Set CPP and OAS start ages',
    icon: '🏛️',
  },
  {
    id: 'spending',
    title: 'Retirement Spending',
    description: 'Plan your retirement lifestyle',
    icon: '🏖️',
  },
  {
    id: 'review',
    title: 'Review & Run',
    description: 'Final check before simulation',
    icon: '✅',
  },
];

export function SimulationWizard({
  household,
  onUpdate,
  onComplete,
  onCancel,
  includePartner,
}: SimulationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / wizardSteps.length) * 100;

  const currentStepData = wizardSteps[currentStep];
  const isLastStep = currentStep === wizardSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow jumping to any previous step or the next step
    if (stepIndex <= currentStep + 1) {
      setCurrentStep(stepIndex);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with progress */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Guided Simulation</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white text-sm underline"
          >
            Switch to Express Mode
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>
              Step {currentStep + 1} of {wizardSteps.length}
            </span>
            <span>~{Math.ceil((wizardSteps.length - currentStep) * 0.5)} min left</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between gap-2">
          {wizardSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              disabled={index > currentStep + 1}
              className={`flex flex-col items-center gap-1 flex-1 transition-opacity ${
                index > currentStep + 1 ? 'opacity-40 cursor-not-allowed' : 'opacity-100 hover:opacity-80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold transition-colors ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-white text-indigo-600'
                    : 'bg-white/20 text-white'
                }`}
              >
                {index < currentStep ? <Check className="w-5 h-5" /> : step.icon}
              </div>
              <span className="text-xs font-medium hidden sm:block">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="px-6 py-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStepData.icon} {currentStepData.title}
          </h3>
          <p className="text-gray-600">{currentStepData.description}</p>
        </div>

        {/* Step 1: Profile */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={household.p1.name}
                  onChange={(e) =>
                    onUpdate({ p1: { ...household.p1, name: e.target.value } })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Age
                </label>
                <input
                  type="number"
                  value={household.p1.start_age || 0}
                  onChange={(e) =>
                    onUpdate({
                      p1: { ...household.p1, start_age: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., 55"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province
                </label>
                <select
                  value={household.province}
                  onChange={(e) => onUpdate({ province: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                >
                  <option value="ON">Ontario</option>
                  <option value="BC">British Columbia</option>
                  <option value="AB">Alberta</option>
                  <option value="QC">Quebec</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Until Age
                </label>
                <input
                  type="number"
                  value={household.end_age || 95}
                  onChange={(e) =>
                    onUpdate({ end_age: parseInt(e.target.value) || 95 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., 95"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>✓ Data loaded from your profile.</strong> These values are pre-filled
                from your account. You can adjust them if needed.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Assets */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TFSA Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={household.p1.tfsa_balance || 0}
                    onChange={(e) =>
                      onUpdate({
                        p1: {
                          ...household.p1,
                          tfsa_balance: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Tax-free growth and withdrawals</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RRSP Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={household.p1.rrsp_balance || 0}
                    onChange={(e) =>
                      onUpdate({
                        p1: {
                          ...household.p1,
                          rrsp_balance: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Converts to RRIF at 71, fully taxable
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RRIF Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={household.p1.rrif_balance || 0}
                    onChange={(e) =>
                      onUpdate({
                        p1: {
                          ...household.p1,
                          rrif_balance: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum withdrawals required, fully taxable
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Non-Registered Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={household.p1.nonreg_balance || 0}
                    onChange={(e) =>
                      onUpdate({
                        p1: {
                          ...household.p1,
                          nonreg_balance: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only capital gains taxable at 50%
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Total Assets:</strong> $
                {(
                  (household.p1.tfsa_balance || 0) +
                  (household.p1.rrsp_balance || 0) +
                  (household.p1.rrif_balance || 0) +
                  (household.p1.nonreg_balance || 0)
                ).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Government Benefits */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Pro Tip:</strong> Delaying CPP and OAS beyond 65 increases your
                monthly benefits. Use our{' '}
                <a href="/benefits" className="underline font-semibold">
                  CPP/OAS Calculator
                </a>{' '}
                to estimate your amounts.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg">Canada Pension Plan (CPP)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPP Start Age
                  </label>
                  <input
                    type="number"
                    value={household.p1.cpp_start_age || 65}
                    onChange={(e) =>
                      onUpdate({
                        p1: {
                          ...household.p1,
                          cpp_start_age: parseInt(e.target.value) || 65,
                        },
                      })
                    }
                    min="60"
                    max="70"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Age 60-70 (65 is standard)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual CPP Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={household.p1.cpp_annual_at_start || 0}
                      onChange={(e) =>
                        onUpdate({
                          p1: {
                            ...household.p1,
                            cpp_annual_at_start: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="15000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max ~$17,500 (2025), Average $10-12K
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-lg">Old Age Security (OAS)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OAS Start Age
                  </label>
                  <input
                    type="number"
                    value={household.p1.oas_start_age || 65}
                    onChange={(e) =>
                      onUpdate({
                        p1: {
                          ...household.p1,
                          oas_start_age: parseInt(e.target.value) || 65,
                        },
                      })
                    }
                    min="65"
                    max="70"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Age 65-70 (65 is standard)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual OAS Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={household.p1.oas_annual_at_start || 0}
                      onChange={(e) =>
                        onUpdate({
                          p1: {
                            ...household.p1,
                            oas_annual_at_start: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="8500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max ~$8,900 (2025), subject to clawback
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Spending */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>💡 Three-Phase Spending:</strong> Research shows retirement spending
                follows a pattern: active "go-go" years (65-75), moderate "slow-go" years
                (75-85), and quieter "no-go" years (85+).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Go-Go Years Spending (Annual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={household.spending_go_go || 0}
                    onChange={(e) =>
                      onUpdate({ spending_go_go: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="60000"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Active years with travel and hobbies (typically 65-75)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Go-Go Phase Ends At Age
                </label>
                <input
                  type="number"
                  value={household.go_go_end_age || 75}
                  onChange={(e) =>
                    onUpdate({ go_go_end_age: parseInt(e.target.value) || 75 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="75"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slow-Go Years Spending (Annual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={household.spending_slow_go || 0}
                    onChange={(e) =>
                      onUpdate({ spending_slow_go: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="48000"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Typically 20-30% less than go-go phase (75-85)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slow-Go Phase Ends At Age
                </label>
                <input
                  type="number"
                  value={household.slow_go_end_age || 85}
                  onChange={(e) =>
                    onUpdate({ slow_go_end_age: parseInt(e.target.value) || 85 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                  placeholder="85"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No-Go Years Spending (Annual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={household.spending_no_go || 0}
                    onChange={(e) =>
                      onUpdate({ spending_no_go: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="40000"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Later years, often 40-50% less (85+)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Inflation Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={household.spending_inflation || 2.0}
                    onChange={(e) =>
                      onUpdate({ spending_inflation: parseFloat(e.target.value) || 2.0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-8"
                    placeholder="2.0"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Bank of Canada target is 2%</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Ready to Run!</h3>
                  <p className="text-sm text-gray-600">
                    Your simulation is configured and ready
                  </p>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">👤 Your Profile</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Name:</span> {household.p1.name}
                  </p>
                  <p>
                    <span className="text-gray-600">Age:</span> {household.p1.start_age || 0} -{' '}
                    {household.end_age || 95}
                  </p>
                  <p>
                    <span className="text-gray-600">Province:</span> {household.province}
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">💰 Total Assets</h4>
                <p className="text-2xl font-bold text-green-600">
                  $
                  {(
                    (household.p1.tfsa_balance || 0) +
                    (household.p1.rrsp_balance || 0) +
                    (household.p1.rrif_balance || 0) +
                    (household.p1.nonreg_balance || 0)
                  ).toLocaleString()}
                </p>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>TFSA: ${(household.p1.tfsa_balance || 0).toLocaleString()}</p>
                  <p>RRSP: ${(household.p1.rrsp_balance || 0).toLocaleString()}</p>
                  <p>RRIF: ${(household.p1.rrif_balance || 0).toLocaleString()}</p>
                  <p>Non-Reg: ${(household.p1.nonreg_balance || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">🏛️ Government Benefits</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">CPP:</span> $
                    {(household.p1.cpp_annual_at_start || 0).toLocaleString()}/year at age{' '}
                    {household.p1.cpp_start_age || 65}
                  </p>
                  <p>
                    <span className="text-gray-600">OAS:</span> $
                    {(household.p1.oas_annual_at_start || 0).toLocaleString()}/year at age{' '}
                    {household.p1.oas_start_age || 65}
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">🏖️ Retirement Spending</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Go-Go:</span> $
                    {(household.spending_go_go || 0).toLocaleString()}/year
                  </p>
                  <p>
                    <span className="text-gray-600">Slow-Go:</span> $
                    {(household.spending_slow_go || 0).toLocaleString()}/year
                  </p>
                  <p>
                    <span className="text-gray-600">No-Go:</span> $
                    {(household.spending_no_go || 0).toLocaleString()}/year
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-800">
                <strong>🚀 Next Step:</strong> Click "Run Simulation" below to see your
                personalized retirement projection with tax optimization and year-by-year
                breakdown.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with navigation */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="text-sm text-gray-600">
          {currentStep + 1} of {wizardSteps.length}
        </div>

        <Button
          onClick={handleNext}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isLastStep ? (
            <>
              Run Simulation
              <Sparkles className="w-4 h-4" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
