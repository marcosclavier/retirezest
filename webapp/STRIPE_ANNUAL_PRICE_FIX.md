# Stripe Annual Price Configuration Fix

**Date:** January 21, 2026
**Issue:** Annual subscription was configured as one-time payment instead of recurring subscription

## Problem Identified

When you mentioned "annual service" and provided the product ID `prod_TpoZJH3zjLRSAz`, I discovered:

1. **Product:** Annual Premium Service (prod_TpoZJH3zjLRSAz)
2. **Old Price:** `price_1Ss8wDRwcyFDEm4szHZAnWOZ` - $47.00 CAD **one-time payment**
3. **Issue:** Your code creates Stripe Checkout with `mode: 'subscription'` (recurring), but the annual price was set as one-time

## Why This Won't Work

```typescript
// In lib/stripe.ts - createCheckoutSession()
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',  // ← Expects recurring subscription
  // ...
});
```

A one-time payment price cannot be used with `mode: 'subscription'`. This would cause:
- Checkout failures when users select yearly plan
- Webhooks won't fire for subscription events (created, updated, deleted)
- No automatic renewals
- Subscription management won't work in billing portal

## Solution Applied

Created a new **recurring yearly subscription** price:

```bash
✅ Created: price_1Ss9CmRwcyFDEm4soU2ud91p
   Amount: $47.00 CAD/year
   Billing: Recurring (renews annually)
   Product: Annual Premium Service (prod_TpoZJH3zjLRSAz)
```

## Current State

Your "Annual Premium Service" product now has **two** prices:

| Price ID | Type | Amount | Status | Use This? |
|----------|------|--------|--------|-----------|
| `price_1Ss8wDRwcyFDEm4szHZAnWOZ` | One-time | $47.00 CAD | Active | ❌ No (incompatible with subscription mode) |
| `price_1Ss9CmRwcyFDEm4soU2ud91p` | Recurring yearly | $47.00 CAD/year | Active | ✅ Yes (works with subscription mode) |

## Recommendation

**Deactivate the old one-time payment price** to avoid confusion:

### Option 1: Via Stripe Dashboard
1. Go to Products → Annual Premium Service
2. Click on the old price `price_1Ss8wDRwcyFDEm4szHZAnWOZ`
3. Click "⋯" menu → Archive

### Option 2: Via API
```typescript
await stripe.prices.update('price_1Ss8wDRwcyFDEm4szHZAnWOZ', {
  active: false
});
```

## Updated Vercel Environment Variables

You now need to add **5 variables** (not 4):

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1Ss8ucRwcyFDEm4sMgINgKpv
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1Ss9CmRwcyFDEm4soU2ud91p  ← NEW!
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## What This Fixes

✅ **Yearly subscriptions will now work correctly**
- Users can select yearly plan in checkout
- Stripe creates recurring yearly subscription
- Automatic renewal after 1 year
- Subscription webhooks fire correctly:
  - `customer.subscription.created` - User upgraded
  - `customer.subscription.updated` - Status changes
  - `customer.subscription.deleted` - User downgraded

✅ **Billing portal integration**
- Users can manage their yearly subscription
- Can cancel and it will fire `subscription.deleted` webhook
- Your webhook handler will correctly downgrade them to free tier

✅ **Consistent subscription lifecycle**
- Both monthly and yearly work the same way
- Same webhook handling logic applies
- Same cancellation flow

## Pricing Comparison

| Plan | Price | Billing | Annual Cost | Savings |
|------|-------|---------|-------------|---------|
| Monthly | $5.99 CAD | Every month | $71.88 | - |
| Yearly | $47.00 CAD | Every year | $47.00 | **$24.88 (34% off)** |

## Next Steps

1. ✅ New recurring yearly price created
2. ⏳ Add all 5 environment variables to Vercel Production
3. ⏳ Redeploy Vercel (without cache)
4. ⏳ Test both monthly and yearly checkout flows
5. ⏳ Test subscription cancellation for both plans
6. 🔧 Optional: Deactivate old one-time payment price

## Files Updated

- `VERCEL_ENV_SETUP.md` - Updated with yearly price ID
- `VERCEL_ENV_VALUES.txt` - Added 5th variable
- `scripts/create-yearly-subscription-price.ts` - Script to create recurring price
- `STRIPE_ANNUAL_PRICE_FIX.md` - This documentation

## Testing Checklist

After deploying:

**Monthly Subscription:**
- [ ] Go to /subscribe page
- [ ] Click "Get Started" on Monthly plan
- [ ] Complete Stripe checkout with test card: `4242 4242 4242 4242`
- [ ] Verify user upgraded to premium
- [ ] Cancel subscription via Stripe Dashboard or billing portal
- [ ] Verify webhook fires and user downgraded to free

**Yearly Subscription:**
- [ ] Go to /subscribe page
- [ ] Click "Get Started" on Yearly plan
- [ ] Complete Stripe checkout with test card: `4242 4242 4242 4242`
- [ ] Verify user upgraded to premium
- [ ] Cancel subscription via Stripe Dashboard or billing portal
- [ ] Verify webhook fires and user downgraded to free

## Summary

The annual price was misconfigured as a one-time payment, which is incompatible with your subscription-based checkout flow. I created a new recurring yearly price that works correctly with your existing code. Now both monthly ($5.99/month) and yearly ($47/year) plans will work as proper recurring subscriptions with automatic renewals and webhook support.
