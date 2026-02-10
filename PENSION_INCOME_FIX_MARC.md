# Pension Income Fix - Marc's Issue Resolution

## Date: February 10, 2026
## Status: ✅ FIXED AND TESTED
## Reporter: Marc Rondeau (mrondeau205@gmail.com)

---

## Issue Summary

**Problem**: User entered pension income in the UI, but it was NOT appearing in:
1. Five Year Withdrawal Plan table
2. Year by Year detailed view
3. Simulation results displays

**Impact**: Users with pension income saw incomplete retirement projections, missing a critical income source.

**User Report**:
- User entered 2 pensions ($100,000 and $50,000)
- Pensions visible in Income Sources page
- Pensions NOT visible in 5-Year Plan
- Pensions NOT visible in Year by Year breakdown
- Total income calculations appeared incorrect

---

## Root Cause Analysis

### Bug #1: Missing Field Mapping in `dataframe_to_year_results()`

**File**: `juan-retirement-app/api/utils/converters.py`
**Location**: Lines 180-241
**Issue**: The function was not mapping pension income fields from the DataFrame to the API response model.

**Problem Code** (BEFORE):
```python
# Government benefits - Inflows
cpp_p1=float(row.get('cpp_p1', 0)),
cpp_p2=float(row.get('cpp_p2', 0)),
oas_p1=float(row.get('oas_p1', 0)),
oas_p2=float(row.get('oas_p2', 0)),
gis_p1=float(row.get('gis_p1', 0)),
gis_p2=float(row.get('gis_p2', 0)),
oas_clawback_p1=float(row.get('oas_clawback_p1', 0)),
oas_clawback_p2=float(row.get('oas_clawback_p2', 0)),
# ❌ MISSING: employer_pension_p1 and employer_pension_p2

# Withdrawals (handle various column naming conventions)
```

**Fixed Code** (AFTER):
```python
# Government benefits - Inflows
cpp_p1=float(row.get('cpp_p1', 0)),
cpp_p2=float(row.get('cpp_p2', 0)),
oas_p1=float(row.get('oas_p1', 0)),
oas_p2=float(row.get('oas_p2', 0)),
gis_p1=float(row.get('gis_p1', 0)),
gis_p2=float(row.get('gis_p2', 0)),
oas_clawback_p1=float(row.get('oas_clawback_p1', 0)),
oas_clawback_p2=float(row.get('oas_clawback_p2', 0)),
employer_pension_p1=float(row.get('pension_income_p1', 0)),  # ✅ ADDED
employer_pension_p2=float(row.get('pension_income_p2', 0)),  # ✅ ADDED

# Withdrawals (handle various column naming conventions)
```

**Explanation**: The DataFrame contains `pension_income_p1` and `pension_income_p2` from the simulation, but the API model expects `employer_pension_p1` and `employer_pension_p2`. The mapping was missing, so pension values were always $0 in API responses.

---

### Bug #2: Missing Income Fields in `extract_five_year_plan()`

**File**: `juan-retirement-app/api/utils/converters.py`
**Location**: Lines 779-870
**Issue**: The Five Year Plan extraction was missing ALL income fields (CPP, OAS, pension, rental, other).

**Problem Code** (BEFORE):
```python
# Get withdrawals by source
rrif_p1 = float(row.get('withdraw_rrif_p1', 0))
rrif_p2 = float(row.get('withdraw_rrif_p2', 0))
# ... only withdrawals, no income sources

total_p1 = rrif_p1 + nonreg_p1 + tfsa_p1 + corp_p1  # ❌ Missing income
total_p2 = rrif_p2 + nonreg_p2 + tfsa_p2 + corp_p2  # ❌ Missing income

plan.append(FiveYearPlanYear(
    year=int(row.get('year', 0)),
    # ... lots of fields missing ...
    rrif_withdrawal_p1=rrif_p1,
    rrif_withdrawal_p2=rrif_p2,
    # ❌ MISSING: cpp_p1, cpp_p2, oas_p1, oas_p2
    # ❌ MISSING: employer_pension_p1, employer_pension_p2
    # ❌ MISSING: rental_income_p1, rental_income_p2
    # ❌ MISSING: other_income_p1, other_income_p2
    total_withdrawn_p1=total_p1,
    total_withdrawn_p2=total_p2,
))
```

