import { prisma } from '../lib/prisma';

async function checkTestUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test-verify3@example.com' },
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
      console.log('❌ Test user not found');
      return;
    }

    console.log('✅ Test user found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Email Verified:', user.emailVerified);
    console.log('  Verification Token:', user.emailVerificationToken ? `${user.emailVerificationToken.substring(0, 20)}...` : 'null');
    console.log('  Token Expiry:', user.emailVerificationExpiry?.toISOString() || 'null');
    console.log('  Last Email Sent:', user.verificationEmailSentAt?.toISOString() || 'null');
    console.log('  Created:', user.createdAt.toISOString());

    if (user.emailVerificationToken) {
      console.log('\n📋 Full verification token (for testing):');
      console.log(user.emailVerificationToken);
      console.log('\n🔗 Verification URL:');
      console.log(`${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${user.emailVerificationToken}`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTestUser();
