'use client';

import Link from 'next/link';

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Account Deletion Scheduled
        </h1>

        {/* Message */}
        <div className="space-y-4 mb-6 text-gray-700">
          <p className="text-center">
            Your RetireZest account has been marked for deletion. Your data will remain accessible for the next 30 days.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Recovery Period</h3>
            <p className="text-sm text-blue-800">
              Changed your mind? You can recover your account within the next 30 days by simply logging in again.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Your account is now in a deletion queue</li>
              <li>After 30 days, all your data will be permanently deleted</li>
              <li>You can log in anytime within 30 days to cancel the deletion</li>
            </ul>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">We're sorry to see you go</h3>
          <p className="text-sm text-gray-600 mb-3">
            If you have any feedback about why you're leaving or how we could improve, please email us at:
          </p>
          <a
            href="mailto:jrcb@hotmail.com"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            jrcb@hotmail.com
          </a>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Return to Home
          </Link>

          <p className="text-xs text-gray-500 text-center">
            You have been logged out for security reasons.
          </p>
        </div>

        {/* Data Export Reminder */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 text-center">
            Forgot to export your data? Log back in within 30 days to access your account and download your information.
          </p>
        </div>
      </div>
    </div>
  );
}
