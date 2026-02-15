/**
 * Script to send "Why no simulation?" survey email to users with data but no simulations
 * Usage: node scripts/send-no-simulation-survey.js
 */

const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendNoSimulationSurvey() {
  try {
    console.log('📊 Fetching users with data but no simulations...\n');

    // Get users with assets/income/expenses but no simulation runs
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { assets: { some: {} } },
          { incomeSources: { some: {} } },
          { expenses: { some: {} } },
          { realEstateAssets: { some: {} } },
          { debts: { some: {} } }
        ],
        simulationRuns: { none: {} }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        province: true,
        createdAt: true,
        unsubscribeToken: true,
        feedbackEmailsEnabled: true,
        marketingEmailsEnabled: true,
        _count: {
          select: {
            assets: true,
            incomeSources: true,
            expenses: true,
            realEstateAssets: true,
            debts: true
          }
        }
      }
    });

    console.log(`✅ Found ${users.length} users to survey\n`);

    if (users.length === 0) {
      console.log('No users to survey. Exiting.');
      process.exit(0);
    }

    // Track results
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Send emails
    for (const user of users) {
      const userName = user.firstName || 'there';
      const totalDataPoints =
        user._count.assets +
        user._count.incomeSources +
        user._count.expenses +
        user._count.realEstateAssets +
        user._count.debts;

      const daysSinceSignup = Math.floor(
        (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
      );

      console.log(`📧 Sending to ${user.email} (${daysSinceSignup} days since signup)...`);

      // Check if user has unsubscribed from feedback emails
      if (!user.feedbackEmailsEnabled) {
        console.log(`   ⏭️  Skipped - User unsubscribed from feedback emails`);
        skippedCount++;
        continue;
      }

      try {
        const emailData = await resend.emails.send({
          from: "Juan Clavier from RetireZest <contact@retirezest.com>",
          to: user.email,
          subject: "Quick question about your RetireZest experience 💭",
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
    .header {
      margin-bottom: 30px;
    }
    .content {
      margin-bottom: 20px;
    }
    .highlight-box {
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 25px 0;
    }
    .reasons-list {
      background: #f8f9fa;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .reasons-list ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .reasons-list li {
      margin: 8px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }
    .signature {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .ps {
      margin-top: 20px;
      font-style: italic;
      color: #6b7280;
      background: #fef3c7;
      padding: 12px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <p>Hi,</p>
  </div>

  <div class="content">
    <p>I hope this email finds you well! I'm Juan, the founder of RetireZest.</p>

    <p>I noticed you've started adding your financial information to your account - that's fantastic! It shows you're serious about planning your retirement.</p>

    <p>But I also noticed you haven't run your first retirement simulation yet, and <strong>I'd love to understand why</strong>.</p>
  </div>

  <div class="highlight-box">
    <p style="margin-top: 0;"><strong>🎯 My Question:</strong></p>
    <p style="margin-bottom: 0;">What's preventing you from running your retirement simulation? Is it:</p>
  </div>

  <div class="reasons-list">
    <ul>
      <li>❓ Unclear what the simulation will show you?</li>
      <li>📊 Still gathering more financial information?</li>
      <li>🔒 Concerns about data privacy or security?</li>
      <li>🤔 Not sure how accurate the results will be?</li>
      <li>⏰ Planning to do it later when you have more time?</li>
      <li>❔ Need help understanding how to use the tool?</li>
      <li>💡 Something else entirely?</li>
    </ul>
  </div>

  <div class="content">
    <p><strong>I'd really appreciate if you could hit reply and let me know.</strong> Even a one-sentence answer would be incredibly helpful!</p>

    <p>Your feedback will directly shape how we improve RetireZest to better serve you and others planning their retirement.</p>

    <center>
      <a href="https://retirezest.com/simulation?mode=quick" class="cta-button">
        Or Try Your Simulation Now (Takes 30 Seconds)
      </a>
    </center>

    <p style="font-size: 14px; color: #6b7280; text-align: center;">
      See your retirement health score, tax optimization, and year-by-year projections
    </p>
  </div>

  <div class="signature">
    <p>Thank you so much for your time,</p>
    <p><strong>Juan Clavier</strong><br>
    Founder, RetireZest<br>
    <a href="https://retirezest.com">https://retirezest.com</a></p>
  </div>

  <div class="ps">
    <p><strong>P.S.</strong> - You have <strong>3 free simulations</strong> available (no credit card required). Your data is encrypted and never shared with anyone. We're here to help you plan confidently! 🎯</p>
  </div>

  <div class="footer">
    <p>This email was sent because you added financial data to RetireZest but haven't run a simulation yet. We want to understand how to serve you better.</p>
    <p style="margin-top: 10px;">
      <a href="https://retirezest.com/api/unsubscribe?token=${user.unsubscribeToken}&type=feedback">Unsubscribe from feedback emails</a> |
      <a href="https://retirezest.com/settings/notifications">Update email preferences</a>
    </p>
  </div>
</body>
</html>
          `,
          text: `Hi,

I hope this email finds you well! I'm Juan, the founder of RetireZest.

I noticed you've started adding your financial information to your account - that's fantastic! It shows you're serious about planning your retirement.

But I also noticed you haven't run your first retirement simulation yet, and I'd love to understand why.

MY QUESTION:

What's preventing you from running your retirement simulation? Is it:

- Unclear what the simulation will show you?
- Still gathering more financial information?
- Concerns about data privacy or security?
- Not sure how accurate the results will be?
- Planning to do it later when you have more time?
- Need help understanding how to use the tool?
- Something else entirely?

I'd really appreciate if you could hit reply and let me know. Even a one-sentence answer would be incredibly helpful!

Your feedback will directly shape how we improve RetireZest to better serve you and others planning their retirement.

Or if you're ready, try your simulation now: https://retirezest.com/simulation?mode=quick
(Takes 30 seconds - see your retirement health score, tax optimization, and year-by-year projections)

Thank you so much for your time,

Juan Clavier
Founder, RetireZest
https://retirezest.com

P.S. - You have 3 free simulations available (no credit card required). Your data is encrypted and never shared with anyone. We're here to help you plan confidently!

---
This email was sent because you added financial data to RetireZest but haven't run a simulation yet. We want to understand how to serve you better.

Unsubscribe from feedback emails: https://retirezest.com/api/unsubscribe?token=${user.unsubscribeToken}&type=feedback
Update email preferences: https://retirezest.com/settings/notifications
          `,
        });

        console.log(`   ✅ Sent! Email ID: ${emailData.data?.id}`);
        successCount++;

        // Small delay to avoid rate limits (Resend free tier: 100 emails/day, 10 emails/second)
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        errorCount++;
        errors.push({ email: user.email, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully sent: ${successCount}`);
    console.log(`⏭️  Skipped (unsubscribed): ${skippedCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📧 Total users: ${users.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   ${err.email}: ${err.error}`);
      });
    }

    console.log('\n✅ Survey email campaign complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendNoSimulationSurvey();
