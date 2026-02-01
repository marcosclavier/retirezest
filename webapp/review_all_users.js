const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Review ALL users in the database
 * Identify test users vs real users
 */

// Test user patterns
const TEST_PATTERNS = [
  '@test.com',
  '@example.com',
  'test@',
  'sprint5',
  'claire.conservative',
  'alex.aggressive',
  'mike.moderate',
  'sarah.struggling',
  'helen.highincome',
  'testy mctesterson',
  '@mailforce.link', // Temporary email service
];

function isTestUser(user) {
  const email = user.email.toLowerCase();
  const firstName = (user.firstName || '').toLowerCase();
  const lastName = (user.lastName || '').toLowerCase();
  const fullName = `${firstName} ${lastName}`.toLowerCase();

  return TEST_PATTERNS.some(pattern =>
    email.includes(pattern.toLowerCase()) ||
    firstName.includes(pattern.toLowerCase()) ||
    lastName.includes(pattern.toLowerCase()) ||
    fullName.includes(pattern.toLowerCase())
  );
}

async function reviewAllUsers() {
  console.log('='.repeat(80));
  console.log('DATABASE USER REVIEW - ALL USERS');
  console.log('='.repeat(80));
  console.log('');

  // Get all users
  const allUsers = await prisma.user.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      emailVerified: true,
      createdAt: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      _count: {
        select: {
          assets: true,
          scenarios: true,
          incomeSources: true,
          simulationRuns: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Total Active Users: ${allUsers.length}`);
  console.log('');

  // Categorize users
  const testUsers = [];
  const realUsers = [];

  for (const user of allUsers) {
    if (isTestUser(user)) {
      testUsers.push(user);
    } else {
      realUsers.push(user);
    }
  }

  // Further categorize test users
  const testUsersWithData = testUsers.filter(u =>
    u._count.assets > 0 || u._count.scenarios > 0 || u._count.incomeSources > 0
  );
  const testUsersEmpty = testUsers.filter(u =>
    u._count.assets === 0 && u._count.scenarios === 0 && u._count.incomeSources === 0
  );

  // Categorize real users
  const realUsersActive = realUsers.filter(u =>
    u._count.assets > 0 || u._count.scenarios > 0 || u._count.simulationRuns > 0
  );
  const realUsersInactive = realUsers.filter(u =>
    u._count.assets === 0 && u._count.scenarios === 0 && u._count.simulationRuns === 0
  );
  const realUsersPaying = realUsers.filter(u =>
    u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing'
  );

  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total Users: ${allUsers.length}`);
  console.log('');
  console.log('Test Users:');
  console.log(`  - Total: ${testUsers.length}`);
  console.log(`  - With Data: ${testUsersWithData.length}`);
  console.log(`  - Empty: ${testUsersEmpty.length}`);
  console.log('');
  console.log('Real Users:');
  console.log(`  - Total: ${realUsers.length}`);
  console.log(`  - Active (with data): ${realUsersActive.length}`);
  console.log(`  - Inactive (no data): ${realUsersInactive.length}`);
  console.log(`  - Paying customers: ${realUsersPaying.length}`);
  console.log('');

  // Detailed test user list
  console.log('='.repeat(80));
  console.log(`TEST USERS (${testUsers.length} total)`);
  console.log('='.repeat(80));
  console.log('');

  if (testUsersWithData.length > 0) {
    console.log(`--- TEST USERS WITH DATA (${testUsersWithData.length}) ---`);
    console.log('(These have assets, scenarios, or income data)');
    console.log('');
    testUsersWithData.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   Data: ${user._count.assets} assets, ${user._count.scenarios} scenarios, ${user._count.incomeSources} incomes, ${user._count.simulationRuns} simulations`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
  }

  if (testUsersEmpty.length > 0) {
    console.log(`--- TEST USERS WITHOUT DATA (${testUsersEmpty.length}) ---`);
    console.log('(These are empty accounts - safe to delete)');
    console.log('');
    testUsersEmpty.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
  }

  // Suspicious real users (might be test users)
  console.log('='.repeat(80));
  console.log('POTENTIALLY SUSPICIOUS REAL USERS');
  console.log('='.repeat(80));
  console.log('');

  const suspiciousUsers = realUsers.filter(u => {
    const email = u.email.toLowerCase();
    const firstName = (u.firstName || '').toLowerCase();
    const lastName = (u.lastName || '').toLowerCase();

    // Check for suspicious patterns
    return (
      firstName === 'testy' ||
      lastName === 'mctesterson' ||
      email.includes('mailforce') ||
      (firstName === 'n/a' && lastName === 'n/a')
    );
  });

  if (suspiciousUsers.length > 0) {
    console.log(`Found ${suspiciousUsers.length} potentially suspicious users:`);
    console.log('');
    suspiciousUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   Data: ${user._count.assets} assets, ${user._count.scenarios} scenarios, ${user._count.simulationRuns} simulations`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
  } else {
    console.log('No suspicious users found in real users category.');
    console.log('');
  }

  // Recommendations
  console.log('='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('');

  console.log('1. SAFE TO DELETE:');
  console.log(`   - ${testUsersEmpty.length} test users with no data`);
  console.log('   - These are empty accounts used for testing');
  console.log('   - No impact on metrics or real users');
  console.log('');

  console.log('2. REVIEW BEFORE DELETING:');
  console.log(`   - ${testUsersWithData.length} test users WITH data`);
  console.log('   - These may contain useful test scenarios');
  console.log('   - Keep if you want to preserve test data');
  console.log('   - Delete if test data is no longer needed');
  console.log('');

  if (suspiciousUsers.length > 0) {
    console.log('3. SUSPICIOUS USERS:');
    console.log(`   - ${suspiciousUsers.length} users that might be test accounts`);
    console.log('   - Review manually before taking action');
    console.log('   - Examples: mailforce.link emails, "Testy McTesterson" names');
    console.log('');
  }

  console.log('4. REAL USERS TO KEEP:');
  console.log(`   - ${realUsersActive.length} active users with data`);
  console.log(`   - ${realUsersPaying.length} paying customers`);
  console.log('   - DO NOT DELETE these users');
  console.log('');

  // Generate delete script
  console.log('='.repeat(80));
  console.log('DELETE COMMANDS');
  console.log('='.repeat(80));
  console.log('');

  if (testUsersEmpty.length > 0) {
    console.log('To delete empty test users:');
    console.log('');
    console.log('const testUserIds = [');
    testUsersEmpty.forEach(u => {
      console.log(`  '${u.id}', // ${u.email}`);
    });
    console.log('];');
    console.log('');
    console.log('// Then run:');
    console.log('// await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });');
    console.log('');
  }

  if (testUsersWithData.length > 0) {
    console.log('To delete test users WITH data (review first!):');
    console.log('');
    console.log('const testUserIdsWithData = [');
    testUsersWithData.forEach(u => {
      console.log(`  '${u.id}', // ${u.email} - ${u._count.assets} assets, ${u._count.simulationRuns} simulations`);
    });
    console.log('];');
    console.log('');
    console.log('// Then run:');
    console.log('// await prisma.user.deleteMany({ where: { id: { in: testUserIdsWithData } } });');
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('CLEANUP SCRIPT LOCATION');
  console.log('='.repeat(80));
  console.log('');
  console.log('A cleanup script will be generated: delete_test_users.js');
  console.log('Review the script before running it.');
  console.log('');

  return {
    testUsers,
    testUsersWithData,
    testUsersEmpty,
    suspiciousUsers,
    realUsersActive,
    realUsersPaying,
  };
}

reviewAllUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
