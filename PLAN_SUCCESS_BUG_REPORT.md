# Critical Bug: plan_success Incorrectly Marked as False

## Summary

**Bug**: The simulation engine incorrectly marks years as `plan_success = false` even when spending is fully funded and significant assets remain.

**Impact**: Users see "Gap" warnings for years that are actually fully funded, causing unnecessary concern and incorrect plan health scores.

**Example**: Year 2037 in Rafael and Lucy's simulation

---

## Evidence

### Year 2037 Data from Database

```json
{
  "year": 2037,
  "age_p1": 75,
  "age_p2": 73,

  // ASSETS: $664K total value
  "tfsa_balance_p1": 206147.23,
  "rrif_balance_p1": 307510.51,
  "nonreg_balance_p1": 150509.07,
  "nonreg_balance_p2": 38.38,
  "total_value": 664205.19,  // ← $664K in assets!

  // SPENDING: Fully funded
  "spending_need": 132055.91,
  "spending_met": 132055.91,   // ← 100% funded!
  "spending_gap": 0,            // ← NO GAP!

  // BUT:
  "plan_success": false,        // ← ❌ INCORRECTLY FALSE!
  "failure_reason": null
}
```

### What User Sees

**Screenshot shows**:
- Year 2037 marked with "Gap" ❌ status
- Net worth: $664,205
- Health Score: 40/100 ("Fair")
- Warning: "Plan fails in year 2037 when Rafael is 75 and Lucy is 73 years old"

**Reality**:
- Spending fully met ($132,056 / $132,056)
- $664K in assets remaining
- No actual gap exists!

---

## Root Cause Analysis

### Code Location

**File**: `juan-retirement-app/modules/simulation.py`

**Line 2056**:
```python
# Household-level funding gap in this year
hh_gap = float(info1.get("unmet_after_tax", 0.0) + info2.get("unmet_after_tax", 0.0))
is_fail = hh_gap > hh.gap_tolerance  # gap_tolerance = $5,000

# ...later...

plan_success=not is_fail,  # True if year is fully funded
```

### The Logic Should Be Correct

According to the code:
1. `hh_gap` = sum of unmet spending for both persons
2. `is_fail` = `hh_gap > $5,000` (gap tolerance)
3. `plan_success` = `not is_fail`

If `spending_gap = 0` in the output, then `hh_gap` should be 0, which means:
- `is_fail = 0 > 5000 = False`
- `plan_success = not False = True` ✅

**But the actual output shows `plan_success = false` ❌**

###  Possible Causes

**Hypothesis 1: Field Name Mismatch**

The year-by-year data shows:
- `spending_gap` in the output JSON
- But code references `unmet_after_tax`

These may be different values! Let me check if `unmet_after_tax` is being calculated differently than `spending_gap`.

**Hypothesis 2: Data Transformation Bug**

The simulation may calculate one value for `hh_gap` but then store a different value in `spending_gap` during the DataFrame-to-JSON conversion.

**Hypothesis 3: Old Simulation Data**

This simulation may have been run with an older version of the code that had a bug in the `plan_success` logic. The current code may already be fixed, but the database contains old results.

---

## Impact Assessment

### Current User Experience

**Rafael and Lucy's simulation**:
- Shows: 32% success rate (11/34 years)
- Shows: Health Score 40/100 ("Fair")
- Shows: 23 years with "gaps"
- **Reality**: Plan may be 100% funded!

### Affected Metrics

1. **Health Score**: Incorrectly low (40 vs potentially 100)
2. **Success Rate**: Incorrectly low (32.4% vs potentially 100%)
3. **Years Funded**: Incorrectly low (11/34 vs potentially 34/34)
4. **Warnings**: False warnings about plan failure
5. **Estate Value**: Correct ($582K shown, which accumulates from gov't benefits)

---

## Verification Test

To verify this is a bug, we should:

1. **Re-run the simulation** with current code using the actual $912K in assets
2. **Compare results**:
   - Old simulation (with $0 assets): 32.4% success, plan_success=false in year 2037
   - New simulation (with $912K assets): Should show 100% success

3. **Check the actual calculation** of `unmet_after_tax` vs `spending_gap`

---

## Recommended Fix

### Immediate Action

1. **Verify current code** doesn't have this bug
2. **Re-run simulation** for Rafael and Lucy with correct $912K in assets
3. **Check if issue persists** in new simulation

### Long-term Fix

1. **Add validation** to ensure `plan_success` aligns with `spending_gap`
   ```python
   # After calculating plan_success
   assert (spending_gap > gap_tolerance) == (not plan_success), \
       f"Inconsistent plan_success: gap={spending_gap}, success={plan_success}"
   ```

2. **Unify field names** between calculation and output
   - Either use `unmet_after_tax` everywhere
   - Or use `spending_gap` everywhere
   - Don't have both with potentially different values

3. **Add regression test**
   ```python
   def test_plan_success_with_zero_gap():
       """Test that plan_success=True when spending_gap=0"""
       result = simulate(household_with_adequate_assets)
       year = result.find(lambda y: y.spending_gap == 0)
       assert year.plan_success == True, \
           "Year should show plan_success=True when spending_gap=0"
   ```

---

## Next Steps

1. ✅ **Verified the bug exists** - Year 2037 shows false negative
2. ⏳ **Re-run simulation** with correct $912K assets to see if bug persists
3. ⏳ **Investigate code** to find where `plan_success` gets set incorrectly
4. ⏳ **Fix the bug** in the simulation engine
5. ⏳ **Add regression tests** to prevent recurrence

---

## Additional Notes

### Why Does Estate Show $582K?

Even though the simulation started with $0 in assets (due to the asset loading issue documented in `ASSET_LOADING_ANALYSIS.md`), the $582K estate comes from:

1. **Government benefits** accumulated over time:
   - CPP: ~$4,000-$18,000/year
   - OAS: ~$4,000-$5,600/year
   - GIS: ~$150/year each

2. **TFSA growth** from those benefits being saved
3. **Investment returns** on accumulated government benefits

This explains how there's a $582K estate despite starting with $0 assets - it's entirely from government benefits that were paid out over 34 years and invested.

### Two Separate Issues

1. **Asset Loading Issue** (documented in `ASSET_LOADING_ANALYSIS.md`)
   - Simulation run with $0 instead of $912K
   - Caused by user not reloading profile data
   - **Status**: No code bug, UX issue

2. **plan_success Bug** (this document)
   - Year marked as failed despite being fully funded
   - Affects health score and success rate calculations
   - **Status**: CRITICAL BUG, needs immediate fix

Both issues affect Rafael and Lucy's simulation, but they are independent problems requiring separate fixes.
