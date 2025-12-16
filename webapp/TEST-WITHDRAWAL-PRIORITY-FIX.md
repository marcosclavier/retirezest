# Testing the Withdrawal Priority Fix

## What Was Fixed

**Problem**: System was preserving TFSA for legacy instead of using it to meet spending requirements.

**Fix Applied**:
1. TFSA guard now only preserves when spending is fully met
2. TFSA cost penalty reduced from 10% to 2%
3. System now prioritizes: Spending > Tax Efficiency > Legacy

---

## Test Through Web Interface

### **Test Scenario 1: High Spending with Modest Balances**

**Setup** (navigate to Simulation page):

1. **Person 1** (Age 74):
   - RRIF: $60,000
   - TFSA: $80,000
   - NonReg: $40,000
   - Corp: $20,000
   - Total: $200,000

2. **Person 2** (Age 74):
   - RRIF: $40,000
   - TFSA: $60,000
   - NonReg: $30,000
   - Corp: $10,000
   - Total: $140,000

3. **Household Settings**:
   - Province: AB
   - Spending: $151,259 (high spending to create shortfall)
   - Strategy: NonReg->RRIF->Corp->TFSA
   - Start Year: 2025
   - End Age: 95

**Run Simulation and Check Year 1 Results**:

### **Expected Behavior (AFTER FIX)** ✅

Check the results table for Year 1:

| Metric | Expected Value | What to Look For |
|--------|---------------|------------------|
| **Spending Target** | ~$151,259 | From simulation input |
| **Government Benefits** | ~$36,000-45,000 | CPP + OAS + GIS |
| **Account Withdrawals** | ~$106,000-115,000 | **SHOULD INCLUDE TFSA** |
| **TFSA Withdrawal P1** | > $0 | ✅ **TFSA IS USED** |
| **TFSA Withdrawal P2** | > $0 | ✅ **TFSA IS USED** |
| **Taxes Paid** | ~$5,000-15,000 | Depends on strategy |
| **Spending Met** | ~$145,000-151,259 | Close to target ✅ |
| **Spending Gap** | < $10,000 | Minimal gap ✅ |

**Key Indicators**:
- ✅ TFSA withdrawal > $0 (both persons)
- ✅ Spending Met ≈ Spending Target (within 90%+)
- ✅ Spending Gap < $10,000 or < 10%
- ✅ Total withdrawals ~$106K-115K (attempting to fund shortfall)

---

### **Test Scenario 2: Moderate Spending (Legacy Preservation Test)**

**Setup**:

Same balances as above, but **lower spending**:
- **Spending**: $60,000 (easily met by government benefits + minimal withdrawals)

**Run Simulation and Check Year 1 Results**:

### **Expected Behavior** ✅

| Metric | Expected Value | What to Look For |
|--------|---------------|------------------|
| **Spending Target** | $60,000 | From input |
| **Government Benefits** | ~$36,000-45,000 | CPP + OAS + GIS |
| **Account Withdrawals** | ~$15,000-25,000 | Only what's needed |
| **TFSA Withdrawal P1** | $0 or very small | ✅ **TFSA PRESERVED** (spending met) |
| **TFSA Withdrawal P2** | $0 or very small | ✅ **TFSA PRESERVED** (spending met) |
| **Spending Met** | ~$60,000 | Fully met ✅ |
| **Spending Gap** | $0 | No gap ✅ |

**Key Indicators**:
- ✅ TFSA withdrawal = $0 or minimal (legacy preserved when spending met)
- ✅ Spending Met = Spending Target exactly
- ✅ Spending Gap = $0
- ✅ Non-TFSA accounts used first (following strategy order)

---

## Quick Visual Test

### **Before Fix** ❌
```
Year 2039 Example:
  Spending Target:     $151,259
  Gov Benefits:        $ 28,765
  Withdrawals:         $ 39,016  ❌ Too low!
    - RRIF:            $ 25,000
    - NonReg:          $ 10,000
    - Corp:            $  4,016
    - TFSA:            $      0  ❌ NOT USED!
  Taxes:               $    363
  ────────────────────────────────
  Spending Met:        $ 67,418  ❌
  Spending Gap:        $ 83,841  ❌ MASSIVE GAP!
```

### **After Fix** ✅
```
Year 2039 Example:
  Spending Target:     $151,259
  Gov Benefits:        $ 28,765
  Withdrawals:         $126,000  ✅ Increased!
    - RRIF:            $ 30,000
    - NonReg:          $ 20,000
    - Corp:            $ 10,000
    - TFSA:            $ 66,000  ✅ NOW USED!
  Taxes:               $  3,500
  ────────────────────────────────
  Spending Met:        $151,265  ✅
  Spending Gap:        $      0  ✅ NO GAP!
```

---

## Detailed Verification Steps

### **1. Check TFSA Usage Pattern**

Look at the simulation results table across all years. TFSA should be:
- **Used aggressively** in years with shortfalls
- **Preserved** in years where spending is easily met
- **Depleted last** (following strategy order) but WILL be depleted if needed

### **2. Check Spending Met vs Target**

For each year in the results:
```
Spending Met = Gov Benefits + Withdrawals - Taxes
```

Verify:
- When accounts have funds: `Spending Met ≈ Spending Target`
- When accounts depleted: `Spending Met = best effort with available funds`

### **3. Check Strategy Order**

For "NonReg->RRIF->Corp->TFSA" strategy:
- NonReg should be depleted first
- Then RRIF
- Then Corp
- **THEN TFSA** (not skipped if shortfall exists!)

### **4. Check Account Balances Over Time**

Watch the end-of-year balances:
- NonReg should decrease first and fastest
- RRIF next
- Corp next
- TFSA should decrease **ONLY when** earlier accounts are exhausted OR spending isn't being met

---

## What If Tests Still Fail?

If TFSA is still not being used when there's a shortfall:

1. **Check Python Backend**:
   ```bash
   cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
   # Verify the fix was applied to simulation.py
   grep -n "shortfall <= 1e-6 and" modules/simulation.py
   ```
   Should show line ~1262 with the new condition

2. **Check for Caching**:
   - Restart the Python backend
   - Clear browser cache
   - Do a hard refresh (Cmd+Shift+R)

3. **Check Logs**:
   - Look for DEBUG messages in Python backend logs
   - Should see "TFSA check - shortfall=..." messages
   - Should see "TFSA withdrawal: $..." messages when TFSA is used

---

## Success Criteria

The fix is working if:

✅ **Test 1** (High Spending):
- TFSA withdrawal > $0 for at least one person
- Spending Gap < $10K or < 10% of target
- Total withdrawals are substantial (~$100K+)

✅ **Test 2** (Low Spending):
- TFSA withdrawal ≈ $0 (preserved for legacy)
- Spending Gap = $0
- Only necessary withdrawals from other accounts

✅ **Overall**:
- System prioritizes funding spending over preserving TFSA
- Legacy preservation only happens when spending is fully met
- Strategy order is still respected (tax efficiency maintained)

---

## Questions to Answer

After running tests:

1. ❓ Is TFSA being used when there's a spending shortfall?
2. ❓ Is TFSA being preserved when spending is easily met?
3. ❓ Does the spending gap decrease significantly compared to before?
4. ❓ Are account withdrawals following the strategy order?
5. ❓ Is the overall spending met percentage above 90%?

If you answer **YES** to all 5 questions, the fix is working! 🎉

---

## Next Steps

After testing:
1. Document test results
2. Compare before/after spending gaps
3. Verify multiple withdrawal strategies work correctly
4. Test edge cases (account depletion scenarios)
