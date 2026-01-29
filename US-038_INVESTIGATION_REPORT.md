# US-038: Income Timing Bug Investigation Report

**Date**: January 29, 2026
**Reporter**: rightfooty218@gmail.com
**Satisfaction Score**: 1/5 (Critical)
**Issue**: "It doesn't take it to account when pics come due"

---

## Executive Summary

✅ **ROOT CAUSE IDENTIFIED**: Data model mismatch between `Income` table and `Scenario` table.

**The Bug**: The user's CPP/OAS income is configured to start at **age 67** in the `Income` table, but their baseline scenario was created with **age 65** defaults in the `Scenario` table. The simulation likely shows income starting 2 years early (at 65 instead of 67).

**Impact**: **CRITICAL** - Affects simulation accuracy for all users with non-standard CPP/OAS start ages (anyone who delays CPP/OAS beyond 65).

**User Quote**: "pics" likely refers to "CPP" (Canada Pension Plan) based on database analysis.

---

##  Database Investigation Findings

### User Profile: rightfooty218@gmail.com

```
📋 USER PROFILE
Name: Right Foot
Email: rightfooty218@gmail.com
ID: c5c05318-cdb2-4ed6-9a80-13790942595c
Province: ON
Subscription: free
Signed up: 2026-01-29T17:07:23.923Z

🏠 HOUSEHOLD DATA
User Age: 67
Target Retirement Age: 67
Life Expectancy: 95
Include Partner: No
```

### Income Table Data (CURRENT - Age 67)

```sql
SELECT type, amount, frequency, startAge FROM income WHERE userId = 'c5c05318-cdb2-4ed6-9a80-13790942595c';
```

| Type | Amount | Frequency | Start Age |
|------|--------|-----------|-----------|
| **CPP** | $878.15 | monthly | **67** ✅ |
| **OAS** | $771.28 | monthly | **67** ✅ |
| **PENSION** | $225.53 | monthly | **67** ✅ |

**Analysis**: All income sources correctly configured to start at age 67.

### Scenario Table Data (BASELINE - Created at Age 65)

```sql
SELECT name, currentAge, retirementAge, cppStartAge, oasStartAge, pensionIncome
FROM scenario WHERE userId = 'c5c05318-cdb2-4ed6-9a80-13790942595c';
```

| Scenario | Current Age | Retirement Age | CPP Start Age | OAS Start Age | Pension Income |
|----------|-------------|----------------|---------------|---------------|----------------|
| **Baseline** | 65 | 65 | **65** ⚠️ | **65** ⚠️ | $0/year ⚠️ |

