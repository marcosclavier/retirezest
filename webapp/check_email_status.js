/**
 * Check Email Status by Resend ID
 *
 * Queries the Resend API to get the delivery status of emails sent via the
 * re-engagement campaign.
 *
 * Usage:
 *   node check_email_status.js [email_id]
 *   node check_email_status.js --all
 *
 * Examples:
 *   node check_email_status.js abc123
 *   node check_email_status.js --all  (checks all emails in tracking file)
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

async function checkEmailStatus(emailId) {
  try {
    // Note: Resend API may not have a direct "get email by ID" endpoint
    // This is a placeholder for the actual API call
    // Check Resend docs: https://resend.com/docs/api-reference/emails/retrieve-email

    const email = await resend.emails.get(emailId);

    return {
      id: emailId,
      status: email.status || 'unknown',
      to: email.to,
      subject: email.subject,
      created_at: email.created_at,
      last_event: email.last_event
    };
  } catch (error) {
    console.error(`Error fetching email ${emailId}: ${error.message}`);
    return {
      id: emailId,
      status: 'error',
      error: error.message
    };
  }
}

async function checkAllEmails() {
  const trackingFile = path.join(__dirname, 'email_tracking.json');

  if (!fs.existsSync(trackingFile)) {
    console.error('❌ Error: email_tracking.json not found');
    console.error('Run send_reengagement_emails.js first to create tracking data');
    process.exit(1);
  }

  const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));

  console.log('📧 Re-engagement Email Campaign Status');
  console.log('='.repeat(80));
  console.log(`Campaign: ${trackingData.campaign}`);
  console.log(`Sent Date: ${new Date(trackingData.sent_date).toLocaleString()}`);
  console.log(`Total Sent: ${trackingData.total_sent}`);
  console.log(`Total Failed: ${trackingData.total_failed}`);
  console.log('\n' + '='.repeat(80));
  console.log('📊 EMAIL STATUS');
  console.log('='.repeat(80));

  for (const email of trackingData.emails) {
    console.log(`\n[Priority ${email.priority}] ${email.recipient_name} (${email.recipient_email})`);
    console.log(`  Resend ID: ${email.resend_id || 'NOT CAPTURED'}`);
    console.log(`  Sent At: ${new Date(email.sent_at).toLocaleString()}`);

    if (email.resend_id) {
      console.log(`  Status: Checking...`);
      // Uncomment when Resend API is available
      // const status = await checkEmailStatus(email.resend_id);
      // console.log(`  Status: ${status.status}`);
      // console.log(`  Last Event: ${status.last_event || 'N/A'}`);
    } else {
      console.log(`  Status: ⚠️  Email ID not captured - cannot query Resend API`);
    }
  }

  if (trackingData.failed_emails && trackingData.failed_emails.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('❌ FAILED EMAILS');
    console.log('='.repeat(80));

    trackingData.failed_emails.forEach(email => {
      console.log(`\n${email.recipient_name} (${email.recipient_email})`);
      console.log(`  Error: ${email.error}`);
      console.log(`  Failed At: ${new Date(email.failed_at).toLocaleString()}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 NEXT STEPS');
  console.log('='.repeat(80));
  console.log('1. Check Resend dashboard for opens/clicks: https://resend.com/dashboard');
  console.log('2. Query database for user reactivations: node query_deleted_users.js');
  console.log('3. Monitor for email replies');
  console.log('4. Update this script with actual Resend API calls when available');
  console.log('\n' + '='.repeat(80));
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log('Usage:');
  console.log('  node check_email_status.js [email_id]  - Check specific email');
  console.log('  node check_email_status.js --all       - Check all tracked emails');
  console.log('\nExamples:');
  console.log('  node check_email_status.js abc123');
  console.log('  node check_email_status.js --all');
  process.exit(0);
}

if (args[0] === '--all') {
  checkAllEmails().catch(console.error);
} else {
  const emailId = args[0];
  checkEmailStatus(emailId).then(status => {
    console.log(JSON.stringify(status, null, 2));
  }).catch(console.error);
}
