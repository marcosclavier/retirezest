'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Crown, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { PRICING } from '@/lib/pricing';

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  const cancelled = searchParams?.get('cancelled') === 'true';

  // Check current subscription status
  useEffect(() => {
    async function checkSubscription() {
      try {
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setIsPremium(data.isPremium);
        }
      } catch (err) {
        console.error('Failed to check subscription:', err);
      }
    }

    checkSubscription();
  }, []);

  const features = [
    'Unlimited early retirement calculations',
    'Multiple market scenarios (pessimistic, neutral, optimistic)',
    'Interactive retirement age slider',
    'Detailed year-by-year projections',
    'CSV export of simulation data',
    'Professional PDF reports',
    'Full data export',
    'Advanced charts and visualizations',
    'Comprehensive action plans (10+ recommendations)',
    'Priority email support',
    'Early access to new features',
    'No long-term commitment - cancel anytime',
  ];

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    try {
      setLoading(plan);
      setError(null);

      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(null);
    }
  };

  if (isPremium) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full text-sm font-semibold">
                <Crown className="h-5 w-5" />
                Premium Active
              </div>
            </div>
            <CardTitle className="text-2xl">You're Already Premium!</CardTitle>
            <CardDescription>
              You have access to all premium features. Manage your subscription in account settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button onClick={() => router.push('/dashboard')} size="lg">
              Go to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/account/billing')}
              variant="outline"
              size="lg"
            >
              Manage Billing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-sm px-4 py-1">
            <Crown className="h-4 w-4 mr-2 inline" />
            Premium Subscription
          </Badge>
        </div>
        <h1 className="text-4xl font-bold mb-4">Upgrade to RetireZest Premium</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock unlimited calculations, advanced scenarios, and professional reports to plan your perfect retirement
        </p>
      </div>

      {/* Cancellation alert */}
      {cancelled && (
        <Alert className="mb-8 border-yellow-300 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            You cancelled the checkout. No charges were made. Ready to try again?
          </AlertDescription>
        </Alert>
      )}

      {/* Error alert */}
      {error && (
        <Alert className="mb-8 border-red-300 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Monthly Plan */}
        <Card className="border-2 hover:border-blue-400 transition-colors">
          <CardHeader>
            <CardTitle className="text-2xl">Monthly</CardTitle>
            <CardDescription>Pay as you go</CardDescription>
            <div className="mt-4">
              <div className="text-5xl font-bold">{PRICING.PREMIUM_MONTHLY_PRICE_DISPLAY}</div>
              <div className="text-gray-600 mt-1">per {PRICING.PREMIUM_MONTHLY_BILLING_PERIOD}</div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading !== null}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
              size="lg"
            >
              {loading === 'monthly' ? (
                'Processing...'
              ) : (
                <>
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-3">
              Cancel anytime • No commitment
            </p>
          </CardContent>
        </Card>

        {/* Yearly Plan */}
        <Card className="border-2 border-blue-600 relative shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1">
              <Sparkles className="h-3 w-3 mr-1 inline" />
              Save {Math.round((1 - (PRICING.PREMIUM_ANNUAL_PRICE_CAD / (PRICING.PREMIUM_MONTHLY_PRICE_CAD * 12))) * 100)}%
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Yearly</CardTitle>
            <CardDescription>Best value</CardDescription>
            <div className="mt-4">
              <div className="text-5xl font-bold">{PRICING.PREMIUM_ANNUAL_PRICE_DISPLAY}</div>
              <div className="text-gray-600 mt-1">per year</div>
              <div className="text-sm text-green-600 font-semibold mt-2">
                Save ${((PRICING.PREMIUM_MONTHLY_PRICE_CAD * 12) - PRICING.PREMIUM_ANNUAL_PRICE_CAD).toFixed(2)} per year
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleSubscribe('yearly')}
              disabled={loading !== null}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-6"
              size="lg"
            >
              {loading === 'yearly' ? (
                'Processing...'
              ) : (
                <>
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            <p className="text-center text-sm text-gray-500 mt-3">
              Cancel anytime • Billed annually
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features List */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Everything included in Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trust Signals */}
      <div className="mt-12 text-center space-y-4">
        <p className="text-gray-600">
          <strong>Secure payment</strong> powered by Stripe
        </p>
        <p className="text-gray-600">
          Join 500+ RetireZest Premium users planning their perfect retirement
        </p>
        <p className="text-sm text-gray-500">
          All plans include a 30-day money-back guarantee
        </p>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-600">
              Yes! You can cancel your subscription at any time from your account
              settings. You'll retain premium access until the end of your billing
              period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-600">
              We accept all major credit cards (Visa, Mastercard, American Express)
              through our secure payment processor, Stripe.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Can I switch from monthly to yearly?
            </h3>
            <p className="text-gray-600">
              Yes! Contact our support team and we'll help you switch plans and
              prorate any remaining balance on your current subscription.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Is there a free trial?
            </h3>
            <p className="text-gray-600">
              Not currently, but we offer a 30-day money-back guarantee. If you're
              not satisfied for any reason, we'll refund your purchase in full.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
