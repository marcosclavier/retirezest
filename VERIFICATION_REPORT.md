# Non-Registered Distributions Bug Fix - VERIFICATION REPORT

## Date: February 10, 2026
## Verified By: Manual inspection and automated testing

---

## ✅ BACKEND CHANGES VERIFIED

### 1. File: `juan-retirement-app/api/models/responses.py`

**Line 276-277: Added nonreg_distributions field to ChartDataPoint**

```python
# Passive income from non-registered accounts (interest, dividends, capital gains)
nonreg_distributions: float = Field(default=0.0)
```

**Status**: ✅ CONFIRMED - Field is present in the model

---

### 2. File: `juan-retirement-app/api/utils/converters.py`

**Lines 999-1012: Added nonreg_distributions calculation and included in taxable_income**

```python
# Calculate NonReg distributions (passive income: interest, dividends, capital gains)
nonreg_distributions = float(
    row.get('nr_interest_p1', 0) + row.get('nr_interest_p2', 0) +
    row.get('nr_elig_div_p1', 0) + row.get('nr_elig_div_p2', 0) +
    row.get('nr_nonelig_div_p1', 0) + row.get('nr_nonelig_div_p2', 0) +
    row.get('nr_capg_dist_p1', 0) + row.get('nr_capg_dist_p2', 0)
)

# Calculate taxable income for chart display (all taxable sources)
# Includes: RRIF/RRSP withdrawals, CPP, OAS, account withdrawals, pensions, and NonReg distributions
taxable_income = (rrif_withdrawal + rrsp_withdrawal + cpp_total + oas_total +
                 nonreg_withdrawal + corporate_withdrawal +
                 pension_income_total + other_income_total +
                 nonreg_distributions)  # ✅ NOW INCLUDED
```

**Status**: ✅ CONFIRMED - Calculation is present and nonreg_distributions is included in taxable_income

---

**Line 1046: Added nonreg_distributions to ChartDataPoint construction**

```python
data_points.append(ChartDataPoint(
    # ... other fields ...
    nonreg_distributions=nonreg_distributions,  # ✅ ADDED
))
```

**Status**: ✅ CONFIRMED - Field is passed to ChartDataPoint

---

## ✅ FRONTEND CHANGES VERIFIED

### 3. File: `webapp/components/simulation/YearByYearTable.tsx`

**CHANGE 1: Removed NonReg Dist from Government Benefits - Person 1**

**Before (Bug):**
```typescript
{(year.gis_p1 ?? 0) > 0 && (
  <div>GIS...</div>
)}
<div>                                    // ❌ THIS WAS HERE (WRONG!)
  <span>NonReg Dist</span>
  <span>{formatCurrency(nonregDistributions / 2)}</span>
</div>

<div className="font-semibold">PERSON 2</div>
```

**After (Fixed) - Lines 352-361:**
```typescript
{(year.gis_p1 ?? 0) > 0 && (
  <div>GIS...</div>
)}
                                        // ✅ REMOVED!
<div className="font-semibold text-xs pt-2 sm:pt-3">PERSON 2</div>
```

**Status**: ✅ CONFIRMED - NonReg Dist removed from Person 1 in Gov Benefits section

---

**CHANGE 2: Removed NonReg Dist from Government Benefits - Person 2**

**Before (Bug):**
```typescript
{(year.gis_p2 ?? 0) > 0 && (
  <div>GIS...</div>
)}
<div>                                    // ❌ THIS WAS HERE (WRONG!)
  <span>NonReg Dist</span>
  <span>{formatCurrency(nonregDistributions / 2)}</span>
</div>

<div className="border-t">Total Gov Benefits...</div>
```

**After (Fixed) - Lines 382-391:**
```typescript
{(year.gis_p2 ?? 0) > 0 && (
  <div>GIS...</div>
)}
                                        // ✅ REMOVED!
<div className="flex justify-between items-center gap-2 pt-2 border-t">
```

**Status**: ✅ CONFIRMED - NonReg Dist removed from Person 2 in Gov Benefits section

---

**CHANGE 3: Fixed Total Gov Benefits calculation**

**Before (Bug) - Line 408:**
```typescript
{formatCurrency(totalBenefits + nonregDistributions)}  // ❌ WRONG!
```

**After (Fixed) - Line 396:**
```typescript
{formatCurrency(totalBenefits)}  // ✅ CORRECT!
```

**Status**: ✅ CONFIRMED - Total Gov Benefits no longer includes nonregDistributions

---

**CHANGE 4: Added NonReg Passive to Withdrawals section - Person 1**

**Lines 433-438:**
```typescript
<div className="flex justify-between items-center gap-1 min-w-0">
  <span className="truncate" style={{ color: '#111827' }}>NonReg Passive</span>
  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
    {formatCurrency(nonregDistributions / 2)}
  </span>
</div>
```

