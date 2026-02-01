# Bug Fix: Government Benefits Not Persisting for Person 2

**Date**: February 1, 2026
**Bug ID**: Government Benefits for Person 2 Not Persisting in Simulation Input
**User Report**: "i updated government benefits in the simulation input and person 2 it is not persistent"
**Status**: ✅ FIXED

---

## Problem Summary

When users updated government benefits (CPP/OAS start ages and amounts) for Person 2 in the simulation input page, the values would not persist. They would be reset/overwritten shortly after being entered.

**User Impact**: Users could not customize government benefit assumptions for Person 2 in simulations, making it impossible to model scenarios where partners have different CPP/OAS start ages or amounts.

---

## Root Cause Analysis

### The Bug

The bug was in the `loadPrefillDataWithMerge` function (line 354-374) which is called when the page loads with existing localStorage data.

The problem was that government benefits fields were incorrectly included in the `assetFields` array:

```typescript
// BEFORE (WRONG):
const assetFields = [
  'tfsa_balance',
  'rrsp_balance',
  // ... other asset fields
  // Government benefits - always sync with Income Sources profile
  'cpp_start_age',           // ❌ Should NOT be here
  'cpp_annual_at_start',     // ❌ Should NOT be here
  'oas_start_age',           // ❌ Should NOT be here
  'oas_annual_at_start',     // ❌ Should NOT be here
];
```

These fields in the `assetFields` array are **always overwritten** with data from the database profile during the merge process, regardless of what the user types in the simulation page.

### How the Bug Manifested

1. User types CPP/OAS values for Person 2 in simulation page
2. `updatePerson('p2', field, value)` correctly updates the state
3. useEffect (line 157-161) saves to localStorage
4. On next render or component update, `loadPrefillDataWithMerge()` is called
5. The merge function overwrites Person 2's government benefits with database values
6. User sees their input disappear

### Why This Affected Person 2 More Than Person 1

The bug affected both Person 1 and Person 2, but was more noticeable for Person 2 because:
- Person 1's government benefits are often pre-filled from the user's profile (matching database)
- Person 2's government benefits might differ (spouse with different work history)
- Users are more likely to customize Person 2's values for "what-if" scenarios

---

## The Fix

### Code Changes

**File**: `webapp/app/(dashboard)/simulation/page.tsx`

```typescript
// AFTER (CORRECT):
// Asset balance fields that should ALWAYS come from the database
// NOTE: Government benefits are NOT included here so users can customize them in simulation
const assetFields = [
  'tfsa_balance',
  'rrsp_balance',
  'rrif_balance',
  'nonreg_balance',
  'corporate_balance',
  'tfsa_room_start',
  'nr_cash',
  'nr_gic',
  'nr_invest',
  'nonreg_acb',
  'corp_cash_bucket',
  'corp_gic_bucket',
  'corp_invest_bucket',
  // Government benefits removed - users can customize in simulation
];
```

### Why This Fix Works

By removing government benefits from `assetFields`:
1. Asset balances still come from the database (correct behavior)
2. Government benefits come from localStorage (user's custom values)
3. The `mergePerson` function preserves user's simulation customizations
4. Users can model different CPP/OAS scenarios in simulations

---

## Testing Verification

### Manual Testing Steps

1. ✅ Open simulation page
2. ✅ Add Person 2 (partner)
3. ✅ Update Person 2's government benefits (CPP start age, CPP amount, OAS start age, OAS amount)
4. ✅ Switch tabs or trigger re-render
5. ✅ Verify Person 2's government benefits persist
6. ✅ Refresh page
7. ✅ Verify values are still there (from localStorage)

### Expected Behavior After Fix

- ✅ Person 2 government benefits persist in UI
- ✅ Values saved to localStorage correctly
- ✅ Values restored from localStorage on page reload
- ✅ Asset balances still sync from database profile
- ✅ Person 1 government benefits also customizable
- ✅ Both persons can have different CPP/OAS start ages

---

## Files Modified

1. **webapp/app/(dashboard)/simulation/page.tsx**
   - Line 354-370: Removed government benefits from `assetFields` array
   - Added explanatory comment about why benefits are not included
   - Removed debug logging from `updatePerson` function

---

## Design Decisions

### Why Remove Government Benefits from assetFields?

**Rationale**: Government benefits should be customizable in simulations
- Asset balances reflect current reality (database = source of truth)
- Government benefits are assumptions about the future (user should control)
- Simulations are for "what-if" scenarios (delayed CPP, early OAS, etc.)
- Different people have different work histories (Person 2 may differ from Person 1)

**Alternative Considered**: Separate field array for benefits
- Rejected: Adds complexity without benefit
- The fix is simpler: just remove from assetFields

### Data Flow After Fix

```
Initial Load:
1. Database → Prefill API → Person 1 & Person 2 default values
2. User can customize any values

User Updates:
1. User types → updatePerson() → State updated
2. useEffect → Save to localStorage
3. loadPrefillDataWithMerge → Merge:
   - Asset balances: FROM DATABASE ✅
   - Government benefits: FROM LOCALSTORAGE (user's values) ✅
   - User's customizations preserved ✅
```

---

## Impact Analysis

### User Experience Impact

**Before**:
- Users frustrated that Person 2 government benefits don't persist
- Impossible to model scenarios with different CPP/OAS timing
- Confusion about why values keep resetting

**After**:
- Person 2 government benefits persist correctly
- Users can model spouse with different work history
- Users can test delayed CPP/OAS scenarios
- Clear, predictable behavior

### Technical Debt

**Eliminated**:
- Incorrect assumption about what should be "synced" from database
- Confusion between asset balances (current reality) vs. government benefits (future assumptions)

**Prevented**:
- User complaints about lost data
- Support tickets about "broken" simulation inputs
- Users avoiding Person 2 features due to bugs

---

## Lessons Learned

1. **Distinguish between "current state" and "future assumptions"**
   - Asset balances = current state (from database)
   - Government benefits = future assumptions (user-controlled)

2. **localStorage merge logic must be selective**
   - Not all fields should be overwritten from database
   - User customizations must be preserved

3. **Test with both Person 1 and Person 2**
   - Bugs often more visible in Person 2 scenarios
   - Multi-person scenarios expose state management issues

---

## Quality Verification

### TypeScript Compilation
```bash
$ npx tsc --noEmit 2>&1 | wc -l
0
```
✅ Zero TypeScript errors

### Code Quality
- ❌ NO type safety bypasses
- ❌ NO workarounds
- ✅ Clear explanatory comments added
- ✅ Proper separation of concerns (asset sync vs. user customization)

---

## Deployment Checklist

- [x] Bug identified and root cause confirmed
- [x] Code fix implemented
- [x] TypeScript compilation clean (0 errors)
- [x] Manual testing completed
- [x] Explanatory comments added to code
- [x] Ready for production deployment

---

## Commit Message

```
fix: Allow government benefits to persist for Person 2 in simulations

Government benefits (CPP/OAS start ages and amounts) for Person 2 were not
persisting in the simulation input page because they were incorrectly included
in the assetFields array, causing them to be overwritten from the database
during loadPrefillDataWithMerge().

Bug Impact:
- User types CPP/OAS values for Person 2
- Values are reset/overwritten shortly after
- Impossible to model scenarios with different government benefit timing

Root Cause:
- Government benefits were in assetFields array (lines 369-374)
- assetFields are always synced from database, overwriting user input
- loadPrefillDataWithMerge() called on renders, resetting user's values

Fix:
- Remove government benefits from assetFields array
- Asset balances still sync from database (correct)
- Government benefits now persist from localStorage (correct)
- Users can customize CPP/OAS timing in simulations

Design Decision:
- Asset balances = current reality (database is source of truth)
- Government benefits = future assumptions (user should control)
- Simulations are for "what-if" scenarios requiring user control

Testing:
- Manual testing: Person 2 benefits persist correctly
- TypeScript: 0 compilation errors
- Asset sync still works correctly

User Impact: MEDIUM - Fixes inability to customize Person 2 government benefits

🤖 Generated with Claude Code
https://claude.com/claude-code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**Fix Verified By**: Claude Code
**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT
