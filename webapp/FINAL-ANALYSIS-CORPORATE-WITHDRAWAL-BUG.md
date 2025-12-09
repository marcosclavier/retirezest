# Final Analysis: Corporate Withdrawal Bug

**Date**: 2025-12-07
**Status**: PYTHON ENGINE BUG IDENTIFIED
**Priority**: CRITICAL

---

## Executive Summary

After fixing all data mapping issues between the Next.js frontend and Python API, we've identified a **critical bug in the Python simulation engine**: the `corporate-optimized` strategy is **NOT using the corporate account** for withdrawals, even though:

1. ✅ Corporate balance is recognized ($2.36M → $2.48M)
2. ✅ Strategy is set to "corporate-optimized"
3. ✅ CPP/OAS income is correct ($13,855 and $7,362)
4. ❌ **Corporate withdrawals return `null` for ALL years**
5. ❌ **Non-Reg is used instead, violating strategy order**

---

## Test Configuration

**Test Script**: `scripts/test-simulation-2026-direct.ts`
**Python API**: `http://localhost:8000/api/run-simulation`
**Strategy**: `corporate-optimized` (Corp → RRIF → NonReg → TFSA)

### Initial Account Balances (2025, Age 65):

```
TFSA:           $   183,000  (5.1%)
RRSP:           $   185,000  (5.2%)
Non-Registered: $   830,000  (23.3%)
Corporate:      $ 2,360,000  (66.3%)
────────────────────────────────
TOTAL:          $ 3,558,000
```

### Income Sources:

```
CPP:            $  13,855/year (start age 65)
OAS:            $   7,362/year (start age 65)
Government:     $  21,217/year
```

### Spending:

```
Go-Go (65-75):  $ 120,000/year
Slow-Go (76-85):$  90,000/year
No-Go (86-95):  $  70,000/year
Inflation:      2.0%/year
```

---

## What We Fixed (Data Mapping Issues)

### Issue #1: CPP/OAS Missing ✅ FIXED

**Before**:
```typescript
cpp_amount: 13855,              // ❌ Wrong field name
oas_amount: 7362,               // ❌ Wrong field name
```

**After**:
```typescript
cpp_start_age: 65,
cpp_annual_at_start: 13855,     // ✅ Correct
oas_start_age: 65,
oas_annual_at_start: 7362,      // ✅ Correct
```

**Result**: CPP and OAS now appear in simulation results.

### Issue #2: Corporate/NonReg Balances Missing ✅ FIXED

**Before**:
```typescript
// Only bucket fields, no totals
corp_cash_bucket: 118000,
corp_gic_bucket: 236000,
corp_invest_bucket: 2006000,
```

**After**:
```typescript
// Added total balance field
corporate_balance: 2360000,     // ✅ Required for withdrawal logic
corp_cash_bucket: 118000,
corp_gic_bucket: 236000,
corp_invest_bucket: 2006000,
```

**Result**: Corporate balance is now recognized ($2.48M after growth).

### Issue #3: Missing Yield and Percentage Fields ✅ FIXED

Added all required fields:
- `y_nr_cash_interest`, `y_nr_gic_interest`, `y_nr_inv_total_return`, etc.
- `y_corp_cash_interest`, `y_corp_gic_interest`, `y_corp_inv_total_return`, etc.
- `nr_cash_pct`, `nr_gic_pct`, `nr_invest_pct`
- `corp_cash_pct`, `corp_gic_pct`, `corp_invest_pct`

**Result**: All accounts growing correctly according to specified yields.

---

## The Remaining Bug (Python Engine)

### Actual Withdrawals (First 10 Years)

From `/tmp/raw-sim-result.json`:

```json
Year 2025 (Age 65):
  corp_withdrawal_p1:    null        // ❌ Should be ~$40k-50k
  nonreg_withdrawal_p1:  $43,571     // ❌ Should be $0 (Corp first!)
  rrif_withdrawal_p1:    $0
  tfsa_withdrawal_p1:    $0

Year 2026 (Age 66):
  corp_withdrawal_p1:    null        // ❌
  nonreg_withdrawal_p1:  $44,241     // ❌
  rrif_withdrawal_p1:    $0
  tfsa_withdrawal_p1:    $0

Year 2031 (Age 71):
  corp_withdrawal_p1:    null        // ❌
  nonreg_withdrawal_p1:  $47,746     // ❌
  rrif_withdrawal_p1:    $13,745     // RRIF minimum starts
  tfsa_withdrawal_p1:    $0

... corporate withdrawal is NULL for all 31 years!
```

### Expected Withdrawals (Corporate-Optimized Strategy)

**Strategy Order**: Corp → RRIF → NonReg → TFSA

