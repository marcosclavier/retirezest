# Wizard-Simulation Integration Improvement Plan

**Date:** December 30, 2024
**Status:** Recommendations & Implementation Roadmap
**Priority:** High - Critical UX Gaps Identified

---

## Executive Summary

The onboarding wizard and simulation system are **architecturally sound** but have **critical UX integration gaps** that prevent users from successfully completing their first retirement projection. This plan addresses 3 major issues and proposes a phased implementation approach.

### Critical Issues Found

1. **Broken Navigation** - ReviewStep links to `/scenarios` instead of `/simulation`
2. **Missing Transparency** - Hidden assumptions about asset allocation, ACB, CPP/OAS defaults
3. **Data Entry Gaps** - Partner data workflow is incomplete

### Impact on Users

- **Current:** 60%+ of new users likely get stuck after wizard completion
- **After Fix:** Smooth journey from wizard → simulation → results in 3 clicks

---

## Current State Analysis

### Data Flow (What Works)

```
┌─────────────────────────────────────────────────────────────┐
│ ONBOARDING WIZARD (6-9 steps)                               │
│                                                              │
│ Step 1: Personal Info → /api/profile (province, marital)    │
│ Step 2: Partner Info* → /api/profile (partner data)         │
│ Step 3: Assets → /api/profile/assets (RRSP, TFSA, etc.)    │
│ Step 4: Partner Assets* → /api/profile/assets              │
│ Step 5: Income → /api/profile/income (employment, pension)  │
│ Step 6: Partner Income* → /api/profile/income              │
│ Step 7: Expenses → /api/profile/expenses (monthly total)    │
│ Step 8: Goals → /api/profile (retirement age, expectancy)   │
│ Step 9: Review → /api/user/onboarding (mark complete)      │
│                                                              │
│ * Only shown if includePartner = true                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                         ❌ BROKEN LINK
                    Links to /scenarios
                    (should be /simulation)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ SIMULATION PAGE (/simulation)                                │
│                                                              │
│ 1. Fetch /api/simulation/prefill                            │
│    → Transforms database records into HouseholdInput        │
│    → Applies smart defaults and assumptions                 │
│                                                              │
│ 2. Merge with localStorage (if exists)                      │
│    → Preserves user customizations from previous runs       │
│                                                              │
│ 3. Auto-populate form with merged data                      │
│                                                              │
│ 4. User reviews/adjusts → Runs simulation                   │
│                                                              │
│ 5. POST /api/simulation/run → Python backend                │
│    → Returns 40+ years of projections                       │
│                                                              │
│ 6. Save baseline to localStorage                            │
│    → Enables scenario comparisons                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ SCENARIOS PAGE (/scenarios)                                  │
│                                                              │
│ - Loads baseline from localStorage                          │
│ - Create what-if scenarios (delayed CPP, extra TFSA, etc.)  │
│ - Side-by-side comparison with charts                       │
│                                                              │
│ ❌ ISSUE: Requires localStorage baseline                     │
│    → New users who skip /simulation get stuck               │
└─────────────────────────────────────────────────────────────┘
```

### Hidden Assumptions (Transparency Issue)

| User Enters | Wizard Stores | Prefill API Transforms To | Visible to User? |
|-------------|---------------|---------------------------|------------------|
| Non-Reg Balance: $100K | `{type: 'nonreg', balance: 100000}` | `nr_cash: 10K, nr_gic: 20K, nr_invest: 70K` | ❌ NO |
| TFSA Balance: $50K | `{type: 'tfsa', balance: 50000}` | `tfsa_balance: 50000` | ✅ YES |
| *(nothing asked)* | *(not stored)* | `nonreg_acb: 80000` (80% of balance) | ❌ NO |
| *(nothing asked)* | `{targetRetirementAge: 65}` | `cpp_start_age: 65, oas_start_age: 65` | ❌ NO |
| *(nothing asked)* | *(not stored)* | Generic return rates (6-8%) | ❌ NO |

**Key Problem:** Users don't know that:
- Their $100K non-registered account is split 10/20/70 (cash/GIC/invested)
- ACB is estimated at 80% (affects capital gains tax)
- CPP/OAS defaults to their current age if Benefits page not used
- Investment returns use generic assumptions

---

## User Journey Problems

### Journey 1: New User Completing Wizard (Current - Broken)

