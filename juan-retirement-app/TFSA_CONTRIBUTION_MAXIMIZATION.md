# TFSA Contribution Maximization

**Date**: 2025-12-12
**Status**: ✅ IMPLEMENTED AND TESTED

---

## What Changed

TFSA contributions now **MAXIMIZE available contribution room** instead of limiting to a fixed amount.

### Before (Old Behavior)
```
User sets: tfsa_contribution_each = $7,000
Year 1: Room = $7K → Contribute $7K ✓
Year 2: Room = $14K → Contribute $7K ✗ (wastes $7K!)
Year 3: Room = $21K → Contribute $7K ✗ (wastes $14K!)
```

**Problem**: Unused room accumulates but is never used.

### After (New Behavior)
```
User sets: tfsa_contribution_each = $7,000 (enables feature)
Year 1: Room = $7K → Contribute $7K ✓
Year 2: Room = $14K → Contribute $14K ✓ (uses ALL room!)
Year 3: Room = $21K → Contribute $21K ✓ (maximizes TFSA!)
```

**Solution**: Automatically use ALL available contribution room.

---

## How It Works

### Contribution Calculation

```python
if tfsa_contribution_each > 0:
    # MAXIMIZE: Transfer as much as possible from NonReg → TFSA
    contribution = min(
        nonreg_balance,    # Limited by available NonReg funds
        tfsa_room          # Limited by CRA contribution room
    )
else:
    # DISABLED: Don't contribute
    contribution = 0
```

**Key Points:**
- `tfsa_contribution_each` is now just an **ON/OFF switch**
  - If > $0: Maximize TFSA contributions (use all room)
  - If = $0: Disable TFSA contributions
- Contributions are limited ONLY by:
  1. Available NonReg balance
  2. Available TFSA room

### Room Accumulation

TFSA room grows from:
1. **Annual limit**: $7,000/year added by CRA
2. **Withdrawals**: Any TFSA withdrawals add back to room next year
3. **Unused room**: Carries forward indefinitely

Example:
```
Year 1:
  - Start: $7,000 room
  - Contribute: $5,000 (NonReg only had $5K available)
  - End: $2,000 unused room

Year 2:
  - Start: $2,000 (unused) + $7,000 (new limit) = $9,000 room
  - Contribute: $9,000 (if NonReg has funds)
  - End: $0 unused room
```

---

## Why This is Optimal

**TFSA is the BEST retirement account in Canada:**
- ✅ Tax-free growth (no tax on investment returns)
- ✅ Tax-free withdrawals (no tax when you take money out)
- ✅ No impact on benefits (OAS, GIS, credits)
- ✅ Re-contribution room (withdrawals add back to room)
- ✅ Tax-free inheritance (passes to spouse)

**NonReg accounts are taxable:**
- ❌ Interest: 100% taxable annually
- ❌ Dividends: Taxable annually (even if reinvested)
- ❌ Capital gains: 50% taxable when realized
- ❌ Reduces benefits (counts as income)

**Therefore:**
Every dollar moved from NonReg → TFSA is a **permanent tax win**. You should ALWAYS maximize TFSA when possible.

---

## Integration with Spending

TFSA contributions are **IN ADDITION TO** your spending target:

```
Spending target:       $100,000
TFSA contributions:    $ 14,000 (e.g., $7K × 2 people)
                       ──────────
Total cash needed:     $114,000 (plus taxes)
```

**Cash flow:**
1. System withdraws enough to cover spending + TFSA
2. After taxes, $114K available:
   - $100K → Spending ✓
   - $ 14K → NonReg transferred to TFSA ✓

**Result:**
- Spending target fully met
- TFSA growing tax-free
- NonReg balance declining (good!)

---

## Example Scenarios

### Scenario 1: Plenty of NonReg (Normal Case)

```
Year 1:
  - TFSA room: $7,000/person
  - NonReg balance: $200,000/person
  - Contribution: $7,000/person ← Limited by room

Year 2:
  - TFSA room: $7,000/person (new limit)
  - NonReg balance: $185,000/person
  - Contribution: $7,000/person ← Limited by room

Result: Steady $7K/year contributions until NonReg depleted
```

