/**
 * Mark a user's email as verified (for testing/development)
 * Usage: DATABASE_URL="..." npx tsx scripts/verify-user-email.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyUserEmail() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx tsx scripts/verify-user-email.ts <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    if (user.emailVerified) {
      console.log(`✅ Email already verified for: ${email}`);
      process.exit(0);
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    console.log(`✅ Email verification successful for: ${email}`);
    console.log(`   User ID: ${user.id}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUserEmail();
