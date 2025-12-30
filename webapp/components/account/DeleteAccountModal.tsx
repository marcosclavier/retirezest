'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    // Reset error
    setError('');

    // Validate inputs
    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (confirmationText !== 'DELETE') {
      setError('Please type "DELETE" to confirm');
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          confirmationText,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
        return;
      }

      // Log out and redirect to confirmation page
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/account-deleted');

    } catch (err) {
      console.error('Delete account error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setPassword('');
      setConfirmationText('');
      setReason('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Delete Account</h2>
          <p className="text-gray-600">
            This action will mark your account for deletion. You will have 30 days to recover your account.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <h3 className="font-semibold text-red-800 mb-2">What will be deleted:</h3>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            <li>Your personal information</li>
            <li>All income sources, assets, expenses, and debts</li>
            <li>All scenarios and projections</li>
            <li>Your account settings and preferences</li>
          </ul>
          <p className="text-sm text-red-700 mt-3 font-semibold">
            After 30 days, this data will be permanently deleted and cannot be recovered.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter your password"
              disabled={isDeleting}
            />
          </div>

          {/* Confirmation Text */}
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-1">
              Type "DELETE" to confirm <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="DELETE"
              disabled={isDeleting}
            />
          </div>

          {/* Reason (Optional) */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for leaving (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Help us improve by telling us why you're leaving..."
              rows={3}
              disabled={isDeleting}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>

        {/* Recovery Note */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          You can recover your account within 30 days by logging in again.
        </p>
      </div>
    </div>
  );
}
