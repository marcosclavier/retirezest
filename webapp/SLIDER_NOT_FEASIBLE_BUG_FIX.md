# Slider "Not Feasible" Bug Fix

## Summary
Fixed a critical bug where the retirement age slider showed "Not Feasible" even when the user had surplus savings at that age.

## Root Cause

The `calculateEarliestRetirementAge()` function was calculating the earliest feasible retirement age **WITHOUT accounting for government benefits (CPP/OAS)**, while the per-age scenario calculations **DID include government benefits**.

This created a mismatch where:
1. Earliest age calculated as 74 (without $36K/year benefits)
2. Age 70 scenario shows $143K surplus (with $36K/year benefits included)
3. Slider shows "Not Feasible" at age 70 because `70 < earliestAge (74)`
4. But the scenario data correctly shows surplus because it includes benefits

## Example Case (jrcb@hotmail.com)

**User Profile:**
- Age: 67
- Current Savings: $4.2M
- Annual Expenses: $183,700
- Target Retirement Age: 70
- Has Partner: Yes

**Government Benefits at Age 70:**
- CPP: $10K × 2 = $20K/year
- OAS: $8K × 2 = $16K/year
- **Total: $36K/year**

**Before Fix:**
- Required nest egg (no benefits): $6.03M
- Projected savings at 70: $4.87M
- **Shortfall: $1.16M** → Earliest age = 74
- Slider shows "Not Feasible" at age 70 (wrong!)

**After Fix:**
- Net expenses after benefits: $183,700 - $36,000 = $147,700
- Required nest egg (with benefits): $4.85M
- Projected savings at 70: $4.87M
- **Surplus: $22K** → Earliest age = 70
- Slider shows "On Track" at age 70 (correct!)

## Files Changed

### `/app/api/early-retirement/calculate/route.ts`
**Lines 701-758:** Updated `calculateEarliestRetirementAge()` function
- Added `includePartner` parameter
- Added government benefits calculation for each retirement age
  - CPP: Available at 60+ (reduced rate) or 65+ (full rate)
  - OAS: Available at 65+
  - Doubles benefits if partner included
- Subtracts benefits from annual expenses before calculating required nest egg

**Line 369-377:** Updated function call
- Passes `body.includePartner || false` as 7th parameter
- Added comment explaining benefits are now included

### `/components/retirement/RetirementAgeSlider.tsx`
**Lines 48-51:** Already had correct feasibility logic
- Checks `shortfall === 0 || projectedSavings >= totalNeeded`
- This was correct, but earliestAge was being calculated wrong

## Testing

Created `/scripts/test-earliest-age-fix.ts` to verify the fix:

```
OLD Logic (no gov benefits): Earliest age = 74
NEW Logic (with gov benefits): Earliest age = 70

✅ BUG FIX CONFIRMED!
```

## Impact

This fix ensures:
1. Users with sufficient savings will see "On Track" instead of "Not Feasible"
2. The slider feasibility matches the scenario data
3. Government benefits are consistently accounted for throughout the calculation
4. Particularly helps users already at/near retirement age with substantial assets

## Related Issues

- Previous fix (commit c5b7d68) updated slider feasibility check logic
- But root cause was earliestAge calculation, not the slider check
- This explains why hard refresh didn't fix the issue
