# Strategy Naming Consistency Fix

**Date:** 2026-02-05
**Issue:** Inconsistent strategy names displayed in optimization UI
**Status:** ✅ FIXED

---

## Problem Description

The optimization suggestion component was displaying inconsistent strategy names:

### Before Fix:
- **API Backend uses:** `rrif-frontload`
- **OptimizationSuggestion component displayed:** "Rrif Frontload" (simple capitalization)
- **Dropdown UI shows:** "Early RRIF Withdrawals (Income Splitting)"
- **User sees two different names for the same strategy!**

### Example of Confusion:
```
User selects: "Early RRIF Withdrawals (Income Splitting)" from dropdown
Optimization suggests: "Try Rrif Frontload"
User thinks: "What's Rrif Frontload? Is that different?"
```

---

## Root Cause

The `OptimizationSuggestion.tsx` component had a custom `formatStrategy()` function that simply capitalized words:

```typescript
const formatStrategy = (strategy: string) => {
  return strategy
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
```

This converted:
- `rrif-frontload` → "Rrif Frontload" ❌
- `tfsa-first` → "Tfsa First" ❌
- `capital-gains-optimized` → "Capital Gains Optimized" ❌

Instead of using the proper labels defined in `lib/types/simulation.ts`:
- `rrif-frontload` → "Early RRIF Withdrawals (Income Splitting)" ✅
- `tfsa-first` → "TFSA First" ✅
- `capital-gains-optimized` → "Capital Gains Optimized" ✅

---

## Solution

### Changes Made to `/webapp/components/OptimizationSuggestion.tsx`:

**1. Import the proper utility function:**
```typescript
import { getStrategyDisplayName } from "@/lib/types/simulation";
```

**2. Remove custom formatStrategy function:**
```typescript
// REMOVED:
const formatStrategy = (strategy: string) => {
  return strategy
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
```

**3. Replace all usages with getStrategyDisplayName:**
```typescript
// Current Strategy display
Current: {getStrategyDisplayName(optimization.original_strategy)}

// Suggested Strategy display
Suggested: {getStrategyDisplayName(optimization.optimized_strategy)}

// Button text
Try {getStrategyDisplayName(optimization.optimized_strategy)}
```

---

## Strategy Name Mappings

The `getStrategyDisplayName()` function correctly maps all strategies:

| API Value | Display Name |
|-----------|--------------|
| `corporate-optimized` | Corporate Optimized |
| `minimize-income` | Income Minimization (GIS-Optimized) |
| `rrif-splitting` | RRIF Splitting |
| `capital-gains-optimized` | Capital Gains Optimized |
| `tfsa-first` | TFSA First |
| `balanced` | Balanced |
| `rrif-frontload` | **Early RRIF Withdrawals (Income Splitting)** |

---

## Impact

### Before Fix:
```
Current: Early RRIF Withdrawals (Income Splitting)  [from dropdown]
Suggested: Tfsa First                                [wrong capitalization]
[Button] Try Tfsa First                              [inconsistent]
```

### After Fix:
```
Current: Early RRIF Withdrawals (Income Splitting)  [correct]
Suggested: TFSA First                                [correct]
[Button] Try TFSA First                              [consistent]
```

---

## Testing

The fix ensures:
- ✅ All strategy names match across dropdown, optimization card, and buttons
- ✅ Users see consistent terminology throughout the app
- ✅ "TFSA" is properly capitalized (not "Tfsa")
- ✅ Complex names like "Early RRIF Withdrawals (Income Splitting)" display correctly
- ✅ No functional changes - only display consistency improved

---

## Related Files

- `/webapp/components/OptimizationSuggestion.tsx` - Fixed component
- `/webapp/lib/types/simulation.ts` - Contains `getStrategyDisplayName()` utility and strategy definitions
- `/webapp/app/(dashboard)/simulation/page.tsx` - Uses OptimizationSuggestion component

---

## Recommendation

**Always use `getStrategyDisplayName()` when displaying strategy names to users.**

This ensures consistency across the entire application and makes it easy to update labels in one place if needed.

```typescript
// ✅ GOOD
import { getStrategyDisplayName } from "@/lib/types/simulation";
<span>{getStrategyDisplayName(strategy)}</span>

// ❌ BAD
<span>{strategy.replace("-", " ")}</span>  // Custom formatting
```

---

## Status

✅ **FIXED** - Component updated to use proper strategy display names
✅ **TESTED** - Next.js dev server compiled successfully
✅ **DOCUMENTED** - This document provides reference for future developers
