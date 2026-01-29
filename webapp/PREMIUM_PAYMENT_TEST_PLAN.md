# Premium Payment Testing Plan (US-024)

**Date**: January 29, 2026
**Status**: 🔄 IN PROGRESS
**Story Points**: 8
**Priority**: P0 (Critical)

## Summary

Comprehensive testing plan for Stripe payment integration, subscription management, webhook handling, and premium feature gating. This covers the entire premium monetization system from checkout to cancellation.

---

## System Overview

### Pricing
- **Monthly**: $5.99/month
- **Yearly**: $47.00/year (21% discount vs monthly)
- **Currency**: USD

### Stripe Integration Components
1. **Checkout Flow** (`/api/subscription/create-checkout`)
2. **Billing Portal** (`/api/subscription/billing-portal`)
3. **Webhook Handler** (`/api/webhooks/stripe`)
4. **Subscription Management** (`lib/subscription.ts`)
5. **Feature Gating** (Various API routes)

---

## Pre-Testing Setup

### Required Environment Variables

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...

# App URL
NEXT_PUBLIC_APP_URL=https://yourapp.com or http://localhost:3000
```

### Verification Steps

```bash
# 1. Verify environment variables are set
[ ] STRIPE_SECRET_KEY set
[ ] STRIPE_PUBLISHABLE_KEY set
[ ] STRIPE_WEBHOOK_SECRET set
[ ] STRIPE_PREMIUM_MONTHLY_PRICE_ID set
[ ] STRIPE_PREMIUM_YEARLY_PRICE_ID set
[ ] NEXT_PUBLIC_APP_URL set

