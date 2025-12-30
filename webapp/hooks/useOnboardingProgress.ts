import { useState, useCallback } from 'react';

export interface OnboardingStep {
  id: string;
  name: string;
  completed: boolean;
  summary?: string;
}

export interface OnboardingProgressData {
  currentStep: number;
  steps: OnboardingStep[];
  formData: any;
}

/**
 * Hook to manage onboarding wizard progress tracking
 */
export function useOnboardingProgress(totalSteps: number) {
  const [progress, setProgress] = useState<OnboardingProgressData>({
    currentStep: 0,
    steps: [],
    formData: {}
  });

  const [saveIndicatorVisible, setSaveIndicatorVisible] = useState(false);

  /**
   * Update current step
   */
  const setCurrentStep = useCallback((step: number) => {
    setProgress(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  /**
   * Mark a step as completed with optional summary
   */
  const markStepComplete = useCallback((stepId: string, summary?: string) => {
    setProgress(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId
          ? { ...step, completed: true, summary }
          : step
      )
    }));
  }, []);

  /**
   * Update form data
   */
  const updateFormData = useCallback((data: any) => {
    setProgress(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data }
    }));
  }, []);

  /**
   * Initialize steps
   */
  const initializeSteps = useCallback((stepDefinitions: Array<{ id: string; name: string }>) => {
    setProgress(prev => ({
      ...prev,
      steps: stepDefinitions.map(def => ({
        ...def,
        completed: false
      }))
    }));
  }, []);

  /**
   * Show save indicator temporarily
   */
  const showSaveIndicator = useCallback(() => {
    setSaveIndicatorVisible(true);
    setTimeout(() => {
      setSaveIndicatorVisible(false);
    }, 2000);
  }, []);

  /**
   * Get summary for a completed step
   */
  const getStepSummary = useCallback((stepId: string): string | undefined => {
    const step = progress.steps.find(s => s.id === stepId);
    return step?.summary;
  }, [progress.steps]);

  /**
   * Check if a step is completed
   */
  const isStepCompleted = useCallback((stepId: string): boolean => {
    const step = progress.steps.find(s => s.id === stepId);
    return step?.completed || false;
  }, [progress.steps]);

  /**
   * Get completion percentage
   */
  const getCompletionPercentage = useCallback((): number => {
    const completedCount = progress.steps.filter(s => s.completed).length;
    return Math.round((completedCount / totalSteps) * 100);
  }, [progress.steps, totalSteps]);

  return {
    progress,
    setProgress,
    currentStep: progress.currentStep,
    steps: progress.steps,
    formData: progress.formData,
    setCurrentStep,
    markStepComplete,
    updateFormData,
    initializeSteps,
    showSaveIndicator,
    saveIndicatorVisible,
    getStepSummary,
    isStepCompleted,
    getCompletionPercentage
  };
}
