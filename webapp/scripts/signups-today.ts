#!/usr/bin/env npx tsx
/**
 * Count user signups for today
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getSignupsToday() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const signupsToday = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n============================================================');
    console.log(`SIGNUPS TODAY - ${today.toDateString()}`);
    console.log('============================================================\n');
    console.log(`Total signups today: ${signupsToday.length}\n`);

    if (signupsToday.length === 0) {
      console.log('No signups today yet.\n');
    } else {
      signupsToday.forEach((user, index) => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
        const signupTime = user.createdAt.toLocaleTimeString();
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${fullName}`);
        console.log(`   Time: ${signupTime}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });
    }

    console.log('============================================================\n');

  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

getSignupsToday();