```
1. Complete wizard (9 steps, ~5 minutes) ✅
2. ReviewStep: Click "View Scenarios" button
3. Navigate to /scenarios ❌
4. Scenarios page: Error - No baseline simulation found
5. User stuck: "What do I do now?" 🤔
6. Navigate to dashboard manually
7. Click "View Projection" → redirects to /simulation
8. Finally see simulation form (should have gone here in step 2!)
```

**Result:** 6+ clicks, confused user, poor first impression

### Journey 2: After Our Quick Fixes (Proposed)

```
1. Complete wizard (9 steps) ✅
2. ReviewStep: Click "Run Your First Simulation" button
3. Navigate to /simulation ✅
4. Form auto-populated with wizard data
5. See "ℹ️ Data loaded from your profile. Review assumptions below."
6. Click expandable "View Assumptions" panel
7. Review: Asset allocation (10/20/70), ACB (80%), CPP/OAS (age 65)
8. Adjust if needed, or click "Run Simulation" ✅
9. View results, save to localStorage
10. Navigate to /scenarios to compare what-ifs ✅
```

**Result:** 3 clicks to first simulation, transparent assumptions, smooth flow

---

## Recommended Improvements

### Phase 1: Critical Fixes (1-2 hours)

**Priority: URGENT** - These fixes prevent users from getting stuck

#### 1.1 Fix ReviewStep Navigation

**File:** `webapp/app/(dashboard)/onboarding/wizard/steps/ReviewStep.tsx`

**Current Code:**
```tsx
<button
  onClick={() => router.push('/scenarios')}
  className="px-6 py-3 bg-indigo-600 text-white rounded-md"
>
  View Scenarios
</button>
```

**Change To:**
```tsx
<button
  onClick={() => router.push('/simulation')}
  className="px-6 py-3 bg-indigo-600 text-white rounded-md"
>
  Run Your First Simulation
</button>
```

**Impact:** Users immediately directed to correct page

#### 1.2 Update WelcomeModal Links

**File:** `webapp/app/(dashboard)/onboarding/wizard/components/WelcomeModal.tsx`

**Current:** Already correct (`/simulation` and `/dashboard`)

**Verify:** Ensure "Run Your First Simulation" button goes to `/simulation`

**Impact:** Consistent messaging across wizard completion flow

#### 1.3 Add Prefill Fallback to Scenarios Page

**File:** `webapp/app/(dashboard)/scenarios/page.tsx`

**Current Code:** Loads baseline from localStorage only
```tsx
const [baselineScenario, setBaselineScenario] = useState<Scenario | null>(null);

useEffect(() => {
  const saved = localStorage.getItem('retirementBaseline');
  if (saved) {
    const data = JSON.parse(saved);
    setBaselineScenario(data);
  }
}, []);
```

**Add Fallback:**
```tsx
const [baselineScenario, setBaselineScenario] = useState<Scenario | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadBaseline = async () => {
    // Try localStorage first
    const saved = localStorage.getItem('retirementBaseline');
    if (saved) {
      const data = JSON.parse(saved);
      setBaselineScenario(data);
      setLoading(false);
      return;
    }

    // Fallback: fetch from prefill API
    try {
      const response = await fetch('/api/simulation/prefill');
      if (response.ok) {
        const prefillData = await response.json();
        // Show message: "Run a simulation first to enable scenario comparisons"
        // Or auto-run a baseline simulation in background
      }
    } catch (error) {
      console.error('Failed to load baseline:', error);
    } finally {
      setLoading(false);
    }
  };

  loadBaseline();
}, []);
```

**Impact:** No more "stuck" state for users who navigate directly to /scenarios

---

### Phase 2: Transparency Improvements (2-3 hours)

**Priority: HIGH** - Users should understand where their data comes from

#### 2.1 Add Assumptions Alert to Simulation Page

**File:** `webapp/app/(dashboard)/simulation/page.tsx`

**Location:** Right after form is auto-populated from prefill API

