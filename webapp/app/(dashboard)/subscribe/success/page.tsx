'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, Sparkles } from 'lucide-react';

export default function SubscribeSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    // Give webhooks a moment to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <CardTitle className="text-2xl">Processing your subscription...</CardTitle>
            <CardDescription>
              Please wait while we activate your premium features.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-sm px-4 py-2">
              <Crown className="h-4 w-4 mr-2 inline" />
              Premium Activated!
            </Badge>
          </div>
          <CardTitle className="text-3xl mb-4">
            Welcome to RetireZest Premium!
          </CardTitle>
          <CardDescription className="text-lg">
            Your subscription has been activated successfully. You now have access to all premium features.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* What's unlocked */}
          <div className="bg-white rounded-lg p-6 space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              What's now unlocked:
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Unlimited early retirement calculations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Multiple market scenarios (pessimistic, neutral, optimistic)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>CSV export and professional PDF reports</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Advanced charts and detailed projections</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Priority support and early access to new features</span>
              </li>
            </ul>
          </div>

          {/* Next steps */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">Next Steps:</h3>
            <ol className="space-y-2 text-gray-700 list-decimal list-inside">
              <li>Check your email for a payment receipt</li>
              <li>Explore your premium dashboard features</li>
              <li>Run unlimited retirement calculations</li>
              <li>Export your first professional PDF report</li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/simulation')}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Run a Simulation
            </Button>
          </div>

          {/* Session info */}
          {sessionId && (
            <p className="text-xs text-center text-gray-500 mt-4">
              Session ID: {sessionId}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Additional info */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-gray-600">
          Need help? Contact us at{' '}
          <a href="mailto:contact@retirezest.com" className="text-blue-600 hover:underline">
            contact@retirezest.com
          </a>
        </p>
        <p className="text-sm text-gray-500">
          Manage your subscription anytime from{' '}
          <button
            onClick={() => router.push('/account/billing')}
            className="text-blue-600 hover:underline"
          >
            account settings
          </button>
        </p>
      </div>
    </div>
  );
}
