/**
 * Stripe utility functions and configuration
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// Price IDs (to be set after creating products in Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
  premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
};

// Product configuration
export const PRODUCTS = {
  premium: {
    name: 'RetireZest Premium',
    description: 'Unlock unlimited calculations, advanced scenarios, and premium reports',
    monthly_price: 5.99,
    yearly_price: 47.00,
    currency: 'usd',
    features: [
      'Unlimited early retirement calculations',
      'Multiple market scenarios (pessimistic, neutral, optimistic)',
      'Interactive retirement age slider',
      'Detailed year-by-year projections',
      'CSV export of simulation data',
      'Professional PDF reports',
      'Full data export',
      'Advanced charts and visualizations',
      'Comprehensive action plans',
      'Priority email support',
    ],
  },
};

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userEmail: string,
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        userId,
        userEmail,
      },
      subscription_data: {
        metadata: {
          userId,
          userEmail,
        },
      },
    });

    return session;
  } catch (error) {
    console.error('[STRIPE CHECKOUT ERROR]', error);
    throw error;
  }
}

/**
 * Create a billing portal session for subscription management
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('[STRIPE BILLING PORTAL ERROR]', error);
    throw error;
  }
}

/**
 * Retrieve a subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('[STRIPE GET SUBSCRIPTION ERROR]', error);
    return null;
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('[STRIPE CANCEL SUBSCRIPTION ERROR]', error);
    throw error;
  }
}

/**
 * Reactivate a cancelled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  } catch (error) {
    console.error('[STRIPE REACTIVATE SUBSCRIPTION ERROR]', error);
    throw error;
  }
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(
  email: string
): Promise<Stripe.Customer | null> {
  try {
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    return customers.data[0] || null;
  } catch (error) {
    console.error('[STRIPE GET CUSTOMER ERROR]', error);
    return null;
  }
}
