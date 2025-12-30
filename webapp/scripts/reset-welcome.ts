#!/usr/bin/env tsx
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetWelcome(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { hasSeenWelcome: false },
    });

    console.log(`✅ Successfully reset hasSeenWelcome flag for ${email}`);
    console.log(`   User will see the Quick Start page on next login`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'juanclavierb@gmail.com';
resetWelcome(email);
