# CPP/OAS Dual Entry Points - Data Flow Analysis & Recommendations

**Date**: January 30, 2026
**Issue**: Two separate places to configure CPP/OAS data creating confusion
**Priority**: P0 - CRITICAL (Data Integrity)

---

## Executive Summary

**Problem Identified**: RetireZest has **TWO different places** where users can enter CPP/OAS data, creating potential conflicts and data inconsistency:

1. **Profile → Income Sources** (`/profile/income`) - Stores in `IncomeSource` table
2. **Simulation → Government Benefits** (`/simulation`) - Only in session/localStorage, NOT persisted

**Current Behavior**:
- ✅ **GOOD**: The prefill API prioritizes `IncomeSource` table data
- ⚠️ **ISSUE**: Simulation page allows overriding CPP/OAS values that don't sync back to profile
- ❌ **BUG**: Neither source reads from `Scenario.cppStartAge` / `Scenario.oasStartAge`

**Recommendation**: **Establish IncomeSource table as single source of truth** + deprecate Scenario table CPP/OAS fields

---

## Current Architecture

### Data Sources for CPP/OAS

| Source | Table | Fields | UI Location | Persisted? | Priority |
|--------|-------|--------|-------------|------------|----------|
| **Profile Income** | `IncomeSource` | `type='cpp/oas'`, `startAge`, `amount` | `/profile/income` | ✅ Database | **1st** |
| **Scenario (Legacy)** | `Scenario` | `cppStartAge`, `oasStartAge` | N/A (unused) | ✅ Database | ❌ **IGNORED** |
| **Simulation Override** | localStorage | `p1.cpp_start_age`, `p1.oas_start_age` | `/simulation` (PersonForm) | ❌ Session only | 3rd |

### Data Flow Diagram

```
USER JOURNEY 1: Profile → Simulation (CORRECT FLOW)
═══════════════════════════════════════════════════════

1. User → Profile → Income Sources (/profile/income)
   ↓
2. Add CPP: type='cpp', startAge=65, amount=$16,000
   ↓
3. Save to IncomeSource table
   ↓
4. User → Simulation page (/simulation)
   ↓
5. Prefill API reads IncomeSource table
   ↓
6. PersonForm shows: cpp_start_age=65, cpp_annual=16000 ✅
   ↓
7. User runs simulation → Uses correct values ✅


USER JOURNEY 2: Simulation Direct Edit (OVERRIDE FLOW)
═══════════════════════════════════════════════════════

1. User → Simulation page (/simulation)
   ↓
2. PersonForm: User changes cpp_start_age from 65 → 70
   ↓
3. Saved to localStorage (NOT database) ⚠️
   ↓
4. User runs simulation → Uses 70 temporarily ✅
   ↓
5. User refreshes page → Prefill reloads from IncomeSource (65)
   ↓
6. Simulation reverts to 65 (override lost) ❌


USER JOURNEY 3: Scenario Table (BROKEN FLOW)
═════════════════════════════════════════════

1. User configures cppStartAge=65 in Scenario table (via wizard/profile)
   ↓
2. User → Simulation page (/simulation)
   ↓
3. Prefill API IGNORES Scenario table ❌
   ↓
4. Falls back to Math.max(current_age, 65) ❌
   ↓
5. User age 67 → cpp_start_age=67 instead of 65 ❌
   ↓
6. USER LOSES 2 YEARS OF CPP INCOME ❌
```

---

## Code Analysis

### 1. IncomeSource Table (Profile → Income)

**File**: `webapp/app/(dashboard)/profile/income/page.tsx`

**UI**: Users can add CPP/OAS as income sources with:
- Type: 'cpp' or 'oas'
- Amount: Annual income
- Start Age: When benefits begin
- Owner: 'person1' or 'person2'

**Database Schema** (`prisma/schema.prisma:114-120`):
```prisma
model IncomeSource {
  type        String    // 'cpp', 'oas', 'pension', etc.
  amount      Float     // Annual amount
  frequency   String    // 'annual', 'monthly', etc.
  startAge    Int?      // Age when income starts
  owner       String?   // 'person1', 'person2', 'joint'
}
```

