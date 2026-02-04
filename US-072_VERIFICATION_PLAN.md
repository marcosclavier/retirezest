# US-072 Verification Plan - Employment Income Bug Fix

**Date**: February 4, 2026
**Status**: ⚠️ VERIFICATION REQUIRED BEFORE PRODUCTION DEPLOYMENT
**Fix Committed**: Yes (commit b1a41f4)
**Production Deployment**: BLOCKED until verification complete

---

## 🎯 Verification Objective

Verify that the employment income bug fix works correctly across all test cases before deploying to production, ensuring:
1. Employment income stops at retirement age
2. Pre-retirement tax calculations are correct
3. No regression in retirement income (CPP, OAS, pension)
4. Daniel Gonzalez's simulation shows correct results

---

## ✅ Verification Steps

### Step 1: Local Python Backend Testing (REQUIRED)

**Environment**: Local development
**Location**: `juan-retirement-app/`

#### 1.1 Start Python Backend Locally
```bash
cd /Users/jrcb/Documents/GitHub/retirezest/juan-retirement-app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn api.main:app --reload --port 8000
```

**Expected**: Server starts on http://localhost:8000

#### 1.2 Test API Health Check
```bash
curl http://localhost:8000/api/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "service": "Retirement Simulation API",
  "version": "1.0.0",
  "tax_config_loaded": true,
  "ready": true
}
```

---

### Step 2: Test Daniel Gonzalez Profile (CRITICAL)

**Test Case**: Reproduce original bug scenario

#### 2.1 Create Test Request
```bash
curl -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d '{
    "p1": {
      "name": "Daniel Gonzalez",
      "start_age": 64,
      "retirement_age": 66,
      "tfsa_balance": 100000,
      "rrsp_balance": 500000,
      "rrif_balance": 0,
      "nonreg_balance": 50000,
      "corporate_balance": 0,
      "cpp_start_age": 65,
      "cpp_annual_at_start": 15000,
      "oas_start_age": 65,
      "oas_annual_at_start": 8000,
      "employment_income": 200000,
      "employment_start_age": null,
      "employment_end_age": null
    },
    "p2": {
      "name": "No Partner",
      "start_age": 65,
      "retirement_age": 65
    },
    "province": "AB",
    "strategy": "minimize-income",
    "spending_go_go": 58000,
    "spending_slow_go": 58000,
    "spending_no_go": 58000,
    "end_age": 85,
    "start_year": 2026
  }' > daniel_test_results.json
```

#### 2.2 Verify Results
Open `daniel_test_results.json` and check:

**Year 2026 (Age 64) - Pre-Retirement:**
- [ ] **Total Tax > $50,000** (should be ~$60,000 on $200K income)
- [ ] **Success = true** (not "Gap!" or failure)
- [ ] Employment income is counted

**Year 2027 (Age 65) - Pre-Retirement:**
- [ ] **Total Tax > $50,000** (should be ~$60,000 on $200K income)
- [ ] **Success = true**
- [ ] Employment income is counted

**Year 2028 (Age 66) - Retirement:**
- [ ] **Total Tax < $20,000** (should be ~$10,796 on CPP/OAS)
- [ ] **Success = true**
- [ ] Employment income has stopped
- [ ] CPP/OAS income started

**Overall:**
- [ ] **Success Rate > 90%** (should be ~95%+, not 1%)
- [ ] **Health Score > 90**
- [ ] No errors in response

---

### Step 3: Test Early Retirement (Age 55)

**Test Case**: Verify employment stops at early retirement

```bash
curl -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d '{
    "p1": {
      "name": "Early Retiree",
      "start_age": 50,
      "retirement_age": 55,
      "tfsa_balance": 100000,
      "rrsp_balance": 500000,
      "rrif_balance": 0,
      "nonreg_balance": 50000,
      "corporate_balance": 0,
      "cpp_start_age": 60,
      "cpp_annual_at_start": 10000,
      "oas_start_age": 65,
      "oas_annual_at_start": 8000,
      "employment_income": 100000,
      "employment_start_age": null,
      "employment_end_age": null
    },
    "p2": {
      "name": "No Partner",
      "start_age": 65,
      "retirement_age": 65
    },
    "province": "AB",
    "strategy": "minimize-income",
    "spending_go_go": 40000,
    "spending_slow_go": 40000,
    "spending_no_go": 40000,
    "end_age": 85,
    "start_year": 2026
  }' > early_retirement_results.json
```

**Verify:**
- [ ] Age 50: Tax > $20,000 (employment income counted)
- [ ] Age 54: Tax > $20,000 (employment income counted)
- [ ] Age 55: Tax < $10,000 (employment stopped, no CPP yet)
- [ ] Age 60: Tax increases (CPP starts)

---

### Step 4: Test Late Retirement (Age 70)

**Test Case**: Verify employment continues until late retirement

```bash
curl -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d '{
    "p1": {
      "name": "Late Retiree",
      "start_age": 65,
      "retirement_age": 70,
      "tfsa_balance": 100000,
      "rrsp_balance": 500000,
      "rrif_balance": 0,
      "nonreg_balance": 50000,
      "corporate_balance": 0,
      "cpp_start_age": 70,
      "cpp_annual_at_start": 18000,
      "oas_start_age": 70,
      "oas_annual_at_start": 10000,
      "employment_income": 80000,
      "employment_start_age": null,
      "employment_end_age": null
    },
    "p2": {
      "name": "No Partner",
      "start_age": 65,
      "retirement_age": 65
    },
    "province": "AB",
    "strategy": "minimize-income",
    "spending_go_go": 40000,
    "spending_slow_go": 40000,
    "spending_no_go": 40000,
    "end_age": 85,
    "start_year": 2026
  }' > late_retirement_results.json
```

**Verify:**
- [ ] Age 65: Tax > $15,000 (employment income counted)
- [ ] Age 69: Tax > $15,000 (employment income counted)
- [ ] Age 70: Tax < $15,000 (employment stopped, CPP/OAS started)

---

### Step 5: Regression Test - Retirement Income (CRITICAL)

**Test Case**: Ensure CPP/OAS/pension still work correctly

```bash
curl -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d '{
    "p1": {
      "name": "Retiree No Employment",
      "start_age": 65,
      "retirement_age": 65,
      "tfsa_balance": 100000,
      "rrsp_balance": 0,
      "rrif_balance": 500000,
      "nonreg_balance": 50000,
      "corporate_balance": 0,
      "cpp_start_age": 65,
      "cpp_annual_at_start": 15000,
      "oas_start_age": 65,
      "oas_annual_at_start": 8000
    },
    "p2": {
      "name": "No Partner",
      "start_age": 65,
      "retirement_age": 65
    },
    "province": "AB",
    "strategy": "minimize-income",
    "spending_go_go": 50000,
    "spending_slow_go": 50000,
    "spending_no_go": 50000,
    "end_age": 85,
    "start_year": 2026
  }' > regression_test_results.json
```

**Verify:**
- [ ] Age 65: CPP = $15,000, OAS = $8,000 (both present)
- [ ] Tax calculated correctly on retirement income
- [ ] RRIF minimum withdrawals working
- [ ] No employment income present (as expected)

---

### Step 6: Test Multiple Income Sources

**Test Case**: Employment + Rental income

```bash
curl -X POST http://localhost:8000/api/run-simulation \
  -H "Content-Type: application/json" \
  -d '{
    "p1": {
      "name": "Multiple Incomes",
      "start_age": 64,
      "retirement_age": 66,
      "tfsa_balance": 100000,
      "rrsp_balance": 500000,
      "rrif_balance": 0,
      "nonreg_balance": 50000,
      "corporate_balance": 0,
      "cpp_start_age": 65,
      "cpp_annual_at_start": 15000,
      "oas_start_age": 65,
      "oas_annual_at_start": 8000,
      "employment_income": 100000,
      "employment_start_age": null,
      "employment_end_age": null,
      "rental_income": 24000,
      "rental_start_age": null,
      "rental_end_age": null
    },
    "p2": {
      "name": "No Partner",
      "start_age": 65,
      "retirement_age": 65
    },
    "province": "AB",
    "strategy": "minimize-income",
    "spending_go_go": 50000,
    "spending_slow_go": 50000,
    "spending_no_go": 50000,
    "end_age": 85,
    "start_year": 2026
  }' > multiple_income_results.json
```

**Verify:**
- [ ] Age 64: Tax > $30,000 (employment $100K + rental $24K = $124K total)
- [ ] Age 66: Tax ~$10-15K (rental $24K + CPP/OAS ~$23K = ~$47K total, no employment)
- [ ] Rental income continues after retirement
- [ ] Employment stops at retirement

