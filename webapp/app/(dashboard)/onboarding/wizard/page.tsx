'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Step components
import PersonalInfoStep from './steps/PersonalInfoStep';
import PartnerInfoStep from './steps/PartnerInfoStep';
import AssetsStep from './steps/AssetsStep';
import PartnerAssetsStep from './steps/PartnerAssetsStep';
import IncomeStep from './steps/IncomeStep';
import PartnerIncomeStep from './steps/PartnerIncomeStep';
import ExpensesStep from './steps/ExpensesStep';
import RetirementGoalsStep from './steps/RetirementGoalsStep';
import ReviewStep from './steps/ReviewStep';

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Determine if user is planning with partner (dynamic steps)
  const includePartner = formData.includePartner || false;

  // Calculate total steps and steps array dynamically
  const TOTAL_STEPS = includePartner ? 9 : 6;

  const steps = useMemo(() => {
    if (includePartner) {
      return [
        { id: 1, name: 'Personal Info', description: 'Your basic information' },
        { id: 2, name: 'Partner Info', description: 'Partner information' },
        { id: 3, name: 'Your Assets', description: 'Your accounts and savings' },
        { id: 4, name: 'Partner Assets', description: 'Partner accounts' },
        { id: 5, name: 'Your Income', description: 'Your income sources' },
        { id: 6, name: 'Partner Income', description: 'Partner income' },
        { id: 7, name: 'Expenses', description: 'Household expenses' },
        { id: 8, name: 'Retirement Goals', description: 'CPP, OAS, and targets' },
        { id: 9, name: 'Review', description: 'Review and finish setup' },
      ];
    } else {
      return [
        { id: 1, name: 'Personal Info', description: 'Your basic information' },
        { id: 2, name: 'Assets', description: 'Your accounts and savings' },
        { id: 3, name: 'Income', description: 'Current and future income' },
        { id: 4, name: 'Expenses', description: 'Monthly and annual expenses' },
        { id: 5, name: 'Retirement Goals', description: 'CPP, OAS, and targets' },
        { id: 6, name: 'Review', description: 'Review and finish setup' },
      ];
    }
  }, [includePartner]);

  // Load existing user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load profile data
        const profileResponse = await fetch('/api/profile');
        let profileData: any = {};
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          profileData = {
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
            province: userData.province || 'ON',
            maritalStatus: userData.maritalStatus || 'single',
            includePartner: userData.includePartner || false,
            partnerFirstName: userData.partnerFirstName || '',
            partnerLastName: userData.partnerLastName || '',
            partnerDateOfBirth: userData.partnerDateOfBirth ? new Date(userData.partnerDateOfBirth).toISOString().split('T')[0] : '',
            targetRetirementAge: userData.targetRetirementAge || 65,
            lifeExpectancy: userData.lifeExpectancy || 95,
          };
        }

        // Load assets
        const assetsResponse = await fetch('/api/profile/assets');
        let assetsData: any = {};
        if (assetsResponse.ok) {
          const data = await assetsResponse.json();
          const assets = data.assets || [];
          assetsData.hasAssets = assets.length > 0;
          assetsData.assets = assets;
        }

        // Load income
        const incomeResponse = await fetch('/api/profile/income');
        let incomeData: any = {};
        if (incomeResponse.ok) {
          const data = await incomeResponse.json();
          const incomes = data.income || [];
          incomeData.hasIncome = incomes.length > 0;
          incomeData.incomes = incomes;
        }

        // Load expenses
        const expensesResponse = await fetch('/api/profile/expenses');
        let expensesData: any = {};
        if (expensesResponse.ok) {
          const data = await expensesResponse.json();
          const expenses = data.expenses || [];
          expensesData.hasExpenses = expenses.length > 0;
          expensesData.expenses = expenses;
        }

        // Combine all data
        setFormData({
          ...profileData,
          ...assetsData,
          ...incomeData,
          ...expensesData,
        });
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setDataLoaded(true);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (step >= 1 && step <= TOTAL_STEPS) {
        setCurrentStep(step);
      }
    }
  }, [searchParams]);

  const updateFormData = (stepData: any) => {
    setFormData((prev: any) => ({ ...prev, ...stepData }));
  };

  const saveProgress = async (step: number) => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboardingStep: step,
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      router.push(`/onboarding/wizard?step=${nextStep}`);
      await saveProgress(nextStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      router.push(`/onboarding/wizard?step=${prevStep}`);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboardingCompleted: true,
        }),
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to skip wizard:', error);
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboardingCompleted: true,
        }),
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete wizard:', error);
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    const commonProps = {
      formData,
      updateFormData,
      onNext: handleNext,
      onPrevious: handlePrevious,
    };

    if (includePartner) {
      // With partner: 9 steps
      switch (currentStep) {
        case 1:
          return <PersonalInfoStep {...commonProps} />;
        case 2:
          return <PartnerInfoStep {...commonProps} />;
        case 3:
          return <AssetsStep {...commonProps} />;
        case 4:
          return <PartnerAssetsStep {...commonProps} />;
        case 5:
          return <IncomeStep {...commonProps} />;
        case 6:
          return <PartnerIncomeStep {...commonProps} />;
        case 7:
          return <ExpensesStep {...commonProps} />;
        case 8:
          return <RetirementGoalsStep {...commonProps} />;
        case 9:
          return <ReviewStep {...commonProps} onComplete={handleComplete} />;
        default:
          return null;
      }
    } else {
      // Without partner: 6 steps
      switch (currentStep) {
        case 1:
          return <PersonalInfoStep {...commonProps} />;
        case 2:
          return <AssetsStep {...commonProps} />;
        case 3:
          return <IncomeStep {...commonProps} />;
        case 4:
          return <ExpensesStep {...commonProps} />;
        case 5:
          return <RetirementGoalsStep {...commonProps} />;
        case 6:
          return <ReviewStep {...commonProps} onComplete={handleComplete} />;
        default:
          return null;
      }
    }
  };

  // Show loading state while fetching user data
  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading your information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to RetireZest
          </h1>
          <p className="text-gray-600">
            Let's set up your retirement plan in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>

          {/* Progress steps */}
          <div className="relative">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-500"
              ></div>
            </div>
          </div>

          {/* Step indicators */}
          <div className="hidden md:flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id <= currentStep ? 'text-indigo-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 ${
                    step.id < currentStep
                      ? 'bg-indigo-600 border-indigo-600'
                      : step.id === currentStep
                      ? 'bg-white border-indigo-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        step.id === currentStep ? 'text-indigo-600' : 'text-gray-400'
                      }`}
                    >
                      {step.id}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-center max-w-[80px]">
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="text-sm text-gray-500">
            {currentStep} / {TOTAL_STEPS}
          </div>

          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              Next
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition"
            >
              {isLoading ? 'Completing...' : 'Complete Setup'}
              <CheckCircleIcon className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
