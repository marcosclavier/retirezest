import { prisma } from '../lib/prisma';

async function checkJuanUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'juanclavierb@gmail.com' },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerificationToken: true,
        emailVerificationExpiry: true,
        verificationEmailSentAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log('❌ No account found with juanclavierb@gmail.com');
      console.log('✅ You can register a new account at: http://localhost:3000/register');
      return;
    }

    console.log('✅ Account found:');
    console.log('  Email:', user.email);
    console.log('  Email Verified:', user.emailVerified);
    console.log('  Has Verification Token:', user.emailVerificationToken ? 'Yes' : 'No');
    console.log('  Token Expiry:', user.emailVerificationExpiry?.toISOString() || 'N/A');
    console.log('  Last Email Sent:', user.verificationEmailSentAt?.toISOString() || 'Never');
    console.log('  Created:', user.createdAt.toISOString());

    if (user.emailVerificationToken) {
      console.log('\n📋 Verification Token:');
      console.log(user.emailVerificationToken);
      console.log('\n🔗 Verification URL:');
      console.log(`http://localhost:3000/verify-email?token=${user.emailVerificationToken}`);
    }

    if (!user.emailVerified) {
      console.log('\n📧 To test email verification:');
      console.log('1. Go to: http://localhost:3000/resend-verification');
      console.log('2. Click "Resend Verification Email"');
      console.log('3. Check your inbox at juanclavierb@gmail.com');
      console.log('\nOR use the verification URL above to verify directly');
    } else {
      console.log('\n✅ Email is already verified!');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkJuanUser();
