const { Resend } = require('resend');
const { PrismaClient } = require('@prisma/client');

// Initialize Resend and Prisma
const resend = new Resend(process.env.RESEND_API_KEY || 're_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A');
const prisma = new PrismaClient();

async function getUsersWithoutProvince() {
  try {
    // Query all users who don't have a province set
    const usersWithoutProvince = await prisma.user.findMany({
      where: {
        OR: [
          { province: null },
          { province: '' }
        ],
        emailVerified: true // Only send to verified emails
      },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`📊 Found ${usersWithoutProvince.length} verified users without province set`);
    return usersWithoutProvince;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

async function sendProvinceReminder() {
  try {
    // Get all users without province
    const users = await getUsersWithoutProvince();

    if (users.length === 0) {
      console.log('⚠️  No verified users without province found');
      return;
    }

    const emailContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #d32f2f;">⚠️ Your retirement projections might be off by $5,000/year</h2>

  <p>Hi there,</p>

  <p>We noticed your RetireZest profile is missing one crucial detail: <strong>your province</strong>.</p>

  <h3 style="color: #0066cc; margin-top: 30px;">Here's Why This Matters:</h3>

  <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0;"><strong>Without your province, we can't calculate:</strong></p>
    <ul style="margin: 10px 0 0 0;">
      <li>✅ Accurate provincial taxes (varies by <strong>$3,000-$5,000/year</strong>)</li>
      <li>✅ Provincial benefits and credits you're entitled to</li>
      <li>✅ QPP vs CPP (Quebec residents have different pension plans)</li>
    </ul>
  </div>

  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Real Impact:</strong> A retiree with $60,000 income pays:</p>
    <ul style="margin: 0; color: #555;">
      <li>Alberta: ~$8,500 in taxes</li>
      <li>Ontario: ~$10,200 in taxes</li>
      <li>Quebec: ~$11,800 in taxes</li>
    </ul>
    <p style="margin: 10px 0 0 0; font-weight: bold; color: #d32f2f;">That's a <strong>$3,300 difference</strong> in your pocket each year!</p>
  </div>

  <h3 style="color: #0066cc; margin-top: 30px;">Fix It in 10 Seconds:</h3>

  <ol style="color: #555; line-height: 1.8;">
    <li><strong>Log in</strong> to RetireZest</li>
    <li>Go to <strong>Profile Settings</strong></li>
    <li>Select your <strong>Province</strong></li>
    <li>Click <strong>Save</strong></li>
  </ol>

  <p>Your next simulation will instantly become more accurate.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://retirezest.com/profile/settings" style="display: inline-block; padding: 12px 30px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Update My Province Now</a>
  </div>

  <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">

  <p><strong>Why does this matter so much?</strong></p>

  <p>Each province has unique:</p>
  <ul style="color: #555;">
    <li>Tax brackets and rates</li>
    <li>Senior benefits and credits</li>
    <li>Healthcare premiums</li>
    <li>Sales tax rates affecting your spending power</li>
  </ul>

  <p>We want your retirement plan to be as accurate as possible. Missing your province means we're just guessing - and that's not good enough for your financial future.</p>

  <p style="margin-top: 30px;">Best regards,<br>
  The RetireZest Team</p>

  <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">

  <div style="background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 15px; margin-top: 30px; border-radius: 4px;">
    <p style="color: #333; font-size: 15px; margin: 0;">
      <strong>P.S.</strong> - If you enjoy RetireZest and our commitment to accuracy, please share us with friends who are planning their retirement. Together we're building a better retirement future for all Canadians! 💙
    </p>
  </div>
</div>
`;

    let successCount = 0;
    let failCount = 0;

    console.log('📧 Starting province reminder campaign...\n');

    // Send emails one by one with 500ms delay to respect rate limits
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      try {
        const { data, error } = await resend.emails.send({
          from: 'RetireZest Team <contact@retirezest.com>',
          to: [user.email],
          subject: '⚠️ Your retirement projections might be off by $5,000/year',
          html: emailContent,
        });

        if (error) {
          console.error(`❌ Failed: ${user.email}:`, error.message);
          failCount++;
        } else {
          console.log(`✅ Sent: ${user.email} (ID: ${data.id})`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed: ${user.email}:`, error.message);
        failCount++;
      }

      // Wait 500ms between emails (2 emails per second max)
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 CAMPAIGN COMPLETE - SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully sent: ${successCount} emails`);
    console.log(`❌ Failed to send: ${failCount} emails`);
    console.log(`📧 Total processed: ${users.length} emails`);
    console.log(`📈 Success rate: ${((successCount/users.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Failed to send province reminder emails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the campaign
console.log('🚀 Province Reminder Email Campaign');
console.log('='.repeat(50));
console.log('📅 Date:', new Date().toLocaleString());
console.log('📧 Sender: contact@retirezest.com');
console.log('🎯 Target: All verified users without province set');
console.log('='.repeat(50) + '\n');

sendProvinceReminder();