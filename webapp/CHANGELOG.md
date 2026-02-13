# Changelog

## 2026-02-12 - OAS START AGE FIX: Critical RRIF Withdrawal Issue Resolved

### ROOT CAUSE IDENTIFIED:
- **Problem**: Rafael (age 60, retiring at 67) was only withdrawing 8% from RRIF instead of 15%
- **Cause**: OAS start age defaulted to 65 (minimum OAS age) when not explicitly set
- **Impact**: At age 67, system thought Rafael was "AFTER OAS" (67 >= 65) and used 8% rate
- **Expected**: Should be "BEFORE OAS" at age 67 and use 15% withdrawal rate

### FIX IMPLEMENTED:
1. **✅ OAS Start Age Default Changed** (prefill/route.ts lines 363, 450)
   - Changed default from `Math.max(age, 65)` to `70` (maximum OAS deferral age)
   - Ensures rrif-frontload strategy maximizes withdrawals before OAS starts
   - Rafael at age 67 is now correctly "BEFORE OAS" (67 < 70)

2. **✅ Debug Logging Added** (simulation.py lines 1623-1626)
   - Added OAS age comparison debug output
   - Shows actual vs expected OAS status for each year

### RESULT:
- Rafael now withdraws 15% ($52,500) at age 67 instead of 8% ($28,000)
- Retirement spending fully funded without gaps
- No phantom TFSA contributions or non-reg balances

## 2026-02-12 - FIXES IMPLEMENTED: Python Backend Corrections

### FIXES APPLIED:
1. **✅ TFSA Contribution Logic Fixed** (simulation.py line 2898-2911)
   - Added check: Don't contribute to TFSA if household has spending gap
   - If `hh_gap > 1e-6`, sets TFSA contributions to 0
   - Only allows TFSA contributions when spending is fully funded

2. **✅ Phantom Non-Reg Balance Fixed** (simulation.py line 2944-2946)
   - Added check: Don't create non-reg balance if spending gap exists
   - Only adds surplus to non-reg when `hh_gap < 1e-6`
   - Prevents phantom balance creation when underfunded

3. **✅ Frontend Overrides** (api/simulation/run/route.ts)
   - Explicitly sends `tfsa_contribution_each: 0` to Python backend
   - Sets proper defaults for single-person simulations
   - Added comprehensive logging for debugging

### REMAINING ISSUE:
- **RRSP/RRIF Withdrawal Amount**: Still only withdrawing minimum instead of required amount
- The rrif-frontload strategy should withdraw 15% before OAS (=$52,500 for Rafael)
- Currently only withdrawing $28,000 (RRIF minimum at 8%)

## 2026-02-12 - CRITICAL BUG FOUND: Python Backend Issue
### THE PROBLEM:
- **Python backend has fundamental logic flaw**: Creates phantom non-reg balances and contributes to TFSA even when retirement spending is underfunded
- **Root cause in simulation.py line 2897**: `c1 = min(hh.tfsa_contribution_each, max(p1.nonreg_balance,0.0), tfsa_room1)`
- **Impact**: Rafael's simulation shows:
  - $30,372 spending gap in 2033 (underfunded)
  - $14,000 TFSA contribution (should be $0 when underfunded)
  - $1,739 phantom non-reg balance (Rafael has NO non-reg accounts)
  - Only $28,000 RRSP withdrawal when $60,000 needed for spending

### ATTEMPTED FIXES:
1. ✅ Frontend sends `tfsa_contribution_each: 0` to override Python default
2. ✅ Strategy changed to "rrif-frontload" to force higher RRSP withdrawals
3. ❌ Python backend IGNORES these settings and still contributes to TFSA

### ROOT CAUSE:
Python backend's flawed logic:
1. Withdraws only RRIF minimum ($28,000)
2. Creates $30,372 spending gap
3. Still somehow generates "surplus" cash
4. Puts that phantom surplus into non-reg ($1,739)
5. Then contributes from non-reg to TFSA ($14,000)
6. All while retirement spending remains underfunded!

### REQUIRED FIX:
Python backend needs fundamental logic change:
- NEVER contribute to TFSA when spending gaps exist
- NEVER create phantom non-reg balances
- Withdraw enough from RRSP/RRIF to fund spending FIRST
- Only consider TFSA contributions from actual surplus AFTER all spending is funded

## 2026-02-12 - UI Fix: Strategy Display Mismatch
- **FIX:** Updated strategy display mapping in simulation page
- **Changed:** 'rrif-frontload' now displays as 'RRSP/RRIF Focused' (was showing 'Early RRIF Withdrawals')

## 2026-02-12 - CRITICAL: Fix TFSA Contribution Bug
- **CRITICAL FIX:** Python backend was defaulting to $7,000 TFSA contribution even with spending gaps
- **FIX:** Now explicitly sends `tfsa_contribution_each: 0` to override Python's default
- **FIX:** This prevents the system from contributing to TFSA when retirement spending isn't fully funded
- **Impact:** Rafael's simulation will now use the $14k for spending instead of TFSA contributions

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