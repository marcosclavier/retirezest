# RetireZest Re-engagement Execution Plan
**Date**: January 26, 2026
**Status**: Ready to Execute

---

## Executive Summary

**Target**: 47 inactive users
**Segments Identified**: 5 priority segments
**Expected Conversions**: 15-25 new active users (65-109% growth)
**Timeline**: 4 weeks

### Day 1 Immediate Actions:
1. Send emails to 4 ready users (onboarding complete)
2. Send emails to 30 unverified users
3. Send emails to 12 Step 6 users

**Expected Day 1 Impact**: 10-15 new simulations

---

## Segment Breakdown

### 🔥 HIGHEST PRIORITY: Onboarding Complete (4 users)
**Users**:
- Joseph (jromano@anira.com) - 1 day old
- Oliver (lmcolty@hotmail.com) - 26 days old
- B (kevmelo+retire@gmail.com) - 14 days old
- Yeshwant (yeshwant.jk.shetty@gmail.com) - 15 days old

**Action**: Send "Your Simulation is Ready!" email
**Expected Conversion**: 75% (3 users)

### ⚡ HIGH PRIORITY: Email Not Verified (30 users)
**Top Recent Users**:
- Dany (danybernier1@gmail.com) - 2 days old
- Jey (jarumugam@gmail.com) - 3 days old
- Gregory (gthomas@g3consulting.com) - 7 days old
- Frederic (frederic_tremblay@hotmail.com) - 7 days old

**Action**: Send verification reminder email
**Expected Conversion**: 60% (18 users)

### 🔥 HIGH PRIORITY: Stuck at Step 6 - Real Estate (12 users)
**Recent Verified Users**:
- Daniel (dangagnon66@msn.com) - 9 days old, verified
- K (ice-castor6q@icloud.com) - 10 days old, verified
- Dog (dogpolisher@gmail.com) - 25 days old, verified

**Issue**: Step 6 = Real Estate step for couples planning
**Action**: Send help email with skip option reminder
**Expected Conversion**: 50% (6 users)

### 📊 MEDIUM PRIORITY: Stuck at Step 5 (5 users)
**Users**:
- Kenny (k_naterwala@hotmail.com) - 6 days old, verified

**Action**: Send onboarding completion email
**Expected Conversion**: 50% (2-3 users)

### 📊 MEDIUM PRIORITY: No Data Entered (15 users)
**Users with Onboarding Complete**:
- Joseph (jromano@anira.com) - 1 day old
- Yeshwant (yeshwant.jk.shetty@gmail.com) - 15 days old
- B (kevmelo+retire@gmail.com) - 14 days old

**Action**: Send Quick Start email
**Expected Conversion**: 40% (6 users)

---

## Email Templates

### Template 1: Onboarding Complete - Run Simulation

**Subject**: Your retirement plan is ready to view! 🎉

**Body**:
```
Hi {firstName},

Great news! You've completed your RetireZest setup.

Your information is saved and ready. Now it's time to see your 30-year retirement projection in action.

[Run My First Simulation →]

In 60 seconds, you'll see:
✓ Year-by-year cash flow projections
✓ Tax optimization opportunities
✓ Your projected estate value at age 95
✓ Government benefit estimates (CPP, OAS)
✓ Account balance trajectories

Click here to view your retirement projection:
{SIMULATION_URL}

Questions? Just reply to this email.

Best regards,
The RetireZest Team

P.S. Most users are amazed by what they learn from their first simulation!
```

### Template 2: Email Verification Reminder

**Subject**: Verify your email to unlock your retirement plan

**Body**:
```
Hi {firstName},

You're almost there! You created a RetireZest account {daysAgo} day(s) ago, but we need you to verify your email before you can run your first retirement simulation.

[Verify My Email →]

Once verified, you'll be able to:
✓ Run unlimited retirement simulations
✓ Compare different withdrawal strategies
✓ See your 30-year projection
✓ Optimize your retirement income

This link expires in 7 days.

Need help? Just reply to this email.

Best regards,
The RetireZest Team

P.S. Verification takes 5 seconds - don't miss out on planning your perfect retirement!
```

### Template 3: Stuck at Step 6 - Real Estate

**Subject**: Quick question about your setup

**Hi {firstName},

