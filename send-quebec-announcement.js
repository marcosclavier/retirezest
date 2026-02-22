const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY || 're_dShgVZ1n_3q4CraoJVYvC7RatsaGWJn2A');

// For now, we'll send to specific test emails.
// In production, you'd query the database for Quebec users
const quebecUsers = [
  // Add Quebec user emails here
  // For testing, we can send to Juan first
  'jrcb@hotmail.com'
];

async function sendQuebecAnnouncement() {
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

    // Send email to each Quebec user
    for (const email of quebecUsers) {
      const { data, error } = await resend.emails.send({
        from: 'RetireZest Team <contact@retirezest.com>',
        to: [email],
        subject: '🍁 Nouvelle fonctionnalité: Support complet pour le Québec / New Feature: Full Quebec Support',
        html: emailContent,
      });

      if (error) {
        console.error(`❌ Error sending email to ${email}:`, error);
        continue;
      }

      console.log(`✅ Email sent successfully to ${email}`);
      console.log(`   Email ID: ${data.id}`);
    }

    console.log('\n📧 Quebec announcement email campaign completed!');
    console.log(`Total emails sent: ${quebecUsers.length}`);

    console.log('\n📝 Next Steps:');
    console.log('1. Monitor user engagement with the new Quebec features');
    console.log('2. Gather feedback from Quebec users');
    console.log('3. Consider sending to broader Quebec user base after initial testing');

  } catch (error) {
    console.error('Failed to send Quebec announcement emails:', error);
  }
}

// Add command line option to send to all Quebec users from database
if (process.argv.includes('--all-quebec-users')) {
  console.log('📋 Fetching all Quebec users from database...');
  console.log('⚠️  This feature requires database integration');
  console.log('For now, sending to test users only.');
}

// Run the function
console.log('🚀 Starting Quebec feature announcement email campaign...');
console.log(`📬 Sending to ${quebecUsers.length} recipient(s)`);
sendQuebecAnnouncement();