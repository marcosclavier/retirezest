'use client';

import * as React from 'react';
import { GettingStartedChecklist } from './GettingStartedChecklist';

interface ProfileStatus {
  hasPersonalInfo: boolean;
  hasAssets: boolean;
  hasIncome: boolean;
  hasExpenses: boolean;
  hasBenefits: boolean;
  hasSimulation: boolean;
}

interface GettingStartedChecklistWrapperProps {
  profileData: ProfileStatus;
}

/**
 * Client-side wrapper for GettingStartedChecklist
 * Manages dismiss state in localStorage
 */
export function GettingStartedChecklistWrapper({
  profileData,
}: GettingStartedChecklistWrapperProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Load dismiss state from localStorage on mount
  React.useEffect(() => {
    const dismissed = localStorage.getItem('hideGettingStarted') === 'true';
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('hideGettingStarted', 'true');
    setIsDismissed(true);
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return <GettingStartedChecklist profileData={profileData} onDismiss={handleDismiss} />;
}
