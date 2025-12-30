import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNewUsersToday() {
  try {
    // Get start of today (midnight UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    // Get end of today (just before midnight UTC)
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    console.log('📅 Checking new users for today:');
    console.log('  Start:', todayStart.toISOString());
    console.log('  End:', todayEnd.toISOString());
    console.log('');

    // Count new users today
    const newUsersCount = await prisma.user.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Get the actual users
    const newUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ New users today: ${newUsersCount}`);
    console.log('');

    if (newUsersCount > 0) {
      console.log('📋 User details:');
      newUsers.forEach((user, index) => {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
        const verified = user.emailVerified ? '✓' : '✗';
        console.log(`  ${index + 1}. ${user.email} (${name}) - Verified: ${verified}`);
        console.log(`     Registered: ${user.createdAt.toISOString()}`);
      });
    } else {
      console.log('ℹ️  No new users registered today.');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkNewUsersToday();
