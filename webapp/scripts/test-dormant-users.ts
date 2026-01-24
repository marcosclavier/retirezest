import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Test dormant users (those who added data but never ran simulations)
 * to understand why they stopped
 */

async function testDormantUsers() {
  console.log('🔍 Testing Dormant Users - Added Data but Never Simulated');
  console.log('='.repeat(80));

  // Find users who have assets but NO simulations
  const dormantUsers = await prisma.user.findMany({
    where: {
      deletedAt: null,
      assets: {
        some: {}, // Has at least one asset
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      createdAt: true,
      province: true,
      includePartner: true,
      _count: {
        select: {
          assets: true,
          incomeSources: true,
          expenses: true,
          simulationRuns: true,
        },
      },
      simulationRuns: {
        select: {
          id: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Filter to only those with 0 simulations or very few simulations
  const reallyDormant = dormantUsers.filter(u => u._count.simulationRuns === 0);
  const lowActivity = dormantUsers.filter(u => u._count.simulationRuns > 0 && u._count.simulationRuns < 3);

  console.log(`\n📊 SUMMARY`);
  console.log('-'.repeat(80));
  console.log(`Total Users with Assets: ${dormantUsers.length}`);
  console.log(`Users with ZERO simulations: ${reallyDormant.length}`);
  console.log(`Users with 1-2 simulations: ${lowActivity.length}`);

  console.log(`\n\n❌ DORMANT USERS (0 simulations, but has data)`);
  console.log('='.repeat(80));

  if (reallyDormant.length === 0) {
    console.log('✅ Great! No users have added data without running at least one simulation');
  } else {
    reallyDormant.forEach((user, idx) => {
      const accountAge = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

      console.log(`\n${idx + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName || 'Not provided'}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleDateString()} (${accountAge} days ago)`);
      console.log(`   Province: ${user.province || 'Not set'}`);
      console.log(`   Partner: ${user.includePartner ? 'Yes' : 'No'}`);
      console.log(`   Data Added:`);
      console.log(`     - Assets: ${user._count.assets}`);
      console.log(`     - Income: ${user._count.incomeSources}`);
      console.log(`     - Expenses: ${user._count.expenses}`);
      console.log(`   ❌ NEVER RAN A SIMULATION`);

      // Hypothesis: Why didn't they simulate?
      console.log(`   Possible Reasons:`);
      if (user._count.assets === 0) {
        console.log(`     - No assets added (but query should have filtered these out)`);
      }
      if (user._count.incomeSources === 0) {
        console.log(`     - Missing income data (CPP/OAS) - might have been confused`);
      }
      if (user._count.expenses === 0) {
        console.log(`     - No expenses - might not know how much they spend`);
      }
      if (user._count.assets > 0 && user._count.incomeSources > 0 && user._count.expenses > 0) {
        console.log(`     - 🚨 HAS ALL DATA but still didn't simulate - likely UI/UX issue!`);
      }
    });
  }

  console.log(`\n\n⚠️  LOW ACTIVITY USERS (1-2 simulations only)`);
  console.log('='.repeat(80));

  if (lowActivity.length === 0) {
    console.log('No users with only 1-2 simulations');
  } else {
    lowActivity.forEach((user, idx) => {
      const accountAge = Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const lastSim = user.simulationRuns[0];
      const daysSinceLastSim = lastSim
        ? Math.floor((new Date().getTime() - new Date(lastSim.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      console.log(`\n${idx + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName || 'Not provided'}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleDateString()} (${accountAge} days ago)`);
      console.log(`   Simulations: ${user._count.simulationRuns}`);
      if (lastSim) {
        console.log(`   Last Simulation: ${new Date(lastSim.createdAt).toLocaleDateString()} (${daysSinceLastSim} days ago)`);
      }
      console.log(`   Data Added:`);
      console.log(`     - Assets: ${user._count.assets}`);
      console.log(`     - Income: ${user._count.incomeSources}`);
      console.log(`     - Expenses: ${user._count.expenses}`);

      if (daysSinceLastSim > 7) {
        console.log(`   🚨 Inactive for ${daysSinceLastSim} days - might have found issues with results`);
      }
    });
  }

  // Now let's pick one dormant user and get their full details
  if (reallyDormant.length > 0) {
    const testUser = reallyDormant[0];

    console.log(`\n\n🔬 DETAILED ANALYSIS: ${testUser.email}`);
    console.log('='.repeat(80));

    const userDetails = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        province: true,
        includePartner: true,
        partnerFirstName: true,
        partnerDateOfBirth: true,
        lifeExpectancy: true,
        createdAt: true,
        assets: {
          select: {
            type: true,
            balance: true,
            currentValue: true,
            owner: true,
            contributionRoom: true,
            createdAt: true,
          },
        },
        incomeSources: {
          select: {
            type: true,
            amount: true,
            startAge: true,
            owner: true,
            frequency: true,
            createdAt: true,
          },
        },
        expenses: {
          select: {
            description: true,
            amount: true,
            frequency: true,
            isEssential: true,
            isRecurring: true,
            createdAt: true,
          },
        },
      },
    });

    if (userDetails) {
      console.log(`Profile Completeness:`);
      console.log(`  ✓ Email: ${userDetails.email}`);
      console.log(`  ${userDetails.firstName ? '✓' : '✗'} Name: ${userDetails.firstName || 'MISSING'} ${userDetails.lastName || ''}`);
      console.log(`  ${userDetails.dateOfBirth ? '✓' : '✗'} Date of Birth: ${userDetails.dateOfBirth || 'MISSING'}`);
      console.log(`  ${userDetails.province ? '✓' : '✗'} Province: ${userDetails.province || 'MISSING'}`);
      console.log(`  ✓ Partner: ${userDetails.includePartner ? 'Yes' : 'No'}`);
      if (userDetails.includePartner) {
        console.log(`    ${userDetails.partnerFirstName ? '✓' : '✗'} Partner Name: ${userDetails.partnerFirstName || 'MISSING'}`);
        console.log(`    ${userDetails.partnerDateOfBirth ? '✓' : '✗'} Partner DOB: ${userDetails.partnerDateOfBirth || 'MISSING'}`);
      }

      console.log(`\nAssets Added (${userDetails.assets.length}):`);
      userDetails.assets.forEach(asset => {
        const balance = asset.balance || asset.currentValue || 0;
        console.log(`  - ${asset.type.padEnd(12)} | $${balance.toLocaleString().padStart(12)} | ${asset.owner || 'person1'} | Added: ${new Date(asset.createdAt).toLocaleDateString()}`);
      });

      console.log(`\nIncome Sources (${userDetails.incomeSources.length}):`);
      if (userDetails.incomeSources.length === 0) {
        console.log(`  ❌ NO INCOME SOURCES - User might be stuck here`);
      } else {
        userDetails.incomeSources.forEach(income => {
          console.log(`  - ${income.type.padEnd(12)} | $${income.amount.toLocaleString().padStart(8)} ${income.frequency || 'annual'} | Start: ${income.startAge || 'N/A'} | ${income.owner || 'person1'}`);
        });
      }

      console.log(`\nExpenses (${userDetails.expenses.length}):`);
      if (userDetails.expenses.length === 0) {
        console.log(`  ❌ NO EXPENSES - User might not know their spending`);
      } else {
        userDetails.expenses.forEach(expense => {
          console.log(`  - ${expense.description?.padEnd(20) || 'Unnamed'.padEnd(20)} | $${expense.amount.toLocaleString().padStart(8)} ${expense.frequency} | ${expense.isEssential ? 'Essential' : 'Discretionary'}`);
        });
      }

      // Calculate what prefill would return
      const totalAssets = userDetails.assets.reduce((sum, a) => sum + (a.balance || a.currentValue || 0), 0);

      console.log(`\n🧪 WHAT PREFILL API WOULD RETURN:`);
      console.log(`  Total Assets: $${totalAssets.toLocaleString()}`);
      console.log(`  Has Assets: ${userDetails.assets.length > 0 ? 'true' : 'false'}`);
      console.log(`  Has Income: ${userDetails.incomeSources.length > 0 ? 'true' : 'false'}`);
      console.log(`  Has Expenses: ${userDetails.expenses.length > 0 ? 'true' : 'false'}`);

      // Diagnosis
      console.log(`\n💡 DIAGNOSIS:`);
      if (userDetails.assets.length === 0) {
        console.log(`  ❌ CRITICAL: Has NO assets - won't get meaningful simulation`);
      } else if (userDetails.incomeSources.length === 0) {
        console.log(`  ⚠️  WARNING: Has assets but NO income sources (CPP/OAS) - will use defaults`);
        console.log(`     → Might have been confused by the income setup`);
      } else if (userDetails.expenses.length === 0) {
        console.log(`  ⚠️  WARNING: Has assets and income but NO expenses - will use defaults`);
        console.log(`     → Might not understand spending needs`);
      } else {
        console.log(`  🚨 CRITICAL: Has ALL data (assets, income, expenses) but NEVER simulated!`);
        console.log(`     → This suggests a USER EXPERIENCE or TECHNICAL ISSUE preventing simulation`);
        console.log(`     → Possible causes:`);
        console.log(`       1. Simulation button didn't work`);
        console.log(`       2. Got an error when trying to simulate`);
        console.log(`       3. Results were confusing/wrong so they gave up`);
        console.log(`       4. UI/UX made it unclear how to run simulation`);
      }
    }
  }

  await prisma.$disconnect();
}

testDormantUsers().catch(console.error);
