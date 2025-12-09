# Simulation Accuracy Fix Plan

## Date: 2025-12-07
## Status: Ready for Implementation

---

## Executive Summary

This plan addresses accuracy issues in the retirement simulation, prioritizing critical fixes that ensure users receive reliable retirement projections. The fixes are organized by priority and complexity.

---

## Priority 1: Critical Fixes (Immediate - Day 1-2)

### 1.1 Fix 0.0% Effective Tax Rate Display

**Problem**: Average effective tax rate shows 0.0% despite $54,641 in taxes paid.

**Root Cause**: Likely an issue in the Python simulation engine's calculation of `avg_effective_tax_rate`.

**Investigation Steps**:
```bash
# 1. Find Python simulation files
find .. -name "*.py" -path "*/simulation/*" -o -name "*tax*.py"

# 2. Search for avg_effective_tax_rate calculation
grep -r "avg_effective_tax_rate" ../ --include="*.py"

# 3. Review the calculation logic
# Expected: total_tax_paid / total_taxable_income
# Current: Unknown - needs investigation
```

**Fix Location**: Python backend simulation engine

**Expected Calculation**:
```python
# Should be something like:
avg_effective_tax_rate = total_tax_paid / total_income_subject_to_tax

# NOT:
avg_effective_tax_rate = total_tax_paid / total_withdrawals  # Wrong denominator
```

**Validation**:
- With $54,641 taxes on $982,371 withdrawals = 5.6% effective rate
- Test with known scenarios:
  - All RRSP: Should have high effective rate (~20-30%)
  - All TFSA: Should be 0%
  - Mixed: Should be proportional

**Files to Modify**:
- Python simulation engine (exact path TBD after investigation)
- Possibly: Aggregation/summary calculation logic

**Testing**:
```python
# Test case 1: All TFSA
assert avg_effective_tax_rate == 0.0

# Test case 2: All RRSP $100k withdrawal
# Expected: ~20-25% for middle income
assert 0.20 <= avg_effective_tax_rate <= 0.30

# Test case 3: Current scenario
# $54,641 / $982,371 = 0.0556 (5.56%)
assert abs(avg_effective_tax_rate - 0.0556) < 0.001
```

---

### 1.2 Add Warning for Assumed Values

**Problem**: Users don't know that ACB and asset allocations are estimates.

**Solution**: Add prominent warning alert on simulation page.

**Implementation**:

**File**: `/app/(dashboard)/simulation/page.tsx`

**Add after the prefill success alert** (around line 181):

```tsx
{/* Warning about assumed values */}
{prefillAvailable && !prefillLoading && (
  <Alert className="border-orange-200 bg-orange-50">
    <AlertCircle className="h-4 w-4 text-orange-600" />
    <AlertDescription className="text-orange-900">
      <strong>Important:</strong> Some values have been estimated:
      <ul className="list-disc list-inside mt-2 text-sm">
        <li>Asset allocation (cash/GIC/investments) based on typical distributions</li>
        <li>Adjusted Cost Base (ACB) estimated at 80% of non-registered balance</li>
        <li>CPP and OAS amounts use default values</li>
      </ul>
      <p className="mt-2 text-sm">
        Please review and adjust these values in the form below for more accurate results.
      </p>
    </AlertDescription>
  </Alert>
)}
```

**Required Import**:
```tsx
import { AlertCircle } from 'lucide-react';
```

**Visual Design**:
- Orange alert box (warning color)
- Icon with alert symbol
- Bulleted list of assumptions
- Call-to-action to review values

---

## Priority 2: Important Fixes (Short-term - Day 3-5)

### 2.1 Add Manual Review Section

**Problem**: Users can't easily review and adjust auto-populated values before running simulation.

**Solution**: Add expandable "Review Auto-Populated Values" section showing what was loaded and allowing adjustments.

**Implementation**:

**File**: `/app/(dashboard)/simulation/page.tsx`

**Add before the "Run Simulation" button**:

