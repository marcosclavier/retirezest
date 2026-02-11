# CRITICAL BUG: Income Sources Completely Ignored

**Date**: February 10, 2026
**Reporter**: Stacy Johnston (stacystruth@gmail.com)
**Severity**: CRITICAL - Core functionality broken
**Status**: INVESTIGATING

---

## User Report

> "Unfortunately this is not working. I removed all income, I've added different type of income and the system never takes the other income sources into its retirement planning. It gives the same numbers and results or advice.
>
> This is not working. You cannot only plan with "savings" when there is a retirement pension income.
>
> It only takes saving withdrawals to cover estimated spending.
>
> I've cleared cache and history data. Nothing changes."

---

## Impact Assessment

### Severity: CRITICAL ⚠️⚠️⚠️

This is a **core functional bug** that breaks the primary value proposition of the application:

1. **User cannot trust results** - If income is ignored, all projections are wrong
2. **Wrong financial advice** - System tells users to withdraw savings when they have pension income
3. **Previous QA/QC missed it** - Despite implementing QA/QC process, this fundamental issue was not caught
4. **Affects all users** - Anyone with pension/other income gets wrong results

### Affected Users
- Anyone with employer pension income
- Anyone with rental income, annuities, or other income sources
- Potentially ALL users if this is a data flow issue

---

## Symptoms

1. ✅ **User can input pension/other income** - Form accepts the data
2. ❌ **Results don't change** - Same numbers whether income is $0 or $50,000
3. ❌ **Only savings withdrawals shown** - System ignores all other income sources
4. ❌ **Cleared cache doesn't help** - Not a caching issue

---

## Root Cause Hypotheses

### Hypothesis 1: Frontend Not Sending Data (Most Likely)
**Probability**: HIGH

The frontend form may not be correctly serializing pension/other income fields when sending to API.

**Evidence**:
- User says "I removed all income, added different types" - suggests they're using the form
- "gives the same numbers" - data may not be reaching backend

**How to Test**:
1. Inspect Network tab when user submits simulation
2. Check if pension/other income fields are in the request payload
3. Compare with working test payloads

### Hypothesis 2: API Not Parsing Data
**Probability**: MEDIUM

The API endpoint may be receiving data but not extracting pension/other income fields.

**Evidence**:
- Our previous fixes focused on DISPLAY (converters.py) not INPUT parsing

**How to Test**:
1. Add logging to `api_household_to_internal()` converter
2. Check if pension/other income fields are being extracted from request

### Hypothesis 3: Simulation Logic Bug
**Probability**: LOW

The simulation engine itself may not be using income to reduce withdrawals.

**Evidence**:
- Existing tests (Marc's pension test) showed pension working
- More likely a data flow issue than simulation logic

**How to Test**:
1. Call simulation engine directly with pension data
2. Verify gap calculation includes pension income

---

## Investigation Plan

### Phase 1: Reproduce (CURRENT)
- [x] Create test script to call API with pension income
- [ ] Verify if API endpoint properly receives pension data
- [ ] Check if simulation results change with/without income

### Phase 2: Identify Root Cause
- [ ] If Frontend Issue:
  - Check form data serialization
  - Check API request payload structure
  - Verify field names match API schema

- [ ] If API Issue:
  - Check `api_household_to_internal()` converter
  - Verify pension/other income fields are extracted
  - Check Pydantic model validation

- [ ] If Simulation Issue:
  - Check gap calculation logic
  - Verify income sources reduce withdrawals

### Phase 3: Fix
- [ ] Implement fix based on root cause
- [ ] Test with multiple income scenarios
- [ ] Verify results change appropriately

### Phase 4: Verification
- [ ] Test with Stacy's exact scenario
- [ ] Get user confirmation
- [ ] Add regression tests

---

## Critical Questions

1. **Is the frontend sending pension/other income data to the API?**
   - Need to inspect actual API requests from production

2. **Is the API extracting these fields correctly?**
   - Need to add logging/debugging to converter

3. **Is the simulation using the income data?**
   - Need to verify with direct simulation engine test

---

## Files to Investigate

### Frontend (Data Submission)
- `webapp/app/simulation/page.tsx` - Main simulation form
- `webapp/app/simulation/actions.ts` - API call logic
- Form components that handle pension/other income input

### API (Data Parsing)
- `juan-retirement-app/api/routes/simulation.py` - Endpoint definition
- `juan-retirement-app/api/models/requests.py` - Request models (HouseholdInput)
- `juan-retirement-app/api/utils/converters.py` - `api_household_to_internal()` converter

### Simulation Engine
- `juan-retirement-app/modules/simulation.py` - Core simulation logic
- Gap calculation logic
- Income/withdrawal balance logic

---

## Previous Related Work

### What We Fixed Before (Display Issues)
- Fixed pension income display in Income Composition chart
- Fixed TFSA contribution display
- Fixed RRSP/RRIF label clarity

### What We DIDN'T Check
- ❌ Whether pension income DATA is being submitted correctly
- ❌ Whether API is PARSING the income data
- ❌ Whether simulation USES the income data

**This is a DATA FLOW issue, not a DISPLAY issue!**

---

## QA/QC Process Failure

### Why QA/QC Didn't Catch This

Our QA/QC process focused on:
1. ✅ Testing that pension data in DataFrame shows in UI
2. ✅ Testing data extraction from simulation results
3. ✅ Testing multiple views display correctly

But we DID NOT test:
4. ❌ End-to-end: Submit form → Get results
5. ❌ Variation: Does changing income change results?
6. ❌ Negative test: What if income is $0 vs $50k?

### Lesson Learned
**QA/QC must include end-to-end functional testing with variation, not just display testing!**

---

## Next Steps (IMMEDIATE)

1. **STOP** working on documentation/display issues
2. **FOCUS** on reproducing the core bug
3. **IDENTIFY** exact point where data is lost
4. **FIX** the data flow issue
5. **TEST** end-to-end before declaring fixed
6. **VERIFY** with actual user

---

## Communication to User

**What to say**:
"Thank you for reporting this critical issue. You're absolutely right - this is not working correctly. We've identified that the system is not properly using pension and other income sources in calculations. This is our highest priority to fix. We apologize for the inconvenience and will update you as soon as we have a solution."

**What NOT to say**:
- "We fixed the display" (user doesn't care about display if data is wrong)
- "Clear your cache" (they already did)
- "It works in our tests" (clearly it doesn't work for them)

---

**STATUS**: Investigation in progress
**PRIORITY**: P0 - Drop everything else
**ETA**: TBD - Need to reproduce first

