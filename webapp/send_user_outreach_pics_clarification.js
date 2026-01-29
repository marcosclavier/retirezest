// Send user outreach email requesting clarification on "pics"
const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendUserOutreach() {
  try {
    console.log('📧 Sending user outreach email...\n');

    const { data, error } = await resend.emails.send({
      from: 'RetireZest Support <support@retirezest.com>',
      to: ['rightfooty218@gmail.com'],
      subject: "Your feedback about \"pics\" - can you help us fix it?",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h2 {
      color: #2563eb;
      font-size: 20px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .highlight {
      background-color: #fef3c7;
      padding: 15px;
      border-left: 4px solid #f59e0b;
      margin: 20px 0;
    }
    .cta {
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
      margin: 20px 0;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <p>Hi there,</p>

  <p>Thank you for taking the time to provide feedback on RetireZest. I'm reaching out personally because your feedback is really important to us.</p>

  <p>You gave us a 1/5 satisfaction score and mentioned: <em>"It doesn't take it to account when pics come due"</em> - and you're absolutely right to be frustrated. <strong>Accurate retirement projections are critical</strong>, and if we're not getting this right, that's a serious problem we need to fix immediately.</p>

  <p><strong>We take this very seriously.</strong> Your feedback has been flagged as our highest priority, and I'm personally investigating what went wrong with your simulation.</p>

  <h2>First, I need to understand what you meant</h2>

  <div class="highlight">
    <p><strong>In your feedback, you mentioned "pics" - could you clarify what you were referring to?</strong></p>

    <p><strong>Possible interpretations:</strong></p>
    <ul>
      <li>CPP/OAS benefits (Canada Pension Plan / Old Age Security)</li>
      <li>Pension payments</li>
      <li>RRIF withdrawals (Registered Retirement Income Fund)</li>
      <li>Some other type of income or payment</li>
      <li>Something else entirely</li>
    </ul>

    <p>Understanding what "pics" means will help us identify and fix the exact issue you experienced.</p>
  </div>

  <h2>Can you help us fix this?</h2>

  <p>Once I understand what you meant, could you also provide:</p>

  <ol>
    <li><strong>What did you enter in your simulation?</strong>
      <ul>
        <li>Example: "CPP starting at age 62, OAS at age 65"</li>
        <li>Or: "Company pension of $30,000/year starting at age 60"</li>
      </ul>
    </li>
    <li><strong>What did you expect to see in your results?</strong>
      <ul>
        <li>Example: "I expected to see $0 income until age 62, then payments starting"</li>
      </ul>
    </li>
    <li><strong>What did you actually see that was incorrect?</strong>
      <ul>
        <li>Example: "The simulation showed income starting immediately at age 60"</li>
        <li>Or: "The amounts were wrong - it didn't account for starting early/late"</li>
      </ul>
    </li>
    <li><strong>Did you try different start ages or scenarios?</strong>
      <ul>
        <li>If so, did the results ever look correct, or were they always wrong?</li>
      </ul>
    </li>
    <li><strong>Are there any other issues you noticed?</strong>
      <ul>
        <li>Income amounts incorrect, missing expenses, confusing results, etc.</li>
      </ul>
    </li>
  </ol>

  <h2>We want to make this right</h2>

  <p>If you'd prefer, I'm happy to jump on a quick 15-minute call to walk through your simulation together and identify exactly what's going wrong. Just reply to this email with a few times that work for you.</p>

  <p>Alternatively, if you're comfortable sharing, you could send me:</p>
  <ul>
    <li>A screenshot of your simulation inputs (what start ages/amounts you entered)</li>
    <li>A screenshot of the results page showing the incorrect output</li>
  </ul>

  <p><strong>Your privacy:</strong> We'll only use this information to fix the issue. We won't share your data with anyone, and we can delete it after the fix is deployed if you prefer.</p>

  <h2>What we're doing about it</h2>

  <p>Based on your feedback, we've created a high-priority bug fix (US-038) to investigate income timing issues. Once you clarify what "pics" refers to, we'll investigate:</p>

  <ul>
    <li>✅ Income start ages and timing (CPP, OAS, pensions, RRIF)</li>
    <li>✅ Ensuring $0 income before selected start ages</li>
    <li>✅ Correct amount calculations (early start reductions, deferral bonuses)</li>
    <li>✅ Accurate year-by-year income projections</li>
  </ul>

  <p>Once we've fixed this, we'd love to have you re-run your simulation and confirm the results are now accurate.</p>

  <h2>Why your feedback matters</h2>

  <p>RetireZest is designed to help Canadians make confident retirement decisions, especially around GIS eligibility and benefit optimization. If our simulations aren't accurate, we're not delivering on that promise.</p>

  <p>Your feedback helps us improve not just for you, but for everyone using the tool. Thank you for being honest with us - it's the only way we can get better.</p>

  <p>Looking forward to hearing from you!</p>

  <p>Best regards,<br>
  Juan Carlos Rodriguez<br>
  Founder, RetireZest<br>
  support@retirezest.com</p>

  <div class="footer">
    <p><em>P.S. If you've already moved on from RetireZest, I completely understand. But if you're willing to give us another chance after we fix this, I'd be grateful. I'll follow up personally once the fix is deployed to show you the corrected results.</em></p>
  </div>
</body>
</html>
      `,
      text: `
Hi there,

Thank you for taking the time to provide feedback on RetireZest. I'm reaching out personally because your feedback is really important to us.

You gave us a 1/5 satisfaction score and mentioned: "It doesn't take it to account when pics come due" - and you're absolutely right to be frustrated. Accurate retirement projections are critical, and if we're not getting this right, that's a serious problem we need to fix immediately.

We take this very seriously. Your feedback has been flagged as our highest priority, and I'm personally investigating what went wrong with your simulation.

FIRST, I NEED TO UNDERSTAND WHAT YOU MEANT

In your feedback, you mentioned "pics" - could you clarify what you were referring to?

Possible interpretations:
- CPP/OAS benefits (Canada Pension Plan / Old Age Security)
- Pension payments
- RRIF withdrawals (Registered Retirement Income Fund)
- Some other type of income or payment
- Something else entirely

Understanding what "pics" means will help us identify and fix the exact issue you experienced.

CAN YOU HELP US FIX THIS?

Once I understand what you meant, could you also provide:

1. What did you enter in your simulation?
   - Example: "CPP starting at age 62, OAS at age 65"
   - Or: "Company pension of $30,000/year starting at age 60"

2. What did you expect to see in your results?
   - Example: "I expected to see $0 income until age 62, then payments starting"

3. What did you actually see that was incorrect?
   - Example: "The simulation showed income starting immediately at age 60"
   - Or: "The amounts were wrong - it didn't account for starting early/late"

4. Did you try different start ages or scenarios?
   - If so, did the results ever look correct, or were they always wrong?

5. Are there any other issues you noticed?
   - Income amounts incorrect, missing expenses, confusing results, etc.

WE WANT TO MAKE THIS RIGHT

If you'd prefer, I'm happy to jump on a quick 15-minute call to walk through your simulation together and identify exactly what's going wrong. Just reply to this email with a few times that work for you.

Alternatively, if you're comfortable sharing, you could send me:
- A screenshot of your simulation inputs (what start ages/amounts you entered)
- A screenshot of the results page showing the incorrect output

Your privacy: We'll only use this information to fix the issue. We won't share your data with anyone, and we can delete it after the fix is deployed if you prefer.

WHAT WE'RE DOING ABOUT IT

Based on your feedback, we've created a high-priority bug fix (US-038) to investigate income timing issues. Once you clarify what "pics" refers to, we'll investigate:

- Income start ages and timing (CPP, OAS, pensions, RRIF)
- Ensuring $0 income before selected start ages
- Correct amount calculations (early start reductions, deferral bonuses)
- Accurate year-by-year income projections

Once we've fixed this, we'd love to have you re-run your simulation and confirm the results are now accurate.

WHY YOUR FEEDBACK MATTERS

RetireZest is designed to help Canadians make confident retirement decisions, especially around GIS eligibility and benefit optimization. If our simulations aren't accurate, we're not delivering on that promise.

Your feedback helps us improve not just for you, but for everyone using the tool. Thank you for being honest with us - it's the only way we can get better.

Looking forward to hearing from you!

Best regards,
Juan Carlos Rodriguez
Founder, RetireZest
support@retirezest.com

---

P.S. If you've already moved on from RetireZest, I completely understand. But if you're willing to give us another chance after we fix this, I'd be grateful. I'll follow up personally once the fix is deployed to show you the corrected results.
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
    console.log('📧 Email ID:', data.id);
    console.log('📨 Sent to: rightfooty218@gmail.com');
    console.log('📬 Subject: Your feedback about "pics" - can you help us fix it?\n');

    console.log('📊 Next steps:');
    console.log('  1. Monitor for user response (check support@retirezest.com)');
    console.log('  2. If user responds, investigate and fix reported issue');
    console.log('  3. If no response within 3-5 days, investigate based on simulation data');
    console.log('  4. Follow up with corrected results after fix deployed\n');

    // TODO: Update UserFeedback record to mark as responded
    console.log('⚠️  TODO: Update UserFeedback.responded = true in database');

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

sendUserOutreach();
