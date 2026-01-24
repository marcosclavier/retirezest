# Simulation End-to-End Test Plan

**Date**: January 11, 2026
**Version**: 1.0
**Author**: Claude Code
**Purpose**: Comprehensive testing plan for all 8 withdrawal strategies in the retirement simulation

---

## Executive Summary

This document provides a complete end-to-end testing plan for the RetireZest simulation feature. The simulation supports **8 distinct withdrawal strategies**, each designed for different financial situations and optimization goals. This plan ensures each strategy works correctly with various account types, household configurations, and edge cases.

---

## 1. Withdrawal Strategies Overview

### Strategy 1: corporate-optimized
**Description**: Best for corporate account holders - minimizes corporate tax
**Target Users**: Business owners with corporate investment accounts
**Key Test Points**:
- Corporate account withdrawals prioritized
- Corporate tax calculations accurate
- RDTOH (Refundable Dividend Tax On Hand) handling
- Eligible vs non-eligible dividend treatment

### Strategy 2: minimize-income
**Description**: Minimizes taxable income to preserve benefits (GIS, OAS)
**Target Users**: Lower-income retirees eligible for GIS, concerned about OAS clawback
**Key Test Points**:
- Taxable income kept below GIS thresholds
- OAS clawback avoided when possible
- TFSA withdrawals prioritized (tax-free)
- Capital gains treatment optimized

### Strategy 3: rrif-splitting
**Description**: Uses pension income splitting to reduce household tax
**Target Users**: Couples where one spouse has significantly higher RRIF balance
**Key Test Points**:
- Income splitting applied correctly (up to 50% of eligible pension income)
- Both spouses' tax brackets balanced
- Requires both p1 and p2 data
- income_split_rrif_fraction parameter utilized

### Strategy 4: capital-gains-optimized
**Description**: Prioritizes capital gains for favorable tax treatment
**Target Users**: Retirees with large non-registered investment accounts
**Key Test Points**:
- Non-registered withdrawals prioritized
- Capital gains inclusion rate (50%) properly applied
- ACB (Adjusted Cost Base) tracking accurate
- Return of capital (ROC) handled correctly

### Strategy 5: tfsa-first
**Description**: Withdraws from tax-free accounts first for maximum flexibility
**Target Users**: Conservative planners who want to preserve tax-deferred growth
**Key Test Points**:
- TFSA withdrawals happen before RRSP/RRIF
- TFSA contribution room properly tracked
- No tax on TFSA withdrawals
- TFSA balance depleted before other accounts

### Strategy 6: balanced
**Description**: Balanced approach across all account types
**Target Users**: General population, moderate risk tolerance
**Key Test Points**:
- Withdrawals proportional across all account types
- No single account depleted too quickly
- Tax efficiency maintained across years
- Smooth withdrawal pattern

### Strategy 7: rrif-frontload
**Description**: Tax Smoothing + OAS Protection - Withdraws 15% of RRIF before OAS/CPP starts, then 8% after. Automatically avoids OAS clawback
**Target Users**: Early retirees (before 65) with large RRSP/RRIF balances
**Key Test Points**:
- 15% RRIF withdrawal rate before OAS/CPP start age
- 8% RRIF withdrawal rate after benefits start
- Automatic OAS clawback protection (switch to TFSA/NonReg when approaching threshold)
- Tax smoothing across retirement years
- Verification that benefits start correctly (CPP at cpp_start_age, OAS at oas_start_age)

### Strategy 8: manual
**Description**: Custom withdrawal strategy defined by user
**Target Users**: Advanced users with specific withdrawal plans
**Key Test Points**:
- User can manually specify withdrawal sources
- No automatic optimization applied
- User-defined rules respected
- Edge case: Verify manual strategy requires additional configuration

---

## 2. Test Environment Setup

### Prerequisites
- ✅ Database populated with test user data
- ✅ Wizard completed with assets, income, and expenses
- ✅ CSRF token generation working
- ✅ Python backend API running on port 8000
- ✅ Next.js frontend running on port 3000

### Test Data Requirements

