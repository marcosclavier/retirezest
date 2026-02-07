/**
 * Script to send feedback follow-up email
 * Usage: node scripts/send-feedback-email.js <feedbackId>
 */

const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendFeedbackEmail(feedbackId) {
  try {
    console.log(`📧 Fetching feedback ${feedbackId}...`);

    // Get feedback and user details
    const feedback = await prisma.userFeedback.findUnique({
      where: { id: feedbackId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            province: true,
            createdAt: true,
          },
        },
      },
    });

    if (!feedback) {
      console.error('❌ Feedback not found');
      process.exit(1);
    }

    console.log(`✅ Found feedback from ${feedback.user.email}`);
    console.log(`   Name: ${feedback.user.firstName} ${feedback.user.lastName}`);
    console.log(`   Score: ${feedback.helpfulnessScore}/5`);

    const userName = feedback.user.firstName || "there";
    const signupDate = new Date(feedback.user.createdAt);
    const feedbackDate = new Date(feedback.createdAt);
    const minutesToSimulation = Math.round(
      (feedbackDate.getTime() - signupDate.getTime()) / (1000 * 60)
    );

    console.log(`\n📨 Sending email to ${feedback.user.email}...`);

    // Send email via Resend
    const emailData = await resend.emails.send({
      from: "Juan Clavier from RetireZest <contact@retirezest.com>",
      to: feedback.user.email,
      subject: "Thank you for trying RetireZest! Quick question about features 🎯",
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
    .questions {
      background: #f8f9fa;
      border-left: 4px solid #10b981;
      padding: 15px 20px;
      margin: 20px 0;
    }
    .questions ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .questions li {
      margin: 10px 0;
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
    a {
      color: #10b981;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .ps {
      margin-top: 20px;
      font-style: italic;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <p>Hi ${userName},</p>
  </div>

  <div class="content">
    <p>Thank you so much for trying RetireZest today! I noticed you ran your first simulation just <strong>${minutesToSimulation} minutes</strong> after signing up - that's fantastic!</p>

    <p>I'm reaching out personally because your feedback score (${feedback.helpfulnessScore}/5!) made my day, and I'd love to learn more about your experience to help make RetireZest even better.</p>
  </div>

  <div class="questions">
    <p><strong>Quick question:</strong> Now that you've had a chance to explore the retirement simulation, I'm curious:</p>

    <ol>
      <li><strong>Were there any features you wish we had?</strong><br>
      For example: specific asset types, income sources, expense categories, or analysis tools that would be useful for your retirement planning?</li>

      <li><strong>Did you encounter any limitations or constraints</strong> that prevented you from getting the full picture of your retirement plan?</li>

      <li><strong>What would make RetireZest more useful for you?</strong></li>
    </ol>
  </div>

  <div class="content">
    <p>Your insights would be incredibly valuable as we're actively building out new features. As a thank you for taking the time to respond, I'd be happy to give you early access to any features you suggest once they're ready.</p>

    ${
      feedback.userProvince === "BC"
        ? `<p>Also, I noticed you're planning for retirement in BC. We're working on making sure our calculations are accurate for all provinces - if you have any BC-specific concerns (property transfer tax, healthcare costs, provincial benefits), I'd love to hear about them.</p>`
        : ""
    }

    <p>Looking forward to hearing from you!</p>
  </div>

  <div class="signature">
    <p>Best regards,</p>
    <p><strong>Juan Clavier</strong><br>
    Founder, RetireZest<br>
    <a href="https://retirezest.com">https://retirezest.com</a></p>
  </div>

  <div class="ps">
    <p><strong>P.S.</strong> - If you have any questions about your simulation results or want to explore different retirement scenarios, feel free to reply to this email. I'm here to help!</p>
  </div>

  <div class="footer">
    <p>This email was sent because you recently used RetireZest and provided feedback. If you'd prefer not to receive product development emails, you can <a href="https://retirezest.com/settings/notifications">update your preferences</a>.</p>
  </div>
</body>
</html>
      `,
      text: `Hi ${userName},

Thank you so much for trying RetireZest today! I noticed you ran your first simulation just ${minutesToSimulation} minutes after signing up - that's fantastic!

I'm reaching out personally because your feedback score (${feedback.helpfulnessScore}/5!) made my day, and I'd love to learn more about your experience to help make RetireZest even better.

Quick question: Now that you've had a chance to explore the retirement simulation, I'm curious:

1. Were there any features you wish we had?
   For example: specific asset types, income sources, expense categories, or analysis tools that would be useful for your retirement planning?

2. Did you encounter any limitations or constraints that prevented you from getting the full picture of your retirement plan?

3. What would make RetireZest more useful for you?

Your insights would be incredibly valuable as we're actively building out new features. As a thank you for taking the time to respond, I'd be happy to give you early access to any features you suggest once they're ready.

${
        feedback.userProvince === "BC"
          ? `Also, I noticed you're planning for retirement in BC. We're working on making sure our calculations are accurate for all provinces - if you have any BC-specific concerns (property transfer tax, healthcare costs, provincial benefits), I'd love to hear about them.\n\n`
          : ""
      }Looking forward to hearing from you!

Best regards,

Juan Clavier
Founder, RetireZest
https://retirezest.com

P.S. - If you have any questions about your simulation results or want to explore different retirement scenarios, feel free to reply to this email. I'm here to help!

---
This email was sent because you recently used RetireZest and provided feedback. If you'd prefer not to receive product development emails, you can update your preferences at https://retirezest.com/settings/notifications.
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log(`   Email ID: ${emailData.data?.id}`);

    // Update feedback record to mark as responded
    await prisma.userFeedback.update({
      where: { id: feedbackId },
      data: {
        responded: true,
        respondedAt: new Date(),
        respondedBy: 'juanclavierb@gmail.com',
        status: 'in_progress',
      },
    });

    console.log('✅ Feedback record updated (responded: true, status: in_progress)');
    console.log('\n🎉 All done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get feedbackId from command line
const feedbackId = process.argv[2];

if (!feedbackId) {
  console.error('Usage: node scripts/send-feedback-email.js <feedbackId>');
  process.exit(1);
}

sendFeedbackEmail(feedbackId);