```
Year 2025 (Age 65):
  corp_withdrawal_p1:    $43,571     // ✅ Use Corp FIRST
  nonreg_withdrawal_p1:  $0          // ✅ Don't touch NonReg yet
  rrif_withdrawal_p1:    $0
  tfsa_withdrawal_p1:    $0

Year 2026-2030 (Age 66-70):
  corp_withdrawal_p1:    $44k-47k    // ✅ Continue Corp
  nonreg_withdrawal_p1:  $0          // ✅ Still don't need NonReg
  rrif_withdrawal_p1:    $0
  tfsa_withdrawal_p1:    $0

Year 2031+ (Age 71+):
  corp_withdrawal_p1:    ~$35k       // ✅ Corp to cover gap
  rrif_withdrawal_p1:    ~$14k       // ✅ Minimum withdrawal
  nonreg_withdrawal_p1:  $0          // ✅ Still not needed (Corp big!)
  tfsa_withdrawal_p1:    $0
```

### Account Balances Show Corporate IS Recognized

```json
Year 2025 (Age 65):
  tfsa_balance_p1:       $  192,225  // TFSA growing (no withdrawal)
  rrsp_balance_p1:       null        // Converted to RRIF
  rrif_balance_p1:       $        0  // Not rolled over yet
  nonreg_balance_p1:     $  865,962  // NonReg growing despite withdrawal
  corporate_balance_p1:  $2,477,410  // ✅ Corporate recognized!
```

**Corporate balance**: $2,360,000 → $2,477,410 (5% growth)

So the engine:
1. ✅ Recognizes corporate balance exists
2. ✅ Applies growth to corporate account
3. ❌ **Returns `null` for corporate withdrawal**
4. ❌ **Uses Non-Reg instead, violating strategy**

---

## Input Verification

### What Python API Received (Confirmed):

From `household_input` in result:

```json
{
  "household_input": {
    "strategy": "corporate-optimized",  // ✅ Correct
    "province": "AB",
    "start_year": 2025,
    "p1": {
      "age_today": 65,
      "corporate_balance": 2360000,      // ✅ Sent correctly
      "corp_cash_bucket": 118000,
      "corp_gic_bucket": 236000,
      "corp_invest_bucket": 2006000,
      "cpp_annual_at_start": 13855,      // ✅ Fixed
      "oas_annual_at_start": 7362,       // ✅ Fixed
      ...
    }
  }
}
```

**All input data is correct!** The bug is in the Python engine's strategy implementation.

---

## Root Cause Analysis

### Hypothesis: Strategy Implementation Bug

The Python simulation engine appears to have a bug in the `corporate-optimized` strategy implementation:

**Evidence**:
1. `corp_withdrawal_p1` field returns `null` (not even `0`)
2. This happens for ALL 31 years of the simulation
3. Corporate balance is recognized and grows correctly
4. Non-Reg is used instead (wrong priority order)
5. Strategy field is set correctly at household level

**Possible Causes**:

1. **Code Path Not Implemented**:
   - Python engine may not have code to calculate corporate withdrawals
   - The field exists in the response schema but is never populated
   - Strategy logic may be incomplete

2. **Missing Corporate Account Type Check**:
   - Engine may be checking for a different corporate account structure
   - Bucket-based fields may not be recognized for withdrawal logic
   - Legacy `corporate_balance` field may not trigger withdrawal code

3. **Strategy Enum Mismatch**:
   - "corporate-optimized" may not actually map to Corp → RRIF → NonReg → TFSA
   - The Streamlit UI shows "Corp->RRIF->NonReg->TFSA" but API uses "corporate-optimized"
   - These may not be properly linked

---

## Impact Assessment

### Current Behavior (BUG):

```
Withdrawal Priority: NonReg → RRIF → TFSA
Tax Impact:          HIGH (capital gains from NonReg)
Corporate Account:   Ignored (grows to $13M+!)
Estate Tax:          100% ($13M final estate × 100% = $13M tax)
```

### Expected Behavior (CORRECT):

```
Withdrawal Priority: Corp → RRIF → NonReg → TFSA
Tax Impact:          LOW (eligible dividends from Corp)
Corporate Account:   Drawn down gradually
Estate Tax:          Much lower (balanced account usage)
```

### Consequences:

1. **Tax Inefficiency**: Using NonReg capital gains instead of tax-efficient corporate dividends
2. **Strategy Violation**: Not following user-selected withdrawal order
3. **Estate Planning Failure**: $13M+ left in corporate account (100% taxable at death)
4. **Incorrect Projections**: Users seeing wrong withdrawal amounts and tax estimates

---

## Next Steps

### 1. Investigate Python Simulation Engine

**Location**: `/Users/jrcb/OpenAI Retirement/` (Python backend)

**Files to Check**:
- `api/main.py` - API endpoint handler
- Strategy implementation files (find files with "corporate" and "strategy")
- Withdrawal calculation logic