#### Individual Test Profile
```typescript
{
  province: 'ON',
  start_age: 65,
  end_age: 95,
  tfsa_balance: 50000,
  rrsp_balance: 300000,
  rrif_balance: 0,
  nonreg_balance: 200000 (nr_cash: 20000, nr_gic: 50000, nr_invest: 130000),
  corporate_balance: 0,
  cpp_start_age: 65,
  cpp_annual_at_start: 15000,
  oas_start_age: 65,
  oas_annual_at_start: 8500,
  spending_go_go: 60000,
  spending_slow_go: 48000,
  spending_no_go: 40000
}
```

#### Couples Test Profile
```typescript
{
  province: 'ON',
  p1: {
    start_age: 65,
    tfsa_balance: 50000,
    rrsp_balance: 300000,
    rrif_balance: 0,
    nonreg_balance: 150000,
    corporate_balance: 0,
  },
  p2: {
    start_age: 63,
    tfsa_balance: 30000,
    rrsp_balance: 150000,
    rrif_balance: 0,
    nonreg_balance: 100000,
    corporate_balance: 0,
  },
  spending_go_go: 80000,
  spending_slow_go: 64000,
  spending_no_go: 50000
}
```

#### Corporate Account Holder Profile
```typescript
{
  province: 'BC',
  start_age: 60,
  tfsa_balance: 80000,
  rrsp_balance: 400000,
  rrif_balance: 0,
  nonreg_balance: 100000,
  corporate_balance: 500000 (corp_cash: 50000, corp_gic: 100000, corp_invest: 350000),
  corp_rdtoh: 25000,
  corp_dividend_type: 'eligible',
  spending_go_go: 100000,
  spending_slow_go: 80000,
  spending_no_go: 65000
}
```

---

## 3. Test Cases by Strategy

### Test Case 1: corporate-optimized Strategy

**Test ID**: SIM-CORP-001
**Priority**: High
**Strategy**: corporate-optimized

#### Setup
1. Create user with corporate account balance > $100,000
2. Set province to BC (business-friendly tax rates)
3. Complete wizard with corporate assets
4. Navigate to /simulation

#### Test Steps
1. Verify prefill data loaded correctly
2. Select "Corporate Optimized" strategy from dropdown
3. Click "Run Simulation"
4. Wait for results to load

#### Expected Results
- ✅ Simulation completes successfully (success: true)
- ✅ Corporate withdrawals occur before RRIF withdrawals in early years
- ✅ Total tax is minimized compared to other strategies
- ✅ corp_cash_bucket, corp_gic_bucket, corp_invest_bucket balances decrease appropriately
- ✅ RDTOH (corp_rdtoh) is properly accounted for in tax calculations
- ✅ Eligible dividends are taxed at preferential rates
- ✅ Year-by-year table shows corporate_withdrawal_p1 > 0 in early years

#### Validation Points
- Check `year_by_year[0].corporate_withdrawal_p1` > 0
- Compare `summary.total_corporate_withdrawn` with other account totals
- Verify `summary.corporate_pct_of_total` is highest percentage
- Check tax efficiency: `summary.avg_effective_tax_rate` should be lower than other strategies

---

### Test Case 2: minimize-income Strategy

**Test ID**: SIM-MIN-001
**Priority**: High
**Strategy**: minimize-income

#### Setup
1. Create user with modest assets ($200,000 total)
2. Set CPP to $10,000, OAS to $8,500
3. Set spending_go_go to $40,000 (low spending to qualify for GIS)
4. Province: ON

#### Test Steps
1. Load prefill data
2. Select "Minimize Income" strategy
3. Run simulation
4. Check results tab

#### Expected Results
- ✅ Taxable income kept below GIS eligibility threshold (~$21,000 for single)
- ✅ TFSA withdrawals prioritized (tax-free)
- ✅ OAS clawback avoided (taxable income < $90,997 threshold for 2025)
- ✅ GIS payments appear in year_by_year[].gis_p1 field
- ✅ Capital gains triggered instead of full RRIF withdrawals when possible
- ✅ Government benefits maximized: `summary.total_gis` > 0