```tsx
{prefillAvailable && (
  <Collapsible
    title="Review Auto-Populated Values"
    description="Check and adjust estimated values for more accurate results"
    defaultOpen={false}
  >
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Your Name</Label>
          <p className="font-medium">{household.p1.name}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Current Age</Label>
          <p className="font-medium">{household.p1.start_age}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Province</Label>
          <p className="font-medium">{household.province}</p>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-semibold mb-2">Account Balances</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">TFSA</Label>
            <p className="font-medium">${household.p1.tfsa_balance.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">RRSP</Label>
            <p className="font-medium">${household.p1.rrsp_balance.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">RRIF</Label>
            <p className="font-medium">${household.p1.rrif_balance.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Non-Registered</Label>
            <p className="font-medium">${household.p1.nonreg_balance.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Corporate</Label>
            <p className="font-medium">${household.p1.corporate_balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-orange-900">Estimated Values ⚠️</h4>
        <p className="text-sm text-orange-800 mb-3">
          These values were estimated and may not reflect your actual situation.
          Expand the form sections below to adjust them.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-orange-700">Non-Reg ACB (Estimated)</Label>
            <p className="font-medium text-orange-900">
              ${household.p1.nonreg_acb.toLocaleString()}
              <span className="text-xs ml-1">(80% of balance)</span>
            </p>
          </div>
          <div>
            <Label className="text-xs text-orange-700">Asset Allocation</Label>
            <p className="text-xs text-orange-800">
              Assumed typical distribution (10% cash, 20% GIC, 70% investments)
            </p>
          </div>
        </div>
      </div>
    </div>
  </Collapsible>
)}
```

**Required Imports**:
```tsx
import { Separator } from '@/components/ui/separator';
import { Collapsible } from '@/components/ui/collapsible';
```

---

### 2.2 Improve Value Highlighting in PersonForm

**Problem**: Users don't know which values were auto-populated vs. defaults.

**Solution**: Add visual indicator (colored border or badge) on auto-populated fields.

**Implementation**:

**File**: `/components/simulation/PersonForm.tsx`

**Add new prop**:
```tsx
interface PersonFormProps {
  person: PersonInput;
  personLabel: string;
  personNumber: 'p1' | 'p2';
  onChange: (field: keyof PersonInput, value: any) => void;
  autoPopulated?: Set<keyof PersonInput>; // NEW
}
```

**Update Input fields that were auto-populated**:
```tsx
<Input
  id={`${personNumber}-tfsa`}
  type="number"
  value={person.tfsa_balance}
  onChange={(e) => onChange('tfsa_balance', parseFloat(e.target.value) || 0)}
  className={autoPopulated?.has('tfsa_balance') ? 'border-blue-300 bg-blue-50' : ''}
/>
{autoPopulated?.has('tfsa_balance') && (
  <p className="text-xs text-blue-600 mt-1">✓ Auto-loaded from profile</p>
)}
```

---

### 2.3 Create Validation Test Suite

**Problem**: No automated tests to verify calculation accuracy.

**Solution**: Create test suite with known scenarios and expected results.

**Create New File**: `/tests/simulation-accuracy.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Simulation Accuracy Tests', () => {
  describe('Tax Rate Calculations', () => {
    it('should calculate 0% effective rate for TFSA-only withdrawals', async () => {
      const input = {
        province: 'AB',
        p1: {
          name: 'Test',
          start_age: 65,
          tfsa_balance: 1000000,
          rrsp_balance: 0,
          nonreg_balance: 0,
          corporate_balance: 0,
          // ... other required fields
        },
        p2: defaultPersonInput,
        // ... other household fields
      };

      const result = await runSimulation(input);

      expect(result.success).toBe(true);
      expect(result.summary?.avg_effective_tax_rate).toBe(0);
      expect(result.summary?.total_tax_paid).toBe(0);
    });

    it('should calculate correct effective rate for RRSP withdrawals', async () => {
      const input = {
        province: 'AB',
        p1: {
          name: 'Test',
          start_age: 65,
          tfsa_balance: 0,
          rrsp_balance: 1000000,
          rrif_balance: 0,
          nonreg_balance: 0,
          corporate_balance: 0,
          target_annual_spend: 50000,
          // ... other required fields
        },
        p2: defaultPersonInput,
        // ... other household fields
      };

      const result = await runSimulation(input);

      expect(result.success).toBe(true);

      // At $50k income in Alberta, expect ~15-20% effective rate
      expect(result.summary?.avg_effective_tax_rate).toBeGreaterThan(0.10);
      expect(result.summary?.avg_effective_tax_rate).toBeLessThan(0.25);
    });

    it('should calculate correct effective rate for known scenario', async () => {
      // Scenario: $54,641 taxes on $982,371 withdrawals
      // Expected: 5.56% effective rate

      const result = await runSimulation(knownScenarioInput);

      expect(result.summary?.total_tax_paid).toBeCloseTo(54641, -2);
      expect(result.summary?.total_withdrawals).toBeCloseTo(982371, -2);
      expect(result.summary?.avg_effective_tax_rate).toBeCloseTo(0.0556, 3);
    });
  });

  describe('Portfolio Allocation', () => {
    it('should correctly aggregate asset balances', () => {
      const assets = [
        { type: 'TFSA', balance: 100000 },
        { type: 'TFSA', balance: 50000 },
        { type: 'RRSP', balance: 200000 },
        { type: 'Corporate', balance: 500000 },
      ];

      const totals = aggregateAssets(assets);

      expect(totals.tfsa_balance).toBe(150000);
      expect(totals.rrsp_balance).toBe(200000);
      expect(totals.corporate_balance).toBe(500000);
    });

    it('should distribute non-registered balance correctly', () => {
      const nonreg_balance = 100000;

      const distribution = distributeNonRegistered(nonreg_balance);

      expect(distribution.nr_cash).toBe(10000);  // 10%
      expect(distribution.nr_gic).toBe(20000);   // 20%
      expect(distribution.nr_invest).toBe(70000); // 70%
      expect(distribution.nonreg_acb).toBe(80000); // 80%
    });
  });

  describe('Final Estate Calculations', () => {
    it('should calculate estate taxes correctly', () => {
      // Test deemed disposition logic
      // Test RRSP/RRIF full taxation
      // Test capital gains on death
    });
  });
});
```

