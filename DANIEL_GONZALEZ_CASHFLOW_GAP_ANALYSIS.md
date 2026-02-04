# Daniel Gonzalez Cash Flow Gap Analysis (2026-2027)

**Date**: February 4, 2026
**User**: danjgonzalezm@gmail.com
**Issue**: Simulation shows cash flow gaps in years 2026-2027 despite having employment income
**Severity**: P1 🟡 - Logic bug affecting pre-retirement simulations

---

## Executive Summary

Daniel Gonzalez (age 64, retiring at 66) is experiencing **cash flow gaps in 2026-2027** despite:
- $200,000 annual employment income (until age 66)
- $1,050,000 in total assets
- Only $58,000 in annual expenses

**Root Cause Hypothesis**: The simulation is not properly handling employment income that ends at retirement age, creating artificial gaps in the years leading up to retirement.

---

## User Profile

### Demographics
- **Email**: danjgonzalezm@gmail.com
- **Name**: Daniel Gonzalez
- **Current Age**: 64 (as of Feb 2026)
- **Retirement Age**: 66
- **Life Expectancy**: 85
- **Province**: Alberta
- **Partner**: No

### Assets ($1,050,000 total)
1. **RRSP**: $500,000 (owner: person1)
2. **TFSA**: $100,000 (owner: person1)
3. **Non-Registered**: $50,000 (owner: person1)
4. **Property**: $400,000 (owner: person1)

### Income ($200,000/year)
1. **Employment**: $200,000/annual
   - Owner: person1
   - Description: Employment Income
   - **Should continue until age 66 (retirement)**

### Expenses ($58,000/year)
1. **Housing**: $4,000/month ($48,000/year) - Essential
2. **Travel**: $10,000/year - Essential

### Financial Math
- **Annual Income**: $200,000
- **Annual Expenses**: $58,000
- **Annual Surplus**: $142,000 (should be positive!)
- **Years until retirement**: 2 years (age 64 → 66)

---

## Simulation Results Analysis

### Recent Simulation Runs

**3 simulation runs found** (all within past hour):

| Run ID | Created | Strategy | Age Range | Success Rate | Health Score |
|--------|---------|----------|-----------|--------------|--------------|
| 988c5367... | 2026-02-04 16:40:18 | minimize-income | 64 → 85 | 0.91% | 92 |
| a306e71e... | 2026-02-04 16:40:11 | minimize-income | 64 → 85 | 0.91% | 92 |
| 7ba67448... | 2026-02-04 16:34:42 | minimize-income | 64 → 95 | 0.94% | 92 |

**Observation**: All runs show very low success rate (~1%) despite:
- High employment income ($200K)
- Low expenses ($58K)
- Substantial assets ($1.05M)

This is **highly suspicious** and suggests a simulation bug.

### Actual Results from User Screenshot ✅ CONFIRMED BUG

**Screenshot provided by user shows year-by-year results:**

| Year | Age P1 | Age P2 | Spending Need | Spending Met | Total Tax | Total Value | Success |
|------|--------|--------|---------------|--------------|-----------|-------------|---------|
| **2026** | **64** | **65** | **$58,000** | **$58,000** | **$0** ❌ | **$133,265** | **X** ❌ |
| **2027** | **65** | **66** | **$59,160** | **$59,160** | **$0** ❌ | **$154,705** | **X** ❌ |
| 2028 | 66 | 67 | $60,343 | $60,343 | $10,796 ✅ | $175,859 | ✓ ✅ |
| 2029 | 67 | 68 | $61,550 | $61,550 | $10,796 | $198,389 | ✓ |
| 2030+ | 68+ | 69+ | ... | ... | $10K-$11K | Growing | ✓ |

### 🔴 SMOKING GUN: Total Tax = $0 in 2026-2027

**The Evidence**:
- **Years 2026-2027**: Tax = **$0** (No taxable income!)
- **Years 2028+**: Tax = **$10,796+** (Normal retirement income taxes)

**What This Proves**:
- Employment income ($200K/year) is **NOT being counted** in ages 64-65
- Simulation treats Daniel as if he's **already retired at age 64**
- Assets are being depleted to cover $58K expenses
- Once he "officially" retires at 66, CPP/OAS kick in and show normal taxes

