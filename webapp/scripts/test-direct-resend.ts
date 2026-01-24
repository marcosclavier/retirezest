import { config } from 'dotenv';
import { resolve } from 'path';
import { Resend } from 'resend';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

/**
 * Direct test of Resend API to isolate the issue
 */
async function testDirectResend() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'notifications@retirezest.com';

  console.log('Direct Resend API Test');
  console.log('======================\n');
  console.log('API Key:', apiKey ? '✓ Set' : '✗ Not set');
  console.log('From Email:', fromEmail);
  console.log('To Email: contact@retirezest.com\n');

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not found');
    return;
  }

  const resend = new Resend(apiKey);

  try {
    console.log('Attempting to send email...\n');

    const response = await resend.emails.send({
      from: fromEmail,
      to: 'contact@retirezest.com',
      subject: 'Test Email - Direct Resend API',
      html: `
        <html>
          <body>
            <h1>Test Email</h1>
            <p>This is a direct test of the Resend API.</p>
            <p><strong>From:</strong> ${fromEmail}</p>
            <p><strong>To:</strong> contact@retirezest.com</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          </body>
        </html>
      `,
    });

    if (response.error) {
      console.error('❌ FAILED:', response.error);
    } else {
      console.log('✅ SUCCESS!');
      console.log('Email ID:', response.data?.id);
      console.log('\nCheck the inbox of contact@retirezest.com');
      console.log('Also check spam/junk folder if not in inbox');
    }
  } catch (error) {
    console.error('❌ EXCEPTION:', error);
  }
}

testDirectResend();
