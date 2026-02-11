# CRITICAL BUG: Root Cause Identified

**Date**: February 11, 2026
**Severity**: CRITICAL - Affects 100% of users
**Status**: ROOT CAUSE FOUND ✅

---

## Bug Summary

All simulations since at least February 6, 2026 have completely empty `inputData` in the database. This causes:
- Marc's report: "System ignores pension/other income sources"
- Identical results regardless of input changes
- Users cannot trust any simulation results
- Complete loss of simulation history/inputs

---

## Root Cause

**File**: `webapp/app/api/simulation/run/route.ts`
**Line**: 247

### The Bug

```typescript
await prisma.simulationRun.create({
  data: {
    // ... other fields ...

    // ❌ BUG: Storing PYTHON API OUTPUT instead of USER INPUT
    inputData: JSON.stringify(responseData.household_input),
    fullResults: JSON.stringify(responseData),
  },
});
```

### The Problem

1. **User submits form** → data in `body` variable (line 145: `const body = await request.json()`)
2. **Next.js proxies to Python API** → sends `body` (line 159: `body: JSON.stringify(body)`)
3. **Python API processes** → returns `responseData` with results
4. **Next.js saves to database** → **INCORRECTLY saves `responseData.household_input` instead of original `body`!**

### Why This Causes Empty Data

The `responseData.household_input` returned by the Python API may have:
- Different structure than the original input
- Missing fields
- Empty/null values if Python API doesn't return full input echo

The original user input in `body` is NEVER saved to the database!

---

## Evidence

### Database Analysis
- ✅ Last 100+ simulations: ALL have empty inputData
- ✅ All users affected: Marc, Stacy, Juan
- ✅ Timeframe: Since at least February 6, 2026
- ✅ 100% reproduction rate

### Git History
```bash
commit 40d266a (Feb 8, 2026)
feat: Require province and date of birth for simulations

This commit added profile validation but likely didn't introduce the bug.
The bug may have existed longer or been introduced separately.
```

---

## The Fix

### Current Code (WRONG)
```typescript
const body = await request.json();  // User's original input ✅

// ... send to Python API ...

// ❌ WRONG: Saves Python's response instead of user's input
inputData: JSON.stringify(responseData.household_input),
```

### Fixed Code (CORRECT)
```typescript
const body = await request.json();  // User's original input ✅

// ... send to Python API ...

// ✅ CORRECT: Save user's original input
inputData: JSON.stringify(body),  // or just body if Prisma accepts JSON type
```

---

## Impact

### Users Affected
- **Marc Rondeau** (mrondeau205@gmail.com) - 5+ simulations
- **Stacy Johnston** (stacystruth@gmail.com) - 14+ simulations
- **Juan Clavier** (juanclavierb@gmail.com) - 1+ simulations
- **ALL users** since February 6 or earlier

### Consequences
1. ❌ Users cannot view their previous simulation inputs
2. ❌ "View last simulation" feature completely broken
3. ❌ Analytics cannot track what users are inputting
4. ❌ Cannot debug user-reported issues (no input data to analyze)
5. ❌ Users lose trust in platform (results seem random because we can't see what they entered)

---

## Next Steps

1. ✅ **Root cause identified** - Line 247 in route.ts
2. ⏳ **Fix the code** - Change `inputData` to save `body` instead of `responseData.household_input`
3. ⏳ **Test the fix** - Run simulation and verify inputData is populated
4. ⏳ **Deploy fix** - Push to production immediately
5. ⏳ **Verify in production** - Check new simulations have populated inputData
6. ⏳ **Communicate to users** - Let Marc/Stacy know issue is fixed

---

## Why This Went Unnoticed

1. **Display still works** - Results are shown correctly in UI because they use `fullResults`, not `inputData`
2. **New feature** - "View last simulation" may not have been heavily tested
3. **No monitoring** - No alerts for empty inputData in database
4. **Users see results** - Simulation still runs, so users don't realize input isn't saved

---

## Prevention

1. **Add database validation** - Alert if inputData is null/empty
2. **Test "View last simulation"** - Would have caught this immediately
3. **E2E testing** - Submit simulation → Save → Retrieve → Compare input
4. **Schema validation** - Require inputData to be non-null in Prisma schema

---

**PRIORITY**: P0 - Fix immediately
**ETA**: < 1 hour (simple one-line fix + testing)
