'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface ReviewStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
}

export default function ReviewStep({
  formData,
  onComplete,
}: ReviewStepProps) {
  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">You're All Set!</h2>
        <p className="text-gray-600">
          Great job completing the setup. Here's what you can do next.
        </p>
      </div>

      {/* Setup Summary */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-indigo-900 mb-4">Setup Complete - Your Information Summary</h3>

        {/* Personal & Partner Information */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Personal Information</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Province</p>
              <p className="font-medium text-gray-900">{formData.province || 'Not set'}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Marital Status</p>
              <p className="font-medium text-gray-900 capitalize">{formData.maritalStatus || 'Not set'}</p>
            </div>
            {formData.includePartner && (
              <>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Partner</p>
                  <p className="font-medium text-gray-900">
                    {formData.partnerFirstName ? `${formData.partnerFirstName} ${formData.partnerLastName || ''}` : 'Not set'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Partner DOB</p>
                  <p className="font-medium text-gray-900">{formData.partnerDateOfBirth || 'Not set'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Retirement Goals */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Retirement Goals</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Target Retirement Age</p>
              <p className="font-medium text-gray-900">{formData.targetRetirementAge || '65'}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Planning To Age</p>
              <p className="font-medium text-gray-900">{formData.lifeExpectancy || '95'}</p>
            </div>
          </div>
        </div>

        {/* Financial Data Status */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Financial Information</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Assets</p>
              <div className="flex items-center">
                <CheckCircleIcon className={`h-4 w-4 mr-1 ${formData.assetsSkipped ? 'text-yellow-500' : 'text-green-600'}`} />
                <span className="text-sm font-medium text-gray-900">
                  {formData.assetsSkipped ? 'Skipped - Add later' : `Added (${formData.assetCount || 0})`}
                </span>
              </div>
            </div>
            {formData.includePartner && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Partner Assets</p>
                <div className="flex items-center">
                  <CheckCircleIcon className={`h-4 w-4 mr-1 ${formData.partnerAssetsSkipped ? 'text-yellow-500' : 'text-green-600'}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {formData.partnerAssetsSkipped ? 'Skipped' : `Added (${formData.partnerAssetCount || 0})`}
                  </span>
                </div>
              </div>
            )}
            {formData.includePartner && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Joint Assets</p>
                <div className="flex items-center">
                  <CheckCircleIcon className={`h-4 w-4 mr-1 ${formData.jointAssetsSkipped ? 'text-yellow-500' : 'text-green-600'}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {formData.jointAssetsSkipped ? 'Skipped' : `Added (${formData.jointAssetCount || 0})`}
                  </span>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Income Sources</p>
              <div className="flex items-center">
                <CheckCircleIcon className={`h-4 w-4 mr-1 ${formData.incomeSkipped ? 'text-yellow-500' : 'text-green-600'}`} />
                <span className="text-sm font-medium text-gray-900">
                  {formData.incomeSkipped ? 'Skipped - Add later' : `Added (${formData.incomeCount || 0})`}
                </span>
              </div>
            </div>
            {formData.includePartner && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Partner Income</p>
                <div className="flex items-center">
                  <CheckCircleIcon className={`h-4 w-4 mr-1 ${formData.partnerIncomeSkipped ? 'text-yellow-500' : 'text-green-600'}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {formData.partnerIncomeSkipped ? 'Skipped' : `Added (${formData.partnerIncomeCount || 0})`}
                  </span>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Monthly Expenses</p>
              <div className="flex items-center">
                <CheckCircleIcon className={`h-4 w-4 mr-1 ${formData.expensesSkipped ? 'text-yellow-500' : 'text-green-600'}`} />
                <span className="text-sm font-medium text-gray-900">
                  {formData.expensesSkipped ? 'Skipped - Add later' : formData.monthlyExpenses ? `$${parseFloat(formData.monthlyExpenses).toLocaleString()}` : 'Added'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if important data was skipped */}
        {(formData.assetsSkipped || formData.incomeSkipped || formData.expensesSkipped) && (
          <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> You skipped some financial information. For the most accurate retirement projections,
              please add this data from your Financial Profile before running simulations.
            </p>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="space-y-4 mb-8">
        <h3 className="font-semibold text-gray-900 text-lg mb-2">What to Do Next:</h3>
        <p className="text-sm text-gray-600 mb-4">
          Follow these steps to get the most out of RetireZest and create your optimal retirement plan.
        </p>

        {/* Step 1: Financial Profile */}
        <div className="bg-white border-2 border-indigo-200 rounded-lg p-5 hover:shadow-md transition">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white font-bold text-lg">
                1
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2 text-base">
                Review and Complete Your Financial Profile
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Add or refine your assets (RRSP, TFSA, etc.), income sources, and monthly expenses.
                The more accurate your data, the better your retirement projections will be.
              </p>
              <a
                href="/profile"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
              >
                Go to Financial Profile →
              </a>
            </div>
          </div>
        </div>

        {/* Step 2: Government Benefits */}
        <div className="bg-white border-2 border-blue-200 rounded-lg p-5 hover:shadow-md transition">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white font-bold text-lg">
                2
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2 text-base">
                Calculate Your Government Benefits (CPP, OAS & GIS)
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Estimate your Canada Pension Plan (CPP), Old Age Security (OAS), and Guaranteed Income Supplement (GIS) benefits.
                Our calculator helps you find the optimal age to start claiming these benefits.
              </p>
              <a
                href="/benefits"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
              >
                Calculate Benefits →
              </a>
            </div>
          </div>
        </div>

        {/* Step 3: Run Simulation */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-5 hover:shadow-md transition">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-600 text-white font-bold text-lg">
                3
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2 text-base">
                Run Your First Retirement Simulation
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                See year-by-year projections of your income, expenses, taxes, and account balances.
                Your data from the wizard will be automatically loaded so you can run your first simulation.
              </p>
              <a
                href="/simulation"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition"
              >
                Run Your First Simulation →
              </a>
            </div>
          </div>
        </div>

        {/* Step 4: Explore Dashboard */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600 font-bold text-lg">
                4
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2 text-base">
                Explore Your Dashboard
              </h4>
              <p className="text-sm text-gray-600 mb-1">
                Your dashboard provides quick access to all retirement planning tools:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-3 ml-4">
                <li>• View your financial overview and net worth</li>
                <li>• Access the Quick Reference Guide for helpful tips</li>
                <li>• Track your retirement readiness score</li>
                <li>• Compare different retirement scenarios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Helpful Tips */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-5 mb-8">
        <h4 className="font-semibold text-yellow-900 mb-3 flex items-center text-base">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Pro Tips for Success
        </h4>
        <ul className="space-y-2 text-sm text-yellow-900">
          <li className="flex items-start">
            <span className="mr-2">💡</span>
            <span><strong>Start with accurate data:</strong> The more precise your financial information, the better your retirement projections will be</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🔄</span>
            <span><strong>Update regularly:</strong> Review and update your profile at least quarterly or when major financial changes occur</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🎯</span>
            <span><strong>Run multiple scenarios:</strong> Compare different retirement strategies to find the one that works best for you</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">📊</span>
            <span><strong>Optimize government benefits:</strong> Delaying CPP and OAS can significantly increase your lifetime benefits</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">💾</span>
            <span><strong>Your data is safe:</strong> All information is automatically saved and encrypted - you can return anytime</span>
          </li>
        </ul>
      </div>

      {/* Complete Button */}
      <div className="space-y-3">
        <button
          onClick={onComplete}
          className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold text-lg shadow-lg"
        >
          Go to Dashboard
        </button>
        <p className="text-center text-sm text-gray-500">
          Ready to explore your retirement planning tools
        </p>
      </div>
    </div>
  );
}
