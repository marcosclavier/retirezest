# RRSP Contribution Recommendations - CRA Compliance Review

**Date:** 2026-01-21
**Status:** ⚠️ **REVIEW REQUIRED**
**Reviewer:** Claude Code

---

## Executive Summary

After reviewing the early retirement calculator's recommendations for RRSP contributions, **I have identified a significant CRA compliance gap**:

### Critical Finding:
The calculator recommends "Increase monthly savings to $X" and "Maximize RRSP contributions" **WITHOUT considering CRA RRSP contribution limits**, which are based on:
- **18% of prior year's earned income**
- **Annual maximum ($32,490 for 2026)**
- **Pension adjustments** (if applicable)
- **Unused contribution room** from prior years

---

## The Problem

### What the Calculator Currently Does:

The early retirement calculator (`/app/api/early-retirement/calculate/route.ts`) calculates how much **additional monthly savings** a user needs to close their retirement savings gap:

```typescript
// Line 191-193 in calculate/route.ts
const additionalMonthlySavings = savingsGap > 0
  ? calculateMonthlyPayment(savingsGap, assumedReturn / 12, yearsToRetirement * 12)
  : 0;
```

This `additionalMonthlySavings` value is then displayed to users in:

1. **ActionPlan.tsx** (lines 40-47):
```typescript
title: `Increase monthly savings to $${Math.round(additionalMonthlySavings)}`,
description: `Add $${Math.round(additionalMonthlySavings)}/month to close your savings gap.`
```

2. **ActionPlan.tsx** (lines 51-59):
```typescript
title: 'Maximize RRSP contributions',
description: 'Check your RRSP contribution room and maximize tax-deferred savings.'
```

3. **SavingsGapAnalysis.tsx** (lines 169-172):
```typescript
Increase your monthly savings by <strong>${Math.round(additionalMonthlySavings)}/month</strong>
to retire at age {targetRetirementAge}.
```

### What's Missing:

The calculator does **NOT**:
- ❌ Calculate the user's actual RRSP contribution room
- ❌ Check if the recommended savings amount exceeds CRA RRSP limits
- ❌ Warn users when the recommendation exceeds their RRSP contribution limit
- ❌ Suggest alternative tax-advantaged accounts (TFSA, non-registered) when RRSP room is maxed
- ❌ Consider pension adjustments from employer pensions
- ❌ Account for carry-forward of unused RRSP contribution room

---

## CRA RRSP Contribution Rules (2026)

### Key CRA Rules:

1. **Annual RRSP Deduction Limit** = Lesser of:
   - **18% of prior year's earned income**, OR
   - **$32,490** (2026 annual maximum)
   - PLUS: Unused contribution room from prior years
   - MINUS: Pension adjustment (if you have an employer pension)

2. **RRSP to RRIF Conversion:**
   - Must convert RRSP to RRIF by **December 31 of the year you turn 71**
   - After age 71, NO new RRSP contributions allowed

3. **Over-Contribution Penalty:**
   - 1% per month on contributions exceeding your limit by more than $2,000

### Example:

**User Profile:**
- Annual Income: $85,000
- Age: 45
- No employer pension

**CRA RRSP Contribution Limit (2026):**
- 18% of $85,000 = **$15,300**
- Annual maximum = $32,490
- **User's limit = $15,300/year = $1,275/month**

**Current Calculator Recommendation:**
- Savings Gap: $300,000
- Years to Retirement: 15
- Recommended Monthly Savings: **$1,500/month**

### The Problem:
The calculator recommends $1,500/month, but the user can only contribute **$1,275/month** to their RRSP (based on 18% rule). The extra **$225/month must go to TFSA or non-registered accounts**, which have different tax implications.

---

## Impact on Users

### Scenario 1: User follows recommendation blindly
- Contributes $1,500/month to RRSP ($18,000/year)
- CRA limit is only $15,300/year
- **Over-contribution: $2,700/year**
- **CRA penalty: 1% per month on excess = $27/month = $324/year**

### Scenario 2: User is confused
- Sees "Maximize RRSP contributions" recommendation
- Sees "Save $1,500/month" recommendation
- Doesn't know how to split between RRSP, TFSA, non-registered
- **May not maximize tax efficiency**

