# Simulation Bugs and User Drop-off Report
**Generated:** January 10, 2026
**Severity:** CRITICAL
**Impact:** 72% of users with financial data never run simulations

---

## Executive Summary

**Root Cause of User Drop-off:**
- **18 out of 25 users (72%)** with assets have NEVER run a simulation
- **15 of those 18 (83%)** have complete data (assets, income, AND expenses)
- Users are completing onboarding and adding all their financial data, then **abandoning the application before ever seeing simulation results**

This is **NOT a marketing problem**. This is a **CRITICAL USER EXPERIENCE / TECHNICAL ISSUE**.

---

## Critical Findings

### Finding #1: Mass User Abandonment at Simulation Step
**Evidence:**
```
Total Users with Assets: 25
Users with ZERO simulations: 18 (72%)
Users with 1-2 simulations: 3 (12%)
Users with 3+ simulations: 4 (16%)
```

**Users with ALL data (assets + income + expenses) who never simulated:** 15 users

**Impact:** Users are investing significant time to input their financial data, then leaving without getting value from the application.

---

### Finding #2: No Clear Path from Onboarding to Simulation
**Location:** Onboarding Wizard → Simulation Page transition

**Issue:** After completing the onboarding wizard and adding assets, users are not being automatically directed to run their first simulation or given a clear CTA to do so.

**Evidence:**
- `app/(dashboard)/onboarding/wizard/page.tsx` - After adding assets, users see "Continue to Dashboard"
- Dashboard does NOT prominently feature "Run Simulation" or automatically trigger simulation
- Users must manually navigate to /simulation page

**Expected Behavior:**
1. User completes asset setup in wizard
2. Wizard says "Great! Now let's see your retirement projection"
3. Automatically redirect to `/simulation?mode=quick` or show prominent CTA

**Current Behavior:**
1. User completes asset setup
2. Sees generic dashboard
3. Must discover simulation page themselves
4. 72% never find it or don't understand they need to run it

---

### Finding #3: Simulation Page UX Issues

**Location:** `app/(dashboard)/simulation/page.tsx`

**Issues Identified:**

#### A. Too Much Friction to First Simulation
- Simulation page shows massive form with 50+ fields
- Even with prefill, users see complex accordion sections
- "Smart Start" card exists but may not be prominent enough
- No clear "Just run it with my data" button

**User Psychology:** Users who just spent 10 minutes entering assets don't want to see another huge form. They want to see **results**.

#### B. Strategy Field Not Pre-Selected Intelligently
**Location:** `app/(dashboard)/simulation/page.tsx` line 533, `app/api/simulation/prefill/route.ts`

**Bug:** The withdrawal strategy defaults to whatever is in `defaultHouseholdInput.strategy` or localStorage. There's no intelligent default based on:
- User's age
- Asset mix (TFSA vs RRSP vs RRIF vs Non-Reg)
- Account balances
- Income sources

**Impact:** Users may get suboptimal strategies that don't match their situation, leading to poor health scores that don't reflect reality.

**Fix Needed:** Implement smart default strategy selection:
- If user has large RRIF balance → suggest "rrif-frontload"
- If user has large TFSA → suggest "tfsa-first"
- If user is young and has time → suggest "tax-efficient-balanced"
- If user has high income → suggest "minimize-income"

#### C. localStorage Overriding Database Data
**Location:** `app/(dashboard)/simulation/page.tsx` lines 82-99

**Bug:** On page load, the simulation page:
1. First loads from localStorage (lines 82-96)
2. Then tries to merge with database via prefill (lines 127-178)

**Impact:** If user has stale data in localStorage from a previous session, it can override fresh database data, leading to:
- Incorrect asset balances
- Wrong strategy selection
- Stale expense/income data

**Evidence:** Juan's simulation #5 on Jan 5 got health score of 40, but same strategy on Jan 6 got 100. This suggests a data loading bug was present and may have been partially fixed.

#### D. "Reload from Profile" Button Confusing
**Location:** `app/(dashboard)/simulation/page.tsx` lines 479-588

**Bug:** The "Reload from Profile" button tries to preserve custom settings while reloading database data, but the logic is complex and may not work as expected.

**User Impact:** Users don't understand when to use this button vs just running simulation. It's unclear what it does.

**Fix Needed:** Remove this button or make it clearer (e.g., "Reset to Latest Profile Data")

---

### Finding #4: Missing Onboarding Completion Step
**Location:** `app/(dashboard)/onboarding/wizard/page.tsx`

**Current Flow:**
1. User completes wizard
2. Sets `onboardingCompleted = true`
3. Redirects to dashboard
4. User is on their own to discover simulation

**Recommended Flow:**
1. User completes wizard
2. Shows success screen: "Your profile is ready! Let's see your retirement projection..."
3. Big button: "See My Retirement Plan" → redirects to `/simulation?mode=quick`
4. Auto-runs quick simulation with smart defaults
5. Shows results immediately
6. Then offers "Customize Your Plan" to adjust details

---