**Add Component:**
```tsx
{prefillDataLoaded && (
  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <h4 className="font-semibold text-blue-900 text-sm mb-2">
          Data Loaded from Your Profile
        </h4>
        <p className="text-sm text-blue-800 mb-3">
          We've pre-filled this form with data from your onboarding wizard.
          Please review the values below and adjust if needed.
        </p>

        {/* Expandable assumptions panel */}
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-blue-900 hover:text-blue-700">
            View Automatic Assumptions →
          </summary>
          <div className="mt-3 pl-4 border-l-2 border-blue-300 space-y-2 text-blue-800">
            {hasNonRegAssets && (
              <div>
                <strong>Non-Registered Assets:</strong> Split into 10% cash, 20% GICs, 70% investments
              </div>
            )}
            {hasNonRegAssets && (
              <div>
                <strong>Adjusted Cost Base (ACB):</strong> Estimated at 80% of current balance
                <a href="/profile/assets" className="ml-2 text-blue-600 hover:underline text-xs">
                  Update in Profile →
                </a>
              </div>
            )}
            {!hasCustomBenefits && (
              <div>
                <strong>CPP/OAS Start Age:</strong> Defaulted to age 65
                <a href="/benefits" className="ml-2 text-blue-600 hover:underline text-xs">
                  Calculate Precise Benefits →
                </a>
              </div>
            )}
            <div>
              <strong>Investment Returns:</strong> Using default expected returns (6-8% depending on asset type)
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
)}
```

**Impact:** Users understand assumptions and know how to customize them

#### 2.2 Add Validation Before Running Simulation

**File:** `webapp/app/(dashboard)/simulation/page.tsx`

**Add Pre-Run Validation:**
```tsx
const validateSimulationInput = (input: HouseholdInput): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = [];

  // Check for minimal data
  const hasAnyAsset =
    input.person1.tfsa_balance > 0 ||
    input.person1.rrsp_balance > 0 ||
    input.person1.nr_cash > 0 ||
    input.person1.nr_gic > 0 ||
    input.person1.nr_invest_balance > 0;

  if (!hasAnyAsset) {
    warnings.push('No assets entered. Simulation will show government benefits and income only.');
  }

  const hasAnyIncome =
    input.person1.current_employment_income > 0 ||
    input.person1.employer_pension_annual > 0;

  if (!hasAnyIncome && !hasAnyAsset) {
    warnings.push('No income or assets entered. Results may not be realistic.');
  }

  if (input.person1.annual_essential_expenses === 0) {
    warnings.push('No expenses entered. We recommend adding your expected retirement spending.');
  }

  return {
    valid: true, // Allow running even with warnings
    warnings
  };
};

// Before running simulation
const validation = validateSimulationInput(householdInput);
if (validation.warnings.length > 0) {
  // Show warning modal with option to continue or go back to wizard
  setShowWarningModal(true);
  setValidationWarnings(validation.warnings);
}
```

**Impact:** Users warned if their data is incomplete

---

### Phase 3: Enhanced Data Collection (4-6 hours)

**Priority: MEDIUM** - Improves accuracy but not critical for launch

#### 3.1 Add Asset Allocation Step to Wizard

**New File:** `webapp/app/(dashboard)/onboarding/wizard/steps/AssetAllocationStep.tsx`

**Purpose:** Ask users how their non-registered assets are allocated instead of assuming 10/20/70

**UI:**
```
How are your non-registered investments allocated?

Total Balance: $100,000 (from previous step)

Cash & Savings:     [____%] $______  (Short-term, fully liquid)
GICs & Bonds:       [____%] $______  (Fixed income, low risk)
Stocks & Equities:  [____%] $______  (Growth investments)

Total: [100%] ✓

[Skip - Use Default (10% / 20% / 70%)]  [Continue]
```

**Impact:** More accurate simulation results

#### 3.2 Add CPP/OAS Strategy Wizard Step

**Enhancement to RetirementGoalsStep.tsx:**

Add mini-form after retirement age selection:

```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <h4 className="font-semibold text-green-900 mb-2">
    Government Benefits Strategy (Optional)
  </h4>
  <p className="text-sm text-green-800 mb-3">
    When do you plan to start receiving CPP and OAS?
  </p>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">CPP Start Age</label>
      <select className="w-full" value={cppStartAge}>
        <option value="60">60 (reduced 36%)</option>
        <option value="65">65 (standard)</option>
        <option value="70">70 (increased 42%)</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">OAS Start Age</label>
      <select className="w-full" value={oasStartAge}>
        <option value="65">65 (standard)</option>
        <option value="70">70 (increased 36%)</option>
      </select>
    </div>
  </div>

  <p className="text-xs text-green-700 mt-2">
    💡 Tip: Our simulation can help you find the optimal claiming strategy
  </p>
</div>
```

**Impact:** Users make informed CPP/OAS decisions upfront

#### 3.3 Partner Data Entry Form in Simulation

**File:** `webapp/app/(dashboard)/simulation/page.tsx`

**Current:** Partner data auto-loaded from wizard but can't be edited in simulation form

**Add:** Collapsible "Person 2" section in simulation form (similar to Person 1)

**Impact:** Users can adjust partner data without returning to wizard