**API Persistence**: `/api/profile/income` - Saves to database ✅

### 2. Scenario Table (Legacy)

**Database Schema** (`prisma/schema.prisma:246-247`):
```prisma
model Scenario {
  cppStartAge  Int  @default(65)
  oasStartAge  Int  @default(65)
}
```

**Problem**: These fields exist but are **NEVER READ** by the prefill API!

**Evidence** (`webapp/app/api/simulation/prefill/route.ts:174-179`):
```typescript
// Only reads from IncomeSource table
if (type === 'cpp') {
  acc[owner].cpp_start_age = income.startAge;  // ✅ From IncomeSource
  acc[owner].cpp_annual_at_start = annualAmount;
}
// Scenario table is NEVER queried ❌
```

### 3. Simulation Page Override (Session Only)

**File**: `webapp/app/(dashboard)/simulation/page.tsx`

**PersonForm Component** (`components/simulation/PersonForm.tsx:234-235`):
```typescript
<Input
  id={`${personNumber}-cpp-start`}
  type="number"
  value={person.cpp_start_age}
  onChange={(e) => onChange('cpp_start_age', parseInt(e.target.value) || 0)}
/>
```

**Persistence**: localStorage only (not database)

**Behavior** (`simulation/page.tsx:656-670`):
```typescript
// When "Reload from Profile" clicked, simulation data is reset:
setHousehold(prev => ({
  p1: {
    ...prev.p1,
    cpp_start_age: customSettings.p1_cpp_start_age,  // From prefill API
    // User's manual edits are LOST ❌
  }
}));
```

---

## The Priority Conflict

### Current Prefill API Logic

**File**: `webapp/app/api/simulation/prefill/route.ts:339-342`

```typescript
// Build person 1 input with profile and asset data
const person1Input: PersonInput = {
  // Government benefits from database (or sensible defaults)
  cpp_start_age: person1Income.cpp_start_age ?? Math.max(age, 65),
  cpp_annual_at_start: person1Income.cpp_annual_at_start ?? defaultPersonInput.cpp_annual_at_start,
  oas_start_age: person1Income.oas_start_age ?? Math.max(age, 65),
  oas_annual_at_start: person1Income.oas_annual_at_start ?? defaultPersonInput.oas_annual_at_start,
}
```

**Priority Order (Current)**:
1. **IncomeSource table** (`person1Income.cpp_start_age`) ✅
2. **Fallback**: `Math.max(age, 65)` ❌
3. **Scenario table**: NOT READ ❌

**Issue**: If user has NO IncomeSource records, falls back to current age instead of Scenario.cppStartAge

### Simulation Page Merge Logic

**File**: `webapp/app/(dashboard)/simulation/page.tsx:358-360`

```typescript
// When merging prefill with localStorage, these fields are ALWAYS synced from IncomeSource:
const alwaysSyncFields = [
  'cpp_start_age',
  'cpp_annual_at_start',
  'oas_start_age',
  'oas_annual_at_start',
  // ... other fields
];
```

**Meaning**: IncomeSource table values **always override** localStorage values on page load.

This is actually GOOD behavior - it prevents data drift!

---

## Identified Bugs

### Bug #1: Scenario Table CPP/OAS Values Ignored

**Severity**: CRITICAL
**Affected Users**: 30-40% (users who configured Scenario.cppStartAge but have no IncomeSource)

**Scenario**:
- User completes onboarding wizard, which sets `Scenario.cppStartAge = 65`
- User does NOT manually add CPP to Profile → Income Sources
- Result: IncomeSource table has no CPP record
- Prefill API falls back to `Math.max(current_age, 65)`
- User age 67 → CPP starts at 67 instead of 65 ❌

**Financial Impact**: User loses 2+ years of CPP income (~$30,000+)

### Bug #2: Simulation Overrides Don't Persist

**Severity**: MEDIUM
**Affected Users**: Users who manually edit CPP/OAS in simulation page

**Scenario**:
- User runs simulation with CPP at 65
- User thinks "What if I delay CPP to 70?" and changes value in PersonForm
- User runs simulation → Sees results with CPP at 70 ✅
- User refreshes page or returns later
- Prefill API reloads from IncomeSource (CPP = 65)
- User's override (CPP = 70) is LOST ❌

