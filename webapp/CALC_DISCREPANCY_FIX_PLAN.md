# Calculator Discrepancy - Fix Plan

**Date:** 2026-01-22
**Issue:** Early Retirement calculator showing vastly different results from Simulation for user jrcb@hotmail.com
**Status:** 🔍 Root Cause Identified - Fix Plan Created

---

## Executive Summary

The **Early Retirement Calculator** shows user can retire at **age 74** with a **63/100 readiness score**, while the **Simulation** shows **100% success** at **age 65** with a **92/100 health score**.

**Root Cause:** Early Retirement calculator is missing **$3.38M in assets** ($829K vs $4.21M actual net worth).

---

## Investigation Results

### User Profile (jrcb@hotmail.com):
- **Current Age:** 67
- **Target Retirement Age:** 70
- **Household Type:** Couple (Partner age 66)
- **Province:** Alberta
- **Life Expectancy:** 95

### Asset Breakdown:
```
Person 1 (direct):
- RRSP/RRIF:  $189,000
- TFSA:        $192,200
- Non-Reg:     $0

Person 2 (direct):
- RRSP/RRIF:  $263,000
- TFSA:        $221,065
- Non-Reg:     $0

Joint:
- RRSP/RRIF:   $0
- TFSA:        $0
- Non-Reg:     $896,400
- Corporate:   $2,444,000  ← 🔴 MISSING IN EARLY RETIREMENT CALC

TOTAL NET WORTH: $4,205,665
```

### Income & Expenses:
- **Person 1 Income:** $16,900/year
- **Person 2 Income:** $4,200/year
- **Total Household Income:** $21,100/year
- **Annual Expenses:** $183,700/year
- **Current Deficit:** -$162,600/year (living off assets)

---

## Root Causes Identified

### 1. ❌ CORPORATE ACCOUNTS NOT INCLUDED
**Impact:** Missing **$2,444,000** (58% of total net worth)

**Problem:**
Early Retirement calculator API (`/api/early-retirement/profile/route.ts`) does NOT include corporate accounts when aggregating assets.

**Location:** Lines 52-60 and 59-60
```typescript
const nonRegistered = person1Assets
  .filter((a: any) => ['nonreg', 'savings', 'investment', 'other'].includes(a.type))
  // 🔴 'corporate' is NOT in this list!
  .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
```

**Fix Required:**
```typescript
const nonRegistered = person1Assets
  .filter((a: any) => ['nonreg', 'savings', 'investment', 'other', 'corporate'].includes(a.type))
  .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
```

---

### 2. ❌ COUPLES PLANNING INCOMPLETE
**Impact:** Missing **$484,065** from Partner's assets (Person 2)

**Problem:**
Early Retirement calculator aggregates partner assets but does NOT use them in calculations. Only Person 1's assets are used.

**Location:** `/api/early-retirement/profile/route.ts` lines 74-90 and 153-164
```typescript
// Partner assets are calculated...
const partnerRrsp = person2Assets.filter(...).reduce(...);
const partnerTfsa = person2Assets.filter(...).reduce(...);
const partnerNonReg = person2Assets.filter(...).reduce(...);

// BUT they are NOT added to currentSavings sent to calculator!
const profileData = {
  currentAge,
  currentSavings: {
    rrsp: Math.round(rrsp + jointRrsp),      // 🔴 No partnerRrsp
    tfsa: Math.round(tfsa + jointTfsa),      // 🔴 No partnerTfsa
    nonRegistered: Math.round(nonRegistered + jointNonReg), // 🔴 No partnerNonReg
  },
  // ...
};
```

**Fix Required:**
For couples planning, use **household-level assets** (Person 1 + Person 2 + Joint).

---

### 3. ⚠️  JOINT ASSET SPLITTING
**Impact:** Conceptual issue in how joint assets are allocated

**Problem:**
Joint assets are split 50/50 between partners, which is reasonable for couples planning, but creates inconsistency with simulation which tracks them separately.

**Current Logic:**
```typescript
const jointRrsp = jointAssets.filter(...).reduce(...) / 2;  // Split 50/50
const jointTfsa = jointAssets.filter(...).reduce(...) / 2;
const jointNonReg = jointAssets.filter(...).reduce(...) / 2;
```

**Fix Required:**
For Early Retirement calculator, use **full joint amounts** when calculating household retirement readiness (not split per person).

---

### 4. ⚠️  DIFFERENT CALCULATION METHODOLOGIES
**Impact:** Results will never be identical due to fundamental differences

**Early Retirement Calculator:**
- Simplified **25x rule** (4% withdrawal rate)
- Uses inflation buffer adjustment
- Does NOT include:
  - CPP/OAS benefits
  - Detailed tax calculations
  - RRIF minimum withdrawal rules
  - Year-by-year cash flow analysis

**Simulation (Python Backend):**
- **Year-by-year Monte Carlo** simulation
- Includes:
  - CPP/OAS/GIS government benefits
  - Provincial and federal taxes
  - RRIF minimum withdrawals
  - Withdrawal strategy optimization
  - Estate planning

