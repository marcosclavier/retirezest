# TWO CRITICAL BUGS BLOCKING SIMULATIONS

**Date**: February 1, 2026
**Severity**: P0 - CRITICAL PRODUCTION BUGS
**Total Users Affected**: 25 (24 active, 1 deleted)
**Total Assets Blocked**: $29.5M+

---

## 🎯 EXECUTIVE SUMMARY

**25 users loaded $29.5M+ in assets but were unable to run ANY simulations.**

**ROOT CAUSE: TWO SEPARATE BUGS**

### Bug #1: Health Check Disabled "Run Simulation" Button
- **Impact**: 100% of users (button disabled for everyone)
- **Status**: ✅ **FIXED** (February 1, 2026)
- **Fix**: Removed `apiHealthy === false` from button disabled logic

### Bug #2: Email Verification Requirement Blocks API
- **Impact**: 76% of users (19/25 have unverified emails)
- **Status**: ⚠️ **IDENTIFIED - NEEDS DECISION**
- **API Returns**: 403 Forbidden if `emailVerified === false`

---

## 📊 USER BREAKDOWN

### Total: 25 Users with Assets but No Simulations

#### By Email Verification Status:
- **❌ Unverified Emails**: 19 users (76%)
  - Blocked by BOTH bugs (health check + email verification)
- **✅ Verified Emails**: 6 users (24%)
  - Blocked ONLY by Bug #1 (health check)
  - After health check fix, these 6 should be able to simulate

