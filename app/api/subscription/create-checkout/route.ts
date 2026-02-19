import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { stripe, STRIPE_PRICE_IDS, isStripeConfigured, createCheckoutSession } from '@/lib/stripe';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/subscription/create-checkout
 *
 * Create a Stripe Checkout session for premium subscription
 *
 * Request body:
 * {
 *   plan: 'monthly' | 'yearly'
 * }
 *
 * Response:
 * {
 *   url: string // Redirect URL to Stripe Checkout
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    // 1. Verify authentication
    const session = await getSession();

    if (!session?.userId || !session?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { plan } = body;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // 3. Get the appropriate price ID
    const priceId =
      plan === 'monthly'
        ? STRIPE_PRICE_IDS.premium_monthly
        : STRIPE_PRICE_IDS.premium_yearly;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // 4. Get base URL for redirect URLs
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const successUrl = `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/subscribe?cancelled=true`;

    // 5. Create Stripe Checkout session
    const checkoutSession = await createCheckoutSession(
      session.email,
      session.userId,
      priceId,
      successUrl,
      cancelUrl
    );

    // 6. Return checkout URL
    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('[CREATE CHECKOUT ERROR]', error);

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