**Status**: ✅ CONFIRMED - NonReg Passive added after Non-Reg withdrawal for Person 1

---

**CHANGE 5: Added NonReg Passive to Withdrawals section - Person 2**

**Lines 465-470:**
```typescript
<div className="flex justify-between items-center gap-1 min-w-0">
  <span className="truncate" style={{ color: '#111827' }}>NonReg Passive</span>
  <span className="font-medium whitespace-nowrap flex-shrink-0" style={{ color: '#111827' }}>
    {formatCurrency(nonregDistributions / 2)}
  </span>
</div>
```

**Status**: ✅ CONFIRMED - NonReg Passive added after Non-Reg withdrawal for Person 2

---

**CHANGE 6: Updated Total Withdrawals calculation**

**Before (Bug):**
```typescript
{formatCurrency(totalWithdrawals)}  // ❌ Missing nonregDistributions
```

**After (Fixed) - Line 477:**
```typescript
{formatCurrency(totalWithdrawals + nonregDistributions)}  // ✅ INCLUDES nonregDistributions
```

**Status**: ✅ CONFIRMED - Total Withdrawals now includes nonregDistributions

---

## ✅ TESTING VERIFIED

### Test File: `juan-retirement-app/test_nonreg_distributions_chart_fix.py`

**File exists**: ✅ YES (created Feb 10, 2026 at 08:47)
**File size**: 6,787 bytes

### Test Results:

```
✅ TEST 1 PASS: NonReg distributions captured in chart ($8,000.00)
✅ TEST 2 PASS: Chart nonreg_distributions matches dataframe
✅ TEST 3 PASS: Taxable income ($29,210.00) includes nonreg_distributions
✅ TEST 4 PASS: nonreg_distributions ($8,000.00) is separate from nonreg_withdrawal ($0.00)

✅ ALL TESTS PASSED: NonReg distributions bug is FIXED!
```

**Status**: ✅ ALL TESTS PASS

---

## ✅ BUILD VERIFICATION

### Command: `npm run build` (from webapp directory)

**Result**: ✅ Build successful with no TypeScript errors

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (52/52)
```

**Status**: ✅ NO ERRORS, build succeeds

---

## SUMMARY OF CHANGES

| Component | File | Lines | Change | Status |
|-----------|------|-------|--------|--------|
| Backend Model | `api/models/responses.py` | 276-277 | Added `nonreg_distributions` field | ✅ VERIFIED |
| Backend Calc | `api/utils/converters.py` | 999-1012 | Calculate and include in taxable_income | ✅ VERIFIED |
| Backend Data | `api/utils/converters.py` | 1046 | Pass to ChartDataPoint | ✅ VERIFIED |
| Frontend UI | `YearByYearTable.tsx` | 352-361 | Remove from Gov Benefits P1 | ✅ VERIFIED |
| Frontend UI | `YearByYearTable.tsx` | 382-391 | Remove from Gov Benefits P2 | ✅ VERIFIED |
| Frontend UI | `YearByYearTable.tsx` | 396 | Fix Total Gov Benefits | ✅ VERIFIED |
| Frontend UI | `YearByYearTable.tsx` | 433-438 | Add to Withdrawals P1 | ✅ VERIFIED |
| Frontend UI | `YearByYearTable.tsx` | 465-470 | Add to Withdrawals P2 | ✅ VERIFIED |
| Frontend UI | `YearByYearTable.tsx` | 477 | Update Total Withdrawals | ✅ VERIFIED |
| Testing | `test_nonreg_distributions_chart_fix.py` | All | Comprehensive test case | ✅ VERIFIED |

---

## VERIFICATION CHECKLIST

- [x] Backend model updated with nonreg_distributions field
- [x] Backend calculation includes nonreg_distributions in taxable_income
- [x] Backend passes nonreg_distributions to ChartDataPoint
- [x] Frontend removes NonReg Dist from Government Benefits (Person 1)
- [x] Frontend removes NonReg Dist from Government Benefits (Person 2)
- [x] Frontend fixes Total Gov Benefits calculation
- [x] Frontend adds NonReg Passive to Withdrawals (Person 1)
- [x] Frontend adds NonReg Passive to Withdrawals (Person 2)
- [x] Frontend updates Total Withdrawals calculation
- [x] Test file created and runs successfully
- [x] All test cases pass
- [x] TypeScript build succeeds with no errors

---

## CONCLUSION

**ALL CHANGES HAVE BEEN VERIFIED AND TESTED**

✅ **9/9 code changes confirmed present**
✅ **4/4 test cases pass**
✅ **1/1 build verification succeeds**

The bug fix is **COMPLETE and VERIFIED**.

---

**Verification performed**: February 10, 2026
**Method**: Manual file inspection + Automated testing + Build verification
**Verifier**: Claude Code (with manual user verification requested)
