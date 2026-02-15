'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface StaleDataAlertProps {
  lastProfileUpdate?: Date | string;
  lastSimulationLoad?: Date | string;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

/**
 * StaleDataAlert - Prompts user to refresh when profile data is newer than simulation data
 *
 * Part of Phase 2.4: Prefill Intelligence - Smart Refresh Prompts
 *
 * Features:
 * - Detects stale data (profile updated after simulation loaded)
 * - Shows how old the data is
 * - One-click refresh button
 * - Dismissible
 */
export function StaleDataAlert({
  lastProfileUpdate,
  lastSimulationLoad,
  onRefresh,
  isRefreshing = false
}: StaleDataAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const profileDate = lastProfileUpdate ? new Date(lastProfileUpdate) : null;
  const simDate = lastSimulationLoad ? new Date(lastSimulationLoad) : null;

  // Don't show if we don't have both dates
  if (!profileDate || !simDate) return null;

  // Don't show if simulation data is newer or equal
  if (simDate >= profileDate) return null;

  const getDaysDifference = (): number => {
    const diffMs = profileDate.getTime() - simDate.getTime();
    return Math.floor(diffMs / 86400000);
  };

  const getTimeMessage = (): string => {
    const days = getDaysDifference();
    if (days === 0) return 'earlier today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
  };

  return (
    <Alert className="bg-yellow-50 border-yellow-300 relative">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold">Your profile was updated {getTimeMessage()}</p>
            <p className="text-sm mt-1">
              The simulation is using older data. Refresh to load your latest profile information.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Now
                </>
              )}
            </Button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-yellow-700 hover:text-yellow-900 p-1"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * ConflictDetectionAlert - Shows when user deleted/modified assets in profile
 */
interface ConflictDetectionAlertProps {
  conflicts: string[];
  onRefresh: () => void;
  onDismiss?: () => void;
}

export function ConflictDetectionAlert({
  conflicts,
  onRefresh,
  onDismiss
}: ConflictDetectionAlertProps) {
  if (conflicts.length === 0) return null;

  return (
    <Alert className="bg-orange-50 border-orange-300">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold">Profile changes detected</p>
            <ul className="text-sm mt-2 list-disc list-inside space-y-1">
              {conflicts.map((conflict, index) => (
                <li key={index}>{conflict}</li>
              ))}
            </ul>
            <p className="text-sm mt-2">
              Update your simulation to reflect these changes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onRefresh}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Simulation
            </Button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-orange-700 hover:text-orange-900 p-1"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