**Fixed Code** (AFTER):
```python
# Get income sources
cpp_p1 = float(row.get('cpp_p1', 0))
cpp_p2 = float(row.get('cpp_p2', 0))
oas_p1 = float(row.get('oas_p1', 0))
oas_p2 = float(row.get('oas_p2', 0))
pension_p1 = float(row.get('pension_income_p1', 0))  # ✅ ADDED
pension_p2 = float(row.get('pension_income_p2', 0))  # ✅ ADDED
rental_p1 = float(row.get('rental_income_p1', 0))    # ✅ ADDED
rental_p2 = float(row.get('rental_income_p2', 0))    # ✅ ADDED
other_p1 = float(row.get('other_income_p1', 0))      # ✅ ADDED
other_p2 = float(row.get('other_income_p2', 0))      # ✅ ADDED

# Get withdrawals by source
rrif_p1 = float(row.get('withdraw_rrif_p1', 0))
# ...

# Get NonReg distributions (passive income)
nonreg_dist_p1 = float(
    row.get('nr_interest_p1', 0) + row.get('nr_elig_div_p1', 0) +
    row.get('nr_nonelig_div_p1', 0) + row.get('nr_capg_dist_p1', 0)
)
# ...

# Calculate total withdrawals per person (income + withdrawals)
total_p1 = cpp_p1 + oas_p1 + pension_p1 + rental_p1 + other_p1 + \
           rrif_p1 + nonreg_p1 + tfsa_p1 + corp_p1 + nonreg_dist_p1  # ✅ COMPLETE
total_p2 = cpp_p2 + oas_p2 + pension_p2 + rental_p2 + other_p2 + \
           rrif_p2 + nonreg_p2 + tfsa_p2 + corp_p2 + nonreg_dist_p2  # ✅ COMPLETE

plan.append(FiveYearPlanYear(
    year=int(row.get('year', 0)),
    # ... all fields now included ...
    cpp_p1=cpp_p1,  # ✅ ADDED
    cpp_p2=cpp_p2,  # ✅ ADDED
    oas_p1=oas_p1,  # ✅ ADDED
    oas_p2=oas_p2,  # ✅ ADDED
    employer_pension_p1=pension_p1,  # ✅ ADDED
    employer_pension_p2=pension_p2,  # ✅ ADDED
    rental_income_p1=rental_p1,  # ✅ ADDED
    rental_income_p2=rental_p2,  # ✅ ADDED
    other_income_p1=other_p1,  # ✅ ADDED
    other_income_p2=other_p2,  # ✅ ADDED
    rrif_withdrawal_p1=rrif_p1,
    rrif_withdrawal_p2=rrif_p2,
    # ... all other fields ...
    nonreg_distributions_p1=nonreg_dist_p1,  # ✅ ADDED
    nonreg_distributions_p2=nonreg_dist_p2,  # ✅ ADDED
    nonreg_distributions_total=nonreg_dist_p1 + nonreg_dist_p2,  # ✅ ADDED
    total_withdrawn_p1=total_p1,  # ✅ NOW INCLUDES ALL INCOME
    total_withdrawn_p2=total_p2,  # ✅ NOW INCLUDES ALL INCOME
    total_withdrawn=total_p1 + total_p2,  # ✅ NOW INCLUDES ALL INCOME
))
```

**Explanation**: The Five Year Plan table was only extracting withdrawal data and completely missing all income sources. This made the table show $0 for pension, CPP, OAS, rental, and other income. The total income was also incorrect because it didn't include these sources.

---

## Fix Summary

### Changes Made

**File 1**: `juan-retirement-app/api/utils/converters.py`
- **Lines 194-195**: Added `employer_pension_p1` and `employer_pension_p2` field mapping in `dataframe_to_year_results()`
- **Lines 798-868**: Completely rewrote `extract_five_year_plan()` to include all income sources and NonReg distributions

### Impact

**Before Fix**:
- ❌ Pension income showed $0 in all views
- ❌ CPP/OAS missing from Five Year Plan
- ❌ Rental/Other income missing from Five Year Plan
- ❌ NonReg distributions missing from Five Year Plan
- ❌ Total income incorrect (missing all income sources)

**After Fix**:
- ✅ Pension income appears in Year by Year view
- ✅ Pension income appears in Five Year Plan
- ✅ CPP/OAS appear in Five Year Plan
- ✅ Rental/Other income appear in Five Year Plan
- ✅ NonReg distributions appear in Five Year Plan
- ✅ Total income correct (includes all sources)

---

## Testing

### Test Scenario: Marc's User Data

**Test File**: `test_pension_fix_marc.py`

**Scenario**:
- Person 1: Age 52, $100,000 pension starting age 52
- Person 2: Age 55, $50,000 pension starting age 55
- Province: Quebec
- Spending: $106,121/year

**Test Results**: ✅ ALL TESTS PASSED (4/4)

```
[TEST 1] YearResult API Response
  Person 1 Pension: $100,000.00 ✅
  Person 2 Pension: $50,000.00 ✅

[TEST 2] Five Year Plan
  Person 1 Pension: $100,000.00 ✅
  Person 2 Pension: $50,000.00 ✅

[TEST 3] Total Income Calculation
  Total Income (all sources): $150,000.00 ✅

[TEST 4] Pension Values (First 5 Years)
  Year 2026: P1=$100,000, P2=$50,000 ✅
  Year 2027: P1=$102,000, P2=$51,000 ✅
  Year 2028: P1=$104,040, P2=$52,020 ✅
  Year 2029: P1=$106,121, P2=$53,060 ✅
  Year 2030: P1=$108,243, P2=$54,122 ✅
```

**Validation**:
- ✅ Pension income in API responses
- ✅ Pension income in Five Year Plan
- ✅ Correct inflation indexing (2% per year)
- ✅ Total income includes pension
- ✅ All calculations accurate

---

## Data Flow (Now Fixed)

### Complete Income Flow

