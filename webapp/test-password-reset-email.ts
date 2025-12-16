/**
 * Test script to verify password reset email functionality
 *
 * This script tests:
 * 1. Email service configuration
 * 2. Password reset email sending
 * 3. Email template generation
 *
 * Usage: npx tsx test-password-reset-email.ts
 */

import { sendPasswordResetEmail } from './lib/email';

async function testPasswordResetEmail() {
  console.log('🧪 Testing Password Reset Email Functionality\n');
  console.log('='.repeat(60));

  // Check if RESEND_API_KEY is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not configured in .env.local');
    console.error('Please add RESEND_API_KEY to your .env.local file');
    process.exit(1);
  }

  console.log('✅ RESEND_API_KEY is configured');
  console.log(`📧 From email: ${process.env.EMAIL_FROM || 'onboarding@resend.dev'}`);
  console.log('='.repeat(60));

  // Test email sending
  const testEmail = 'test@example.com'; // Update this to your email for testing
  const resetUrl = 'http://localhost:3000/reset-password?token=test-token-123';
  const userName = 'Test User';

  console.log(`\n📤 Sending test password reset email to: ${testEmail}`);
  console.log(`🔗 Reset URL: ${resetUrl}`);
  console.log(`👤 User name: ${userName}\n`);

  try {
    const result = await sendPasswordResetEmail({
      to: testEmail,
      resetUrl,
      userName,
    });

    if (result.success) {
      console.log('✅ Password reset email sent successfully!');
      console.log('📬 Check your inbox (and spam folder) for the email');
    } else {
      console.error('❌ Failed to send password reset email');
      console.error('Error:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed successfully!');
  console.log('='.repeat(60));
}

// Run the test
testPasswordResetEmail().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
