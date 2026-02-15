import { Resend } from 'resend';

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';

interface SendSimulationReadyEmailParams {
  to: string;
  userName?: string;
  simulationUrl: string;
  assetCount: number;
  incomeCount: number;
  expenseCount: number;
}

/**
 * Send simulation-ready notification email to user
 */
export async function sendSimulationReadyEmail({
  to,
  userName,
  simulationUrl,
  assetCount,
  incomeCount,
  expenseCount,
}: SendSimulationReadyEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "🎯 You're Ready for Your Retirement Simulation!",
      html: getSimulationReadyEmailTemplate({
        userName,
        simulationUrl,
        assetCount,
        incomeCount,
        expenseCount,
      }),
    });

    if (response.error) {
      console.error('Failed to send simulation-ready email:', response.error);
      return { success: false, error: response.error.message };
    }

    console.log('Simulation-ready email sent successfully:', response.data?.id);
    return { success: true };
  } catch (error) {
    console.error('Error sending simulation-ready email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * HTML template for simulation-ready email
 */
function getSimulationReadyEmailTemplate({
  userName,
  simulationUrl,
  assetCount,
  incomeCount,
  expenseCount,
}: {
  userName?: string;
  simulationUrl: string;
  assetCount: number;
  incomeCount: number;
  expenseCount: number;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Ready for Your Retirement Simulation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-align: center;">
                🎯 You're Ready!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">
                Your Retirement Simulation Awaits
              </h2>

              ${userName ? `<p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">Hi ${userName},</p>` : ''}

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Great news! You've added enough information to run your personalized retirement simulation.
              </p>

              <!-- Progress Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%); border-radius: 8px; border: 2px solid #10b981; margin: 30px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      ✓ Your Data is Ready
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #047857; font-size: 15px;">✓ <strong>${assetCount}</strong> asset${assetCount !== 1 ? 's' : ''} (RRSP, TFSA, etc.)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #047857; font-size: 15px;">✓ <strong>${incomeCount}</strong> income source${incomeCount !== 1 ? 's' : ''}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="color: #047857; font-size: 15px;">✓ <strong>${expenseCount}</strong> expense${expenseCount !== 1 ? 's' : ''}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>Here's what you'll discover:</strong>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #3b82f6; font-size: 20px; margin-right: 10px;">📊</span>
                    <span style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Health Score:</strong> How sustainable is your retirement plan?</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #3b82f6; font-size: 20px; margin-right: 10px;">💰</span>
                    <span style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Tax Optimization:</strong> How much you'll pay in taxes over your lifetime</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #3b82f6; font-size: 20px; margin-right: 10px;">🎯</span>
                    <span style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Best Strategy:</strong> Optimal withdrawal strategy for your situation</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #3b82f6; font-size: 20px; margin-right: 10px;">📈</span>
                    <span style="color: #374151; font-size: 15px; line-height: 1.6;"><strong>Year-by-Year Projections:</strong> Detailed breakdown of your retirement years</span>
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${simulationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                      Run Your Simulation Now
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>It only takes 30 seconds</strong> to run your first simulation and see your personalized retirement outlook.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Have questions? We're here to help! Reply to this email or visit our <a href="${simulationUrl.replace('/simulation', '/help')}" style="color: #3b82f6; text-decoration: none;">Help Center</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.5;">
                This email was sent by RetireZest
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
                You're receiving this because you've added financial data to your RetireZest account.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer spacing -->
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
