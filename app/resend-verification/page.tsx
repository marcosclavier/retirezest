'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResendVerificationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        if (data.alreadyVerified) {
          setMessage('Your email is already verified! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          setMessage('Verification email sent! Please check your inbox.');
        }
      } else {
        setError(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="bg-indigo-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Resend Verification Email
          </h1>
          <p className="text-gray-600">
            Didn't receive the verification email? We can send you a new one.
          </p>
        </div>

        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Sending...' : 'Resend Verification Email'}
          </button>

          <Link
            href="/dashboard"
            className="block w-full bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 text-center transition"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Make sure to check your spam folder if you don't see the email in your inbox.</p>
        </div>
      </div>
    </div>
  );
}