---

## 📊 Verification Checklist

### Before Production Deployment:

- [ ] **Step 1**: Python backend starts successfully
- [ ] **Step 2**: Daniel Gonzalez test passes (tax > $50K in 2026-2027, success rate > 90%)
- [ ] **Step 3**: Early retirement test passes
- [ ] **Step 4**: Late retirement test passes
- [ ] **Step 5**: Regression test passes (CPP/OAS/pension unaffected)
- [ ] **Step 6**: Multiple income sources test passes
- [ ] **All tests**: Zero errors in API responses
- [ ] **Code Review**: Second developer reviews changes
- [ ] **Documentation**: All docs updated (AGILE_BACKLOG, bug analysis, sprint plan)

### Production Deployment Criteria:

✅ All 6 test cases pass
✅ No regressions in existing functionality
✅ Daniel Gonzalez's scenario shows correct results
✅ Code reviewed and approved
✅ Documentation complete

**Only proceed to production if ALL criteria are met.**

---

## 🚀 Production Deployment Steps (AFTER VERIFICATION)

### 1. Deploy Python Backend
```bash
# Push to production branch
git push origin main

# Railway/Render will auto-deploy
# Monitor deployment logs for errors
```

### 2. Verify Production Deployment
```bash
# Test production API health
curl https://retirezest-python-api.railway.app/api/health

# Expected: {"status": "ok", "ready": true}
```

### 3. Re-run Daniel's Simulation in Production
- Log into production database
- Find Daniel's user account (danjgonzalezm@gmail.com)
- Trigger simulation re-run via Next.js API
- Verify results show correct tax amounts

### 4. Notify Daniel Gonzalez
Send email:
```
Subject: Your RetireZest simulation has been corrected

Hi Daniel,

We discovered and fixed a bug that was affecting your retirement simulation.

The issue: Employment income wasn't being properly counted in years before
your retirement age.

Your updated results now show:
✅ Correct tax calculations for 2026-2027
✅ Accurate success rate (95%+ instead of 1%)
✅ Proper cash flow projections

We've re-run your simulation with the fix. Please log in to see your
updated results.

We apologize for any confusion this may have caused. Your retirement plan
looks great!

Best regards,
RetireZest Team
```

---

## 🔍 Monitoring Post-Deployment

### Week 1 After Deployment:

- [ ] Monitor error logs for income calculation errors
- [ ] Check user simulation success rates (should increase overall)
- [ ] Watch for user reports of incorrect tax calculations
- [ ] Review Daniel Gonzalez's new simulation results
- [ ] Monitor other pre-retirement users for correct behavior

### Success Metrics:

- ✅ Daniel's success rate: 1% → 95%+
- ✅ Zero user reports of employment income bugs
- ✅ Pre-retirement users show correct tax amounts
- ✅ Overall simulation success rates increase
- ✅ No regression bugs reported

---

## ⚠️ Rollback Plan (IF ISSUES ARISE)

If verification fails or production issues occur:

### Immediate Rollback:
```bash
# Revert commit
git revert b1a41f4

# Push to production
git push origin main

# Notify affected users
```

### Investigate and Fix:
1. Document the issue
2. Create new test case for the failure scenario
3. Fix the bug
4. Re-run full verification suite
5. Re-deploy with additional testing

---

## 📝 Test Results Log

**Tester**: _____________
**Date**: _____________
**Environment**: Local / Staging / Production

| Test Case | Status | Notes |
|-----------|--------|-------|
| Step 1: Backend Health | ⬜ Pass / ⬜ Fail | |
| Step 2: Daniel Gonzalez | ⬜ Pass / ⬜ Fail | |
| Step 3: Early Retirement | ⬜ Pass / ⬜ Fail | |
| Step 4: Late Retirement | ⬜ Pass / ⬜ Fail | |
| Step 5: Regression Test | ⬜ Pass / ⬜ Fail | |
| Step 6: Multiple Incomes | ⬜ Pass / ⬜ Fail | |

**Overall Result**: ⬜ PASS - APPROVED FOR PRODUCTION / ⬜ FAIL - DO NOT DEPLOY

**Approver Signature**: _____________
**Date**: _____________

---

**Status**: ⚠️ VERIFICATION IN PROGRESS
**Next Step**: Execute Step 1 (Start Python Backend Locally)
**Blocker**: Cannot deploy to production until all tests pass