#### Validation Points
- Check `year_by_year[i].taxable_income_p1` < $21,000 in early years
- Verify `year_by_year[i].gis_p1` > 0 (GIS received)
- Verify `year_by_year[i].oas_clawback_p1` === 0 or undefined (no clawback)
- Check `year_by_year[i].tfsa_withdrawal_p1` > `year_by_year[i].rrif_withdrawal_p1` in early years

---

### Test Case 3: rrif-splitting Strategy

**Test ID**: SIM-SPLIT-001
**Priority**: High
**Strategy**: rrif-splitting

#### Setup
1. Create couple with significant RRIF balance difference
   - P1: rrsp_balance: $400,000
   - P2: rrsp_balance: $100,000
2. Set income_split_rrif_fraction to 0.5 (50% splitting)
3. Province: ON

#### Test Steps
1. Add partner in simulation form
2. Load prefill data for both partners
3. Select "RRIF Splitting" strategy
4. Verify income_split_rrif_fraction is set to appropriate value
5. Run simulation

#### Expected Results
- ✅ RRIF income split between spouses
- ✅ P1 and P2 tax brackets more balanced
- ✅ Total household tax reduced compared to no splitting
- ✅ Both `total_tax_p1` and `total_tax_p2` are lower than single-earner scenario
- ✅ Pension income splitting shows in tax calculations

#### Validation Points
- Verify `household_input.income_split_rrif_fraction` = 0.5
- Check `year_by_year[i].total_tax_p1` + `year_by_year[i].total_tax_p2` < total without splitting
- Verify `year_by_year[i].taxable_income_p1` and `taxable_income_p2` are more balanced
- Check `summary.total_tax_paid` is lower than equivalent simulation without splitting

---

### Test Case 4: capital-gains-optimized Strategy

**Test ID**: SIM-CAPG-001
**Priority**: Medium
**Strategy**: capital-gains-optimized

#### Setup
1. Create user with large non-registered balance ($300,000)
2. Set nonreg_acb to $240,000 (80% of balance)
3. Set nr_invest to majority of nonreg balance
4. Province: BC

#### Test Steps
1. Load prefill data
2. Verify non-registered balance and ACB are correct
3. Select "Capital Gains Optimized" strategy
4. Run simulation

#### Expected Results
- ✅ Non-registered withdrawals prioritized
- ✅ Capital gains taxed at 50% inclusion rate
- ✅ ACB tracking accurate (nonreg_acb decreases appropriately)
- ✅ Return of capital (ROC) handled correctly
- ✅ Effective tax rate lower than RRIF-heavy strategies
- ✅ Non-registered balance depletes before RRIF

#### Validation Points
- Check `year_by_year[i].nonreg_withdrawal_p1` > `year_by_year[i].rrif_withdrawal_p1` in early years
- Verify `summary.nonreg_pct_of_total` > 50%
- Check `summary.avg_effective_tax_rate` is competitive
- Verify capital gains treatment: taxable income should reflect 50% inclusion

---

### Test Case 5: tfsa-first Strategy

**Test ID**: SIM-TFSA-001
**Priority**: Medium
**Strategy**: tfsa-first

#### Setup
1. Create user with balanced accounts
   - TFSA: $80,000
   - RRSP: $300,000
   - NonReg: $100,000
2. Province: AB

#### Test Steps
1. Load prefill data
2. Select "TFSA First" strategy
3. Run simulation

#### Expected Results
- ✅ TFSA withdrawals happen first
- ✅ TFSA balance depletes before RRSP/RRIF touched
- ✅ No tax on TFSA withdrawals
- ✅ Taxable income lower in early years
- ✅ TFSA contribution room properly tracked
- ✅ After TFSA depleted, switches to other accounts

#### Validation Points
- Check `year_by_year[0].tfsa_withdrawal_p1` > 0 and other withdrawals = 0
- Verify `year_by_year[i].tfsa_balance_p1` decreases each year until zero
- After TFSA depleted, verify `year_by_year[i+1].rrif_withdrawal_p1` > 0
- Check `year_by_year[i].taxable_income_p1` excludes TFSA withdrawals

