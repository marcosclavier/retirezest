'use client';

import * as React from 'react';
import { CheckCircle, X } from 'lucide-react';
import Link from 'next/link';

interface ProfileStatus {
  hasPersonalInfo: boolean;
  hasAssets: boolean;
  hasIncome: boolean;
  hasExpenses: boolean;
  hasBenefits: boolean;
  hasSimulation: boolean;
}

interface GettingStartedChecklistProps {
  profileData: ProfileStatus;
  onDismiss: () => void;
}

interface ChecklistStep {
  id: string;
  title: string;
  completed: boolean;
  href: string;
  icon: string;
}

/**
 * GettingStartedChecklist - Guides new users through essential setup steps
 *
 * Shows progress through 5 key setup tasks and hides automatically when complete
 */
export function GettingStartedChecklist({
  profileData,
  onDismiss,
}: GettingStartedChecklistProps) {
  const steps: ChecklistStep[] = [
    {
      id: 'personal-info',
      title: 'Add your personal information',
      completed: profileData.hasPersonalInfo,
      href: '/profile',
      icon: '👤',
    },
    {
      id: 'assets',
      title: 'Enter your financial accounts',
      completed: profileData.hasAssets,
      href: '/profile/assets',
      icon: '💰',
    },
    {
      id: 'income',
      title: 'Add your income sources',
      completed: profileData.hasIncome,
      href: '/profile/income',
      icon: '💵',
    },
    {
      id: 'expenses',
      title: 'Enter your monthly expenses',
      completed: profileData.hasExpenses,
      href: '/profile/expenses',
      icon: '📊',
    },
    {
      id: 'benefits',
      title: 'Calculate your CPP & OAS benefits',
      completed: profileData.hasBenefits,
      href: '/benefits',
      icon: '🇨🇦',
    },
    {
      id: 'simulation',
      title: 'Run your first retirement projection',
      completed: profileData.hasSimulation,
      href: '/simulation?mode=quick',
      icon: '🎯',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  // Hide when all steps are complete
  if (completedCount === steps.length) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Complete Your Setup</h3>
          <p className="text-blue-100 text-sm mt-1">
            {completedCount} of {steps.length} steps completed
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/20 rounded-full h-2.5 mb-6">
        <div
          className="bg-white rounded-full h-2.5 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              step.completed
                ? 'bg-white/10 opacity-70 cursor-default'
                : 'bg-white/20 hover:bg-white/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <span className="text-2xl flex-shrink-0" aria-hidden="true">
              {step.icon}
            </span>
            <span className="flex-1 text-sm sm:text-base">{step.title}</span>
            {step.completed && (
              <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
            )}
            {!step.completed && (
              <div className="h-5 w-5 rounded-full border-2 border-white/50 flex-shrink-0" />
            )}
          </Link>
        ))}
      </div>

      {/* Encouragement message */}
      {completedCount > 0 && completedCount < steps.length && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-blue-100 text-center">
            {completedCount < 3 ? (
              <>🎉 Great start! Keep going to unlock your retirement plan.</>
            ) : completedCount < 5 ? (
              <>✨ You're almost there! Just a few more steps.</>
            ) : (
              <>🚀 One final step and you'll have your complete plan!</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
