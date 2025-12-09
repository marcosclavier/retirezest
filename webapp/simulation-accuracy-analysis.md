# Simulation Accuracy Analysis

## Date: 2025-12-07

## Executive Summary

Analysis of the retirement simulation results to identify potential accuracy issues and ensure reliable calculations.

## Test Case from Screenshot

**Input Data (Auto-populated):**
- User: jrcb@hotmail.com
- Portfolio: TFSA 11.3%, RRIF 0.0%, Non-Registered 0.0%, Corporate 88.7%
- Starting age: (from dateOfBirth)
- Province: Alberta

**Output Results:**
- Years Funded: 31/31 (100% success rate)
- Final Estate: $6,264,914 (Gross: $10,017,108)
- Total Tax Paid: $54,641
- **Avg Effective Tax Rate: 0.0%** ⚠️
- Total Withdrawals: $982,371
- Total Spending: $3,847,289

## Identified Issues

### 1. ⚠️ CRITICAL: 0.0% Effective Tax Rate

**Problem**: The effective tax rate shows 0.0% despite $54,641 in total taxes paid.

**Analysis**:
- If $54,641 was paid over $982,371 in withdrawals, effective rate should be ~5.6%
- If calculated against total spending ($3,847,289), it should be ~1.4%
- 0.0% suggests either:
  a) Display rounding issue (should show one decimal place)
  b) Calculation bug in the display logic
  c) Division by zero or incorrect denominator

**Recommendation**:
- Check the display calculation in the ResultsDashboard or summary component
- Verify what the denominator is for the effective rate calculation
- Should likely be: `(total_tax_paid / total_taxable_income) * 100`

### 2. Portfolio Allocation from Prefill

**Current Logic** (from `/app/api/simulation/prefill/route.ts`):

```typescript
// Non-Registered Distribution
nr_cash: assetTotals.nonreg_balance * 0.10,      // 10%
nr_gic: assetTotals.nonreg_balance * 0.20,        // 20%
nr_invest: assetTotals.nonreg_balance * 0.70,     // 70%
nonreg_acb: assetTotals.nonreg_balance * 0.80,    // 80% ACB

// Corporate Distribution
corp_cash_bucket: assetTotals.corporate_balance * 0.05,    // 5%
corp_gic_bucket: assetTotals.corporate_balance * 0.10,     // 10%
corp_invest_bucket: assetTotals.corporate_balance * 0.85,  // 85%
```

**Concerns**:
1. These are **arbitrary assumptions** - not based on actual asset allocation
2. ACB at 80% of balance is a guess - could significantly affect tax calculations
3. Corporate buckets don't reflect actual investment mix

**Impact**:
- Tax calculations depend heavily on ACB (determines capital gains)
- Investment mix affects returns and withdrawal strategies
- Could lead to inaccurate tax projections

**Recommendation**:
- Add asset allocation fields to the Asset model
- Or provide UI to review/adjust these values before running simulation
- Display a warning that these are estimates

### 3. Final Estate Calculation

**Values**:
- Net: $6,264,914
- Gross: $10,017,108
- Difference: $3,752,194 (implied taxes on death)

**Questions**:
1. Is this calculating deemed disposition taxes correctly?
2. Are RRSP/RRIF treated as fully taxable on death?
3. Is TFSA correctly excluded from estate taxes?
4. Capital gains on non-registered accounts at death?

**Recommendation**: Verify the Python simulation engine's estate calculation logic

### 4. Corporate-Optimized Strategy

**Result**: System recommends "corporate-optimized" strategy

**Validation Needed**:
- Is this appropriate given 88.7% corporate allocation?
- What does "corporate-optimized" mean in terms of withdrawal sequence?
- Is it maximizing dividend tax credits?
- Is timing of corporate withdrawals optimal?

## Data Flow Accuracy

### Auto-Population Process:

1. **User Profile** → Name, Age, Province ✓
2. **Assets** → Aggregated by type ✓
3. **Distribution** → Assumed allocation ⚠️ (arbitrary)
4. **Government Benefits** → Defaults (CPP 65, OAS 65) ⚠️ (may not match actual entitlement)

### Missing Data Points:

1. **Actual Asset Allocation** - Using assumptions instead of real data
2. **Actual ACB** - Critical for tax accuracy, using 80% guess
3. **CPP Entitlement** - Using defaults, not actual Service Canada amounts
4. **Income Sources** - Pensions, rental income, etc.
5. **Expenses** - Using simulation defaults

## Recommendations for Accuracy Improvements

### Immediate (High Priority):

1. **Fix Effective Tax Rate Display**
   - Location: ResultsDashboard component or summary calculation
   - Ensure proper calculation and display with at least 1 decimal place

2. **Add Warning for Assumed Values**
   - Show alert that ACB, asset allocation are estimates
   - Provide ability to override before simulation

3. **Validate Tax Calculations**
   - Compare with manual calculations for known scenarios
   - Test edge cases (all TFSA, all RRSP, all corporate)

### Short Term:

4. **Enhance Asset Model**
   ```typescript
   // Add to Asset model:
   adjustedCostBase?: number  // For non-registered
   cashPercentage?: number
   gicPercentage?: number
   investPercentage?: number
   ```

5. **Add Government Benefits Fields to Profile**
   ```typescript
   // Add to User model:
   estimatedCPP?: number
   cppStartAge?: number
   estimatedOAS?: number
   oasStartAge?: number
   ```

### Long Term:

6. **Create Validation Test Suite**
   - Known scenarios with hand-calculated results
   - Edge cases (min/max values)
   - Tax rate validation across provinces
   - Compare 2026 tax calculations with CRA published tables

7. **Add Confidence Indicators**
   - Show data quality score
   - Highlight which values are estimated vs. actual
   - Provide ranges instead of point estimates

## Test Scenarios Needed

### Scenario 1: All TFSA
- Input: $1,000,000 TFSA only
- Expected: $0 tax, full amount available

### Scenario 2: All RRSP
- Input: $1,000,000 RRSP only
- Expected: Full taxation on withdrawal, withholding tax

### Scenario 3: Mix with Known ACB
- Input: $500k non-reg with $400k ACB
- Expected: $100k capital gains × 50% = $50k taxable

### Scenario 4: Corporate Dividends
- Input: $1,000,000 corporate account
- Expected: Dividend gross-up and tax credit calculations

## Current Status

✅ **Working**:
- Auto-population from profile
- Basic simulation execution
- Results display

⚠️ **Needs Verification**:
- Tax rate calculations and display
- Estate value calculations
- ACB and allocation assumptions
- Corporate dividend tax treatment

❌ **Missing**:
- Actual asset allocation data
- Actual ACB values
- Validation against known scenarios
- Confidence intervals

## Next Steps

1. Fix the 0.0% effective tax rate display bug
2. Add warnings for assumed values (ACB, allocation)
3. Create at least 3 test scenarios with hand-calculated expected results
4. Validate simulation output matches expected results within 5% tolerance
5. Document any intentional simplifications vs. actual tax law

---

**Prepared by**: Claude Code
**Review Status**: Preliminary Analysis
**Action Required**: Address critical issues before production use
