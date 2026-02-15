# Privacy-Safe Email Templates for RetireZest

**Created**: January 30, 2026
**Purpose**: Ensure NO personal financial information (PII) is sent via email
**Compliance**: PIPEDA (Canada), GDPR principles
**Contact Email**: contact@retirezest.com

---

## 🚨 CRITICAL PRIVACY RULES

### ❌ NEVER Include in Emails:
- Specific account balances (RRSP, TFSA, Non-Registered amounts)
- Income amounts (CPP, OAS, pension, salary)
- Expense amounts
- Tax amounts or rates
- Age (use ranges if necessary: "60s", "70s")
- Province/location specifics
- Marital status
- Specific simulation results ($X at age Y)
- Email tracking IDs in user-facing content

### ✅ SAFE to Include:
- Account types (RRSP, TFSA, etc.) - without amounts
- General guidance ("your retirement plan", "your simulation")
- Generic feature descriptions
- Links to secure dashboard where users log in to see their data
- Support contact information

---

## Template 1: Feedback Clarification Request

**Use Case**: When user provides feedback and you need more details
**Privacy Level**: 🟢 SAFE - No PII included

```javascript
const feedbackClarificationEmail = {
  from: 'RetireZest <contact@retirezest.com>',
  to: ['[USER_EMAIL]'], // Populated from secure database
  subject: 'Re: Your RetireZest Feedback - We'd Love More Details',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">RetireZest</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">Helping You Plan Your Retirement with Confidence</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <h2 style="color: #1f2937; margin-top: 0;">Hi [FIRST_NAME],</h2>

    <p>Thank you for taking the time to share your feedback about RetireZest! We really appreciate hearing from our users.</p>

    <p>To help us understand and address your concern, could you provide some additional details?</p>

    <h3 style="color: #667eea; margin-top: 25px;">📸 Screenshots Are Most Helpful!</h3>
    <p>If possible, could you take screenshots of:</p>
    <ul style="color: #4b5563;">
      <li>The page or section where you're seeing an issue</li>
      <li>Any error messages or unexpected results</li>
      <li>Any charts or data that look incorrect</li>
    </ul>

    <h3 style="color: #667eea; margin-top: 25px;">🔍 Additional Context</h3>
    <p>Please describe:</p>
    <ul style="color: #4b5563;">
      <li>What you expected to see</li>
      <li>What you actually saw</li>
      <li>Which feature or page you were using</li>
      <li>Any steps you took before noticing the issue</li>
    </ul>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af;">
        <strong>🔒 Privacy Note:</strong> Never include personal financial details in your reply. Screenshots showing your data are fine - just avoid typing specific dollar amounts in the email body.
      </p>
    </div>

    <h3 style="color: #667eea; margin-top: 25px;">💡 Secure Alternative</h3>
    <p>Prefer not to email? You can also:</p>
    <ul style="color: #4b5563;">
      <li><strong>Submit feedback via your dashboard:</strong> <a href="https://www.retirezest.com/feedback" style="color: #667eea;">Log in to share details securely</a></li>
      <li><strong>Schedule a call:</strong> Reply to this email if you'd prefer a 15-minute call to walk through the issue together</li>
    </ul>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>The RetireZest Team</strong><br>
      <span style="color: #6b7280;">contact@retirezest.com</span>
    </p>

  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">
      RetireZest - Retirement Planning Made Simple<br>
      <a href="https://www.retirezest.com" style="color: #667eea; text-decoration: none;">www.retirezest.com</a>
    </p>
  </div>

</body>
</html>
  `,
  text: `Hi [FIRST_NAME],

Thank you for taking the time to share your feedback about RetireZest! We really appreciate hearing from our users.

To help us understand and address your concern, could you provide some additional details?

📸 SCREENSHOTS ARE MOST HELPFUL!
If possible, could you take screenshots of:
- The page or section where you're seeing an issue
- Any error messages or unexpected results
- Any charts or data that look incorrect

🔍 ADDITIONAL CONTEXT
Please describe:
- What you expected to see
- What you actually saw
- Which feature or page you were using
- Any steps you took before noticing the issue

🔒 PRIVACY NOTE: Never include personal financial details in your reply. Screenshots showing your data are fine - just avoid typing specific dollar amounts in the email body.

💡 SECURE ALTERNATIVE
Prefer not to email? You can also:
- Submit feedback via your dashboard: https://www.retirezest.com/feedback
- Schedule a call: Reply to this email if you'd prefer a 15-minute call

Best regards,
The RetireZest Team
contact@retirezest.com

---
RetireZest - Retirement Planning Made Simple
www.retirezest.com
`
};
```

---

## Template 2: Feature Update Notification

**Use Case**: Notify users about new features addressing their feedback
**Privacy Level**: 🟢 SAFE - No PII included

```javascript
const featureUpdateEmail = {
  from: 'RetireZest <contact@retirezest.com>',
  to: ['[USER_EMAIL]'],
  subject: 'New RetireZest Features Based on Your Feedback',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 We Listened to Your Feedback!</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">RetireZest Has New Features</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <h2 style="color: #1f2937; margin-top: 0;">Hi [FIRST_NAME],</h2>

    <p>Thank you for your recent feedback about RetireZest. We're excited to share that we've released new features addressing the concerns you raised!</p>

    <h3 style="color: #667eea; margin-top: 25px;">✨ What's New</h3>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h4 style="color: #1f2937; margin-top: 0;">📅 Investment Timeline Display</h4>
      <p style="margin: 0; color: #4b5563;">
        You can now see a visual timeline showing:
      </p>
      <ul style="color: #4b5563; margin-bottom: 0;">
        <li>When your RRSP/LIRA converts to RRIF/LRIF</li>
        <li>When each investment account is projected to deplete</li>
        <li>How long your overall investments will last</li>
      </ul>
    </div>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h4 style="color: #1f2937; margin-top: 0;">📈 Growth Explanation</h4>
      <p style="margin: 0; color: #4b5563;">
        We've added tooltips and visualizations explaining how compound interest affects your retirement accounts, making it clearer why balances may grow even while withdrawing funds.
      </p>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af;">
        <strong>🔒 See Your Updated Results:</strong> Log in to your RetireZest dashboard to view these new features with your retirement plan.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.retirezest.com/simulation" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Your Updated Plan
      </a>
    </div>

    <h3 style="color: #667eea; margin-top: 25px;">💬 Your Feedback Matters</h3>
    <p>These improvements were made possible because users like you took the time to share feedback. If you have more suggestions or questions about the new features, we'd love to hear from you!</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>The RetireZest Team</strong><br>
      <span style="color: #6b7280;">contact@retirezest.com</span>
    </p>

  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">
      RetireZest - Retirement Planning Made Simple<br>
      <a href="https://www.retirezest.com" style="color: #667eea; text-decoration: none;">www.retirezest.com</a>
    </p>
  </div>

</body>
</html>
  `,
  text: `Hi [FIRST_NAME],

Thank you for your recent feedback about RetireZest. We're excited to share that we've released new features addressing the concerns you raised!

✨ WHAT'S NEW

📅 Investment Timeline Display
You can now see a visual timeline showing:
- When your RRSP/LIRA converts to RRIF/LRIF
- When each investment account is projected to deplete
- How long your overall investments will last

📈 Growth Explanation
We've added tooltips and visualizations explaining how compound interest affects your retirement accounts, making it clearer why balances may grow even while withdrawing funds.

🔒 SEE YOUR UPDATED RESULTS
Log in to your RetireZest dashboard to view these new features with your retirement plan:
https://www.retirezest.com/simulation

💬 YOUR FEEDBACK MATTERS
These improvements were made possible because users like you took the time to share feedback. If you have more suggestions or questions about the new features, we'd love to hear from you!

Best regards,
The RetireZest Team
contact@retirezest.com

---
RetireZest - Retirement Planning Made Simple
www.retirezest.com
`
};
```

---

## Template 3: Simulation Completion Notification

**Use Case**: Notify user that simulation is complete (from async processing)
**Privacy Level**: 🟢 SAFE - No results included, only link to secure dashboard

```javascript
const simulationCompleteEmail = {
  from: 'RetireZest <contact@retirezest.com>',
  to: ['[USER_EMAIL]'],
  subject: 'Your RetireZest Simulation is Ready',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Your Simulation is Ready!</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">RetireZest</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <h2 style="color: #1f2937; margin-top: 0;">Hi [FIRST_NAME],</h2>

    <p>Great news! Your retirement simulation has been completed and is ready to view.</p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px;">
        Your personalized retirement plan includes:
      </p>
      <ul style="text-align: left; color: #4b5563; margin: 0;">
        <li>Year-by-year financial projections</li>
        <li>Tax analysis and optimization recommendations</li>
        <li>Investment withdrawal strategy</li>
        <li>Government benefit estimates (CPP, OAS, GIS)</li>
        <li>Interactive charts and visualizations</li>
      </ul>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af;">
        <strong>🔒 Secure Access:</strong> Your simulation results contain sensitive financial information and are only accessible through your secure dashboard.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.retirezest.com/simulation" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Your Results
      </a>
    </div>

    <h3 style="color: #667eea; margin-top: 25px;">💬 Questions or Feedback?</h3>
    <p>If you have questions about your results or suggestions for improving RetireZest, please don't hesitate to reach out. We're here to help!</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>The RetireZest Team</strong><br>
      <span style="color: #6b7280;">contact@retirezest.com</span>
    </p>

  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">
      RetireZest - Retirement Planning Made Simple<br>
      <a href="https://www.retirezest.com" style="color: #667eea; text-decoration: none;">www.retirezest.com</a> |
      <a href="https://www.retirezest.com/privacy" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
    </p>
  </div>

</body>
</html>
  `,
  text: `Hi [FIRST_NAME],

Great news! Your retirement simulation has been completed and is ready to view.

Your personalized retirement plan includes:
- Year-by-year financial projections
- Tax analysis and optimization recommendations
- Investment withdrawal strategy
- Government benefit estimates (CPP, OAS, GIS)
- Interactive charts and visualizations

🔒 SECURE ACCESS
Your simulation results contain sensitive financial information and are only accessible through your secure dashboard.

VIEW YOUR RESULTS
https://www.retirezest.com/simulation

💬 QUESTIONS OR FEEDBACK?
If you have questions about your results or suggestions for improving RetireZest, please don't hesitate to reach out. We're here to help!

Best regards,
The RetireZest Team
contact@retirezest.com

---
RetireZest - Retirement Planning Made Simple
www.retirezest.com | Privacy Policy: www.retirezest.com/privacy
`
};
```

---

## Template 4: General Support Response

**Use Case**: Responding to general support inquiries
**Privacy Level**: 🟢 SAFE - No PII included

```javascript
const generalSupportEmail = {
  from: 'RetireZest <contact@retirezest.com>',
  to: ['[USER_EMAIL]'],
  subject: 'Re: Your RetireZest Question',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">RetireZest Support</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">We're Here to Help</p>
  </div>

  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

    <h2 style="color: #1f2937; margin-top: 0;">Hi [FIRST_NAME],</h2>

    <p>Thank you for reaching out to RetireZest. [CUSTOM_RESPONSE_TEXT]</p>

    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af;">
        <strong>💡 Tip:</strong> For questions about your specific retirement plan, please log in to your dashboard where you can see all your personalized data and projections.
      </p>
    </div>

    <h3 style="color: #667eea; margin-top: 25px;">📚 Helpful Resources</h3>
    <ul style="color: #4b5563;">
      <li><a href="https://www.retirezest.com/help" style="color: #667eea;">Help Center</a> - FAQs and guides</li>
      <li><a href="https://www.retirezest.com/blog" style="color: #667eea;">Blog</a> - Retirement planning tips</li>
      <li><a href="https://www.retirezest.com/contact" style="color: #667eea;">Contact Us</a> - Get in touch</li>
    </ul>

    <p>If you have additional questions, feel free to reply to this email!</p>

    <p style="margin-top: 30px;">
      Best regards,<br>
      <strong>The RetireZest Team</strong><br>
      <span style="color: #6b7280;">contact@retirezest.com</span>
    </p>

  </div>

  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">
      RetireZest - Retirement Planning Made Simple<br>
      <a href="https://www.retirezest.com" style="color: #667eea; text-decoration: none;">www.retirezest.com</a>
    </p>
  </div>

</body>
</html>
  `,
  text: `Hi [FIRST_NAME],

Thank you for reaching out to RetireZest. [CUSTOM_RESPONSE_TEXT]

💡 TIP: For questions about your specific retirement plan, please log in to your dashboard where you can see all your personalized data and projections.

📚 HELPFUL RESOURCES
- Help Center: https://www.retirezest.com/help
- Blog: https://www.retirezest.com/blog
- Contact Us: https://www.retirezest.com/contact

If you have additional questions, feel free to reply to this email!

Best regards,
The RetireZest Team
contact@retirezest.com

---
RetireZest - Retirement Planning Made Simple
www.retirezest.com
`
};
```

---

## Implementation Guide

### How to Use These Templates

1. **Never Hard-Code User Data**: Always pull from database at runtime
2. **Use Placeholders**:
   - `[USER_EMAIL]` - From database
   - `[FIRST_NAME]` - From user profile
   - `[CUSTOM_RESPONSE_TEXT]` - Context-specific response
3. **Link to Secure Dashboard**: Never send data via email, always link to logged-in views
4. **Test Before Sending**: Review every email for PII before sending

### Example Implementation

```javascript
// CORRECT: Privacy-safe email sending
async function sendFeedbackRequest(userId) {
  const user = await db.users.findById(userId);

  const emailData = {
    from: 'RetireZest <contact@retirezest.com>',
    to: [user.email],
    subject: 'Re: Your RetireZest Feedback - We'd Love More Details',
    html: feedbackClarificationEmail.html
      .replace('[FIRST_NAME]', user.firstName || 'there'),
    text: feedbackClarificationEmail.text
      .replace('[FIRST_NAME]', user.firstName || 'there')
  };

  await resend.emails.send(emailData);
}

// ❌ INCORRECT: Includes PII
async function sendFeedbackRequestBad(userId) {
  const user = await db.users.findById(userId);
  const simulation = await db.simulations.findByUserId(userId);

  const emailData = {
    from: 'RetireZest <contact@retirezest.com>',
    to: [user.email],
    subject: 'Re: Your Feedback',
    html: `
      <p>Hi ${user.firstName},</p>
      <p>Based on your profile:</p>
      <ul>
        <li>Age: ${user.age}</li>
        <li>RRSP: $${simulation.rrspBalance}</li>  <!-- ❌ PII! -->
        <li>Income: $${simulation.income}</li>      <!-- ❌ PII! -->
      </ul>
    `
  };

  await resend.emails.send(emailData);
}
```

---

## Privacy Checklist Before Sending

Before sending ANY email, verify:

- [ ] No account balances included
- [ ] No income/expense amounts included
- [ ] No tax information included
- [ ] No simulation results (dollar amounts, ages, years)
- [ ] No demographic details beyond first name
- [ ] Links point to secure, logged-in dashboard
- [ ] Email tells user to "log in to see details"
- [ ] Template has been reviewed by privacy officer (if applicable)
- [ ] Using correct contact email: contact@retirezest.com

---

**Last Updated**: January 30, 2026
**Review Date**: Every 6 months or when privacy policy changes
**Contact Email**: contact@retirezest.com