```
┌────────────────────────────────────────────────┐
│ 1. UI: User enters pension income             │
│    Type: "pension"                             │
│    Amount: $100,000                            │
│    Start Age: 52                               │
└────────────────┬───────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────┐
│ 2. Database: Stored in Income table           │
│    type = 'pension'                            │
│    amount = 100000                             │
│    startAge = 52                               │
└────────────────┬───────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────┐
│ 3. API Prefill: Transform to backend format   │
│    pension_incomes = [{                        │
│      name: 'Pension',                          │
│      amount: 100000,                           │
│      startAge: 52,                             │
│      inflationIndexed: true                    │
│    }]                                          │
└────────────────┬───────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────┐
│ 4. Simulation: Process pension income         │
│    simulation.py lines 1506-1519               │
│    ✅ Calculates pension_income_p1             │
│    ✅ Applies inflation indexing               │
│    ✅ Stores in DataFrame as pension_income_p1 │
└────────────────┬───────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────┐
│ 5. Converters: Extract data for API           │
│                                                │
│    dataframe_to_year_results():                │
│    ✅ Maps pension_income_p1 →                 │
│       employer_pension_p1 (API model)          │
│                                                │
│    extract_five_year_plan():                   │
│    ✅ Extracts pension_income_p1 →             │
│       employer_pension_p1 (Five Year Plan)     │
└────────────────┬───────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────┐
│ 6. Frontend: Display pension income           │
│    ✅ Five Year Plan table shows $100k        │
│    ✅ Year by Year view shows $100k           │
│    ✅ Total income includes $100k             │
└────────────────────────────────────────────────┘
```

---

## Related Fixes

This fix also resolves similar issues for:
- ✅ CPP income (missing from Five Year Plan)
- ✅ OAS income (missing from Five Year Plan)
- ✅ Rental income (missing from Five Year Plan)
- ✅ Other income (employment, business, investment - missing from Five Year Plan)
- ✅ NonReg distributions (missing from Five Year Plan)

**Total Fields Fixed**: 15 fields across 2 functions

---

## Files Changed

1. **juan-retirement-app/api/utils/converters.py**
   - Line 194-195: Added pension field mapping
   - Lines 798-868: Rewrote Five Year Plan extraction

2. **juan-retirement-app/test_pension_fix_marc.py** (NEW)
   - Comprehensive test for pension income fix

3. **PENSION_INCOME_FIX_MARC.md** (THIS FILE)
   - Complete documentation of the fix

---

## Why This Happened

**Historical Context**:
- The simulation engine has always calculated pension income correctly
- The pension income was included in tax calculations correctly
- The bug was ONLY in the data extraction layer (converters.py)
- The API response model (`YearResult`) had the fields defined
- The frontend table component expected the fields
- BUT the converters weren't populating them

**Missing Link**: The converters.py file was not extracting pension income from the DataFrame and mapping it to the API response format.

---

## Prevention

To prevent similar issues in the future:

1. **Code Review Checklist**:
   - ✅ Check all API model fields are populated in converters
   - ✅ Verify DataFrame → API model mapping is complete
   - ✅ Test with actual user scenarios (not just unit tests)

2. **Testing Requirements**:
   - ✅ End-to-end tests that validate API responses
   - ✅ Tests that check Five Year Plan data completeness
   - ✅ Tests with multiple income types (pension, rental, other)

3. **Documentation**:
   - ✅ Document field naming conventions (DataFrame vs API model)
   - ✅ Maintain data flow diagrams
   - ✅ Keep converter mapping documentation updated

---

## Deployment

**Status**: ✅ READY FOR DEPLOYMENT

**Next Steps**:
1. Create git commit with fix
2. Push to GitHub main branch
3. Verify Vercel auto-deployment
4. Notify Marc that fix is deployed
5. Monitor production for any issues

---

## User Communication

**Email to Marc**:

Subject: ✅ Pension Income Issue Fixed

Hi Marc,

Good news! I've identified and fixed the issue with your pension income not appearing in the simulation results.

**What was wrong**: The backend was calculating your pension income correctly, but there was a missing step in the data extraction layer that prevented it from being sent to the frontend. Your pensions were being processed for tax calculations, but not displayed in the tables.

**What's fixed**:
- ✅ Pension income now appears in the Five Year Plan table
- ✅ Pension income now appears in the Year by Year breakdown
- ✅ Total income calculations now include pension income
- ✅ All other income types (CPP, OAS, rental, other) also fixed

**Testing**: I created a test scenario matching your exact data ($100k and $50k pensions) and confirmed everything works correctly.

**When**: The fix is being deployed today (February 10, 2026) and should be live within the hour.

**Action**: Please log back into your account and check your simulation. Your pensions should now appear correctly in all views.

Thank you for reporting this issue! It helped us fix a problem that was affecting other users with pension income as well.

Best regards,
Juan & Claude Code Team

---

**Fix Date**: February 10, 2026
**Fixed By**: Claude Code (Sonnet 4.5)
**Reported By**: Marc Rondeau (mrondeau205@gmail.com)
**Status**: ✅ COMPLETE AND TESTED