### Scenario 3: User has employer pension
- Has Pension Adjustment (PA) of $10,000
- Effective RRSP room = $15,300 - $10,000 = **$5,300/year**
- Calculator recommends $18,000/year
- **Massive over-contribution risk**

---

## Recommended Fixes

### Priority 1: Add RRSP Limit Validation (HIGH PRIORITY)

Update `/app/api/early-retirement/profile/route.ts` to fetch:
- Annual income (already available)
- Employer pension status
- Pension adjustment (if applicable)

Update `/app/api/early-retirement/calculate/route.ts` to:
1. Calculate user's RRSP contribution limit:
   ```typescript
   const rrspAnnualLimit = Math.min(
     annualIncome * 0.18,
     CRA_CONSTANTS.RRSP_ANNUAL_LIMIT_2026
   ) - pensionAdjustment;
   ```

2. Calculate RRSP vs TFSA vs Non-Registered split:
   ```typescript
   const rrspMonthlyLimit = rrspAnnualLimit / 12;
   const tfsaMonthlyLimit = CRA_CONSTANTS.TFSA_ANNUAL_LIMIT_2026 / 12;

   if (additionalMonthlySavings <= rrspMonthlyLimit) {
     // All can go to RRSP
     recommendedRrsp = additionalMonthlySavings;
     recommendedTfsa = 0;
     recommendedNonReg = 0;
   } else if (additionalMonthlySavings <= rrspMonthlyLimit + tfsaMonthlyLimit) {
     // Max RRSP, remainder to TFSA
     recommendedRrsp = rrspMonthlyLimit;
     recommendedTfsa = additionalMonthlySavings - rrspMonthlyLimit;
     recommendedNonReg = 0;
   } else {
     // Max RRSP and TFSA, remainder to non-registered
     recommendedRrsp = rrspMonthlyLimit;
     recommendedTfsa = tfsaMonthlyLimit;
     recommendedNonReg = additionalMonthlySavings - rrspMonthlyLimit - tfsaMonthlyLimit;
   }
   ```

3. Return account-specific recommendations in API response:
   ```typescript
   craInfo: {
     // ... existing fields
     rrspContributionLimit: rrspAnnualLimit,
     recommendedContributions: {
       rrsp: recommendedRrsp * 12,
       tfsa: recommendedTfsa * 12,
       nonRegistered: recommendedNonReg * 12,
     },
     warnings: [
       // Warnings if recommendations exceed limits
     ],
   }
   ```

### Priority 2: Update UI Components (HIGH PRIORITY)

Update `/components/retirement/ActionPlan.tsx`:
- Change generic "Increase monthly savings" to specific account recommendations
- Example:
  ```
  RRSP: $1,275/month (your CRA limit)
  TFSA: $225/month
  Total: $1,500/month
  ```

Update `/components/retirement/SavingsGapAnalysis.tsx`:
- Show account-specific breakdown
- Warn if recommendation exceeds RRSP limits

### Priority 3: Add CRA Constants for 2026 (MEDIUM PRIORITY)

Add to `CRA_CONSTANTS` in `/app/api/early-retirement/calculate/route.ts`:
```typescript
const CRA_CONSTANTS = {
  // ... existing constants

  // RRSP Contribution Limits (2026)
  RRSP_CONTRIBUTION_RATE: 0.18, // 18% of earned income
  RRSP_ANNUAL_LIMIT_2026: 32490, // Maximum RRSP contribution (2026)
  RRSP_OVER_CONTRIBUTION_BUFFER: 2000, // Allowed over-contribution without penalty
  RRSP_OVER_CONTRIBUTION_PENALTY: 0.01, // 1% per month on excess

  // Additional Notes
  RRSP_NO_CONTRIBUTIONS_AFTER_71: true, // Cannot contribute to RRSP after age 71
};
```

### Priority 4: Database Schema Updates (MEDIUM PRIORITY)

Consider adding to User model in Prisma:
```prisma
model User {
  // ... existing fields

  hasEmployerPension   Boolean  @default(false)
  pensionAdjustment    Float?   @default(0)
  unusedRrspRoom       Float?   @default(0) // From prior years
  unusedTfsaRoom       Float?   @default(0) // Cumulative since 2009
}
```