# 2. Verify Stripe Dashboard configuration
[ ] Webhook endpoint configured: /api/webhooks/stripe
[ ] Webhook events enabled (see list below)
[ ] Test mode vs Production mode verified
[ ] Products and prices created
[ ] Customer portal settings configured
```

### Required Webhook Events

Configure in Stripe Dashboard → Webhooks:

```
✓ checkout.session.completed
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_succeeded
✓ invoice.payment_failed
```

---

## Test Categories

### Category 1: Checkout Session Creation

#### TC-1.1: Create Monthly Checkout (Authenticated)
**API**: `POST /api/subscription/create-checkout`
**Request**:
```json
{
  "plan": "monthly"
}
```
**Expected**:
- ✅ Status 200
- ✅ Returns `{ url: string, sessionId: string }`
- ✅ URL points to Stripe Checkout
- ✅ Session ID format: `cs_test_...` or `cs_live_...`

**Verification**:
```bash
curl -X POST http://localhost:3000/api/subscription/create-checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{"plan": "monthly"}'
```

#### TC-1.2: Create Yearly Checkout (Authenticated)
**Request**:
```json
{
  "plan": "yearly"
}
```
**Expected**:
- ✅ Status 200
- ✅ Returns yearly checkout URL
- ✅ Price reflects $47.00 annual plan

#### TC-1.3: Invalid Plan Name
**Request**:
```json
{
  "plan": "quarterly"
}
```
**Expected**:
- ❌ Status 400
- ❌ Error: "Invalid plan. Must be 'monthly' or 'yearly'"

#### TC-1.4: Missing Plan
**Request**:
```json
{}
```
**Expected**:
- ❌ Status 400
- ❌ Error: "Invalid plan"

#### TC-1.5: Unauthenticated Request
**Request**: No session cookie
**Expected**:
- ❌ Status 401
- ❌ Error: "Unauthorized"

#### TC-1.6: Missing Price IDs
**Scenario**: STRIPE_PREMIUM_MONTHLY_PRICE_ID not set
**Expected**:
- ❌ Status 500
- ❌ Error: "Stripe price not configured"

---

### Category 2: Stripe Checkout Flow

#### TC-2.1: Successful Payment - Monthly (Test Mode)
**Test Card**: `4242 4242 4242 4242`
**Steps**:
1. Create checkout session
2. Navigate to Stripe Checkout URL
3. Enter test card details
4. Complete checkout
5. Redirect to success page

**Expected**:
- ✅ Redirects to `/subscribe/success?session_id=cs_...`
- ✅ Webhook `checkout.session.completed` fired
- ✅ Webhook `customer.subscription.created` fired
- ✅ User upgraded to premium in database
- ✅ `subscriptionTier` = `'premium'`
- ✅ `subscriptionStatus` = `'active'`
- ✅ `stripeCustomerId` set
- ✅ `stripeSubscriptionId` set
- ✅ `subscriptionStartDate` set to now

#### TC-2.2: Successful Payment - Yearly (Test Mode)
**Test Card**: `4242 4242 4242 4242`
**Steps**: Same as TC-2.1, but with yearly plan
**Expected**: Same as TC-2.1, with yearly price

#### TC-2.3: Declined Card
**Test Card**: `4000 0000 0000 0002`
**Expected**:
- ❌ Checkout shows card declined error
- ❌ No subscription created
- ❌ User remains on free tier
- ❌ No database changes

#### TC-2.4: Insufficient Funds
**Test Card**: `4000 0000 0000 9995`
**Expected**:
- ❌ Checkout shows insufficient funds error
- ❌ User remains on free tier

#### TC-2.5: 3D Secure Authentication
**Test Card**: `4000 0025 0000 3155`
**Expected**:
- ⚠️ Shows 3D Secure challenge
- ✅ After passing, subscription created
- ✅ User upgraded to premium

#### TC-2.6: Checkout Cancellation
**Steps**:
1. Create checkout session
2. Navigate to Stripe Checkout
3. Click "Back" button
**Expected**:
- ⚠️ Redirects to `/subscribe?cancelled=true`
- ❌ No subscription created
- ❌ User remains on free tier

---

### Category 3: Webhook Handling

#### TC-3.1: `checkout.session.completed`
**Trigger**: Complete Stripe Checkout
**Expected**:
- ✅ Webhook signature verified
- ✅ Event logged: `[STRIPE] New subscription checkout for {email}`
- ✅ Returns 200 `{ received: true }`

#### TC-3.2: `customer.subscription.created`
**Trigger**: New subscription (after checkout)
**Expected**:
- ✅ User upgraded to `subscriptionTier: 'premium'`
- ✅ `subscriptionStatus: 'active'`
- ✅ `stripeCustomerId` saved
- ✅ `stripeSubscriptionId` saved
- ✅ `stripePriceId` saved
- ✅ `subscriptionStartDate` set
- ✅ Logged: `[STRIPE] Updated user {email} to tier=premium, status=active`

#### TC-3.3: `customer.subscription.updated` (Status Change)
**Trigger**: Subscription status changes (e.g., payment fails)
**Scenarios**:
- Active → Past Due
- Active → Unpaid
- Active → Cancelled (with cancel_at_period_end)

**Expected**:
- ✅ Database `subscriptionStatus` updated to match Stripe
- ✅ If `cancel_at_period_end=true`, set `subscriptionEndDate`
- ✅ If `past_due` or `unpaid`, set `subscriptionStatus: 'expired'`

#### TC-3.4: `customer.subscription.deleted`
**Trigger**: Subscription ends (cancelled or failed payments)
**Expected**:
- ✅ User downgraded to `subscriptionTier: 'free'`
- ✅ `subscriptionStatus: 'expired'`
- ✅ `subscriptionEndDate` set to now
- ✅ Logged: `[STRIPE] Downgraded user {email} to free tier`

#### TC-3.5: `invoice.payment_succeeded`
**Trigger**: Successful payment (initial or renewal)
**Expected**:
- ✅ Subscription status updated to 'active' (if it wasn't already)
- ✅ Subscription metadata refreshed
- ✅ Logged: `[STRIPE] Payment succeeded for invoice: {id}`

#### TC-3.6: `invoice.payment_failed`
**Trigger**: Payment fails (expired card, insufficient funds)
**Expected**:
- ⚠️ Subscription status NOT immediately changed (Stripe retries)
- ✅ If `past_due` or `unpaid`, update to `subscriptionStatus: 'expired'`
- ✅ Logged: `[STRIPE] Payment failed for user {email} - retrying`

#### TC-3.7: Invalid Webhook Signature
**Scenario**: POST with invalid/missing signature
**Expected**:
- ❌ Status 400
- ❌ Error: "Invalid signature" or "Missing signature"
- ❌ No database changes

#### TC-3.8: Missing Webhook Secret
**Scenario**: STRIPE_WEBHOOK_SECRET not set
**Expected**:
- ❌ Status 500
- ❌ Error: "Webhook secret not configured"

---

### Category 4: Billing Portal

#### TC-4.1: Access Billing Portal (Premium User)
**API**: `POST /api/subscription/billing-portal`
**Pre-condition**: User has `stripeCustomerId`
**Expected**:
- ✅ Status 200
- ✅ Returns `{ url: string }`
- ✅ URL points to Stripe billing portal
- ✅ Portal shows current subscription, payment method, invoices

#### TC-4.2: Cancel Subscription (via Portal)
**Steps**:
1. Access billing portal
2. Click "Cancel subscription"
3. Confirm cancellation

**Expected**:
- ✅ Subscription set to `cancel_at_period_end=true`
- ✅ Webhook `customer.subscription.updated` fired
- ✅ Database `subscriptionStatus: 'cancelled'`
- ✅ `subscriptionEndDate` set to end of billing period
- ⚠️ User retains premium access until `subscriptionEndDate`

#### TC-4.3: Reactivate Subscription (via Portal)
**Pre-condition**: User cancelled subscription (but still in billing period)
**Steps**:
1. Access billing portal
2. Click "Reactivate subscription"

**Expected**:
- ✅ Subscription `cancel_at_period_end=false`
- ✅ Webhook `customer.subscription.updated` fired
- ✅ Database `subscriptionStatus: 'active'`
- ✅ `subscriptionEndDate` cleared (set to null)

#### TC-4.4: Update Payment Method
**Steps**:
1. Access billing portal
2. Click "Update payment method"
3. Enter new card details

**Expected**:
- ✅ Payment method updated in Stripe
- ✅ Next invoice charged to new card

#### TC-4.5: View Invoices
**Steps**:
1. Access billing portal
2. Click "Invoices" tab

**Expected**:
- ✅ List of all past invoices
- ✅ Download PDF option for each invoice
- ✅ Shows amount, date, status

#### TC-4.6: Billing Portal (No Customer ID)
**Pre-condition**: User has no `stripeCustomerId`
**Expected**:
- ❌ Status 400
- ❌ Error: "No billing account found. Please subscribe to premium first."

#### TC-4.7: Billing Portal (Unauthenticated)
**Request**: No session cookie
**Expected**:
- ❌ Status 401
- ❌ Error: "Unauthorized"

---

### Category 5: Subscription Management Functions

#### TC-5.1: `isPremiumUser()` - Active Premium
**Scenario**:
```typescript
subscriptionTier: 'premium'
subscriptionStatus: 'active'
subscriptionEndDate: null
```
**Expected**: Returns `true`

#### TC-5.2: `isPremiumUser()` - Cancelled (But Still Active)
**Scenario**:
```typescript
subscriptionTier: 'premium'
subscriptionStatus: 'active'
subscriptionEndDate: 2026-02-15 (future date)
```
**Expected**: Returns `true` (until endDate passes)

#### TC-5.3: `isPremiumUser()` - Expired
**Scenario**:
```typescript
subscriptionTier: 'premium'
subscriptionStatus: 'expired'
subscriptionEndDate: 2026-01-01 (past date)
```
**Expected**: Returns `false`

#### TC-5.4: `isPremiumUser()` - Free Tier
**Scenario**:
```typescript
subscriptionTier: 'free'
subscriptionStatus: 'active'
```
**Expected**: Returns `false`

#### TC-5.5: `getUserSubscription()` - Premium User
**Expected**: Returns
```typescript
{
  tier: 'premium',
  status: 'active',
  isPremium: true,
  startDate: Date,
  endDate: null,
  stripeCustomerId: 'cus_...',
  stripeSubscriptionId: 'sub_...'
}
```

#### TC-5.6: `updateSubscriptionTier()` - Upgrade
**Action**: `updateSubscriptionTier(email, 'premium', 'active', stripeData)`
**Expected**:
- ✅ `subscriptionTier` = `'premium'`
- ✅ `subscriptionStatus` = `'active'`
- ✅ `subscriptionStartDate` set to now
- ✅ `subscriptionEndDate` = `null`
- ✅ Stripe metadata saved

#### TC-5.7: `cancelSubscription()` - With End Date
**Action**: `cancelSubscription(email, new Date('2026-02-15'))`
**Expected**:
- ✅ `subscriptionStatus` = `'cancelled'`
- ✅ `subscriptionEndDate` = `2026-02-15`
- ⚠️ `subscriptionTier` remains `'premium'` (until endDate passes)

#### TC-5.8: `expireSubscription()` - Immediate Downgrade
**Action**: `expireSubscription(email)`
**Expected**:
- ✅ `subscriptionTier` = `'free'`
- ✅ `subscriptionStatus` = `'expired'`
- ✅ `subscriptionEndDate` = now

---

### Category 6: Premium Feature Gating

#### TC-6.1: Early Retirement Calculator - Free User (Limit Not Reached)
**API**: `POST /api/early-retirement/calculate`
**Pre-condition**: `earlyRetirementCalcsToday` < 10
**Expected**:
- ✅ Calculation succeeds
- ✅ `earlyRetirementCalcsToday` incremented
- ✅ Response includes calculation results

#### TC-6.2: Early Retirement Calculator - Free User (Limit Reached)
**Pre-condition**: `earlyRetirementCalcsToday` >= 10
**Expected**:
- ❌ Status 403
- ❌ Error message about daily limit
- ❌ Prompt to upgrade to premium

#### TC-6.3: Early Retirement Calculator - Premium User
**Pre-condition**: `isPremium` = true
**Expected**:
- ✅ Unlimited calculations
- ✅ No counter incremented
- ✅ No limit checks

#### TC-6.4: Scenario Save - Free User
**API**: `POST /api/scenarios/save`
**Expected**:
- ❌ Status 403
- ❌ Error: Premium feature required

#### TC-6.5: Scenario Save - Premium User
**Expected**:
- ✅ Scenario saved
- ✅ Returns scenario ID
- ✅ Can retrieve later

#### TC-6.6: CSV Export - Free User
**Component**: `ResultsDashboard` "Export CSV" button
**Expected**:
- ⚠️ Button disabled or shows upgrade prompt
- ❌ No download

#### TC-6.7: CSV Export - Premium User
**Expected**:
- ✅ Button enabled
- ✅ CSV file downloads
- ✅ Contains full simulation data

#### TC-6.8: PDF Report - Free User
**Component**: ResultsDashboard "Download PDF Report" button
**Expected**:
- ⚠️ Button disabled or shows upgrade prompt
- ❌ No download

#### TC-6.9: PDF Report - Premium User
**Expected**:
- ✅ Button enabled
- ✅ PDF file downloads
- ✅ Professional formatting

---

### Category 7: Edge Cases

#### TC-7.1: Concurrent Subscriptions
**Scenario**: User creates two checkout sessions simultaneously
**Expected**:
- ✅ Second checkout creates new customer OR
- ✅ Second checkout reuses first customer
- ⚠️ No duplicate charges

#### TC-7.2: Subscription Renewal (Monthly)
**Scenario**: 30 days after initial subscription
**Expected**:
- ✅ `invoice.payment_succeeded` webhook fires
- ✅ New invoice created
- ✅ Subscription remains active
- ✅ No disruption to premium features

#### TC-7.3: Failed Renewal Payment
**Scenario**: Card expires before renewal
**Expected**:
- ⚠️ `invoice.payment_failed` webhook fires
- ⚠️ Stripe retries payment (3-4 times over 2 weeks)
- ⚠️ User email notified (if configured)
- ❌ If all retries fail: `subscription.deleted` → downgrade to free

#### TC-7.4: Refund Request
**Scenario**: User requests refund within 30 days
**Steps** (via Stripe Dashboard):
1. Find invoice
2. Issue full refund
**Expected**:
- ✅ Refund processed
- ⚠️ Subscription may be cancelled (depends on policy)
- ⚠️ Consider `subscription.deleted` webhook

#### TC-7.5: User Deletes Account (While Premium)
**API**: `DELETE /api/account/delete`
**Pre-condition**: User has active subscription
**Expected**:
- ⚠️ Account deletion should be blocked OR
- ⚠️ Subscription should be cancelled in Stripe first
- ⚠️ User warned about active subscription

#### TC-7.6: Stripe Price Change
**Scenario**: Admin changes price in Stripe Dashboard
**Expected**:
- ⚠️ Existing subscriptions NOT affected (grandfathered)
- ✅ New subscriptions use new price
- ⚠️ Update `STRIPE_PRICE_IDS` if price IDs change

---

## Test Execution Checklist

### Automated Testing

```bash
# Run TypeScript compilation
[ ] npx tsc --noEmit

