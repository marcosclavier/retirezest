import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        includePartner: true,
        partnerFirstName: true,
        partnerLastName: true,
        partnerDateOfBirth: true,
      },
      take: 10,
    });

    console.log(`Found ${users.length} users:\n`);
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   DOB: ${user.dateOfBirth}`);
      console.log(`   Include Partner: ${user.includePartner}`);
      if (user.includePartner) {
        console.log(`   Partner: ${user.partnerFirstName} ${user.partnerLastName}`);
        console.log(`   Partner DOB: ${user.partnerDateOfBirth}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
