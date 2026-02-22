# RRIF Minimum Rates Fix Documentation
## Date: February 21, 2026

---

## Critical Bug Fixed: Incorrect CRA RRIF Minimum Withdrawal Rates

### Issue Identified
The RRIF minimum withdrawal rates in `/python-api/modules/simulation.py` were INCORRECT and significantly higher than the official CRA rates. This was causing excessive mandatory RRIF withdrawals, particularly affecting the RRIF-Frontload strategy.

---

## Incorrect Rates (BEFORE FIX)

The code had these WRONG rates from age 71 onwards:

```python
71: 0.0528, 72: 0.0748, 73: 0.0785, 74: 0.0826,
75: 0.0869, 76: 0.0914, 77: 0.0961, 78: 0.1011, 79: 0.1063,
80: 0.1118, 81: 0.1176, 82: 0.1237, 83: 0.1301, 84: 0.1369,
# ... and so on
```

### Key Problem Ages:
- Age 72: **7.48%** (wrong) vs 5.40% (correct) - 38% higher!
- Age 80: **11.18%** (wrong) vs 6.82% (correct) - 64% higher!
- Age 81: **11.76%** (wrong) vs 7.08% (correct) - 66% higher!

---

## Correct Rates (AFTER FIX)

Updated to official CRA RRIF minimum withdrawal rates:

```python
71: 0.0528, 72: 0.0540, 73: 0.0553, 74: 0.0567,
75: 0.0582, 76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658,
80: 0.0682, 81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808,
85: 0.0851, 86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099,
90: 0.1192, 91: 0.1306, 92: 0.1449, 93: 0.1634, 94: 0.1879,
95+: 0.2000
```

Source: [Canada.ca - Chart of Prescribed Factors](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/completing-slips-summaries/t4rsp-t4rif-information-returns/payments/chart-prescribed-factors.html)

---

## Impact on RRIF-Frontload Strategy

### Before Fix (PROBLEM):
- Strategy was supposed to withdraw 8% after age 65
- Due to incorrect minimums (11-12%), the code was forced to withdraw more
- This caused excessive taxable income and faster RRIF depletion

### After Fix (RESOLVED):
- Age 71-84: Withdraws exactly **8%** (as intended)
- Age 85+: Withdraws the CRA minimum when it exceeds 8%
- Strategy now works correctly for tax optimization

---

## Test Results

### Comprehensive Testing (Ages 71-90):
```
Age 71: ✅ 8.00% (CRA min: 5.28%)
Age 75: ✅ 8.00% (CRA min: 5.82%)
Age 80: ✅ 8.00% (CRA min: 6.82%) - Rafael's case
Age 81: ✅ 8.00% (CRA min: 7.08%) - Rafael's case
Age 85: ✅ 8.51% (CRA min: 8.51%) - Minimum takes over
Age 90: ✅ 11.92% (CRA min: 11.92%) - Minimum takes over
```

---

## Files Modified

1. `/python-api/modules/simulation.py`
   - Lines 61-72: Updated RRIF minimum rates table
   - Added comment with official CRA source

---

## For Rafael (juanclavierb@gmail.com)

Your RRIF-Frontload strategy is now working correctly:

### Fixed Behavior:
- **Ages < 65**: Withdraws exactly 15% of RRIF balance
- **Ages 65-84**: Withdraws exactly 8% of RRIF balance
- **Ages 85+**: Withdraws CRA minimum (which exceeds 8%)
- **No extra withdrawals**: RRIF is never used to fill spending gaps
- **Gaps shown**: If the fixed % can't meet spending, a gap appears

### Why This Matters:
1. **Tax Optimization**: Controlled RRIF depletion at 8% minimizes tax impact
2. **OAS Protection**: Lower taxable income reduces OAS clawback risk
3. **Estate Planning**: Predictable RRIF drawdown for planning purposes

---

## Summary

The critical bug in RRIF minimum rates has been fixed. The rates were almost double what they should have been for ages 72-84, causing excessive mandatory withdrawals. With the correct CRA rates now in place, the RRIF-Frontload strategy works as designed, maintaining the 8% withdrawal rate after age 65 (unless CRA minimums require more).

---

*Fix completed: February 21, 2026*
*Verified with official CRA prescribed factors table*