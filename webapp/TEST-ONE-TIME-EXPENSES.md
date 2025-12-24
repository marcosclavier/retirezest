# Pre-Deployment Testing - One-Time Expenses Feature

**Date:** December 24, 2025
**Feature:** One-Time Expenses (Tracking Only - Phase 1)
**Tester:** _________________
**Environment:** Local Dev (http://localhost:3000)

## Pre-Test Checklist

- [ ] Dev server is running (`npm run dev`)
- [ ] Database is accessible (Neon production DB)
- [ ] Test user credentials available: marcos.clavier33@gmail.com / NewPassword123
- [ ] Browser dev tools open (check console for errors)

---

## Test Suite

### ✅ Test 1: TypeScript Compilation

**Command:**
```bash
npx tsc --noEmit
```

**Expected Result:** No TypeScript errors
**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 2: Login and Navigation

**Steps:**
1. Navigate to http://localhost:3000
2. Click "Sign In"
3. Login with marcos.clavier33@gmail.com / NewPassword123
4. Navigate to Profile → Expenses

**Expected Results:**
- [ ] Login successful
- [ ] Redirected to dashboard
- [ ] Can navigate to Expenses page
- [ ] Blue notice box visible: "One-time expenses are tracked here but not yet included in retirement simulations"
- [ ] No console errors

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 3: Create One-Time Expense - Car 2027

**Steps:**
1. Click "Add Expense"
2. Category: "Transportation"
3. Expense Type: "One-Time / Major Planned Expense"
4. Planned Year: 2027
5. Amount: 30000
6. Description: "Buying a new car"
7. Essential: Unchecked
8. Click "Add Expense"

**Expected Results:**
- [ ] Form switches to show "Planned Year" field (not frequency)
- [ ] Can enter year 2027
- [ ] Form submits successfully
- [ ] Expense appears in list immediately
- [ ] Purple badge shows "One-Time (2027)"
- [ ] Amount displays as "$30,000"
- [ ] Shows "Planned for 2027" (not frequency)
- [ ] Green "Discretionary" badge visible
- [ ] No console errors

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 4: Create One-Time Expense - Gifts 2029

**Steps:**
1. Click "Add Expense"
2. Category: "Gifts"
3. Expense Type: "One-Time / Major Planned Expense"
4. Planned Year: 2029
5. Amount: 25000
6. Description: "Gifts for children"
7. Click "Add Expense"

**Expected Results:**
- [ ] Expense created successfully
- [ ] Purple badge shows "One-Time (2029)"
- [ ] Amount displays as "$25,000"

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 5: Create One-Time Expense - Roof 2031

**Steps:**
1. Click "Add Expense"
2. Category: "Housing"
3. Expense Type: "One-Time / Major Planned Expense"
4. Planned Year: 2031
5. Amount: 10000
6. Description: "Roof replacement"
7. Essential: **Checked**
8. Click "Add Expense"

**Expected Results:**
- [ ] Expense created successfully
- [ ] Purple badge shows "One-Time (2031)"
- [ ] **Red** "Essential" badge visible
- [ ] Amount displays as "$10,000"

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 6: Create Recurring Expense (Control Test)

**Steps:**
1. Click "Add Expense"
2. Category: "Food & Groceries"
3. Expense Type: "Recurring Expense" (default)
4. Frequency: "Monthly"
5. Amount: 500
6. Description: "Groceries"
7. Click "Add Expense"

**Expected Results:**
- [ ] Form shows frequency dropdown (not planned year)
- [ ] Expense created successfully
- [ ] **No purple badge** (this is recurring)
- [ ] Displays as "$500 / monthly"
- [ ] Shows "$6,000 / year" conversion

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 7: Edit One-Time Expense

**Steps:**
1. Click "Edit" on the Car expense
2. Verify form populates correctly
3. Change Planned Year from 2027 to 2028
4. Change Amount from 30000 to 35000
5. Click "Update Expense"

**Expected Results:**
- [ ] Form opens with "One-Time" pre-selected
- [ ] Planned Year field shows 2027
- [ ] Amount field shows 30000
- [ ] Can update values
- [ ] Update saves successfully
- [ ] Badge now shows "One-Time (2028)"
- [ ] Amount shows "$35,000"

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 8: Validation - Past Year

**Steps:**
1. Click "Add Expense"
2. Expense Type: "One-Time / Major Planned Expense"
3. Planned Year: 2020 (past year)
4. Amount: 1000
5. Try to submit

**Expected Results:**
- [ ] Validation error appears OR
- [ ] HTML5 validation prevents submission (min year = 2025)
- [ ] Expense is NOT created

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 9: Validation - Missing Planned Year

**Steps:**
1. Click "Add Expense"
2. Expense Type: "One-Time / Major Planned Expense"
3. Leave Planned Year empty
4. Amount: 1000
5. Try to submit

**Expected Results:**
- [ ] HTML5 required field validation appears
- [ ] Cannot submit form
- [ ] Expense is NOT created

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 10: Delete One-Time Expense

**Steps:**
1. Click "Delete" on the Gifts expense
2. Confirm deletion in popup
3. Check expense list

**Expected Results:**
- [ ] Confirmation dialog appears
- [ ] After confirming, expense is removed from list
- [ ] Other expenses remain intact
- [ ] No console errors

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 11: Data Persistence

**Steps:**
1. Note current one-time expenses displayed
2. Refresh the page (F5 or Cmd+R)
3. Check expense list

**Expected Results:**
- [ ] All one-time expenses still appear
- [ ] Purple badges and years are correct
- [ ] All details match (amounts, descriptions, essential flags)

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 12: Database Verification

**Steps:**
```sql
-- Run in Neon database console
SELECT
  description,
  amount,
  frequency,
  "isRecurring",
  "plannedYear",
  category,
  essential
FROM "Expense"
WHERE "userId" = 'c5a9b853-0ad9-406f-8920-9db618c20c6d'
  AND "isRecurring" = false
ORDER BY "plannedYear" ASC;
```

**Expected Results:**
- [ ] Query returns 3 one-time expenses (car, gifts, roof)
- [ ] isRecurring = false for all
- [ ] plannedYear values are correct (2028, 2029, 2031)
- [ ] frequency = "one-time" for all

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 13: Simulation Not Affected

**Steps:**
1. Navigate to Simulation page
2. Run a simulation with default settings
3. Check simulation results

**Expected Results:**
- [ ] Simulation runs successfully
- [ ] No errors related to expenses
- [ ] Results show normal spending (no one-time expenses included)
- [ ] No console errors

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 14: Scenarios Not Affected

**Steps:**
1. Navigate to Scenarios page
2. View existing scenarios OR create a new scenario
3. Check scenario details

**Expected Results:**
- [ ] Scenarios page loads normally
- [ ] Can view/edit scenarios
- [ ] No errors related to expenses
- [ ] Scenario expense field still uses single `annualExpenses` value

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

### ✅ Test 15: Browser Console Check

**Steps:**
1. Throughout all tests, monitor browser console
2. Check for any errors, warnings, or issues

**Expected Results:**
- [ ] No JavaScript errors
- [ ] No React errors
- [ ] No API errors
- [ ] CSRF warnings are expected (normal behavior)

**Status:** [ ] PASS [ ] FAIL
**Notes:** _______________________________________________

---

## Test Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | TypeScript Compilation | [ ] P [ ] F | |
| 2 | Login and Navigation | [ ] P [ ] F | |
| 3 | Create One-Time - Car | [ ] P [ ] F | |
| 4 | Create One-Time - Gifts | [ ] P [ ] F | |
| 5 | Create One-Time - Roof | [ ] P [ ] F | |
| 6 | Create Recurring (Control) | [ ] P [ ] F | |
| 7 | Edit One-Time Expense | [ ] P [ ] F | |
| 8 | Validation - Past Year | [ ] P [ ] F | |
| 9 | Validation - Missing Year | [ ] P [ ] F | |
| 10 | Delete One-Time Expense | [ ] P [ ] F | |
| 11 | Data Persistence | [ ] P [ ] F | |
| 12 | Database Verification | [ ] P [ ] F | |
| 13 | Simulation Not Affected | [ ] P [ ] F | |
| 14 | Scenarios Not Affected | [ ] P [ ] F | |
| 15 | Browser Console Check | [ ] P [ ] F | |

**Overall Result:** [ ] ALL PASS - Ready for Deployment [ ] FAILURES - Fix Required

---

## Deployment Checklist

After all tests pass:

- [ ] All tests marked as PASS
- [ ] No console errors observed
- [ ] Database contains correct data
- [ ] Blue notice box is visible to users
- [ ] Documentation updated (ONE-TIME-EXPENSES-IMPLEMENTATION.md)
- [ ] Commit changes with descriptive message
- [ ] Push to GitHub
- [ ] Deploy to Vercel production

---

## Test Notes

**Environment Details:**
- Browser: _______________
- Database: Neon Production
- Node Version: _______________
- Next.js Version: 15.5.9

**Issues Found:**
_______________________________________________
_______________________________________________
_______________________________________________

**Tester Signature:** _________________
**Date Completed:** _________________
**Time Spent:** _________________
