# Withdrawal Priority Fix - Spending First, Legacy Second

## Problem Statement

The simulation was **underfunding spending requirements** while preserving TFSA accounts for legacy. In year 2039:
- **Spending Target**: $151,259
- **Government Benefits**: $28,765 (CPP + OAS)
- **Account Withdrawals**: Only $39,016 ❌
- **Spending Met**: $67,418
- **Underfunding Gap**: $83,841

**Root Cause**: System prioritized legacy preservation over funding spending requirements.

---

## Correct Priority Hierarchy

As specified by user requirements:

### **1. FIRST PRIORITY: Fund Spending Requirement**
- Withdraw from ALL available accounts (RRIF, NonReg, Corp, **TFSA**) to meet spending target
- Use every dollar available until spending is met or all accounts depleted
- **No account should be preserved if spending isn't met**

### **2. SECOND PRIORITY: Tax Efficiency**
- Follow withdrawal strategy order intelligently
- Minimize tax impact (not eliminate - be efficient)
- Use strategy-specific logic (GIS-optimized, Balanced, etc.)

### **3. THIRD PRIORITY: Legacy to Heirs**
- Preserve TFSA and other accounts **ONLY IF** spending is fully met
- After-tax legacy is a bonus, not a requirement
- Don't sacrifice current lifestyle for future heirs

---

## Fixes Applied

### **Fix 1: TFSA Preservation Guard** (`simulation.py:1242-1268`)

**Before (WRONG):**
```python
# TFSA guard - skip if other sources have ANY funds
if (nonreg_left > 1e-9) or (rrif_left > 1e-9) or (corp_left > 1e-9):
    # Skip TFSA even when spending isn't met ❌
    continue
```

**After (CORRECT):**
```python
# Only preserve TFSA if BOTH conditions are true:
# 1. Spending is fully met (shortfall <= 1e-6), AND
# 2. Other sources still have funds
if shortfall <= 1e-6 and ((nonreg_left > 1e-9) or (rrif_left > 1e-9) or (corp_left > 1e-9)):
    # Preserve TFSA for legacy ✅
    continue
```

**Impact**: TFSA will now be used to fund spending shortfalls, even if other accounts still have small balances.

---

### **Fix 2: TFSA Cost Penalty Reduction** (`simulation.py:731-741`)

**Before (WRONG):**
```python
if source == "tfsa":
    # Add 10% penalty to make TFSA "expensive"
    total_cost += 0.10  # ❌ Too high - prevents withdrawals
```

**After (CORRECT):**
```python
if source == "tfsa":
    # Small 2% penalty - only for tie-breaking between equal-cost sources
    # Not enough to prevent TFSA withdrawal when needed for spending
    total_cost += 0.02  # ✅ Spending-first priority
```

**Impact**: TFSA becomes more accessible when needed for spending, while still preferring tax-inefficient accounts when costs are similar.

---

## Expected Outcomes

### **Scenario: Year 2039 with $83,841 Shortfall**

**Before Fix:**
- RRIF withdrawn: $X (some amount)
- NonReg withdrawn: $Y (some amount)
- Corp withdrawn: $Z (some amount)
- **TFSA withdrawn: $0** ❌ (preserved even though spending isn't met)
- **Shortfall: $83,841** ❌

**After Fix:**
- RRIF withdrawn: $X (exhausted or per strategy)
- NonReg withdrawn: $Y (exhausted or per strategy)
- Corp withdrawn: $Z (exhausted or per strategy)
- **TFSA withdrawn: Up to $83,841** ✅ (to meet spending)
- **Shortfall: $0 or minimal** ✅ (if TFSA has sufficient balance)

---

## Testing Recommendations

1. **Re-run year 2039 simulation** and verify:
   - Spending Met = Spending Target (or as close as possible)
   - TFSA balance decreases when needed to fund spending
   - Shortfall is $0 or minimal (only if ALL accounts depleted)

2. **Check account depletion order** follows strategy:
   - NonReg->RRIF->Corp->TFSA strategy should deplete in that order
   - TFSA should be last, but WILL be used when earlier accounts are insufficient

3. **Verify legacy preservation** when spending is met:
   - If spending target is $100K and available cash is $120K
   - System should withdraw only $100K
   - Preserve remaining $20K for legacy

4. **Test multiple strategies**:
   - GIS-Optimized: Should use TFSA before RRIF when spending isn't met
   - Balanced: Should follow Corp->RRIF->NonReg->TFSA, but tap TFSA if needed
   - RRIF-First: Should tap TFSA after RRIF if shortfall exists

---

## Implementation Notes

### **Code Locations:**
- `/juan-retirement-app/modules/simulation.py:1242-1268` - TFSA guard logic
- `/juan-retirement-app/modules/simulation.py:731-747` - TFSA cost penalty

### **Related Components:**
- Withdrawal strategies: `/modules/withdrawal_strategies.py`
- Spending calculation: `/api/utils/converters.py:186-208` (already fixed)
- UI display: Results dashboard shows spending met vs spending gap

### **Backward Compatibility:**
These changes should not break existing simulations:
- Behavior change: TFSA will be used more aggressively when spending isn't met
- Users who were seeing shortfalls will now see TFSA being tapped
- Plans that were previously "failing" may now "succeed" by using TFSA

---

## Summary

✅ **Spending requirement is now FIRST priority**
✅ **All accounts (including TFSA) will be used to fund spending**
✅ **Legacy preservation only happens AFTER spending is met**
✅ **Tax efficiency is maintained through strategy order**
✅ **System aligns with user's stated priority hierarchy**

The retirement simulator now correctly prioritizes:
1. Funding your lifestyle in retirement
2. Doing so tax-efficiently
3. Leaving a legacy if possible

**Bottom line**: You can't enjoy your legacy if you can't pay your bills in retirement!
