# Billing Portal Production Deployment Checklist

## Current Status

✅ **Development**: Billing portal is working correctly in test mode
✅ **Code**: Billing portal implementation is complete and functional
- API endpoint: `app/api/subscription/billing-portal/route.ts`
- Stripe utilities: `lib/stripe.ts`
- Frontend page: `app/(dashboard)/account/billing/page.tsx`

## Important Finding

**No code changes are needed!** The billing portal was already implemented correctly. The issue you experienced was a local development server problem (hung processes), not a code bug.

## Pre-Deployment Checklist

### 1. Enable Stripe Customer Portal in Production

⚠️ **CRITICAL**: The Stripe Customer Portal must be activated in your LIVE/PRODUCTION Stripe account.

**Steps:**

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com/
2. Switch to **LIVE mode** (toggle in top right corner - should say "Viewing live data")
3. Go to: https://dashboard.stripe.com/settings/billing/portal
4. Click **"Activate customer portal"** or ensure it's already active
5. Configure the portal settings:
   - ✅ **Update payment methods**: Enable
   - ✅ **Update billing email**: Enable
   - ✅ **Cancel subscriptions**: Enable (choose cancellation behavior)
   - ✅ **Subscription pausing**: Optional
   - ✅ **Invoice history**: Enable
6. Click **"Save"**

### 2. Verify Production Environment Variables in Vercel

Ensure these environment variables are set in Vercel for production:

Required variables:
```bash
STRIPE_SECRET_KEY=sk_live_...  # Must be LIVE key, not test key
STRIPE_WEBHOOK_SECRET=whsec_...  # Production webhook secret
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...  # Production price ID
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...  # Production price ID
NEXT_PUBLIC_APP_URL=https://retirezest.com  # Your production URL
```

**To check/update Vercel environment variables:**

1. Go to: https://vercel.com/marcosclavier-projects/webapp/settings/environment-variables
2. Verify all Stripe variables are set for **Production** environment
3. Ensure you're using **LIVE** keys (start with `sk_live_`) NOT test keys

### 3. Test Customer Portal in Production (After Deployment)

After deploying, test with a real production subscription:

1. Create a test subscription in production (or use an existing one)
2. Log in to the production app
3. Navigate to `/account/billing`
4. Click "Manage Subscription"
5. Verify redirect to Stripe Customer Portal works
6. Test portal features:
   - View subscription details
   - Update payment method
   - View invoice history
   - Test cancellation flow (optional)

## What Actually Needs to be Deployed?

**Answer: Nothing new for the billing portal specifically!**

The billing portal code is already in your codebase and should already be deployed to production. The issue you experienced was a local development server problem that doesn't affect production.

However, I noticed you have many other changes pending. Let me check what those changes are:

## Other Pending Changes

Looking at git status, you have modifications to:
- Onboarding wizard steps (Assets, Expenses, Income, etc.)
- Login page
- Export API
- Rate limiting
- Turnstile integration
- And many other files

**Question for you:** Do you want to deploy ALL these changes, or do you want to:
1. First verify the billing portal works in production as-is
2. Then deploy the other pending changes separately

## Recommended Deployment Strategy

### Option A: Verify Billing Portal First (Recommended)
1. Don't deploy any code changes yet
2. Just verify Stripe Customer Portal is enabled in production
3. Test the billing portal in production with current deployed code
4. If it works, great! If not, we'll troubleshoot

### Option B: Deploy All Pending Changes
1. Review all pending changes
2. Test all changes locally
3. Create a comprehensive commit
4. Deploy to production
5. Test everything including billing portal

## Quick Test Script for Production

After verifying Stripe portal is enabled, you can test the production billing portal with this script:

```bash
# Create scripts/test-production-billing-portal.ts
```

```typescript
import 'dotenv/config';
import Stripe from 'stripe';

async function testProductionPortal() {
  const productionKey = process.env.STRIPE_SECRET_KEY_LIVE || '';

  if (!productionKey || !productionKey.startsWith('sk_live_')) {
    console.log('⚠️  No production Stripe key found');
    return;
  }

  const stripe = new Stripe(productionKey, {
    apiVersion: '2025-12-15.clover',
  });

  try {
    // Test creating a billing portal configuration
    const config = await stripe.billingPortal.configurations.list({ limit: 1 });
    console.log('✅ Billing portal is configured in production');
    console.log('   Active configurations:', config.data.length);
  } catch (error: any) {
    console.log('❌ Billing portal not configured:', error.message);
  }
}

testProductionPortal();
```

## Next Steps

**Please confirm:**
1. Do you want to verify the billing portal works in production first (Option A)?
2. Or do you want to review and deploy all pending changes (Option B)?
3. Have you verified that Stripe Customer Portal is enabled in LIVE mode?

Let me know and I'll help you proceed with the appropriate deployment strategy!
