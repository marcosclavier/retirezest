const { Resend } = require('resend');
const { PrismaClient } = require('@prisma/client');

// Initialize Resend and Prisma
const resend = new Resend(process.env.RESEND_API_KEY || 're_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A');
const prisma = new PrismaClient();

async function getQuebecUsers() {
  try {
    // Query all users who have Quebec as their province
    const quebecUsers = await prisma.user.findMany({
      where: {
        province: 'QC',
        emailVerified: true // Only send to verified emails
      },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`📊 Found ${quebecUsers.length} Quebec users with verified emails`);
    return quebecUsers;
  } catch (error) {
    console.error('Error fetching Quebec users:', error);
    return [];
  }
}

async function sendQuebecAnnouncement() {
  try {
    // Get all Quebec users from database
    const quebecUsers = await getQuebecUsers();

    if (quebecUsers.length === 0) {
      console.log('⚠️  No Quebec users found in database');
      return;
    }

    const emailContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #0066cc;">🍁 New Feature: Full Quebec Support</h2>

  <p>Dear RetireZest User,</p>

  <p>We're excited to announce that RetireZest now offers comprehensive support for Quebec residents!</p>

  <h3 style="color: #0066cc; margin-top: 30px;">What's New for Quebec Users:</h3>

  <div style="margin-bottom: 20px;">
    <h4 style="color: #333; margin-bottom: 10px;">📊 Quebec Pension Plan (QPP)</h4>
    <ul style="color: #555;">
      <li>Accurate QPP calculations replace CPP throughout the platform</li>
      <li>QPP-specific contribution limits and benefit formulas</li>
    </ul>
  </div>

  <div style="margin-bottom: 20px;">
    <h4 style="color: #333; margin-bottom: 10px;">💰 Quebec Provincial Taxes</h4>
    <ul style="color: #555;">
      <li>Precise Quebec tax calculations with all provincial brackets</li>
      <li>Quebec-specific deductions and credits</li>
      <li>Solidarity Tax Credit included in projections</li>
    </ul>
  </div>

  <div style="margin-bottom: 20px;">
    <h4 style="color: #333; margin-bottom: 10px;">🎯 Personalized Interface</h4>
    <ul style="color: #555;">
      <li>All charts and tables now display "QPP" instead of "CPP"</li>
      <li>Quebec-specific terminology throughout the application</li>
      <li>Provincial benefits accurately reflected in your retirement plan</li>
    </ul>
  </div>

  <h3 style="color: #0066cc; margin-top: 30px;">How to Enable Quebec Features:</h3>

  <ol style="color: #555; line-height: 1.8;">
    <li>Go to your <strong>Profile Settings</strong></li>
    <li>Select <strong>Quebec</strong> as your province</li>
    <li>Run a new simulation to see Quebec-specific calculations</li>
  </ol>

  <p style="margin-top: 20px;">These updates ensure your retirement projections are more accurate and tailored to Quebec's unique tax and pension system.</p>

  <h3 style="color: #0066cc; margin-top: 30px;">Why This Matters:</h3>

  <p>Quebec has distinct retirement planning considerations:</p>
  <ul style="color: #555;">
    <li>QPP benefits differ from CPP</li>
    <li>Provincial tax rates and brackets are unique</li>
    <li>Quebec-specific credits can significantly impact your retirement income</li>
  </ul>

  <p style="margin-top: 20px;">We're committed to providing the most accurate retirement planning tools for all Canadians, and this update brings that same precision to our Quebec users.</p>

  <p style="margin-top: 30px;"><strong>Questions?</strong> Reply to this email or visit our Help Center.</p>

  <p style="margin-top: 30px;">Best regards,<br>
  The RetireZest Team</p>

  <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">

  <p style="color: #777; font-size: 14px; margin-top: 20px;">
    <em>P.S. - Already ran simulations? Update your province to Quebec and re-run them for more accurate projections with QPP and Quebec tax calculations.</em>
  </p>

  <div style="background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 15px; margin-top: 30px; border-radius: 4px;">
    <p style="color: #333; font-size: 15px; margin: 0;">
      <strong>💙 Love RetireZest?</strong> Help your friends and family plan their retirement with confidence! Forward this email to anyone who could benefit from accurate Quebec-specific retirement planning. Together, we're building a better retirement future for all Canadians.
    </p>
  </div>
</div>
`;

    let successCount = 0;
    let failCount = 0;
    const batchSize = 10; // Send in batches to avoid rate limits

    console.log('📧 Starting email campaign...\n');

    // Send emails in batches
    for (let i = 0; i < quebecUsers.length; i += batchSize) {
      const batch = quebecUsers.slice(i, i + batchSize);

      // Send emails in parallel within each batch
      const batchPromises = batch.map(async (user) => {
        try {
          const { data, error } = await resend.emails.send({
            from: 'RetireZest Team <contact@retirezest.com>',
            to: [user.email],
            subject: '🍁 Nouvelle fonctionnalité: Support complet pour le Québec / New Feature: Full Quebec Support',
            html: emailContent,
          });

          if (error) {
            console.error(`❌ Failed: ${user.email}:`, error.message);
            failCount++;
            return { success: false, email: user.email };
          }

          console.log(`✅ Sent: ${user.email} (ID: ${data.id})`);
          successCount++;
          return { success: true, email: user.email, id: data.id };
        } catch (error) {
          console.error(`❌ Failed: ${user.email}:`, error.message);
          failCount++;
          return { success: false, email: user.email };
        }
      });

      await Promise.all(batchPromises);

      // Add a small delay between batches to respect rate limits
      if (i + batchSize < quebecUsers.length) {
        console.log(`\n⏳ Batch ${Math.floor(i/batchSize) + 1} complete. Waiting before next batch...\n`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between batches
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 CAMPAIGN COMPLETE - SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully sent: ${successCount} emails`);
    console.log(`❌ Failed to send: ${failCount} emails`);
    console.log(`📧 Total processed: ${quebecUsers.length} emails`);
    console.log(`📈 Success rate: ${((successCount/quebecUsers.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Failed to send Quebec announcement emails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the campaign
console.log('🚀 Quebec Feature Announcement Email Campaign');
console.log('='.repeat(50));
console.log('📅 Date:', new Date().toLocaleString());
console.log('📧 Sender: contact@retirezest.com');
console.log('🎯 Target: All verified Quebec users');
console.log('='.repeat(50) + '\n');

sendQuebecAnnouncement();