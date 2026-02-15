import { useEffect, useRef } from 'react';

export interface AutoSaveOptions {
  debounceMs?: number;
  storageKey?: string;
  onSave?: () => void;
}

/**
 * Auto-saves data to localStorage with debouncing
 * @param data - The data to save
 * @param step - Current step number
 * @param userId - Optional user ID for personalized storage key
 * @param options - Optional configuration
 */
export function useAutoSave(
  data: any,
  step: number,
  userId?: string,
  options: AutoSaveOptions = {}
) {
  const {
    debounceMs = 500,
    storageKey,
    onSave
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce auto-save
    timeoutRef.current = setTimeout(() => {
      try {
        const key = storageKey || (userId
          ? `onboarding_progress_${userId}`
          : 'onboarding_progress');

        localStorage.setItem(key, JSON.stringify({
          data,
          step,
          timestamp: Date.now()
        }));

        if (onSave) {
          onSave();
        }
      } catch (error) {
        console.error('Failed to auto-save progress:', error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, step, userId, debounceMs, storageKey, onSave]);
}

/**
 * Restore saved progress from localStorage
 * @param userId - Optional user ID
 * @param storageKey - Optional custom storage key
 * @returns Saved progress or null
 */
export function restoreProgress(userId?: string, storageKey?: string) {
  try {
    const key = storageKey || (userId
      ? `onboarding_progress_${userId}`
      : 'onboarding_progress');

    const saved = localStorage.getItem(key);
    if (!saved) return null;

    const progress = JSON.parse(saved);

    // Check if saved data is stale (older than 7 days)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - progress.timestamp > sevenDaysMs) {
      localStorage.removeItem(key);
      return null;
    }

    return progress;
  } catch (error) {
    console.error('Failed to restore progress:', error);
    return null;
  }
}

/**
 * Clear saved progress from localStorage
 * @param userId - Optional user ID
 * @param storageKey - Optional custom storage key
 */
export function clearProgress(userId?: string, storageKey?: string) {
  try {
    const key = storageKey || (userId
      ? `onboarding_progress_${userId}`
      : 'onboarding_progress');

    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear progress:', error);
  }
}
