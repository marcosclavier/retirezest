'use client';

import { Button } from '@/components/ui/button';
import { Play, ChevronUp } from 'lucide-react';
import { HouseholdInput } from '@/lib/types/simulation';
import { useState, useEffect } from 'react';

interface FloatingCTAProps {
  household: HouseholdInput;
  includePartner: boolean;
  onRunSimulation: () => void;
  isLoading: boolean;
}

export function FloatingCTA({ household, includePartner, onRunSimulation, isLoading }: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  // Calculate completion progress
  useEffect(() => {
    let completedItems = 0;
    let totalItems = 0;

    // Basic household info (3 items)
    totalItems += 3;
    if (household.province) completedItems++;
    if (household.end_age >= 65) completedItems++;
    if (household.strategy) completedItems++;

    // Spending plan (3 items)
    totalItems += 3;
    if (household.spending_go_go > 0) completedItems++;
    if (household.go_go_end_age > 0) completedItems++;
    if (household.spending_slow_go > 0) completedItems++;

    // Person 1 basic info (2 items)
    totalItems += 2;
    if (household.p1.name) completedItems++;
    if (household.p1.start_age >= 18) completedItems++;

    // Person 1 accounts (at least one account)
    totalItems += 1;
    const p1HasAccounts = (household.p1.tfsa_balance || 0) > 0 ||
                          (household.p1.rrsp_balance || 0) > 0 ||
                          (household.p1.rrif_balance || 0) > 0 ||
                          (household.p1.nr_cash || 0) > 0 ||
                          (household.p1.nr_gic || 0) > 0 ||
                          (household.p1.nr_invest || 0) > 0;
    if (p1HasAccounts) completedItems++;

    // Person 1 government benefits
    totalItems += 1;
    const p1HasBenefits = household.p1.cpp_start_age >= 60 && household.p1.oas_start_age >= 65;
    if (p1HasBenefits) completedItems++;

    // Person 2 (if included)
    if (includePartner) {
      totalItems += 2;
      if (household.p2.name) completedItems++;
      if (household.p2.start_age >= 18) completedItems++;

      totalItems += 1;
      const p2HasAccounts = (household.p2.tfsa_balance || 0) > 0 ||
                            (household.p2.rrsp_balance || 0) > 0 ||
                            (household.p2.rrif_balance || 0) > 0 ||
                            (household.p2.nr_cash || 0) > 0 ||
                            (household.p2.nr_gic || 0) > 0 ||
                            (household.p2.nr_invest || 0) > 0;
      if (p2HasAccounts) completedItems++;

      totalItems += 1;
      const p2HasBenefits = household.p2.cpp_start_age >= 60 && household.p2.oas_start_age >= 65;
      if (p2HasBenefits) completedItems++;
    }

    const progressPercent = Math.round((completedItems / totalItems) * 100);
    setProgress(progressPercent);
  }, [household, includePartner]);

  // Show floating CTA after user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Desktop: Bottom sticky bar */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-200 shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">{progress}% Complete</span>
              </div>
              <p className="text-sm text-gray-600 hidden lg:block">
                {progress < 50
                  ? "Fill out key details to run your simulation"
                  : progress < 100
                    ? "Almost there! Add more details for better accuracy"
                    : "Great! Ready to see your retirement plan"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToTop}
                className="border-gray-300"
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                Back to Top
              </Button>
              <Button
                onClick={onRunSimulation}
                disabled={isLoading || progress < 30}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
              >
                <Play className="mr-2 h-5 w-5" />
                {isLoading ? 'Running...' : 'Run Simulation'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Floating button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col items-end gap-2">
          {/* Progress indicator */}
          <div className="bg-white px-3 py-2 rounded-full shadow-lg border-2 border-blue-200">
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700">{progress}%</span>
            </div>
          </div>

          {/* Action buttons - Enhanced for mobile touch */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToTop}
              className="h-14 w-14 min-h-[56px] min-w-[56px] rounded-full shadow-lg border-2 border-gray-300 bg-white p-0"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
            <Button
              onClick={onRunSimulation}
              disabled={isLoading || progress < 30}
              size="mobile"
              className="min-h-[56px] rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-8"
            >
              <Play className="mr-2 h-5 w-5" />
              {isLoading ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
