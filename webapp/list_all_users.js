const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * List ALL users in the database with detailed information
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
  '@mailforce.link',
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

async function listAllUsers() {
  console.log('='.repeat(100));
  console.log('ALL USERS IN DATABASE');
  console.log('='.repeat(100));
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
      stripeCustomerId: true,
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

  console.log('='.repeat(100));
  console.log(`REAL USERS (${realUsers.length} total)`);
  console.log('='.repeat(100));
  console.log('');

  // Table header
  console.log('┌─────┬─────────────────────────────────────────┬────────────────────────────┬──────────┬───────────┬────────────────┬──────────┬──────────┬──────────┬─────────┐');
  console.log('│ No. │ Email                                   │ Name                       │ Verified │ Created   │ Subscription   │ Assets   │ Scenarios│ Incomes  │ Sim Runs│');
  console.log('├─────┼─────────────────────────────────────────┼────────────────────────────┼──────────┼───────────┼────────────────┼──────────┼──────────┼──────────┼─────────┤');

  realUsers.forEach((user, idx) => {
    const num = String(idx + 1).padEnd(3);
    const email = user.email.substring(0, 39).padEnd(39);
    const name = `${user.firstName || ''} ${user.lastName || ''}`.substring(0, 26).padEnd(26);
    const verified = (user.emailVerified ? 'Yes' : 'No').padEnd(8);
    const created = user.createdAt.toISOString().split('T')[0].padEnd(9);
    const subscription = (user.subscriptionStatus || 'free').substring(0, 14).padEnd(14);
    const assets = String(user._count.assets).padStart(6);
    const scenarios = String(user._count.scenarios).padStart(8);
    const incomes = String(user._count.incomeSources).padStart(7);
    const simRuns = String(user._count.simulationRuns).padStart(8);

    console.log(`│ ${num} │ ${email} │ ${name} │ ${verified} │ ${created} │ ${subscription} │  ${assets}  │  ${scenarios}  │  ${incomes} │ ${simRuns} │`);
  });

  console.log('└─────┴─────────────────────────────────────────┴────────────────────────────┴──────────┴───────────┴────────────────┴──────────┴──────────┴──────────┴─────────┘');
  console.log('');

  console.log('='.repeat(100));
  console.log(`TEST USERS (${testUsers.length} total)`);
  console.log('='.repeat(100));
  console.log('');

  // Table header for test users
  console.log('┌─────┬─────────────────────────────────────────┬────────────────────────────┬──────────┬───────────┬──────────┬──────────┬──────────┬─────────┐');
  console.log('│ No. │ Email                                   │ Name                       │ Verified │ Created   │ Assets   │ Scenarios│ Incomes  │ Sim Runs│');
  console.log('├─────┼─────────────────────────────────────────┼────────────────────────────┼──────────┼───────────┼──────────┼──────────┼──────────┼─────────┤');

  testUsers.forEach((user, idx) => {
    const num = String(idx + 1).padEnd(3);
    const email = user.email.substring(0, 39).padEnd(39);
    const name = `${user.firstName || ''} ${user.lastName || ''}`.substring(0, 26).padEnd(26);
    const verified = (user.emailVerified ? 'Yes' : 'No').padEnd(8);
    const created = user.createdAt.toISOString().split('T')[0].padEnd(9);
    const assets = String(user._count.assets).padStart(6);
    const scenarios = String(user._count.scenarios).padStart(8);
    const incomes = String(user._count.incomeSources).padStart(7);
    const simRuns = String(user._count.simulationRuns).padStart(8);

    console.log(`│ ${num} │ ${email} │ ${name} │ ${verified} │ ${created} │  ${assets}  │  ${scenarios}  │  ${incomes} │ ${simRuns} │`);
  });

  console.log('└─────┴─────────────────────────────────────────┴────────────────────────────┴──────────┴───────────┴──────────┴──────────┴──────────┴─────────┘');
  console.log('');

  // Summary Statistics
  console.log('='.repeat(100));
  console.log('SUMMARY STATISTICS');
  console.log('='.repeat(100));
  console.log('');

  // Real users stats
  const realUsersVerified = realUsers.filter(u => u.emailVerified).length;
  const realUsersWithAssets = realUsers.filter(u => u._count.assets > 0).length;
  const realUsersWithSimulations = realUsers.filter(u => u._count.simulationRuns > 0).length;
  const realUsersPaying = realUsers.filter(u => u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trialing').length;
  const totalAssets = realUsers.reduce((sum, u) => sum + u._count.assets, 0);
  const totalSimulations = realUsers.reduce((sum, u) => sum + u._count.simulationRuns, 0);

  console.log('REAL USERS:');
  console.log(`  Total: ${realUsers.length}`);
  console.log(`  Email Verified: ${realUsersVerified} (${Math.round(realUsersVerified / realUsers.length * 100)}%)`);
  console.log(`  With Assets: ${realUsersWithAssets} (${Math.round(realUsersWithAssets / realUsers.length * 100)}%)`);
  console.log(`  With Simulations: ${realUsersWithSimulations} (${Math.round(realUsersWithSimulations / realUsers.length * 100)}%)`);
  console.log(`  Paying Customers: ${realUsersPaying}`);
  console.log(`  Total Assets: ${totalAssets}`);
  console.log(`  Total Simulations: ${totalSimulations}`);
  console.log('');

  // Test users stats
  const testUsersEmpty = testUsers.filter(u => u._count.assets === 0 && u._count.scenarios === 0 && u._count.incomeSources === 0).length;
  const testUsersWithData = testUsers.length - testUsersEmpty;
  const testTotalSimulations = testUsers.reduce((sum, u) => sum + u._count.simulationRuns, 0);

  console.log('TEST USERS:');
  console.log(`  Total: ${testUsers.length}`);
  console.log(`  Empty (no data): ${testUsersEmpty}`);
  console.log(`  With Data: ${testUsersWithData}`);
  console.log(`  Total Simulations: ${testTotalSimulations}`);
  console.log('');

  console.log('='.repeat(100));
  console.log('');

  return { realUsers, testUsers };
}

listAllUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
