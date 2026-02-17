/**
 * Send Private Pension Enhancement Email to Marc Rondeau
 *
 * Notify Marc about the new private pension improvements and invite him back to test them.
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'RetireZest <noreply@retirezest.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://retirezest.com';

async function sendPensionUpdateEmail() {
  try {
    console.log('📧 Sending private pension enhancement notification to Marc Rondeau...\n');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RetireZest Update - Enhanced Private Pension Support</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🚀 RetireZest Update</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Enhanced Private Pension Support Now Available</p>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear Marc,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      I hope this email finds you well. We wanted to reach out to let you know about some significant improvements
      we've made to RetireZest based on user feedback, including enhancements that we believe will be particularly
      valuable for your retirement planning.
    </p>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #f59e0b;">🎁 Special Gift: One Year of Premium Access!</h3>
      <p style="margin-bottom: 10px;">
        As a thank you for your valuable feedback and bug reports, <strong>we've upgraded your account to Premium for one full year</strong> (expires February 17, 2027).
      </p>
      <p style="font-weight: 600; margin-bottom: 10px;">Your Premium benefits include:</p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Unlimited retirement simulations (vs 10/day on free tier)</li>
        <li>Priority access to new features as they're released</li>
        <li>Advanced Monte Carlo analysis (coming soon)</li>
        <li>Strategy optimization features (coming soon)</li>
        <li>Export capabilities (coming soon)</li>
        <li>Priority support</li>
      </ul>
    </div>

    <div style="background-color: white; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #10b981;">✨ What's New</h3>

      <p style="font-weight: 600; margin-bottom: 10px;">Enhanced Private Pension Support:</p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li><strong>Improved pension calculations</strong> that properly account for employer pensions in all tax and benefit calculations</li>
        <li><strong>Inflation indexing options</strong> - you can now specify whether your pension is indexed to inflation or remains fixed</li>
        <li><strong>Better integration</strong> with government benefits (CPP, OAS, GIS) to ensure accurate benefit eligibility calculations</li>
        <li><strong>Clearer labeling</strong> and guidance throughout the pension input process</li>
      </ul>

      <p style="font-weight: 600; margin-top: 20px; margin-bottom: 10px;">Additional Improvements:</p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Fixed calculation issues where high pension income was incorrectly qualifying for GIS benefits</li>
        <li>Enhanced TFSA contribution room tracking and surplus allocation</li>
        <li>Improved guidance for CPP and OAS estimates, with links to both RetireZest calculators and CRA resources</li>
        <li>More accurate year-by-year cash flow projections</li>
      </ul>
    </div>

    <div style="background-color: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #3b82f6;">📊 We'd Love Your Feedback</h3>
      <p style="margin-bottom: 15px;">
        Since you've previously used RetireZest for your retirement planning, we would greatly value your perspective
        on these improvements. We invite you to:
      </p>
      <ol style="margin: 10px 0; padding-left: 20px;">
        <li><strong>Log back into RetireZest</strong> at <a href="${APP_URL}" style="color: #3b82f6;">www.retirezest.com</a></li>
        <li><strong>Update your pension information</strong> with the new enhanced options</li>
        <li><strong>Run a fresh simulation</strong> to see your updated retirement projections</li>
        <li><strong>Share your thoughts</strong> on the improvements and any additional features you'd find helpful</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/simulation" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Try the Enhanced Features Now
      </a>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: #f59e0b;">💡 Quick Tip</h3>
      <p style="margin-bottom: 0;">
        When entering your pension information, look for the new "Indexed to inflation" checkbox.
        This allows you to specify whether your pension adjusts annually with inflation or remains at a fixed amount.
      </p>
    </div>

    <p style="font-size: 16px; margin-top: 30px; margin-bottom: 20px;">
      Your feedback has been instrumental in shaping these updates, and we're committed to continuing to improve
      RetireZest based on real user needs.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      If you have any questions about the new features or need any assistance with your retirement simulation,
      please don't hesitate to reach out. We're here to help ensure you have the most accurate and useful
      retirement planning experience possible.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for being a valued RetireZest user. We look forward to hearing about your experience with
      the enhanced pension features.
    </p>

    <p style="font-size: 16px; margin-bottom: 5px;">
      Best regards,
    </p>
    <p style="font-size: 16px; margin-top: 0;">
      The RetireZest Team<br>
      <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">www.retirezest.com</a>
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 14px; color: #6b7280; font-style: italic;">
      P.S. If you have colleagues or friends who could benefit from retirement planning with proper pension support,
      we'd appreciate you sharing RetireZest with them.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
    <p style="margin: 5px 0;">
      <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">Visit RetireZest</a> |
      <a href="${APP_URL}/tools" style="color: #3b82f6; text-decoration: none;">Retirement Calculators</a> |
      <a href="${APP_URL}/simulation" style="color: #3b82f6; text-decoration: none;">Run Simulation</a>
    </p>
    <p style="margin: 5px 0;">
      © 2026 RetireZest - Tax-optimized retirement planning for Canadians
    </p>
  </div>

</body>
</html>
`;

    const emailText = `
Dear Marc,

I hope this email finds you well. We wanted to reach out to let you know about some significant improvements we've made to RetireZest based on user feedback, including enhancements that we believe will be particularly valuable for your retirement planning.

SPECIAL GIFT: ONE YEAR OF PREMIUM ACCESS!
-----------------------------------------
As a thank you for your valuable feedback and bug reports, we've upgraded your account to Premium for one full year (expires February 17, 2027).

Your Premium benefits include:
- Unlimited retirement simulations (vs 10/day on free tier)
- Priority access to new features as they're released
- Advanced Monte Carlo analysis (coming soon)
- Strategy optimization features (coming soon)
- Export capabilities (coming soon)
- Priority support

WHAT'S NEW
----------

Enhanced Private Pension Support:
- Improved pension calculations that properly account for employer pensions in all tax and benefit calculations
- Inflation indexing options - you can now specify whether your pension is indexed to inflation or remains fixed
- Better integration with government benefits (CPP, OAS, GIS) to ensure accurate benefit eligibility calculations
- Clearer labeling and guidance throughout the pension input process

Additional Improvements:
- Fixed calculation issues where high pension income was incorrectly qualifying for GIS benefits
- Enhanced TFSA contribution room tracking and surplus allocation
- Improved guidance for CPP and OAS estimates, with links to both RetireZest calculators and CRA resources
- More accurate year-by-year cash flow projections

WE'D LOVE YOUR FEEDBACK
-----------------------

Since you've previously used RetireZest for your retirement planning, we would greatly value your perspective on these improvements. We invite you to:

1. Log back into RetireZest at www.retirezest.com
2. Update your pension information with the new enhanced options
3. Run a fresh simulation to see your updated retirement projections
4. Share your thoughts on the improvements and any additional features you'd find helpful

Your feedback has been instrumental in shaping these updates, and we're committed to continuing to improve RetireZest based on real user needs.

QUESTIONS OR CONCERNS?
---------------------

If you have any questions about the new features or need any assistance with your retirement simulation, please don't hesitate to reach out. We're here to help ensure you have the most accurate and useful retirement planning experience possible.

Thank you for being a valued RetireZest user. We look forward to hearing about your experience with the enhanced pension features.

Best regards,

The RetireZest Team
www.retirezest.com

P.S. If you have colleagues or friends who could benefit from retirement planning with proper pension support, we'd appreciate you sharing RetireZest with them.
`;

    // Send the email
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'mrondeau205@gmail.com',
      subject: 'RetireZest Update: Enhanced Private Pension Support Now Available',
      html: emailHtml,
      text: emailText
    });

    console.log('✅ Email sent successfully!');
    console.log('Email ID:', result.id);
    console.log('\nEmail Details:');
    console.log('  To: mrondeau205@gmail.com');
    console.log('  Subject: RetireZest Update: Enhanced Private Pension Support Now Available');
    console.log('  Status: Sent');
    console.log('\n📊 What Marc will see:');
    console.log('  - Notification of enhanced private pension support');
    console.log('  - List of specific improvements made');
    console.log('  - Invitation to test the new features');
    console.log('  - Clear call-to-action to run a new simulation');
    console.log('  - Request for feedback');
    console.log('\n✅ Email sent successfully!\n');

    return result;

  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

// Run the script
sendPensionUpdateEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });