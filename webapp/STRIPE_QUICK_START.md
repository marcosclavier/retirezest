# Stripe Integration - Quick Start Guide

**⏱️ Setup Time: 1 hour**

---

## Prerequisites

- ✅ Code deployed to GitHub/Vercel
- ✅ Stripe account (create at https://stripe.com)
- ✅ Access to Vercel dashboard

---

## Step-by-Step Setup

### 1. Create Stripe Products (15 minutes)

#### Go to Stripe Dashboard
https://dashboard.stripe.com/products

#### Click "Add product"

**Product Details:**
- Name: `RetireZest Premium`
- Description: `Unlock unlimited calculations, advanced scenarios, and premium reports`

#### Add Monthly Price
- Price: `$9.99`
- Billing period: `Monthly`
- Currency: `USD`
- Click "Add price"

**📋 Copy the Price ID** (looks like `price_1AbC2dEfGhIjKlMn`)

Store it as: `STRIPE_PREMIUM_MONTHLY_PRICE_ID`

#### Add Yearly Price
- On same product, click "Add another price"
- Price: `$99.99`
- Billing period: `Yearly`
- Currency: `USD`
- Click "Add price"

**📋 Copy the Price ID**

Store it as: `STRIPE_PREMIUM_YEARLY_PRICE_ID`

---

### 2. Get API Keys (5 minutes)

#### Go to Stripe API Keys
https://dashboard.stripe.com/apikeys

**For Testing:**
- Reveal "Secret key" under "Standard keys (test mode)"
- **📋 Copy:** `sk_test_...`
- Store as: `STRIPE_SECRET_KEY`

**For Production (after testing):**
- Toggle to "Live mode" in Stripe dashboard
- Copy "Secret key"
- Update `STRIPE_SECRET_KEY` with `sk_live_...`

---

### 3. Configure Webhooks (15 minutes)

#### For Development (Stripe CLI)

```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This outputs a webhook secret: `whsec_...`

**📋 Copy and add to `.env.local`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### For Production (Webhook Endpoint)

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://www.retirezest.com/api/webhooks/stripe`
4. Description: `RetireZest Production Webhooks`
5. Click "Select events"

**Select these events:**
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `checkout.session.completed`

6. Click "Add endpoint"
7. Click on the endpoint you just created
8. Click "Reveal" next to "Signing secret"
9. **📋 Copy:** `whsec_...`

---

### 4. Add to Vercel (10 minutes)

#### Go to Vercel Environment Variables
https://vercel.com/[your-username]/retirezest/settings/environment-variables

#### Add These 4 Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Production, Preview |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production, Preview |
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID` | `price_...` | Production, Preview |
| `STRIPE_PREMIUM_YEARLY_PRICE_ID` | `price_...` | Production, Preview |

**Important:** Use test keys first, switch to live keys after testing!

#### Redeploy Application
- Vercel will automatically redeploy
- Or manually trigger: `vercel --prod`

---

### 5. Test in Development (20 minutes)

#### Update `.env.local`

Add these lines (with your actual values):
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
```

#### Start Services

Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### Test Complete Flow

1. Visit: http://localhost:3000/subscribe
2. Click "Get Started" on Monthly plan
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. ZIP: Any 5 digits
7. Complete checkout
8. Verify redirect to success page
9. Check terminal for webhook events
10. Verify dashboard shows premium features

#### Verify in Database

```bash
# Connect to database
psql $DATABASE_URL

# Check user subscription
SELECT email, "subscriptionTier", "subscriptionStatus", "stripeCustomerId"
FROM "User"
WHERE email = 'your-test-email@example.com';

# Should show: subscriptionTier = "premium"
```

---

### 6. Test in Production (Test Mode) (15 minutes)

1. **Verify test keys in Vercel** (should already be set)
2. **Visit production:** https://www.retirezest.com/subscribe
3. **Test checkout** with same test card
4. **Verify webhooks** in Stripe Dashboard:
   - Go to: https://dashboard.stripe.com/webhooks
   - Click on your production webhook
   - Check "Recent events" - should show successful deliveries
5. **Check Vercel logs** for webhook processing
6. **Verify user upgraded** in production database

---

### 7. Switch to Live Mode (10 minutes)

⚠️ **Only after successful testing!**

1. **Go to Stripe Dashboard**
2. **Toggle to "Live mode"** (top left switch)
3. **Create live products** (repeat Step 1)
4. **Copy live API key** (starts with `sk_live_`)
5. **Create live webhook** (repeat Step 3 - Production section)
6. **Update Vercel environment variables:**
   - Replace `STRIPE_SECRET_KEY` with `sk_live_...`
   - Replace `STRIPE_WEBHOOK_SECRET` with new live webhook secret
   - Replace price IDs with live price IDs
7. **Redeploy**
8. **Test with real card** (can refund immediately)

---

## Verification Checklist

### Development Testing ✅

- [ ] Stripe CLI installed and logged in
- [ ] `.env.local` has all 4 Stripe variables
- [ ] Dev server running
- [ ] Webhook forwarding active
- [ ] Can access /subscribe page
- [ ] Can complete checkout with test card
- [ ] Redirects to /subscribe/success
- [ ] User upgraded to premium in database
- [ ] Premium features unlocked
- [ ] Can access /account/billing
- [ ] Can open billing portal
- [ ] Can cancel subscription

### Production Testing (Test Mode) ✅

- [ ] Test keys configured in Vercel
- [ ] Production webhook created and verified
- [ ] Can complete checkout on live site
- [ ] Webhooks received (check Stripe dashboard)
- [ ] User upgraded in production database
- [ ] No errors in Vercel logs
- [ ] Billing portal works

### Production Launch (Live Mode) ✅

- [ ] Live keys configured
- [ ] Live products created
- [ ] Live webhook configured
- [ ] Tested with real card
- [ ] All features work
- [ ] Monitoring active
- [ ] Support ready

---

## Quick Reference

### Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Declined |

### Key URLs

| Page | URL |
|------|-----|
| Subscribe | `/subscribe` |
| Success | `/subscribe/success` |
| Billing | `/account/billing` |
| Webhook | `/api/webhooks/stripe` |

### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
```

### Stripe CLI Commands

```bash
# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger customer.subscription.created

# View recent events
stripe events list --limit 10
```

---

## Troubleshooting

### "No checkout URL returned"
- Check `STRIPE_SECRET_KEY` is set
- Verify price IDs are correct
- Restart dev server

### "Webhook signature verification failed"
- Copy correct signing secret from Stripe
- Update `STRIPE_WEBHOOK_SECRET`
- Restart Stripe CLI or redeploy

### "User not premium after checkout"
- Check webhook endpoint URL
- Verify webhook events selected
- Check Vercel function logs
- Test: `stripe trigger customer.subscription.created`

---

## Support

### Documentation
- Full setup guide: `STRIPE_INTEGRATION_COMPLETE.md`
- Implementation details: `STRIPE_PAYMENT_IMPLEMENTATION_SUMMARY.md`

### Stripe Resources
- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

### Application Logs
- Vercel: https://vercel.com/[username]/retirezest/logs
- Look for: `[STRIPE WEBHOOK]`, `[STRIPE CHECKOUT ERROR]`

---

## Success!

Once all checklists are complete, your Stripe integration is live! Users can now:

✅ Subscribe to premium ($9.99/month or $99.99/year)
✅ Manage their subscriptions
✅ Access premium features automatically
✅ Receive proper billing and invoicing

**Estimated setup time:** 1 hour
**Status after setup:** Fully operational subscription system

---

**Last Updated:** January 20, 2026
**Quick Start Guide** - Follow steps 1-7 in order for fastest setup