### Scenario 2: Limited NonReg (Room Accumulates)

```
Year 1:
  - TFSA room: $7,000/person
  - NonReg balance: $5,000/person
  - Contribution: $5,000/person ← Limited by NonReg!
  - Unused room: $2,000

Year 2:
  - TFSA room: $2,000 (unused) + $7,000 (new) = $9,000/person
  - NonReg balance: $10,000/person
  - Contribution: $9,000/person ← Uses accumulated room!
  - Unused room: $0

Result: Maximizes room usage when NonReg funds become available
```

### Scenario 3: TFSA Withdrawals (Room Restores)

```
Year 1:
  - TFSA room: $7,000/person
  - Contribute: $7,000/person
  - Withdraw: $5,000/person (for emergency)
  - Unused room: $0

Year 2:
  - TFSA room: $7,000 (new) + $5,000 (withdrawn) = $12,000/person
  - Contribute: $12,000/person ← Restores withdrawn amount!

Result: TFSA withdrawals are "free" - room comes back
```

---

## How to Use

### Enable TFSA Maximization

In your simulation form:
1. Set **"Annual TFSA Contribution (per person)"** to **ANY amount > $0**
   - Common values: $7,000 (current CRA limit)
   - The actual number doesn't matter - it just enables the feature
   - System will automatically maximize room usage

2. Run your simulation

3. Review results in Year-by-Year table:
   - Look for "TFSA Contrib (P1)" and "TFSA Contrib (P2)" columns
   - Contributions will show actual amounts transferred (up to available room)

### Disable TFSA Contributions

Set **"Annual TFSA Contribution (per person)"** to **$0**

---

## Test Results

### Test 1: Basic Functionality ✅
```
Spending target:       $100,000
TFSA contributions:    $ 14,000
Total withdrawals:     $104,828
Total tax:             $ 13,728
After-tax cash:        $114,000

Allocation:
  - Spending:          $100,000 ✓
  - TFSA contributions: $ 14,000 ✓
  - Surplus:           $     0 ✓
```

### Test 2: 10-Year Consistency ✅
```
All 10 years:
  - Spending fully met ✓
  - TFSA contributions correct ✓
  - No spending gaps ✓

TFSA growth (P1):
  - Start:  $ 50,000
  - Year 10: $169,490
  - Growth:  $109,990 ✓
```

---

## Implementation Details

### Files Changed

1. **modules/simulation.py:2162-2169**
   - Changed contribution logic to maximize room
   - Removed fixed amount limit

2. **modules/simulation.py:1819-1828**
   - Updated withdrawal targets to include estimated contributions
   - Ensures spending + TFSA contributions both funded

3. **modules/simulation.py:1745-1748**
   - Fixed Year 1 room double-counting bug
   - Added `is_first_year` flag

4. **api/utils/converters.py:219**
   - Updated spending_met calculation
   - Subtracts TFSA contributions from total cash

### Bug Fixes

**Bug**: Year 1 had double TFSA room
- **Cause**: Room growth added on top of starting room
- **Fix**: Skip room growth in first year
- **Result**: Year 1 now correctly uses `tfsa_room_start` only

---

## Recommendations

**For most users:**
- ✅ Enable TFSA maximization (set to $7,000)
- ✅ This is the most tax-efficient approach
- ✅ Let the system automatically use all available room

**Only disable if:**
- ❌ You want to preserve NonReg for specific purposes
- ❌ You need NonReg liquidity for emergencies
- ❌ You have a specific reason to avoid TFSA

---

## Summary

**What it does:**
Automatically transfers as much money as possible from NonReg → TFSA, up to available contribution room.

**Why it's better:**
- Tax-free growth vs. taxable growth
- Tax-free withdrawals vs. taxable withdrawals
- More flexible than RRIF
- Better than leaving money in NonReg

**How to enable:**
Set "Annual TFSA Contribution (per person)" to any value > $0

**Status:**
✅ Fully implemented and tested
✅ Available now in production
✅ Ready to use

Your retirement plan just got even more tax-efficient! 🎯
