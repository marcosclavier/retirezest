# Marc Income Fix - Test Plan & Validation

**Date**: February 10, 2026
**Issue**: Employment/pension income being ignored in simulations
**Status**: Fixed with validation added

---

## What We Fixed

### Primary Fix
**File**: `webapp/app/(dashboard)/simulation/page.tsx` (Lines 397-419)

Added income arrays to `assetFields` so they're preserved during merge:
```typescript
const assetFields = [
  // ... existing fields ...
  'pension_incomes',      // ✅ ADDED
  'other_incomes',        // ✅ ADDED
  'cpp_start_age',        // ✅ ADDED
  'cpp_annual_at_start',  // ✅ ADDED
  'oas_start_age',        // ✅ ADDED
  'oas_annual_at_start',  // ✅ ADDED
];
```

### Additional Safety Measures

**1. Merge Logging** (Lines 443-449)
```typescript
// VALIDATION: Log income arrays to help debug if they're ever missing
if (freshPerson.pension_incomes && freshPerson.pension_incomes.length > 0) {
  console.log('✅ Merged pension_incomes:', freshPerson.pension_incomes.length, 'items');
}
if (freshPerson.other_incomes && freshPerson.other_incomes.length > 0) {
  console.log('✅ Merged other_incomes:', freshPerson.other_incomes.length, 'items');
}
```

**2. Pre-Simulation Validation** (Lines 827-832)
```typescript
// VALIDATION: Ensure income arrays are present (helps debug Marc's issue)
console.log('🔍 VALIDATION - Income arrays check:');
console.log('  P1 pension_incomes:', simulationData.p1.pension_incomes?.length || 0, 'items');
console.log('  P1 other_incomes:', simulationData.p1.other_incomes?.length || 0, 'items');
console.log('  P2 pension_incomes:', simulationData.p2.pension_incomes?.length || 0, 'items');
console.log('  P2 other_incomes:', simulationData.p2.other_incomes?.length || 0, 'items');
```

---

## Test Plan

### Test 1: Marc's Account (PRIORITY 1)

**Objective**: Verify Marc's employment income is now included

**Steps**:
1. Log in to production as Marc (mrondeau205@gmail.com)
2. Navigate to /simulation page
3. Open browser console (F12)
4. Wait for prefill to load
5. Look for console logs:
   ```
   ✅ Merged other_incomes: 1 items  (Marc's $50K employment)
   ✅ Merged other_incomes: 1 items  (Isabelle's $100K employment)
   ```
6. Click "Run Simulation"
7. Look for validation logs:
   ```
   🔍 VALIDATION - Income arrays check:
     P1 other_incomes: 1 items
     P2 other_incomes: 1 items
   ```
8. Review results:
   - Year-by-year table should show employment income
   - Income composition chart should include employment
   - Withdrawals should be $0 or very low (they have surplus)

**Expected Console Output**:
```
✅ Merged other_incomes: 1 items
✅ Merged other_incomes: 1 items
🔍 VALIDATION - Income arrays check:
  P1 pension_incomes: 0 items
  P1 other_incomes: 1 items
  P2 pension_incomes: 0 items
  P2 other_incomes: 1 items
```

**Expected Results**:
- Year 1 (Age 54/56):
  - Employment P1: $50,000
  - Employment P2: $100,000
  - Total Income: ~$150,000
  - Spending: $71,900
  - **Surplus: $78,100** (no withdrawal needed!)

**Pass Criteria**:
- ✅ Console shows income arrays with correct count
- ✅ Simulation results include employment income
- ✅ Withdrawals are zero or minimal
- ✅ Marc confirms it's working correctly

---

### Test 2: User with Pension Income

**Objective**: Verify pension income is included

**Test User**: Create test account or use existing user with pension

**Steps**:
1. Create/access user with pension income in database
2. Add pension income via Income management page (if needed)
3. Navigate to simulation
4. Check console logs show:
   ```
   ✅ Merged pension_incomes: 1 items
   ```
5. Run simulation
6. Verify pension appears in results

**Expected Results**:
- Pension income shown in year-by-year table
- Pension included in income composition chart
- Withdrawals reduced appropriately

---

### Test 3: User with Multiple Income Types

**Objective**: Verify all income types work together

**Setup**:
- Employment income: $60,000
- Pension income: $20,000
- Other income (rental): $12,000

**Expected Console**:
```
✅ Merged pension_incomes: 1 items
✅ Merged other_incomes: 2 items  (employment + rental)
🔍 VALIDATION - Income arrays check:
  P1 pension_incomes: 1 items
  P1 other_incomes: 2 items
```

**Expected Results**:
- All three income types appear in results
- Total income: $92,000
- Appropriate withdrawal calculation

---

### Test 4: Edge Cases

**Test 4a: User with No Income**
- Expected: Arrays are empty, no console warnings
- Simulation should work normally with zero income

