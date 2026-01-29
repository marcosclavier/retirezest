# User Outreach Email - CPP/OAS Timing Issue

**To**: rightfooty218@gmail.com
**From**: support@retirezest.com (or jrcb@retirezest.com)
**Subject**: Your feedback about "pics" - can you help us fix it?
**Priority**: High

---

## Email Draft

**Subject**: We're investigating your feedback - can you help us fix it?

Hi there,

Thank you for taking the time to provide feedback on RetireZest. I'm reaching out personally because your feedback is really important to us.

You gave us a 1/5 satisfaction score and mentioned: *"It doesn't take it to account when pics come due"* - and you're absolutely right to be frustrated. **Accurate retirement projections are critical**, and if we're not getting this right, that's a serious problem we need to fix immediately.

**We take this very seriously.** Your feedback has been flagged as our highest priority, and I'm personally investigating what went wrong with your simulation.

## First, I need to understand what you meant

In your feedback, you mentioned **"pics"** - could you clarify what you were referring to?

**Possible interpretations:**
- CPP/OAS benefits (Canada Pension Plan / Old Age Security)
- Pension payments
- RRIF withdrawals (Registered Retirement Income Fund)
- Some other type of income or payment
- Something else entirely

Understanding what "pics" means will help us identify and fix the exact issue you experienced.

## Can you help us fix this?

Once I understand what you meant, could you also provide:

1. **What did you enter in your simulation?**
   - Example: "CPP starting at age 62, OAS at age 65"
   - Or: "Company pension of $30,000/year starting at age 60"

2. **What did you expect to see in your results?**
   - Example: "I expected to see $0 income until age 62, then payments starting"

3. **What did you actually see that was incorrect?**
   - Example: "The simulation showed income starting immediately at age 60"
   - Or: "The amounts were wrong - it didn't account for starting early/late"

4. **Did you try different start ages or scenarios?**
   - If so, did the results ever look correct, or were they always wrong?

5. **Are there any other issues you noticed?**
   - Income amounts incorrect, missing expenses, confusing results, etc.

## We want to make this right

If you'd prefer, I'm happy to jump on a quick 15-minute call to walk through your simulation together and identify exactly what's going wrong. You can book a time here: [calendar link] or just reply with a few times that work for you.

Alternatively, if you're comfortable sharing, you could send me:
- A screenshot of your simulation inputs (what start ages/amounts you entered)
- A screenshot of the results page showing the incorrect output

**Your privacy**: We'll only use this information to fix the issue. We won't share your data with anyone, and we can delete it after the fix is deployed if you prefer.

## What we're doing about it

Based on your feedback, we've created a high-priority bug fix (US-038) to investigate income timing issues. Once you clarify what "pics" refers to, we'll investigate:

- ✅ Income start ages and timing (CPP, OAS, pensions, RRIF)
- ✅ Ensuring $0 income before selected start ages
- ✅ Correct amount calculations (early start reductions, deferral bonuses)
- ✅ Accurate year-by-year income projections

Once we've fixed this, we'd love to have you re-run your simulation and confirm the results are now accurate.

## Why your feedback matters

Retire Zest is designed to help Canadians make confident retirement decisions, especially around GIS eligibility and benefit optimization. If our simulations aren't accurate, we're not delivering on that promise.

Your feedback helps us improve not just for you, but for everyone using the tool. Thank you for being honest with us - it's the only way we can get better.

Looking forward to hearing from you!

Best regards,
[Your Name]
Founder / Lead Developer, Retire Zest
support@retirezest.com

---

P.S. If you've already moved on from Retire Zest, I completely understand. But if you're willing to give us another chance after we fix this, I'd be grateful. I'll follow up personally once the fix is deployed to show you the corrected results.

---

## Email Metadata

**Tone**: Empathetic, professional, accountability-focused
**Length**: ~400 words (2-3 minute read)
**Call to Action**: Reply with details OR book a call
**Follow-up**: Send within 24 hours of feedback submission
**Expected Response Rate**: 20-40% (high priority, personal outreach)

## Alternative: Shorter Version (if preferred)

**Subject**: Your feedback about "pics" - what did you mean?

Hi,

Thanks for your feedback on RetireZest. You mentioned that simulations "don't take into account when pics come due" and gave us a 1/5 satisfaction score.

**First question: What did you mean by "pics"?**
- CPP/OAS benefits?
- Pension payments?
- RRIF withdrawals?
- Something else?

Once I understand what you meant, could you share:
1. What did you enter in your simulation? (start ages, amounts)
2. What was wrong in the results? (income timing, amounts, etc.)
3. Any screenshots showing the issue?

I'm happy to jump on a 15-minute call if that's easier: [calendar link]

Your feedback is critical to fixing this. Thank you for helping us improve.

Best,
[Your Name]
RetireZest

---

## Sending Instructions

**Using Resend API** (already integrated):

```javascript
// File: webapp/send_user_outreach_pics_clarification.js

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendUserOutreach() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'RetireZest Support <support@retirezest.com>',
      to: ['rightfooty218@gmail.com'],
      subject: "Your feedback about \"pics\" - can you help us fix it?",
      html: `
        [HTML version of email above]
      `,
      text: `
        [Plain text version of email above]
      `,
      reply_to: 'support@retirezest.com',
      tags: [
        { name: 'category', value: 'user_outreach' },
        { name: 'priority', value: 'high' },
        { name: 'issue', value: 'income_timing_pics_unclear' },
        { name: 'feedback_id', value: '1b6410b0-f96b-4ecc-8320-a6d92aebd61d' }
      ]
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', data.id);

    // Update UserFeedback record to mark as responded
    // (Add database update logic here if needed)

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

sendUserOutreach();
```

**IMPORTANT NOTE**:
We're **asking the user to clarify what "pics" means** before assuming it's CPP/OAS. This prevents us from fixing the wrong issue and shows the user we're listening carefully to their feedback.

## Success Metrics

**If user responds with details**:
- ✅ Reproduce bug exactly
- ✅ Fix root cause
- ✅ Re-engage user with corrected results
- ✅ Turn detractor into promoter

**If user doesn't respond**:
- Still investigate based on user's original simulation data
- Fix bug for all users
- Consider as a general issue, not user-specific

## Notes

- Send email within 24-48 hours of feedback submission (Jan 29-30, 2026)
- Personal tone from founder/lead developer (higher response rate)
- Offer call option (shows seriousness)
- Don't be defensive - acknowledge the problem and commit to fixing it
- Follow up after fix is deployed with corrected results
