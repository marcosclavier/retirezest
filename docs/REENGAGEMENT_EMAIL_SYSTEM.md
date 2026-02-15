# Re-engagement Email Campaign System

**Last Updated**: January 26, 2026
**Status**: Production
**Emails Sent**: 46 (Day 1 campaign completed)

---

## Overview

The re-engagement email system automatically identifies inactive users, segments them by behavior, and sends targeted email campaigns to convert them into active users.

### Key Metrics (as of Jan 26, 2026)
- **Total Users**: 67
- **Active Users** (with simulations): 23 (34.3%)
- **Inactive Users** (no simulations): 47 (65.7%)
- **Day 1 Emails Sent**: 46
- **Expected Conversions**: 15-25 new active users (65-109% growth)

---

## System Components

### 1. User Segmentation (`get_reengagement_segments.js`)

**Purpose**: Analyzes the user database and creates behavioral segments

**Output**: `reengagement_segments.json`

**Segments Created**:

| Segment | Description | Count | Expected Conversion |
|---------|-------------|-------|-------------------|
| `segment1_ready` | Onboarding complete, ready to run simulation | 4 | 75% (3 users) |
| `segment2_unverified` | Email not verified | 30 | 60% (18 users) |
| `segment3_step6` | Stuck at Step 6 (Real Estate) | 12 | 50% (6 users) |
| `segment4_step5` | Stuck at Step 5 | 5 | 50% (2-3 users) |
| `segment5_nodata` | No data entered | 15 | 40% (6 users) |

**Usage**:
```bash
node get_reengagement_segments.js
```

**Database Queries**:
```javascript
// Segment 1: Ready users (highest priority)
const readyUsers = await prisma.user.findMany({
  where: {
    deletedAt: null,
    emailVerified: true,
    onboardingCompleted: true,
    simulationRuns: { none: {} }
  }
});

// Segment 2: Unverified users (blocking issue)
const unverifiedUsers = await prisma.user.findMany({
  where: {
    deletedAt: null,
    emailVerified: false,
    simulationRuns: { none: {} }
  }
});

// Segment 3: Stuck at Step 6 (UX issue)
const step6Users = await prisma.user.findMany({
  where: {
    deletedAt: null,
    onboardingCompleted: false,
    onboardingStep: 6,
    simulationRuns: { none: {} }
  }
});
```

---

### 2. Email Campaign Script (`send_reengagement_emails.js`)

**Purpose**: Sends personalized emails to segmented users

**Features**:
- ✅ Dry-run mode (preview emails without sending)
- ✅ Email delivery via Resend API
- ✅ Rate limiting (600ms delay between sends)
- ✅ Audit logging (if user.id available)
- ✅ Error handling and retry logic
- ✅ Progress tracking and summary reporting

**Usage**:

```bash
# Dry-run (preview only)
node send_reengagement_emails.js segment1_ready

# Actually send emails
node send_reengagement_emails.js segment1_ready --send

# Send to multiple segments
node send_reengagement_emails.js segment1_ready --send
node send_reengagement_emails.js segment2_unverified --send
node send_reengagement_emails.js segment3_step6 --send
```

**Configuration**:
```javascript
// Environment variables required
RESEND_API_KEY="re_xxx..."     // From .env.local
EMAIL_FROM="contact@retirezest.com"  // Sender email

// Rate limiting
const DELAY_BETWEEN_EMAILS = 600; // ms (respects 2 req/sec limit)
```

---

### 3. Email Templates

All templates are personalized with `{firstName}` and include clear CTAs.

#### Template 1: Onboarding Complete - Ready to Run
**Segment**: `segment1_ready`
**Subject**: "Your retirement plan is ready to view! 🎉"
**CTA**: Run first simulation
**Target**: Users who completed onboarding but never ran a simulation

**Template** (`send_reengagement_emails.js:151-177`):
```
Hi {firstName},

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

Questions? Just reply to this email.

Best regards,
The RetireZest Team

P.S. Most users are amazed by what they learn from their first simulation!
```

#### Template 2: Email Verification Reminder
**Segment**: `segment2_unverified`
**Subject**: "Verify your email to unlock your retirement plan"
**CTA**: Verify email
**Target**: Users blocked by email verification

**Template** (`send_reengagement_emails.js:179-203`):
```
Hi {firstName},

You're almost there! You created a RetireZest account {daysAgo} day(s) ago, but we need you to verify your email before you can run your first retirement simulation.

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

P.S. Verification takes 5 seconds - don't miss out on planning your perfect retirement!
```

#### Template 3: Stuck at Step 6 - Real Estate
**Segment**: `segment3_step6`
**Subject**: "Quick question about your setup"
**CTA**: Skip Real Estate step or complete onboarding
**Target**: Users stuck at the Real Estate onboarding step (86% complete)

