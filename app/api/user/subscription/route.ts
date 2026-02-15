import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/user/subscription
 *
 * Returns the current user's subscription status
 *
 * Response:
 * {
 *   isPremium: boolean,
 *   tier: 'free' | 'premium',
 *   status: 'active' | 'trial' | 'cancelled' | 'expired' | null
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await getSession();

    if (!session?.userId || !session?.email) {
      return NextResponse.json(
        {
          isPremium: false,
          tier: 'free',
          status: null,
        },
        { status: 401 }
      );
    }

    // 2. Get subscription status
    const subscription = await getUserSubscription(session.email);

    if (!subscription) {
      return NextResponse.json(
        {
          isPremium: false,
          tier: 'free',
          status: null,
        },
        { status: 404 }
      );
    }

    // 3. Return subscription status
    return NextResponse.json({
      isPremium: subscription.isPremium,
      tier: subscription.tier,
      status: subscription.status,
    });
  } catch (error) {
    console.error('[SUBSCRIPTION STATUS ERROR]', error);

    // Default to free tier on error
    return NextResponse.json(
      {
        isPremium: false,
        tier: 'free',
        status: null,
      },
      { status: 500 }
    );
  }
}
