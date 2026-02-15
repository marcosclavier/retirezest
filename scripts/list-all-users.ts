import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('COMPLETE LIST OF REGISTERED USERS IN RETIREZEST.COM');
  console.log('='.repeat(120));
  console.log('');

  users.forEach((user, index) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
    const verified = user.emailVerified ? '✓ Verified' : '✗ Not verified';
    const daysAgo = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`${index + 1}. ${name}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${verified}`);
    console.log(`   Registered: ${user.createdAt.toISOString().split('T')[0]} (${daysAgo} days ago)`);
    console.log('');
  });

  console.log('='.repeat(120));
  console.log(`Total users: ${users.length}`);
  console.log(`Verified: ${users.filter(u => u.emailVerified).length}`);
  console.log(`Not verified: ${users.filter(u => !u.emailVerified).length}`);
}

listUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
