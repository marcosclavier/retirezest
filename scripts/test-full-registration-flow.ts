import { config } from 'dotenv';
import { resolve } from 'path';
import { sendAdminNewUserNotification } from '../lib/email';
import { sendVerificationEmail } from '../lib/email-verification';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

/**
 * Test the full registration email flow
 * Simulates what happens when a user registers
 */
async function testFullRegistrationFlow() {
  console.log('='.repeat(60));
  console.log('Testing Full Registration Email Flow');
  console.log('='.repeat(60));
  console.log();

  const testUser = {
    email: 'testuser@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const userName = `${testUser.firstName} ${testUser.lastName}`;
  const verificationToken = 'test-token-' + Date.now();
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

  console.log('Test User Info:');
  console.log(`  Email: ${testUser.email}`);
  console.log(`  Name: ${userName}`);
  console.log();

  console.log('Configuration:');
  console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log();

  // Test 1: Send verification email to user
  console.log('─'.repeat(60));
  console.log('Test 1: Sending verification email to user...');
  console.log('─'.repeat(60));

  try {
    const verificationResult = await sendVerificationEmail({
      to: testUser.email,
      verificationUrl,
      userName,
    });

    if (verificationResult.success) {
      console.log('✅ SUCCESS: Verification email sent to user');
      console.log(`   To: ${testUser.email}`);
      console.log(`   From: ${process.env.EMAIL_FROM}`);
    } else {
      console.log('❌ FAILED: Verification email');
      console.log(`   Error: ${verificationResult.error}`);
    }
  } catch (error) {
    console.log('❌ EXCEPTION in verification email');
    console.log(`   Error: ${error}`);
  }

  console.log();

  // Test 2: Send admin notification
  console.log('─'.repeat(60));
  console.log('Test 2: Sending admin notification...');
  console.log('─'.repeat(60));

  try {
    const adminResult = await sendAdminNewUserNotification({
      userEmail: testUser.email,
      userName,
      registrationDate: new Date(),
    });

    if (adminResult.success) {
      console.log('✅ SUCCESS: Admin notification sent');
      console.log(`   To: contact@retirezest.com`);
      console.log(`   From: ${process.env.EMAIL_FROM}`);
      console.log(`   User: ${userName} (${testUser.email})`);
    } else {
      console.log('❌ FAILED: Admin notification');
      console.log(`   Error: ${adminResult.error}`);
    }
  } catch (error) {
    console.log('❌ EXCEPTION in admin notification');
    console.log(`   Error: ${error}`);
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60));
  console.log();
  console.log('📬 Check the following inboxes:');
  console.log('   1. testuser@example.com (verification email)');
  console.log('   2. contact@retirezest.com (admin notification)');
  console.log();
  console.log('Note: testuser@example.com may not receive emails.');
  console.log('      The important test is the admin notification to contact@retirezest.com');
}

testFullRegistrationFlow();