**Decision:** This is **by design** - Early Retirement is meant to be a quick estimate, while Simulation is comprehensive. However, the asset inputs should be aligned.

---

## Fix Plan

### Priority 1: Include Corporate Accounts (CRITICAL)
**File:** `/app/api/early-retirement/profile/route.ts`

**Changes:**
1. **Lines 59-60** - Add 'corporate' to non-registered asset types:
   ```typescript
   const nonRegistered = person1Assets
     .filter((a: any) => ['nonreg', 'savings', 'investment', 'other', 'corporate'].includes(a.type))
     .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
   ```

2. **Lines 71-72** - Add 'corporate' to joint non-registered aggregation:
   ```typescript
   const jointNonReg = jointAssets
     .filter((a: any) => ['nonreg', 'savings', 'investment', 'other', 'corporate'].includes(a.type))
     .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0) / 2;
   ```

3. **Lines 88-89** - Add 'corporate' to Person 2 aggregation:
   ```typescript
   partnerNonReg = person2Assets
     .filter((a: any) => ['nonreg', 'savings', 'investment', 'other', 'corporate'].includes(a.type))
     .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
   ```

**Impact:**
This fix alone adds **$2,444,000** to the calculation, which will dramatically improve Early Retirement readiness score.

---

### Priority 2: Include Partner Assets in Couples Planning (CRITICAL)
**File:** `/app/api/early-retirement/profile/route.ts`

**Changes:**
1. **Lines 156-161** - Include partner assets in currentSavings for couples:
   ```typescript
   currentSavings: {
     rrsp: Math.round(rrsp + jointRrsp + (includePartner ? partnerRrsp + jointRrsp : 0)),
     tfsa: Math.round(tfsa + jointTfsa + (includePartner ? partnerTfsa + jointTfsa : 0)),
     nonRegistered: Math.round(nonRegistered + jointNonReg + (includePartner ? partnerNonReg + jointNonReg : 0)),
   },
   ```

**Impact:**
Adds **$484,065** from partner assets for couples planning scenarios.

---

### Priority 3: Update Early Retirement Calculator Logic
**File:** `/app/api/early-retirement/calculate/route.ts`

**Changes:**
1. **Add support for household-level planning:**
   - Accept `includePartner` and `partner` data in request
   - Calculate retirement readiness using **combined household assets**
   - Consider **household expenses** instead of individual

2. **Add corporate account handling:**
   - Corporate accounts are taxable on withdrawal (similar to non-registered)
   - May need different treatment for tax optimization

**Impact:**
Makes Early Retirement calculator couple-aware and consistent with Simulation inputs.

---

### Priority 4: Add Warning About Calculation Differences
**Files:**
- `/app/(dashboard)/early-retirement/page.tsx`
- `/components/retirement/EarlyRetirementScore.tsx`

**Changes:**
1. Add disclaimer explaining differences between Early Retirement and Simulation:
   ```
   ℹ️ Quick Estimate vs. Detailed Simulation

   This calculator provides a quick retirement readiness estimate using
   the 4% rule. For a comprehensive analysis including:
   - CPP, OAS, and GIS benefits
   - Detailed tax optimization
   - Year-by-year cash flow projections
   - RRIF withdrawal strategies

   Please run the full Simulation tool.
   ```

**Impact:**
Sets proper user expectations about the two calculators.

---

## Implementation Steps

### Phase 1: Asset Aggregation Fixes (1-2 hours)
1. ✅ Create debug script to investigate issue
2. 🔲 Update `/api/early-retirement/profile/route.ts`:
   - Add corporate accounts to all asset filters
   - Include partner assets in couples planning calculations
3. 🔲 Add unit tests for asset aggregation logic
4. 🔲 Test with user jrcb@hotmail.com profile

### Phase 2: Calculator Logic Updates (2-3 hours)
1. 🔲 Update `/api/early-retirement/calculate/route.ts`:
   - Add household-level planning support
   - Handle corporate accounts appropriately
2. 🔲 Test calculation with updated asset data
3. 🔲 Verify readiness score improvements

### Phase 3: UI Improvements (1 hour)
1. 🔲 Add disclaimer about calculation methodology differences
2. 🔲 Add link from Early Retirement to Simulation for detailed analysis
3. 🔲 Update educational content about the two calculators

### Phase 4: Testing & Validation (1-2 hours)
1. 🔲 Run E2E tests with couples planning scenarios
2. 🔲 Test with multiple user profiles (single, couples, with/without corporate)
3. 🔲 Verify calculations are reasonable (not identical to simulation, but closer)
4. 🔲 User acceptance testing with jrcb@hotmail.com

---

## Expected Results After Fix

### For User jrcb@hotmail.com:

**Before Fix:**
- Total Savings Used: **$829,400**
- Earliest Retirement Age: **74**
- Readiness Score: **63/100**
- Target Age 70 Feasible: **No** ❌
- Required Monthly Savings: **$29,566** 💸

**After Fix (Estimated):**
- Total Savings Used: **$4,205,665** ✅ (+$3.38M)
- Earliest Retirement Age: **67-68** (already at target)
- Readiness Score: **85-95/100** 🎯
- Target Age 70 Feasible: **Yes** ✅
- Required Monthly Savings: **$0** 🎉

