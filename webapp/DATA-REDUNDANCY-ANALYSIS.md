# Data Redundancy Analysis

## Critical Issues

### Data Asked Multiple Times

| Field | Profile | Simulation | Scenarios | Status |
|-------|---------|------------|-----------|--------|
| **Province** | ✅ | ✅ | ✅ | ✅ **Auto-prefilled** |
| **TFSA Balance** | ✅ | ✅ | ✅ | ✅ **Auto-prefilled** |
| **RRSP/RRIF Balance** | ✅ | ✅ | ✅ | ✅ **Auto-prefilled** |
| **Corporate Balance** | ✅ | ✅ | ✅ | ✅ **Auto-prefilled** |
| **Non-Reg Balance** | ✅ | ✅ | ✅ | ✅ **Auto-prefilled** |
| **TFSA Contribution Room** | ✅ | ✅ | ❌ | ✅ **FIXED - Phase 1** |
| **Current Age** | Calculated | ✅ Asked | ✅ Asked | ⏳ Phase 2 |

## ✅ Phase 1 Complete (December 8, 2025)

### Implemented Features

1. **TFSA Contribution Room Auto-Fill**
   - ✅ Enhanced prefill API to fetch `contributionRoom` from assets
   - ✅ Aggregate TFSA room by owner (handles joint assets)
   - ✅ Set `tfsa_room_start` in PersonInput for both person1 and person2

2. **Visual Indicators**
   - ✅ Added "✓ From profile" labels to prefilled fields
   - ✅ Blue background highlight (`bg-blue-50 border-blue-200`)
   - ✅ Indicators in PersonForm (TFSA room) and HouseholdForm (Province)

3. **Transparency & Override**
   - ✅ Clear data source indication builds user trust
   - ✅ Users can still override values for what-if scenarios
   - ✅ Maintains single source of truth (Profile Assets)

**See:** `PHASE-1-COMPLETION-REPORT.md` for detailed implementation notes

---

## Phase 2 - Future Enhancements

### Quick Wins (1-2 days)

1. ~~Add TFSA room to prefill API~~ ✅ **DONE**
2. ~~Show "✓ From profile" indicators on prefilled fields~~ ✅ **DONE**
3. Add "Edit in Profile →" links for all prefilled fields
4. Make age read-only (calculated from DOB)
5. Extend visual indicators to all balance fields (TFSA, RRSP, RRIF, NonReg, Corporate)

## Implementation

```bash
# Files to modify:
webapp/app/api/simulation/prefill/route.ts      # Add TFSA room
webapp/components/simulation/PersonForm.tsx      # Add indicators
webapp/components/simulation/HouseholdForm.tsx   # Add indicators
```

## Result

- Eliminates duplicate data entry
- Reduces form fields from 65+ to ~40
- Clear data source indication
- Maintains override capability for what-if scenarios