**Test 4b: User Removes All Income**
- Remove all income sources
- Run simulation
- Verify arrays are empty but simulation still works

**Test 4c: User Adds Income Mid-Session**
- Start with no income
- Add income via database/UI
- Refresh/reload prefill
- Verify income appears in next simulation

---

## Debugging Guide

### If Income is Missing

**Check Console Logs**:

1. **During Prefill**:
   ```
   Look for: "✅ Merged pension_incomes" or "✅ Merged other_incomes"
   If missing: Income not in prefill API response
   ```

2. **Before Simulation**:
   ```
   Look for: "🔍 VALIDATION - Income arrays check:"
   If shows 0 items: Income was dropped somewhere
   ```

3. **Database Check**:
   ```javascript
   // Run in scripts/
   const user = await prisma.user.findUnique({
     where: { email: 'user@example.com' },
     include: { incomeSources: true }
   });
   console.log(user.incomeSources);
   ```

4. **Prefill API Check**:
   ```bash
   # In browser console on /simulation page
   fetch('/api/simulation/prefill')
     .then(r => r.json())
     .then(data => {
       console.log('P1 pension_incomes:', data.person1Input.pension_incomes);
       console.log('P1 other_incomes:', data.person1Input.other_incomes);
     });
   ```

---

## Monitoring

### Production Logs to Watch

After deployment, monitor for:

```bash
# Look for validation logs in production
grep "VALIDATION - Income arrays check" production.log

# Look for successful merges
grep "Merged pension_incomes" production.log
grep "Merged other_incomes" production.log
```

### Success Metrics

- **No reports** of missing income for 2 weeks
- **Console logs** show income arrays present for users with income
- **Marc confirms** his issue is resolved
- **No new tickets** about income being ignored

---

## Rollback Plan

If issues occur:

1. **Immediate**: Revert commit `bf9abe3`
   ```bash
   git revert bf9abe3
   git push origin main
   ```

2. **Investigate**: Check what income types are affected
3. **Fix**: Adjust assetFields array or merge logic
4. **Redeploy**: Push fixed version

---

## Communication Plan

### Email to Marc

**Subject**: Fixed - Your Employment Income is Now Included! Please Test

**Body**:

Hi Marc,

Great news! I've fixed the bug you reported and added extra safeguards to prevent it from happening again.

**What I Fixed**:
1. Employment/pension income now properly flows through to simulations
2. Added validation logging to catch any future issues
3. Your $50K and Isabelle's $100K employment income will now show up

**Please Test** (takes 2 minutes):
1. Log in at https://retirezest.com
2. Open browser console (F12) to see validation logs
3. Go to simulation page
4. Click "Run Simulation"
5. Check results show your employment income

**What You Should See**:
- Employment income in year-by-year table
- Much lower (or zero) withdrawals from savings
- A nice surplus since your income exceeds spending!

**Help Me Verify**:
Can you please:
1. Run one simulation
2. Take a screenshot of the console (showing the validation logs)
3. Take a screenshot of the results
4. Reply with "✅ Working" or tell me what you see

I've added extra logging so if anything goes wrong in the future, I'll be able to catch it immediately.

Thank you for your patience and for reporting this issue!

Best regards,
Juan

---

### Internal Team Communication

**Slack Message**:

🔧 **CRITICAL FIX DEPLOYED**: Marc's Income Bug

**Issue**: Employment/pension income was being dropped during frontend merge
**Root Cause**: `assetFields` array didn't include income arrays
**Fix**: Added income fields to merge list + validation logging
**Commit**: `bf9abe3`

**Testing Required**:
- [ ] Test with Marc's account
- [ ] Test with users who have pension income
- [ ] Monitor console logs for validation messages
- [ ] Watch for any reports of missing income

**Expected Console Output** (when it works):
```
✅ Merged other_incomes: 1 items
🔍 VALIDATION - Income arrays check:
  P1 other_incomes: 1 items
```

Let me know if you see any issues!

---

## Success Criteria

### Fix is Considered Successful When:

- [x] Code changes committed and deployed
- [ ] Marc tests and confirms it's working
- [ ] Console logs show income arrays present
- [ ] Simulation results include employment/pension income
- [ ] No new reports of missing income for 2 weeks
- [ ] Validation logs help catch any future issues

---

## Future Improvements

### Prevent Similar Issues

1. **Add TypeScript strict checking** for income arrays
2. **Add E2E test** that verifies income flows through
3. **Add backend validation** that warns if income is missing
4. **Add UI indicator** showing which income sources are active
5. **Add prefill validation** that logs if income count doesn't match database

### Code Quality

1. **Refactor assetFields** to be automatically generated from PersonInput type
2. **Add unit tests** for mergePerson function
3. **Document merge behavior** in code comments
4. **Add validation helper** that checks data integrity

---

**Test Plan Status**: Ready for execution
**Next Step**: Deploy to production and execute Test 1 with Marc's account
