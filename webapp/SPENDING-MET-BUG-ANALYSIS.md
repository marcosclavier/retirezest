# Spending Met Calculation Bug Analysis

## Problem Description

**Year 2039 Example:**
- Spending Target: $151,259
- Government Benefits (CPP + OAS): $28,765
- Account Withdrawals: $39,016
- Taxes: $363
- **Expected Spending Met**: $28,765 + $39,016 - $363 = **$67,418**
- **Actual Spending Met Displayed**: $151,259 ❌

The calculation doesn't make sense. Spending Met is showing the same value as Spending Target, when it should show the actual cash available after taxes.

## Root Cause

Found in `/juan-retirement-app/api/utils/converters.py` lines 232-233:

```python
# Spending
spending_need=float(row.get('spend_target_after_tax', row.get('spending_need', 0))),
spending_met=float(row.get('spend_target_after_tax', row.get('spending_met', 0))),  # ❌ BUG!
```

Both fields are being set to `spend_target_after_tax`, which means:
- `spending_need` = $151,259 ✅ (correct)
- `spending_met` = $151,259 ❌ (should be $67,418)

## Correct Calculation

`spending_met` should be calculated as:
```
spending_met = (Government Benefits) + (Account Withdrawals) - (Taxes Paid)
```

Or, if `underfunded_after_tax` is tracked:
```
spending_met = spending_target - underfunded_after_tax
```

For year 2039:
```
spending_met = $28,765 + $39,016 - $363 = $67,418
```

This shows the plan is **UNDERFUNDED** by:
```
underfunding = $151,259 - $67,418 = $83,841
```

## Impact

This bug causes:
1. **Incorrect visual feedback** - Users think their spending is being met when it's not
2. **Hidden underfunding** - The gap between target and actual is not visible
3. **Wrong plan success indicators** - Plans appear successful when they're failing

## Solution

Update the `dataframe_to_year_results` function to correctly calculate `spending_met`:

```python
# Calculate actual spending met from income sources minus taxes
gov_benefits = (
    float(row.get('cpp_p1', 0)) +
    float(row.get('cpp_p2', 0)) +
    float(row.get('oas_p1', 0)) +
    float(row.get('oas_p2', 0)) +
    float(row.get('gis_p1', 0)) +
    float(row.get('gis_p2', 0))
)

withdrawals = (
    float(row.get('withdraw_tfsa_p1', 0)) +
    float(row.get('withdraw_tfsa_p2', 0)) +
    float(row.get('withdraw_rrif_p1', 0)) +
    float(row.get('withdraw_rrif_p2', 0)) +
    float(row.get('withdraw_nonreg_p1', 0)) +
    float(row.get('withdraw_nonreg_p2', 0)) +
    float(row.get('withdraw_corp_p1', 0)) +
    float(row.get('withdraw_corp_p2', 0))
)

taxes = float(row.get('total_tax_after_split', row.get('total_tax', 0)))

spending_met = gov_benefits + withdrawals - taxes
spending_gap = spending_need - spending_met
```

## Files to Update

1. `/juan-retirement-app/api/utils/converters.py` - Line 233 (dataframe_to_year_results function)
2. Verify line 234 (spending_gap calculation) is also correct
