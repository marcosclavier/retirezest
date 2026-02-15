# Fix for Validation Error - "Balanced" Strategy Issue

## The Problem
The application is sending `"Balanced"` (with capital B) as the strategy, but the backend only accepts lowercase `"balanced"`.

## Solution Applied
1. Updated `/webapp/lib/types/simulation.ts` to remove the duplicate "Balanced" entry
2. Changed strategy option value from "Balanced" to "balanced"
3. Updated UI mappings to use lowercase "balanced"
4. Cleared Next.js cache and restarted dev server

## Steps for User to Clear Browser Cache

### Option 1: Clear localStorage (Recommended)
1. Open browser DevTools (F12 or right-click → Inspect)
2. Go to the Console tab
3. Run this command:
```javascript
// Clear all simulation-related localStorage
localStorage.removeItem('simulation_household');
localStorage.removeItem('simulation_include_partner');
localStorage.removeItem('simulation_inflation');
localStorage.removeItem('simulation_strategy');
location.reload();
```

### Option 2: Hard Refresh
- **Windows/Linux**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R

### Option 3: Clear All Site Data
1. Open DevTools (F12)
2. Go to Application tab
3. Under Storage, click "Clear site data"
4. Refresh the page

## Test Script
Run this in the browser console to verify the fix:
```javascript
// Check if any "Balanced" values exist
const household = JSON.parse(localStorage.getItem('simulation_household') || '{}');
if (household.strategy === 'Balanced') {
  console.log('❌ Found old "Balanced" strategy in localStorage');
  household.strategy = 'balanced';
  localStorage.setItem('simulation_household', JSON.stringify(household));
  console.log('✅ Fixed: Changed to lowercase "balanced"');
  console.log('🔄 Refreshing page...');
  setTimeout(() => location.reload(), 1000);
} else {
  console.log('✅ Strategy is correct:', household.strategy || 'not set');
}
```

## Verification
After clearing cache, the simulation should work with these valid strategies:
- `rrif-frontload`
- `corporate-optimized`
- `minimize-income`
- `rrif-splitting`
- `capital-gains-optimized`
- `tfsa-first`
- `balanced` (lowercase)

## Server Status
- Next.js dev server has been restarted
- Python API is running and accepting requests
- All code changes have been applied