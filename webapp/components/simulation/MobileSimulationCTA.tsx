'use client';

import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileSimulationCTAProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  completionPercentage?: number;
  className?: string;
}

/**
 * MobileSimulationCTA - Mobile-optimized sticky bottom CTA for running simulations
 *
 * Features:
 * - Fixed to bottom of screen on mobile (md:hidden)
 * - Large touch target (min 44px height)
 * - Progress indicator when available
 * - Prominent design to drive conversions
 * - Safe area insets for iOS
 */
export function MobileSimulationCTA({
  onClick,
  isLoading = false,
  disabled = false,
  completionPercentage,
  className
}: MobileSimulationCTAProps) {
  const showProgress = typeof completionPercentage === 'number';
  const isReady = completionPercentage && completionPercentage >= 30;

  return (
    <div className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-40",
      "bg-white border-t border-gray-200 shadow-lg",
      "safe-bottom", // iOS safe area
      className
    )}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      )}

      {/* CTA Content */}
      <div className="px-4 py-3 pb-safe">
        {showProgress && !isReady ? (
          <div className="text-center mb-2">
            <p className="text-sm text-gray-600">
              {completionPercentage}% complete • Add key details to continue
            </p>
          </div>
        ) : null}

        <Button
          onClick={onClick}
          disabled={disabled || isLoading || (showProgress && !isReady)}
          size="mobile"
          className="w-full font-semibold shadow-md"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Running Simulation...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Run Simulation
            </>
          )}
        </Button>

        {showProgress && isReady && (
          <p className="text-xs text-center text-gray-500 mt-2">
            Ready to see your retirement plan
          </p>
        )}
      </div>
    </div>
  );
}
