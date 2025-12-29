'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RecoveryBannerProps {
  scheduledDeletionAt: string;
}

export default function RecoveryBanner({ scheduledDeletionAt }: RecoveryBannerProps) {
  const router = useRouter();
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState('');

  // Calculate days remaining
  const daysRemaining = Math.ceil(
    (new Date(scheduledDeletionAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleRecover = async () => {
    try {
      setIsRecovering(true);
      setError('');

      const response = await fetch('/api/account/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to recover account');
        setIsRecovering(false);
        return;
      }

      // Refresh the page to show updated state
      router.refresh();

    } catch (err) {
      console.error('Recovery error:', err);
      setError('An unexpected error occurred');
      setIsRecovering(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Account Scheduled for Deletion
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Your account is scheduled to be permanently deleted in{' '}
              <span className="font-semibold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>.
              All your data will be lost unless you recover your account.
            </p>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={handleRecover}
              disabled={isRecovering}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRecovering ? 'Recovering...' : 'Recover My Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
