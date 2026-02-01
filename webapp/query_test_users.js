const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Query affected users and identify potential test users
 */

async function queryTestUsers() {
  console.log('='.repeat(80));
  console.log('DATABASE REVIEW - IDENTIFY TEST USERS');
  console.log('='.repeat(80));
  console.log('');

  // Find all affected users (assets but no simulations)
  const affectedUsers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      assets: {
        some: {}
      },
      simulationRuns: {
        none: {}
      }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          assets: true,
          scenarios: true,
          incomeSources: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Total Affected Users: ${affectedUsers.length}`);
  console.log('');

  // Identify test users by various patterns
  const testPatterns = [
    '@test.com',
    '@example.com',
    'test@',
    'sprint5',
    'claire.conservative',
    'alex.aggressive',
    'mike.moderate',
    'sarah.struggling',
    'helen.highincome',
  ];

  const testUsers = [];
  const realUsers = [];

  for (const user of affectedUsers) {
    const email = user.email.toLowerCase();
    const firstName = (user.firstName || '').toLowerCase();
    const lastName = (user.lastName || '').toLowerCase();

    const isTestUser = testPatterns.some(pattern =>
      email.includes(pattern.toLowerCase()) ||
      firstName.includes(pattern.toLowerCase()) ||
      lastName.includes(pattern.toLowerCase())
    );

    if (isTestUser) {
      testUsers.push(user);
    } else {
      realUsers.push(user);
    }
  }

  console.log('='.repeat(80));
  console.log(`TEST USERS (${testUsers.length} found)`);
  console.log('='.repeat(80));
  console.log('');

  if (testUsers.length === 0) {
    console.log('No test users found');
  } else {
    testUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   Assets: ${user._count.assets}, Scenarios: ${user._count.scenarios}, Incomes: ${user._count.incomeSources}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
  }

  console.log('='.repeat(80));
  console.log(`REAL USERS (${realUsers.length} found)`);
  console.log('='.repeat(80));
  console.log('');

  const verifiedRealUsers = realUsers.filter(u => u.emailVerified);
  const unverifiedRealUsers = realUsers.filter(u => !u.emailVerified);

  console.log(`Verified: ${verifiedRealUsers.length}`);
  console.log(`Unverified: ${unverifiedRealUsers.length}`);
  console.log('');

  console.log('--- VERIFIED REAL USERS ---');
  console.log('');
  verifiedRealUsers.forEach((user, idx) => {
    console.log(`${idx + 1}. ${user.email}`);
    console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
    console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
    console.log(`   Assets: ${user._count.assets}`);
    console.log('');
  });

  console.log('--- UNVERIFIED REAL USERS ---');
  console.log('');
  unverifiedRealUsers.forEach((user, idx) => {
    console.log(`${idx + 1}. ${user.email}`);
    console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
    console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
    console.log(`   Assets: ${user._count.assets}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total Users: ${affectedUsers.length}`);
  console.log(`  - Test Users: ${testUsers.length} (will be excluded from email campaign)`);
  console.log(`  - Real Users: ${realUsers.length} (will receive emails)`);
  console.log(`    - Verified: ${verifiedRealUsers.length} (Campaign 1: Bug fixed!)`);
  console.log(`    - Unverified: ${unverifiedRealUsers.length} (Campaign 2: Verify email)`);
  console.log('');

  console.log('='.repeat(80));
  console.log('RECOMMENDED ACTIONS');
  console.log('='.repeat(80));
  console.log('');
  console.log('1. Review test users list above');
  console.log('2. Confirm which users should be excluded/deleted');
  console.log('3. Options:');
  console.log('   a) Delete test users from database (permanent)');
  console.log('   b) Exclude test users from email campaign only (keep in DB)');
  console.log('   c) Manually add/remove specific users from exclusion list');
  console.log('');
  console.log('4. After cleanup, re-run email campaign with cleaned user list');
  console.log('');

  return { testUsers, realUsers, verifiedRealUsers, unverifiedRealUsers };
}

queryTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
