import { prisma } from '../lib/prisma';
import crypto from 'crypto';

async function generateVerificationToken() {
  try {
    const email = 'juanclavierb@gmail.com';

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update user with new token
    const user = await prisma.user.update({
      where: { email },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        verificationEmailSentAt: new Date(),
      },
    });

    console.log('✅ Verification token generated for:', user.email);
    console.log('\n📋 Verification Token:');
    console.log(verificationToken);
    console.log('\n🔗 Verification URL:');
    console.log(`http://localhost:3000/verify-email?token=${verificationToken}`);
    console.log('\n📧 To verify your email:');
    console.log('1. Click the URL above (or copy/paste into your browser)');
    console.log('2. Your email will be verified');
    console.log('3. The banner will disappear');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

generateVerificationToken();
