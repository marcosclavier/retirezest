/**
 * Make a user an admin
 *
 * Usage: DATABASE_URL="..." npx tsx scripts/make-admin.ts user@example.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  console.log(`\n🔐 Admin Role Assignment\n`);
  console.log(`Looking for user: ${email}...\n`);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      console.error(`❌ Error: User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`✅ Found user:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);
    console.log(`   Registered: ${user.createdAt.toLocaleDateString()}\n`);

    if (user.role === 'admin') {
      console.log(`✓ User is already an admin. No changes needed.`);
      process.exit(0);
    }

    // Update to admin
    const updated = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: 'admin' }
    });

    console.log(`✅ SUCCESS: User is now an admin!`);
    console.log(`\n🎉 ${user.firstName || user.email} can now access the admin dashboard at:`);
    console.log(`   ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'}/admin\n`);

  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error(`\n❌ Error: Email address is required`);
  console.log(`\nUsage:`);
  console.log(`  npx tsx scripts/make-admin.ts user@example.com\n`);
  console.log(`Or with DATABASE_URL:`);
  console.log(`  DATABASE_URL="postgresql://..." npx tsx scripts/make-admin.ts user@example.com\n`);
  process.exit(1);
}

makeAdmin(email);
