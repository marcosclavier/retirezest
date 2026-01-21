# Stripe Production Setup Guide

## Current Issue

Your application is using **Stripe test mode** keys, but you've switched to production in the Stripe dashboard. Subscription cancellations (and other webhook events) are not working because:

1. Local environment is using `sk_test_...` keys
2. Production (Vercel) needs to be configured with `sk_live_...` keys
3. Production webhook endpoint needs to be registered in Stripe

## Step-by-Step Fix

### Step 1: Get Your Live API Keys from Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Make sure you're in LIVE mode** (toggle in top right should say "LIVE")
3. Go to **Developers** → **API keys**
4. Copy these keys:
   - **Secret key** (starts with `sk_live_...`)
   - **Publishable key** (starts with `pk_live_...`)

### Step 2: Set Up Production Webhook

1. In Stripe Dashboard (LIVE mode), go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your production URL: `https://retirezest.vercel.app/api/webhooks/stripe`
4. Click **Select events** and choose:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted` ← **Critical for cancellations!**
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `checkout.session.completed`
5. Click **Add endpoint**
6. Click on the newly created endpoint
7. Click **Reveal** next to **Signing secret**
8. Copy the signing secret (starts with `whsec_...`)

### Step 3: Get Your Live Price IDs

1. In Stripe Dashboard (LIVE mode), go to **Products**
2. Find your "RetireZest Premium" product
3. Click on it
4. Copy the **Price ID** for the monthly price (starts with `price_...`)
5. If you have a yearly price, copy that too

### Step 4: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **retirezest** project
3. Go to **Settings** → **Environment Variables**
4. Update/Add these variables for **Production** environment:

```bash
STRIPE_SECRET_KEY=sk_live_...  # Your LIVE secret key from Step 1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Your LIVE publishable key from Step 1
STRIPE_WEBHOOK_SECRET=whsec_...  # Your webhook signing secret from Step 2
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...  # Your LIVE price ID from Step 3
```

**IMPORTANT:** Make sure these are set for the **Production** environment only, not Preview or Development.

### Step 5: Redeploy

After updating the environment variables:

1. Go to your Vercel project
2. Go to **Deployments**
3. Find the latest deployment
4. Click the **⋯** menu
5. Click **Redeploy**
6. Make sure **Use existing Build Cache** is UNCHECKED
7. Click **Redeploy**

### Step 6: Test the Webhook

#### Test Subscription Cancellation:

1. Create a test subscription in LIVE mode:
   - Go to your production app
   - Subscribe with a real test card (use `4242 4242 4242 4242`)

2. Cancel the subscription:
   - Go to Stripe Dashboard (LIVE mode) → **Customers**
   - Find the test customer
   - Click on their subscription
   - Click **Actions** → **Cancel subscription**
   - Choose "Cancel immediately"

3. Verify the webhook was received:
   - In Stripe Dashboard, go to **Developers** → **Webhooks**
   - Click on your production endpoint
   - Check the **Events** tab
   - You should see `customer.subscription.deleted` event with a ✅ green checkmark

4. Verify in your database:
   ```sql
   SELECT email, subscription_tier, subscription_status
   FROM users
   WHERE email = 'your-test-email@example.com';
   ```
   - Should show `subscription_tier: 'free'` and `subscription_status: 'expired'`

## Webhook Events Handled

Your webhook endpoint handles these events:

| Event | What It Does |
|-------|-------------|
| `customer.subscription.created` | Upgrades user to premium when subscription starts |
| `customer.subscription.updated` | Updates subscription status (active, cancelled, etc.) |
| **`customer.subscription.deleted`** | **Downgrades user to free tier when subscription ends** |
| `invoice.payment_succeeded` | Confirms payment and ensures subscription is active |
| `invoice.payment_failed` | Marks subscription as past_due/expired if payment fails |
| `checkout.session.completed` | Logs successful checkout (actual upgrade happens via subscription.created) |

## Troubleshooting

### Webhook not receiving events

1. **Check webhook URL is correct:**
   - Should be: `https://retirezest.vercel.app/api/webhooks/stripe`
   - NOT: `https://retirezest.vercel.app/api/webhook/stripe` (no 's')

2. **Check webhook secret:**
   - In Vercel, verify `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe webhook endpoint
   - Secrets are different for each webhook endpoint!

3. **Check Stripe is in LIVE mode:**
   - Toggle in top-right of Stripe dashboard should say "LIVE" not "TEST"

4. **Check Vercel environment:**
   - Variables should be set for **Production** environment
   - After changing variables, you must redeploy

### Subscription not cancelling

1. **Check Vercel logs:**
   ```bash
   # Via Vercel CLI
   vercel logs --prod
   ```
   - Look for `[STRIPE WEBHOOK] Subscription deleted: sub_...`
   - Look for `[STRIPE] Downgraded user ... to free tier`

2. **Check for errors:**
   - Look for `[STRIPE WEBHOOK ERROR]` in logs
   - Check if `userEmail` is in subscription metadata

3. **Manually test webhook:**
   - In Stripe Dashboard → Webhooks → your endpoint
   - Click **Send test webhook**
   - Select `customer.subscription.deleted`
   - Click **Send test webhook**

### Database not updating

1. **Check subscription has userEmail in metadata:**
   ```typescript
   // When creating subscription in checkout
   metadata: {
     userEmail: user.email  // Must be set!
   }
   ```

2. **Check database connection:**
   - Verify `DATABASE_URL` is set in Vercel
   - Check Neon database is accepting connections

## Local Development

For local development, you can keep using test mode:

1. **Keep test keys in .env.local:**
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Use Stripe CLI for local webhooks:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   - This gives you a webhook secret (whsec_...) for local testing
   - Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

3. **Test cancellations locally:**
   - Use test credit card: `4242 4242 4242 4242`
   - Cancel via Stripe test dashboard
   - Webhook events will forward to your local server

## Security Checklist

- ✅ Never commit `.env.local` to git (it's in `.gitignore`)
- ✅ Never expose `sk_live_...` keys publicly
- ✅ Always verify webhook signatures (already implemented in `/app/api/webhooks/stripe/route.ts`)
- ✅ Use environment variables for all secrets (never hardcode)
- ✅ Different webhook secrets for production vs local development

## Current Setup Status

- ✅ Webhook handler code: **Implemented correctly**
- ✅ Event handling: **`customer.subscription.deleted` is handled**
- ⚠️ Environment variables: **Using test keys (needs update)**
- ⚠️ Production webhook: **Needs to be set up in Stripe dashboard**

## Next Steps

1. [ ] Get live API keys from Stripe dashboard
2. [ ] Set up production webhook endpoint in Stripe
3. [ ] Update Vercel environment variables with live keys
4. [ ] Redeploy Vercel application
5. [ ] Test subscription cancellation in production
6. [ ] Verify webhook events are received
7. [ ] Verify database is updated correctly

---

**Questions?**
- Stripe Docs: https://stripe.com/docs/webhooks
- Vercel Env Vars: https://vercel.com/docs/environment-variables
