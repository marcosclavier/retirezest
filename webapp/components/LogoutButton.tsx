'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to home page
        router.push('/');
        router.refresh();
      } else {
        console.error('Logout failed:', await response.text());
        // Still redirect even if there's an error to be safe
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error to be safe
      router.push('/');
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
