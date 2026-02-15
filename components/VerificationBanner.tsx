'use client';

import { useState } from 'react';

interface VerificationBannerProps {
  userEmail: string;
}

export function VerificationBanner({ userEmail }: VerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  if (dismissed) return null;

  const handleResend = async () => {
    setResending(true);
    setMessage('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        setMessage('Verification email sent! Check your inbox.');
      } else {
        setMessage(data.error || 'Failed to send email');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-1">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Verify your email to unlock retirement simulations.</strong> We sent a verification link to <strong>{userEmail}</strong>. Can&apos;t find it?
            </p>
            {message && <p className="text-sm text-yellow-700 mt-1">{message}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-semibold text-yellow-800 hover:text-yellow-900 disabled:opacity-50 whitespace-nowrap"
          >
            {resending ? 'Sending...' : 'Resend Email'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-600 hover:text-yellow-800"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
