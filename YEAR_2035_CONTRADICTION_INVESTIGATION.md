# Year 2035 Spending Status Contradiction - Investigation Report

## Issue Summary

User reported contradictory spending status for year 2035 in Juan and Daniela's retirement plan:
- **Detailed Breakdown**: Shows shortfall of $17,310
- **Status Badge**: Shows green "OK"
- **Spending Analysis Chart**: Shows no gap

## Root Cause Identified

The issue is in `/webapp/components/simulation/YearByYearTable.tsx` lines 486-502.

The UI component has a bug where it **always includes NonReg distributions** in the spending calculation, even when the `reinvest_nonreg_dist` flag is `True` (meaning distributions should be reinvested, not spent).

### Code Analysis

#### 1. Converter (API) - CORRECT ✅
File: `juan-retirement-app/api/utils/converters.py` lines 226-242

```python
# NonReg distributions: Always include for transparency in reports
# When reinvest_nonreg_dist=False, these count as spending cash
# When reinvest_nonreg_dist=True, these are reinvested and not available for spending
nonreg_distributions = float(row.get('nr_dist_tot', 0))
reinvest_nonreg = row.get('reinvest_nonreg_dist', False)

# Only count distributions as spending cash when NOT reinvesting
distributions_as_cash = 0 if reinvest_nonreg else nonreg_distributions

# CRITICAL: TFSA contributions are SEPARATE from spending
tfsa_contributions = float(row.get('contrib_tfsa_p1', 0)) + float(row.get('contrib_tfsa_p2', 0))

spending_need = float(row.get('spend_target_after_tax', row.get('spending_need', 0)))
spending_met = government_benefits + withdrawals + distributions_as_cash - taxes - tfsa_contributions
spending_gap = max(0, spending_need - spending_met)  # Gap can't be negative
```

**Result**: When `reinvest_nonreg_dist = True`, converter sets `distributions_as_cash = 0`, so `spending_gap = 0`

#### 2. UI Component - INCORRECT ❌
File: `webapp/components/simulation/YearByYearTable.tsx` lines 241, 486-502

```typescript
const nonregDistributions = year.nonreg_distributions || 0;
const tfsaContributions = (year.tfsa_contribution_p1 || 0) + (year.tfsa_contribution_p2 || 0);

// ... later in expanded detail row ...

const netForSpending = totalWithdrawals + nonregDistributions - tfsaContributions - year.total_tax;
const difference = netForSpending - year.spending_need;
const isSurplus = difference >= 0;
```

**BUG**: The UI **always adds** `nonregDistributions` without checking the `reinvestNonregDist` prop!

The component accepts `reinvestNonregDist` as a prop (line 21), but never uses it in the calculation.

#### 3. Spending Analysis Chart - CORRECT ✅
File: `webapp/components/simulation/SpendingChart.tsx` lines 22-27

```typescript
const chartData = yearByYear.map((year) => ({
  year: year.year,
  'Spending Need': year.spending_need,
  'Spending Met': year.spending_met,
  'Gap': year.spending_gap,  // Uses API value - correct!
}));
```

**Result**: Chart uses `year.spending_gap` from the API, which correctly shows 0 when reinvesting distributions.

## Scenario Explanation

For year 2035 in Juan and Daniela's plan:

1. **Simulation Configuration**: `reinvest_nonreg_dist = True`
2. **NonReg Distributions**: $17,310 (approximately)
3. **API Calculation**:
   - `distributions_as_cash = 0` (because reinvesting)
   - `spending_met = government_benefits + withdrawals + 0 - taxes - tfsa_contributions`
   - `spending_gap = 0` (spending fully met)
   - `plan_success = True`

4. **UI Detail Row Calculation**:
   - `netForSpending = withdrawals + $17,310 - tfsa_contributions - taxes` ❌ BUG!
   - Shows shortfall of $17,310

5. **Display Results**:
   - Status Badge: "OK" (from `plan_success = True`) ✅
   - Spending Chart: No gap (from `spending_gap = 0`) ✅
   - Detail Row: Shows $17,310 shortfall ❌ BUG!

## Fix Required

Update `webapp/components/simulation/YearByYearTable.tsx` line 486 to respect the `reinvestNonregDist` prop:

### Current Code (WRONG):
```typescript
const netForSpending = totalWithdrawals + nonregDistributions - tfsaContributions - year.total_tax;
```

### Fixed Code:
```typescript
const distributions_as_cash = reinvestNonregDist ? 0 : nonregDistributions;
const netForSpending = totalWithdrawals + distributions_as_cash - tfsaContributions - year.total_tax;
```

This will make the UI calculation match the API calculation, eliminating the contradiction.

## Impact

**Before Fix**:
- When `reinvest_nonreg_dist = True`, UI shows incorrect shortfall equal to the distributions amount
- Creates confusion as status badge and chart show "OK" but detail shows shortfall

**After Fix**:
- All three displays (status badge, chart, detail row) will be consistent
- UI will correctly show that reinvested distributions are not available for spending

## Files to Modify

1. `webapp/components/simulation/YearByYearTable.tsx` - Fix the spending calculation in the detail row