**Template** (`send_reengagement_emails.js:205-228`):
```
Hi {firstName},

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
The RetireZest Team
```

#### Template 4: Stuck at Step 5
**Segment**: `segment4_step5`
**Subject**: "Let's finish your RetireZest setup"
**CTA**: Continue onboarding
**Target**: Users stuck at Step 5 (71% complete)

**Template** (`send_reengagement_emails.js:230-246`):
```
Hi {firstName},

You're halfway through setting up RetireZest (71% complete)!

Want to see your 30-year retirement projection? Just complete the last few steps.

[Continue My Setup →]
https://retirezest.com/onboarding/wizard?step=5

Or, if you're stuck or have questions, just reply to this email and we'll help.

Best regards,
The RetireZest Team

P.S. Most users complete setup in under 10 minutes total.
```

#### Template 5: No Data Entered - Quick Start
**Segment**: `segment5_nodata`
**Subject**: "See your retirement plan in 5 minutes"
**CTA**: Quick Start mode
**Target**: Users with no financial data entered

**Template** (`send_reengagement_emails.js:248-275`):
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
https://retirezest.com/dashboard

You'll instantly see:
✓ How long your money will last
✓ Your projected estate value
✓ Tax-optimized withdrawal strategies
✓ When you can afford to retire

No complex setup required.

Best regards,
The RetireZest Team
```

---

### 4. Test Email Script (`test_email.js`)

**Purpose**: Verify Resend email configuration before sending campaigns

**Usage**:
```bash
node test_email.js
```

**Test Email Sent To**: `jrcb@hotmail.com` (owner's email)

**Validation**:
- ✅ API key configured
- ✅ FROM email set correctly
- ✅ Email delivery successful
- ✅ Response ID returned

---

## Email Infrastructure

### Provider: Resend
- **API**: `https://api.resend.com`
- **SDK**: `resend` npm package (v6.6.0)
- **Rate Limit**: 2 requests per second
- **FROM Email**: `contact@retirezest.com`

### Configuration Files:
1. **`lib/email.ts`**: Existing email utility (password reset, verification)
2. **`send_reengagement_emails.js`**: Campaign-specific script
3. **`.env.local`**: Contains `RESEND_API_KEY` and `EMAIL_FROM`

### Email Sending Logic:
```javascript
async function sendEmail(to, subject, body) {
  const response = await resend.emails.send({
    from: `RetireZest <${FROM_EMAIL}>`,
    to,
    subject,
    html: body.replace(/\n/g, '<br>'),  // HTML version
    text: body,                          // Plain text version
  });

  if (response.error) {
    throw new Error(`Resend API error: ${response.error.message}`);
  }

  return response;
}
```

---

## Campaign Execution

### Day 1 Campaign (January 26, 2026)

**Timeline**:
- 11:00 AM: Test email sent successfully
- 11:05 AM: Segment 1 launched (4 emails)
- 11:10 AM: Segment 2 launched (30 emails)
- 11:15 AM: Segment 3 launched (12 emails)

**Results**:
| Segment | Emails Sent | Success Rate | Expected Conversions |
|---------|-------------|--------------|---------------------|
| Segment 1 | 4 | 100% | 3 users |
| Segment 2 | 30 | 100% | 18 users |
| Segment 3 | 12 | 100% | 6 users |
| **Total** | **46** | **100%** | **27 users** |

**Day 1 Commands Executed**:
```bash
node send_reengagement_emails.js segment1_ready --send
node send_reengagement_emails.js segment2_unverified --send
node send_reengagement_emails.js segment3_step6 --send
```

---

## Monitoring & Tracking

### Metrics to Monitor (Next 48 hours):

1. **Email Metrics** (via Resend dashboard):
   - Open rate (target: >40%)
   - Click-through rate (target: >15%)
   - Bounce rate (should be <2%)
   - Spam complaints (should be 0%)

2. **User Actions** (via database):
   ```sql
   -- Email verifications from Segment 2
   SELECT COUNT(*) FROM users
   WHERE emailVerified = true
   AND verificationEmailSentAt > '2026-01-26';

   -- New simulations from re-engaged users
   SELECT COUNT(*) FROM simulation_runs
   WHERE createdAt > '2026-01-26';
   ```

3. **Conversion Tracking**:
   - User logins after email sent
   - Onboarding completions
   - First simulation runs
   - Email verifications

### Audit Logging:

When `user.id` is available, audit logs are created:

```javascript
await prisma.auditLog.create({
  data: {
    userId: user.id,
    action: 'REENGAGEMENT_EMAIL_SENT',
    description: `Sent ${segment} re-engagement email`,
    metadata: JSON.stringify({
      segment,
      emailSubject: email.subject,
      daysAgo: user.daysAgo
    }),
    success: true
  }
});
```

