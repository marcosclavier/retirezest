# Billing Portal Troubleshooting Guide

## Current Status

✅ **Stripe Customer Portal is properly configured and working**
- Test script successfully created billing portal session
- Customer exists in Stripe
- Portal URL generated correctly

## Issue

Getting "Failed to create billing portal session" error when accessing from the web application.

## Diagnostic Test Results

```
✅ Stripe key found
✅ Found test user: juanclavierb@gmail.com
✅ Stripe Customer ID: cus_TpRhfCKhcbS41j
✅ Customer exists in Stripe
✅ Billing portal session created successfully
```

## Likely Causes & Solutions

### 1. Environment Variables Not Loaded in Next.js Runtime

**Problem**: The Next.js dev server might have started before .env.local was created/updated, so STRIPE_SECRET_KEY is not available.

**Solution**:
```bash
# Stop the Next.js dev server
# Then restart it
npm run dev
```

The server should pick up the environment variables on restart.

### 2. Check Browser Console for Detailed Error

**Steps**:
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Try to access the billing portal from `/account/billing`
4. Click "Manage Subscription" button
5. Check for any error messages in the console
6. Check Network tab for the API response

The detailed error message will help identify the exact issue.

### 3. Verify User is Properly Authenticated

**Problem**: The session might be invalid or expired.

**Solution**:
1. Log out and log back in
2. Try accessing `/account/billing` again

### 4. Test API Endpoint Directly

Run this test script to check if the API endpoint works:

```bash
# Create a test script
cat > scripts/test-api-billing-portal.ts << 'EOF'
import 'dotenv/config';

async function testAPI() {
  const baseUrl = 'http://localhost:3001';

  console.log('Testing billing portal API endpoint...\n');

  try {
    const response = await fetch(`${baseUrl}/api/subscription/billing-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your session cookie here if needed
        'Cookie': 'your-session-cookie-here'
      },
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ API working correctly');
    } else {
      console.log('\n❌ API error:', data.error);
      console.log('Details:', data.details);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testAPI();
EOF

# Run the test
npx tsx scripts/test-api-billing-portal.ts
```

### 5. Check Server Logs

Look at the terminal where `npm run dev` is running for any error messages that appear when you try to access the billing portal.

### 6. Verify Stripe Dashboard Configuration

Even though our test worked, double-check that the Customer Portal is enabled:

1. Go to: https://dashboard.stripe.com/test/settings/billing/portal
2. Ensure "Customer portal" is **Active**
3. Check that these settings are enabled:
   - ✅ Update payment methods
   - ✅ Update billing email
   - ✅ Cancel subscriptions
   - ✅ Subscription pausing (optional)

### 7. Check for Multiple Environment Files

Make sure there's no conflicting environment file:

```bash
ls -la | grep "^\.env"
```

If you see multiple `.env` files, they might be conflicting.

## Quick Fix Checklist

1. ✅ Restart Next.js dev server
2. ✅ Clear browser cache and cookies
3. ✅ Log out and log back in
4. ✅ Check browser console for errors
5. ✅ Verify STRIPE_SECRET_KEY is in .env.local
6. ✅ Check server terminal for error logs

## Testing Commands

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Verify environment variables are set
cat .env.local | grep STRIPE

# 3. Restart the dev server
npm run dev

# 4. Test billing portal from the script
set -a && source .env.local && set +a && npx tsx scripts/test-billing-portal-direct.ts
```

## Expected Behavior

When working correctly:
1. User clicks "Manage Subscription" on `/account/billing`
2. Loading spinner appears
3. User is redirected to Stripe's billing portal
4. User can manage their subscription, payment methods, etc.

## If Still Not Working

1. Check the exact error message in:
   - Browser console
   - Network tab (look at the `/api/subscription/billing-portal` request)
   - Server logs
2. Share the complete error message for further diagnosis

## Contact

If the issue persists after trying these steps, the error details from the browser console and server logs will help diagnose the specific problem.
