'use client';

import { CheckCircleIcon, CircleStackIcon } from '@heroicons/react/24/solid';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { OnboardingStep } from '@/hooks/useOnboardingProgress';

interface OnboardingProgressSidebarProps {
  steps: OnboardingStep[];
  currentStep: number;
  formData: any;
  onNavigate?: (stepIndex: number) => void;
  className?: string;
}

export function OnboardingProgressSidebar({
  steps,
  currentStep,
  formData,
  onNavigate,
  className = ''
}: OnboardingProgressSidebarProps) {
  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className={`bg-white border-l border-gray-200 ${className}`}>
      <div className="sticky top-4 p-6 space-y-6">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900">Your Progress</h3>
          <p className="text-sm text-gray-500 mt-1">
            {completedCount} of {totalSteps} steps completed
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Steps list */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = step.completed;
            const isCurrent = index === currentStep;
            const isClickable = onNavigate && (isCompleted || index < currentStep);

            return (
              <div key={step.id}>
                <button
                  onClick={() => isClickable && onNavigate(index)}
                  disabled={!isClickable}
                  className={`w-full text-left group ${
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-blue-50 border-2 border-blue-600'
                        : isCompleted
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'bg-gray-50'
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : isCurrent ? (
                        <CircleStackIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm font-medium ${
                            isCurrent
                              ? 'text-blue-900'
                              : isCompleted
                              ? 'text-green-900'
                              : 'text-gray-500'
                          }`}
                        >
                          {step.name}
                        </p>
                        {isClickable && (
                          <ChevronRightIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>

                      {/* Summary for completed steps */}
                      {isCompleted && step.summary && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {step.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary section */}
        {completedCount > 0 && (
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Quick Summary</h4>

            {formData.personalInfo?.firstName && (
              <div className="text-sm">
                <span className="text-gray-600">Name: </span>
                <span className="font-medium text-gray-900">
                  {formData.personalInfo.firstName} {formData.personalInfo.lastName}
                </span>
              </div>
            )}

            {formData.personalInfo?.dateOfBirth && (
              <div className="text-sm">
                <span className="text-gray-600">Age: </span>
                <span className="font-medium text-gray-900">
                  {calculateAge(formData.personalInfo.dateOfBirth)}
                </span>
              </div>
            )}

            {formData.assets && (
              <div className="text-sm">
                <span className="text-gray-600">Accounts: </span>
                <span className="font-medium text-gray-900">
                  {Object.values(formData.assets).filter(Boolean).length} added
                </span>
              </div>
            )}

            {formData.income && (
              <div className="text-sm">
                <span className="text-gray-600">Income sources: </span>
                <span className="font-medium text-gray-900">
                  {Object.values(formData.income).filter(Boolean).length} added
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
