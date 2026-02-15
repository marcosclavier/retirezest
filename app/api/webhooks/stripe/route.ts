import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { updateSubscriptionTier, cancelSubscription as cancelUserSubscription, expireSubscription } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events for subscription lifecycle management
 *
 * Events handled:
 * - customer.subscription.created - New subscription created
 * - customer.subscription.updated - Subscription status changed
 * - customer.subscription.deleted - Subscription cancelled/expired
 * - invoice.payment_succeeded - Payment successful
 * - invoice.payment_failed - Payment failed
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get the raw body for signature verification
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[STRIPE WEBHOOK] Missing signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[STRIPE WEBHOOK] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`[STRIPE WEBHOOK] Processing event: ${event.type}`);

    // 3. Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreatedOrUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[STRIPE WEBHOOK ERROR]', error);
    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription.created and subscription.updated events
 */
async function handleSubscriptionCreatedOrUpdated(
  subscription: Stripe.Subscription
) {
  console.log(
    `[STRIPE] Processing subscription ${subscription.id}, status: ${subscription.status}`
  );

  const userEmail = subscription.metadata.userEmail;
  if (!userEmail) {
    console.error(
      '[STRIPE] No userEmail in subscription metadata:',
      subscription.id
    );
    return;
  }

  // Determine subscription tier based on status
  const isActive = ['active', 'trialing'].includes(subscription.status);
  const tier = isActive ? 'premium' : 'free';

  // Determine subscription status
  let status: 'active' | 'cancelled' | 'expired';
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    status = 'active';
  } else if (subscription.cancel_at_period_end) {
    status = 'cancelled';
  } else {
    status = 'expired';
  }

  // Update user subscription
  await updateSubscriptionTier(userEmail, tier, status, {
    customerId: subscription.customer as string,
    subscriptionId: subscription.id,
    priceId: subscription.items.data[0]?.price.id,
  });

  // Update subscription end date if cancelled
  if (subscription.cancel_at_period_end) {
    const periodEnd = (subscription as any).current_period_end;
    if (periodEnd) {
      const endDate = new Date(periodEnd * 1000);
      await cancelUserSubscription(userEmail, endDate);
    }
  }

  console.log(
    `[STRIPE] Updated user ${userEmail} to tier=${tier}, status=${status}`
  );
}

/**
 * Handle subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[STRIPE] Subscription deleted: ${subscription.id}`);

  const userEmail = subscription.metadata.userEmail;
  if (!userEmail) {
    console.error(
      '[STRIPE] No userEmail in subscription metadata:',
      subscription.id
    );
    return;
  }

  // Downgrade to free tier
  await expireSubscription(userEmail);

  console.log(`[STRIPE] Downgraded user ${userEmail} to free tier`);
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`[STRIPE] Payment succeeded for invoice: ${invoice.id}`);

  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) {
    return;
  }

  // Fetch the subscription to get latest status
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId as string
  );

  // Update subscription (ensures status is current)
  await handleSubscriptionCreatedOrUpdated(subscription);
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[STRIPE] Payment failed for invoice: ${invoice.id}`);

  const subscriptionId = (invoice as any).subscription;
  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId as string
  );

  const userEmail = subscription.metadata.userEmail;
  if (!userEmail) {
    return;
  }

  // Don't immediately downgrade - Stripe will retry
  // But we could send a notification email here
  console.log(`[STRIPE] Payment failed for user ${userEmail} - retrying`);

  // If subscription is past_due or unpaid, we may want to take action
  if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
    console.log(
      `[STRIPE] Subscription ${subscription.id} is ${subscription.status}`
    );

    // Update status in our database
    await prisma.user.update({
      where: { email: userEmail },
      data: {
        subscriptionStatus: 'expired',
      },
    });
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[STRIPE] Checkout completed: ${session.id}`);

  if (session.mode !== 'subscription') {
    return;
  }

  const userEmail = session.customer_email || session.metadata?.userEmail;

  if (!userEmail) {
    console.error('[STRIPE] No email in checkout session:', session.id);
    return;
  }

  // The subscription.created event will handle the actual upgrade
  // This event is mainly for tracking/analytics
  console.log(`[STRIPE] New subscription checkout for ${userEmail}`);

  // You could send a welcome email here
}
