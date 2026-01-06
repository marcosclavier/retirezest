#!/usr/bin/env npx tsx
/**
 * List all user IDs from the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUserIds() {
  try {
    const users = await prisma.user.findMany({
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
    console.log('RETIREZEST USER IDs');
    console.log('============================================================\n');
    console.log(`Total users: ${users.length}\n`);

    users.forEach((user, index) => {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${fullName}`);
      console.log(`   Signed up: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });

    console.log('============================================================\n');

  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUserIds();
