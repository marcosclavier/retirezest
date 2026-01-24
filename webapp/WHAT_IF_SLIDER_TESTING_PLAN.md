# What-If Sliders Testing & Implementation Plan

## Critical Finding

**Current State:** The What-If Sliders component (`components/simulation/WhatIfSliders.tsx`) uses **simplified client-side estimates** that do NOT run actual simulations. The impact calculations are hardcoded approximations (lines 54-96).

**Problem:** These estimates don't account for:
- ✗ Federal and provincial tax brackets
- ✗ OAS clawback calculations based on income
- ✗ RRSP/RRIF minimum withdrawal requirements
- ✗ Asset growth, depletion, and rebalancing
- ✗ All expense categories
- ✗ Complex withdrawal strategies (TFSA-first, balanced, etc.)
- ✗ CPP/OAS benefit adjustments based on start age
- ✗ Marginal tax rates on different income types

## Implementation Strategy

### Option 1: Real-Time Simulations (Recommended)
**Approach:** When user adjusts sliders, trigger actual simulation API calls with modified parameters.

**Pros:**
- 100% accurate results using the same Python simulation engine
- Accounts for all tax implications, assets, expenses, and income sources
- No duplicated calculation logic

**Cons:**
- Requires API calls (slower than client-side)
- Need to implement debouncing to avoid excessive API calls
- Requires backend changes

### Option 2: Improved Client-Side Estimates
**Approach:** Enhance client-side calculations with more accurate formulas.

**Pros:**
- Instant feedback
- No API calls required

**Cons:**
- Still won't be 100% accurate
- Duplicates complex tax/withdrawal logic from Python backend
- Hard to maintain parity between frontend estimates and backend calculations

## Recommended Implementation: Option 1

### Phase 1: Backend API Enhancement

#### 1.1 Create What-If Scenario API Endpoint
**File:** `app/api/simulation/what-if/route.ts`

```typescript
/**
 * POST /api/simulation/what-if
 *
 * Run a simulation with scenario adjustments applied to base household input.
 * This endpoint takes the original simulation result + adjustments and returns
 * a new simulation with the modified parameters.
 */
```

**Features:**
- Accept `ScenarioAdjustments` + base `HouseholdInput`
- Apply adjustments to create modified household input
- Call Python simulation API
- Return full simulation results
- Implement caching to reduce redundant calculations

#### 1.2 Adjustment Application Logic
Transform slider adjustments into household input modifications:

```typescript
function applyAdjustments(
  base: HouseholdInput,
  adjustments: ScenarioAdjustments
): HouseholdInput {
  return {
    ...base,
    // Spending multiplier
    spending_go_go: Math.round(base.spending_go_go * adjustments.spendingMultiplier),
    spending_slow_go: Math.round(base.spending_slow_go * adjustments.spendingMultiplier),
    spending_no_go: Math.round(base.spending_no_go * adjustments.spendingMultiplier),

    // Retirement age shift
    p1: {
      ...base.p1,
      start_age: base.p1.start_age + adjustments.retirementAgeShift,
      cpp_start_age: Math.max(60, Math.min(70, base.p1.cpp_start_age + adjustments.cppStartAgeShift)),
      oas_start_age: Math.max(65, Math.min(70, base.p1.oas_start_age + adjustments.oasStartAgeShift)),
    },

    // Partner adjustments (if applicable)
    p2: base.p2.name ? {
      ...base.p2,
      start_age: base.p2.start_age + adjustments.retirementAgeShift,
      cpp_start_age: Math.max(60, Math.min(70, base.p2.cpp_start_age + adjustments.cppStartAgeShift)),
      oas_start_age: Math.max(65, Math.min(70, base.p2.oas_start_age + adjustments.oasStartAgeShift)),
    } : base.p2,
  };
}
```

### Phase 2: Frontend Enhancement

#### 2.1 Update WhatIfSliders Component
**File:** `components/simulation/WhatIfSliders.tsx`

**Changes:**
1. Add "Run Scenario" button (disabled during loading)
2. Show loading state while simulation runs
3. Display comparison: Original vs. What-If results
4. Replace simplified estimates with actual simulation results
5. Implement debounced API calls (500ms delay after slider changes)