---

## Testing Plan

### Test Case 1: User within RRSP limits
**Input:**
- Income: $85,000
- Recommended savings: $1,000/month
- RRSP limit: $1,275/month

**Expected Output:**
- RRSP: $1,000/month ✅
- TFSA: $0/month
- No warnings

### Test Case 2: User exceeds RRSP limits
**Input:**
- Income: $85,000
- Recommended savings: $2,000/month
- RRSP limit: $1,275/month
- TFSA limit: $583/month

**Expected Output:**
- RRSP: $1,275/month (your CRA limit)
- TFSA: $583/month (max TFSA)
- Non-Registered: $142/month
- **Warning:** "Recommended savings exceed RRSP contribution room. We've split across tax-advantaged accounts."

### Test Case 3: User approaching age 71
**Input:**
- Age: 70
- Target retirement: 72
- Recommended savings: $1,500/month

**Expected Output:**
- **Warning:** "You must convert RRSP to RRIF by December 31, 2027 (age 71). After age 71, you cannot make new RRSP contributions. Consider TFSA for continued tax-advantaged savings."
- TFSA: $583/month
- Non-Registered: $917/month

### Test Case 4: User with employer pension
**Input:**
- Income: $85,000
- Pension Adjustment: $10,000
- Recommended savings: $1,500/month

**Expected Output:**
- RRSP limit: ($85,000 * 0.18) - $10,000 = $5,300/year = **$442/month**
- RRSP: $442/month (reduced due to employer pension)
- TFSA: $583/month
- Non-Registered: $475/month
- **Note:** "Your RRSP room is reduced by your employer pension contribution (Pension Adjustment)."

---

## CRA Compliance Checklist

### Current Status:
- ✅ RRSP to RRIF age (71) is documented
- ✅ TFSA annual limit ($7,000) is documented
- ❌ **RRSP contribution limits (18% rule) NOT implemented**
- ❌ **RRSP annual maximum ($32,490) NOT implemented**
- ❌ **Pension adjustment NOT considered**
- ❌ **Over-contribution warnings NOT provided**
- ❌ **Account-specific recommendations NOT provided**
- ❌ **Age 71 RRSP contribution cutoff NOT enforced in recommendations**

### After Fixes:
- ✅ All CRA RRSP rules implemented
- ✅ Account-specific contribution recommendations
- ✅ Over-contribution warnings
- ✅ Pension adjustment support
- ✅ Age-based RRSP contribution cutoff
- ✅ Tax-optimal account allocation

---

## Timeline

### Immediate (This Week):
1. Add CRA RRSP contribution constants
2. Implement RRSP limit calculation based on 18% rule
3. Add warnings when recommendations exceed RRSP limits

### Short-term (Next 2 Weeks):
4. Update UI to show account-specific recommendations
5. Add pension adjustment support
6. Implement age-based RRSP contribution cutoff

### Medium-term (Next Month):
7. Add database fields for employer pension and unused contribution room
8. Allow users to input their actual RRSP/TFSA contribution room from CRA Notice of Assessment
9. Generate personalized tax-optimization strategies

---

## References

### Official CRA Resources:
- **RRSP Contribution Limits:** https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp.html
- **RRSP Deduction Limit:** https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/where-find-your-rrsp-deduction-limit.html
- **Pension Adjustments:** https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp/pension-adjustment-guide.html
- **RRSP Over-Contributions:** https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/excess-contributions.html

---

## Conclusion

The early retirement calculator currently provides **generic savings recommendations without considering CRA RRSP contribution limits**. This creates:

1. **Legal Risk:** Users may over-contribute and face CRA penalties
2. **Tax Inefficiency:** Users don't know how to optimally split contributions across RRSP, TFSA, and non-registered accounts
3. **User Confusion:** Recommendations may be impossible to follow (e.g., "save $2,000/month in RRSP" when limit is $1,275)

### Recommendation:
Implement **Priority 1 and Priority 2 fixes immediately** to ensure CRA compliance and provide accurate, actionable advice to users.

---

**Status:** ⚠️ **REQUIRES IMMEDIATE ACTION**
**Next Steps:** Implement RRSP contribution limit validation and account-specific recommendations

---

**End of Review**