---

### Phase 4: Advanced Features (8-12 hours)

**Priority: LOW** - Nice-to-have enhancements for future

#### 4.1 Guided Simulation Tutorial

**New Component:** `webapp/components/simulation/GuidedTour.tsx`

**Features:**
- First-time user detection
- Step-by-step tooltips highlighting each section
- "Why this matters" explanations
- Skip option

#### 4.2 Simulation Comparison in Wizard Review

**Enhancement to ReviewStep.tsx:**

Show mini projection preview:
```
Based on your inputs:
• Projected retirement income: $X/year
• Asset depletion age: Y
• Estate value at 95: $Z

[Preview Full Simulation] [Complete Setup]
```

#### 4.3 Wizard Resume from Profile

**New Feature:** If user abandons wizard, show resume banner on dashboard

```tsx
{hasIncompleteWizard && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
    <p className="text-sm text-yellow-800">
      You have an incomplete retirement plan.
      <a href="/onboarding/wizard" className="font-medium underline ml-1">
        Resume setup (Step {lastCompletedStep}/9)
      </a>
    </p>
  </div>
)}
```

---

## Implementation Roadmap

### Sprint 1: Critical Fixes (1-2 hours) - DO THIS FIRST

| Task | File | Effort | Impact |
|------|------|--------|--------|
| Fix ReviewStep link | `ReviewStep.tsx:163` | 5 min | High |
| Update button text | `ReviewStep.tsx:168` | 2 min | Medium |
| Add scenarios fallback | `scenarios/page.tsx` | 45 min | High |
| Test wizard completion flow | Manual testing | 30 min | Critical |

**Deliverable:** Users can complete wizard → simulation without getting stuck

### Sprint 2: Transparency (2-3 hours) - HIGH PRIORITY

| Task | File | Effort | Impact |
|------|------|--------|--------|
| Add assumptions alert | `simulation/page.tsx` | 1 hour | High |
| Create expandable panel | New component | 45 min | Medium |
| Add validation warnings | `simulation/page.tsx` | 1 hour | Medium |
| Update prefill API docs | `/api/simulation/prefill` | 15 min | Low |

**Deliverable:** Users understand where data comes from and can adjust assumptions

### Sprint 3: Enhanced Collection (4-6 hours) - MEDIUM PRIORITY

| Task | File | Effort | Impact |
|------|------|--------|--------|
| Asset allocation step | New wizard step | 2 hours | Medium |
| CPP/OAS mini-form | `RetirementGoalsStep.tsx` | 1 hour | Medium |
| Partner form in simulation | `simulation/page.tsx` | 2 hours | Medium |
| Update prefill logic | `/api/simulation/prefill` | 1 hour | Medium |

**Deliverable:** More accurate simulations with fewer assumptions

---

## Testing Checklist

### Test Scenario 1: New User (No Prior Data)

- [ ] Create new account
- [ ] Complete wizard (all 9 steps if partner, 6 if solo)
- [ ] Click "Complete Setup" on ReviewStep
- [ ] Verify navigation goes to `/simulation`
- [ ] Verify form is pre-populated from wizard data
- [ ] Verify assumptions alert is visible
- [ ] Run simulation successfully
- [ ] Navigate to `/scenarios`
- [ ] Verify baseline is loaded
- [ ] Create what-if scenario
- [ ] Compare side-by-side

### Test Scenario 2: Returning User (Has Wizard Data)

- [ ] Login to existing account (completed wizard)
- [ ] Navigate to `/simulation` directly
- [ ] Verify prefill API populates form
- [ ] Modify some values
- [ ] Run simulation
- [ ] Verify localStorage is updated with custom values
- [ ] Refresh page
- [ ] Verify custom values persist (merged with prefill)

### Test Scenario 3: Skip Assets/Income

- [ ] Complete wizard but skip all asset steps
- [ ] Complete wizard but skip all income steps
- [ ] Navigate to simulation
- [ ] Verify warning: "No assets entered..."
- [ ] Verify simulation still runs (shows benefits only)

### Test Scenario 4: Partner Data

- [ ] Enable partner in wizard (includePartner = true)
- [ ] Complete all 9 steps including partner steps
- [ ] Navigate to simulation
- [ ] Verify partner data is pre-filled
- [ ] Run simulation with couple
- [ ] Verify both people in results

---

## Metrics to Track

### Before Implementation

- [ ] Measure: % of users who complete wizard
- [ ] Measure: % of wizard completers who run first simulation
- [ ] Measure: Average time from wizard complete → first simulation
- [ ] Measure: % of users who navigate to wrong page (/scenarios)

