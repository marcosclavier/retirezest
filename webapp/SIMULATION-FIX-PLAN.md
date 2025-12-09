# Simulation Data Mapping Fix Plan

**Date**: 2025-12-07
**Status**: Draft
**Priority**: HIGH

---

## Executive Summary

Two critical data mapping issues discovered in Year 2026 simulation test:

1. **Corporate Account Not Used**: $2.36M corporate account ignored by simulation engine
2. **CPP/OAS Missing**: Government benefits ($21k/year) not passed to simulation

Both issues stem from **parameter name mismatches** between Next.js frontend and Python API.

---

## Issue #1: Corporate Account Data Mapping

### Problem

**Symptoms**:
- Corporate balance shows as $0 in all years
- Withdrawals come from Non-Reg instead of Corporate
- Strategy order not followed (using Non-Reg first instead of Corporate first)

**Root Cause**:

The TypeScript `PersonInput` interface defines TWO ways to specify corporate balance:

```typescript
// From lib/types/simulation.ts lines 22, 45-48
export interface PersonInput {
  corporate_balance: number;      // ← Legacy field

  corp_cash_bucket: number;       // ← Bucket-based fields
  corp_gic_bucket: number;
  corp_invest_bucket: number;
}
```

**Test script sends**:
```json
{
  "corp_cash_bucket": 118000,
  "corp_gic_bucket": 236000,
  "corp_invest_bucket": 2006000,
  "corp_rdtoh": 0
}
```

**Python API receives** (confirmed in /tmp/sim-result.json):
```json
{
  "corporate_balance": 0,           // ← ZERO!
  "corp_cash_bucket": 118000,
  "corp_gic_bucket": 236000,
  "corp_invest_bucket": 2006000
}
```

**Impact**:
- Python simulation engine checks `corporate_balance` for withdrawal logic
- Bucket fields are received but NOT used in total balance calculation
- Engine thinks there's $0 corporate, skips to next account type

---

## Issue #2: CPP/OAS Data Mapping

### Problem

**Symptoms**:
- CPP shows as $0 (expected $13,855)
- OAS shows as $0 (expected $7,362)
- Tax rate too low (0.69% vs expected 4-6%)

**Root Cause**:

TypeScript types use different field names than test script:

**TypeScript types** (lib/types/simulation.ts lines 11-15):
```typescript
export interface PersonInput {
  cpp_start_age: number;
  cpp_annual_at_start: number;      // ← API expects this
  oas_start_age: number;
  oas_annual_at_start: number;      // ← API expects this
}
```

**Test script sends** (scripts/test-simulation-2026.ts):
```json
{
  "cpp_amount": 13855,              // ← Wrong field name
  "cpp_start_age": 65,
  "oas_amount": 7362,               // ← Wrong field name
  "oas_start_age": 65
}
```

**Python API receives**:
```json
{
  "cpp_annual_at_start": 0,         // ← ZERO!
  "oas_annual_at_start": 0          // ← ZERO!
}
```

---

## Root Cause Analysis

### Why This Happened

1. **Test script was created manually** without referencing TypeScript types
2. **Field names guessed** based on intuition (cpp_amount vs cpp_annual_at_start)
3. **No TypeScript validation** on test data (script uses `any` types)
4. **API silently accepts** missing fields and defaults them to 0

### Why It Wasn't Caught

1. Test script runs outside of Next.js (via tsx directly)
2. No compile-time type checking on test data
3. API doesn't return validation errors for missing required fields
4. Simulation completes "successfully" with zeroed values

---

## Fix Plan

### Phase 1: Immediate Fixes (Test Scripts)

**Priority**: HIGH
**Effort**: 1 hour
**Files**: 2 files

#### 1.1 Fix test-simulation-2026-direct.ts

**File**: `scripts/test-simulation-2026-direct.ts`

**Changes Needed**:

```typescript
// BEFORE (lines 40-45)
const p1Data = {
  cpp_amount: 13855,          // ❌ Wrong
  oas_amount: 7362,           // ❌ Wrong
  corp_cash_bucket: 118000,   // ⚠️ Incomplete
  corp_gic_bucket: 236000,
  corp_invest_bucket: 2006000,
};

// AFTER
const p1Data: PersonInput = {  // ← Add type annotation
  // CPP/OAS - Use correct field names
  cpp_start_age: 65,
  cpp_annual_at_start: 13855,  // ✅ Correct
  oas_start_age: 65,
  oas_annual_at_start: 7362,   // ✅ Correct

  // Corporate - Set BOTH legacy and bucket fields
  corporate_balance: 2360000,  // ✅ Add legacy field
  corp_cash_bucket: 118000,
  corp_gic_bucket: 236000,
  corp_invest_bucket: 2006000,
  corp_rdtoh: 0,

  // Non-registered - Set BOTH legacy and bucket fields
  nonreg_balance: 830000,      // ✅ Add legacy field
  nr_cash: 83000,
  nr_gic: 166000,
  nr_invest: 581000,
  nonreg_acb: 664000,

  // ... all other required PersonInput fields
};
```