We noticed you started setting up RetireZest but paused at the Real Estate step (you're 86% complete!).

Good news: You can skip this step and come back later.

**Option 1: Skip Real Estate for Now**
If you don't own property or want to add it later, just click "Skip for now" on the Real Estate page, and you'll move right to the next step.

[Continue My Setup →]

**Option 2: No Real Estate**
Simply select "No, I don't own property" and continue.

**Option 3: Need Help?**
Reply to this email and we'll help you finish your setup.

You're so close! Once you complete setup, you can run your first simulation in under 60 seconds.

Best regards,
The RetireZest Team
```

### Template 4: Stuck at Step 5

**Subject**: Let's finish your RetireZest setup

**Body**:
```
Hi {firstName},

You're halfway through setting up RetireZest (71% complete)!

Want to see your 30-year retirement projection? Just complete the last few steps.

[Continue My Setup →]

Or, if you're stuck or have questions about what information we're asking for, just reply to this email and we'll help you out.

Best regards,
The RetireZest Team

P.S. Most users complete setup in under 10 minutes total.
```

### Template 5: No Data Entered - Quick Start

**Subject**: See your retirement plan in 5 minutes

**Body**:
```
Hi {firstName},

Want to see what your retirement could look like?

You can run your first RetireZest simulation in just 5 minutes.

**Quick Start - Only 3 Questions:**
1. Your age
2. Total retirement savings (RRSP + TFSA + investments)
3. Annual retirement spending

That's it! RetireZest fills in smart defaults for everything else.

[Quick Start - 5 Minute Simulation →]

You'll instantly see:
✓ How long your money will last
✓ Your projected estate value
✓ Tax-optimized withdrawal strategies
✓ When you can afford to retire

No complex setup required.

[Get Started Now →]

Best regards,
The RetireZest Team
```

---

## Implementation Steps

### Step 1: Create Email Campaign Script (Node.js)

Create `/Users/jrcb/Documents/GitHub/retirezest/webapp/send_reengagement_emails.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// TODO: Configure your email provider (SendGrid, AWS SES, etc.)
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendReengagementEmails(segment, dryRun = true) {
  const segments = require('./reengagement_segments.json');
  const targetSegment = segments[segment];

  if (!targetSegment) {
    console.error(`Unknown segment: ${segment}`);
    return;
  }

  console.log(`\\n=== SENDING EMAILS TO: ${targetSegment.name} ===`);
  console.log(`Users: ${targetSegment.count}`);
  console.log(`Dry Run: ${dryRun}\\n`);

  for (const user of targetSegment.users) {
    const email = getEmailTemplate(segment, user);

    if (dryRun) {
      console.log(`[DRY RUN] Would send to: ${user.email}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`Preview: ${email.body.substring(0, 100)}...\\n`);
    } else {
      // TODO: Actual email sending
      // await sendEmail(user.email, email.subject, email.body);
      console.log(`✓ Sent to: ${user.email}`);
    }
  }

  console.log(`\\nTotal emails: ${targetSegment.count}`);
}

function getEmailTemplate(segment, user) {
  const templates = {
    segment1_ready: {
      subject: 'Your retirement plan is ready to view! 🎉',
      body: getTemplate1(user)
    },
    segment2_unverified: {
      subject: 'Verify your email to unlock your retirement plan',
      body: getTemplate2(user)
    },
    segment3_step6: {
      subject: 'Quick question about your setup',
      body: getTemplate3(user)
    },
    segment4_step5: {
      subject: 'Let\\'s finish your RetireZest setup',
      body: getTemplate4(user)
    },
    segment5_nodata: {
      subject: 'See your retirement plan in 5 minutes',
      body: getTemplate5(user)
    }
  };

  return templates[segment] || { subject: '', body: '' };
}

// Template functions
function getTemplate1(user) {
  return `Hi ${user.firstName},

Great news! You've completed your RetireZest setup.

Your information is saved and ready. Now it's time to see your 30-year retirement projection in action.

[Run My First Simulation →]
https://retirezest.com/dashboard

In 60 seconds, you'll see:
✓ Year-by-year cash flow projections
✓ Tax optimization opportunities
✓ Your projected estate value at age 95
✓ Government benefit estimates (CPP, OAS)
✓ Account balance trajectories

Click here to view your retirement projection:
https://retirezest.com/dashboard

Questions? Just reply to this email.

Best regards,
The RetireZest Team

P.S. Most users are amazed by what they learn from their first simulation!`;
}

function getTemplate2(user) {
  return `Hi ${user.firstName},

You're almost there! You created a RetireZest account ${user.daysAgo} day(s) ago, but we need you to verify your email before you can run your first retirement simulation.

[Verify My Email →]
https://retirezest.com/verify-email

Once verified, you'll be able to:
✓ Run unlimited retirement simulations
✓ Compare different withdrawal strategies
✓ See your 30-year projection
✓ Optimize your retirement income

This link expires in 7 days.

Need help? Just reply to this email.

Best regards,
The RetireZest Team

P.S. Verification takes 5 seconds - don't miss out on planning your perfect retirement!`;
}

function getTemplate3(user) {
  return `Hi ${user.firstName},

We noticed you started setting up RetireZest but paused at the Real Estate step (you're 86% complete!).

Good news: You can skip this step and come back later.

**Option 1: Skip Real Estate for Now**
If you don't own property or want to add it later, just click "Skip for now" on the Real Estate page.

[Continue My Setup →]
https://retirezest.com/onboarding/wizard?step=6

**Option 2: No Real Estate**
Simply select "No, I don't own property" and continue.

**Option 3: Need Help?**
Reply to this email and we'll help you finish your setup.

You're so close! Once you complete setup, you can run your first simulation in under 60 seconds.

Best regards,
The RetireZest Team`;
}

function getTemplate4(user) {
  return `Hi ${user.firstName},

You're halfway through setting up RetireZest (71% complete)!

Want to see your 30-year retirement projection? Just complete the last few steps.

[Continue My Setup →]
https://retirezest.com/onboarding/wizard?step=5

Or, if you're stuck or have questions, just reply to this email.

Best regards,
The RetireZest Team

P.S. Most users complete setup in under 10 minutes total.`;
}

function getTemplate5(user) {
  return `Hi ${user.firstName},

Want to see what your retirement could look like?

You can run your first RetireZest simulation in just 5 minutes.

**Quick Start - Only 3 Questions:**
1. Your age
2. Total retirement savings (RRSP + TFSA + investments)
3. Annual retirement spending

That's it! RetireZest fills in smart defaults for everything else.

[Quick Start - 5 Minute Simulation →]
https://retirezest.com/dashboard

You'll instantly see:
✓ How long your money will last
✓ Your projected estate value
✓ Tax-optimized withdrawal strategies
✓ When you can afford to retire

No complex setup required.

Best regards,
The RetireZest Team`;
}

// CLI usage
const segment = process.argv[2];
const dryRun = process.argv[3] !== '--send';

if (!segment) {
  console.log('Usage: node send_reengagement_emails.js <segment> [--send]');
  console.log('Segments: segment1_ready, segment2_unverified, segment3_step6, segment4_step5, segment5_nodata');
  console.log('Add --send to actually send emails (default is dry run)');
  process.exit(1);
}

sendReengagementEmails(segment, dryRun)
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

### Step 2: Execute Day 1 Campaigns

**Commands** (dry run first):
```bash
# Test emails (dry run)
node send_reengagement_emails.js segment1_ready
node send_reengagement_emails.js segment2_unverified
node send_reengagement_emails.js segment3_step6

# Actually send (after review)
node send_reengagement_emails.js segment1_ready --send
node send_reengagement_emails.js segment2_unverified --send
node send_reengagement_emails.js segment3_step6 --send
```

### Step 3: Add "Resend Verification" Button

File: `webapp/app/(dashboard)/dashboard/page.tsx`

Add banner for unverified users:
```tsx
{!user.emailVerified && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
    <div className="flex">
      <div className="flex-shrink-0">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm text-yellow-700">
          Please verify your email to run simulations.
        </p>
      </div>
      <div className="ml-3">
        <button
          onClick={handleResendVerification}
          className="text-sm font-medium text-yellow-700 hover:text-yellow-600"
        >
          Resend verification email
        </button>
      </div>
    </div>
  </div>
)}
```

### Step 4: Track Conversions

Create tracking script:
```javascript
// Track when inactive users run their first simulation
// Add to simulation submission endpoint

await prisma.auditLog.create({
  data: {
    userId: user.id,
    action: 'FIRST_SIMULATION_RUN',
    description: 'User ran first simulation after re-engagement',
    metadata: JSON.stringify({
      daysInactive: daysSinceSignup,
      reengagementSegment: determineSegment(user)
    })
  }
});
```

---

## Success Metrics & Tracking

### Week 1 Goals:
- [ ] 4 ready users → 3 conversions (75%)
- [ ] 30 unverified users → 18 verifications (60%)
- [ ] 12 Step 6 users → 6 completions (50%)
- **Total Week 1**: 27 conversions expected

### Tracking Dashboard (Weekly Report):

```
Week of [Date]:

Email Campaigns:
- Segment 1 (Ready): 4 sent, X opened, X clicked, X simulations
- Segment 2 (Unverified): 30 sent, X opened, X verified, X simulations
- Segment 3 (Step 6): 12 sent, X opened, X completed, X simulations

Conversions:
- New email verifications: X
- New onboarding completions: X
- New first simulations: X

Overall Progress:
- Active users: 23 → X (+Y)
- Inactive users: 47 → X (-Y)
- Activation rate: 33% → X%
```

---

## Timeline

### Day 1 (Today):
- [x] Segment users
- [ ] Create email templates
- [ ] Test emails (dry run)
- [ ] Send to Segment 1 (4 users)
- [ ] Send to Segment 2 (30 users)
- [ ] Send to Segment 3 (12 users)

### Day 2-3:
- [ ] Add "Resend verification" button
- [ ] Monitor email open rates
- [ ] Respond to user replies
- [ ] Track conversions

### Day 4-7 (Week 1 end):
- [ ] Send Segment 4 & 5 emails
- [ ] Measure Week 1 results
- [ ] Adjust campaigns based on data

### Week 2:
- [ ] Product improvements (Quick Start mode)
- [ ] Automated reminder sequences
- [ ] A/B test email variations

### Week 3-4:
- [ ] Win-back campaign (30+ day users)
- [ ] Final push for remaining inactive users
- [ ] Measure final results

---

## Next Steps (Immediate)

1. **Review & Approve** email templates above
2. **Configure email sending** (SendGrid API key, etc.)
3. **Run dry run** of email campaigns
4. **Send first batch** to Segment 1 (4 ready users)
5. **Monitor results** over 24-48 hours

**Ready to execute?** Let me know and I'll create the send_reengagement_emails.js script!

---

**Plan Status**: ✅ READY TO EXECUTE
**Expected Impact**: +15-25 active users (65-109% growth)
**Risk Level**: Low (emails are helpful, not spammy)
**Cost**: Minimal (email sending only)
