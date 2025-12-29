'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          if (data.alreadyVerified) {
            setStatus('already-verified');
          } else {
            setStatus('success');
            // Redirect to dashboard after 3 seconds
            setTimeout(() => router.push('/dashboard'), 3000);
          }
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('An error occurred. Please try again.');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        {status === 'loading' && (
          <>
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Verifying Your Email
            </h1>
            <p className="text-gray-600 text-center">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-center mb-6">
              <div className="bg-green-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Your email has been successfully verified. You now have full access to all features.
            </p>
            <p className="text-sm text-gray-500 text-center">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'already-verified' && (
          <>
            <div className="text-center mb-6">
              <div className="bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Already Verified
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Your email was already verified. You have full access to all features.
            </p>
            <div className="text-center">
              <Link
                href="/dashboard"
                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-center mb-6">
              <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
            <div className="space-y-3">
              <Link
                href="/resend-verification"
                className="block w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 text-center"
              >
                Resend Verification Email
              </Link>
              <Link
                href="/dashboard"
                className="block w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 text-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