# Run ESLint
[ ] npx next lint

# Run unit tests (if any)
[ ] npm test

# Run E2E tests
[ ] npx playwright test e2e/premium-features.spec.ts
```

### Manual Testing

#### Setup Phase
- [ ] Verify all environment variables
- [ ] Verify Stripe webhook configuration
- [ ] Create test user account
- [ ] Verify user starts on free tier

#### Checkout Flow
- [ ] TC-2.1: Successful monthly payment
- [ ] TC-2.2: Successful yearly payment
- [ ] TC-2.3: Declined card
- [ ] TC-2.5: 3D Secure authentication
- [ ] TC-2.6: Checkout cancellation

#### Webhook Verification
- [ ] Check Stripe Dashboard → Webhooks → Recent events
- [ ] Verify `checkout.session.completed` succeeded
- [ ] Verify `customer.subscription.created` succeeded
- [ ] Check database: user upgraded to premium
- [ ] Check Next.js logs for webhook processing

#### Billing Portal
- [ ] TC-4.1: Access billing portal
- [ ] TC-4.2: Cancel subscription
- [ ] TC-4.3: Reactivate subscription
- [ ] TC-4.4: Update payment method
- [ ] TC-4.5: View invoices

#### Premium Features
- [ ] TC-6.1: Early retirement calculator (free user, under limit)
- [ ] TC-6.2: Early retirement calculator (free user, limit reached)
- [ ] TC-6.3: Early retirement calculator (premium user, unlimited)
- [ ] TC-6.4: Scenario save (free user, blocked)
- [ ] TC-6.5: Scenario save (premium user, allowed)
- [ ] TC-6.6: CSV export (free user, blocked)
- [ ] TC-6.7: CSV export (premium user, allowed)
- [ ] TC-6.8: PDF report (free user, blocked)
- [ ] TC-6.9: PDF report (premium user, allowed)

#### Edge Cases
- [ ] TC-7.2: Wait 1 month, verify renewal works
- [ ] TC-7.3: Expire card, verify failed payment handling
- [ ] TC-7.4: Issue refund via Stripe Dashboard

---

## Known Issues / Limitations

### Issue #1: Webhook Delivery Failures
**Scenario**: Stripe webhook times out or fails
**Impact**: User may pay but not get upgraded
**Mitigation**:
- Monitor webhook logs in Stripe Dashboard
- Retry failed webhooks manually
- Consider implementing webhook queue with retries
- Add admin tool to manually sync subscriptions

### Issue #2: Subscription Status Lag
**Scenario**: User cancels in Stripe portal, but app shows premium for ~1 minute
**Impact**: Minor UX confusion
**Mitigation**:
- Accept this lag (webhook processing takes time)
- Add loading state when returning from billing portal
- Consider polling subscription status on return

### Issue #3: Multiple Stripe Accounts
**Scenario**: User has different email in Stripe vs app
**Impact**: Subscription may not link correctly
**Mitigation**:
- Use `client_reference_id` in checkout (contains userId)
- Always use `metadata.userEmail` from webhooks
- Validate email matches before upgrading

### Issue #4: Test Mode vs Production Mode
**Scenario**: Developer forgets to switch to production keys
**Impact**: Real users cannot subscribe
**Mitigation**:
- Check for `sk_live_` prefix in production
- Add environment indicator in app (test/prod mode)
- Verify webhook endpoints (test vs production)

---

## Test Data Requirements

### Test Users

```typescript
// Free Tier User
{
  email: "free@test.com",
  subscriptionTier: "free",
  subscriptionStatus: "active",
  earlyRetirementCalcsToday: 0
}

