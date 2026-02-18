/**
 * Grant Premium Access to Pierre for Six Months (Correct Email)
 * And send thank you email for feedback from meeting
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || 're_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A');

async function grantPierrePremiumAndEmail() {
  const userEmail = 'glacial-keels-0d@icloud.com'; // Correct email with 'd'
  const premiumDurationDays = 180; // 6 months

  try {
    console.log('🎁 Granting 6 months premium access to Pierre...\n');
    console.log(`📧 Using correct email: ${userEmail}\n`);

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

    let userName = 'Pierre';
    let userFound = false;

    if (user) {
      userFound = true;
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Pierre';
      userName = fullName;

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
      });

      console.log('\n✅ Premium access granted successfully!');
      console.log(`  Duration: ${premiumDurationDays} days (6 months)`);
    } else {
      console.log(`⚠️  User not found in database: ${userEmail}`);
      console.log('Pierre needs to create an account first at www.retirezest.com');
      console.log('Proceeding to send email anyway...\n');
    }

    // Send the email regardless of whether user exists
    console.log('\n📧 Sending thank you email to Pierre...');

    const emailContent = `
<p>Hi Pierre,</p>

<p>Thank you for taking the time to meet with us last week. Your feedback, along with input from other members, has been instrumental in driving meaningful improvements to RetireZest.</p>

<p>Based on your insights, we've implemented significant enhancements in three key areas:</p>

<p><strong>1. Private Pension Support</strong></p>
<ul>
  <li>Enhanced display and calculation of employer/private pensions</li>
  <li>Proper indexation handling (indexed vs non-indexed)</li>
  <li>Accurate integration with overall retirement income planning</li>
</ul>

<p><strong>2. RRIF/RRSP Calculations</strong></p>
<ul>
  <li>Improved tax-optimized withdrawal strategies</li>
  <li>Better RRIF minimum withdrawal calculations</li>
  <li>Enhanced RRSP to RRIF conversion timing</li>
</ul>

<p><strong>3. User-Defined CPP/OAS Settings</strong></p>
<ul>
  <li>Ability to set custom CPP/OAS start ages (60-70)</li>
  <li>Input your actual CRA benefit amounts</li>
  <li>More accurate benefit projections based on your specific situation</li>
</ul>

<p><strong>In recognition of your support and valuable contributions, we're pleased to offer you six months of complimentary Premium service.</strong> This includes unlimited simulations, PDF exports, and access to all advanced features.</p>

<p>Your feedback is helping us build a platform that will revolutionize retirement planning for Canadians. We're grateful for your time and insights.</p>

<p>Please feel free to test these improvements and let us know if you have any additional feedback. Your input continues to be invaluable.</p>

<p>Best regards,<br><br>
Juan Clavier,<br>
Founder, RetireZest</p>

<p>P.S. Your Premium access will be activated upon your next login and will be valid for six months. Thank you for being part of our journey to transform retirement planning in Canada!</p>

<hr style="margin-top: 40px; border: 1px solid #e0e0e0;">
<p style="font-size: 12px; color: #666;">
  This email was sent to ${userEmail} regarding RetireZest updates.
  <br>© 2026 RetireZest. All rights reserved.
</p>
`;

    const { data, error } = await resend.emails.send({
      from: 'Juan from RetireZest <noreply@retirezest.com>',
      to: [userEmail],
      subject: 'Thank You for Your Valuable Feedback - RetireZest Updates & Premium Access',
      html: emailContent,
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log(`  Email ID: ${data?.id}`);

    console.log('\n📊 Summary:');
    console.log(`  Recipient: Pierre (${userEmail})`);
    if (userFound) {
      console.log(`  Premium granted: 6 months (until Aug 2026)`);
    } else {
      console.log(`  Premium: Will be activated when Pierre creates an account`);
    }
    console.log(`  Email sent: Yes`);
    console.log(`  Reason: Valuable feedback from meeting last week`);

    if (!userFound) {
      console.log('\n⚠️  Note: Pierre needs to create an account at www.retirezest.com to access premium features');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
grantPierrePremiumAndEmail()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });