'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';

export default function LoginPage() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  useEffect(() => {
    if (!recaptchaSiteKey) {
      console.error('reCAPTCHA site key is not configured');
      setError('reCAPTCHA is not properly configured. Please contact support.');
    }
  }, [recaptchaSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
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
          recaptchaToken
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
        // Reset reCAPTCHA on error
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      // Reset reCAPTCHA on error
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
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

          <div className="flex justify-center my-4">
            {recaptchaSiteKey ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
                onErrored={() => setRecaptchaToken(null)}
              />
            ) : (
              <div className="text-sm text-red-600">
                reCAPTCHA configuration missing. Please refresh the page.
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !recaptchaToken}
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
