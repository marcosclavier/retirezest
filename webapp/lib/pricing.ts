/**
 * Pricing Constants for RetireZest
 *
 * IMPORTANT: These values MUST match Stripe product/price configuration
 * Stripe Price ID: price_1SrmOdRogd0pJoDaBte1RF50
 * Stripe Product: RetireZest Premium Subscription (prod_TpRHqAySLycK5i)
 */

export const PRICING = {
  // Premium Subscription - Monthly
  PREMIUM_MONTHLY_PRICE_CAD: 5.99,
  PREMIUM_MONTHLY_PRICE_DISPLAY: '$5.99',
  PREMIUM_MONTHLY_CURRENCY: 'CAD',
  PREMIUM_MONTHLY_BILLING_PERIOD: 'month',

  // Premium Subscription - Annual (if/when added)
  PREMIUM_ANNUAL_PRICE_CAD: 47.00,
  PREMIUM_ANNUAL_PRICE_DISPLAY: '$47',
  PREMIUM_ANNUAL_DISCOUNT_PERCENT: 20,

  // Stripe Configuration
  STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_1SrmOdRogd0pJoDaBte1RF50',
  STRIPE_ANNUAL_PRICE_ID: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_1SrmQdRogd0pJoDav9fQyspG',
} as const;

/**
 * Free Tier Limits
 */
export const FREE_TIER_LIMITS = {
  MAX_SCENARIOS: 3,
  MAX_SIMULATIONS_PER_MONTH: 10,
  MARKET_SCENARIOS: ['neutral'], // Only neutral scenario
  AGE_COMPARISON_LIMIT: 1, // Only one age scenario
} as const;

/**
 * Premium Features
 */
export const PREMIUM_FEATURES = [
  'Unlimited retirement calculations',
  'All market scenarios (pessimistic, neutral, optimistic)',
  'Multiple age scenario comparisons',
  'Advanced tax optimization strategies',
  'Detailed PDF reports',
  'Priority support',
] as const;

/**
 * Helper function to format price for display
 */
export function formatPrice(amount: number, currency: string = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
