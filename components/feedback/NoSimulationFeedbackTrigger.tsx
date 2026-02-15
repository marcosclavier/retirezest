'use client';

import { useEffect, useState } from 'react';
import { NoSimulationFeedbackModal } from './NoSimulationFeedbackModal';

interface NoSimulationFeedbackTriggerProps {
  hasData: boolean;
  hasSimulation: boolean;
  visitCount: number;
}

/**
 * Client component that shows the no-simulation feedback modal
 * when conditions are met
 */
export function NoSimulationFeedbackTrigger({
  hasData,
  hasSimulation,
  visitCount,
}: NoSimulationFeedbackTriggerProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Don't show if user has already run simulation
    if (hasSimulation) return;

    // Don't show if user doesn't have data yet
    if (!hasData) return;

    // Don't show if user hasn't visited enough times (shows engagement)
    if (visitCount < 2) return;

    // Check if survey was already completed
    const surveyCompleted = localStorage.getItem('noSimulationSurveyCompleted');
    if (surveyCompleted === 'true') return;

    // Check if survey was dismissed recently
    const dismissedUntil = localStorage.getItem('noSimulationSurveyDismissed');
    if (dismissedUntil) {
      const dismissDate = new Date(dismissedUntil);
      if (dismissDate > new Date()) {
        return; // Still within dismissed period
      }
    }

    // All conditions met - show modal after short delay
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 3000); // Show after 3 seconds on page

    return () => clearTimeout(timer);
  }, [hasData, hasSimulation, visitCount]);

  return (
    <NoSimulationFeedbackModal
      open={showModal}
      onOpenChange={setShowModal}
    />
  );
}
