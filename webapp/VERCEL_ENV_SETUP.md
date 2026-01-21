# Vercel Environment Variables Setup

## ✅ Webhook Secret Received
```
whsec_diihzeGDVpkG8Ii3l7vtWrC1HAy1DFX2
```

## 📋 Required Environment Variables for Production

Go to **Vercel Dashboard** → **retirezest project** → **Settings** → **Environment Variables**

Set these variables for **Production** environment only:

### 1. STRIPE_WEBHOOK_SECRET
```
whsec_diihzeGDVpkG8Ii3l7vtWrC1HAy1DFX2
```
**Source:** From Stripe webhook endpoint you just created

### 2. STRIPE_SECRET_KEY
```
sk_live_...
```
**Where to get it:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure toggle says "LIVE" (top right)
3. Go to **Developers** → **API keys**
4. Copy the **Secret key** (starts with `sk_live_`)

### 3. STRIPE_PREMIUM_MONTHLY_PRICE_ID
```
price_...
```
**Where to get it:**
1. In Stripe Dashboard (LIVE mode)
2. Go to **Products**
3. Click on "RetireZest Premium" (or your premium product)
4. Copy the **Price ID** from the monthly price (starts with `price_`)

### 4. STRIPE_PREMIUM_YEARLY_PRICE_ID (if you have one)
```
price_...
```
**Where to get it:**
- Same as above, but for yearly price
- If you don't have a yearly price, you can skip this or set it to the same as monthly

### 5. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (if used in frontend)
```
pk_live_...
```
**Where to get it:**
1. Stripe Dashboard (LIVE mode) → **Developers** → **API keys**
2. Copy the **Publishable key** (starts with `pk_live_`)

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

- [ ] Get `sk_live_...` from Stripe Dashboard
- [ ] Get `price_...` ID from Stripe Products
- [ ] Add all 4-5 environment variables in Vercel (Production only)
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
