import { config } from 'dotenv';
import { resolve } from 'path';
import { sendVerificationReminder } from '../lib/email-verification';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

/**
 * Test the verification reminder email template
 */
async function testVerificationReminder() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('           TESTING VERIFICATION REMINDER EMAIL');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log();

  const testData = {
    to: 'test@example.com', // Change this to your email for testing
    userName: 'Test User',
    verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=test-token-123`,
  };

  console.log('Test Email Details:');
  console.log(`  To: ${testData.to}`);
  console.log(`  Name: ${testData.userName}`);
  console.log(`  Verification URL: ${testData.verificationUrl}`);
  console.log();
  console.log('Configuration:');
  console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log();
  console.log('─'.repeat(70));
  console.log('Sending test reminder email...');
  console.log('─'.repeat(70));
  console.log();

  try {
    const result = await sendVerificationReminder({
      to: testData.to,
      verificationUrl: testData.verificationUrl,
      userName: testData.userName,
    });

    if (result.success) {
      console.log('✅ SUCCESS: Verification reminder sent!');
      console.log();
      console.log('📬 Check the inbox of:', testData.to);
      console.log('   Also check spam/junk folder if not in inbox');
      console.log();
      console.log('Email details:');
      console.log('   Subject: Reminder: Verify your RetireZest email to unlock all features');
      console.log(`   From: ${process.env.EMAIL_FROM}`);
      console.log(`   To: ${testData.to}`);
    } else {
      console.log('❌ FAILED: Could not send verification reminder');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.log('❌ EXCEPTION:', error);
    if (error instanceof Error) {
      console.log('Message:', error.message);
    }
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                        TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log();
  console.log('If the test email looks good, you can run:');
  console.log('  npx tsx scripts/send-verification-reminders.ts');
  console.log();
  console.log('This will send reminders to all 27 unverified users.');
}

testVerificationReminder();
