const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reviewUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      subscriptionTier: true,
      emailVerified: true,
      freeSimulationsUsed: true,
      simulationRunsToday: true,
      _count: {
        select: {
          incomeSources: true,
          assets: true,
          expenses: true,
          scenarios: true,
          simulationRuns: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log('='.repeat(80));
  console.log('USER DATABASE REVIEW FOR REGRESSION TESTING');
  console.log('='.repeat(80));
  console.log('');
  console.log('Total Users:', users.length);
  console.log('');

  // Categorize users
  const testAccounts = users.filter(u => u.email.includes('test') || u.email.includes('+'));
  const verifiedUsers = users.filter(u => u.emailVerified && !u.email.includes('test') && !u.email.includes('+'));
  const unverifiedUsers = users.filter(u => !u.emailVerified && !u.email.includes('test') && !u.email.includes('+'));

  console.log('📊 User Summary:');
  console.log('-'.repeat(80));
  console.log(`Test Accounts: ${testAccounts.length}`);
  console.log(`Verified Users: ${verifiedUsers.length}`);
  console.log(`Unverified Users: ${unverifiedUsers.length}`);
  console.log('');

  console.log('🧪 TEST ACCOUNTS (for regression testing):');
  console.log('-'.repeat(80));
  if (testAccounts.length === 0) {
    console.log('No test accounts found');
  } else {
    testAccounts.forEach((user, idx) => {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Name: ${fullName}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Assets: ${user._count.assets}, Income: ${user._count.incomeSources}, Expenses: ${user._count.expenses}`);
      console.log(`   Scenarios: ${user._count.scenarios}, Simulations: ${user._count.simulationRuns}`);
      console.log('');
    });
  }

  console.log('✅ VERIFIED REAL USERS (meaningful for regression):');
  console.log('-'.repeat(80));
  if (verifiedUsers.length === 0) {
    console.log('No verified users found');
  } else {
    verifiedUsers.forEach((user, idx) => {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
      const hasData = user._count.assets > 0 || user._count.incomeSources > 0;
      const hasSimulations = user._count.simulationRuns > 0;

      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Name: ${fullName}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Tier: ${user.subscriptionTier}`);
      console.log(`   Data: Assets=${user._count.assets}, Income=${user._count.incomeSources}, Expenses=${user._count.expenses}`);
      console.log(`   Usage: Scenarios=${user._count.scenarios}, Simulations=${user._count.simulationRuns}`);
      console.log(`   Regression Value: ${hasData && hasSimulations ? '🎯 HIGH' : hasData ? '⚠️ MEDIUM' : '❌ LOW'}`);
      console.log('');
    });
  }

  console.log('❌ UNVERIFIED USERS:');
  console.log('-'.repeat(80));
  if (unverifiedUsers.length === 0) {
    console.log('No unverified users found');
  } else {
    console.log(`Total: ${unverifiedUsers.length} users`);
    console.log('(Not recommended for regression testing - incomplete onboarding)');
  }

  await prisma.$disconnect();
}

reviewUsers().catch(console.error);