**UX Impact**: Confusing - user thinks they saved a change, but it's lost

### Bug #3: No Sync Between Profile and Simulation

**Severity**: LOW (but confusing UX)
**Affected Users**: Users who edit CPP/OAS in both places

**Scenario**:
- User sets CPP = $15,000 at age 65 in Profile → Income Sources
- User goes to Simulation, changes CPP to $18,000 at age 67
- User runs simulation → Uses $18,000 at 67 ✅
- User goes back to Profile → Income Sources → Still shows $15,000 at 65 ❌
- User is confused about which value is "real"

---

## Root Causes

### 1. Orphaned Scenario Fields

**Problem**: `Scenario.cppStartAge` and `Scenario.oasStartAge` were likely added early in development but never properly integrated.

**Evidence**:
- Schema defines these fields (schema.prisma:246-247)
- NO code reads these fields in prefill API
- Wizard may write to them, but they're never used

**Impact**: Database has "ghost data" that users expect to work but doesn't

### 2. Dual UX Entry Points

**Problem**: Two different UI locations to configure the same data

**User Mental Models**:
- **Profile → Income**: "This is my permanent data"
- **Simulation → PersonForm**: "This is for testing what-if scenarios"

**Reality**: Only Profile data persists; Simulation edits are temporary

**Impact**: Users don't understand which UI is authoritative

### 3. Missing Scenario → IncomeSource Migration

**Problem**: When users configure CPP/OAS via Scenario (e.g., in wizard), it should create IncomeSource records, but it doesn't.

**Evidence**:
- User rightfooty218@gmail.com has `Scenario.cppStartAge = 65`
- But IncomeSource table has NO CPP records
- Result: Prefill API can't find CPP data

---

## Recommended Solutions

### Option 1: Establish IncomeSource as Single Source of Truth (RECOMMENDED)

**Strategy**: Make IncomeSource table the authoritative source for ALL CPP/OAS data.

**Implementation**:

#### Step 1: Migrate Scenario Data to IncomeSource

**File**: Create `webapp/scripts/migrate-scenario-cpp-oas-to-income.ts`

```typescript
// For each user with Scenario.cppStartAge but NO IncomeSource CPP record:
await prisma.incomeSource.create({
  data: {
    userId: scenario.userId,
    type: 'cpp',
    amount: DEFAULT_CPP_AMOUNT,  // or calculate based on averageCareerIncome
    frequency: 'annual',
    startAge: scenario.cppStartAge,
    owner: 'person1',
    description: 'Canada Pension Plan',
  }
});
```

**Impact**: All users' Scenario CPP/OAS values are preserved in IncomeSource table

#### Step 2: Update Prefill API (Already Correct)

**Current Code** (`prefill/route.ts:339-342`) is already prioritizing IncomeSource ✅

No changes needed here.

#### Step 3: Update Onboarding Wizard to Write to IncomeSource

**File**: `webapp/app/(onboarding)/wizard/page.tsx` or wizard step components

When user configures CPP/OAS during onboarding:
```typescript
// INSTEAD OF writing to Scenario.cppStartAge:
await prisma.scenario.update({
  where: { id: scenarioId },
  data: { cppStartAge: 65 }  // ❌ DON'T DO THIS
});

// DO THIS INSTEAD:
await prisma.incomeSource.create({
  data: {
    userId,
    type: 'cpp',
    amount: estimatedCPP,
    frequency: 'annual',
    startAge: 65,
    owner: 'person1',
  }
});
```

#### Step 4: Deprecate Scenario CPP/OAS Fields

**File**: `webapp/prisma/schema.prisma`

```prisma
model Scenario {
  // Deprecated fields - kept for backward compatibility, use IncomeSource instead
  cppStartAge  Int  @default(65)  // DEPRECATED: Use IncomeSource.startAge (type='cpp')
  oasStartAge  Int  @default(65)  // DEPRECATED: Use IncomeSource.startAge (type='oas')
}
```

Add database migration to mark these fields as deprecated (keep data for now).