### Finding #5: Calculation Issues (Secondary)

**Evidence from Juan's data:**
- Simulation #5 (Jan 5): Health score 40 with rrif-frontload strategy
- Simulation #3 (Jan 6): Health score 100 with same strategy and data
- Simulations #1-2 (Jan 10): Health score 100

**Hypothesis:** There was a calculation bug that has since been fixed, but some users may have encountered it during Dec 25 - Jan 5 timeframe and abandoned the app after seeing nonsensical results.

**Location to investigate:**
- Python simulation engine (port 8000)
- Health score calculation logic
- Year-by-year projection calculations

---

## Data Supporting Analysis

### User Activity Timeline
```
Dec 17-25: 8 new users registered, added assets, 0 simulations
Dec 26-31: 10 new users registered, added assets, 1 simulation (Turkish Ahorros)
Jan 1-3:   12 new registrations
Jan 4:     1 simulation (Florian)
Jan 5:     40 simulations (Juan testing - found bugs)
Jan 6:     5 simulations (Juan - bugs fixed)
Jan 7:     1 simulation (Turkish)
Jan 8-10:  0 activity
```

**Pattern:** Users register, add data, then stop. Very few ever simulate.

### Dormant Users with Complete Data

Examples of users who have **everything** but never simulated:

1. **uriah@mccann.one** - 12 assets, 5 income sources, 9 expenses - **0 simulations**
2. **bartonchan29@gmail.com** - 5 assets, 7 income, 8 expenses - **0 simulations**
3. **jaswinderspandher@gmail.com** - 7 assets, 6 income, 6 expenses - **0 simulations**
4. **dogpolisher@gmail.com** - 6 assets, 2 income, 4 expenses - **0 simulations**

These users invested 15-20 minutes entering detailed financial data, then **never saw a simulation result**.

---

## Recommended Fixes (Priority Order)

### 🔴 CRITICAL - Fix Immediately

#### 1. Add "Quick Start" Flow from Onboarding
**File:** `app/(dashboard)/onboarding/wizard/page.tsx`

**Change:** After wizard completion, instead of redirecting to `/dashboard`, redirect to `/simulation?mode=quick&onboarding=complete`

**Add completion screen:**
```tsx
{step === 'complete' && (
  <div className="text-center py-8">
    <h2 className="text-2xl font-bold mb-4">Your Profile is Complete!</h2>
    <p className="text-gray-600 mb-6">
      Let's see your personalized retirement projection based on your financial profile.
    </p>
    <Button size="lg" onClick={() => router.push('/simulation?mode=quick&onboarding=complete')}>
      See My Retirement Plan
    </Button>
    <Button variant="link" onClick={() => router.push('/dashboard')}>
      Skip for now
    </Button>
  </div>
)}
```

#### 2. Fix Simulation Page Initial Load
**File:** `app/(dashboard)/simulation/page.tsx`

**Change:** Prioritize database data over localStorage on initial load.

**Current (lines 82-99):**
```typescript
// Load saved data from localStorage on mount
useEffect(() => {
  const savedHousehold = localStorage.getItem('simulation_household');
  if (savedHousehold) {
    setHousehold(JSON.parse(savedHousehold)); // ❌ This overwrites DB data
  }
}, []);
```

**Fixed:**
```typescript
// Only use localStorage as fallback, not primary source
useEffect(() => {
  // Don't load localStorage on mount - let prefill API load database data first
  // localStorage will be used for merge in loadPrefillDataWithMerge()
  setIsInitialized(true);
}, []);
```

#### 3. Implement Smart Strategy Selection
**File:** `app/api/simulation/prefill/route.ts`

**Add:** Logic to select optimal default strategy based on user's profile.

```typescript
// After building person1Input and person2Input, calculate smart default strategy
let defaultStrategy = 'rrif-frontload'; // current default

const totalRRIF = person1Input.rrif_balance + (person2Input?.rrif_balance || 0);
const totalTFSA = person1Input.tfsa_balance + (person2Input?.tfsa_balance || 0);
const totalRRSP = person1Input.rrsp_balance + (person2Input?.rrsp_balance || 0);
const totalNonReg = person1Input.nonreg_balance + (person2Input?.nonreg_balance || 0);
const totalAssets = totalRRIF + totalTFSA + totalRRSP + totalNonReg;

// Smart strategy selection based on asset mix
if (totalAssets === 0) {
  defaultStrategy = 'balanced';
} else if (totalRRIF > totalAssets * 0.4) {
  // Large RRIF balance - front-load withdrawals to minimize tax
  defaultStrategy = 'rrif-frontload';
} else if (totalTFSA > totalAssets * 0.3) {
  // Large TFSA - use tax-free account first to preserve tax-deferred growth
  defaultStrategy = 'tfsa-first';
} else if (totalNonReg > totalAssets * 0.5) {
  // Large non-registered - tax-efficient balanced approach
  defaultStrategy = 'tax-efficient-balanced';
} else if (person1Income.other_income_annual > 50000) {
  // High ongoing income - minimize additional taxable income
  defaultStrategy = 'minimize-income';
} else {
  defaultStrategy = 'balanced';
}

// Return strategy in prefill response
return NextResponse.json({
  person1Input,
  person2Input,
  province,
  includePartner,
  recommendedStrategy: defaultStrategy, // ← Add this
  // ... rest of response
});
```

