import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Unsubscribed | RetireZest',
  description: 'You have been unsubscribed from RetireZest emails',
};

export default function UnsubscribeSuccessPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const type = searchParams.type || 'all';

  const getTypeDescription = () => {
    switch (type) {
      case 'feedback':
        return 'feedback and survey emails';
      case 'marketing':
        return 'marketing and promotional emails';
      case 'all':
      default:
        return 'all optional emails';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 mb-4" />

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You've Been Unsubscribed
          </h1>

          <p className="text-gray-600 mb-6">
            You will no longer receive {getTypeDescription()} from RetireZest.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> You will still receive important account-related emails,
              such as:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1">
              <li>• Password reset confirmations</li>
              <li>• Email verification requests</li>
              <li>• Account security notifications</li>
              <li>• Subscription and billing updates</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/settings/notifications"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Manage Email Preferences
            </Link>

            <Link
              href="/dashboard"
              className="block w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Changed your mind? You can update your email preferences anytime from your account
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}
