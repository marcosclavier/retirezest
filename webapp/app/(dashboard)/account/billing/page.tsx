'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Crown,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface SubscriptionData {
  isPremium: boolean;
  tier: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | null;
}

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      setLoading(true);
      const response = await fetch('/api/user/subscription');

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error('Subscription fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal() {
    try {
      setPortalLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/billing-portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      // Redirect to Stripe billing portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No billing portal URL returned');
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const isPremium = subscription?.isPremium || false;
  const status = subscription?.status;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing information</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card className={isPremium ? 'border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </CardTitle>
              <CardDescription>
                {isPremium
                  ? 'You have access to all premium features'
                  : 'Upgrade to unlock advanced features and unlimited calculations'}
              </CardDescription>
            </div>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                <Crown className="h-4 w-4 mr-1 inline" />
                Premium
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subscription Status */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {status === 'active' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : status === 'cancelled' ? (
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold">
                {status === 'active'
                  ? 'Active Subscription'
                  : status === 'cancelled'
                  ? 'Cancelled - Access until period end'
                  : status === 'expired'
                  ? 'Subscription Expired'
                  : 'No Active Subscription'}
              </div>
              <div className="text-sm text-gray-600">
                {isPremium
                  ? 'Your premium features are currently active'
                  : 'Upgrade to premium to unlock all features'}
              </div>
            </div>
          </div>

          {/* Premium Features Summary */}
          {isPremium && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium">Billing Cycle</div>
                  <div className="text-gray-600">Monthly or Yearly</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium">Payment Method</div>
                  <div className="text-gray-600">Managed via Stripe</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {isPremium ? (
              <>
                <Button
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                  className="flex-1"
                  size="lg"
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Manage Subscription
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  size="lg"
                >
                  Back to Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => router.push('/subscribe')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Premium
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  size="lg"
                >
                  Back to Dashboard
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Portal Info */}
      {isPremium && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Manage Your Subscription</CardTitle>
            <CardDescription>
              Use the Stripe billing portal to manage your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>In the billing portal, you can:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>View your billing history and invoices</li>
                <li>Update your payment method</li>
                <li>Change your billing email</li>
                <li>Cancel your subscription</li>
                <li>Reactivate a cancelled subscription</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                Note: Changes made in the billing portal take effect immediately. If you
                cancel, you'll retain premium access until the end of your current
                billing period.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Free Plan Benefits */}
      {!isPremium && (
        <Card className="mt-6 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle>Why Upgrade to Premium?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                'Unlimited calculations',
                'Multiple market scenarios',
                'CSV & PDF exports',
                'Advanced visualizations',
                'Detailed projections',
                'Priority support',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">Starting at $9.99/month</div>
                  <div className="text-sm text-gray-600">Cancel anytime</div>
                </div>
                <Button onClick={() => router.push('/subscribe')} size="lg">
                  Get Started
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          Need help with billing?{' '}
          <a
            href="mailto:contact@retirezest.com"
            className="text-blue-600 hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