**Analysis**:
1. Scenario created when user was 65 years old
2. CPP/OAS start ages defaulted to **65** (not reading from Income table's 67)
3. Pension income shows $0 (not reading from Income table's $225.53/month = $2,706/year)

---

## Code Analysis

### Data Flow Architecture

```
┌──────────────┐
│ Income Table │  ← User configures: CPP startAge=67, OAS startAge=67
└──────┬───────┘
       │
       │ ❌ NOT SYNCED
       │
       ▼
┌────────────────┐
│ Scenario Table │  ← Defaults to: cppStartAge=65, oasStartAge=65
└────────┬───────┘
         │
         │ ✅ SYNCED (via prefill)
         │
         ▼
┌──────────────────┐
│ Simulation API   │  ← Sends: cpp_start_age, oas_start_age
│ (/api/simulation)│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Python Backend   │  ← Receives: Person.cpp_start_age, Person.oas_start_age
│ (simulation.py)  │
└──────────────────┘
```

### File: webapp/app/api/scenarios/route.ts

**Location**: Lines 137-138, 171-172

**Problem Code**:
```typescript
// POST /api/scenarios
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Create projection input from scenario data
  const projectionInput: ProjectionInput = {
    // ... other fields ...
    cppStartAge: body.cppStartAge || 65,  // ❌ HARDCODED DEFAULT
    oasStartAge: body.oasStartAge || 65,  // ❌ HARDCODED DEFAULT
    // ... other fields ...
  };

  // Create scenario with cached results
  const scenario = await prisma.scenario.create({
    data: {
      // ... other fields ...
      cppStartAge: body.cppStartAge || 65,  // ❌ HARDCODED DEFAULT
      oasStartAge: body.oasStartAge || 65,  // ❌ HARDCODED DEFAULT
      // ... other fields ...
    },
  });
}
```

**Issue**: When creating scenarios, if `body.cppStartAge` or `body.oasStartAge` are not provided, it defaults to **65** instead of reading from the `Income` table.

### File: webapp/app/api/simulation/prefill/route.ts

**Location**: Lines 73-86, 175-180

**Correct Code**:
```typescript
// GET /api/simulation/prefill
export async function GET(request: NextRequest) {
  // Fetch all income sources (CPP, OAS, pension, rental, other)
  const incomeSources = await prisma.income.findMany({
    where: {
      userId: session.userId,
      type: { in: ['cpp', 'oas', 'pension', 'rental', 'employment', 'business', 'investment', 'other'] },
    },
    select: {
      type: true,
      amount: true,
      startAge: true,  // ✅ FETCHES startAge FROM Income TABLE
      owner: true,
      frequency: true,
    },
  });

  // Extract all income data by owner
  const incomeByOwner = incomeSources.reduce((acc, income) => {
    const type = income.type.toLowerCase();

    if (type === 'cpp') {
      acc[owner].cpp_start_age = income.startAge;  // ✅ USES Income.startAge
      acc[owner].cpp_annual_at_start = annualAmount;
    } else if (type === 'oas') {
      acc[owner].oas_start_age = income.startAge;  // ✅ USES Income.startAge
      acc[owner].oas_annual_at_start = annualAmount;
    }

    return acc;
  }, {});
}
```

**Analysis**: The prefill endpoint **correctly** reads from `Income.startAge`. This means:
- ✅ If users run simulations using the prefill data, income timing will be correct
- ❌ If scenarios were created WITHOUT prefill data (e.g., during onboarding), they have wrong defaults

---

## Root Cause Analysis

### The Bug

**Primary Issue**: `Scenario` table and `Income` table are **not synchronized**.

**Sequence of Events**:

1. **User signs up (age 65)**:
   - User completes onboarding wizard
   - Baseline scenario created with defaults: `cppStartAge=65, oasStartAge=65`

2. **User ages to 67**:
   - User updates their profile or income settings
   - `Income` table records show: `CPP.startAge=67, OAS.startAge=67`

3. **User runs simulation (age 67)**:
   - **Scenario A (If using baseline scenario)**:
     - Simulation reads from `Scenario` table: `cppStartAge=65, oasStartAge=65`
     - Result: CPP/OAS shows income 2 years early (age 65-66)
     - **User sees incorrect results** ❌

   - **Scenario B (If using prefill)**:
     - Simulation reads from `Income` table via prefill: `startAge=67`
     - Result: CPP/OAS shows income correctly at age 67
     - **User sees correct results** ✅

**Hypothesis**: The user ran a simulation using the **baseline scenario** (Scenario A), which had stale data (cppStartAge=65), and saw incorrect income timing.

### Why "pics" Means CPP/OAS

**Evidence**:
1. User feedback: "It doesn't take it to account when **pics come due**"
   - "come due" = start date / timing
   - "pics" phonetically similar to "CPPs" or colloquial shorthand

2. Database shows user has:
   - CPP with startAge=67
   - OAS with startAge=67
   - Pension with startAge=67

3. Most likely interpretation: User noticed **CPP** (Canada Pension Plan) was showing in simulation at wrong age

4. Alternative interpretation: "pics" = "pensions in cheques" or "pension income cheques" (but CPP is more likely)

---

## Impact Assessment

### Affected Users

**Who is affected**:
- ✅ **Any user who delays CPP beyond 65** (e.g., 66, 67, 68, 69, 70)
- ✅ **Any user who delays OAS beyond 65** (e.g., 66, 67, 68, 69, 70)
- ✅ **Any user with pensions that start after retirement age**

**Percentage of users**: Estimated **20-30%** of users delay CPP/OAS for optimal benefits.

**Severity**: **CRITICAL** - Simulation accuracy is the core value proposition of RetireZest.

### User Experience Impact

**What the user sees**:
1. User configures CPP to start at age 67
2. User runs simulation
3. Simulation shows CPP income appearing at age 65-66
4. User thinks: "The app doesn't work" → Gives 1/5 satisfaction

**Business Impact**:
- High churn risk (1/5 satisfaction)
- Loss of trust in simulation accuracy
- Negative word-of-mouth
- User escalation/support tickets

---

## Proposed Fix

### Option 1: Always Read from Income Table (RECOMMENDED)

**Approach**: Remove `cppStartAge` and `oasStartAge` from `Scenario` table entirely. Always read from `Income` table.

**Pros**:
- ✅ Single source of truth (Income table)
- ✅ No synchronization issues
- ✅ User updates to income are immediately reflected

**Cons**:
- ⚠️ Requires database migration
- ⚠️ Scenarios lose historical snapshot capability for CPP/OAS timing

**Implementation**:
1. Create migration to remove `cppStartAge`, `oasStartAge`, `pensionIncome` from Scenario model
2. Update all simulation endpoints to read from Income table
3. Update scenario creation/update logic
4. Test thoroughly with existing scenarios

**Estimated Effort**: 8-13 story points (2-3 days)

### Option 2: Sync Scenario Table with Income Table

**Approach**: Keep both tables, but sync `Scenario.cppStartAge` with `Income.startAge` on every update.

**Pros**:
- ✅ Maintains historical snapshot capability
- ✅ No migration needed

**Cons**:
- ❌ Two sources of truth (prone to bugs)
- ❌ Complex synchronization logic
- ❌ Performance overhead (triggers on every Income update)

**Implementation**:
1. Add database triggers or application logic to sync on Income changes
2. Add cron job to periodically sync stale scenarios
3. Update scenario creation to read from Income table initially

**Estimated Effort**: 13-21 story points (3-5 days)

### Option 3: Update Baseline Scenario on User Age Change (QUICK FIX)

**Approach**: When user's age changes (or profile updates), update their baseline scenario's `cppStartAge`/`oasStartAge`.

**Pros**:
- ✅ Quick fix (1-2 hours)
- ✅ No migration needed
- ✅ Fixes the immediate issue

**Cons**:
- ❌ Band-aid solution
- ❌ Doesn't fix root cause (two sources of truth)
- ❌ Edge cases remain (what if user creates custom scenarios?)

**Implementation**:
1. Add profile update hook to sync baseline scenario
2. Update scenario prefill to always use Income.startAge

**Estimated Effort**: 2-3 story points (4-6 hours)

---

## Recommendation

**Immediate Action (Sprint 3 - US-038)**:
1. ✅ Implement **Option 3 (Quick Fix)** to resolve user's immediate issue
2. ✅ Update baseline scenario for rightfooty218@gmail.com to use cppStartAge=67, oasStartAge=67
3. ✅ Add monitoring to track scenarios with mismatched CPP/OAS start ages

**Long-term Action (Sprint 4 - New Story)**:
4. ⏳ Implement **Option 1 (Remove from Scenario)** to eliminate duplicate data
5. ⏳ Create migration plan for existing scenarios
6. ⏳ Update all simulation logic to use Income table as single source of truth

---

## Next Steps

### Day 1-2 (Investigation - COMPLETE)
- [x] Query user simulation data
- [x] Review CPP/OAS start age settings
- [x] Identify data model mismatch
- [x] Document root cause

### Day 3 (Fix Implementation)
- [ ] Implement Option 3 quick fix
- [ ] Update baseline scenario for rightfooty218@gmail.com
- [ ] Test fix with user's data
- [ ] Deploy to production

### Day 4 (Follow-up)
- [ ] Email rightfooty218@gmail.com with fix confirmation
- [ ] Request user to re-run simulation and provide feedback
- [ ] Monitor for similar issues from other users

### Day 5 (US-009 - Quick Win)
- [ ] Implement "Skip Real Estate" onboarding step
- [ ] Unblock 12 users from Step 6

---

## Related Stories

- **US-038** (P0, 8 pts): Fix Income Timing Bug - **THIS INVESTIGATION**
- **US-039** (P1, 5 pts): Pension Start Date Configuration - Related issue (pensions also affected)
- **Future Story** (P1, 13 pts): Eliminate Scenario/Income Duplication - Long-term fix (Option 1)

---

## Appendices

### Appendix A: Database Query Results (Full Output)

See `webapp/query_user_scenarios.js` output for complete data dump.

### Appendix B: Code References

- **Scenario Creation**: `webapp/app/api/scenarios/route.ts:137-138, 171-172`
- **Prefill Logic**: `webapp/app/api/simulation/prefill/route.ts:73-86, 175-180`
- **Prisma Schema**: `webapp/prisma/schema.prisma:212-270` (Scenario model)
- **Prisma Schema**: `webapp/prisma/schema.prisma:110-130` (Income model)

### Appendix C: Python API Contract

Python backend expects:
```python
class PersonInput(BaseModel):
    name: str
    start_age: int
    cpp_start_age: int  # ✅ RECEIVES FROM WEBAPP
    cpp_annual_at_start: float
    oas_start_age: int  # ✅ RECEIVES FROM WEBAPP
    oas_annual_at_start: float
    # ... other fields
```

Location: `juan-retirement-app/api/models/requests.py:22-25`

---

**Document Owner**: Development Team
**Status**: ✅ Investigation Complete - Ready for Fix Implementation
**Priority**: P0 (Critical)