---

### Test Case 6: balanced Strategy

**Test ID**: SIM-BAL-001
**Priority**: Medium
**Strategy**: balanced

#### Setup
1. Create user with all account types
   - TFSA: $50,000
   - RRSP: $200,000
   - NonReg: $150,000
   - Corporate: $100,000
2. Province: ON

#### Test Steps
1. Load prefill data with all accounts
2. Select "Balanced" strategy
3. Run simulation

#### Expected Results
- ✅ Withdrawals proportional across accounts
- ✅ No single account depletes too quickly
- ✅ Tax efficiency maintained
- ✅ Smooth withdrawal pattern across years
- ✅ All account percentages relatively balanced

#### Validation Points
- Check withdrawal percentages: `summary.rrif_pct_of_total`, `tfsa_pct_of_total`, `nonreg_pct_of_total`, `corporate_pct_of_total`
- Verify no single percentage > 60%
- Check balances decrease smoothly: no sharp drops in any account
- Verify `summary.avg_effective_tax_rate` is reasonable (not optimized but not worst)

---

### Test Case 7: rrif-frontload Strategy

**Test ID**: SIM-FRONT-001
**Priority**: High
**Strategy**: rrif-frontload

#### Setup
1. Create user aged 60 (before OAS/CPP)
2. Large RRSP balance: $500,000
3. CPP start age: 65
4. OAS start age: 65
5. Province: ON

#### Test Steps
1. Load prefill data
2. Verify start_age < cpp_start_age
3. Select "RRIF Front-Load (Tax Smoothing + OAS Protection)" strategy
4. Run simulation

#### Expected Results
- ✅ Years 60-64 (before CPP/OAS): RRIF withdrawal rate ~15% of balance
- ✅ Year 65+ (after CPP/OAS): RRIF withdrawal rate ~8% of balance
- ✅ When approaching OAS clawback threshold (~$90,997), switches to TFSA/NonReg
- ✅ Tax smoothing: effective tax rate relatively stable across years
- ✅ OAS clawback avoided: `oas_clawback_p1` = 0 or minimal
- ✅ Benefits start correctly at specified ages

#### Validation Points
- Check years 0-4: `year_by_year[i].rrif_withdrawal_p1` ≈ 15% of `rrif_balance_p1`
- Check year 5+: `year_by_year[i].rrif_withdrawal_p1` ≈ 8% of `rrif_balance_p1`
- Verify `year_by_year[5].cpp_p1` > 0 (CPP starts at age 65)
- Verify `year_by_year[5].oas_p1` > 0 (OAS starts at age 65)
- Check `year_by_year[i].oas_clawback_p1` = 0 or very low
- When taxable income approaches $90,997, verify switch to TFSA: `tfsa_withdrawal_p1` increases

---

### Test Case 8: manual Strategy

**Test ID**: SIM-MAN-001
**Priority**: Low
**Strategy**: manual

#### Setup
1. Create standard user profile
2. Province: AB

#### Test Steps
1. Load prefill data
2. Select "Manual" strategy
3. Run simulation

#### Expected Results
- ⚠️ May require additional manual configuration (not yet implemented in UI)
- ✅ No automatic optimization applied
- ✅ User-defined withdrawal rules respected (if configured)
- ⚠️ Edge case: May show warning or error if manual rules not defined

#### Validation Points
- Check if simulation completes or returns error
- Verify `household_input.strategy` = 'manual'
- Check if warning message appears in `response.warnings`
- Document current behavior for future enhancement

---

## 4. Edge Cases and Error Scenarios

### Edge Case 1: Insufficient Assets
**Test ID**: SIM-EDGE-001
**Scenario**: User with $50,000 total assets, $80,000 annual spending
**Expected**: Simulation shows failure years, underfunding warnings

### Edge Case 2: No Partner Data in Couples Strategy
**Test ID**: SIM-EDGE-002
**Scenario**: Select rrif-splitting strategy without adding partner
**Expected**: Strategy reverts to balanced or shows warning

