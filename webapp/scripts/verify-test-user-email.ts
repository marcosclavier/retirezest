import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTestUserEmail() {
  try {
    console.log('🔍 Finding test user...');

    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('❌ Test user does not exist');
      process.exit(1);
    }

    if (user.emailVerified) {
      console.log('✅ Test user email is already verified');
      console.log('   Email:', user.email);
      return;
    }

    console.log('📧 Verifying test user email...');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      }
    });

    console.log('✅ Test user email verified successfully!');
    console.log('   Email:', user.email);
    console.log('   User can now access all features');

  } catch (error) {
    console.error('❌ Error verifying test user email:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTestUserEmail();
