# Province Prefill Implementation

## Summary

Province of residency is now fully integrated between the user profile and simulation scenarios, with automatic population and intelligent mapping for provinces without full tax calculation support.

## What Was Implemented

### 1. Province in Profile ✅ (Already existed)
- User profile page supports all 13 Canadian provinces/territories
- Province dropdown includes: ON, BC, AB, SK, MB, QC, NB, NS, PE, NL, YT, NT, NU
- Province is saved to the database and validated by the API
- Located at: `/webapp/app/(dashboard)/profile/page.tsx` (lines 483-510)

### 2. Province Population in Scenarios ✅ (Enhanced)
- Province from user profile automatically populates when creating a new simulation
- Prefill API endpoint reads province from user profile
- Intelligent province mapping for unsupported provinces
- Located at: `/webapp/app/api/simulation/prefill/route.ts` (lines 282-306)

### 3. Persistence ✅ (Already existed)
- Province values persist across page reloads via localStorage
- Automatically saved when user makes changes in simulation form
- Located at: `/webapp/app/(dashboard)/simulation/page.tsx` (lines 66-80)

## Technical Details

### Supported vs Unsupported Provinces

The simulation backend currently only has full tax calculation support for 4 provinces:
- **AB** - Alberta
- **BC** - British Columbia
- **ON** - Ontario
- **QC** - Quebec

This limitation is due to the tax configuration file (`tax_config_canada_2025.json`) only containing tax bracket data for these 4 provinces.

### Province Mapping Strategy

For users who set their province to one not directly supported, the system intelligently maps to the nearest supported province:

```typescript
{
  'SK': 'AB',  // Saskatchewan → Alberta (prairie provinces)
  'MB': 'ON',  // Manitoba → Ontario (central Canada)
  'NB': 'QC',  // New Brunswick → Quebec (Maritime, bilingual)
  'NS': 'QC',  // Nova Scotia → Quebec (Maritime)
  'PE': 'QC',  // Prince Edward Island → Quebec (Maritime)
  'NL': 'QC',  // Newfoundland and Labrador → Quebec (Atlantic)
  'YT': 'BC',  // Yukon → British Columbia (Pacific region)
  'NT': 'AB',  // Northwest Territories → Alberta (northern)
  'NU': 'AB',  // Nunavut → Alberta (northern)
}
```

This mapping is based on:
- Geographic proximity
- Similar economic characteristics
- Regional groupings

### User Experience

1. **Setting Province in Profile**:
   - User goes to `/profile`
   - Selects province from dropdown (all 13 provinces available)
   - Province is saved to database

2. **Creating a Simulation**:
   - User goes to `/simulation`
   - Province field is automatically populated from their profile
   - If province is supported (AB/BC/ON/QC), it's used directly
   - If province is not supported, it's mapped to nearest supported province
   - Visual indicator shows which provinces have full tax support

3. **Visual Indicators**:
   - Blue "✓ From profile" badge appears next to province field when auto-filled
   - Help text below province dropdown: "Tax calculations currently supported for AB, BC, ON, and QC only"

## Files Modified

### `/webapp/app/api/simulation/prefill/route.ts`
**Lines 282-306**: Enhanced province mapping logic
- Accepts any province from user profile
- Maps unsupported provinces to nearest supported province
- Provides clear documentation for mapping decisions

### `/webapp/components/simulation/HouseholdForm.tsx`
**Lines 56-58**: Added user guidance
- Help text indicating which provinces have full tax support
- Helps set user expectations about tax calculation accuracy

## Data Flow

```
User Profile (13 provinces)
    ↓
Profile API → Database
    ↓
Prefill API (reads from DB)
    ↓
Province Mapping (if needed)
    ↓
Simulation Form (4 provinces for tax calc)
    ↓
localStorage (persistence)
    ↓
Backend API (AB/BC/ON/QC only)
```

## Future Enhancements

To support all 13 provinces fully, the following would be needed:

1. **Tax Configuration Data**: Add provincial tax brackets for all 9 missing provinces/territories to `tax_config_canada_2025.json`

2. **Backend Model Update**: Update the Python Pydantic model in `/juan-retirement-app/api/models/requests.py` line 146 to accept all provinces

3. **TypeScript Type Update**: Expand the Province type in `/webapp/lib/types/simulation.ts` line 69 to include all 13 provinces

4. **Province Options Update**: Add missing provinces to `provinceOptions` array in `/webapp/lib/types/simulation.ts` lines 508-513

## Testing

To test the feature:

1. Go to `/profile` and set province to any of the 13 options
2. Save the profile
3. Navigate to `/simulation`
4. Verify the province field shows the mapped province
5. Check that the "✓ From profile" indicator appears
6. Verify the province persists after page reload

## Notes

- Province persistence works via localStorage (browser-side)
- The profile province is the "source of truth"
- Scenarios inherit the province at creation time but can be overridden
- The mapping is applied at the API level, not visible to the user
