# Steven Morehouse - Critical Bugs Analysis

**Date**: February 1, 2026
**User**: steven.morehouse@gmail.com
**Account Lifetime**: 18 minutes (Created 03:47, Deleted 04:05)
**Deletion Reason**: *"Plenty of reasons: Just didn't work. Hit simulation, nothing. Says free, but then $9.99/mo. No RESP."*

---

## 🚨 THREE CRITICAL BUGS IDENTIFIED

### Bug #1: Simulation Silent Failure (P0 - CRITICAL)

**Problem**: User clicked "Run Simulation" but got no results

**Evidence**:
- Scenario created: 2026-02-01T04:00:49.330Z
- Scenario ID: `f8891b62-4e8c-40d0-851c-a0ab360c2537`
- Current Age: 65
- Retirement Age: 65
- **Result field: NULL** ← Simulation never completed
- User deleted account 5 minutes later

**User Impact**: User tried to run simulation, saw loading/spinner, then NOTHING. Silent failure.

**Root Cause (Suspected)**:
1. Simulation API call failed without error message to user
2. Frontend shows loading state but never shows error or result
3. Possible backend Python simulation crash
4. Possible API timeout without proper error handling

**Files to Investigate**:
1. `/webapp/app/(dashboard)/simulation/page.tsx` - Frontend simulation trigger
2. `/webapp/app/api/simulation/run/route.ts` - API endpoint
3. `/juan-retirement-app/modules/simulation.py` - Python backend
4. Error logging/handling for simulation failures

**Fix Required**:
1. Add proper error handling to simulation API
2. Show clear error messages to user (not silent failure)
3. Add logging to track simulation failures
4. Test end-to-end simulation flow
5. Add timeout handling (show error after 30s)

---

### Bug #2: Incorrect Pricing Display - Shows $9.99 Instead of $5.99 (P0 - REVENUE CRITICAL)

**Problem**: App displays **$9.99/month** but actual Stripe price is **$5.99 CAD/month**

**Evidence from Stripe**:
```
Product: RetireZest Premium Subscription
Price ID: price_1SrmOdRogd0pJoDaBte1RF50
Amount: CAD $5.99/month
Billing: 1 month
Active: true
```

**Hardcoded $9.99 found in 9 files**:
1. `/webapp/components/modals/UpgradeModal.tsx` - Line 92: `$9.99`
2. `/webapp/components/simulation/ResultsDashboard.tsx`
3. `/webapp/app/(dashboard)/account/billing/page.tsx`
4. `/webapp/app/api/early-retirement/calculate/route.ts`
5. `/webapp/scripts/test-cra-constants.ts`
6. `/webapp/components/modals/UpgradeModal.tsx`
7. `/webapp/lib/calculations/oas.ts`
8. `/webapp/lib/reports/generatePDF.ts`
9. `/webapp/test-calculations.ts`
10. `/webapp/test-calculations.js`

**User Complaint**: "Says free, but then $9.99/mo"

This means:
- User saw "free" somewhere (homepage? signup?)
- Then saw "$9.99/mo" in upgrade modal
- **Both were wrong** (actual price is $5.99/mo)