**Run tests**:
```bash
npm test tests/simulation-accuracy.test.ts
```

---

## Priority 3: Enhancement (Medium-term - Week 2)

### 3.1 Enhance Asset Model with Actual Data Fields

**Problem**: Database doesn't store actual ACB or asset allocation.

**Solution**: Add optional fields to Asset model for more accurate data.

**File**: `/prisma/schema.prisma`

**Add to Asset model**:
```prisma
model Asset {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  type        String   // TFSA, RRSP, RRIF, Non-Registered, Corporate
  institution String?
  accountNumber String?
  balance     Float

  // NEW: Asset allocation fields
  cashPercentage      Float? // % in cash (0-100)
  gicPercentage       Float?  // % in GICs (0-100)
  investPercentage    Float?  // % in investments (0-100)

  // NEW: Tax basis for non-registered accounts
  adjustedCostBase    Float?  // ACB for capital gains calculation

  // NEW: Corporate account details
  rdtoh              Float?  // Refundable Dividend Tax On Hand
  cda                Float?  // Capital Dividend Account

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_asset_allocation_fields
```

**Update prefill logic** to use actual values when available:

**File**: `/app/api/simulation/prefill/route.ts`

```typescript
// Use actual values if available, otherwise use estimates
const personInput: PersonInput = {
  ...defaultPersonInput,
  name: user?.firstName || 'Me',
  start_age: age,

  // Account balances
  tfsa_balance: assetTotals.tfsa_balance,
  rrsp_balance: assetTotals.rrsp_balance,
  rrif_balance: assetTotals.rrif_balance,
  nonreg_balance: assetTotals.nonreg_balance,
  corporate_balance: assetTotals.corporate_balance,

  // Non-registered distribution - use actual if available
  nr_cash: assetTotals.nonreg_cash || assetTotals.nonreg_balance * 0.10,
  nr_gic: assetTotals.nonreg_gic || assetTotals.nonreg_balance * 0.20,
  nr_invest: assetTotals.nonreg_invest || assetTotals.nonreg_balance * 0.70,

  // ACB - use actual if available, otherwise estimate
  nonreg_acb: assetTotals.actual_acb || assetTotals.nonreg_balance * 0.80,

  // Corporate buckets - use actual if available
  corp_cash_bucket: assetTotals.corp_cash || assetTotals.corporate_balance * 0.05,
  corp_gic_bucket: assetTotals.corp_gic || assetTotals.corporate_balance * 0.10,
  corp_invest_bucket: assetTotals.corp_invest || assetTotals.corporate_balance * 0.85,

  // Corporate tax accounts
  rdtoh: assetTotals.rdtoh || 0,
};
```

---

### 3.2 Add Government Benefits to User Profile

**Problem**: Using default CPP/OAS values instead of actual entitlements.

**Solution**: Add fields to User model for government benefits.

**File**: `/prisma/schema.prisma`

**Add to User model**:
```prisma
model User {
  // ... existing fields ...

  // NEW: Government benefits
  estimatedCPP      Float?  // Monthly CPP amount
  cppStartAge       Int?    // Age to start CPP (60-70)
  estimatedOAS      Float?  // Monthly OAS amount
  oasStartAge       Int?    // Age to start OAS (65-70)

  // NEW: Additional income sources
  pensionIncome     Float?  // Monthly pension
  rentalIncome      Float?  // Monthly rental income
  otherIncome       Float?  // Other monthly income

  // ... rest of model ...
}
```