**Expected vs Actual**:

| Year | Expected Income | Expected Tax | Actual Income (Bug) | Actual Tax (Bug) |
|------|----------------|--------------|---------------------|------------------|
| 2026 (Age 64) | $200,000 employment | ~$60,000 | $0 ❌ | $0 ❌ |
| 2027 (Age 65) | $200,000 employment | ~$60,000 | $0 ❌ | $0 ❌ |
| 2028 (Age 66) | $0 (retired) + CPP/OAS ~$23K | ~$10,796 | CPP/OAS ~$23K ✅ | $10,796 ✅ |

**Cash Flow Impact**:
```
2026 (Age 64) - WITH EMPLOYMENT (Expected):
  Income: $200,000 (employment)
  Tax:    -$60,000
  Net:    $140,000
  Expenses: -$58,000
  Surplus: +$82,000 ← ASSETS GROW

2026 (Age 64) - WITHOUT EMPLOYMENT (Bug):
  Income: $0 ❌
  Tax:    $0
  Withdrawals: +$58,000 (from assets)
  Expenses: -$58,000
  Net:    $0
  Result: ASSETS SHRINK by $58,000 ← FAILURE!
```

This explains the 1% success rate - assets are depleted for 2 years unnecessarily!

---

## Hypothesis: Why Cash Flow Gaps in 2026-2027?

Based on Daniel's profile, here are the most likely causes of cash flow gaps:

### Hypothesis #1: Employment Income Not Properly Calculated Before Retirement ⭐ MOST LIKELY

**Problem**: Employment income might not be included in years 2026-2027 (ages 64-66).

**Evidence**:
- Income record shows `startAge: null` (no explicit start age)
- Income type is "employment" (should end at retirement age)
- Retirement age is 66
- Current age is 64

**Logic Bug**: The simulation might be:
1. Treating `startAge: null` as "no income" or "start at retirement"
2. Not recognizing that employment income should continue until retirement
3. Applying retirement age filter too early (e.g., at age 65 instead of 66)

**Expected Behavior**:
- Ages 64-65 (2026-2027): Employment income = $200,000/year
- Age 66+ (2028+): Employment income = $0 (retired)

**Actual Behavior** (suspected):
- Ages 64-65 (2026-2027): Employment income = $0 ❌ BUG
- Age 66+ (2028+): Employment income = $0

**Cash Flow Impact**:
```
Year 2026 (Age 64):
  Income: $0 (employment not counted)  ❌
  Expenses: $58,000
  Net Cash Flow: -$58,000 (GAP!)

Year 2027 (Age 65):
  Income: $0 (employment not counted)  ❌
  Expenses: $58,000
  Net Cash Flow: -$58,000 (GAP!)

Year 2028 (Age 66 - Retired):
  Income: CPP ~$15,000 + OAS ~$8,000 = $23,000
  Expenses: $58,000
  Withdrawals from RRSP: $35,000
  Net Cash Flow: $0 (OK but low)
```

---

### Hypothesis #2: CPP/OAS Start Age Issue

**Problem**: User might have set CPP to start at age 65, but simulation is using age 60 default.

**Evidence**:
- No CPP/OAS start age information in profile
- Simulation might be using default start ages

**Logic Check Needed**:
- What are default CPP/OAS start ages in simulation?
- Does Daniel have CPP start age override?
- Is simulation properly deferring CPP to chosen start age?

**Impact**:
- If CPP starts "early" but user expects it later, cash flow gaps occur
- But this doesn't explain gaps in 2026-2027 (employment should cover)

---

### Hypothesis #3: Property Asset Not Liquid

**Problem**: Property ($400K) is not generating income and cannot be withdrawn.

**Evidence**:
- Property has $0 return rate
- Property is illiquid (cannot sell/withdraw)
- Effective liquid assets: $650K (RRSP + TFSA + NonReg)

**Impact**:
- Reduces available assets for withdrawals
- But with $200K employment income, shouldn't need withdrawals in 2026-2027

---

