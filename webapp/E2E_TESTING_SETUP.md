# E2E Testing Setup for RetireZest

## Current Status

✅ **Completed:**
- Created comprehensive E2E test suite for Early Retirement Calculator (13 tests)
- Configured Playwright test infrastructure
- Implemented E2E test mode bypass on backend (`lib/turnstile.ts`)
- Added E2E test mode detection to login page (`app/(auth)/login/page.tsx`)
- Created `.env.test` configuration file
- Updated `playwright.config.ts` to set environment variables

⚠️ **Partial:**
- Tests can force-click the login button but authentication still fails
- Environment variables not properly propagating to Next.js at build/runtime

## Test Suite Overview

**Location:** `e2e/early-retirement.spec.ts`

**Test Coverage (13 tests):**
1. Page loading verification
2. Loading state and results display
3. All 5 main components visibility
4. Functional age slider
5. Action plan with priorities
6. Navigation links
7. Scenario comparison with success rates
8. Refresh button functionality
9. Missing profile data handling
10. Monetary value formatting
11. Call-to-action for full simulation
12. Network error handling (edge case)
13. Mobile responsiveness (edge case)

## The Challenge: Turnstile (CAPTCHA) in Automated Tests

Cloudflare Turnstile blocks automated tests by disabling the login button until verification completes. This prevents Playwright from logging in.

### What We've Implemented

**Backend Bypass** (`lib/turnstile.ts:35-41`):
```typescript
export async function verifyTurnstile(token: string, remoteIp?: string) {
  // Bypass Turnstile in E2E test mode
  if (process.env.E2E_TEST_MODE === 'true') {
    return {
      success: true,
      challengeTimestamp: new Date().toISOString(),
      hostname: 'localhost',
    };
  }
  // ... normal verification
}
```

**Frontend Bypass** (`app/(auth)/login/page.tsx:18-31`):
```typescript
const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

useEffect(() => {
  // In E2E test mode, automatically set a fake token to allow login
  if (isE2ETestMode) {
    setTurnstileToken('e2e-test-token');
    return;
  }
  // ... normal Turnstile setup
}, [turnstileSiteKey, isE2ETestMode]);

// Hide Turnstile widget in E2E mode
{!isE2ETestMode && (
  <Turnstile ... />
)}
```

**Playwright Configuration** (`playwright.config.ts:76-84`):
```typescript
webServer: {
  command: process.platform === 'win32'
    ? 'set E2E_TEST_MODE=true&& set NEXT_PUBLIC_E2E_TEST_MODE=true&& npm run dev'
    : 'E2E_TEST_MODE=true NEXT_PUBLIC_E2E_TEST_MODE=true npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
},
```

## The Problem: Environment Variables Not Propagating

### Why Current Setup Doesn't Work

1. **NEXT_PUBLIC_* Variables Are Build-Time**: Next.js embeds `NEXT_PUBLIC_*` environment variables at build time, not runtime
2. **Server Reuse**: Playwright's `reuseExistingServer` option reuses an existing dev server that was started without E2E_TEST_MODE
3. **Even Without Reuse**: The client bundle was already built without the environment variables

### Current Workaround in Tests

Tests use `force: true` to click the disabled login button:
```typescript
await page.click('button[type="submit"]', { force: true });
```

This bypasses the client-side check, but the server-side API still rejects login because `E2E_TEST_MODE` isn't set.

## Solutions (Choose One)

### Option A: Temporary .env.local Configuration (Easiest)

**Steps:**
1. Edit `.env.local` and add:
   ```
   E2E_TEST_MODE=true
   NEXT_PUBLIC_E2E_TEST_MODE=true
   ```

2. Stop your dev server (Ctrl+C)

3. Restart the dev server:
   ```bash
   npm run dev
   ```

4. In a new terminal, run tests:
   ```bash
   npx playwright test early-retirement.spec.ts --project=chromium
   ```

5. **IMPORTANT**: Remove these variables from `.env.local` when done testing!

**Pros:**
- Simple, works immediately
- No code changes needed

**Cons:**
- Easy to forget to remove (security risk if deployed)
- Manual process
- Not suitable for CI/CD

### Option B: Global Setup with Saved Authentication (Recommended)

Use Playwright's global setup to authenticate once and save the session state.

**Steps:**

1. Update `playwright.config.ts` to remove E2E_TEST_MODE from webServer:
   ```typescript
   webServer: {
     command: 'npm run dev',
     url: 'http://localhost:3000',
     reuseExistingServer: !process.env.CI,
     timeout: 120 * 1000,
   },
   globalSetup: './e2e/global-setup.ts',
   ```

