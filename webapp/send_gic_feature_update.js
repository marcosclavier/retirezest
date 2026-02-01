/**
 * Send email to user notifying them about GIC maturity feature implementation
 *
 * This email thanks the user for their feedback and informs them that
 * GIC maturity tracking has been implemented based on their suggestion.
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendGICFeatureUpdateEmail() {
  console.log('\n' + '='.repeat(80));
  console.log('SENDING GIC FEATURE UPDATE EMAIL');
  console.log('='.repeat(80));

  const email = {
    from: 'RetireZest <noreply@retirezest.com>',
    to: 'rightfooty218@gmail.com',
    subject: 'RetireZest Update: GIC Maturity Tracking Now Available',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GIC Feature Update - RetireZest</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #2563eb; margin-top: 0;">Thank You for Your Feedback!</h2>

    <p>Hi there,</p>

    <p>Thank you for your recent feedback about RetireZest. Your input is invaluable in helping us improve the platform.</p>

    <p><strong>We've listened, and we've acted.</strong></p>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border: 2px solid #10b981; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #10b981; margin-top: 0;">✅ New Feature: GIC Maturity Tracking</h3>

    <p>Based on your feedback, we've implemented comprehensive GIC (Guaranteed Investment Certificate) maturity tracking:</p>

    <ul style="line-height: 1.8;">
      <li><strong>Track maturity dates</strong> - Know exactly when your GICs mature</li>
      <li><strong>Calculate interest income</strong> - See accurate compound interest projections</li>
      <li><strong>Plan reinvestment strategies</strong> - Choose cash-out, auto-renew, or transfer options</li>
      <li><strong>Tax integration</strong> - GIC interest properly included in tax calculations</li>
    </ul>
  </div>

  <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #2563eb; margin-top: 0;">🚀 Try It Now</h3>

    <p>You can add your GIC assets at:</p>

    <p style="text-align: center; margin: 20px 0;">
      <a href="https://www.retirezest.com/profile/assets"
         style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Add Your GICs →
      </a>
    </p>

    <p style="font-size: 14px; color: #666;">
      <strong>Getting Started:</strong>
      <br>1. Log in to your account
      <br>2. Go to Profile → Assets
      <br>3. Click "Add Asset" and select "GIC"
      <br>4. Enter your GIC details (maturity date, interest rate, etc.)
      <br>5. Run a new simulation to see GIC maturities in your retirement plan
    </p>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h3 style="color: #333; margin-top: 0;">💡 What's Improved</h3>

    <p>Your retirement projections now include:</p>
    <ul>
      <li>Accurate timing of when GICs mature</li>
      <li>Interest income calculations based on compounding frequency</li>
      <li>Tax implications of GIC interest</li>
      <li>Flexible reinvestment strategies</li>
    </ul>
  </div>

  <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
    <p><strong>We'd love to hear what you think!</strong></p>

    <p>Please try the new GIC feature and let us know if it addresses your needs. Your continued feedback helps us make RetireZest better for everyone.</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>The RetireZest Team</strong>
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; text-align: center;">
    <p>
      RetireZest - Canadian Retirement Planning Made Simple<br>
      <a href="https://www.retirezest.com" style="color: #2563eb; text-decoration: none;">www.retirezest.com</a>
    </p>
  </div>

</body>
</html>
    `,
    text: `
Thank You for Your Feedback!

Hi there,

Thank you for your recent feedback about RetireZest. Your input is invaluable in helping us improve the platform.

We've listened, and we've acted.

NEW FEATURE: GIC MATURITY TRACKING

Based on your feedback, we've implemented comprehensive GIC (Guaranteed Investment Certificate) maturity tracking:

- Track maturity dates - Know exactly when your GICs mature
- Calculate interest income - See accurate compound interest projections
- Plan reinvestment strategies - Choose cash-out, auto-renew, or transfer options
- Tax integration - GIC interest properly included in tax calculations

TRY IT NOW

You can add your GIC assets at:
https://www.retirezest.com/profile/assets

Getting Started:
1. Log in to your account
2. Go to Profile → Assets
3. Click "Add Asset" and select "GIC"
4. Enter your GIC details (maturity date, interest rate, etc.)
5. Run a new simulation to see GIC maturities in your retirement plan

WHAT'S IMPROVED

Your retirement projections now include:
- Accurate timing of when GICs mature
- Interest income calculations based on compounding frequency
- Tax implications of GIC interest
- Flexible reinvestment strategies

We'd love to hear what you think!

Please try the new GIC feature and let us know if it addresses your needs. Your continued feedback helps us make RetireZest better for everyone.

Best regards,
The RetireZest Team

---
RetireZest - Canadian Retirement Planning Made Simple
www.retirezest.com
    `.trim(),
  };

  try {
    console.log('\nEmail Details:');
    console.log(`  To: ${email.to}`);
    console.log(`  Subject: ${email.subject}`);
    console.log('\nSending email via Resend...\n');

    const result = await resend.emails.send(email);

    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('\nResend Response:');
    console.log(`  Email ID: ${result.id}`);
    console.log(`  Status: Success`);

    console.log('\n' + '='.repeat(80));
    console.log('EMAIL DELIVERY COMPLETE');
    console.log('='.repeat(80));
    console.log('\nNext Steps:');
    console.log('1. Monitor user response and feedback');
    console.log('2. Check if user logs in and adds GIC assets');
    console.log('3. Follow up in 1 week if no response');
    console.log('4. Track satisfaction score improvement\n');

    return result;
  } catch (error) {
    console.error('\n❌ ERROR SENDING EMAIL:');
    console.error(error);
    throw error;
  }
}

// Execute
sendGICFeatureUpdateEmail()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
