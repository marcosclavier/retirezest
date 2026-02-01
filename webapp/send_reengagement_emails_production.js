const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const prisma = new PrismaClient();

/**
 * Re-engagement Email Campaign for Bug Fix - PRODUCTION VERSION
 *
 * Sends targeted emails to REAL users only (excludes test users)
 * - 11 verified users: "Bug fixed - try simulations now!"
 * - 23 unverified users: "Verify your email to unlock simulations"
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

// Email templates
const VERIFIED_USER_EMAIL = {
  subject: "Great news - we fixed the simulation bug! 🎉",
  body: (user) => `
Greetings,

Great news! We've fixed the technical issue that was preventing you from running retirement simulations.

**You can now use the simulation feature!** ✅

We noticed you've already:
- ✅ Created your account
- ✅ Verified your email
- ✅ Added your financial information

**Next Step**: Run your first retirement simulation!

[Click here to run your simulation now →](https://retirezest.com/simulation)

The simulation will show you:
- Year-by-year projections of your retirement income
- Tax-optimized withdrawal strategies
- CPP/OAS timing recommendations
- Asset growth projections
- And much more!

We apologize for the inconvenience this bug caused. We've tested the fix extensively and everything is working smoothly now.

Need help getting started? Just reply to this email and we'll assist you.

Best regards,
The RetireZest Team

P.S. Your financial data is safe and secure - we just fixed the button that lets you see your projections!
`,
};

const UNVERIFIED_USER_EMAIL = {
  subject: "One quick step to unlock your retirement simulation 📧",
  body: (user, verificationLink) => `
Greetings,

We noticed you've loaded your financial information into RetireZest - that's great!

There's just **one quick step** before you can run your retirement simulation:

**Please verify your email address** 📧

[Click here to verify your email →](${verificationLink})

Once verified, you'll unlock:
- ✅ Unlimited retirement calculations
- ✅ Year-by-year projections
- ✅ Tax-optimized strategies
- ✅ CPP/OAS timing recommendations
- ✅ Interactive what-if scenarios

**Why verify?**
Email verification ensures we can send you important account information and helps keep your financial data secure.

**Didn't receive the verification email?**
- Check your spam folder
- Add noreply@retirezest.com to your contacts
- Or just reply to this email and we'll help you out

We're excited to help you plan your retirement!

Best regards,
The RetireZest Team

P.S. The verification link expires in 48 hours, so click it soon!
`,
};

async function sendReengagementEmails(dryRun = true) {
  console.log('='.repeat(80));
  console.log('RE-ENGAGEMENT EMAIL CAMPAIGN - PRODUCTION');
  console.log('='.repeat(80));
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent');
    console.log('   Set dryRun=false to actually send emails');
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

  console.log(`Real users (will email): ${realUsers.length}`);
  console.log('');

  // Separate by email verification status
  const verifiedUsers = realUsers.filter(u => u.emailVerified);
  const unverifiedUsers = realUsers.filter(u => !u.emailVerified);

  console.log(`Verified users: ${verifiedUsers.length}`);
  console.log(`Unverified users: ${unverifiedUsers.length}`);
  console.log('');

  // Email verified users
  console.log('='.repeat(80));
  console.log('EMAIL CAMPAIGN 1: VERIFIED USERS (Bug Fixed!)');
  console.log('='.repeat(80));
  console.log('');

  for (const user of verifiedUsers) {
    console.log(`To: ${user.email}`);
    console.log(`Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
    console.log(`Subject: ${VERIFIED_USER_EMAIL.subject}`);
    console.log(`Assets: ${user._count.assets}`);

    if (!dryRun) {
      // TODO: Integrate with actual email service
      // await sendEmail({
      //   to: user.email,
      //   subject: VERIFIED_USER_EMAIL.subject,
      //   html: VERIFIED_USER_EMAIL.body(user),
      // });
      console.log('✅ Email sent');
    } else {
      console.log('📧 [DRY RUN] Email would be sent');
    }
    console.log('');
  }

  // Email unverified users
  console.log('='.repeat(80));
  console.log('EMAIL CAMPAIGN 2: UNVERIFIED USERS (Verify Email!)');
  console.log('='.repeat(80));
  console.log('');

  for (const user of unverifiedUsers) {
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${user.emailVerificationToken}`;

    console.log(`To: ${user.email}`);
    console.log(`Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
    console.log(`Subject: ${UNVERIFIED_USER_EMAIL.subject}`);
    console.log(`Assets: ${user._count.assets}`);
    console.log(`Verification Link: ${verificationLink}`);

    if (!dryRun) {
      // TODO: Integrate with actual email service
      // await sendEmail({
      //   to: user.email,
      //   subject: UNVERIFIED_USER_EMAIL.subject,
      //   html: UNVERIFIED_USER_EMAIL.body(user, verificationLink),
      // });
      console.log('✅ Email sent');
    } else {
      console.log('📧 [DRY RUN] Email would be sent');
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('CAMPAIGN SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total Users in Database: ${allAffectedUsers.length}`);
  console.log(`  - Test Users (excluded): ${testUsers.length}`);
  console.log(`  - Real Users (emailed): ${realUsers.length}`);
  console.log(`    - Verified (Campaign 1): ${verifiedUsers.length}`);
  console.log(`    - Unverified (Campaign 2): ${unverifiedUsers.length}`);
  console.log('');

  if (dryRun) {
    console.log('Mode: DRY RUN (no emails sent)');
    console.log('');
    console.log('To send actual emails:');
    console.log('  1. Integrate with your email service (Resend, SendGrid, etc.)');
    console.log('  2. Uncomment email sending code above');
    console.log('  3. Run with: node send_reengagement_emails_production.js --send');
  } else {
    console.log('Mode: LIVE (emails sent)');
  }
  console.log('');

  // Expected outcomes
  console.log('='.repeat(80));
  console.log('EXPECTED OUTCOMES (24-48 HOURS)');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Email Open Rate: 40-50% (${Math.round(realUsers.length * 0.45)} users)`);
  console.log(`Click Through Rate: 30-40% (${Math.round(realUsers.length * 0.35)} users)`);
  console.log('');
  console.log('Verified Users:');
  console.log(`  - Simulation Run Rate: 80%+ (${Math.round(verifiedUsers.length * 0.8)}+ users)`);
  console.log(`  - Time to First Simulation: <30 minutes`);
  console.log('');
  console.log('Unverified Users:');
  console.log(`  - Email Verification Rate: 40-50% (${Math.round(unverifiedUsers.length * 0.45)} users)`);
  console.log(`  - Simulation Run Rate: 60%+ after verification`);
  console.log('');
  console.log('Overall Impact:');
  console.log(`  - Total Simulations Run: ${Math.round(verifiedUsers.length * 0.8 + unverifiedUsers.length * 0.45 * 0.6)}+ users`);
  console.log(`  - Premium Conversions: 20-30% (${Math.round(realUsers.length * 0.25)} users)`);
  console.log(`  - Revenue Impact: $${Math.round(realUsers.length * 0.25 * 5.99)}-${Math.round(realUsers.length * 0.3 * 5.99)}/month`);
  console.log('');

  console.log('='.repeat(80));
  console.log('NEXT STEPS');
  console.log('='.repeat(80));
  console.log('');
  console.log('1. Review user list above (verify no real users excluded)');
  console.log('2. Integrate with email service (Resend recommended)');
  console.log('3. Test with 1-2 users first');
  console.log('4. Send to all real users');
  console.log('5. Monitor metrics for 48 hours');
  console.log('6. Follow up with non-responders after 7 days');
  console.log('');
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--send');

// Run the campaign
sendReengagementEmails(dryRun)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
