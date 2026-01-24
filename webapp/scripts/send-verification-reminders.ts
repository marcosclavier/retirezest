import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { sendVerificationReminder } from '../lib/email-verification';
import crypto from 'crypto';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

interface SendResult {
  email: string;
  success: boolean;
  error?: string;
}

/**
 * Send verification reminder emails to all unverified users
 */
async function sendVerificationReminders() {
  try {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('           SENDING EMAIL VERIFICATION REMINDERS');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log();

    // Get all unverified users
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerificationToken: true,
        emailVerificationExpiry: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${unverifiedUsers.length} unverified users\n`);

    if (unverifiedUsers.length === 0) {
      console.log('✅ All users are verified! No reminders to send.');
      return;
    }

    console.log('─'.repeat(70));
    console.log('User List:');
    console.log('─'.repeat(70));
    unverifiedUsers.forEach((user, index) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
      const daysAgo = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${index + 1}. ${user.email} (${name}) - Registered ${daysAgo} days ago`);
    });
    console.log();

    // Ask for confirmation (simulated - in production you'd want actual user input)
    console.log('⚠️  IMPORTANT: This will send emails to all unverified users listed above.');
    console.log('   Make sure you have tested the email template first!');
    console.log();

    const results: SendResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    console.log('─'.repeat(70));
    console.log('Sending emails...');
    console.log('─'.repeat(70));
    console.log();

    for (const user of unverifiedUsers) {
      const userName = [user.firstName, user.lastName].filter(Boolean).join(' ');

      // Check if verification token is expired
      let verificationToken = user.emailVerificationToken;
      const now = new Date();

      if (!verificationToken || (user.emailVerificationExpiry && user.emailVerificationExpiry < now)) {
        // Generate new token if expired or missing
        verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: verificationExpiry,
          },
        });

        console.log(`  Generated new token for ${user.email} (old token expired)`);
      }

      // Use production URL for verification links
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://retirezest.com';
      // Override localhost with production URL when sending emails
      const productionUrl = baseUrl.includes('localhost') ? 'https://retirezest.com' : baseUrl;
      const verificationUrl = `${productionUrl}/verify-email?token=${verificationToken}`;

      // Send reminder email
      const result = await sendVerificationReminder({
        to: user.email,
        verificationUrl,
        userName,
      });

      if (result.success) {
        successCount++;
        console.log(`✅ Sent to: ${user.email}`);
        results.push({ email: user.email, success: true });
      } else {
        failureCount++;
        console.log(`❌ Failed to send to: ${user.email}`);
        console.log(`   Error: ${result.error}`);
        results.push({ email: user.email, success: false, error: result.error });
      }

      // Add a delay to avoid rate limiting (2 requests per second max = 500ms delay)
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    console.log();
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('                          SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log();
    console.log(`Total users: ${unverifiedUsers.length}`);
    console.log(`✅ Successfully sent: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log();

    if (failureCount > 0) {
      console.log('Failed emails:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.email}: ${r.error}`);
        });
      console.log();
    }

    console.log('═══════════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error sending verification reminders:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
sendVerificationReminders();
