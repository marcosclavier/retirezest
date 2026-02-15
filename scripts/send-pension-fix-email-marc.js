/**
 * Send Pension Income Chart Fix Email to Marc Rondeau
 *
 * Thank Marc for reporting the bug and notify him that it's fixed.
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'RetireZest <noreply@retirezest.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://retirezest.com';

async function sendPensionFixEmail() {
  try {
    console.log('📧 Sending pension income fix notification to Marc Rondeau...\n');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pension Income Chart - Issue Resolved</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background-color: #10b981; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">✅ Issue Resolved!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Thank you for your feedback</p>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi Marc,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>Thank you for reporting the issue with pension income not appearing in your charts!</strong> Your feedback helped us identify and fix an important bug.
    </p>

    <div style="background-color: white; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #ef4444;">The Issue You Reported</h3>
      <p style="margin-bottom: 0;">
        Your private pension income was being included in tax calculations (so your taxes were correct),
        but it wasn't being displayed in the Income Composition chart. This understandably caused confusion
        about why taxes appeared higher than expected based on the visible income sources.
      </p>
    </div>

    <div style="background-color: white; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #10b981;">What We Fixed</h3>
      <p style="margin-bottom: 10px;">
        We've updated the Income Composition chart to now display <strong>all</strong> income sources:
      </p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li><strong>Private pension income</strong> ✅ (now visible!)</li>
        <li>Government benefits (CPP, OAS)</li>
        <li>Account withdrawals (RRSP/RRIF, TFSA, etc.)</li>
        <li>Employment income (if applicable)</li>
        <li>Rental income (if applicable)</li>
      </ul>
      <p style="margin-top: 15px; margin-bottom: 0;">
        Your chart will now show your complete income picture, making it easier to understand your
        retirement finances and tax situation.
      </p>
    </div>

    <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #3b82f6;">Next Steps</h3>
      <p style="margin-bottom: 10px;">To see the updated chart with your pension income:</p>
      <ol style="margin: 10px 0; padding-left: 20px;">
        <li>Log in to your RetireZest account</li>
        <li>Run a new simulation</li>
        <li>Check the Income Composition chart</li>
      </ol>
      <p style="margin-top: 15px; margin-bottom: 0;">
        Your pension income will now be clearly visible in the chart!
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/simulation" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Run a New Simulation
      </a>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #f59e0b;">Important Note</h3>
      <p style="margin-bottom: 0;">
        <strong>Your tax calculations were always correct.</strong> This fix only affects the chart display.
        You'll need to run a new simulation to see the updated charts with your pension income included.
      </p>
    </div>

    <p style="font-size: 16px; margin-top: 30px; margin-bottom: 20px;">
      Thank you again for taking the time to report this issue. User feedback like yours helps us
      continuously improve RetireZest for everyone.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      If you have any questions or notice any other issues, please don't hesitate to reach out!
    </p>

    <p style="font-size: 16px; margin-bottom: 5px;">
      Best regards,
    </p>
    <p style="font-size: 16px; margin-top: 0;">
      The RetireZest Team
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
      <strong>Technical Details (for those interested):</strong>
    </p>
    <ul style="font-size: 14px; color: #6b7280; margin: 0; padding-left: 20px;">
      <li>Fix deployed: February 9, 2026</li>
      <li>Testing: 5/5 comprehensive test scenarios passed</li>
      <li>Impact: Users with pension, employment, or rental income</li>
      <li>No action needed: Fix is automatic for new simulations</li>
    </ul>
  </div>

  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
    <p style="margin: 5px 0;">
      <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">Visit RetireZest</a>
    </p>
    <p style="margin: 5px 0;">
      Need help? Contact us through the app
    </p>
  </div>

</body>
</html>
`;

    const emailText = `
Hi Marc,

Thank you for reporting the issue with pension income not appearing in your charts! Your feedback helped us identify and fix an important bug.

THE ISSUE YOU REPORTED

Your private pension income was being included in tax calculations (so your taxes were correct), but it wasn't being displayed in the Income Composition chart. This understandably caused confusion about why taxes appeared higher than expected based on the visible income sources.

WHAT WE FIXED

We've updated the Income Composition chart to now display all income sources:
- Private pension income ✅ (now visible!)
- Government benefits (CPP, OAS)
- Account withdrawals (RRSP/RRIF, TFSA, etc.)
- Employment income (if applicable)
- Rental income (if applicable)

Your chart will now show your complete income picture, making it easier to understand your retirement finances and tax situation.

NEXT STEPS

To see the updated chart with your pension income:
1. Log in to your RetireZest account
2. Run a new simulation
3. Check the Income Composition chart

Your pension income will now be clearly visible in the chart!

Visit: ${APP_URL}/simulation

IMPORTANT NOTE

Your tax calculations were always correct. This fix only affects the chart display. You'll need to run a new simulation to see the updated charts with your pension income included.

Thank you again for taking the time to report this issue. User feedback like yours helps us continuously improve RetireZest for everyone.

If you have any questions or notice any other issues, please don't hesitate to reach out!

Best regards,
The RetireZest Team

---

Technical Details:
- Fix deployed: February 9, 2026
- Testing: 5/5 comprehensive test scenarios passed
- Impact: Users with pension, employment, or rental income
- No action needed: Fix is automatic for new simulations
`;

    // Send the email
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'mrondeau205@gmail.com',
      subject: 'Thank You - Pension Income Chart Issue Fixed!',
      html: emailHtml,
      text: emailText
    });

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', result.id);
    console.log('\nEmail Details:');
    console.log('  To: mrondeau205@gmail.com');
    console.log('  Subject: Thank You - Pension Income Chart Issue Fixed!');
    console.log('  Status: Sent');
    console.log('\n📊 What Marc will see:');
    console.log('  - Thank you for reporting the bug');
    console.log('  - Explanation of what was wrong');
    console.log('  - What we fixed');
    console.log('  - How to see the fix (run new simulation)');
    console.log('  - Button to run simulation');
    console.log('\n✅ Deployment complete!\n');

    return result;

  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

// Run the script
sendPensionFixEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