**Then in simulation page:**
```typescript
// Apply recommended strategy from prefill
if (data.recommendedStrategy) {
  setHousehold(prev => ({
    ...prev,
    strategy: data.recommendedStrategy,
  }));
}
```

---

### 🟡 HIGH PRIORITY - Fix This Week

#### 4. Make Smart Start More Prominent
**File:** `app/(dashboard)/simulation/page.tsx`

**Change:** Make the SmartStartCard always show until user runs first simulation, and make it more action-oriented.

```tsx
{!result && !prefillLoading && (
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white mb-6">
    <h2 className="text-2xl font-bold mb-3">Ready to See Your Retirement Plan?</h2>
    <p className="text-blue-100 mb-6">
      We've loaded your financial profile. Click below to generate your personalized retirement projection.
    </p>
    <Button size="lg" variant="secondary" onClick={handleRunSimulation}>
      <Play className="mr-2" /> Generate My Retirement Plan
    </Button>
  </div>
)}
```

#### 5. Simplify "Reload from Profile" Button
**File:** `app/(dashboard)/simulation/page.tsx`

**Change:** Remove or simplify the "Reload from Profile" logic. It's confusing users.

**Option A:** Remove the button entirely
**Option B:** Make it simpler:
```tsx
<Button onClick={() => {
  localStorage.removeItem('simulation_household');
  localStorage.removeItem('simulation_includePartner');
  window.location.reload();
}}>
  Clear Cache & Reload
</Button>
```

---

### 🟢 MEDIUM PRIORITY - Fix Next Sprint

#### 6. Add Progress Indicators in Onboarding
**File:** `app/(dashboard)/onboarding/wizard/page.tsx`

**Add:** Progress bar showing "Profile Setup → Add Assets → Run Simulation → Results"

#### 7. Add Tooltips and Help Text
**File:** `app/(dashboard)/simulation/page.tsx`

**Add:** Explanatory tooltips for complex fields (ACB, yields, etc.)

#### 8. Add Email Notification for Dormant Users
**Create:** `/app/api/cron/notify-dormant-users/route.ts`

**Send email to users who:**
- Added assets > 3 days ago
- Haven't run a simulation yet
- Email: "You're one click away from seeing your retirement plan"

---

## Testing Plan

### Phase 1: Validate Fixes Locally
1. Clear all localStorage
2. Create new test user
3. Complete onboarding wizard
4. Verify automatic redirect to simulation with ?mode=quick
5. Verify simulation runs automatically with smart defaults
6. Verify health score is reasonable (> 60)

### Phase 2: Test with Real User Data
1. Use jrcb@hotmail.com data
2. Clear localStorage
3. Load simulation page
4. Verify database data loads correctly (not localStorage)
5. Verify strategy is intelligent based on assets
6. Run simulation and verify health score matches expectations

### Phase 3: Re-engage Dormant Users
1. Deploy fixes to production
2. Send email to 18 dormant users
3. Subject: "Your Retirement Plan is Ready (One Click Away)"
4. Body: "We've made it easier to see your personalized retirement projection. Just click here to view your plan."
5. Link: `/simulation?mode=quick&email=true`
6. Track conversion rate (how many click through and simulate)

---

## Success Metrics

**Current State:**
- 72% of users with data never simulate
- 0 simulations in last 3 days
- Average health score: 88 (but only 7 users have ever simulated)

**Target State (After Fixes):**
- < 20% of users with data never simulate (reduce from 72% to 20%)
- > 80% of users who complete onboarding run at least one simulation
- Average health score remains > 75 (indicating calculations are working)
- Daily active users > 0 (currently 0 for last 3 days)

**Key Metric to Watch:**
`Conversion Rate: (Users Who Simulate) / (Users Who Add Assets)`
- Current: 28%
- Target: 80%

---

## Conclusion

The application has **NO marketing problem**. Users are finding it, registering, and investing time to add their financial data.

The problem is **USER EXPERIENCE**: 72% of users complete setup but never see simulation results.

**Root Causes:**
1. No clear path from onboarding completion to first simulation
2. Simulation page is too complex/intimidating for first-time use
3. No automatic "quick start" simulation with smart defaults
4. Possible calculation bugs (historical) scared early users away

**Fix Priority:**
1. 🔴 Add automatic quick simulation after onboarding
2. 🔴 Fix localStorage overriding database data
3. 🔴 Implement smart strategy selection
4. 🟡 Simplify first simulation experience
5. 🟢 Re-engage dormant users via email

**Expected Impact:**
If we fix the onboarding → simulation flow, we could convert 15+ dormant users who already have complete data, and improve future user retention by 50%+.
