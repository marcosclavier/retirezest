# Vercel Environment Variables Setup

## ✅ All Required Values Collected

**Date:** January 21, 2026
**Product:** Monthly Premium (`prod_TpoXjnDCWzVPRS`)
**Price:** $5.99 CAD/month

## 📋 Required Environment Variables for Production

Go to **Vercel Dashboard** → **retirezest project** → **Settings** → **Environment Variables**

Set these variables for **Production** environment only:

### 1. STRIPE_WEBHOOK_SECRET ✅
```
whsec_9gG73KlRNjAK0EdNAux5zUx2CRT6kUBp
```
**Source:** From Stripe webhook endpoint (production webhook)

### 2. STRIPE_SECRET_KEY ✅
```
sk_live_...
```
**Source:** Stripe Dashboard (LIVE mode) → Developers → API keys → Secret key (starts with sk_live_)

### 3. STRIPE_PREMIUM_MONTHLY_PRICE_ID ✅
```
price_1Ss8ucRwcyFDEm4sMgINgKpv
```
**Product:** Monthly Premium (prod_TpoXjnDCWzVPRS)
**Price:** $5.99 CAD/month

### 4. STRIPE_PREMIUM_YEARLY_PRICE_ID ✅
```
price_1Ss9CmRwcyFDEm4soU2ud91p
```
**Product:** Annual Premium Service (prod_TpoZJH3zjLRSAz)
**Price:** $47.00 CAD/year (recurring subscription)

### 5. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ✅
```
pk_live_...
```
**Source:** Stripe Dashboard (LIVE mode) → Developers → API keys → Publishable key (starts with pk_live_)

---

## 🚀 After Setting Variables

1. **Redeploy your application:**
   - Go to **Deployments** tab
   - Click on the latest deployment
   - Click the **⋯** menu
   - Select **Redeploy**
   - **UNCHECK** "Use existing Build Cache"
   - Click **Redeploy**

2. **Wait for deployment to complete** (~2-3 minutes)

3. **Test the webhook:**
   - Go to Stripe Dashboard (LIVE mode)
   - Go to **Customers**
   - Find a test customer with active subscription
   - Cancel their subscription
   - Check **Developers** → **Webhooks** → your endpoint → **Events**
   - Should see `customer.subscription.deleted` with ✅ green checkmark

---

## ✅ Checklist

- [x] Get `sk_live_...` from Stripe Dashboard
- [x] Get `price_...` ID from Stripe Products
- [ ] **→ Add all environment variables in Vercel (Production only)** ← YOU ARE HERE
- [ ] Redeploy application (without cache)
- [ ] Test subscription cancellation
- [ ] Verify webhook event succeeded in Stripe
- [ ] Verify user downgraded to free tier in database

---

## 🔍 Verification

After deployment, you can verify the webhook is working by checking Vercel logs:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login
vercel login

# View production logs
vercel logs --prod
```

Look for these log messages when a subscription is cancelled:
```
[STRIPE WEBHOOK] Processing event: customer.subscription.deleted
[STRIPE] Subscription deleted: sub_...
[STRIPE] Downgraded user [email] to free tier
```

---

## ⚠️ Important Notes

1. **Never commit production keys to git!**
2. **Only set these in Vercel Production environment** (not Preview or Development)
3. **Different webhook secrets for different environments:**
   - Local dev: Use Stripe CLI webhook secret
   - Production: Use Stripe dashboard webhook secret (the one above)
4. **Test mode vs Live mode:**
   - Local development: Use test keys (`sk_test_...`, `pk_test_...`)
   - Production (Vercel): Use live keys (`sk_live_...`, `pk_live_...`)

---

## 🆘 Troubleshooting

**Webhook not working after deployment?**
1. Check Vercel logs for errors: `vercel logs --prod`
2. Verify webhook secret matches exactly (no extra spaces)
3. Check Stripe webhook endpoint URL is correct: `https://retirezest.vercel.app/api/webhooks/stripe`
4. Make sure you redeployed after adding environment variables

**Still using test mode?**
1. Verify you copied `sk_live_...` not `sk_test_...`
2. Check Stripe dashboard is in LIVE mode (toggle top right)
3. Redeploy with cache disabled

**Database not updating?**
1. Check subscription has `metadata.userEmail` set
2. Verify DATABASE_URL is set in Vercel
3. Check Vercel logs for database connection errors
