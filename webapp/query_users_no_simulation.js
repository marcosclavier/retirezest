const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find users with assets but NO simulation runs
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            assets: {
              some: {} // Has at least one asset
            }
          },
          {
            simulationRuns: {
              none: {} // Has NO simulation runs
            }
          }
        ]
      },
      include: {
        assets: true,
        incomeSources: true,
        scenarios: true,
        simulationRuns: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Get latest 20
    });

    console.log('='.repeat(80));
    console.log('USERS WITH ASSETS BUT NO SIMULATION RESULTS');
    console.log('='.repeat(80));
    console.log(`Total found: ${users.length}`);
    console.log('');

    users.forEach((user, i) => {
      console.log(`\n${i + 1}. USER: ${user.email}`);
      console.log('-'.repeat(80));
      console.log(`User ID: ${user.id}`);
      console.log(`Account Created: ${user.createdAt}`);
      console.log(`Account Deleted: ${user.deletedAt || 'Active'}`);
      console.log('');
      console.log(`Assets Count: ${user.assets.length}`);
      if (user.assets.length > 0) {
        let totalAssets = 0;
        user.assets.forEach(asset => {
          console.log(`  - ${asset.type}: $${asset.balance.toLocaleString()}`);
          totalAssets += asset.balance;
        });
        console.log(`  TOTAL ASSETS: $${totalAssets.toLocaleString()}`);
      }
      console.log('');
      console.log(`Income Sources Count: ${user.incomeSources.length}`);
      if (user.incomeSources.length > 0) {
        user.incomeSources.forEach(income => {
          console.log(`  - ${income.type}: $${income.amount.toLocaleString()}/year (starts age ${income.startAge || 'N/A'})`);
        });
      }
      console.log('');
      console.log(`Scenarios Count: ${user.scenarios.length}`);
      if (user.scenarios.length > 0) {
        user.scenarios.forEach(scenario => {
          console.log(`  - "${scenario.name}" (age ${scenario.currentAge} → ${scenario.retirementAge})`);
        });
      }
      console.log('');
      console.log(`HAS SIMULATION RUNS: ${user.simulationRuns.length > 0 ? 'YES' : 'NO - NEVER RAN SIMULATION!'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS SUMMARY');
    console.log('='.repeat(80));

    const activeUsers = users.filter(u => !u.deletedAt).length;
    const deletedUsers = users.filter(u => u.deletedAt).length;
    const withScenarios = users.filter(u => u.scenarios.length > 0).length;
    const withIncomes = users.filter(u => u.incomeSources.length > 0).length;

    console.log(`Active users with assets but no simulations: ${activeUsers}`);
    console.log(`Deleted users with assets but no simulations: ${deletedUsers}`);
    console.log(`Users who also created scenarios: ${withScenarios}`);
    console.log(`Users who also added income sources: ${withIncomes}`);
    console.log(`Churn rate: ${((deletedUsers / users.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