#### 2.2 Results Comparison View
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <h4>Original Plan</h4>
    <div>Health Score: {originalResult.summary.success_rate * 100}</div>
    <div>Final Estate: ${originalResult.summary.final_estate_after_tax}</div>
  </div>
  <div>
    <h4>What-If Scenario</h4>
    <div>Health Score: {whatIfResult.summary.success_rate * 100}</div>
    <div>Final Estate: ${whatIfResult.summary.final_estate_after_tax}</div>
  </div>
</div>
```

### Phase 3: Comprehensive Testing

#### 3.1 Unit Tests - Adjustment Application
Test that adjustments are correctly applied:

**Test Cases:**
1. ✓ Spending multiplier of 0.8 reduces all spending phases by 20%
2. ✓ Spending multiplier of 1.2 increases all spending phases by 20%
3. ✓ Retirement age shift of +3 adds 3 years to both people
4. ✓ Retirement age shift of -2 subtracts 2 years
5. ✓ CPP start age shift respects 60-70 bounds
6. ✓ OAS start age shift respects 65-70 bounds
7. ✓ Combined adjustments work correctly

#### 3.2 Integration Tests - Full Simulation
Test that What-If scenarios produce accurate results:

**Test Scenarios:**

**Scenario 1: Reduced Spending (80%)**
```typescript
const scenario = {
  spendingMultiplier: 0.8,
  retirementAgeShift: 0,
  cppStartAgeShift: 0,
  oasStartAgeShift: 0,
};
```
**Expected:** Health score improves, final estate increases

**Scenario 2: Delayed Retirement (+3 years)**
```typescript
const scenario = {
  spendingMultiplier: 1.0,
  retirementAgeShift: 3,
  cppStartAgeShift: 0,
  oasStartAgeShift: 0,
};
```
**Expected:** More years of income accumulation, higher final estate

**Scenario 3: Delayed CPP (Age 70 vs 65)**
```typescript
const scenario = {
  spendingMultiplier: 1.0,
  retirementAgeShift: 0,
  cppStartAgeShift: 5, // 65 → 70
  oasStartAgeShift: 0,
};
```
**Expected:** 42% higher CPP payments, tax implications calculated correctly

**Scenario 4: Delayed OAS (Age 70 vs 65)**
```typescript
const scenario = {
  spendingMultiplier: 1.0,
  retirementAgeShift: 0,
  cppStartAgeShift: 0,
  oasStartAgeShift: 5, // 65 → 70
};
```
**Expected:** 36% higher OAS payments, clawback thresholds calculated

**Scenario 5: Combined Adjustments**
```typescript
const scenario = {
  spendingMultiplier: 0.85,
  retirementAgeShift: 2,
  cppStartAgeShift: 2,
  oasStartAgeShift: 2,
};
```
**Expected:** Compound improvements across all metrics

#### 3.3 Tax Calculation Verification

**Test Cases:**
1. ✓ Federal tax brackets applied correctly in each year
2. ✓ Provincial tax (Alberta) applied correctly
3. ✓ OAS clawback triggered at $90,997 (2026 threshold)
4. ✓ OAS fully clawed back at correct threshold
5. ✓ CPP benefit adjustments:
   - Age 60: -36% (0.6% per month early)
   - Age 65: 100%
   - Age 70: +42% (0.7% per month delayed)
6. ✓ RRIF minimum withdrawals calculated by age
7. ✓ Capital gains inclusion (66.67% for amounts over $250K)

#### 3.4 Asset Verification

**Test Cases:**
1. ✓ TFSA withdrawals tax-free
2. ✓ RRSP/RRIF withdrawals fully taxable
3. ✓ Non-registered investment income:
   - Eligible dividends: dividend tax credit applied
   - Non-eligible dividends: gross-up and credit
   - Capital gains: 50% inclusion (or 66.67% over $250K)
   - Interest: fully taxable
4. ✓ Corporate account distributions
5. ✓ Asset depletion strategy (TFSA-first, balanced, etc.)

#### 3.5 Expense Verification

**Test Cases:**
1. ✓ Spending multiplier applies to ALL expense categories:
   - Go-go phase spending
   - Slow-go phase spending
   - No-go phase spending
2. ✓ Spending inflation applied correctly each year
3. ✓ Phase transitions at correct ages

#### 3.6 E2E Tests

**File:** `e2e/what-if-scenarios.spec.ts`

```typescript
test('What-If Sliders: Reduced spending improves health score', async ({ page }) => {
  // Run baseline simulation
  await page.goto('/simulation');
  await runSimulation(page);
  const baselineScore = await page.locator('[data-testid="health-score"]').innerText();

  // Adjust spending to 80%
  await page.locator('[data-testid="spending-slider"]').fill('80');
  await page.locator('[data-testid="run-what-if"]').click();

  // Verify improved score
  const whatIfScore = await page.locator('[data-testid="what-if-health-score"]').innerText();
  expect(parseFloat(whatIfScore)).toBeGreaterThan(parseFloat(baselineScore));
});
```

## Testing Checklist

### Unit Tests
- [ ] Adjustment application logic
- [ ] Spending multiplier calculations
- [ ] Age shift boundaries
- [ ] CPP/OAS age constraints

### Integration Tests
- [ ] Scenario 1: Reduced spending (80%)
- [ ] Scenario 2: Delayed retirement (+3 years)
- [ ] Scenario 3: Delayed CPP (70 vs 65)
- [ ] Scenario 4: Delayed OAS (70 vs 65)
- [ ] Scenario 5: Combined adjustments
- [ ] Scenario 6: Increased spending (120%)
- [ ] Scenario 7: Early retirement (-2 years)
- [ ] Scenario 8: Early CPP (60)
- [ ] Scenario 9: Complex couple scenario

### Tax & Benefits Tests
- [ ] Federal tax brackets (2026)
- [ ] Alberta provincial tax (2026)
- [ ] OAS clawback at $90,997
- [ ] OAS full clawback
- [ ] CPP adjustment factors
- [ ] RRIF minimum withdrawals
- [ ] Capital gains inclusion rates

### Asset Tests
- [ ] TFSA tax-free treatment
- [ ] RRSP/RRIF full taxation
- [ ] Non-reg eligible dividends
- [ ] Non-reg non-eligible dividends
- [ ] Non-reg capital gains
- [ ] Non-reg interest income
- [ ] Corporate distributions
- [ ] Withdrawal strategy application

### Expense Tests
- [ ] Spending multiplier on go-go
- [ ] Spending multiplier on slow-go
- [ ] Spending multiplier on no-go
- [ ] Spending inflation
- [ ] Phase transitions

### E2E Tests
- [ ] Slider interactions
- [ ] Real-time feedback
- [ ] Comparison display
- [ ] Reset functionality
- [ ] Mobile responsiveness

## Implementation Timeline

### Week 1: Backend Foundation
- Day 1-2: Create `/api/simulation/what-if` endpoint
- Day 3: Implement adjustment application logic
- Day 4-5: Write unit tests for adjustment logic

### Week 2: Frontend Integration
- Day 1-2: Update WhatIfSliders component
- Day 3: Add comparison view
- Day 4: Implement debouncing and loading states
- Day 5: Manual testing

### Week 3: Comprehensive Testing
- Day 1-2: Integration tests (scenarios 1-5)
- Day 3: Tax and benefits verification tests
- Day 4: Asset and expense verification tests
- Day 5: E2E tests

### Week 4: Refinement
- Day 1-2: Fix any test failures
- Day 3: Performance optimization
- Day 4: Documentation
- Day 5: Code review and deployment

## Success Criteria

1. ✓ What-If scenarios use real simulation engine (not estimates)
2. ✓ All tax calculations accurate (federal + provincial)
3. ✓ OAS clawback calculations correct
4. ✓ CPP/OAS benefit adjustments precise
5. ✓ All asset types handled correctly
6. ✓ All expense categories adjusted proportionally
7. ✓ Results match manual calculation verification
8. ✓ 100% test coverage on adjustment logic
9. ✓ E2E tests pass for all major scenarios
10. ✓ Performance: What-If simulation completes in <3 seconds

## Current Status

- [x] Critical issue identified
- [x] Implementation plan created
- [ ] Backend API endpoint created
- [ ] Frontend component updated
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] E2E tests written
- [ ] All tests passing