---

## Priority 4: Long-term Improvements (Week 3-4)

### 4.1 Create Interactive Value Adjustment UI

**Solution**: Add inline editing capability in the review section.

### 4.2 Add Confidence Scoring System

**Solution**: Calculate and display confidence score based on data quality.

```typescript
function calculateConfidenceScore(household: HouseholdInput, hasActualData: {
  hasActualACB: boolean;
  hasActualAllocation: boolean;
  hasActualCPP: boolean;
  hasActualOAS: boolean;
}): number {
  let score = 100;

  if (!hasActualData.hasActualACB && household.p1.nonreg_balance > 0) {
    score -= 15; // ACB is critical for tax calculations
  }

  if (!hasActualData.hasActualAllocation) {
    score -= 10; // Asset allocation affects returns
  }

  if (!hasActualData.hasActualCPP) {
    score -= 5; // CPP estimates are fairly accurate
  }

  if (!hasActualData.hasActualOAS) {
    score -= 5; // OAS is predictable
  }

  return Math.max(score, 0);
}
```

Display:
- 90-100: High Confidence (green)
- 75-89: Medium Confidence (yellow)
- <75: Low Confidence (orange/red)

### 4.3 Implement Scenario Comparison

**Solution**: Allow users to save and compare different scenarios side-by-side.

---

## Implementation Timeline

### Week 1: Critical Fixes
- **Day 1-2**: Investigate and fix 0.0% tax rate (Priority 1.1)
- **Day 3**: Add warning alerts (Priority 1.2)
- **Day 4-5**: Add review section (Priority 2.1)

### Week 2: Important Enhancements
- **Day 1-2**: Add auto-population indicators (Priority 2.2)
- **Day 3-5**: Create test suite (Priority 2.3)

### Week 3-4: Data Model Enhancements
- **Week 3**: Enhance Asset model (Priority 3.1)
- **Week 4**: Add government benefits fields (Priority 3.2)

### Future: Long-term Improvements
- Interactive editing
- Confidence scoring
- Scenario comparison

---

## Testing Strategy

### Manual Testing Checklist:

- [ ] Run simulation with all TFSA - verify 0% tax rate
- [ ] Run simulation with all RRSP - verify reasonable tax rate (15-25%)
- [ ] Run simulation with mixed accounts - verify proportional taxes
- [ ] Verify auto-population loads correct values
- [ ] Verify warnings display properly
- [ ] Verify review section shows all auto-populated values
- [ ] Test with missing profile data - verify graceful handling
- [ ] Test with zero balances - verify no division by zero errors

### Automated Testing:

- [ ] Unit tests for aggregation logic
- [ ] Unit tests for distribution calculations
- [ ] Integration tests for prefill API
- [ ] End-to-end tests for simulation flow
- [ ] Regression tests for tax calculations

---

## Success Criteria

### Must Have (P1):
✅ Effective tax rate displays correctly (not 0.0% when taxes paid)
✅ Users see warnings about estimated values
✅ Users can review auto-populated values before simulation

### Should Have (P2):
✅ Visual indicators show which values were auto-populated
✅ Automated tests validate calculation accuracy
✅ Test suite covers edge cases

### Nice to Have (P3):
✅ Database stores actual ACB and allocation data
✅ Users can enter CPP/OAS entitlements
✅ Confidence scoring system guides users

---

## Risk Assessment

### Low Risk:
- Adding warning messages (no logic changes)
- Adding review section (display only)
- Visual indicators (UI enhancement)

### Medium Risk:
- Database schema changes (requires migration)
- Test suite creation (may uncover existing bugs)

### High Risk:
- Fixing Python tax calculation (core logic change)
  - **Mitigation**: Comprehensive testing before deployment
  - **Fallback**: Ability to roll back to previous version

---

## Dependencies

- Python simulation engine source code access
- Database migration capability
- Test environment for validation
- User feedback on warnings and review UI

---

## Notes

- All percentage displays should show at least 1 decimal place
- Monetary values should use proper currency formatting
- Warnings should be prominent but not alarming
- Review section should be optional (collapsible)
- Auto-populated values should be editable

---

**Prepared by**: Claude Code
**Date**: 2025-12-07
**Status**: Ready for Review and Implementation
