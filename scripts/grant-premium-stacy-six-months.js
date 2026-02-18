/**
 * Grant Premium Access to Stacy Struthers for Six Months
 * And send apology/update email about RRSP/RRIF improvements
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || 're_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A');

async function grantStacyPremiumAndEmail() {
  const userEmail = 'stacystruth@gmail.com';
  const premiumDurationDays = 180; // 6 months

  try {
    console.log('🎁 Granting 6 months premium access to Stacy Struthers...\n');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      }
    });

    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      console.log('\nStacy needs to create an account first at www.retirezest.com');
      return;
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Stacy';

    console.log('Found user:');
    console.log(`  Name: ${fullName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Current tier: ${user.subscriptionTier}`);
    console.log(`  Current status: ${user.subscriptionStatus}`);

    // Set dates - 6 months from today
    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    console.log('\n📅 Setting premium dates:');
    console.log(`  Start date: ${now.toLocaleDateString()}`);
    console.log(`  End date: ${sixMonthsFromNow.toLocaleDateString()} (Aug 2026)`);

    // Update the user's subscription
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionStartDate: now,
        subscriptionEndDate: sixMonthsFromNow,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      }
    });

    console.log('\n✅ Premium access granted successfully!');
    console.log(`  Duration: ${premiumDurationDays} days (6 months)`);

    // Send the email
    console.log('\n📧 Sending apology and update email to Stacy...');

    const emailContent = `
<p>Hi Stacy,</p>

<p>I sincerely apologize for the delay in getting back to you. I know you've been waiting patiently for updates on the RRSP and RRIF withdrawal features.</p>

<p><strong>Good news:</strong> We've made significant advances in the RRSP/RRIF withdrawal strategies, including:</p>
<ul>
  <li>Improved tax-optimized withdrawal sequencing</li>
  <li>Better RRIF minimum withdrawal calculations</li>
  <li>Enhanced conversion timing from RRSP to RRIF</li>
  <li>More accurate tax implications modeling</li>
</ul>

<p><strong>Would you please test these improvements?</strong> Your specific scenarios and feedback have been instrumental in guiding our development priorities.</p>

<p><strong>In recognition of your valuable support, we're offering you 6 months of complimentary Premium service.</strong> This includes unlimited simulations, PDF exports, and access to all advanced features.</p>

<p>Stacy, you're a valuable member of our RetireZest community. We're building this platform to revolutionize retirement planning in Canada, and your feedback and testing are helping us create something truly special. Your insights ensure we're building features that real retirees need.</p>

<p>Thank you for your patience and continued support as we work to change the way Canadians plan for retirement.</p>

<p>Best regards,<br><br>
Juan Clavier,<br>
Founder, RetireZest</p>

<p>P.S. Your Premium access is already activated and will be valid until August 2026. Thank you for being part of our journey!</p>

<hr style="margin-top: 40px; border: 1px solid #e0e0e0;">
<p style="font-size: 12px; color: #666;">
  This email was sent to ${user.email} because you have an account with RetireZest.
  <br>© 2026 RetireZest. All rights reserved.
</p>
`;

    const { data, error } = await resend.emails.send({
      from: 'Juan from RetireZest <noreply@retirezest.com>',
      to: [user.email],
      subject: 'RetireZest Update - RRSP/RRIF Improvements Ready for Testing',
      html: emailContent,
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log(`  Email ID: ${data?.id}`);

    console.log('\n📊 Summary:');
    console.log(`  User: ${fullName} (${userEmail})`);
    console.log(`  Premium granted: 6 months (until ${sixMonthsFromNow.toLocaleDateString()})`);
    console.log(`  Email sent: Yes`);
    console.log(`  Reason: Valuable feedback on RRSP/RRIF features`);

    console.log('\nPremium benefits include:');
    console.log('  ✓ Unlimited retirement simulations');
    console.log('  ✓ PDF export capabilities');
    console.log('  ✓ Advanced tax optimization features');
    console.log('  ✓ Priority support');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
grantStacyPremiumAndEmail()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });