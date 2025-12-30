# Wizard CSRF Token Fix

## Problem
Users encountered "Failed to save assets. Please try again." error when using the onboarding wizard.

## Root Cause
The wizard steps were making POST requests to `/api/profile/*` endpoints without including CSRF tokens. The middleware requires CSRF tokens for all mutation requests to protected API routes.

### Middleware Configuration
```typescript
// middleware.ts:59-64
const PROTECTED_API_ROUTES = [
  '/api/profile',  // ← All routes starting with /api/profile require CSRF
  '/api/scenarios',
  '/api/projections',
  '/api/simulation',
];
```

## Solution
Added CSRF token initialization and headers to 4 wizard step components:

### 1. AssetsStep.tsx
**Location:** `app/(dashboard)/onboarding/wizard/steps/AssetsStep.tsx`

**Changes:**
- Added CSRF token state (line 35)
- Added token initialization useEffect (lines 37-50)
- Added `'x-csrf-token': csrfToken` header to fetch requests (line 157)
- Improved error handling with detailed error messages (lines 163-166)

### 2. IncomeStep.tsx
**Location:** `app/(dashboard)/onboarding/wizard/steps/IncomeStep.tsx`

**Changes:**
- Added CSRF token state (line 32)
- Added token initialization useEffect (lines 34-47)
- Added `'x-csrf-token': csrfToken` header to fetch requests (line 129)
- Improved error handling with detailed error messages (lines 135-138)

### 3. ExpensesStep.tsx
**Location:** `app/(dashboard)/onboarding/wizard/steps/ExpensesStep.tsx`

**Changes:**
- Added CSRF token state (line 32)
- Added token initialization useEffect (lines 34-47)
- Added `'x-csrf-token': csrfToken` header to fetch requests (line 78)
- Improved error handling with detailed error messages (lines 90-93)

### 4. PartnerIncomeStep.tsx
**Location:** `app/(dashboard)/onboarding/wizard/steps/PartnerIncomeStep.tsx`

**Changes:**
- Added CSRF token state (line 32)
- Added token initialization useEffect (lines 34-47)
- Added `'x-csrf-token': csrfToken` header to fetch requests (line 129)
- Improved error handling with detailed error messages (lines 135-138)

## Implementation Pattern
Each step follows the same pattern used in other protected components:

```typescript
const [csrfToken, setCsrfToken] = useState<string>('');

// Initialize CSRF token on mount
useEffect(() => {
  const initCsrf = async () => {
    try {
      const response = await fetch('/api/csrf');
      const data = await response.json();
      setCsrfToken(data.token);
      console.log('[CSRF] Token initialized');
    } catch (error) {
      console.error('[CSRF] Failed to initialize token:', error);
    }
  };
  initCsrf();
}, []);

// Include token in POST requests
const response = await fetch('/api/profile/assets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

## Testing

### Automated Test
Run the test script:
```bash
npx tsx scripts/test-wizard-csrf.ts
```

Expected output:
- ✅ CSRF token endpoint working
- ✅ Endpoints properly protected (403 without token)

### Manual Testing Steps
1. Start the dev server: `npm run dev`
2. Open http://localhost:3003 in browser
3. Register a new user or log in
4. Navigate to the wizard: http://localhost:3003/onboarding/wizard
5. Complete each step:
   - Personal Information ✓
   - Partner Information ✓ (if applicable)
   - Retirement Goals ✓
   - Income Sources ✓
   - Assets & Accounts ✓ (previously failing - now fixed)
   - Monthly Expenses ✓
   - Partner Income ✓ (if applicable)
   - Review & Complete ✓

### Expected Behavior
- ✅ No "Failed to save" errors
- ✅ Data successfully saved to database
- ✅ Wizard progression works smoothly
- ✅ Console shows `[CSRF] Token initialized` for each step

## Related Files
- `middleware.ts` - CSRF validation logic
- `lib/csrf-edge.ts` - CSRF token validation
- `app/api/csrf/route.ts` - CSRF token generation endpoint
- `app/api/profile/assets/route.ts` - Asset API endpoint
- `app/api/profile/income/route.ts` - Income API endpoint
- `app/api/profile/expenses/route.ts` - Expenses API endpoint

## Security Notes
- CSRF tokens are session-specific and expire
- Tokens are validated by edge middleware before reaching API routes
- Protected routes reject requests without valid tokens (403 Forbidden)
- Authentication is still required separately (401 Unauthorized)

## Status
✅ **FIXED** - All wizard steps now properly include CSRF tokens