### Edge Case 3: Very Long Planning Horizon
**Test ID**: SIM-EDGE-003
**Scenario**: Set end_age to 120 (55 years of retirement)
**Expected**: Simulation completes, all balances depleted or very low

### Edge Case 4: Zero Spending
**Test ID**: SIM-EDGE-004
**Scenario**: Set all spending phases to $0
**Expected**: No withdrawals needed, balances grow with returns

### Edge Case 5: Unsupported Province
**Test ID**: SIM-EDGE-005
**Scenario**: User from Saskatchewan (not in supported list)
**Expected**: Province mapped to closest supported province, warning shown

---

## 5. Performance Testing

### Performance Benchmarks
- Prefill API: < 500ms
- Simulation API: < 3000ms (30 years simulation)
- Results rendering: < 1000ms

### Load Testing
- Concurrent users: 10 simulations simultaneously
- Memory usage: Monitor for leaks during repeated simulations

---

## 6. Data Flow Validation

### Critical Data Flow Points

#### 1. Wizard → Simulation Prefill
**File**: /app/api/simulation/prefill/route.ts (line 282)

**Test**: Verify data transfers correctly from wizard to simulation
- Assets from wizard appear in household.p1 fields
- Income sources populate correctly
- Expenses populate spending phases
- Province and life expectancy transfer

#### 2. Prefill → Simulation Input
**File**: /app/(dashboard)/simulation/page.tsx (lines 424-517)

**Test**: Verify prefill data merges with localStorage
- Asset balances always fresh from database
- Custom settings preserved (CPP/OAS dates, yields)
- includePartner state correct

#### 3. Simulation Input → API Call
**File**: /app/(dashboard)/simulation/page.tsx (lines 666-707)

**Test**: Verify API request format
- CSRF token included
- Strategy parameter correct
- All required fields present
- p2 zeroed out if no partner

#### 4. API Response → Results Display
**File**: /app/(dashboard)/simulation/page.tsx (lines 682-696)

**Test**: Verify results rendering
- year_by_year array populated
- summary object complete
- chart_data available
- Tabs switch to results

---

## 7. UI Component Testing

### Components to Test

#### HouseholdForm Strategy Dropdown
**File**: /components/simulation/HouseholdForm.tsx (lines 186-211)

**Tests**:
- All 8 strategies appear in dropdown
- Strategy descriptions visible
- Selection updates household state
- Selected strategy persists after prefill

#### Results Dashboard
**File**: /components/simulation/ResultsDashboard.tsx

**Tests**:
- Displays success/failure status
- Shows warnings array
- Error messages formatted correctly
- Summary statistics calculated

#### Year-by-Year Table
**File**: /components/simulation/YearByYearTable.tsx

**Tests**:
- All years display
- Withdrawal columns show correct values
- Tax columns calculate correctly
- Balance columns decrease appropriately

#### Charts
**Files**:
- PortfolioChart.tsx
- TaxChart.tsx
- SpendingChart.tsx
- GovernmentBenefitsChart.tsx
- IncomeCompositionChart.tsx
- WithdrawalsBySourceChart.tsx

**Tests**:
- Charts render without errors
- Data points match year_by_year
- Legends display correctly
- Tooltips show accurate values

---

## 8. Regression Testing

### Areas to Monitor
1. **Previous Simulation Results**: Ensure recent code changes don't break existing results
2. **Prefill Logic**: Verify wizard data still loads correctly
3. **CSRF Token**: Confirm token generation and validation
4. **localStorage Persistence**: Check custom settings save/load
5. **Province Mapping**: Verify unsupported provinces still map correctly

---

## 9. Test Execution Checklist

### Pre-Test Setup
- [ ] Database seeded with test users
- [ ] Backend API running (port 8000)
- [ ] Frontend running (port 3000)
- [ ] Test users completed wizard
- [ ] Browser DevTools open for debugging

