/**
 * Script to send RRSP/RRIF fix notification to Stacy
 * Usage: node scripts/send-stacy-update-email.js
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendUpdateEmail() {
  const userEmail = 'stacystruth@gmail.com';

  try {
    console.log(`📧 Sending update email to ${userEmail}...`);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    const userName = user.firstName || 'Stacy';

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'RetireZest Team <team@retirezest.com>',
      to: user.email,
      subject: 'RetireZest Update - RRSP/RRIF Fixes Completed',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">RetireZest Update</h2>

          <p>Dear ${userName},</p>

          <p>We're pleased to inform you that we've completed the fixes for the RRSP and RRIF functionality in RetireZest. The system is now working correctly.</p>

          <p><strong>Important note about RRSP withdrawals:</strong> To withdraw from your RRSP before age 71, the funds need to be converted and allocated to the RRIF asset first. This ensures proper tax treatment and withdrawal calculations.</p>

          <p>The updates are now live on the platform. Please log in and try running your simulation again to see if everything is working as expected.</p>

          <p><strong>Additionally, we've added 10 simulation tokens to your account</strong> to help you test the fixes and explore the updated features.</p>

          <p>Thank you for your patience while we resolved these issues. Please let us know if the fix works for you or if you encounter any other issues.</p>

          <p style="margin-top: 30px;">Best regards,<br>The RetireZest Team</p>

          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">

          <p style="font-size: 12px; color: #666;">
            This email was sent to ${user.email} because you have an account with RetireZest.
            <br>
            © ${new Date().getFullYear()} RetireZest. All rights reserved.
          </p>
        </div>
      `,
      text: `Dear ${userName},

We're pleased to inform you that we've completed the fixes for the RRSP and RRIF functionality in RetireZest. The system is now working correctly.

Important note about RRSP withdrawals: To withdraw from your RRSP before age 71, the funds need to be converted and allocated to the RRIF asset first. This ensures proper tax treatment and withdrawal calculations.

The updates are now live on the platform. Please log in and try running your simulation again to see if everything is working as expected.

Additionally, we've added 10 simulation tokens to your account to help you test the fixes and explore the updated features.

Thank you for your patience while we resolved these issues. Please let us know if the fix works for you or if you encounter any other issues.

Best regards,
The RetireZest Team`,
    });

    if (error) {
      console.error('❌ Failed to send email:', error);
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log(`   Email ID: ${data?.id}`);
    console.log(`   To: ${user.email}`);
    console.log(`   Name: ${userName}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

sendUpdateEmail();