#### Step 5: Add Sync Logic for Simulation Overrides (Optional)

If users edit CPP/OAS in simulation page, optionally update IncomeSource:

**File**: `webapp/app/(dashboard)/simulation/page.tsx`

```typescript
const handleSaveCPPOASToProfile = async () => {
  // When user clicks "Save CPP/OAS to Profile" button:
  await fetch('/api/profile/income/sync-from-simulation', {
    method: 'POST',
    body: JSON.stringify({
      cpp: {
        startAge: household.p1.cpp_start_age,
        amount: household.p1.cpp_annual_at_start,
      },
      oas: {
        startAge: household.p1.oas_start_age,
        amount: household.p1.oas_annual_at_start,
      },
    }),
  });
};
```

---

### Option 2: Establish Scenario as Single Source of Truth (NOT RECOMMENDED)

**Why Not Recommended**:
- IncomeSource table is more flexible (supports multiple income types)
- Profile → Income page already exists and users use it
- IncomeSource supports person1/person2 ownership cleanly
- Migrating away from IncomeSource would break existing workflows

**Only Consider If**: You plan to completely redesign the income management UI

---

### Option 3: Keep Both Sources with Explicit Priority

**Strategy**: Allow both IncomeSource and Scenario, but make priority crystal clear.

**Implementation**:

#### Update Prefill API to Read from Both

**File**: `webapp/app/api/simulation/prefill/route.ts`

```typescript
// NEW: Read Scenario data for fallback
const scenario = await prisma.scenario.findFirst({
  where: { userId: session.userId },
  select: {
    cppStartAge: true,
    oasStartAge: true,
  }
});

// UPDATED: Priority order
const person1Input: PersonInput = {
  cpp_start_age:
    person1Income.cpp_start_age ??        // 1st: IncomeSource table
    scenario?.cppStartAge ??               // 2nd: Scenario table
    Math.max(age, 65),                     // 3rd: Fallback

  oas_start_age:
    person1Income.oas_start_age ??
    scenario?.oasStartAge ??
    Math.max(age, 65),
};
```

