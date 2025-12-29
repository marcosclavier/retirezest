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
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to RetireZest! Verify your email',
      html: getVerificationEmailTemplate({ verificationUrl, userName }),
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
                Welcome to RetireZest!
              </h2>
              ${userName ? `<p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hi ${userName},</p>` : ''}
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for signing up! We're excited to help you plan your retirement journey. To get started, please verify your email address by clicking the button below:
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
                This link will expire in <strong>7 days</strong> for security reasons.
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
