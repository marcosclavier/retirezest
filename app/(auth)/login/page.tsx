'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0); // Key to force Turnstile re-render

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
  const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

  useEffect(() => {
    // In E2E test mode or development without Turnstile key, automatically set a fake token to allow login
    if (isE2ETestMode || (process.env.NODE_ENV === 'development' && !turnstileSiteKey)) {
      setTurnstileToken('dev-test-token');
      return;
    }

    if (!turnstileSiteKey) {
      console.error('Turnstile site key is not configured');
      setError('Security verification is not properly configured. Please contact support.');
    }
  }, [turnstileSiteKey, isE2ETestMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verify Turnstile
    if (!turnstileToken) {
      setError('Please wait for security verification to complete');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          turnstileToken
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
        // Reset Turnstile on error - force re-render with new key
        setTurnstileToken(null);
        setTurnstileKey(prev => prev + 1);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      // Reset Turnstile on error - force re-render with new key
      setTurnstileToken(null);
      setTurnstileKey(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login to your retirement planning account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {/* Hide Turnstile in E2E test mode or development without key */}
          {!isE2ETestMode && !(process.env.NODE_ENV === 'development' && !turnstileSiteKey) && (
            <div className="flex justify-center my-4">
              {turnstileSiteKey ? (
                <Turnstile
                  key={turnstileKey}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                  options={{
                    theme: 'light',
                    size: 'normal',
                  }}
                />
              ) : (
                <div className="text-sm text-red-600">
                  Security verification configuration missing. Please refresh the page.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
              Create one now
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
