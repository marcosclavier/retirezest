# RRIF Frontload Issue Analysis Report
## For Rafael (juanclavierb@gmail.com)
### Date: February 21, 2026

---

## Executive Summary

**ISSUE IDENTIFIED**: Your RRIF withdrawals are exceeding the expected frontload percentages (15% before OAS, 8% after OAS). The actual withdrawals are approximately **10-11%** instead of the expected **8%** after age 65.

---

## 📊 Analysis of Your Screenshots

### Year 2046 (Age 80)
- **RRIF/RRSP Withdrawal**: $21,228
- **Expected Rate**: 8% (after OAS starts at 65)
- **Calculated Actual Rate**: **10.30%**
- **Excess**: 2.30 percentage points above target

### Year 2047 (Age 81)
- **RRIF/RRSP Withdrawal**: $20,825
- **RRIF End Balance**: $164,069
- **Expected Rate**: 8%
- **Calculated Actual Rate**: **11.26%**
- **Excess**: 3.26 percentage points above target

---

## 🔍 Root Cause Analysis

After examining the code, I've identified **THREE potential causes** for the higher withdrawals:

### 1. **Mandatory RRIF Minimum Override** ✅
The code contains this logic:
```python
rrif_frontload_target = max(rrif_frontload_target, rrif_min)
```

This means if the CRA mandatory minimum exceeds the frontload percentage, the minimum takes precedence. However:
- At age 80, the mandatory minimum is **6.70%**
- At age 81, the mandatory minimum is **6.88%**
- Your frontload target is **8%**

Since 8% > mandatory minimums, this is **NOT the cause**.

### 2. **Bug in Withdrawal Order** 🐛 **LIKELY CAUSE**

The RRIF-Frontload strategy correctly specifies the gap-filling order as:
```python
return ["corp", "nonreg", "tfsa"]  # Note: No "rrif" - frontload is fixed
```

**This is correct** - RRIF should NOT be in the withdrawal order for gap-filling.

However, there's code that enforces mandatory RRIF minimums AFTER the strategy withdrawals:
```python
# Lines 2264-2270 in simulation.py
if "rrif-frontload" not in strategy_name.lower():
    if withdrawals["rrif"] < rrif_min and person.rrif_balance > 0:
        rrif_shortfall_to_min = min(rrif_min - withdrawals["rrif"], person.rrif_balance)
        withdrawals["rrif"] += rrif_shortfall_to_min
```

The condition `"rrif-frontload" not in strategy_name.lower()` should prevent this, but there might be an issue with:
- Strategy name capitalization or spelling
- The strategy name not being passed correctly

### 3. **Additional RRIF Withdrawals for Shortfalls** 🐛 **POSSIBLE CAUSE**

Despite the correct withdrawal order excluding RRIF, there might be additional logic that adds RRIF withdrawals when there's a spending shortfall. The code at lines 2054-2057 shows:
```python
if k == "rrif":
    # For most strategies, allow RRIF withdrawals beyond what's already withdrawn
    # Note: RRIF-frontload won't reach here as it has empty withdrawal order
    available = max(person.rrif_balance - (withdrawals["rrif"] + extra["rrif"]), 0.0)
```

The comment says "RRIF-frontload won't reach here", but this depends on the withdrawal order being correctly set.

---

## 🎯 The Actual Problem

Based on the withdrawal percentages (10-11% instead of 8%), it appears that:

1. **The 8% frontload IS being applied** (withdrawals are above the 6.7-6.88% minimums)
2. **BUT additional RRIF withdrawals are being made** (pushing it to 10-11%)
3. **This suggests the gap-filling logic is incorrectly including RRIF**

---

## 🛠️ Recommended Fix

The development team needs to:

1. **Verify the strategy name is correctly passed** throughout the simulation
2. **Ensure RRIF is NEVER in the withdrawal order** for RRIF-Frontload strategy
3. **Add explicit guards** to prevent any RRIF withdrawals beyond the frontload percentage
4. **Add logging** to track exactly where the extra RRIF withdrawals are coming from

### Code that needs review:
- `/python-api/modules/simulation.py` lines 1422-1428 (withdrawal order)
- `/python-api/modules/simulation.py` lines 2054-2057 (RRIF availability calculation)
- `/python-api/modules/simulation.py` lines 2264-2270 (minimum enforcement)

---

## 📝 What This Means for Your Plan

### Current Impact:
- You're withdrawing **2-3% more from RRIF annually** than intended
- This accelerates RRIF depletion (good for estate planning)
- But increases taxable income (potential OAS clawback risk)

### Expected Behavior:
- **Before age 65**: Exactly 15% of RRIF balance annually
- **Age 65 and after**: Exactly 8% of RRIF balance annually
- **NO additional RRIF withdrawals** even if there's a spending shortfall
- Shortfalls should be filled from: Corp → NonReg → TFSA (in that order)

---

## 🚀 Next Steps

1. **Immediate**: The bug needs to be fixed to properly implement the 8% limit
2. **Testing**: Run scenarios to verify RRIF withdrawals stay at exactly 8% after OAS
3. **Validation**: Ensure the fix doesn't break mandatory minimum compliance

---

## 📊 Summary Table

| Age | Year | Expected % | Actual % | Difference | Impact |
|-----|------|------------|----------|------------|--------|
| 80 | 2046 | 8.00% | 10.30% | +2.30% | $4,500 extra withdrawal |
| 81 | 2047 | 8.00% | 11.26% | +3.26% | $6,000 extra withdrawal |

---

*Report prepared for Rafael by the RetireZest development team*
*Issue identified: RRIF withdrawals exceeding frontload strategy limits*
*Priority: High - affects tax optimization strategy*