/**
 * Direct test for password reset email to jrcb@hotmail.com
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(__dirname, '.env.local') });

import { sendPasswordResetEmail } from './lib/email';

async function testDirectEmail() {
  console.log('🧪 Testing Direct Email Send to jrcb@hotmail.com\n');
  console.log('='.repeat(60));

  // Check environment
  console.log('Environment Check:');
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'SET (' + process.env.RESEND_API_KEY.substring(0, 10) + '...)' : 'NOT SET'}`);
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'onboarding@resend.dev (default)'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log('='.repeat(60));

  const testEmail = 'jrcb@hotmail.com';
  const resetUrl = 'http://localhost:3000/reset-password?token=test-direct-token-' + Date.now();
  const userName = 'Test User';

  console.log(`\n📤 Attempting to send email...`);
  console.log(`To: ${testEmail}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log(`User name: ${userName}\n`);

  try {
    const startTime = Date.now();
    const result = await sendPasswordResetEmail({
      to: testEmail,
      resetUrl,
      userName,
    });
    const duration = Date.now() - startTime;

    console.log(`⏱️  Request took: ${duration}ms\n`);

    if (result.success) {
      console.log('✅ SUCCESS! Email sent successfully!');
      console.log('📬 Check your jrcb@hotmail.com inbox');
      console.log('📧 Also check spam/junk folder');
    } else {
      console.error('❌ FAILED to send email');
      console.error('Error details:', result.error);

      if (result.error?.includes('API key')) {
        console.error('\n⚠️  This looks like an API key issue.');
        console.error('   - Make sure RESEND_API_KEY is set correctly');
        console.error('   - Verify the API key is valid in Resend dashboard');
      }
    }
  } catch (error: any) {
    console.error('❌ Exception caught:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n' + '='.repeat(60));
}

testDirectEmail().catch(console.error);
