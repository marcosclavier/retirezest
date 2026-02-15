#!/usr/bin/env npx tsx
/**
 * List user IDs for users who signed up on January 2nd, 2026
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listJan2Users() {
  try {
    // January 2nd, 2026 date range (full day)
    const startDate = new Date('2026-01-02T00:00:00Z');
    const endDate = new Date('2026-01-03T00:00:00Z');

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
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
        createdAt: 'asc',
      },
    });

    console.log('\n============================================================');
    console.log('JANUARY 2nd, 2026 USER IDs');
    console.log('============================================================\n');
    console.log(`Total users on January 2nd: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No users signed up on January 2nd, 2026.\n');
    } else {
      users.forEach((user, index) => {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${fullName}`);
        console.log(`   Signed up: ${user.createdAt.toISOString()}`);
        console.log('');
      });

      console.log('============================================================\n');

      // Also output just the IDs in a simple list
      console.log('User IDs only (for easy copying):\n');
      users.forEach((user) => {
        console.log(user.id);
      });
      console.log('');
    }

  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listJan2Users();
