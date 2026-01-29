# US-026 Bug Report - Strategy Selector Shows Incorrect Default

**Date**: January 29, 2026
**Sprint**: Sprint 2 - Day 1
**Related Story**: US-026 - Display Current Strategy Selection
**Status**: 🐛 **BUG IDENTIFIED**

---

## Issue Summary

Despite implementing US-026 successfully (showing human-readable strategy names), the **strategy selector is displaying "Balanced" instead of the expected default "Income Minimization (GIS-Optimized)"** when users load the simulation page.

---

## Evidence

**Screenshot provided by user** (January 29, 2026):
- Strategy selector shows: **"Balanced"**
- Description: "Balanced approach across all account types"
- Expected: **"Income Minimization (GIS-Optimized)"** with description "Minimizes taxable income to preserve government benefits like GIS and avoid OAS clawback"

---

## Root Cause Analysis

### Finding #1: Conflicting Default Strategy Definitions

**File**: `/webapp/lib/types/simulation.ts` (line 565)

```typescript
export const defaultHouseholdInput: HouseholdInput = {
  // ... other fields
  strategy: 'corporate-optimized', // ❌ Default is 'corporate-optimized', not 'minimize-income'
  // ... other fields
};
```

**Issue**: The hardcoded default in `defaultHouseholdInput` is set to `'corporate-optimized'`, which is:
1. **Not GIS-optimized** (inappropriate for most Canadian retirees)
2. **Only appropriate for users with corporate accounts** (niche use case)
3. **Inconsistent with user expectations** (most users don't have corporate accounts)

---

### Finding #2: Prefill API Uses "Balanced" as Fallback

**File**: `/webapp/app/api/simulation/prefill/route.ts` (lines 479-527)

```typescript
// Calculate smart default withdrawal strategy based on asset mix and profile
let recommendedStrategy = 'balanced'; // ❌ Default fallback is 'balanced'

if (totalNetWorth > 0) {
  // Smart strategy selection logic
  if (rrifPct > 0.4) {
    recommendedStrategy = 'rrif-frontload';
  } else if (tfsaPct > 0.3 && totalRRIF > 0) {
    recommendedStrategy = 'tfsa-first';
  } else if (corporatePct > 0.3) {
    recommendedStrategy = 'corporate-optimized';
  } else if (totalOtherIncome > 50000) {
    recommendedStrategy = 'minimize-income'; // ✅ Only used if totalOtherIncome > $50k
  } else if (nonregPct > 0.5) {
    recommendedStrategy = 'capital-gains-optimized';
  } else if (age < 65) {
    recommendedStrategy = 'balanced';
  } else {
    recommendedStrategy = 'balanced'; // ❌ Default for "typical retiree with mixed assets"
  }
}
```

**Issue**: The prefill API's smart strategy recommendation system:
1. **Falls back to 'balanced'** when `totalNetWorth === 0` (line 480)
2. **Uses 'balanced' as the default for typical retirees** (lines 521-525)
3. **Only recommends 'minimize-income'** if `totalOtherIncome > $50,000` (line 516)
4. **Does not prioritize GIS optimization** for low-income retirees (the primary beneficiaries)

---

### Finding #3: No "minimize-income" as Universal Default

**Analysis**:
- The prefill API **never sets** `'minimize-income'` **unless** the user has >$50k annual other income
- For users with **zero assets or typical mixed portfolios**, the strategy defaults to `'balanced'`
- This **contradicts the product vision** where `'minimize-income'` should be the default for GIS-eligible users

**Impact**:
- **Low-income retirees** (the primary GIS beneficiaries) are **not** getting GIS-optimized strategy by default
- Users like **Susan McMillan, Ian Crawford, Paul Lamothe** (deleted users) likely saw "Balanced" and didn't understand why
- **GIS optimization** (core value proposition) is **hidden** from the users who need it most

---

## User Impact

### High Impact for GIS-Eligible Users
- **Primary personas affected**: Low-income retirees, GIS-eligible couples
- **Expected outcome**: See "Income Minimization (GIS-Optimized)" as default, understand it's designed to preserve government benefits
- **Actual outcome**: See "Balanced" with generic description, no mention of GIS optimization
- **Result**: Confusion about which strategy to use, reduced trust in tool

### Contributed to User Deletions
From `DELETED_USERS_ANALYSIS.md`:
- **Ian Crawford**: "The withdrawal strategies were not discoverable and I didn't understand which one to use"
- **Susan McMillan**: "I couldn't remove my partner" (but likely also confused about strategy)
- **Paul Lamothe**: "The pension indexing feature wasn't available" (but strategy confusion possible)

**Hypothesis**: Users saw "Balanced" strategy, didn't understand what it meant, and didn't know GIS-optimized strategies existed.

---

## Recommended Fix

### Option 1: Change Universal Default to 'minimize-income' ✅ RECOMMENDED

**Rationale**:
- **GIS optimization is a core differentiator** for RetireZest
- **Most Canadian retirees benefit** from minimizing taxable income (OAS clawback avoidance)
- **Safe default**: Works well for low/moderate income retirees (majority of users)
- **Users can always change** if they prefer another strategy

**Changes Required**:

1. **Update `defaultHouseholdInput` in `/webapp/lib/types/simulation.ts`**:
   ```typescript
   export const defaultHouseholdInput: HouseholdInput = {
     // ... other fields
     strategy: 'minimize-income', // ✅ Changed from 'corporate-optimized'
     // ... other fields
   };
   ```

2. **Update prefill API fallback in `/webapp/app/api/simulation/prefill/route.ts`**:
   ```typescript
   // Line 480
   let recommendedStrategy = 'minimize-income'; // ✅ Changed from 'balanced'

   // Lines 521-526 (default for typical retiree)
   } else {
     // Default for typical retiree with mixed assets
     // GIS optimization is beneficial for most Canadian retirees
     recommendedStrategy = 'minimize-income'; // ✅ Changed from 'balanced'
   }
   ```

3. **Update `isDefaultStrategy()` logic** (already references `defaultHouseholdInput.strategy`, so no change needed)

**Testing**:
- [ ] New user with no assets sees "Income Minimization (GIS-Optimized)" as default
- [ ] User with typical mixed portfolio sees "Income Minimization (GIS-Optimized)" as default
- [ ] User with >40% RRIF sees "Early RRIF Withdrawals (Income Splitting)" (override works)
- [ ] User with >30% corporate sees "Corporate Optimized" (override works)
- [ ] Default indicator shows "(Default)" for minimize-income strategy

**Migration**:
- No database migration needed (strategy is stored in simulation results, not user profile)
- Existing simulations preserve their selected strategy
- Only new simulations use new default

---

### Option 2: Make Default Strategy User-Configurable (Future Enhancement)

**Epic**: Advanced Preferences
**Story Points**: 3 pts
**Description**: Allow users to set their preferred default strategy in account settings

**Pros**:
- Ultimate flexibility
- Power users can optimize for their situation

**Cons**:
- Adds complexity
- Most users won't use it
- Doesn't solve the "good default" problem

**Recommendation**: Defer to Sprint 3 or later

---

### Option 3: Keep 'balanced' but Improve Smart Recommendation Logic

**Changes**:
- Make smart recommendation logic **more aggressive** about recommending 'minimize-income'
- Consider **GIS eligibility** in recommendation algorithm
- Use **age and asset thresholds** to recommend GIS optimization

**Pros**:
- More personalized
- Educates users about best strategy for their situation

**Cons**:
- Complex to implement correctly
- Requires GIS eligibility calculation on prefill
- May still miss edge cases
- Doesn't solve the "fallback" problem

**Recommendation**: Defer to Sprint 3 as enhancement to Option 1

---

## Decision

**Recommended**: Implement **Option 1** (Change universal default to 'minimize-income')

**Justification**:
1. ✅ **Aligns with product vision** (GIS optimization is core value prop)
2. ✅ **Benefits majority of users** (most Canadian retirees benefit from income minimization)
3. ✅ **Simple to implement** (2 line changes)
4. ✅ **Low risk** (users can still select other strategies)
5. ✅ **Addresses user deletion feedback** (Ian Crawford's confusion about strategies)
6. ✅ **No database migration** needed

**Story Points**: 1 pt (trivial code change)
**Priority**: P1 (High) - Impacts user understanding and trust
**Sprint**: Sprint 2 (add to backlog immediately)

---

## Acceptance Criteria

- [ ] Default strategy in `defaultHouseholdInput` is `'minimize-income'`
- [ ] Prefill API fallback strategy is `'minimize-income'`
- [ ] Default indicator shows "(Default)" for minimize-income in results
- [ ] Strategy selector shows "Income Minimization (GIS-Optimized)" when page loads
- [ ] Smart recommendation logic still overrides for users with specific asset mixes (RRIF>40%, corporate>30%, etc.)
- [ ] Manual testing: New user with no profile data sees minimize-income as default
- [ ] Manual testing: User with typical portfolio sees minimize-income as default

---

## Files to Modify

1. `/webapp/lib/types/simulation.ts` (line 565)
2. `/webapp/app/api/simulation/prefill/route.ts` (lines 480, 525)

**Total Changes**: 3 lines

---

## Related User Stories

- **US-026**: Display Current Strategy Selection (✅ Complete, but default is wrong)
- **US-025**: Improve Withdrawal Strategy Discoverability (📋 To Do, next in Sprint 2)
- **US-027**: Educational Guidance: Withdrawal Order to Save Taxes & Avoid Clawback (📋 To Do)

---

## Next Steps

1. ✅ Document bug in this report (COMPLETE)
2. 📋 Add US-029 to Sprint 2 backlog: "Fix Default Strategy to minimize-income" [1 pt]
3. 📋 Implement US-029 before continuing with US-025
4. 📋 Verify fix with manual testing
5. 📋 Deploy to production
6. 📋 Monitor user feedback

---

**Document Owner**: Development Team
**Last Updated**: January 29, 2026
**Priority**: P1 (High)
**Estimated Effort**: 30 minutes