### Test Execution Order
1. [ ] Test Case 1: corporate-optimized (SIM-CORP-001)
2. [ ] Test Case 2: minimize-income (SIM-MIN-001)
3. [ ] Test Case 3: rrif-splitting (SIM-SPLIT-001)
4. [ ] Test Case 4: capital-gains-optimized (SIM-CAPG-001)
5. [ ] Test Case 5: tfsa-first (SIM-TFSA-001)
6. [ ] Test Case 6: balanced (SIM-BAL-001)
7. [ ] Test Case 7: rrif-frontload (SIM-FRONT-001)
8. [ ] Test Case 8: manual (SIM-MAN-001)
9. [ ] Edge Cases (SIM-EDGE-001 to SIM-EDGE-005)

### Post-Test Validation
- [ ] All simulations completed successfully
- [ ] No console errors
- [ ] Results match expected patterns
- [ ] Performance within benchmarks
- [ ] Documentation updated with findings

---

## 10. Known Issues and Limitations

### Current Limitations
1. **Supported Provinces**: Only AB, BC, ON, QC have full tax calculations
2. **Manual Strategy**: May require additional configuration not yet in UI
3. **Corporate Accounts**: Limited to eligible dividend type selection
4. **Income Splitting**: Requires manual setting of income_split_rrif_fraction

### Future Enhancements
1. Add strategy comparison tool
2. Implement automated testing suite
3. Add Monte Carlo simulation
4. Support all Canadian provinces
5. Add sensitivity analysis

---

## 11. Success Criteria

A strategy passes testing if:
- ✅ Simulation completes without errors (success: true)
- ✅ Year-by-year data is complete (no missing years)
- ✅ Withdrawal pattern matches strategy description
- ✅ Tax calculations are accurate
- ✅ Account balances decrease logically
- ✅ Government benefits calculated correctly
- ✅ No console errors or warnings
- ✅ Results render in UI correctly
- ✅ Performance within benchmarks

---

## 12. Test Report Template

For each test case, document:

```markdown
### Test Case: [Strategy Name]
**Test ID**: SIM-XXX-XXX
**Date Tested**: YYYY-MM-DD
**Tester**: [Name]
**Status**: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

#### Test Results
- Simulation Success: [YES/NO]
- Execution Time: [XXX ms]
- Withdrawal Pattern: [Correct/Incorrect]
- Tax Calculations: [Accurate/Inaccurate]
- UI Rendering: [OK/Issues]

#### Issues Found
1. [Issue description]
2. [Issue description]

#### Screenshots
[Attach relevant screenshots]

#### Recommendations
[Any recommendations for improvements]
```

---

## Appendix A: API Endpoints

### /api/simulation/prefill
**Method**: GET
**Purpose**: Load user profile data into simulation form
**Response**: HouseholdInput with prefilled data

### /api/simulation/run
**Method**: POST
**Purpose**: Execute retirement simulation
**Request Body**: HouseholdInput
**Response**: SimulationResponse

### /api/simulation/quick-start
**Method**: POST
**Purpose**: Run simulation with smart defaults
**Response**: SimulationResponse

### /api/csrf
**Method**: GET
**Purpose**: Generate CSRF token
**Response**: { token: string }

---

## Appendix B: Key File Locations

### Frontend
- Main Page: `/app/(dashboard)/simulation/page.tsx`
- Types: `/lib/types/simulation.ts`
- API Client: `/lib/api/simulation-client.ts`
- Components: `/components/simulation/*.tsx`

### Backend (Python)
- Main API: `/juan-retirement-app/api/main.py`
- Simulation Logic: `/juan-retirement-app/api/simulation/*.py`

---

## Appendix C: Glossary

- **ACB**: Adjusted Cost Base - original purchase price of non-registered investments
- **CPP**: Canada Pension Plan
- **GIS**: Guaranteed Income Supplement
- **OAS**: Old Age Security
- **RDTOH**: Refundable Dividend Tax On Hand (corporate accounts)
- **RRIF**: Registered Retirement Income Fund
- **RRSP**: Registered Retirement Savings Plan
- **ROC**: Return of Capital
- **TFSA**: Tax-Free Savings Account

---

**End of Test Plan**