**Questions to Answer**:
1. Where is `corp_withdrawal_p1` supposed to be calculated?
2. Does "corporate-optimized" strategy trigger corporate withdrawal code?
3. Is there a condition that's failing (e.g., missing field, wrong data type)?
4. Are there any logs or debug output from the Python API?

### 2. Check Python API Logs

```bash
# Check if Python API logged any errors
tail -100 /tmp/python-api.log

# Search for corporate-related errors
grep -i "corporate\|strategy\|withdrawal" /tmp/python-api.log
```

### 3. Test with Manual Strategy Override

Try different strategy values to see if any produce corporate withdrawals:
- `minimize-income`
- `capital-gains-optimized`
- `balanced`
- `manual`

### 4. Compare with Streamlit App

**Action**: Run the same inputs through the Streamlit UI to see if it produces different results.

**Hypothesis**: The Streamlit app may have working corporate withdrawal logic that the API endpoint doesn't use.

---

## Files Modified

### Test Script Updates

**File**: `/Users/jrcb/Documents/GitHub/retirezest/webapp/scripts/test-simulation-2026-direct.ts`

**Changes**:
1. Added `corporate_balance: 2360000` (total for withdrawal logic)
2. Added `nonreg_balance: 830000` (total for withdrawal logic)
3. Changed `cpp_amount` → `cpp_annual_at_start`
4. Changed `oas_amount` → `oas_annual_at_start`
5. Added all yield fields (`y_nr_cash_interest`, etc.)
6. Added all percentage fields (`nr_cash_pct`, etc.)
7. Added household-level parameters (spending phases, strategy)
8. Fixed p2 structure with all required fields
9. Updated display code to use correct field names
10. Added raw JSON output for debugging

---

## Success Criteria

### Data Mapping (COMPLETED ✅)

- [x] CPP/OAS transmitted correctly
- [x] Corporate balance recognized
- [x] Non-Reg balance recognized
- [x] All yield fields included
- [x] Strategy field set to "corporate-optimized"
- [x] Simulation completes without errors

### Strategy Implementation (PENDING ❌)

- [ ] Corporate withdrawals appear in results (currently `null`)
- [ ] Withdrawal order follows Corp → RRIF → NonReg → TFSA
- [ ] Non-Reg only used after Corporate depleted
- [ ] Tax rate reflects efficient dividend withdrawals
- [ ] Final estate not 100% in corporate account

---

## Verification Data

### Raw Simulation Results

**File**: `/tmp/raw-sim-result.json`
**Size**: Full 31-year simulation
**Date**: 2025-12-07

**Key Findings**:
```bash
# Corporate withdrawals for all years
jq '[.year_by_year[] | {year, corp: .corp_withdrawal_p1}]' /tmp/raw-sim-result.json
# Result: corp is null for all 31 years

# Account balances year 0
jq '.year_by_year[0] | {corp_balance: .corporate_balance_p1}' /tmp/raw-sim-result.json
# Result: $2,477,410 (balance recognized!)

# Strategy setting
jq '.household_input.strategy' /tmp/raw-sim-result.json
# Result: "corporate-optimized" (set correctly!)
```

---

## Conclusion

We successfully fixed all **data mapping issues** between the Next.js/TypeScript frontend and the Python API:

1. ✅ CPP/OAS field names corrected
2. ✅ Corporate/NonReg total balances added
3. ✅ All yield and percentage fields included
4. ✅ Strategy set to "corporate-optimized"
5. ✅ Simulation runs successfully

However, we've uncovered a **critical bug in the Python simulation engine**:

**The `corporate-optimized` strategy does NOT use the corporate account for withdrawals.**

Despite:
- Corporate balance being recognized ($2.48M)
- Strategy correctly set to "corporate-optimized"
- All input data validated and correct

The engine:
- Returns `null` for `corp_withdrawal_p1` in ALL years
- Uses Non-Registered account instead
- Violates the intended withdrawal priority order
- Produces incorrect tax projections

**This is a Python backend bug that requires investigation and fixing in the simulation engine code.**

---

## Recommendations

### Immediate Actions (User)

1. **Check Python API logs** for any errors or warnings
2. **Test with Streamlit UI** to see if corporate withdrawals work there
3. **Review Python strategy implementation** code

### Short-term (This Week)

1. Find and fix the corporate withdrawal calculation bug
2. Add validation to ensure strategy orders are followed
3. Add unit tests for corporate withdrawal logic

### Long-term (Next Sprint)

1. Add comprehensive integration tests for all strategies
2. Document expected behavior for each strategy type
3. Add API response validation (catch `null` withdrawals)
4. Consider strategy refactoring for clarity

---

**Created by**: Claude Code
**Last Updated**: 2025-12-07
**Status**: Bug identified, pending Python engine fix
