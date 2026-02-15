import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsersTable() {
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

  console.log('REGISTERED USERS IN RETIREZEST.COM');
  console.log('='.repeat(150));
  console.log('');

  // Table header
  console.log(
    '#'.padEnd(4) +
    'Name'.padEnd(30) +
    'Email'.padEnd(40) +
    'User ID'.padEnd(38) +
    'Verified'.padEnd(12) +
    'Days Ago'
  );
  console.log('-'.repeat(150));

  // Table rows
  users.forEach((user, index) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
    const verified = user.emailVerified ? 'Yes' : 'No';
    const daysAgo = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    console.log(
      `${(index + 1).toString().padEnd(4)}` +
      name.substring(0, 29).padEnd(30) +
      user.email.substring(0, 39).padEnd(40) +
      user.id.padEnd(38) +
      verified.padEnd(12) +
      daysAgo
    );
  });

  console.log('='.repeat(150));
  console.log('');
  console.log(`Total users: ${users.length}`);
  console.log(`Verified: ${users.filter(u => u.emailVerified).length} (${Math.round(users.filter(u => u.emailVerified).length / users.length * 100)}%)`);
  console.log(`Not verified: ${users.filter(u => !u.emailVerified).length} (${Math.round(users.filter(u => !u.emailVerified).length / users.length * 100)}%)`);
}

listUsersTable()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
