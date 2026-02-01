const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const prisma = new PrismaClient();

/**
 * Re-engagement Email Campaign - PRODUCTION READY
 *
 * Sends emails to real users affected by simulation bug fixes
 * - Excludes test users automatically
 * - Uses Resend for email delivery
 * - HTML formatted emails with professional styling
 */

// Test user patterns to exclude
const TEST_PATTERNS = [
  '@test.com',
  '@example.com',
  'test@',
  'sprint5',
  'claire.conservative',
  'alex.aggressive',
  'mike.moderate',
  'sarah.struggling',
  'helen.highincome',
];

function isTestUser(user) {
  const email = user.email.toLowerCase();
  const firstName = (user.firstName || '').toLowerCase();
  const lastName = (user.lastName || '').toLowerCase();

  return TEST_PATTERNS.some(pattern =>
    email.includes(pattern.toLowerCase()) ||
    firstName.includes(pattern.toLowerCase()) ||
    lastName.includes(pattern.toLowerCase())
  );
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
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                🎉 Great News!
              </h1>
            </td>
          </tr>

          <!-- Content -->
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

              <!-- Button -->
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

          <!-- Footer -->
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                📧 One Quick Step
              </h1>
            </td>
          </tr>

          <!-- Content -->
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

              <!-- Button -->
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

          <!-- Footer -->
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

async function sendReengagementCampaign(dryRun = true) {
  console.log('='.repeat(80));
  console.log('RE-ENGAGEMENT EMAIL CAMPAIGN - PRODUCTION');
  console.log('='.repeat(80));
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent');
    console.log('   Run with --send flag to actually send emails');
    console.log('');
  } else {
    console.log('🚀 LIVE MODE - Emails will be sent!');
    console.log('');
  }

  // Initialize Resend if not in dry run mode
  let resend;
  if (!dryRun) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured in environment');
      console.error('   Please set RESEND_API_KEY before sending emails');
      process.exit(1);
    }

    if (!fromEmail) {
      console.error('❌ EMAIL_FROM not configured in environment');
      console.error('   Please set EMAIL_FROM before sending emails');
      process.exit(1);
    }

    resend = new Resend(apiKey);
    console.log(`✅ Resend initialized with from: ${fromEmail}`);
    console.log('');
  }

  // Find affected users (assets but no simulations)
  const allAffectedUsers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      assets: {
        some: {}
      },
      simulationRuns: {
        none: {}
      }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      emailVerificationToken: true,
      createdAt: true,
      _count: {
        select: {
          assets: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Total affected users in database: ${allAffectedUsers.length}`);
  console.log('');

  // Filter out test users
  const testUsers = allAffectedUsers.filter(u => isTestUser(u));
  const realUsers = allAffectedUsers.filter(u => !isTestUser(u));

  console.log(`Test users (excluded): ${testUsers.length}`);
  testUsers.forEach(u => console.log(`  - ${u.email}`));
  console.log('');

  console.log(`Real users (campaign targets): ${realUsers.length}`);
  console.log('');

  // Separate by email verification status
  const verifiedUsers = realUsers.filter(u => u.emailVerified);
  const unverifiedUsers = realUsers.filter(u => !u.emailVerified);

  console.log(`  - Verified: ${verifiedUsers.length} (Campaign 1: Bug fixed)`);
  console.log(`  - Unverified: ${unverifiedUsers.length} (Campaign 2: Verify email)`);
  console.log('');

  // Campaign stats
  let emailsSent = 0;
  let emailsFailed = 0;
  const errors = [];

  // Email verified users
  console.log('='.repeat(80));
  console.log('CAMPAIGN 1: VERIFIED USERS (Bug Fixed!)');
  console.log('='.repeat(80));
  console.log('');

  for (const user of verifiedUsers) {
    console.log(`To: ${user.email}`);
    console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
    console.log(`   Assets: ${user._count.assets}`);

    if (!dryRun) {
      try {
        const result = await resend.emails.send({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: 'Great news - we fixed the simulation bug! 🎉',
          html: getVerifiedUserEmailHTML(),
        });

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
    } else {
      console.log('   📧 [DRY RUN] Email would be sent');
    }
    console.log('');
  }

  // Email unverified users
  console.log('='.repeat(80));
  console.log('CAMPAIGN 2: UNVERIFIED USERS (Verify Email!)');
  console.log('='.repeat(80));
  console.log('');

  for (const user of unverifiedUsers) {
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://retirezest.com'}/verify-email?token=${user.emailVerificationToken}`;

    console.log(`To: ${user.email}`);
    console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
    console.log(`   Assets: ${user._count.assets}`);

    if (!dryRun) {
      try {
        const result = await resend.emails.send({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: 'One quick step to unlock your retirement simulation 📧',
          html: getUnverifiedUserEmailHTML(verificationLink),
        });

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
    } else {
      console.log('   📧 [DRY RUN] Email would be sent');
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('CAMPAIGN SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total Users: ${allAffectedUsers.length}`);
  console.log(`  - Test Users (excluded): ${testUsers.length}`);
  console.log(`  - Real Users (targeted): ${realUsers.length}`);
  console.log(`    - Verified (Campaign 1): ${verifiedUsers.length}`);
  console.log(`    - Unverified (Campaign 2): ${unverifiedUsers.length}`);
  console.log('');

  if (dryRun) {
    console.log('Mode: DRY RUN');
    console.log('');
    console.log('To send actual emails:');
    console.log('  1. Set RESEND_API_KEY in environment');
    console.log('  2. Set EMAIL_FROM in environment (e.g., noreply@retirezest.com)');
    console.log('  3. Run: RESEND_API_KEY=xxx EMAIL_FROM=noreply@retirezest.com node send_reengagement_campaign.js --send');
  } else {
    console.log('Mode: LIVE');
    console.log('');
    console.log(`Emails Sent: ${emailsSent}`);
    console.log(`Emails Failed: ${emailsFailed}`);
    console.log('');

    if (errors.length > 0) {
      console.log('Errors:');
      errors.forEach(e => console.log(`  - ${e.user}: ${e.error}`));
      console.log('');
    }
  }

  // Expected outcomes
  console.log('='.repeat(80));
  console.log('EXPECTED OUTCOMES (24-48 HOURS)');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Email Open Rate: 40-50% (~${Math.round(realUsers.length * 0.45)} users)`);
  console.log(`Click Through Rate: 30-40% (~${Math.round(realUsers.length * 0.35)} users)`);
  console.log('');
  console.log('Verified Users:');
  console.log(`  - Simulation Run Rate: 80%+ (~${Math.round(verifiedUsers.length * 0.8)} users)`);
  console.log(`  - Time to First Simulation: <30 minutes`);
  console.log('');
  console.log('Unverified Users:');
  console.log(`  - Email Verification Rate: 40-50% (~${Math.round(unverifiedUsers.length * 0.45)} users)`);
  console.log(`  - Simulation Run Rate: 60%+ after verification`);
  console.log('');
  console.log('Overall Impact:');
  console.log(`  - Total Simulations Run: ~${Math.round(verifiedUsers.length * 0.8 + unverifiedUsers.length * 0.45 * 0.6)} users`);
  console.log(`  - Premium Conversions: 20-30% (~${Math.round(realUsers.length * 0.25)} users)`);
  console.log(`  - Revenue Impact: $${Math.round(realUsers.length * 0.2 * 5.99)}-$${Math.round(realUsers.length * 0.3 * 5.99)}/month`);
  console.log('');

  console.log('='.repeat(80));
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--send');

// Run the campaign
sendReengagementCampaign(dryRun)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
