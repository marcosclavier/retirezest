const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const prisma = new PrismaClient();

/**
 * Send Remaining Emails - Rate Limited Version
 * Sends to users who failed due to rate limiting
 */

// Failed users from previous run
const FAILED_USERS = [
  'jordametcalfe1@gmail.com',
  'fresh.ship4097@mailforce.link',
  'dull.line9747@mailforce.link',
  'lmcolty@hotmail.com',
  'anoopat393@gmail.com',
  'john.brady@me.com',
  'gthomas@g3consulting.com',
  'frederic_tremblay@hotmail.com',
  'aburleigh@outlook.com',
  'jeff@jeffross.org',
  'dholaney@gmail.com',
  'melanerivard@yahoo.ca',
  'kgriffin2256@gmail.com',
  'erin.fedak@gmail.com',
  'chuckcollins1@hotmail.com',
  'jaswinderspandher@gmail.com',
];

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// HTML Email Template for Verified Users
function getVerifiedUserEmailHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulation Bug Fixed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                🎉 Great News!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Greetings,
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Great news! We've fixed the technical issue that was preventing you from running retirement simulations.
              </p>
              <p style="margin: 0 0 30px; color: #059669; font-size: 18px; font-weight: 600;">
                ✅ You can now use the simulation feature!
              </p>
              <p style="margin: 0 0 10px; color: #374151; font-size: 16px; line-height: 1.6;">
                We noticed you've already:
              </p>
              <ul style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                <li>✅ Created your account</li>
                <li>✅ Verified your email</li>
                <li>✅ Added your financial information</li>
              </ul>
              <p style="margin: 0 0 20px; color: #111827; font-size: 18px; font-weight: 600;">
                Next Step: Run your first retirement simulation!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://retirezest.com/simulation" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
                      Run Your Simulation Now →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 10px; color: #374151; font-size: 16px; line-height: 1.6;">
                The simulation will show you:
              </p>
              <ul style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                <li>Year-by-year projections of your retirement income</li>
                <li>Tax-optimized withdrawal strategies</li>
                <li>CPP/OAS timing recommendations</li>
                <li>Asset growth projections</li>
                <li>And much more!</li>
              </ul>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                We apologize for the inconvenience this bug caused. We've tested the fix extensively and everything is working smoothly now.
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Need help getting started? Just reply to this email and we'll assist you.
              </p>
              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>The RetireZest Team</strong>
              </p>
              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; font-style: italic;">
                P.S. Your financial data is safe and secure - we just fixed the button that lets you see your projections!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                © ${new Date().getFullYear()} RetireZest. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// HTML Email Template for Unverified Users
function getUnverifiedUserEmailHTML(verificationLink) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                📧 One Quick Step
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Greetings,
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                We noticed you've loaded your financial information into RetireZest - that's great!
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                There's just <strong>one quick step</strong> before you can run your retirement simulation:
              </p>
              <p style="margin: 0 0 20px; color: #d97706; font-size: 18px; font-weight: 600;">
                📧 Please verify your email address
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.25);">
                      Verify Your Email Now →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 10px; color: #374151; font-size: 16px; line-height: 1.6;">
                Once verified, you'll unlock:
              </p>
              <ul style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                <li>✅ Unlimited retirement calculations</li>
                <li>✅ Year-by-year projections</li>
                <li>✅ Tax-optimized strategies</li>
                <li>✅ CPP/OAS timing recommendations</li>
                <li>✅ Interactive what-if scenarios</li>
              </ul>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="margin: 0 0 10px; color: #111827; font-size: 16px; font-weight: 600;">
                Why verify?
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Email verification ensures we can send you important account information and helps keep your financial data secure.
              </p>
              <p style="margin: 0 0 10px; color: #111827; font-size: 16px; font-weight: 600;">
                Didn't receive the verification email?
              </p>
              <ul style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                <li>Check your spam folder</li>
                <li>Add noreply@retirezest.com to your contacts</li>
                <li>Or just reply to this email and we'll help you out</li>
              </ul>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                We're excited to help you plan your retirement!
              </p>
              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Best regards,<br>
                <strong>The RetireZest Team</strong>
              </p>
              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; font-style: italic;">
                P.S. The verification link expires in 48 hours, so click it soon!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                © ${new Date().getFullYear()} RetireZest. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function sendRemainingEmails() {
  console.log('='.repeat(80));
  console.log('SENDING REMAINING EMAILS (Rate Limited)');
  console.log('='.repeat(80));
  console.log('');

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  if (!apiKey || !fromEmail) {
    console.error('❌ Missing RESEND_API_KEY or EMAIL_FROM');
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  console.log(`✅ Resend initialized`);
  console.log(`📧 From: ${fromEmail}`);
  console.log('');

  // Get failed users from database
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: FAILED_USERS
      }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      emailVerificationToken: true,
      _count: {
        select: {
          assets: true,
        }
      }
    }
  });

  console.log(`Found ${users.length} users to email`);
  console.log('');

  let emailsSent = 0;
  let emailsFailed = 0;
  const errors = [];

  for (const user of users) {
    console.log(`To: ${user.email}`);
    console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
    console.log(`   Verified: ${user.emailVerified ? 'Yes' : 'No'}`);

    try {
      let result;

      if (user.emailVerified) {
        // Send verified user email
        result = await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: 'Great news - we fixed the simulation bug! 🎉',
          html: getVerifiedUserEmailHTML(),
        });
      } else {
        // Send unverified user email
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://retirezest.com'}/verify-email?token=${user.emailVerificationToken}`;
        result = await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: 'One quick step to unlock your retirement simulation 📧',
          html: getUnverifiedUserEmailHTML(verificationLink),
        });
      }

      if (result.error) {
        console.log(`   ❌ Failed: ${result.error.message}`);
        emailsFailed++;
        errors.push({ user: user.email, error: result.error.message });
      } else {
        console.log(`   ✅ Sent (ID: ${result.data?.id})`);
        emailsSent++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      emailsFailed++;
      errors.push({ user: user.email, error: error.message });
    }

    // Sleep 600ms between emails (slightly under 2/second to be safe)
    await sleep(600);
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Emails Sent: ${emailsSent}`);
  console.log(`Emails Failed: ${emailsFailed}`);
  console.log('');

  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  - ${e.user}: ${e.error}`));
  }

  console.log('');
  console.log('='.repeat(80));
}

sendRemainingEmails()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