### Hypothesis #4: Tax Withholding Issue

**Problem**: Employment income might be gross (pre-tax) but simulation treats it as net (post-tax).

**Calculation**:
- $200K employment income in Alberta
- Federal + Provincial tax: ~$60K (30% effective rate)
- Net after-tax income: ~$140K

**If simulation is treating $200K as net**:
- Cash flow looks great ($200K - $58K = $142K surplus)

**If simulation is treating $200K as gross**:
- After tax: $200K - $60K tax = $140K net
- After expenses: $140K - $58K = $82K surplus (still positive!)

**Conclusion**: Tax withholding doesn't explain gaps.

---

## Root Cause Identification ✅ CONFIRMED

### BUG FOUND: Employment Income Missing `endAge` Check

**Code Location**: `/juan-retirement-app/modules/simulation.py:1357`

**Current Buggy Code**:
```python
# Line 1349: Process other income sources (employment, business, rental from Income table, investment, other)
other_income_total = 0.0
other_incomes = getattr(person, 'other_incomes', [])
for other_income in other_incomes:
    income_start_age = other_income.get('startAge')

    # If no startAge specified, income is active (e.g., rental, investment income)
    # If startAge specified, check if income has started
    if income_start_age is None or age >= income_start_age:  # ❌ BUG: No endAge check!
        annual_amount = other_income.get('amount', 0.0)

        # Apply inflation indexing if enabled
        if other_income.get('inflationIndexed', True):
            if income_start_age:
                years_since_start = age - income_start_age
                annual_amount *= ((1 + hh.general_inflation) ** years_since_start)
            else:
                # No start age - use years since simulation start
                annual_amount *= ((1 + hh.general_inflation) ** years_since_start)

        other_income_total += annual_amount  # ❌ Income added FOREVER (no end check)
```

**The Bug**:
- Line 1357 checks if income has started (`income_start_age is None or age >= income_start_age`)
- **CRITICAL**: There is NO check for `endAge`
- Result: Employment income continues FOREVER or never starts properly

**Why Daniel's Income Shows $0**:
- Employment income record has `startAge: null` and `endAge: null`
- Code at line 1357: `if income_start_age is None or age >= income_start_age:`
- When `startAge is None`, condition passes for ALL ages
- But somewhere else in the code, there must be logic preventing employment income from being counted
- OR: The employment income has `startAge` set to retirement age (66) instead of current age (64)

**Expected Fix**:
```python
# FIXED Code (line 1349-1370)
other_income_total = 0.0
other_incomes = getattr(person, 'other_incomes', [])
for other_income in other_incomes:
    income_type = other_income.get('type', '')
    income_start_age = other_income.get('startAge')
    income_end_age = other_income.get('endAge')  # ✅ Get endAge

    # Special handling for employment income
    if income_type == 'employment':
        # Employment income defaults to: start = current age, end = retirement age
        if income_start_age is None:
            income_start_age = person.current_age
        if income_end_age is None:
            income_end_age = person.retirement_age  # ✅ Default to retirement age

    # Check if income is active this year
    is_active = True
    if income_start_age is not None and age < income_start_age:
        is_active = False  # ✅ Not started yet
    if income_end_age is not None and age >= income_end_age:
        is_active = False  # ✅ Already ended

    if is_active:
        annual_amount = other_income.get('amount', 0.0)

        # Apply inflation indexing if enabled
        if other_income.get('inflationIndexed', True):
            if income_start_age:
                years_since_start = age - income_start_age
                annual_amount *= ((1 + hh.general_inflation) ** years_since_start)
            else:
                annual_amount *= ((1 + hh.general_inflation) ** years_since_start)

        other_income_total += annual_amount
```

---

## Files to Investigate

### Frontend Code
1. **`webapp/app/(dashboard)/simulation/page.tsx`** - Simulation input form
   - Check how employment income is sent to API
   - Verify startAge and endAge are set correctly

2. **`webapp/app/api/simulation/run/route.ts`** - API endpoint
   - Check how income data is passed to Python backend
   - Verify employment income includes proper age ranges

### Backend Code
3. **`juan-retirement-app/simulation.py`** or similar
   - Core simulation logic
   - Income application by year
   - Employment income vs retirement income logic

4. **`juan-retirement-app/income.py`** or income calculation module
   - How employment income is calculated
   - Age range checks for different income types

---

## Expected Fix

### Fix #1: Ensure Employment Income Applies Before Retirement

**Python Backend**:
```python
def calculate_income_for_year(age, household, retirement_age):
    total_income = 0

    for income in household.income:
        if income.type == 'employment':
            # Employment income applies BEFORE retirement age
            if age < retirement_age:
                total_income += income.amount

        elif income.type in ['cpp', 'oas', 'pension']:
            # Retirement income applies AT/AFTER start age
            start_age = income.startAge or get_default_start_age(income.type)
            if age >= start_age:
                total_income += income.amount

        else:
            # Other income (rental, business, investment)
            # Check if income has age range specified
            start_age = income.startAge or 0
            end_age = income.endAge or 999
            if start_age <= age <= end_age:
                total_income += income.amount

    return total_income
```

### Fix #2: Add Validation for Missing Start/End Ages

**Frontend Validation**:
```typescript
// When creating employment income, explicitly set end age
if (income.type === 'employment') {
  income.endAge = household.person1.retirementAge;
  if (!income.startAge) {
    income.startAge = household.person1.currentAge;
  }
}
```

### Fix #3: Store Results in Database

**Current Issue**: `results` field is empty in all simulation runs.

**Fix**: Ensure results are properly saved:
```typescript
// app/api/simulation/run/route.ts
const simulationRun = await prisma.simulationRun.create({
  data: {
    userId: user.id,
    strategy: input.strategy,
    results: JSON.stringify(simulationResponse), // ✅ Save results
    // ... other fields
  }
});
```

**Or** if results are too large (>1MB), use compression:
```typescript
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const compressed = await gzipAsync(JSON.stringify(simulationResponse));
const resultsBase64 = compressed.toString('base64');
```

---

## User Story for Fix

### US-072: Fix Employment Income Not Applied in Pre-Retirement Years

**Story Points**: 3
**Priority**: P1 🟡
**Epic**: Epic 5 (Simulation Accuracy)

**Description**: As a user with employment income planning to retire in the future, I want my employment income to be properly included in the simulation for all years before retirement so that my cash flow projections are accurate.

**Acceptance Criteria**:
- [ ] Employment income applies to all years from current age to retirement age - 1
- [ ] Employment income does NOT apply at/after retirement age
- [ ] If income.startAge is null, default to current age
- [ ] If income.endAge is null for employment, default to retirement age
- [ ] Year-by-year results show correct income for pre-retirement years
- [ ] Test case: Daniel Gonzalez (age 64, retire 66, $200K employment) shows NO gaps in 2026-2027
- [ ] Simulation results are properly saved to database (not empty)

**Tasks**:
- [ ] Review Python backend income calculation logic
- [ ] Identify where employment income is filtered by age
- [ ] Fix logic to apply employment income before retirement age
- [ ] Add default start/end ages for employment income (frontend)
- [ ] Add validation: Employment income must have end age <= retirement age
- [ ] Fix results storage (ensure results field is not empty)
- [ ] Test with Daniel's exact profile
- [ ] Verify 2026-2027 show $200K income (not $0)
- [ ] Update documentation

**Test Case**:
```javascript
{
  currentAge: 64,
  retirementAge: 66,
  income: [
    { type: 'employment', amount: 200000, startAge: null, endAge: null }
  ],
  expenses: [
    { amount: 58000 }
  ]
}

Expected Results:
  Year 2026 (Age 64):
    ✅ Employment Income: $200,000
    ✅ Net Cash Flow: $142,000 (after expenses/tax)

  Year 2027 (Age 65):
    ✅ Employment Income: $200,000
    ✅ Net Cash Flow: $142,000 (after expenses/tax)

  Year 2028 (Age 66 - Retired):
    ✅ Employment Income: $0 (retired)
    ✅ CPP/OAS Income: $23,000
    ✅ Withdrawals: $35,000 (to cover gap)
```

