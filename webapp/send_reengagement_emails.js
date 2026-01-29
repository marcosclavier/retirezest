/**
 * Re-engagement Email Campaign for Deleted Users
 *
 * Sends personalized emails to 4 deleted users informing them their specific
 * issues have been fixed and inviting them to reactivate their accounts.
 *
 * Prerequisites:
 * 1. Vercel deployment completed and verified
 * 2. All fixes tested in production
 * 3. RESEND_API_KEY in .env.local
 *
 * Usage:
 *   node send_reengagement_emails.js
 *
 * See REENGAGEMENT_EMAILS.md for full documentation
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Check for API key
if (!process.env.RESEND_API_KEY) {
  console.error('❌ ERROR: RESEND_API_KEY not found in .env.local');
  console.error('Please ensure RESEND_API_KEY is set in .env.local file');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates for each user
const emails = [
  {
    priority: 1,
    to: 'j.mcmillan@shaw.ca',
    name: 'Susan',
    subject: 'We Fixed It! Switch to Single Person Planning in One Click',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Hi Susan,</h2>

        <p>We heard you! When you deleted your account 6 days ago, you told us:</p>

        <blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 20px 0; color: #4b5563;">
          "I need to reset the data as it kept showing two people listed vs myself as a single person. It calculated doubled CPP and OAS income payments as I couldn't figure out how to remove the 2nd one."
        </blockquote>

        <p style="font-weight: bold; font-size: 18px; color: #059669;">We've fixed this exact issue.</p>

        <h3 style="color: #1f2937;">What's New:</h3>
        <ul style="line-height: 1.8;">
          <li>✅ <strong>One-Click Partner Toggle</strong> - Switch between single and couple planning instantly</li>
          <li>✅ <strong>Clear Visual Labels</strong> - See exactly which mode you're in (👤 Single / 👫 Couple)</li>
          <li>✅ <strong>Reassurance Message</strong> - Know that your partner data is safe, just ignored in single mode</li>
          <li>✅ <strong>No More Doubled Benefits</strong> - CPP and OAS calculate correctly for one person</li>
        </ul>

        <p><strong>You no longer need to delete your account to "reset" - just flip a switch!</strong></p>

        <p>Your account data is still recoverable for the next 24 days. We'd love to have you back to try the improved experience.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://retirezest.com/login" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reactivate My Account →
          </a>
        </div>

        <p>Thank you for your honest feedback - it helped us improve RetireZest for everyone.</p>

        <p style="margin-top: 30px;">
          Best regards,<br>
          The RetireZest Team
        </p>

        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
          P.S. It takes just one click in Settings to switch between single and couple planning now. No more confusion!
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 11px; color: #9ca3af;">
          RetireZest Inc.<br>
          You're receiving this because you recently deleted your RetireZest account and we wanted to let you know we've addressed your feedback.
        </p>
      </div>
    `
  },
  {
    priority: 2,
    to: 'ian.anita.crawford@gmail.com',
    name: 'Ian',
    subject: 'Early RRIF Withdrawals Feature Now Available',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Hi Ian,</h2>

        <p>You deleted your account on the same day you signed up (Jan 18) because:</p>

        <blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 20px 0; color: #4b5563;">
          "Need ability make more detailed decisions like early RRIF Withdrawals for wife with no income."
        </blockquote>

        <p style="font-weight: bold; font-size: 18px; color: #059669;">Great news - this feature exists and we've made it much easier to find!</p>

        <h3 style="color: #1f2937;">What's New:</h3>
        <ul style="line-height: 1.8;">
          <li>✅ <strong>"Early RRIF Withdrawals (Income Splitting)"</strong> - Now clearly labeled in strategy options</li>
          <li>✅ <strong>Ideal for Couples with Income Imbalance</strong> - Exactly what you described</li>
          <li>✅ <strong>Smart Optimization</strong> - Withdraws 15% of RRIF before OAS/CPP starts, then 8% after</li>
          <li>✅ <strong>Automatic OAS Protection</strong> - Switches to TFSA/NonReg to avoid clawback</li>
        </ul>

        <p>This strategy is specifically designed for couples where one spouse has little to no income - perfect for optimizing household taxes through income splitting.</p>

        <p>Your account is still recoverable for 23 days. As someone with sophisticated retirement planning needs, we think you'll find this feature valuable.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://retirezest.com/login" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Try Early RRIF Withdrawals →
          </a>
        </div>

        <p>Thank you for your clear feedback - it helped us improve our strategy naming and discoverability.</p>

        <p style="margin-top: 30px;">
          Best regards,<br>
          The RetireZest Team
        </p>

        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
          P.S. Select "Early RRIF Withdrawals (Income Splitting)" in the strategy dropdown to see how much you could save with this approach.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 11px; color: #9ca3af;">
          RetireZest Inc.<br>
          You're receiving this because you recently deleted your RetireZest account and we wanted to let you know we've addressed your feedback.
        </p>
      </div>
    `
  },
  {
    priority: 3,
    to: 'hgregoire2000@gmail.com',
    name: 'Paul',
    subject: 'Pension Indexing Feature Added - Your Feedback Made It Happen',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Hi Paul,</h2>

        <p>You deleted your account on January 16th because:</p>

        <blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 20px 0; color: #4b5563;">
          "no possibility to index the pension found"
        </blockquote>

        <p style="font-weight: bold; font-size: 18px; color: #059669;">We've added the pension indexing feature you needed!</p>

        <h3 style="color: #1f2937;">What's New:</h3>
        <ul style="line-height: 1.8;">
          <li>✅ <strong>Inflation Indexing Checkbox</strong> - Now visible for all pension income sources</li>
          <li>✅ <strong>Smart Defaults</strong> - Automatically checked (most Canadian DB pensions are indexed)</li>
          <li>✅ <strong>Contextual Help</strong> - Clear explanations for CPP, OAS, and private pensions</li>
          <li>✅ <strong>Accurate Projections</strong> - Your pension will now correctly increase with inflation</li>
        </ul>

        <p>When you add a pension income source, you'll see a clear checkbox to indicate if your pension adjusts for inflation each year. This ensures your retirement projections are accurate and realistic.</p>

        <p>Your account is still recoverable for 21 days. We'd love to have you back to see your pension properly modeled with inflation protection.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://retirezest.com/login" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reactivate My Account →
          </a>
        </div>

        <p>Thank you for your direct feedback - it helped us add a feature that many users will benefit from.</p>

        <p style="margin-top: 30px;">
          Best regards,<br>
          The RetireZest Team
        </p>

        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
          P.S. Most Canadian DB pensions and all government pensions (CPP/OAS) are automatically indexed to inflation, so the checkbox will default to "on" for you.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 11px; color: #9ca3af;">
          RetireZest Inc.<br>
          You're receiving this because you recently deleted your RetireZest account and we wanted to let you know we've addressed your feedback.
        </p>
      </div>
    `
  },
  {
    priority: 4,
    to: 'k_naterwala@hotmail.com',
    name: 'Kenny',
    subject: 'We\'ve Made Big Improvements to RetireZest',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Hi Kenny,</h2>

        <p>You deleted your RetireZest account on January 27th. While you didn't share why, we wanted to let you know about some major improvements we've made:</p>

        <h3 style="color: #1f2937;">What's New:</h3>
        <ul style="line-height: 1.8;">
          <li>✅ <strong>Easier Partner Management</strong> - Switch between single and couple planning with one click</li>
          <li>✅ <strong>Better Retirement Strategies</strong> - Clearer naming for income optimization options</li>
          <li>✅ <strong>More Flexible Income Planning</strong> - New pension indexing controls</li>
          <li>✅ <strong>Improved Feedback System</strong> - We now require deletion reasons to help us improve</li>
        </ul>

        <p>Your account is still recoverable for 22 days. If there was something that frustrated you, there's a good chance we've fixed it.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://retirezest.com/login" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Give RetireZest Another Try →
          </a>
        </div>

        <p>We're committed to building the best retirement planning tool for Canadians. Your feedback (even if it's after the fact) would help us improve.</p>

        <p style="margin-top: 30px;">
          Best regards,<br>
          The RetireZest Team
        </p>

        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
          P.S. If you have a moment, we'd love to hear what led you to delete your account. Reply to this email - we read every response.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 11px; color: #9ca3af;">
          RetireZest Inc.<br>
          You're receiving this because you recently deleted your RetireZest account and we wanted to let you know we've addressed your feedback.
        </p>
      </div>
    `
  }
];

// Main function to send emails
async function sendReengagementEmails() {
  console.log('📧 Re-engagement Email Campaign - Deleted Users');
  console.log('='.repeat(80));
  console.log(`\nSending to ${emails.length} users (Maurice Poitras excluded - language barrier)\n`);

  const results = {
    sent: [],
    failed: []
  };

  for (const email of emails) {
    console.log(`\n[Priority ${email.priority}] Sending to ${email.name} (${email.to})...`);
    console.log(`Subject: ${email.subject}`);

    try {
      const result = await resend.emails.send({
        from: 'RetireZest <noreply@retirezest.com>',
        to: email.to,
        subject: email.subject,
        html: email.html
      });

      console.log(`✅ SUCCESS - Email ID: ${result.id}`);
      results.sent.push({
        priority: email.priority,
        to: email.to,
        name: email.name,
        id: result.id
      });

      // Wait 2 seconds between emails to avoid rate limits
      if (emails.indexOf(email) < emails.length - 1) {
        console.log('⏳ Waiting 2 seconds before next email...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`❌ FAILED - Error: ${error.message}`);
      results.failed.push({
        priority: email.priority,
        to: email.to,
        name: email.name,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 CAMPAIGN SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n✅ Successfully Sent: ${results.sent.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.sent.length > 0) {
    console.log('\n✅ SENT EMAILS:');
    results.sent.forEach(r => {
      console.log(`  [Priority ${r.priority}] ${r.name} (${r.to}) - ID: ${r.id}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED EMAILS:');
    results.failed.forEach(r => {
      console.log(`  [Priority ${r.priority}] ${r.name} (${r.to}) - Error: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('📈 NEXT STEPS:');
  console.log('='.repeat(80));
  console.log('1. Monitor email open rates in Resend dashboard');
  console.log('2. Track reactivations using query_deleted_users.js');
  console.log('3. Check for replies to emails');
  console.log('4. Review metrics after 1 week');
  console.log('\nExpected Results:');
  console.log('  - Open Rate: 40-50%');
  console.log('  - Click Rate: 15-25%');
  console.log('  - Reactivation Rate: 25-50% (1-2 users)');
  console.log('  - Highest Response: Susan McMillan (critical issue fixed)');
  console.log('\n' + '='.repeat(80));

  // Save email tracking data to file
  try {
    const trackingFile = path.join(__dirname, 'email_tracking.json');
    const trackingData = {
      campaign: 're-engagement-deleted-users',
      sent_date: new Date().toISOString(),
      total_sent: results.sent.length,
      total_failed: results.failed.length,
      emails: results.sent.map(r => ({
        resend_id: r.id,
        recipient_email: r.to,
        recipient_name: r.name,
        priority: r.priority,
        sent_at: new Date().toISOString(),
        status: 'sent'
      })),
      failed_emails: results.failed.map(r => ({
        recipient_email: r.to,
        recipient_name: r.name,
        priority: r.priority,
        error: r.error,
        failed_at: new Date().toISOString()
      }))
    };

    fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
    console.log(`\n✅ Email tracking data saved to: ${trackingFile}`);
    console.log(`📊 Total Resend IDs captured: ${results.sent.length}`);
  } catch (error) {
    console.error(`\n⚠️  Warning: Failed to save tracking data: ${error.message}`);
  }

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Execute
sendReengagementEmails();
