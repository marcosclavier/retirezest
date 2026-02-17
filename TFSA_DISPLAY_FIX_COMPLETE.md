# TFSA Surplus Allocation Display Fix

## Problem
The Year-by-Year table was showing TFSA contribution as only $3,056 when Rafael had a $40,000 surplus and $157,500 of accumulated TFSA room available.

## Root Cause
The surplus allocation display in `YearByYearTable.tsx` was hardcoded to use $7,000 as the maximum TFSA contribution limit, instead of using the actual reinvestment amounts calculated by the simulation.

## Solution Implemented

### 1. Updated YearByYearTable.tsx
- Removed hardcoded $7,000 TFSA limit
- Now displays actual `tfsa_reinvest_p1` amount from simulation
- Shows actual `reinvest_nonreg_p1` amount from simulation
- Added warning for any unallocated surplus

### 2. Added TypeScript Type Definitions
Added to `lib/types/simulation.ts`:
```typescript
// Surplus reinvestments
tfsa_reinvest_p1?: number;
tfsa_reinvest_p2?: number;
reinvest_nonreg_p1?: number;
reinvest_nonreg_p2?: number;
```

## How It Works Now

1. **Python Simulation** calculates surplus allocation:
   - Allocates up to available TFSA room (e.g., $157,500 for Rafael)
   - Remainder goes to Non-Reg accounts
   - Returns `tfsa_reinvest_p1` and `reinvest_nonreg_p1` values

2. **Frontend Display** shows actual amounts:
   - Instead of: `→ TFSA: $7,000` (hardcoded limit)
   - Now shows: `→ TFSA: $40,000` (actual allocation)
   - Shows Non-Reg allocation only if there is any
   - Shows warning if surplus isn't fully allocated

## Expected Results for Rafael (2033)

### Before Fix:
```
Surplus Allocation:
→ TFSA: $7,000 (incorrectly limited)
→ Non-Reg: $33,000 (incorrect remainder)
```

### After Fix:
```
Surplus Allocation:
→ TFSA: $40,000 (full surplus, within $157,500 room)
```

## Technical Details

The simulation correctly:
1. Calculates $157,500 accumulated TFSA room for Rafael (born 1966, never contributed)
2. Allocates the full $40,000 surplus to TFSA (well within available room)
3. Updates TFSA balance accordingly
4. Only allocates to Non-Reg if TFSA room is exhausted

## Files Modified

1. `/components/simulation/YearByYearTable.tsx` - Display actual reinvestment amounts
2. `/lib/types/simulation.ts` - Added reinvestment field types

## Benefits

- Accurate display of where surplus is actually invested
- Users can see if they're maximizing TFSA tax-free growth
- Proper tracking of TFSA vs Non-Reg allocation
- Clear warning if surplus isn't being fully invested