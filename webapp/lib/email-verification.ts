import { Resend } from 'resend';

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';

interface SendVerificationEmailParams {
  to: string;
  verificationUrl: string;
  userName?: string;
}

/**
 * Send email verification link to a user
 */
export async function sendVerificationEmail({
  to,
  verificationUrl,
  userName,
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || FROM_EMAIL;

    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resend = new Resend(apiKey);

    const response = await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Unlock your retirement plan - verify your email',
      html: getVerificationEmailTemplate({ verificationUrl, userName }),
      text: getVerificationEmailPlainText({ verificationUrl, userName }),
    });

    if (response.error) {
      console.error('Failed to send verification email:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Verification email sent successfully:', response.data?.id);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * HTML template for email verification
 */
function getVerificationEmailTemplate({
  verificationUrl,
  userName,
}: {
  verificationUrl: string;
  userName?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                RetireZest
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">
                You're Almost Ready!
              </h2>
              ${userName ? `<p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hi ${userName},</p>` : ''}
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Welcome to RetireZest! Verify your email to unlock your personalized retirement planning tools:
              </p>
              <ul style="margin: 0 0 20px 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                <li><strong>Run unlimited retirement simulations</strong></li>
                <li><strong>Save multiple scenarios</strong></li>
                <li><strong>Get personalized insights</strong></li>
                <li><strong>Secure your account</strong></li>
              </ul>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Click the button below to verify your email in 30 seconds:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                This link will expire in <strong>48 hours</strong> for security reasons.
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px; color: #667eea; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you didn't create an account with RetireZest, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.5;">
                This email was sent by RetireZest
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px 0;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} RetireZest. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text version for email verification (improves deliverability)
 */
function getVerificationEmailPlainText({
  verificationUrl,
  userName,
}: {
  verificationUrl: string;
  userName?: string;
}): string {
  return `
You're Almost Ready!

${userName ? `Hi ${userName},\n\n` : ''}Welcome to RetireZest! Verify your email to unlock your personalized retirement planning tools:

• Run unlimited retirement simulations
• Save multiple scenarios
• Get personalized insights
• Secure your account

Click the link below to verify your email in 30 seconds:

${verificationUrl}

This link will expire in 48 hours for security reasons.

If you didn't create an account with RetireZest, you can safely ignore this email.

---

This email was sent by RetireZest
If you have any questions, please contact our support team.

© ${new Date().getFullYear()} RetireZest. All rights reserved.
  `.trim();
}

/**
 * Send a reminder email to users who haven't verified their email yet
 */
export async function sendVerificationReminder({
  to,
  verificationUrl,
  userName,
}: SendVerificationEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || FROM_EMAIL;

    if (!apiKey) {
      console.error('RESEND_API_KEY is not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resend = new Resend(apiKey);

    const response = await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Reminder: Verify your RetireZest email to unlock all features',
      html: getVerificationReminderTemplate({ verificationUrl, userName }),
      text: getVerificationReminderPlainText({ verificationUrl, userName }),
    });

    if (response.error) {
      console.error('Failed to send verification reminder:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Verification reminder sent successfully:', response.data?.id);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification reminder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * HTML template for verification reminder email
 */
function getVerificationReminderTemplate({
  verificationUrl,
  userName,
}: {
  verificationUrl: string;
  userName?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                RetireZest
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">
                Don't Miss Out! Verify Your Email
              </h2>
              ${userName ? `<p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hi ${userName},</p>` : ''}
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                We noticed you haven't verified your email address yet. Verifying takes just 30 seconds and unlocks all RetireZest features:
              </p>
              <ul style="margin: 0 0 20px 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                <li><strong>Save your retirement scenarios</strong></li>
                <li><strong>Run unlimited simulations</strong></li>
                <li><strong>Get personalized insights</strong></li>
                <li><strong>Access your data from any device</strong></li>
              </ul>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Click the button below to verify your email now:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                      Verify My Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                This link will expire in <strong>48 hours</strong> for security reasons.
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px; color: #667eea; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you didn't create an account with RetireZest, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.5;">
                This email was sent by RetireZest
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
                If you have any questions, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px 0;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} RetireZest. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text version for verification reminder
 */
function getVerificationReminderPlainText({
  verificationUrl,
  userName,
}: {
  verificationUrl: string;
  userName?: string;
}): string {
  return `
Don't Miss Out! Verify Your Email

${userName ? `Hi ${userName},\n\n` : ''}We noticed you haven't verified your email address yet. Verifying takes just 30 seconds and unlocks all RetireZest features:

• Save your retirement scenarios
• Run unlimited simulations
• Get personalized insights
• Access your data from any device

Click the link below to verify your email now:

${verificationUrl}

This link will expire in 48 hours for security reasons.

If you didn't create an account with RetireZest, you can safely ignore this email.

---

This email was sent by RetireZest
If you have any questions, please contact our support team.

© ${new Date().getFullYear()} RetireZest. All rights reserved.
  `.trim();
}
