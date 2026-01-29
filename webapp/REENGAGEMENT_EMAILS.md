# Re-Engagement Email Campaign - Deleted Users

**Date**: January 29, 2026
**Target Audience**: 5 deleted users (accounts still recoverable for 30 days)
**Purpose**: Inform users that their specific issues have been fixed

---

## Campaign Overview

**Total Recipients**: 5 users
**Can Send To**: 4 users (excluding Maurice Poitras - language barrier)
**Expected Recovery Rate**: 25-50% (1-2 users)
**Timing**: Send immediately after Vercel deployment completes

---

## Email Templates

### Email #1: Susan McMillan (Partner Removal Issue) 🎯 HIGH PRIORITY

**To**: j.mcmillan@shaw.ca
**Subject**: We Fixed It! Switch to Single Person Planning in One Click
**Priority**: HIGH (this was our #1 issue)

```html
Hi Susan,

We heard you! When you deleted your account 6 days ago, you told us:

"I need to reset the data as it kept showing two people listed vs myself as a single person. It calculated doubled CPP and OAS income payments as I couldn't figure out how to remove the 2nd one."

**We've fixed this exact issue.**

What's New:
✅ **One-Click Partner Toggle** - Switch between single and couple planning instantly
✅ **Clear Visual Labels** - See exactly which mode you're in (👤 Single / 👫 Couple)
✅ **Reassurance Message** - Know that your partner data is safe, just ignored in single mode
✅ **No More Doubled Benefits** - CPP and OAS calculate correctly for one person

You no longer need to delete your account to "reset" - just flip a switch!

Your account data is still recoverable for the next 24 days. We'd love to have you back to try the improved experience.

[Reactivate My Account →]

Thank you for your honest feedback - it helped us improve RetireZest for everyone.

Best regards,
The RetireZest Team

P.S. It takes just one click in Settings to switch between single and couple planning now. No more confusion!
```

---

### Email #2: Ian Crawford (RRIF Withdrawal Features) 🎯 HIGH PRIORITY

**To**: ian.anita.crawford@gmail.com
**Subject**: Early RRIF Withdrawals Feature Now Available
**Priority**: HIGH (sophisticated user with specific needs)

```html
Hi Ian,

You deleted your account on the same day you signed up (Jan 18) because:

"Need ability make more detailed decisions like early RRIF Withdrawals for wife with no income."

**Great news - this feature exists and we've made it much easier to find!**

What's New:
✅ **"Early RRIF Withdrawals (Income Splitting)"** - Now clearly labeled in strategy options
✅ **Ideal for Couples with Income Imbalance** - Exactly what you described
✅ **Smart Optimization** - Withdraws 15% of RRIF before OAS/CPP starts, then 8% after
✅ **Automatic OAS Protection** - Switches to TFSA/NonReg to avoid clawback

This strategy is specifically designed for couples where one spouse has little to no income - perfect for optimizing household taxes through income splitting.

Your account is still recoverable for 23 days. As someone with sophisticated retirement planning needs, we think you'll find this feature valuable.

[Try Early RRIF Withdrawals →]

Thank you for your clear feedback - it helped us improve our strategy naming and discoverability.

Best regards,
The RetireZest Team

P.S. Select "Early RRIF Withdrawals (Income Splitting)" in the strategy dropdown to see how much you could save with this approach.
```

---

### Email #3: Paul Lamothe (Pension Indexing) 🎯 MEDIUM PRIORITY

**To**: hgregoire2000@gmail.com
**Subject**: Pension Indexing Feature Added - Your Feedback Made It Happen
**Priority**: MEDIUM

```html
Hi Paul,

You deleted your account on January 16th because:

"no possibility to index the pension found"

**We've added the pension indexing feature you needed!**

What's New:
✅ **Inflation Indexing Checkbox** - Now visible for all pension income sources
✅ **Smart Defaults** - Automatically checked (most Canadian DB pensions are indexed)
✅ **Contextual Help** - Clear explanations for CPP, OAS, and private pensions
✅ **Accurate Projections** - Your pension will now correctly increase with inflation

When you add a pension income source, you'll see a clear checkbox to indicate if your pension adjusts for inflation each year. This ensures your retirement projections are accurate and realistic.

Your account is still recoverable for 21 days. We'd love to have you back to see your pension properly modeled with inflation protection.

[Reactivate My Account →]

Thank you for your direct feedback - it helped us add a feature that many users will benefit from.

Best regards,
The RetireZest Team

P.S. Most Canadian DB pensions and all government pensions (CPP/OAS) are automatically indexed to inflation, so the checkbox will default to "on" for you.
```

---

### Email #4: Kenny N (No Reason Provided) 🎯 LOW PRIORITY

**To**: k_naterwala@hotmail.com
**Subject**: We've Made Big Improvements to RetireZest
**Priority**: LOW (no specific issue identified)

```html
Hi Kenny,

You deleted your RetireZest account on January 27th. While you didn't share why, we wanted to let you know about some major improvements we've made:

**What's New:**
✅ **Easier Partner Management** - Switch between single and couple planning with one click
✅ **Better Retirement Strategies** - Clearer naming for income optimization options
✅ **More Flexible Income Planning** - New pension indexing controls
✅ **Improved Feedback System** - We now require deletion reasons to help us improve

Your account is still recoverable for 22 days. If there was something that frustrated you, there's a good chance we've fixed it.

[Give RetireZest Another Try →]

We're committed to building the best retirement planning tool for Canadians. Your feedback (even if it's after the fact) would help us improve.

Best regards,
The RetireZest Team

P.S. If you have a moment, we'd love to hear what led you to delete your account. Reply to this email - we read every response.
```

---

### Email #5: Maurice Poitras (Language Barrier) ⏸️ ON HOLD

**To**: mauricepoitras@gmail.com
**Subject**: N/A - French Language Support Not Yet Available
**Priority**: ON HOLD (cannot solve yet)

**Reason for No Email**:
Maurice's deletion reason was: "I am not fluent enough in english to take advantage of retirezest."

**Why Not Sending**:
- French language support is not yet implemented
- Would be dishonest to reach out without solving his core issue
- Could damage brand reputation by raising false expectations

**Future Action**:
- Add to French language beta testing list
- Reach out when French version is available
- Offer early access as thanks for his patience

---

## Email Sending Instructions

### Prerequisites
1. ✅ Vercel deployment must be complete
2. ✅ Production testing verified (all fixes working)
3. ✅ No critical bugs in production

### Sending Order (Prioritized)
1. **Susan McMillan** (Partner removal - highest impact)
2. **Ian Crawford** (RRIF features - sophisticated user)
3. **Paul Lamothe** (Pension indexing - clear need)
4. **Kenny N** (No reason - lowest priority)
5. **Maurice Poitras** (Skip for now - language issue)

### Timing
- **Best Time**: 48 hours after deployment (give time for stability)
- **Day of Week**: Tuesday or Wednesday
- **Time of Day**: 10am-2pm local time (Canada)

### Technical Implementation

#### Option 1: Using Resend API (Recommended)

Create a script to send personalized emails:

```javascript
// send_reengagement_emails.js
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const emails = [
  {
    to: 'j.mcmillan@shaw.ca',
    subject: 'We Fixed It! Switch to Single Person Planning in One Click',
    template: 'susan_partner_removal',
    priority: 1
  },
  {
    to: 'ian.anita.crawford@gmail.com',
    subject: 'Early RRIF Withdrawals Feature Now Available',
    template: 'ian_rrif_features',
    priority: 2
  },
  {
    to: 'hgregoire2000@gmail.com',
    subject: 'Pension Indexing Feature Added - Your Feedback Made It Happen',
    template: 'paul_pension_indexing',
    priority: 3
  },
  {
    to: 'k_naterwala@hotmail.com',
    subject: 'We've Made Big Improvements to RetireZest',
    template: 'kenny_general',
    priority: 4
  }
];

async function sendReengagementEmails() {
  for (const email of emails) {
    try {
      const result = await resend.emails.send({
        from: 'RetireZest <noreply@retirezest.com>',
        to: email.to,
        subject: email.subject,
        html: getTemplate(email.template) // Your HTML template
      });

      console.log(`✅ Sent to ${email.to}: ${result.id}`);

      // Wait 2 seconds between emails to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed to send to ${email.to}:`, error);
    }
  }
}

