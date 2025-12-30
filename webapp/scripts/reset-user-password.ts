#!/usr/bin/env tsx
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword(email: string, newPassword: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    console.log(`✅ Password reset successful for ${email}`);
    console.log(`   New password: ${newPassword}`);
    console.log(`\n   You can now log in at http://localhost:3000/login`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'juanclavierb@gmail.com';
const password = process.argv[3] || 'password123';

console.log(`\nResetting password for ${email}...`);
resetPassword(email, password);
