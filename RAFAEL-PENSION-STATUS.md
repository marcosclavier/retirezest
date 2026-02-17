# Rafael's $100,000 Pension - Current Status

## Issue Summary
Rafael's $100,000 pension (starting at age 67) is:
- ✅ Saved correctly in the database
- ✅ Loaded correctly by the prefill API
- ✅ Sent correctly from frontend to Python API
- ✅ Calculated correctly by Python backend (shows $102,000 in 2033 with inflation)
- ❌ **BUT displays as $0 in the UI simulation results**

## Test Results

### Direct Python API Test (WORKS)
When calling Python API directly with test script:
```
Year 2033 (Age 67):
✅ Private Pension Income: $102,000 (correctly inflation-adjusted)
```

### UI Simulation (FAILS)
When running through the UI:
```
Year 2033 (Age 67):
❌ Employer Pension: $0
```

## Data Flow Verification

### 1. Database → Prefill API
✅ WORKING: Pension loads from database correctly
- Fixed null reference errors in prefill route
- Profile now loads with $100,000 pension visible

### 2. Frontend → Python API
✅ WORKING: Pension data is sent in request
```javascript
// Frontend logs show:
"🎯 P1 pension_incomes in request: [{"name":"Pension","amount":100000,"startAge":67,"inflationIndexed":true}]"
```

### 3. Python API Processing
✅ WORKING: Backend calculates pension correctly
- `simulation.py` processes pension_incomes at line 1507-1529
- Pension income is stored in info dictionary at line 2287
- Converted to YearResult with pension_income_p1 field at line 3329

### 4. API Response Mapping
✅ CONFIGURED: Converter maps pension_income_p1 → employer_pension_p1
- `converters.py` line 207-208 maps the fields correctly

## The Problem

The issue appears to be in how the simulation results are being processed or displayed in the UI. The backend IS calculating the pension correctly, but the value isn't making it to the final display.

## Files Modified So Far

1. **Python API Models** - `/webapp/python-api/api/models/requests.py`
   - Added pension_incomes and other_incomes fields to PersonInput

2. **Python API Converter** - `/webapp/python-api/api/utils/converters.py`
   - Added mapping for pension fields from API to simulation engine

3. **Simulation Run Route** - `/webapp/app/api/simulation/run/route.ts`
   - Fixed data transformation to preserve pension_incomes

4. **Prefill Route** - `/webapp/app/api/simulation/prefill/route.ts`
   - Fixed JavaScript scope issues and null references

## Next Steps to Investigate

1. **Check if pension_income_p1 exists in the DataFrame**
   - Add logging to verify the DataFrame has the pension_income_p1 column

2. **Verify API response contains employer_pension_p1**
   - Log the actual API response to see if employer_pension_p1 is non-zero

3. **Check UI display logic**
   - Verify the frontend is correctly displaying employer_pension_p1 field

## Deployment Notes

When this is fully fixed, both services need redeployment:

### Python API (Railway)
- `api/models/requests.py` - Updated PersonInput model
- `api/utils/converters.py` - Updated converter mapping

### Frontend (Vercel)
- `app/api/simulation/run/route.ts` - Fixed data transformation
- `app/api/simulation/prefill/route.ts` - Fixed null references