sendReengagementEmails();
```

#### Option 2: Manual Send via Email Client
1. Copy email templates above
2. Personalize each one
3. Send from your @retirezest.com email
4. Track opens/clicks manually

### Tracking & Analytics

**Track These Metrics**:
1. Open Rate (industry avg: 20-25%)
2. Click Rate (reactivation link)
3. Actual Reactivations
4. Response Rate (replies)

**Expected Results**:
- **Open Rate**: 40-50% (highly personalized)
- **Click Rate**: 15-25%
- **Reactivation Rate**: 25-50% (1-2 users)
- **Highest Response**: Susan McMillan (her issue was critical)

### Recovery Tracking

Query to track reactivations:
```sql
-- Check if deleted users log back in
SELECT
  id,
  email,
  deletedAt,
  lastLoginAt,
  CASE
    WHEN lastLoginAt > deletedAt THEN 'REACTIVATED'
    ELSE 'STILL DELETED'
  END as status
FROM "User"
WHERE deletedAt IS NOT NULL
  AND deletedAt > '2026-01-11'
ORDER BY deletedAt DESC;
```

---

## Email Copy Guidelines

### What Works
✅ **Specific** - Reference their exact deletion reason
✅ **Solution-Focused** - Show exactly what we fixed
✅ **Personal** - Use their name, acknowledge their feedback
✅ **Time-Sensitive** - Mention 30-day recovery window
✅ **Easy Action** - Clear "Reactivate" button
✅ **Gratitude** - Thank them for helping improve the product

### What to Avoid
❌ Generic "we miss you" messages
❌ Defensive tone about the original issue
❌ Over-promising features not yet built
❌ Multiple CTAs (keep it simple)
❌ Wall of text (keep it scannable)

---

## Legal & Compliance

### ✅ CAN-SPAM Compliance
- Include unsubscribe link
- Use accurate from address
- Include physical address in footer
- Honor opt-outs within 10 business days

### ✅ CASL Compliance (Canadian Law)
- These users have existing business relationship (within 2 years)
- Emails are transactional (responding to their feedback)
- Include clear opt-out mechanism
- Identify sender clearly

### Email Footer
```
RetireZest Inc.
[Your Business Address]

