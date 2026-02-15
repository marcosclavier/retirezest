import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n' + '═'.repeat(80));
    console.log('RetireZest User List');
    console.log(`Total Users: ${users.length}`);
    console.log('═'.repeat(80) + '\n');

    console.log('Name                              Email                                  Registered');
    console.log('─'.repeat(80));

    users.forEach((user) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
      const email = user.email;
      const registeredDate = user.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      console.log(`${name.padEnd(33)} ${email.padEnd(38)} ${registeredDate}`);
    });

    console.log('\n' + '═'.repeat(80) + '\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
