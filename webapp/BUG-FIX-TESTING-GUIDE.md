# Bug Fix Testing Guide - Non-Registered Assets

## Date: 2025-12-07

## Bug Fixed

**Issue**: Non-Registered assets ($830,000) not loading into simulation
**File Modified**: `/app/api/simulation/prefill/route.ts`
**Lines Changed**: 64-72
**Fix**: Added `case 'NONREG':` and `case 'CORP':` to asset type matching

---

## Testing Instructions

### Pre-Test Verification

**Expected User Portfolio** (from Assets page):
- TFSA: $183,000 (5.1%)
- RRSP/RRIF: $185,000 (5.2%)
- Corporate: $2,360,000 (66.3%)
- Non-Registered: $830,000 (23.3%)
- **Total**: $3,558,000

### Test 1: Verify Server Status

**Check Next.js Server**:
```bash
curl http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "checks": {
    "database": {"status": "up"},
    "pythonApi": {"status": "up"}
  }
}
```

**Check Python API**:
```bash
curl http://localhost:8000/
```

**Expected**: Any response (API is running)

---

### Test 2: Check Prefill Data

**Open browser console** (F12 in Chrome/Firefox) and run:

```javascript
// Navigate to http://localhost:3000/simulation first
fetch('/api/simulation/prefill')
  .then(r => r.json())
  .then(data => {
    console.log('=== PREFILL DATA ===');
    console.log('TFSA:', data.personInput.tfsa_balance);
    console.log('RRSP:', data.personInput.rrsp_balance);
    console.log('RRIF:', data.personInput.rrif_balance);
    console.log('Corporate:', data.personInput.corporate_balance);
    console.log('Non-Reg Total:', data.personInput.nonreg_balance);
    console.log('Non-Reg Cash:', data.personInput.nr_cash);
    console.log('Non-Reg GIC:', data.personInput.nr_gic);
    console.log('Non-Reg Invest:', data.personInput.nr_invest);
    console.log('Total Net Worth:', data.totalNetWorth);
  });
```

**Expected Output** (AFTER FIX):
```
=== PREFILL DATA ===
TFSA: 183000
RRSP: 0 (or actual value if user has RRSP)
RRIF: 185000
Corporate: 2360000
Non-Reg Total: 830000        ← SHOULD NOT BE ZERO!
Non-Reg Cash: 83000          ← 10% of 830k
Non-Reg GIC: 166000          ← 20% of 830k
Non-Reg Invest: 581000       ← 70% of 830k
Total Net Worth: 3558000
```

**BEFORE FIX** (What was wrong):
```
Non-Reg Total: 0             ← BUG!
Non-Reg Cash: 0
Non-Reg GIC: 0
Non-Reg Invest: 0
Total Net Worth: 2728000     ← Missing $830k!
```

---

### Test 3: Visual Verification on Simulation Page

**Steps**:
1. Navigate to http://localhost:3000/simulation
2. Wait for page to load and auto-population to complete
3. Look for **blue success alert**: "Your financial profile and assets have been automatically loaded"
4. Click on **"Review Auto-Populated Values"** section to expand it

**Verify Account Balances Display**:
- ✅ TFSA: $183,000
- ✅ RRSP: $0 (if user has no RRSP)
- ✅ RRIF: $185,000
- ✅ Non-Registered: **$830,000** ← KEY FIX
- ✅ Corporate: $2,360,000

**Scroll down to "Person 1" form** and expand "Account Balances" section:

**Verify Non-Registered Fields**:
- ✅ Non-Reg Cash: $83,000
- ✅ Non-Reg GIC: $166,000
- ✅ Non-Reg Investments: $581,000
- ✅ Non-Reg ACB: $664,000 (80% of balance)

---

### Test 4: Run Full Simulation

**Steps**:
1. On simulation page, click **"Run Simulation"** button
2. Wait 2-5 seconds for completion
3. Switch to **"Results"** tab
4. Review the results

**Expected Changes** (compared to before fix):

#### Portfolio Composition (NEW)
- TFSA: **5.1%** (was 11.3%)
- RRIF: **5.2%** (was 0.0%)
- Non-Registered: **23.3%** (was 0.0%) ← KEY CHANGE
- Corporate: **66.3%** (was 88.7%)

#### Tax Metrics (SHOULD CHANGE)
- **Total Tax Paid**: Higher than before (more capital gains tax)
- **Avg Effective Tax Rate**: **4-6%** (was 1.7%)
- **Total Withdrawals**: May change based on new strategy
- **Total Spending**: Should remain similar (~$3.8M)

#### Estate Value (MAY CHANGE)
- **Final Estate (Gross)**: May be lower (paying more tax during life)
- **Final Estate (Net)**: Should be closer to gross (less estate tax)
- **Total Estate Tax**: Should be lower (less in corporate account at death)

---

### Test 5: Verify Capital Gains Calculations

**In Year-by-Year Table** (scroll down on Results tab):

**Look for columns**:
- `cap_gains_p1` or similar
- `taxable_inc_p1`

**Expected**:
- Capital gains should appear when withdrawing from Non-Registered
- Tax should be calculated on 50% of capital gains (inclusion rate)

**Example Year Calculation**:
```
Withdrawal from Non-Reg: $50,000
ACB Ratio: $664,000 / $830,000 = 0.80
ACB of withdrawal: $50,000 × 0.80 = $40,000
Capital Gain: $50,000 - $40,000 = $10,000
Taxable (50%): $5,000
Tax at 30%: $1,500
```

---

### Test 6: Compare With Previous Results

