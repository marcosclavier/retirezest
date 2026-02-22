const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A');

// Remaining Quebec users who didn't receive the email due to rate limit
const remainingUsers = [
  { email: 'mauricepoitras@gmail.com' },
  { email: 'gael_lebihan@yahoo.ca' },
  { email: 'beauchamp.francois@gmail.com' },
  { email: 'dangagnon66@msn.com' },
  { email: 'glacial-keels-0d@icloud.com' },
  { email: 'mrondeau205@gmail.com' },
  { email: 'tanyaden@gmail.com' },
  { email: 'bridgegarant@gmail.com' },
  { email: 'floriankoud@hotmail.com' },
  { email: 'lnoreau33@hotmail.com' }
];

async function sendQuebecAnnouncementRemaining() {
  try {
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

    console.log('📧 Sending to remaining Quebec users (with proper rate limiting)...\n');

    // Send emails one by one with 500ms delay to respect 2/second rate limit
    for (let i = 0; i < remainingUsers.length; i++) {
      const user = remainingUsers[i];

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
        } else {
          console.log(`✅ Sent: ${user.email} (ID: ${data.id})`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed: ${user.email}:`, error.message);
        failCount++;
      }

      // Wait 500ms between emails (2 emails per second max)
      if (i < remainingUsers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 REMAINING EMAILS - SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully sent: ${successCount} emails`);
    console.log(`❌ Failed to send: ${failCount} emails`);
    console.log(`📧 Total processed: ${remainingUsers.length} emails`);
    console.log(`📈 Success rate: ${((successCount/remainingUsers.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

    console.log('\n🎉 GRAND TOTAL for Quebec Campaign:');
    console.log(`✅ Initial batch: 4 emails`);
    console.log(`✅ Remaining batch: ${successCount} emails`);
    console.log(`📧 Total successful: ${4 + successCount} emails`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Failed to send remaining Quebec emails:', error);
  }
}

// Run the campaign for remaining users
console.log('🚀 Quebec Feature Announcement - Remaining Users');
console.log('='.repeat(50));
console.log('📅 Date:', new Date().toLocaleString());
console.log('📧 Sender: contact@retirezest.com');
console.log('🎯 Target: Remaining Quebec users (10 recipients)');
console.log('='.repeat(50) + '\n');

sendQuebecAnnouncementRemaining();