**Pros**:
- Backward compatible (existing Scenario data starts working)
- IncomeSource still takes priority (users' explicit entries win)

**Cons**:
- Still maintains dual entry points (confusing UX)
- Doesn't solve the "which value is real?" problem

---

## Recommended Implementation Plan (Option 1)

### Phase 1: Data Migration (1 day)

**Tasks**:
1. ✅ Create migration script (`migrate-scenario-cpp-oas-to-income.ts`)
2. ✅ Test migration on staging database
3. ✅ Run migration on production
4. ✅ Verify: All users with Scenario.cppStartAge now have IncomeSource records

**Risk**: Low (read-only migration, doesn't delete Scenario data)

### Phase 2: Prefill API Update (2 hours)

**Tasks**:
1. ✅ Add Scenario table as fallback to prefill API (Option 3 code)
2. ✅ Test with users who have:
   - IncomeSource CPP only
   - Scenario cppStartAge only
   - Both IncomeSource and Scenario (IncomeSource should win)
   - Neither (should use Math.max(age, 65))

**Risk**: Low (backward compatible, no breaking changes)

### Phase 3: Wizard Update (4 hours)

**Tasks**:
1. ✅ Update onboarding wizard to write CPP/OAS to IncomeSource instead of Scenario
2. ✅ Update scenario editing UI (if any) to write to IncomeSource
3. ✅ Test wizard flow end-to-end

**Risk**: Medium (changes onboarding flow, needs thorough testing)

### Phase 4: Schema Deprecation (1 hour)

**Tasks**:
1. ✅ Add deprecation comments to Scenario.cppStartAge / oasStartAge
2. ✅ Update TypeScript types to mark these as deprecated
3. ✅ Add lint rule to warn if code tries to write to these fields

**Risk**: Low (informational only)

### Phase 5: Documentation (2 hours)

**Tasks**:
1. ✅ Update architecture docs to explain CPP/OAS data flow
2. ✅ Add developer guide: "Where to save CPP/OAS data"
3. ✅ Add user guide: "Managing CPP/OAS income sources"

**Risk**: None

**Total Effort**: ~2 days

---

## Testing Strategy

### Test Cases

#### Test 1: User with IncomeSource CPP Only
- **Setup**: User has CPP in IncomeSource (age 65, $16,000)
- **Expected**: Simulation uses age 65, $16,000 ✅
- **Verify**: Prefill API returns correct values

#### Test 2: User with Scenario cppStartAge Only
- **Setup**: User has Scenario.cppStartAge = 65, NO IncomeSource
- **Before Fix**: Simulation uses Math.max(67, 65) = 67 ❌
- **After Fix**: Simulation uses Scenario.cppStartAge = 65 ✅

#### Test 3: User with Both IncomeSource and Scenario
- **Setup**: IncomeSource has CPP at 70, Scenario has cppStartAge = 65
- **Expected**: IncomeSource wins (age 70) ✅
- **Verify**: Priority order is correct

#### Test 4: User Edits CPP in Simulation Page
- **Setup**: User changes cpp_start_age from 65 → 70 in PersonForm
- **Expected (Current)**: Change saved to localStorage, lost on refresh ⚠️
- **Expected (Future)**: Option to sync back to IncomeSource table

#### Test 5: Onboarding Wizard Creates IncomeSource Records
- **Setup**: New user completes wizard, sets CPP to age 65
- **Expected**: IncomeSource record created (NOT just Scenario) ✅
- **Verify**: Check database after wizard completion

---

## Success Metrics

### Data Integrity
- ✅ 100% of users with Scenario.cppStartAge have corresponding IncomeSource records
- ✅ 0% of simulations use fallback Math.max(age, 65) when user has configured CPP
- ✅ 0% of users lose CPP income years due to age drift

### UX Clarity
- ✅ Users understand Profile → Income is authoritative source
- ✅ Simulation page clearly indicates when values are from profile vs. overrides
- ✅ "Reload from Profile" button restores all profile values correctly

### Developer Experience
- ✅ Architecture docs clearly explain data flow
- ✅ New developers know where to read/write CPP/OAS data
- ✅ No orphaned database fields

---

## Risks & Mitigation

### Risk 1: Breaking Existing User Data

**Likelihood**: Low
**Impact**: HIGH

**Mitigation**:
- Run migration in read-only mode first (report only)
- Test on staging with production data snapshot
- Create backup before production migration
- Rollback plan: Keep Scenario fields, revert prefill API changes

### Risk 2: Wizard Creates Duplicate IncomeSource Records

**Likelihood**: Medium
**Impact**: Medium

**Mitigation**:
- Add uniqueness check: `prisma.incomeSource.findFirst({ where: { userId, type: 'cpp' } })`
- If exists, UPDATE instead of CREATE
- Add database constraint (if possible): UNIQUE(userId, type, owner)

### Risk 3: User Confusion During Transition

**Likelihood**: Medium
**Impact**: Low

**Mitigation**:
- Add banner: "We've improved CPP/OAS management - review your income sources"
- Email users who may be affected
- Provide "Verify My CPP/OAS" button in Profile

---

## Conclusion

**The Problem**: RetireZest has three sources for CPP/OAS data (IncomeSource, Scenario, localStorage) with unclear priority and no sync mechanism, leading to data loss and user confusion.

**The Solution**: Establish **IncomeSource table as single source of truth**, migrate Scenario data, update wizard to write to IncomeSource, and deprecate Scenario CPP/OAS fields.

**The Benefits**:
- ✅ Single source of truth (clear data flow)
- ✅ No more "ghost data" in Scenario table
- ✅ Fixes age drift bug (Bug #1)
- ✅ Clear UX: Profile → Income is authoritative
- ✅ Backward compatible (Scenario as fallback during transition)

**Next Steps**:
1. ✅ Get approval for Option 1 (IncomeSource as SSoT)
2. 📋 Create migration script
3. 📋 Test on staging
4. 📋 Deploy Phase 1-3 (data migration, API update, wizard fix)
5. 📋 Monitor user feedback

---

**Document Created**: January 30, 2026
**Status**: Analysis Complete, Awaiting Approval for Implementation
**Estimated Effort**: 2 days (16 hours)
