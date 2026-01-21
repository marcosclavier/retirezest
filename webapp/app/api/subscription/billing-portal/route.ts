import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createBillingPortalSession } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/subscription/billing-portal
 *
 * Create a Stripe billing portal session for subscription management
 *
 * Response:
 * {
 *   url: string // Redirect URL to Stripe billing portal
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await getSession();

    if (!session?.userId || !session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { email: session.email },
      select: {
        stripeCustomerId: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            'No billing account found. Please subscribe to premium first.',
        },
        { status: 400 }
      );
    }

    // 3. Get base URL for return URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/account/billing`;

    // 4. Create billing portal session
    const portalSession = await createBillingPortalSession(
      user.stripeCustomerId,
      returnUrl
    );

    // 5. Return portal URL
    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error('[BILLING PORTAL ERROR]', error);

    return NextResponse.json(
      {
        error: 'Failed to create billing portal session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