You're receiving this because you recently deleted your RetireZest account
and we wanted to let you know we've addressed your feedback.

[Unsubscribe] | [Update Preferences]
```

---

## Success Criteria

### Week 1
- ✅ 4 emails sent successfully
- ✅ Track open rates
- ✅ Monitor reactivations

### Week 2-4
- ✅ At least 1 user reactivates
- ✅ Positive responses to feedback implementation
- ✅ No spam complaints

### Long-Term
- ✅ Build reputation for listening to users
- ✅ Reduce future deletion rates
- ✅ Create case study for product improvements

---

## Risk Assessment

### Low Risk
- Users explicitly provided feedback
- We're directly addressing their issues
- All fixes are tested and live

### Mitigation
- Don't send to Maurice (can't solve his issue)
- Wait 48 hours after deployment for stability
- Test all fixes in production first
- Personalize each email (not bulk send)

---

## Next Steps

1. ✅ **Now**: Wait for Vercel deployment to complete
2. ⏳ **+2 hours**: Test fixes in production
3. ⏳ **+48 hours**: Send emails to 4 users
4. ⏳ **+1 week**: Track reactivations
5. ⏳ **+2 weeks**: Report results

---

**Campaign Created**: January 29, 2026
**Ready to Send**: After production verification
**Expected Impact**: 1-2 reactivations, improved brand perception
**Status**: ⏳ **READY FOR EXECUTION**