**Alignment with Simulation:**
- Simulation Health Score: **92/100**
- Simulation Success Rate: **100% (32/32 years funded)**
- Final Estate: **$4,734,826**

The Early Retirement calculator should now show the user is **on track** for early retirement, consistent with the Simulation results.

---

## Code Quality Checklist

- 🔲 TypeScript compilation passes
- 🔲 No breaking changes to API contracts
- 🔲 Backward compatible with existing data
- 🔲 Unit tests added for new logic
- 🔲 E2E tests pass
- 🔲 Documentation updated
- 🔲 User-facing messages are clear

---

## Risks & Considerations

### Risk 1: Corporate Account Tax Treatment
**Issue:** Corporate accounts have different tax implications than personal non-registered accounts.

**Mitigation:**
- For initial fix, treat corporate as non-registered (simple approach)
- Future enhancement: Add corporate-specific tax rates and withdrawal strategies

### Risk 2: Couples Planning Complexity
**Issue:** Household-level planning is more complex than individual planning.

**Mitigation:**
- Start with combined asset totals (simple aggregation)
- Future enhancement: Per-person retirement age flexibility, pension splitting

### Risk 3: User Confusion Between Calculators
**Issue:** Users may not understand why Early Retirement and Simulation give different answers.

**Mitigation:**
- Add clear disclaimers on both pages
- Educational content explaining the two methodologies
- Link to full simulation for detailed analysis

---

## Testing Scenarios

### Test 1: Single Person with Corporate Accounts
- Assets: RRSP, TFSA, Corporate
- Expected: Corporate included in calculations

### Test 2: Couple with Joint Assets
- Assets: Person 1 RRSP, Person 2 TFSA, Joint Corporate
- Expected: All assets included in household calculation

### Test 3: Couple with No Joint Assets
- Assets: Person 1 RRSP/TFSA, Person 2 RRSP/TFSA
- Expected: Both partners' assets included

### Test 4: Single Person with No Corporate
- Assets: RRSP, TFSA, Non-Registered
- Expected: No regression, works as before

---

## Future Enhancements (Post-Fix)

1. **Corporate Account Optimization:**
   - Add corporate withdrawal strategy (salary vs. dividends)
   - Provincial corporate tax rates
   - Integration with personal tax planning

2. **Enhanced Couples Planning:**
   - Per-person retirement ages
   - Pension income splitting at 65+
   - Survivor benefits planning

3. **Government Benefits Integration:**
   - Add CPP/OAS estimates to Early Retirement calculator
   - Show impact of early vs. delayed CPP
   - GIS eligibility for low-income retirees

4. **Risk Assessment:**
   - Add market volatility scenarios (pessimistic, neutral, optimistic)
   - Sequence of returns risk analysis
   - Healthcare cost inflation

---

## Deployment Plan

1. **Development:**
   - Implement fixes in feature branch: `fix/early-retirement-asset-calculation`
   - Run test suite
   - Manual testing with production data (non-destructive)

2. **Staging:**
   - Deploy to staging environment
   - User acceptance testing with jrcb@hotmail.com
   - Verify calculations are reasonable

3. **Production:**
   - Deploy during low-traffic window
   - Monitor error logs for 24 hours
   - Verify with multiple user profiles

4. **Communication:**
   - No user communication needed (silent bug fix)
   - Internal documentation updated

---

## Success Metrics

### Immediate (Post-Deployment):
- ✅ Corporate accounts included in Early Retirement calculations
- ✅ Partner assets included for couples planning
- ✅ No TypeScript errors or runtime crashes
- ✅ E2E tests pass

### Short-term (1 week):
- ✅ User jrcb@hotmail.com sees aligned results between calculators
- ✅ Early Retirement readiness scores are more optimistic/realistic
- ✅ No user complaints about calculation errors

### Long-term (1 month):
- ✅ Early Retirement and Simulation results are conceptually aligned
- ✅ Users understand the difference between quick estimate vs. detailed simulation
- ✅ Increased usage of both calculators (users find them both useful)

---

## Conclusion

The Early Retirement calculator is currently missing **$3.38M in assets** for user jrcb@hotmail.com due to:
1. Corporate accounts not being included (**$2.44M missing**)
2. Partner assets not being used in couples planning (**$484K missing**)
3. Joint asset splitting reducing effective assets (**$448K vs. $896K**)

**The fix is straightforward:** Update asset aggregation logic to include corporate accounts and partner assets for household-level calculations.

**Expected impact:** Early Retirement calculator will show user is on track for retirement (85-95/100 score), aligning with Simulation results (92/100 health score, 100% success rate).

**Timeline:** 1-2 days for implementation, testing, and deployment.

---

**Status:** ✅ Root Cause Identified - Ready for Implementation
**Next Steps:** Begin Phase 1 implementation - Update asset aggregation logic

---

**Investigation Completed:** 2026-01-22
**Investigated By:** Claude Code
**Debug Script:** `/scripts/debug-calc-discrepancy.ts`
