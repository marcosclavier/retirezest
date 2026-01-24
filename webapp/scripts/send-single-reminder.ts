import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { sendVerificationReminder } from '../lib/email-verification';
import crypto from 'crypto';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

/**
 * Send reminder to a specific email address
 */
async function sendSingleReminder() {
  const email = 'nickbrow120003@gmail.com';

  try {
    console.log(`Sending verification reminder to: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerificationToken: true,
        emailVerificationExpiry: true,
      },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    if (!user.emailVerificationToken) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
        },
      });

      user.emailVerificationToken = verificationToken;
      console.log('Generated new verification token\n');
    }

    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${user.emailVerificationToken}`;

    const result = await sendVerificationReminder({
      to: user.email,
      verificationUrl,
      userName,
    });

    if (result.success) {
      console.log(`✅ Successfully sent reminder to: ${email}`);
    } else {
      console.log(`❌ Failed to send to: ${email}`);
      console.log(`   Error: ${result.error}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendSingleReminder();