**If you saved the previous simulation screenshot:**

| Metric | Before Fix | After Fix | Status |
|--------|-----------|-----------|--------|
| TFSA % | 11.3% | 5.1% | ✅ Corrected |
| Non-Reg % | 0.0% | 23.3% | ✅ Fixed |
| Corporate % | 88.7% | 66.3% | ✅ Corrected |
| Effective Tax Rate | 1.7% | 4-6% | ✅ More realistic |
| Total Net Worth | $2.7M | $3.6M | ✅ Includes all assets |

---

## Expected Behavioral Changes

### Withdrawal Strategy

**Before Fix** (only TFSA + Corporate):
1. Withdraw from TFSA first (tax-free)
2. Take corporate dividends (with tax credit)
3. Deplete TFSA
4. Increase corporate withdrawals

**After Fix** (includes Non-Registered):
1. Withdraw from TFSA first (tax-free)
2. Start Non-Registered withdrawals early (lower cap gains tax)
3. Use corporate dividends for additional income
4. Deplete Non-Registered by mid-retirement
5. Increase corporate withdrawals later

**Reasoning**: Non-Registered accounts are more tax-efficient early in retirement when income is lower (lower marginal tax on capital gains).

### Tax Efficiency

**Capital Gains Treatment**:
- Only 50% of gains are taxable
- At lower income levels (~$40-60k/year), marginal rate is ~30%
- Effective tax on gains: 15% (50% × 30%)
- Much better than corporate dividends at higher rates

**Withdrawal from Non-Reg**:
- If total gain is $166k (20% of $830k)
- Spread over 10 years: $16.6k/year realized
- Taxable: $8.3k/year
- Tax: ~$2.5k/year
- Total tax on Non-Reg: ~$25k (vs. $0 previously)

---

## Regression Testing

### Ensure Nothing Broke

**Test Manual Entry** (without auto-populate):
1. Open simulation in incognito/private window
2. Manually enter values
3. Verify simulation still works

**Test Partner Addition**:
1. Click "Add Spouse/Partner"
2. Enter partner data
3. Verify both persons load correctly

**Test All Charts**:
- ✅ Portfolio chart displays
- ✅ Tax chart displays
- ✅ Spending chart displays
- ✅ Government benefits chart displays
- ✅ Year-by-year table displays

---

## Success Criteria

### ✅ Fix is Working If:

1. **Prefill API** returns `nonreg_balance: 830000` (not 0)
2. **Review section** shows Non-Registered: $830,000
3. **Portfolio composition** shows ~23% Non-Registered
4. **Effective tax rate** is 4-6% (not 1.7%)
5. **Total net worth** is $3,558,000 (not $2,728,000)
6. **Capital gains** appear in year-by-year breakdown
7. **No errors** in browser console
8. **No errors** in server logs

### ⚠️ Issues to Watch For:

1. **ACB warnings**: Should see warning about ACB being estimated
2. **Higher taxes**: User might be surprised tax rate increased
3. **Different strategy**: Withdrawal order may change
4. **Estate value**: Might be lower than before

---

## Browser Console Debugging

**If issues occur**, check console for errors:

```javascript
// Open DevTools (F12), Console tab

// Check for errors
console.error('Look for red error messages');

// Manually test prefill
fetch('/api/simulation/prefill')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Manually test simulation
fetch('/api/simulation/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': 'TOKEN_HERE'
  },
  body: JSON.stringify({ /* household data */ })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## Server Logs to Monitor

**Next.js Server** (Terminal 1):
```
Look for:
✓ Compiled successfully
✓ Ready in Xms

Avoid:
✗ Error: ...
⨯ Failed to compile
```

**Python API** (Terminal 2 or `/tmp/python-api.log`):
```
Look for:
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete

Avoid:
ERROR: ...
Traceback (most recent call last):
```

---

## Rollback Plan

**If fix causes issues**:

1. **Revert the change**:
```bash
cd /Users/jrcb/Documents/GitHub/retirezest/webapp
git diff app/api/simulation/prefill/route.ts
git checkout app/api/simulation/prefill/route.ts
```

2. **Restart server** (auto-reloads, but to be sure):
```bash
# Next.js restarts automatically
# Python API: kill and restart if needed
```

3. **Report issue** with:
- Browser console errors
- Server logs
- Simulation input data
- Expected vs. actual output

---

## Post-Testing

**After confirming fix works**:

1. **Document results**: Take screenshot of new simulation results
2. **Compare**: Note differences from previous simulation
3. **Communicate changes**: Explain to stakeholders why numbers changed
4. **Consider enhancements**:
   - Add ACB tracking to Asset model?
   - Add asset allocation fields?
   - Implement actual CPP/OAS amounts?

---

## User Communication Template

**Message to user**:

> I've fixed a critical bug that was causing your Non-Registered assets ($830,000) to be excluded from the simulation.
>
> **What changed**:
> - Your Non-Registered accounts are now included
> - Total portfolio is now correctly shown as $3.6M (was $2.7M)
> - Tax rate is now 4-6% (was incorrectly showing 1.7%)
> - Withdrawal strategy has changed to optimize capital gains tax
>
> **What this means**:
> - More accurate retirement projections
> - Better tax optimization
> - More realistic effective tax rates
>
> **Action needed**:
> Please re-run your simulation to see the corrected results. The new numbers are more accurate and realistic for your situation.

---

**Prepared by**: Claude Code
**Date**: 2025-12-07
**Status**: Fix applied, ready for testing
**Servers**: Running and healthy
