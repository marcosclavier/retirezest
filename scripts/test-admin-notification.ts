import { config } from 'dotenv';
import { resolve } from 'path';
import { sendAdminNewUserNotification } from '../lib/email';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

/**
 * Test script to verify admin notification emails are working
 * This will send a test email to contact@retirezest.com
 */
async function testAdminNotification() {
  console.log('Testing admin notification email...');
  console.log('Sending to: contact@retirezest.com');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('---');

  try {
    const result = await sendAdminNewUserNotification({
      userEmail: 'test-user@example.com',
      userName: 'Test User',
      registrationDate: new Date(),
    });

    if (result.success) {
      console.log('✅ SUCCESS: Admin notification email sent successfully!');
      console.log('Check the inbox of contact@retirezest.com');
      console.log('Also check spam/junk folder if not in inbox');
    } else {
      console.error('❌ FAILED: Could not send admin notification email');
      console.error('Error:', result.error);

      if (result.error?.includes('not configured')) {
        console.error('\n⚠️  RESEND_API_KEY is not configured in your .env.local file');
      }
    }
  } catch (error) {
    console.error('❌ EXCEPTION:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }

  console.log('---');
  console.log('Test complete');
}

// Run the test
testAdminNotification();
