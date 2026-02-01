// Send clarification request email to user who provided feedback
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendClarificationEmail() {
  try {
    console.log('📧 Sending clarification request email...\n');

    const emailData = {
      from: 'RetireZest <support@retirezest.com>',
      to: ['rightfooty218@gmail.com'],
      subject: 'Re: Your RetireZest Feedback - Need More Details to Help',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">RetireZest</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">Helping You Plan Your Retirement with Confidence</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <h2 style="color: #1f2937; margin-top: 0;">Hi Right,</h2>

    <p>Thank you for taking the time to share your feedback about RetireZest! I really appreciate you letting us know about the issues you're experiencing with your simulation results.</p>

    <p>I want to make sure I fully understand the problem so we can fix it properly. You mentioned:</p>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-style: italic; color: #78350f;">
        <strong>1.</strong> "Doesn't give end date for investments"<br>
        <strong>2.</strong> "It says I will have 1000000 complete wrong when I am 90"
      </p>
    </div>

    <p><strong>To help troubleshoot this, could you please provide some additional details?</strong></p>

    <h3 style="color: #667eea; margin-top: 25px;">📸 Screenshots (Most Helpful!)</h3>
    <p>If possible, could you take screenshots of:</p>
    <ul style="color: #4b5563;">
      <li>The simulation results page showing the $1,000,000 figure</li>
      <li>The year-by-year breakdown (if visible)</li>
      <li>Any charts or graphs that look incorrect</li>
    </ul>

    <h3 style="color: #667eea; margin-top: 25px;">🔍 More Context</h3>
    <ul style="color: #4b5563;">
      <li><strong>Which account shows $1M at age 90?</strong> (LIRA, TFSA, Non-Registered, or Total balance?)</li>
      <li><strong>What "end date" would you expect to see?</strong> For example:
        <ul>
          <li>When your LIRA converts to a LRIF (at age 71)?</li>
          <li>When your accounts will be depleted/empty?</li>
          <li>Something else?</li>
        </ul>
      </li>
      <li><strong>About the $1M balance:</strong> Are you expecting your investments to run out by age 90, or is the $1M higher than you expected?</li>
    </ul>

    <h3 style="color: #667eea; margin-top: 25px;">📊 Your Current Profile (For Verification)</h3>
    <p>Based on your profile, I see:</p>
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0;"><strong>Age:</strong></td>
          <td style="padding: 5px 0; text-align: right;">67</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;"><strong>Total Assets:</strong></td>
          <td style="padding: 5px 0; text-align: right;">~$303,000</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; padding-left: 20px; font-size: 14px; color: #6b7280;">LIRA:</td>
          <td style="padding: 5px 0; text-align: right; font-size: 14px; color: #6b7280;">$119,000</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; padding-left: 20px; font-size: 14px; color: #6b7280;">Non-Registered:</td>
          <td style="padding: 5px 0; text-align: right; font-size: 14px; color: #6b7280;">$94,000</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; padding-left: 20px; font-size: 14px; color: #6b7280;">TFSA:</td>
          <td style="padding: 5px 0; text-align: right; font-size: 14px; color: #6b7280;">$90,000</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; border-top: 1px solid #d1d5db; padding-top: 10px;"><strong>Annual Income:</strong></td>
          <td style="padding: 5px 0; text-align: right; border-top: 1px solid #d1d5db; padding-top: 10px;">~$22,000</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; padding-left: 20px; font-size: 14px; color: #6b7280;">CPP + OAS + Pension</td>
          <td style="padding: 5px 0; text-align: right; font-size: 14px; color: #6b7280;"></td>
        </tr>
        <tr>
          <td style="padding: 5px 0; border-top: 1px solid #d1d5db; padding-top: 10px;"><strong>Annual Expenses:</strong></td>
          <td style="padding: 5px 0; text-align: right; border-top: 1px solid #d1d5db; padding-top: 10px;">$60,000</td>
        </tr>
      </table>
    </div>
    <p style="margin-top: 15px;"><strong>Does this match what you entered?</strong> If not, please let me know what's different.</p>

    <h3 style="color: #667eea; margin-top: 25px;">💡 What We're Investigating</h3>
    <p>Your feedback is helping us identify two potential issues:</p>
    <ol style="color: #4b5563;">
      <li><strong>LIRA Conversion Display</strong> - We may not be clearly showing when your LIRA converts to a LRIF at age 71</li>
      <li><strong>Investment Growth Clarity</strong> - We may need to better explain why your accounts could grow to $1M (due to compound interest on your investments)</li>
    </ol>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af;">
        <strong>📧 How to Reply:</strong> Simply hit "Reply" to this email with your screenshots or additional details, and I'll investigate right away!
      </p>
    </div>

    <p>Any screenshots, descriptions, or additional context you can provide will help us fix this quickly!</p>

    <p>Thanks again for your patience and for helping us improve RetireZest.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>J. Clavier</strong><br>
      <span style="color: #6b7280;">Product Manager, RetireZest</span>
    </p>

    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 30px; border: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
        <strong>P.S.</strong> If you'd prefer a quick call to walk through what you're seeing, I'm happy to schedule 15 minutes at your convenience. Just let me know!
      </p>
    </div>

  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">
      RetireZest - Retirement Planning Made Simple<br>
      <a href="https://www.retirezest.com" style="color: #667eea; text-decoration: none;">www.retirezest.com</a>
    </p>
  </div>

</body>
</html>
      `,
      text: `Hi Right,

Thank you for taking the time to share your feedback about RetireZest! I really appreciate you letting us know about the issues you're experiencing with your simulation results.

I want to make sure I fully understand the problem so we can fix it properly. You mentioned:

1. "Doesn't give end date for investments"
2. "It says I will have 1000000 complete wrong when I am 90"

To help troubleshoot this, could you please provide some additional details?

📸 SCREENSHOTS (MOST HELPFUL!)
If possible, could you take screenshots of:
- The simulation results page showing the $1,000,000 figure
- The year-by-year breakdown (if visible)
- Any charts or graphs that look incorrect

🔍 MORE CONTEXT
- Which account shows $1M at age 90? (LIRA, TFSA, Non-Registered, or Total balance?)
- What "end date" would you expect to see? For example:
  * When your LIRA converts to a LRIF (at age 71)?
  * When your accounts will be depleted/empty?
  * Something else?
- About the $1M balance: Are you expecting your investments to run out by age 90, or is the $1M higher than you expected?

📊 YOUR CURRENT PROFILE (FOR VERIFICATION)
Based on your profile, I see:
- Age: 67
- Total Assets: ~$303,000
  * LIRA: $119,000
  * Non-Registered: $94,000
  * TFSA: $90,000
- Annual Income: ~$22,000 (CPP + OAS + Pension)
- Annual Expenses: $60,000

Does this match what you entered? If not, please let me know what's different.

💡 WHAT WE'RE INVESTIGATING
Your feedback is helping us identify two potential issues:
1. LIRA Conversion Display - We may not be clearly showing when your LIRA converts to a LRIF at age 71
2. Investment Growth Clarity - We may need to better explain why your accounts could grow to $1M (due to compound interest on your investments)

📧 HOW TO REPLY: Simply hit "Reply" to this email with your screenshots or additional details, and I'll investigate right away!

Any screenshots, descriptions, or additional context you can provide will help us fix this quickly!

Thanks again for your patience and for helping us improve RetireZest.

Best regards,
J. Clavier
Product Manager, RetireZest

P.S. - If you'd prefer a quick call to walk through what you're seeing, I'm happy to schedule 15 minutes at your convenience. Just let me know!

---
RetireZest - Retirement Planning Made Simple
www.retirezest.com
`
    };

    console.log('Sending to:', emailData.to[0]);
    console.log('From:', emailData.from);
    console.log('Subject:', emailData.subject);
    console.log('');

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('❌ Error sending email:', error);
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', data.id);
    console.log('');
    console.log('📧 Email Summary:');
    console.log('   To: rightfooty218@gmail.com');
    console.log('   Purpose: Request clarification on simulation feedback');
    console.log('   Questions Asked:');
    console.log('     - Screenshot of $1M figure');
    console.log('     - Which account shows $1M (LIRA/TFSA/NonReg)');
    console.log('     - What "end date" means to them');
    console.log('     - Verify profile data accuracy');
    console.log('');
    console.log('✅ User outreach complete. Awaiting response.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

sendClarificationEmail();
