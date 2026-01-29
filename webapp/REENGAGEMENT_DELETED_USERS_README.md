# Re-engagement Campaign for Deleted Users

**Date**: January 29, 2026
**Status**: ⏳ Ready for execution (awaiting production verification)
**Target**: 4 deleted users with specific issues now fixed

---

## Quick Start

### 1. Prerequisites

- [x] Vercel deployment completed (commit 997c924)
- [ ] All fixes verified in production
- [ ] RESEND_API_KEY environment variable set
- [ ] Node.js with `resend` package installed

### 2. Install Dependencies

```bash
npm install resend
```

### 3. Send Emails

```bash
# Set API key
export RESEND_API_KEY=re_xxxxx

# Send personalized re-engagement emails
node send_reengagement_emails.js
```

### 4. Track Results

```bash
# Check for user reactivations
node query_deleted_users.js
```

---

## Campaign Overview

This campaign sends **personalized emails** to 4 users who deleted their accounts, informing them that we've fixed the specific issues they reported.

### Recipients

| Priority | Name | Email | Issue | Fix | Expected Response |
|----------|------|-------|-------|-----|------------------|
| 1 | Susan McMillan | j.mcmillan@shaw.ca | Couldn't remove partner | One-click toggle | HIGH (60%) |
| 2 | Ian Crawford | ian.anita.crawford@gmail.com | Wanted RRIF features | Renamed strategy | HIGH (40%) |
| 3 | Paul Lamothe | hgregoire2000@gmail.com | Missing pension indexing | Added checkbox | MEDIUM (30%) |
| 4 | Kenny N | k_naterwala@hotmail.com | No reason provided | General improvements | LOW (10%) |

**Excluded**: Maurice Poitras (language barrier - French support not yet available)

**Expected Reactivations**: 1-2 users (25-50% conversion rate)

---

## Files

### Main Files

1. **`send_reengagement_emails.js`** - Email sending script
   - 4 personalized HTML email templates
   - Priority-based sending order
   - Rate limiting (2 sec delay)
   - Success/failure tracking

2. **`REENGAGEMENT_EMAILS.md`** - Complete campaign documentation
   - Full email templates
   - Sending instructions
   - Tracking metrics
   - Legal compliance (CAN-SPAM, CASL)

3. **`query_deleted_users.js`** - Track reactivations
   - Query deleted users
   - Check for logins after deletion
   - Identify reactivated accounts

### Implementation Files

4. **`DELETED_USERS_FIXES_IMPLEMENTATION.md`** - Implementation details
5. **`TEST_RESULTS.md`** - Test results (18/18 passed)
6. **`DEPLOYMENT_SUMMARY.md`** - Deployment status
7. **`test_deleted_users_fixes.js`** - Automated test suite

---

## Timeline

### Completed

- ✅ **Jan 29 AM**: Analyzed deleted users
- ✅ **Jan 29 PM**: Implemented 4 UX fixes
- ✅ **Jan 29 PM**: Tested all fixes (100% pass rate)
- ✅ **Jan 29 PM**: Deployed to GitHub (commit 997c924)
- ✅ **Jan 29 PM**: Created email templates

### Next Steps

- [ ] **Jan 29-30**: Verify fixes in production
- [ ] **Jan 31**: Send re-engagement emails (10am-2pm EST)
- [ ] **Feb 1-7**: Monitor open/click rates
- [ ] **Feb 7-28**: Track reactivations

---

## Expected Results

### Email Metrics

| Metric | Industry Avg | Expected (Personalized) |
|--------|--------------|------------------------|
| Open Rate | 20-25% | 40-50% |
| Click Rate | 2-5% | 15-25% |
| Reactivation Rate | 5-10% | 25-50% |

### User-Specific Predictions

1. **Susan McMillan**: 60% reactivation (critical issue fixed)
2. **Ian Crawford**: 40% reactivation (feature exists)
3. **Paul Lamothe**: 30% reactivation (feature added)
4. **Kenny N**: 10% reactivation (unknown issue)

---

## Fixes Deployed

### Fix #1: Deletion Reason Required
**File**: `components/account/DeleteAccountModal.tsx`
- Made deletion reason field mandatory
- Added validation and error messaging
- Prevents future "no reason" deletions

### Fix #2: Partner Removal UX
**File**: `app/(dashboard)/profile/settings/page.tsx`
- One-click toggle: 👫 Couples / 👤 Single
- Contextual help text
- Reassurance message for single mode

### Fix #3: Pension Indexing
**File**: `app/(dashboard)/profile/income/page.tsx`
- Added "Inflation Indexed" checkbox
- Defaults to true for pensions
- Contextual help for CPP/OAS/pensions

### Fix #4: RRIF Strategy Naming
**Files**: `lib/types/simulation.ts`, `app/(dashboard)/simulation/page.tsx`
- Renamed to "Early RRIF Withdrawals (Income Splitting)"
- Added description: "Ideal for couples with income imbalance"
- Improved discoverability

---

## Campaign Strategy

### Why This Works

1. **Hyper-Personalized**: Quotes their exact deletion reason
2. **Solution-Focused**: Shows we fixed their specific issue
3. **Time-Sensitive**: 30-day recovery window
4. **Social Proof**: "Your feedback helped us improve"
5. **Low Friction**: Single "Reactivate" button

### Sending Best Practices

- **Day**: Tuesday or Wednesday (highest open rates)
- **Time**: 10am-2pm EST (Canada time zones)
- **Wait**: 48 hours after deployment (ensure stability)
- **Delay**: 2 seconds between emails (rate limit)

---

## Monitoring

### Resend Dashboard

Track in real-time:
- Email delivery status
- Open rates by recipient
- Click rates on CTA
- Bounce/spam reports

### Database Tracking

```sql
-- Check for reactivations
SELECT
  email,
  deletedAt,
  lastLoginAt,
  CASE
    WHEN lastLoginAt > deletedAt THEN 'REACTIVATED'
    ELSE 'STILL DELETED'
  END as status
FROM "User"
WHERE deletedAt > '2026-01-11'
ORDER BY deletedAt DESC;
```

---

## Success Metrics

### Week 1

- [ ] 4 emails sent successfully
- [ ] Open rate >30%
- [ ] At least 1 click-through
- [ ] Zero spam complaints

### Week 2-4

- [ ] At least 1 user reactivates
- [ ] Positive responses to fixes
- [ ] No negative feedback about emails

### Long-Term

- [ ] Reduced deletion rate (40%+ drop)
- [ ] Better deletion feedback quality (100% with reasons)
- [ ] Reputation for listening to users

---

## Support

**For Questions**:
- Review `REENGAGEMENT_EMAILS.md` for full details
- Check `DEPLOYMENT_SUMMARY.md` for deployment status
- Query database with `query_deleted_users.js`

**For Errors**:
- Verify RESEND_API_KEY is set
- Check Resend dashboard for delivery status
- Review email logs in terminal output

---

**Campaign Created**: January 29, 2026
**Campaign Status**: ⏳ Ready for Execution
**Expected ROI**: 1-2 reactivated users from 5 deletions (20-40% reduction in churn)
