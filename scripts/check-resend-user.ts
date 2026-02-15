import { prisma } from '../lib/prisma';

async function checkResendUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test-resend@example.com' },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerificationToken: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log('  Email:', user.email);
    console.log('  Email Verified:', user.emailVerified);
    console.log('  Has Token:', user.emailVerificationToken ? 'Yes' : 'No');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkResendUser();