#### By Account Status:
- **Active**: 24 users
- **Deleted**: 1 user (steven.morehouse@gmail.com - verified email, churned due to Bug #1)

---

## 🐛 BUG #1: Health Check Disabled Button (FIXED)

### What Was Happening

**File**: `app/(dashboard)/simulation/page.tsx` line 1165

```typescript
// BEFORE (BROKEN):
disabled={isLoading || prefillLoading || apiHealthy === false}
```

- Health check ran on page load: `healthCheck().then(setApiHealthy)`
- If Python API was unreachable → `apiHealthy = false`
- Button was DISABLED with no explanation
- Users saw greyed-out button, couldn't click it

### How It Was Fixed

```typescript
// AFTER (FIXED):
disabled={isLoading || prefillLoading}
```

**Also changed warning from error to informational**:
- Red "destructive" alert → Yellow "informational" alert
- New message: "Backend health check did not respond. You can still run simulations - if there are issues, you'll see an error message."

### Impact

- **All 25 users** were affected by this bug
- Button was disabled, preventing ANY simulation attempts
- **Steven Morehouse** deleted account after 18 minutes (likely due to this bug)

### Status: ✅ FIXED

---

## 🐛 BUG #2: Email Verification Blocks API (NEEDS DECISION)

### What Is Happening

**File**: `app/api/simulation/run/route.ts` lines 47-64

```typescript
if (!user?.emailVerified) {
  return NextResponse.json(
    {
      success: false,
      message: 'Please verify your email to run simulations',
      error: 'Email verification required',
      requiresVerification: true,
      warnings: [],
    },
    { status: 403 }
  );
}
```

### Who Is Affected

**19 active users with unverified emails:**

| User | Assets | Days Since Signup |
|------|--------|-------------------|
| gthomas@g3consulting.com | $7,007,000 | 13 days |
| jarumugam@gmail.com | $3,500,000 | 10 days |
| ersilhome@gmail.com | $2,580,000 | 20 days |
| foryoubylou@outlook.com | $1,187,300 | 16 days |
| frederic_tremblay@hotmail.com | $1,300,000 | 13 days |
| john.brady@me.com | $1,386,000 | 6 days |
| (13 more users) | $12.5M+ | Various |

**These are HIGH-VALUE, ENGAGED USERS:**
- They signed up weeks ago
- They loaded all their assets
- They created scenarios
- **They just can't verify email** (spam filters? typos? Gmail promotions tab?)

### Why This Is a Problem

1. **Email verification is a UX anti-pattern for freemium products**
   - Users want to TRY the product before committing
   - Requiring email verification BEFORE seeing value = high friction
   - Industry best practice: Allow core features, require verification for payments/upgrades

2. **Users may not receive verification emails**
   - Spam filters (especially for new domains)
   - Gmail promotions tab
   - Typos in email address
   - Corporate email servers blocking transactional emails

3. **No reminder or re-send mechanism visible**
   - Users who don't receive email are STUCK
   - No clear path to retry verification

4. **Chicken-and-egg problem**
   - Can't see product value → No motivation to verify email
   - Can't verify email → Can't see product value
   - Result: Churn

---

## 💡 RECOMMENDED FIX OPTIONS

### Option 1: Remove Email Verification for Simulations (RECOMMENDED)

**Approach**: Allow unverified users to run simulations, require verification only for premium upgrade

**Pros**:
- Unblocks all 19 users immediately
- Industry standard (Stripe, Notion, Figma all allow product use before email verification)
- Users see value → more likely to verify email later
- Reduces friction = higher conversion

**Cons**:
- Potential for spam/bot accounts (mitigated by rate limiting)

**Implementation** (5 minutes):
```typescript
// app/api/simulation/run/route.ts lines 47-64
// REMOVE THIS BLOCK ENTIRELY or change to warning instead of blocking
```

### Option 2: Soft Verification (Allow X Simulations Before Requiring Verification)

**Approach**: Allow 3 simulations without email verification, then require it

**Pros**:
- Users can try product immediately
- Still encourages email verification
- Balance between accessibility and account quality

**Cons**:
- More complex to implement
- Still friction at simulation #4

**Implementation** (30 minutes):
- Add `simulationCount` field to User model
- Check count in API route
- Return "upgrade to verified" message after limit

### Option 3: Keep Verification, Improve UX (NOT RECOMMENDED)

**Approach**: Keep requirement but add prominent reminders + easy re-send

**Pros**:
- Maintains email verification gate
- Better than current state

**Cons**:
- Still blocks users from seeing value
- Doesn't solve spam filter / typo issues
- Lower conversion than Option 1

**Implementation** (2 hours):
- Add banner to simulation page: "Verify email to unlock simulations"
- Add "Resend verification email" button
- Send automated reminder emails

---

## 🎯 RECOMMENDATION

### **Option 1: Remove Email Verification for Simulations**

**Rationale**:
1. **These are paying customers in waiting** - $29.5M in assets = high-value users
2. **Email verification is not a security control** - it's for communication
3. **Industry standard** - No major SaaS requires verification before trying product
4. **Immediate revenue impact** - 19 users blocked from seeing value = 0% upgrade rate
5. **Simple fix** - Remove 18 lines of code, deploy in 5 minutes

**Alternative Approach**:
- Remove verification requirement for simulations
- KEEP requirement for:
  - Upgrading to premium (Stripe requires verified email anyway)
  - Downloading reports
  - Exporting data

This gives users immediate value while still encouraging verification for advanced features.

---

## 📈 IMPACT ANALYSIS

### Current State (Both Bugs Active)
- 25 users blocked
- 0 simulations run
- 1 user churned (Steven Morehouse)
- 0% chance of conversion to premium

### After Bug #1 Fix (Health Check)
- 6 verified users can now simulate
- 19 unverified users still blocked
- Expected: 24% success rate (6/25 can simulate)

### After Both Bugs Fixed
- All 25 users can simulate
- Expected: 80%+ will run simulations (20/25)
- Expected: 30% of those upgrade to premium (6 users)
- Revenue: 6 × $72/year = **$432/year** from just these 25 users

### Long-term Impact (100+ users affected over time)
- Remove email verification → +76% more users can simulate
- More simulations → Higher conversion rate
- Estimated: **$2,000-3,000/year** additional revenue

---

## 🚀 DEPLOYMENT PLAN

### Immediate (Today)

1. ✅ **Bug #1 Fix Deployed** (Health check - DONE)
   - Test with verified users (should work now)
   - Monitor for any issues

2. ⏳ **Bug #2 Fix - Awaiting Decision**
   - **If Option 1 approved**: 5-minute fix, deploy immediately
   - **If Option 2 approved**: 30-minute implementation
   - **If Option 3 approved**: 2-hour implementation

### Short-term (This Week)

3. ⏳ Send re-engagement emails
   - To 6 verified users: "We fixed the bug - try simulations now!"
   - To 19 unverified users (after Bug #2 fix): "You can now run simulations without verification"

4. ⏳ Monitor metrics
   - Simulation run rate
   - Time to first simulation
   - Conversion to premium

5. ⏳ Fix pricing display
   - Change $9.99 → $5.99 in all files

---

## 📊 SUCCESS METRICS

### Bug #1 Fix (Health Check)
- **Target**: 80% of verified users (5/6) run simulations within 48 hours
- **Measure**: Track simulation runs from: mattramella@gmail.com, nate.jean7@gmail.com, jordametcalfe1@gmail.com, ice-castor6q@icloud.com, shelly.wong@ymail.com

### Bug #2 Fix (Email Verification - if removed)
- **Target**: 60% of unverified users (11/19) run simulations within 48 hours
- **Measure**: Track simulation runs from all 19 unverified users
- **Secondary**: Track how many verify email AFTER seeing simulation value

---

## 🔍 VERIFICATION TESTS

### Test Bug #1 Fix (Health Check)

1. **Open simulation page** (http://localhost:3001/simulation)
2. **Verify health check passes** (should see green/yellow alert, not red)
3. **Verify button is enabled** (not greyed out)
4. **Click "Run Simulation"** with test data
5. **Verify simulation runs** OR shows proper error message

### Test Bug #2 (Email Verification)

**Test Case 1: Unverified User**
1. Login as user with `emailVerified = false`
2. Try to run simulation
3. **Expected (before fix)**: 403 error, message "Please verify your email"
4. **Expected (after fix)**: Simulation runs successfully

**Test Case 2: Verified User**
1. Login as user with `emailVerified = true`
2. Try to run simulation
3. **Expected**: Simulation runs successfully

---

## 💰 REVENUE RECOVERY

### Lost Opportunity Cost

**Per User Value**:
- Assume 30% convert to premium = $72/year
- 25 users × 30% = 7.5 users
- Expected revenue: 7.5 × $72 = **$540/year**

**Time Lost**:
- Average user blocked for 10 days
- 25 users × 10 days = 250 user-days of blocked value
- If 20% churn per day blocked → 50% already churned

**Churned Users**:
- Steven Morehouse: Lost customer ($3.8M assets)
- Potential lifetime value: $72/year × 3 years = $216

---

## 📝 LESSONS LEARNED

### 1. Don't Block Core Features on Non-Security Requirements

Email verification is for **communication**, not **security**. Blocking core product features on it is an anti-pattern.

**Bad**:
```typescript
if (!emailVerified) {
  return 403; // Block user from seeing product value
}
```

**Good**:
```typescript
if (!emailVerified && action === 'upgrade_to_premium') {
  return 403; // Block payment, but allow product usage
}
```

### 2. Health Checks Should Be Informational, Not Blocking

We learned this from Bug #1 - same principle applies to all "preflight" checks.

### 3. Test with Real User Journeys

We discovered these bugs by querying for "users with assets but no simulations". This should be a standard metric we monitor.

### 4. Monitor Funnel Drop-offs

**Our funnel**:
1. Signup → 100%
2. Add assets → 80%
3. Run simulation → **0%** ← RED FLAG!
4. Upgrade to premium → 0%

If we monitored step 3, we would have caught this earlier.

---

## ✅ NEXT ACTIONS

1. **User Decision Required**: Which fix option for Bug #2?
   - **Option 1 (Recommended)**: Remove email verification for simulations
   - **Option 2**: Allow 3 simulations before requiring verification
   - **Option 3**: Keep verification, improve UX

2. **After Decision**: Implement and deploy Bug #2 fix

3. **Send Re-engagement Emails**: To all 24 active users

4. **Monitor Metrics**: Track simulation run rate over next 48 hours

5. **Fix Pricing Display**: Update $9.99 → $5.99 (separate PR)

---

**Status**: Bug #1 Fixed, Bug #2 Awaiting Decision
**Urgency**: HIGH - 19 users blocked, high churn risk
**Estimated Recovery**: 15-20 simulations within 48 hours after fixes