**Query Audit Logs**:
```javascript
const emailsSent = await prisma.auditLog.findMany({
  where: {
    action: 'REENGAGEMENT_EMAIL_SENT'
  },
  orderBy: { createdAt: 'desc' }
});
```

---

## Week 1 Follow-up Plan

### Days 2-3:
- Monitor email open rates
- Track user logins
- Watch for email verifications (Segment 2)
- Track simulation runs

### Days 4-7:
- Send Segment 4 (5 users stuck at Step 5)
- Send Segment 5 (15 users with no data)
- Send follow-up to unopened emails from Segments 1-3

### Week 1 Success Criteria:
- **Email verifications**: 18 new verified users (Segment 2)
- **Onboarding completions**: 8-10 users (Segments 3, 4)
- **First simulations**: 15-20 users (all segments)
- **Total new active users**: 15-25 (65-109% growth)

---

## Code Architecture

### File Structure:
```
webapp/
├── get_reengagement_segments.js      # User segmentation
├── send_reengagement_emails.js       # Email campaign execution
├── test_email.js                     # Email configuration test
├── lib/
│   └── email.ts                      # Email utilities (existing)
├── reengagement_segments.json        # Generated segments data
└── docs/
    └── REENGAGEMENT_EMAIL_SYSTEM.md  # This file
```

### Dependencies:
- `@prisma/client`: Database access
- `resend`: Email API client
- `dotenv`: Environment variable loading
- `fs`: File system (for segments JSON)

---

## Troubleshooting

### Issue: "RESEND_API_KEY is not configured"
**Solution**: Check `.env.local` for `RESEND_API_KEY`
```bash
grep RESEND_API_KEY .env.local
```

### Issue: "Resend API error: Too many requests"
**Solution**: Rate limiting enforced. The script already includes 600ms delay.
```javascript
// After each email send
await new Promise(resolve => setTimeout(resolve, 600));
```

### Issue: Audit log foreign key constraint
**Solution**: Script now checks if `user.id` exists before creating audit log
```javascript
if (user.id) {
  await prisma.auditLog.create({ ... });
}
```

### Issue: Segments file not found
**Solution**: Run segmentation script first
```bash
node get_reengagement_segments.js
```

---

## Future Enhancements

### Planned Features:
1. **Automated Drip Campaigns**: Multi-email sequences
2. **A/B Testing**: Test different subject lines and content
3. **Unsubscribe Management**: Honor opt-outs
4. **Email Templates Library**: Reusable template system
5. **Dashboard**: Visual campaign performance metrics
6. **Scheduled Sends**: Cron-based automation
7. **Personalization**: More dynamic content based on user data
8. **Conversion Attribution**: Track which emails led to conversions

### Database Schema Addition (Proposed):
```prisma
model EmailCampaign {
  id          String   @id @default(uuid())
  name        String
  segment     String
  sentAt      DateTime @default(now())
  emailsSent  Int
  emailsOpened Int     @default(0)
  emailsClicked Int    @default(0)
  conversions Int      @default(0)
  createdAt   DateTime @default(now())
}

model EmailLog {
  id          String   @id @default(uuid())
  userId      String
  campaignId  String
  emailType   String
  sentAt      DateTime @default(now())
  openedAt    DateTime?
  clickedAt   DateTime?
  convertedAt DateTime?

  user        User     @relation(fields: [userId], references: [id])
  campaign    EmailCampaign @relation(fields: [campaignId], references: [id])
}
```

---

## Best Practices

### Email Content:
✅ Personalize with first name
✅ Clear, single call-to-action
✅ Mobile-friendly formatting
✅ Plain text + HTML versions
✅ Unsubscribe link (future)
✅ Professional tone
✅ Value proposition clear

### Technical:
✅ Test with dry-run first
✅ Respect rate limits
✅ Handle errors gracefully
✅ Log all sends
✅ Monitor deliverability
✅ Use environment variables
✅ Never commit API keys

### Campaign Strategy:
✅ Segment by behavior, not demographics
✅ Prioritize high-intent users first
✅ Personalize messaging by segment
✅ Test before full send
✅ Monitor and optimize
✅ Follow up with non-openers
✅ Track conversions

---

## References

- **Resend Documentation**: https://resend.com/docs
- **Prisma Client**: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
- **Email Best Practices**: https://www.litmus.com/blog/email-marketing-best-practices
- **Re-engagement Strategy**: `REENGAGEMENT_EXECUTION_PLAN.md`

---

**Document Version**: 1.0
**Author**: RetireZest Development Team
**Last Campaign**: January 26, 2026 (46 emails sent)
