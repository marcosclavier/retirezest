/**
 * Check email verification status for recent users
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmailVerification() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    console.log('\n📧 Recent Users - Email Verification Status\n');
    console.log('='.repeat(80));

    for (const user of users) {
      console.log(`Email: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Verified: ${user.emailVerified ? '✅ YES' : '❌ NO'}`);
      console.log(`  Created: ${user.createdAt.toISOString()}`);
      console.log('-'.repeat(80));
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailVerification();
