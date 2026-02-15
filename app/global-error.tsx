'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

// Force dynamic rendering for error pages
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our logging service
    logger.error('Global error boundary caught error', error, {
      digest: error.digest,
      component: 'GlobalErrorBoundary'
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Application Error
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                A critical error has occurred. Please try refreshing the page.
              </p>
            </div>

            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error Details</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error.message || 'An unexpected error occurred'}</p>
                    {process.env.NODE_ENV === 'development' && error.digest && (
                      <p className="mt-1 text-xs text-red-600">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={reset}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload application
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-xs text-gray-500">
                <details className="cursor-pointer">
                  <summary className="font-semibold">Stack trace (dev only)</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                    {error.stack}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