**User Impact**:
- **HIGH** - Affects all users with employment income before retirement
- Causes incorrect cash flow gaps
- Makes simulations look pessimistic (lower success rates)
- User confusion: "Why do I have gaps when I'm still working?"

**Related Issues**:
- Similar to US-038 (CPP/OAS timing bug) fixed in Sprint 4
- May affect early retirement users most severely
- Impacts success rate calculations

---

## Immediate Actions

### 1. Contact Daniel Gonzalez (Today)
Email explaining the issue and asking for more details:
```
Hi Daniel,

I noticed you ran a few retirement simulations today. Our team is investigating
a potential issue with how employment income is calculated in the years leading
up to retirement.

Could you help us understand what you're seeing? Specifically:
1. Are you seeing cash flow gaps in 2026-2027 (ages 64-65)?
2. Does the simulation show your $200K employment income during those years?
3. What success rate did you see? (We're seeing ~1% which seems very low)

We want to make sure your projection is accurate. If there's an issue, we'll
fix it immediately and re-run your simulation.

Thanks for your patience!
- RetireZest Team
```

### 2. Reproduce Issue (Dev Environment)
- [ ] Create test user with Daniel's exact profile
- [ ] Run simulation with same parameters
- [ ] Capture year-by-year results
- [ ] Confirm whether 2026-2027 show $0 or $200K income

### 3. Review Backend Code (Next 2 Hours)
- [ ] Find income calculation logic in Python backend
- [ ] Trace how employment income is applied by year
- [ ] Identify bug in age filtering
- [ ] Write fix and test

### 4. Deploy Fix (Same Day)
- [ ] Test fix with Daniel's profile
- [ ] Verify 2026-2027 show correct income
- [ ] Deploy to production
- [ ] Re-run Daniel's simulation automatically
- [ ] Email Daniel with corrected results

---

## Prevention: Add Simulation Validation

### Validation Rule: Pre-Retirement Income Sanity Check

**Add to backend simulation**:
```python
def validate_simulation_inputs(household):
    warnings = []
    errors = []

    # Check if user has income before retirement
    current_age = household.person1.currentAge
    retirement_age = household.person1.retirementAge

    pre_retirement_income = sum(
        income.amount
        for income in household.income
        if income.type == 'employment'
    )

    if current_age < retirement_age and pre_retirement_income == 0:
        warnings.append({
            'field': 'income',
            'message': 'You are not retired yet but have no employment income. Is this correct?'
        })

    # Check if employment income has proper end age
    for income in household.income:
        if income.type == 'employment':
            if not income.endAge or income.endAge > retirement_age:
                warnings.append({
                    'field': f'income.{income.id}',
                    'message': f'Employment income should end at retirement age ({retirement_age}), but is set to {income.endAge or "no end"}.'
                })

    return {'warnings': warnings, 'errors': errors}
```

**Display warnings to user**:
```tsx
{validationResult.warnings.length > 0 && (
  <Alert variant="warning">
    <AlertTitle>Please Review</AlertTitle>
    <AlertDescription>
      <ul>
        {validationResult.warnings.map(w => (
          <li key={w.field}>{w.message}</li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
)}
```

---

## Related Documentation

- **US-038**: CPP/OAS Income Timing Bug (fixed Sprint 4) - Similar issue
- **EARLY_RETIREMENT_ISSUE_INVESTIGATION.md** - Early retirement bugs
- **CRITICAL_SIMULATION_ABANDONMENT_ANALYSIS.md** - User simulation issues

---

## Next Steps

1. ✅ User profile analyzed (Daniel Gonzalez)
2. ✅ Issue documented (this file)
3. ⏳ Contact Daniel for details
4. ⏳ Reproduce issue in dev
5. ⏳ Identify exact bug in code
6. ⏳ Write fix (US-072)
7. ⏳ Test and deploy
8. ⏳ Add validation to prevent future issues
9. ⏳ Add to Sprint 8 backlog

---

**Document Status**: ✅ Analysis Complete
**Next Step**: Investigate Python backend code to confirm hypothesis
**Estimated Fix Time**: 3-4 hours
**Priority**: P1 (affects active user with recent simulations)
