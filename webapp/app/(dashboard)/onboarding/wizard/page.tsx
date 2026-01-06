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

// Phase 2 components
import { useAutoSave, restoreProgress, clearProgress } from '@/hooks/useAutoSave';
import { OnboardingProgressSidebar } from './components/OnboardingProgressSidebar';
import { WelcomeModal } from './components/WelcomeModal';

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [saveIndicatorVisible, setSaveIndicatorVisible] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Determine if user is planning with partner (dynamic steps)
  const includePartner = formData.includePartner || false;

  // Calculate total steps and steps array dynamically
  const TOTAL_STEPS = includePartner ? 9 : 6;

  const steps = useMemo(() => {
    if (includePartner) {
      return [
        { id: 'personal', name: 'Personal Info', description: 'Your basic information', completed: currentStep > 1 },
        { id: 'partner', name: 'Partner Info', description: 'Partner information', completed: currentStep > 2 },
        { id: 'assets', name: 'Your Assets', description: 'Your accounts and savings', completed: currentStep > 3 },
        { id: 'partner-assets', name: 'Partner Assets', description: 'Partner accounts', completed: currentStep > 4 },
        { id: 'income', name: 'Your Income', description: 'Your income sources', completed: currentStep > 5 },
        { id: 'partner-income', name: 'Partner Income', description: 'Partner income', completed: currentStep > 6 },
        { id: 'expenses', name: 'Expenses', description: 'Household expenses', completed: currentStep > 7 },
        { id: 'goals', name: 'Retirement Goals', description: 'CPP, OAS, and targets', completed: currentStep > 8 },
        { id: 'review', name: 'Review', description: 'Review and finish setup', completed: currentStep > 9 },
      ];
    } else {
      return [
        { id: 'personal', name: 'Personal Info', description: 'Your basic information', completed: currentStep > 1 },
        { id: 'assets', name: 'Assets', description: 'Your accounts and savings', completed: currentStep > 2 },
        { id: 'income', name: 'Income', description: 'Current and future income', completed: currentStep > 3 },
        { id: 'expenses', name: 'Expenses', description: 'Monthly and annual expenses', completed: currentStep > 4 },
        { id: 'goals', name: 'Retirement Goals', description: 'CPP, OAS, and targets', completed: currentStep > 5 },
        { id: 'review', name: 'Review', description: 'Review and finish setup', completed: currentStep > 6 },
      ];
    }
  }, [includePartner, currentStep]);

  // Auto-save progress to localStorage
  useAutoSave(formData, currentStep, userId, {
    onSave: () => {
      setSaveIndicatorVisible(true);
      setTimeout(() => setSaveIndicatorVisible(false), 2000);
    }
  });

  // Load existing user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load profile data
        const profileResponse = await fetch('/api/profile');
        let profileData: any = {};
        let userIdFromProfile: string | undefined;
        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          userIdFromProfile = userData.id;
          setUserId(userData.id);
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
        const combinedData = {
          ...profileData,
          ...assetsData,
          ...incomeData,
          ...expensesData,
        };

        // Check for saved progress in localStorage
        const savedProgress = restoreProgress(userIdFromProfile);
        if (savedProgress && savedProgress.data) {
          // Use saved progress if available and more recent
          setFormData({ ...combinedData, ...savedProgress.data });
          if (savedProgress.step) {
            setCurrentStep(savedProgress.step);
          }
        } else {
          setFormData(combinedData);
        }
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
      const totalSteps = includePartner ? 9 : 6;
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step);
      }
    }
  }, [searchParams, includePartner]);

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

      // Clear saved progress from localStorage
      clearProgress(userId);

      // Show welcome modal
      setShowWelcomeModal(true);
      setIsLoading(false);
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
      <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-100 py-6 sm:py-12">
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-100 py-6 sm:py-12">
      <div className="flex max-w-7xl mx-auto px-4 gap-6">
        <div className="flex-1 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome to RetireZest
              </h1>
              {saveIndicatorVisible && (
                <span className="text-xs sm:text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full animate-fade-in">
                  Progress saved
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Let's set up your retirement plan in just a few steps
            </p>
          </div>

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-8">
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
          <div className="hidden lg:flex justify-between">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    stepNumber <= currentStep ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 ${
                      stepNumber < currentStep
                        ? 'bg-indigo-600 border-indigo-600'
                        : stepNumber === currentStep
                        ? 'bg-white border-indigo-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {stepNumber < currentStep ? (
                      <CheckCircleIcon className="w-5 h-5 text-white" />
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          stepNumber === currentStep ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                      >
                        {stepNumber}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-center max-w-[80px]">
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-4 sm:mb-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pb-4 sm:pb-0 gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-3 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-md text-sm sm:text-base text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
            {currentStep} / {TOTAL_STEPS}
          </div>

          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              className="flex items-center px-3 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-md text-sm sm:text-base hover:bg-indigo-700 transition"
            >
              Next
              <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="flex items-center px-3 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-md text-sm sm:text-base hover:bg-green-700 disabled:opacity-50 transition"
            >
              <span className="hidden sm:inline">{isLoading ? 'Completing...' : 'Complete Setup'}</span>
              <span className="sm:hidden">Complete</span>
              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
            </button>
          )}
        </div>
        </div>

        {/* Progress Sidebar - hidden on mobile, shown on desktop */}
        <div className="hidden xl:block w-80 flex-shrink-0">
          <OnboardingProgressSidebar
            steps={steps}
            currentStep={currentStep - 1}
            formData={formData}
            onNavigate={(index) => {
              const newStep = index + 1;
              setCurrentStep(newStep);
              router.push(`/onboarding/wizard?step=${newStep}`);
            }}
          />
        </div>
      </div>

      {/* Welcome Modal */}
      <WelcomeModal
        open={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          router.push('/dashboard');
        }}
        userName={formData.firstName}
      />
    </div>
  );
}
