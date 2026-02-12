# Changelog

## 2026-02-12 - Critical Fix for RRSP/RRIF Withdrawals
- **CRITICAL FIX:** Discovered Python backend "Balanced" strategy only withdraws RRIF minimum, creating spending gaps
- **FIX:** Changed strategy recommendation from "balanced" to "rrif-frontload" for users with >40% RRSP/RRIF
- **FIX:** Fixed strategy value capitalization ("balanced" → "Balanced") for Python backend compatibility
- **UI:** Updated strategy descriptions with warnings about "Balanced" strategy limitations
- **UI:** Marked "RRIF Focused" strategy as RECOMMENDED for RRSP holders
- **UI:** Added warning emoji (⚠️) to "Balanced" strategy description
- **API:** Now recommends "rrif-frontload" strategy for significant RRSP/RRIF holdings
- **Note:** "rrif-frontload" withdraws 15% before OAS/CPP, 8% after - ensures spending is funded

## 2026-02-12 - Earlier Updates
- **UI:** Updated RRSP/RRIF withdrawal labels (removed "Early" prefix since CRA allows conversion at any age)
- **UI:** Changed "Early RRIF Withdrawals" to "RRSP/RRIF Frontload" in strategy selector
- **Note:** TFSA contributions already default to 0 (no change needed)

## 2026-02-12
- **Breaking:** Planning age in simulation now read-only (edit via profile settings)
- **Breaking:** RRSP/RRIF withdrawals now enabled by default at retirement (CRA allows conversion at any age)
- **API:** /api/simulation/prefill returns calculatedStartYear based on targetRetirementAge
- **API:** Auto-enables RRSP/RRIF withdrawals when user has RRSP balance
- **API:** Strategy recommendation now considers RRSP balance (was only checking RRIF)
- **UI:** Start Year auto-calculates from retirement age
- **UI:** Removed "Early" from RRSP/RRIF withdrawal labels (not early at retirement age)
- **Fix:** Person 2 no longer appears in single person simulations (zero CPP/OAS for non-existent partner)
- **Fix:** RRSP funds now accessible - recommends "balanced" strategy when RRSP > 40% of assets
- **Fix:** Default strategy changed from "minimize-income" to appropriate strategy based on assets

## 2026-02-11
- **API:** Fixed simulation data format mismatch with Python backend
- **Fix:** Partner (p2) validation errors when no partner exists