**Fix Required**:
1. Change all `$9.99` to `$5.99` in the 9+ files above
2. Verify Stripe checkout uses correct price ID
3. Ensure consistent messaging: clarify free tier limits
4. Add environment variable for pricing (don't hardcode)

**Recommended Approach**:
```typescript
// lib/pricing.ts
export const PREMIUM_MONTHLY_PRICE = '$5.99';
export const PREMIUM_MONTHLY_PRICE_CAD = 5.99;
export const STRIPE_PRICE_ID = process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!;
```

Then import and use `PREMIUM_MONTHLY_PRICE` everywhere instead of hardcoding.

---

### Bug #3: Missing RESP Support (P1 - Feature Gap)

**Problem**: User wanted RESP (Registered Education Savings Plan) support, which is missing

**Context**:
- RESP is a Canadian tax-advantaged account for children's education
- Similar to RRSP/TFSA but for education savings
- Important for users with children

**User Impact**: Cannot plan for children's education savings

**Current Account Support**:
- ✅ RRSP (Registered Retirement Savings Plan)
- ✅ TFSA (Tax-Free Savings Account)
- ✅ LIRA (Locked-In Retirement Account) - Added in Sprint 5
- ✅ Non-Registered accounts
- ❌ RESP - **MISSING**

**Fix Required (Backlog for Sprint 7+)**:
1. Add RESP account type to database schema
2. Add RESP to onboarding/assets page
3. Add RESP withdrawal logic (for education expenses)
4. Add RESP contribution room tracking
5. Add CESG (Canada Education Savings Grant) calculations

**Not blocking for immediate fixes** - add to backlog as US-048

---

## 📊 Timeline Analysis

**User Journey**:
- 03:47:49 - Created account
- 04:00:49 - Created scenario (13 minutes after signup)
- 04:00:49 to 04:05:56 - Tried to run simulation, got nothing (5 minutes of frustration)
- 04:05:56 - Deleted account with complaint

**Key Insight**: User spent 13 minutes setting up profile/scenario, then only 5 minutes trying to get results before giving up. This indicates **severe UX failure** - the simulation didn't work and gave no feedback.

---

## 🎯 Fix Priority

### Immediate (Today - P0):
1. **Fix Bug #1** (Simulation failure) - 2-3 hours
   - Add error handling
   - Add user-facing error messages
   - Test end-to-end

2. **Fix Bug #2** (Pricing) - 1 hour
   - Change $9.99 to $5.99 in all 9+ files
   - Create pricing constant
   - Verify Stripe integration

### Follow-up (This Week):
3. Send re-engagement email to Steven Morehouse
4. Monitor for similar simulation failures from other users
5. Add simulation failure logging/monitoring

### Backlog (Sprint 7+):
6. **Add RESP Support** (Bug #3) - Create as US-048 (8 pts)

---

## 💡 User Re-engagement Plan

**Email to Steven Morehouse**:

Subject: We fixed the issues you reported - please give us another try

Body:
```
Hi Steven,

I'm writing to apologize for the frustrating experience you had with RetireZest on February 1st. Your feedback was incredibly valuable, and I want you to know we took it seriously.

You were right about three specific issues:

1. ✅ **"Hit simulation, nothing"** - FIXED. We discovered a silent failure in our simulation engine and added proper error handling and user feedback.

2. ✅ **"Says free, but then $9.99/mo"** - FIXED. The correct premium price is $5.99 CAD/month (40% less than what was incorrectly displayed!). We've updated all pricing across the site.

3. ⏳ **"No RESP"** - We've added RESP support to our roadmap for the next sprint. This is a feature several Canadian users have requested.

We'd love to have you back. Your account is still active (we restore deleted accounts for 30 days), and I'd personally make sure you have a smooth experience this time.

Would you be willing to give us another try? I'm happy to hop on a 10-minute call to walk you through it personally.

Best regards,
[Name]
RetireZest Team

P.S. As an apology, I'd like to offer you 3 months of Premium for free. Just reply to this email if you're interested.
```

---

## 🔍 Additional Investigation Needed

1. **Check server logs** for simulation failures around 04:00-04:05 on Feb 1
2. **Test simulation API** with scenario ID `f8891b62-4e8c-40d0-851c-a0ab360c2537` input
3. **Review error logging** - are simulation failures being logged anywhere?
4. **Check frontend console** - would user have seen JavaScript errors?
5. **Test with age 65, retirement 65** - is this edge case causing failures?

---

## 📈 Success Metrics

After fixes are deployed, monitor:
- Simulation success rate (target: >95%)
- Time to first successful simulation (target: <2 min)
- User account retention after first simulation (target: >60%)
- Upgrade modal pricing display (verify $5.99 everywhere)

---

**Status**: Ready for immediate action
**Estimated Fix Time**: 3-4 hours
**User Re-engagement**: Email drafted, ready to send after fixes deployed