2. The `e2e/global-setup.ts` already exists and handles login

3. Update test files to use the saved auth state:
   ```typescript
   import { test, expect } from '@playwright/test';

   test.use({ storageState: 'playwright/.auth/user.json' });

   test.describe('Early Retirement Calculator', () => {
     test.beforeEach(async ({ page }) => {
       // Already authenticated, just navigate
       await page.goto('/early-retirement');
       await page.waitForLoadState('domcontentloaded');
     });
     // ... tests
   });
   ```

4. Run tests:
   ```bash
   npx playwright test early-retirement.spec.ts --project=chromium
   ```

**Pros:**
- No security bypass needed
- Works in CI/CD
- Reusable for all tests
- Best practice approach

**Cons:**
- Requires initial manual login (one-time)
- Slightly more setup

### Option C: Test-Specific Build Script

Create a separate npm script that builds with E2E mode enabled.

**Steps:**

1. Add to `package.json`:
   ```json
   {
     "scripts": {
       "dev:test": "E2E_TEST_MODE=true NEXT_PUBLIC_E2E_TEST_MODE=true next dev"
     }
   }
   ```

2. Update `playwright.config.ts`:
   ```typescript
   webServer: {
     command: 'npm run dev:test',
     url: 'http://localhost:3000',
     reuseExistingServer: false, // Always start fresh for tests
     timeout: 120 * 1000,
   },
   ```

3. Run tests:
   ```bash
   npx playwright test early-retirement.spec.ts --project=chromium
   ```

**Pros:**
- Environment variables properly set
- Automated
- Works in CI/CD

**Cons:**
- Always starts a new server (slower)
- Need to ensure dev server isn't already running

### Option D: Mock Turnstile API (Advanced)

Intercept and mock Turnstile API calls in tests.

**Steps:**

1. Add to test setup:
   ```typescript
   test.beforeEach(async ({ page }) => {
     // Mock Turnstile verification endpoint
     await page.route('**/siteverify*', route => {
       route.fulfill({
         status: 200,
         body: JSON.stringify({
           success: true,
           'error-codes': [],
         }),
       });
     });

     await page.goto('/login');
     // ... rest of login
   });
   ```

**Pros:**
- No code changes to application
- Works anywhere
- Tests actual Turnstile integration

**Cons:**
- Complex setup
- Requires understanding Turnstile API
- More brittle (API changes break tests)

## Recommended Approach

**For Development**: Use **Option B (Global Setup)** - it's the most robust and follows Playwright best practices.

**For Quick Testing**: Use **Option A** if you just want to verify the tests work right now (but remember to remove the env vars!).

## Running the Tests

Once you've chosen and implemented a solution:

### Run All Early Retirement Tests
```bash
npx playwright test early-retirement.spec.ts
```

### Run Single Test
```bash
npx playwright test early-retirement.spec.ts -g "should load the early retirement calculator page"
```

### Run in UI Mode (Interactive)
```bash
npx playwright test early-retirement.spec.ts --ui
```

### Run with Debugging
```bash
npx playwright test early-retirement.spec.ts --debug
```

### Run on Specific Browser
```bash
npx playwright test early-retirement.spec.ts --project=chromium
npx playwright test early-retirement.spec.ts --project=firefox
npx playwright test early-retirement.spec.ts --project=webkit
```

## Test Results

View results in:
- Terminal output (real-time)
- HTML report: `npx playwright show-report`
- JSON results: `test-results/results.json`

## Known Test User Credentials

**Email:** `test@example.com`
**Password:** `Test123!`

This user should have complete profile data for testing all calculator functionality.

## Next Steps

1. Choose one of the solution options above
2. Implement the chosen solution
3. Run the E2E tests to verify they pass
4. If tests fail, check:
   - Dev server is running
   - Test user exists and has profile data
   - Environment variables are set (if using Options A or C)
   - Global setup completed successfully (if using Option B)

## Additional Resources

- **Playwright Docs**: https://playwright.dev/docs/auth
- **Next.js Environment Variables**: https://nextjs.org/docs/basic-features/environment-variables
- **Turnstile Docs**: https://developers.cloudflare.com/turnstile/

## Manual Testing Reference

For manual testing results, see: `EARLY_RETIREMENT_TEST_RESULTS.md`

All 39 manual test cases passed with 100% success rate.