// Premium User (Active)
{
  email: "premium@test.com",
  subscriptionTier: "premium",
  subscriptionStatus: "active",
  stripeCustomerId: "cus_test123",
  stripeSubscriptionId: "sub_test123"
}

// Premium User (Cancelled, but still active)
{
  email: "cancelled@test.com",
  subscriptionTier: "premium",
  subscriptionStatus: "cancelled",
  subscriptionEndDate: 2026-02-15 (future)
}

// Expired Premium User
{
  email: "expired@test.com",
  subscriptionTier: "free",
  subscriptionStatus: "expired",
  subscriptionEndDate: 2026-01-01 (past)
}
```

### Stripe Test Cards

```
✅ Successful payment: 4242 4242 4242 4242
❌ Card declined: 4000 0000 0000 0002
❌ Insufficient funds: 4000 0000 0000 9995
⚠️  3D Secure required: 4000 0025 0000 3155
⚠️  Processing error: 4000 0000 0000 0119
```

---

## Success Criteria

- [ ] All critical test cases (P0) pass
- [ ] Successful monthly subscription flow works end-to-end
- [ ] Successful yearly subscription flow works end-to-end
- [ ] Webhook handlers process all 6 event types correctly
- [ ] Premium feature gating works (free users blocked, premium users allowed)
- [ ] Billing portal allows cancel/reactivate/update payment
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Subscription status syncs correctly between Stripe and database
- [ ] Failed payments handled gracefully (retries, eventual downgrade)
- [ ] Refunds handled correctly

---

## Deliverables

1. **Test Execution Report** - Results of all test cases
2. **Stripe Webhook Log** - Screenshot of successful webhook events
3. **Database Verification** - Screenshot showing subscription data
4. **Premium Feature Screenshots** - Before/after upgrade
5. **Known Issues Documentation** - Any bugs found during testing
6. **Production Deployment Checklist** - Verification steps for go-live

---

## Next Steps After Testing

### If Tests Pass (✅)
1. Document test results
2. Mark US-024 as complete
3. Update Sprint 2 board (20/20 pts complete)
4. Prepare for Sprint 2 review
5. Consider production deployment

### If Tests Fail (❌)
1. Document failing test cases
2. Create bug tickets
3. Prioritize fixes (P0 → P1 → P2)
4. Re-test after fixes
5. Update user story status

---

## Test Execution Notes

**Date Started**: January 29, 2026
**Tester**: Claude Code
**Environment**: Development (localhost:3000 + Stripe Test Mode)
**Status**: 📋 Ready to Execute

_[Add test execution results here as testing progresses]_
