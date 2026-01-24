# Premium Feature Testing Guide

## Overview
This guide helps you manually test the premium feature gating for reporting and CSV exports.

## Prerequisites
- Development server running (`npm run dev`)
- Python API running (`python3 api/main.py`)
- Database with test users (free and premium)

## Test Scenarios

### Scenario 1: Free User Flow

#### Setup
1. Log in as a free tier user (or create a new account)
2. Verify user has `subscriptionTier: 'free'` in database

#### Test Steps

**CSV Export Test:**
1. Navigate to `/simulation`
2. Run a simulation
3. Scroll to year-by-year table
4. Verify button shows "Export CSV (Premium)" with lock icon
5. Click the "Export CSV (Premium)" button
6. **Expected**: UpgradeModal appears with:
   - Title: "Unlock CSV Export"
   - Description about CSV functionality
   - Pricing: $9.99/month
   - 10 premium features listed
   - "Upgrade to Premium" CTA
   - "Maybe Later" option
7. Click "Maybe Later"
8. **Expected**: Modal closes, no CSV download

**PDF Report Test:**
1. In the same simulation results
2. Locate the "Professional Retirement Report" card
3. Verify:
   - "Premium" badge visible next to title
   - Message: "Upgrade to Premium to unlock PDF reports"
   - Button shows "Upgrade for PDF" with lock icon
4. Click the button
5. **Expected**: UpgradeModal appears with:
   - Title: "Unlock Professional PDF Reports"
   - Same pricing and features
6. Click "Upgrade to Premium"
7. **Expected**: Redirects to `/subscribe` page (may show 404 if not created yet)

**Data Export API Test:**
1. Navigate to account settings (if exists) or use curl:
```bash
curl -X GET http://localhost:3001/api/account/export \
  -H "Cookie: token=YOUR_SESSION_TOKEN"
```
2. **Expected**: 403 Forbidden response:
```json
{
  "success": false,
  "error": "Data export is a Premium feature...",
  "upgradeRequired": true
}
```

---

### Scenario 2: Premium User Flow

#### Setup
1. Use database tool to update a user to premium:
```sql
UPDATE "User"
SET "subscriptionTier" = 'premium',
    "subscriptionStatus" = 'active',
    "subscriptionStartDate" = NOW()
WHERE email = 'test@example.com';
```
2. Log in as that user
3. Verify subscription status API returns `isPremium: true`

#### Test Steps

**CSV Export Test:**
1. Navigate to `/simulation`
2. Run a simulation
3. Scroll to year-by-year table
4. Verify button shows "Export CSV" with download icon (no "Premium" text)
5. Click the button
6. **Expected**: CSV file downloads immediately
7. Open CSV file
8. **Expected**: Contains all 38 columns of simulation data

**PDF Report Test:**
1. In the same simulation results
2. Locate the "Professional Retirement Report" card
3. Verify:
   - NO "Premium" badge
   - Standard description text
   - Button shows "Download PDF Report" with download icon
4. Click the button
5. **Expected**: PDF generation starts (loading state)
6. **Expected**: PDF file downloads
7. Open PDF
8. **Expected**: Multi-page professional report with charts and tables

**Data Export API Test:**
1. Use curl or navigate to account settings:
```bash
curl -X GET http://localhost:3001/api/account/export \
  -H "Cookie: token=YOUR_SESSION_TOKEN"
```
2. **Expected**: 200 OK response with JSON download
3. **Expected**: File name: `retirezest-data-export-YYYY-MM-DD.json`
4. Open JSON file
5. **Expected**: Complete user data including assets, income, expenses, scenarios

---

## Subscription Status API Test

**Test Endpoint:**
```bash
# Free user
curl http://localhost:3001/api/user/subscription \
  -H "Cookie: token=FREE_USER_TOKEN"

# Expected response:
{
  "isPremium": false,
  "tier": "free",
  "status": "active"
}
```

```bash
# Premium user
curl http://localhost:3001/api/user/subscription \
  -H "Cookie: token=PREMIUM_USER_TOKEN"

# Expected response:
{
  "isPremium": true,
  "tier": "premium",
  "status": "active"
}
```

---

## Database Queries for Testing

**Create Premium Test User:**
```sql
-- Set existing user to premium
UPDATE "User"
SET
  "subscriptionTier" = 'premium',
  "subscriptionStatus" = 'active',
  "subscriptionStartDate" = NOW(),
  "subscriptionEndDate" = NULL
WHERE email = 'premium@test.com';
```

**Create Free Test User:**
```sql
-- Set existing user to free
UPDATE "User"
SET
  "subscriptionTier" = 'free',
  "subscriptionStatus" = 'active',
  "subscriptionStartDate" = NULL,
  "subscriptionEndDate" = NULL,
  "stripeCustomerId" = NULL,
  "stripeSubscriptionId" = NULL
WHERE email = 'free@test.com';
```

**Check User Subscription:**
```sql
SELECT
  email,
  "subscriptionTier",
  "subscriptionStatus",
  "subscriptionStartDate",
  "subscriptionEndDate"
FROM "User"
WHERE email = 'test@example.com';
```

---

## Common Issues and Solutions

### Issue: Modal doesn't appear when clicking premium features
**Solution**: Check browser console for errors. Verify:
- `isPremium` state is correctly set in simulation page
- `onUpgradeClick` callback is properly passed to components
- UpgradeModal component is rendered in the page

### Issue: CSV/PDF downloads even for free users
**Solution**: Check that:
- `isPremium` prop is being passed to ResultsDashboard and YearByYearTable
- Components are checking `isPremium` before executing export functions
- Database has correct `subscriptionTier` value for the user

### Issue: Subscription status API returns wrong tier
**Solution**:
- Check database values for the user
- Verify `getUserSubscription()` function is working correctly
- Check that session/authentication is working

### Issue: TypeScript errors in console
**Solution**: Run `npx tsc --noEmit` to check for type errors

---

## Visual Indicators Checklist

**Free Users Should See:**
- ✅ Lock icons on premium features
- ✅ "(Premium)" text on buttons
- ✅ "Premium" badge on PDF card
- ✅ Blue premium CTA styling
- ✅ Upgrade messaging in descriptions

**Premium Users Should See:**
- ✅ Download icons (not lock icons)
- ✅ No "(Premium)" text
- ✅ No premium badges
- ✅ Standard button styling
- ✅ Standard feature descriptions

---

## Next Steps After Testing

1. **If tests pass**: Ready for production deployment
2. **If issues found**: Debug and fix, then retest
3. **Create /subscribe page**: Implement Stripe checkout
4. **Update E2E tests**: Add freemium test scenarios
5. **Add analytics**: Track upgrade modal conversions

---

## Notes

- E2E tests have some pre-existing TypeScript warnings (not related to this feature)
- `/subscribe` page doesn't exist yet - will show 404 or Next.js error
- Premium features work completely offline (client-side gating)
- Data export API has server-side verification (cannot be bypassed)