#### 1.2 Fix test-simulation-2026.ts

**File**: `scripts/test-simulation-2026.ts`

Same changes as above - ensure TypeScript type compliance.

**Verification**:
```bash
cd webapp
npx tsx scripts/test-simulation-2026-direct.ts
# Should now show:
# - Corporate withdrawals > 0
# - CPP/OAS in results
# - Tax rate 4-6%
```

---

### Phase 2: API Route Investigation (Next.js)

**Priority**: HIGH
**Effort**: 2 hours
**Files**: 1-2 files

#### 2.1 Check Next.js Simulation API Route

**File**: `app/api/simulation/run/route.ts` (if exists)

**Questions to Answer**:
1. Does the Next.js API route properly map corporate buckets to `corporate_balance`?
2. Does it calculate total: `corporate_balance = corp_cash + corp_gic + corp_invest`?
3. Does it map CPP/OAS correctly from form data?

**Action**:
```bash
# Find the API route
find webapp/app/api -name "*simulation*" -o -name "*run*"

# Search for corporate_balance calculation
grep -r "corporate_balance.*corp_" webapp/app/api/
```

#### 2.2 Fix API Route if Needed

**Expected Logic**:
```typescript
// Calculate total corporate balance from buckets
const corporateBalance =
  (p1.corp_cash_bucket || 0) +
  (p1.corp_gic_bucket || 0) +
  (p1.corp_invest_bucket || 0);

// Calculate total non-reg balance from buckets
const nonregBalance =
  (p1.nr_cash || 0) +
  (p1.nr_gic || 0) +
  (p1.nr_invest || 0);

// Build Python API payload
const pythonPayload = {
  p1: {
    ...p1,
    corporate_balance: corporateBalance,  // ← Add calculated total
    nonreg_balance: nonregBalance,        // ← Add calculated total
    cpp_annual_at_start: p1.cpp_amount || p1.cpp_annual_at_start,
    oas_annual_at_start: p1.oas_amount || p1.oas_annual_at_start,
  }
};
```

---

### Phase 3: Python API Investigation

**Priority**: MEDIUM
**Effort**: 2 hours
**Files**: Python backend

#### 3.1 Check Python API Parameter Handling

**File**: Python API (likely `api/main.py` or similar)

**Questions**:
1. Does Python API prefer `corporate_balance` or bucket fields?
2. Does it auto-calculate `corporate_balance` from buckets?
3. Is there documentation on expected payload structure?

**Action**:
```bash
# Search Python API for corporate balance handling
cd /Users/jrcb/OpenAI\ Retirement
grep -r "corporate_balance\|corp_cash_bucket" . --include="*.py" | head -20
```

#### 3.2 Align TypeScript Types with Python API

**Goal**: Ensure TypeScript types match Python Pydantic models exactly

**Action**:
1. Find Python Pydantic model definition
2. Compare field names to TypeScript `PersonInput`
3. Update TypeScript types if needed
4. Document any required transformations

---

### Phase 4: Frontend Form Investigation

**Priority**: MEDIUM
**Effort**: 1 hour

#### 4.1 Check Form Data Submission

**File**: `app/(dashboard)/simulation/page.tsx`

**Questions**:
1. How does the form collect corporate account data?
2. Does it send buckets or total balance?
3. How does it collect CPP/OAS data?

**Action**:
Find form submission handler and trace data flow.

---

### Phase 5: Validation & Testing

**Priority**: HIGH
**Effort**: 2 hours

#### 5.1 Add TypeScript Validation

**Goal**: Prevent this issue from happening again

**Create**: `lib/validation/simulation.ts`

```typescript
import type { PersonInput, HouseholdInput } from '../types/simulation';

export function validatePersonInput(person: PersonInput): string[] {
  const errors: string[] = [];

  // Validate CPP/OAS
  if (person.cpp_annual_at_start === undefined) {
    errors.push('cpp_annual_at_start is required');
  }
  if (person.oas_annual_at_start === undefined) {
    errors.push('oas_annual_at_start is required');
  }

  // Validate corporate account - require EITHER legacy OR buckets
  const hasLegacyCorp = (person.corporate_balance || 0) > 0;
  const hasBucketCorp =
    (person.corp_cash_bucket || 0) +
    (person.corp_gic_bucket || 0) +
    (person.corp_invest_bucket || 0) > 0;

  if (!hasLegacyCorp && hasBucketCorp) {
    errors.push('Corporate buckets provided but corporate_balance is 0. Will auto-calculate.');
  }

  // Validate non-reg account
  const hasLegacyNonReg = (person.nonreg_balance || 0) > 0;
  const hasBucketNonReg =
    (person.nr_cash || 0) +
    (person.nr_gic || 0) +
    (person.nr_invest || 0) > 0;

  if (!hasLegacyNonReg && hasBucketNonReg) {
    errors.push('Non-reg buckets provided but nonreg_balance is 0. Will auto-calculate.');
  }

  return errors;
}

export function normalizePersonInput(person: PersonInput): PersonInput {
  return {
    ...person,

    // Auto-calculate corporate_balance from buckets if not set
    corporate_balance: person.corporate_balance ||
      (person.corp_cash_bucket || 0) +
      (person.corp_gic_bucket || 0) +
      (person.corp_invest_bucket || 0),

    // Auto-calculate nonreg_balance from buckets if not set
    nonreg_balance: person.nonreg_balance ||
      (person.nr_cash || 0) +
      (person.nr_gic || 0) +
      (person.nr_invest || 0),
  };
}
```

#### 5.2 Integration Tests

**Create**: `tests/simulation-api.test.ts`

Test cases:
1. ✅ Corporate balance calculated from buckets
2. ✅ Non-reg balance calculated from buckets
3. ✅ CPP/OAS passed correctly
4. ✅ Strategy order followed (Corp → RRIF → NonReg → TFSA)
5. ✅ Tax calculation includes government benefits

#### 5.3 End-to-End Test

**Test Scenario**: 2026 simulation with full portfolio

**Expected Results**:
- Corporate withdrawals: $40,000-60,000 (NOT $0)
- Non-Reg withdrawals: $0-20,000 (NOT $60,000+)
- CPP income: $13,855
- OAS income: $7,362
- Tax rate: 4-6% (NOT 0.69%)

---

## Implementation Order

### Day 1: Quick Wins
1. ✅ Fix test-simulation-2026-direct.ts (30 min)
2. ✅ Run test and verify corporate/CPP/OAS (15 min)
3. ✅ Fix test-simulation-2026.ts (30 min)
4. ✅ Document findings (30 min)

### Day 2: API Investigation
5. ⏳ Find and review Next.js API route (1 hour)
6. ⏳ Find and review Python API handler (1 hour)
7. ⏳ Create field mapping documentation (1 hour)

### Day 3: Permanent Fixes
8. ⏳ Implement API route fixes (2 hours)
9. ⏳ Add validation helpers (1 hour)
10. ⏳ Create integration tests (2 hours)

### Day 4: Testing & Verification
11. ⏳ Manual web UI testing (1 hour)
12. ⏳ Regression testing (1 hour)
13. ⏳ Update documentation (1 hour)

---

## Success Criteria

### Must Have (Blocking Issues)
- [ ] Corporate account balance recognized by simulation
- [ ] Corporate withdrawals appear in results
- [ ] CPP/OAS income passed to simulation
- [ ] Tax calculation includes government benefits
- [ ] Strategy order followed correctly

### Should Have (Quality Improvements)
- [ ] TypeScript validation prevents bad data
- [ ] Integration tests catch regressions
- [ ] Field mapping documented
- [ ] API route auto-calculates totals from buckets

### Nice to Have (Future Enhancements)
- [ ] Real-time validation in web form
- [ ] API returns validation errors
- [ ] Comprehensive test suite
- [ ] OpenAPI/Swagger documentation

---

## Risk Assessment

### High Risk
1. **Breaking Changes**: Modifying API contracts could break existing functionality
2. **Python API Changes**: May require backend code changes outside our control

### Medium Risk
1. **Form Data Impact**: Changes might affect how users enter data
2. **Test Coverage**: Need to ensure we don't break other parts of the app

### Low Risk
1. **Test Script Fixes**: Isolated to test files only
2. **Documentation**: No code impact

---

## Rollback Plan

If fixes cause issues:

1. **Revert test scripts** to original versions
2. **Keep validation layer optional** (warnings, not errors)
3. **Feature flag** for bucket-to-total calculation
4. **Gradual rollout** with manual testing at each step

---

## Questions for User

Before proceeding:

1. ❓ Do you have access to the Python API source code?
2. ❓ Is there existing documentation for the Python API payload structure?
3. ❓ Should we prioritize fixing test scripts OR the Next.js API route?
4. ❓ Are there existing users who might be affected by API changes?

---

## Next Steps

**Immediate**:
1. Fix test-simulation-2026-direct.ts with correct field names
2. Run test and validate results
3. Report findings to user

**Short-term** (this week):
4. Investigate Next.js API route
5. Create field mapping documentation
6. Implement validation helpers

**Long-term** (next sprint):
7. Add integration tests
8. Update documentation
9. Consider API v2 with cleaner contracts

---

**Created by**: Claude Code
**Last Updated**: 2025-12-07