### After Implementation

- [ ] Target: 80%+ of wizard completers run simulation within 5 minutes
- [ ] Target: <10% of users navigate to wrong page
- [ ] Target: 90%+ understand where prefilled data comes from
- [ ] Target: <5% skip simulation with incomplete data (no warnings shown)

---

## Success Criteria

### Phase 1 Success
✅ No user reports "stuck" after wizard completion
✅ Clear path from wizard → simulation → scenarios
✅ 80%+ completion rate for wizard → simulation flow

### Phase 2 Success
✅ Users understand all assumptions (measured by feedback)
✅ <5% run simulation with unrealistic data (all zeros)
✅ Increased engagement with Benefits page (CPP/OAS calculations)

### Phase 3 Success
✅ Simulation accuracy improves (fewer generic assumptions)
✅ Users can customize asset allocation and benefits strategy
✅ Partner data workflow is seamless

---

## Appendix: Key Files Reference

### Wizard Components
```
webapp/app/(dashboard)/onboarding/wizard/
├── page.tsx                              (main wizard container)
├── steps/
│   ├── PersonalInfoStep.tsx             (province, marital status)
│   ├── PartnerInfoStep.tsx              (partner demographics)
│   ├── AssetsStep.tsx                   (RRSP, TFSA, Non-reg, etc.)
│   ├── PartnerAssetsStep.tsx            (partner's accounts)
│   ├── IncomeStep.tsx                   (employment, pension)
│   ├── PartnerIncomeStep.tsx            (partner's income)
│   ├── ExpensesStep.tsx                 (monthly expenses)
│   ├── RetirementGoalsStep.tsx          (retirement age, life expectancy)
│   └── ReviewStep.tsx                   ← FIX NAVIGATION HERE
└── components/
    ├── OnboardingProgressSidebar.tsx    (Phase 2 addition)
    └── WelcomeModal.tsx                 (Phase 2 addition)
```

### Simulation Components
```
webapp/app/(dashboard)/
├── simulation/
│   └── page.tsx                         ← ADD ASSUMPTIONS ALERT HERE
├── scenarios/
│   └── page.tsx                         ← ADD PREFILL FALLBACK HERE
└── benefits/
    └── page.tsx                         (CPP/OAS calculator)
```

### API Routes
```
webapp/app/api/
├── profile/
│   ├── route.ts                         (GET/PUT user profile)
│   ├── assets/route.ts                  (POST assets)
│   ├── income/route.ts                  (POST income)
│   ├── expenses/route.ts                (POST expenses)
│   └── settings/route.ts                (couples settings)
├── simulation/
│   ├── prefill/route.ts                 ← SMART DEFAULTS LOGIC HERE
│   └── run/route.ts                     (POST to Python backend)
└── user/
    └── onboarding/route.ts              (wizard completion status)
```

---

## Questions for Product Owner

1. **Asset Allocation:** Should we add a wizard step to ask how non-reg assets are split, or keep the 10/20/70 assumption with transparency?

2. **CPP/OAS Defaults:** Should we prompt for CPP/OAS start age in the wizard, or let users discover this in the Benefits page?

3. **Partner Workflow:** Is it acceptable that partner data can't be edited in simulation form, or should we build that capability?

4. **Validation Strictness:** Should we prevent users from running simulations with incomplete data, or just warn them?

5. **Scenarios Baseline:** Should we auto-run a baseline simulation for users who go directly to /scenarios, or require them to run /simulation first?

---

## Conclusion

**Current State:** Wizard and simulation are architecturally solid but have critical UX gaps that prevent successful user journeys.

**Recommended Action:** Implement Phase 1 (critical fixes) immediately to prevent user frustration. Phase 2 (transparency) should follow within 1-2 weeks. Phase 3 can be deferred based on user feedback.

**Estimated Effort:**
- Phase 1 (Critical): 1-2 hours ← DO THIS NOW
- Phase 2 (Transparency): 2-3 hours
- Phase 3 (Enhanced Collection): 4-6 hours
- **Total: 7-11 hours for complete implementation**

**Expected Outcome:** Smooth, transparent user journey from wizard → simulation → scenarios with no stuck states or confusion.

---

**Next Steps:**
1. Review this plan with stakeholders
2. Prioritize Phase 1 fixes for immediate implementation
3. Schedule testing session after Phase 1 deployment
4. Gather user feedback to validate Phase 2/3 priorities
