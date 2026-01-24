import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getLast3DaysActivity() {
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  console.log('📊 RetireZest User Activity - Last 3 Days');
  console.log('Period:', threeDaysAgo.toLocaleString(), 'to', now.toLocaleString());
  console.log('='.repeat(80));

  // Daily breakdown
  const days = [0, 1, 2].map(offset => {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    return { day, nextDay, label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) };
  }).reverse();

  console.log('\n📅 DAILY ACTIVITY BREAKDOWN');
  console.log('='.repeat(80));

  for (const { day, nextDay, label } of days) {
    console.log(`\n${label} (${day.toLocaleDateString()})`);
    console.log('-'.repeat(80));

    // Simulations
    const simulations = await prisma.simulationRun.count({
      where: { createdAt: { gte: day, lt: nextDay } }
    });

    // Unique users who ran simulations
    const simulationUsers = await prisma.simulationRun.findMany({
      where: { createdAt: { gte: day, lt: nextDay } },
      select: { userId: true },
      distinct: ['userId']
    });

    // Assets created
    const assets = await prisma.asset.count({
      where: { createdAt: { gte: day, lt: nextDay } }
    });

    // Income created
    const income = await prisma.income.count({
      where: { createdAt: { gte: day, lt: nextDay } }
    });

    // Expenses created
    const expenses = await prisma.expense.count({
      where: { createdAt: { gte: day, lt: nextDay } }
    });

    // New registrations
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: day, lt: nextDay },
        deletedAt: null
      }
    });

    // Onboarding completions
    const onboardingCompleted = await prisma.user.count({
      where: {
        completedGuideAt: { gte: day, lt: nextDay },
        deletedAt: null
      }
    });

    console.log(`  Simulations Run:        ${simulations}`);
    console.log(`  Unique Active Users:    ${simulationUsers.length}`);
    console.log(`  New Registrations:      ${newUsers}`);
    console.log(`  Assets Created:         ${assets}`);
    console.log(`  Income Sources Created: ${income}`);
    console.log(`  Expenses Created:       ${expenses}`);
    console.log(`  Onboarding Completed:   ${onboardingCompleted}`);

    // Get user details for this day
    if (simulationUsers.length > 0) {
      const userDetails = await prisma.user.findMany({
        where: {
          id: { in: simulationUsers.map(u => u.userId) }
        },
        select: {
          email: true,
          firstName: true,
          lastName: true,
          simulationRuns: {
            where: { createdAt: { gte: day, lt: nextDay } },
            select: {
              createdAt: true,
              strategy: true,
              healthScore: true
            }
          }
        }
      });

      console.log(`\n  Active Users:`);
      userDetails.forEach(user => {
        const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'N/A';
        const simCount = user.simulationRuns.length;
        console.log(`    • ${user.email} (${name}) - ${simCount} simulations`);
      });
    }
  }

  // Overall 3-day summary
  console.log('\n\n📊 3-DAY SUMMARY');
  console.log('='.repeat(80));

  const totalSimulations = await prisma.simulationRun.count({
    where: { createdAt: { gte: threeDaysAgo } }
  });

  const totalUniqueUsers = await prisma.simulationRun.findMany({
    where: { createdAt: { gte: threeDaysAgo } },
    select: { userId: true },
    distinct: ['userId']
  });

  const totalAssets = await prisma.asset.count({
    where: { createdAt: { gte: threeDaysAgo } }
  });

  const totalIncome = await prisma.income.count({
    where: { createdAt: { gte: threeDaysAgo } }
  });

  const totalExpenses = await prisma.expense.count({
    where: { createdAt: { gte: threeDaysAgo } }
  });

  const totalNewUsers = await prisma.user.count({
    where: {
      createdAt: { gte: threeDaysAgo },
      deletedAt: null
    }
  });

  const totalOnboardingCompleted = await prisma.user.count({
    where: {
      completedGuideAt: { gte: threeDaysAgo },
      deletedAt: null
    }
  });

  console.log(`Total Simulations:        ${totalSimulations}`);
  console.log(`Unique Active Users:      ${totalUniqueUsers.length}`);
  console.log(`New Registrations:        ${totalNewUsers}`);
  console.log(`Assets Created:           ${totalAssets}`);
  console.log(`Income Sources Created:   ${totalIncome}`);
  console.log(`Expenses Created:         ${totalExpenses}`);
  console.log(`Onboarding Completed:     ${totalOnboardingCompleted}`);

  // Detailed user activity for last 3 days
  console.log('\n\n👥 DETAILED USER ACTIVITY (Last 3 Days)');
  console.log('='.repeat(80));

  const activeUsers = await prisma.user.findMany({
    where: {
      id: { in: totalUniqueUsers.map(u => u.userId) }
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      simulationRuns: {
        where: { createdAt: { gte: threeDaysAgo } },
        select: {
          createdAt: true,
          strategy: true,
          healthScore: true,
          healthRating: true
        },
        orderBy: { createdAt: 'asc' }
      },
      assets: {
        where: { createdAt: { gte: threeDaysAgo } },
        select: { id: true }
      },
      incomeSources: {
        where: { createdAt: { gte: threeDaysAgo } },
        select: { id: true }
      },
      expenses: {
        where: { createdAt: { gte: threeDaysAgo } },
        select: { id: true }
      }
    }
  });

  activeUsers.forEach((user, idx) => {
    const name = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Not provided';
    const accountAge = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    const firstActivity = user.simulationRuns[0]?.createdAt;
    const lastActivity = user.simulationRuns[user.simulationRuns.length - 1]?.createdAt;

    const strategies = [...new Set(user.simulationRuns.map(s => s.strategy))];
    const avgScore = user.simulationRuns.filter(s => s.healthScore !== null).length > 0
      ? (user.simulationRuns.filter(s => s.healthScore !== null).reduce((sum, s) => sum + (s.healthScore || 0), 0) /
         user.simulationRuns.filter(s => s.healthScore !== null).length).toFixed(1)
      : 'N/A';

    console.log(`\n${idx + 1}. ${user.email} - ${name}`);
    console.log(`   Account Age: ${accountAge} days`);
    console.log(`   Simulations: ${user.simulationRuns.length}`);
    console.log(`   Strategies Tested: ${strategies.join(', ')}`);
    console.log(`   Avg Health Score: ${avgScore}`);
    console.log(`   Assets Created: ${user.assets.length}`);
    console.log(`   Income Created: ${user.incomeSources.length}`);
    console.log(`   Expenses Created: ${user.expenses.length}`);
    if (firstActivity && lastActivity) {
      console.log(`   First Activity: ${firstActivity.toLocaleString()}`);
      console.log(`   Last Activity: ${lastActivity.toLocaleString()}`);
    }

    // Show simulation timeline
    if (user.simulationRuns.length > 0 && user.simulationRuns.length <= 10) {
      console.log(`   Simulation Timeline:`);
      user.simulationRuns.forEach((sim, simIdx) => {
        const time = sim.createdAt.toLocaleTimeString();
        const date = sim.createdAt.toLocaleDateString();
        console.log(`     ${simIdx + 1}. ${date} ${time} | ${sim.strategy} | Score: ${sim.healthScore || 'N/A'} (${sim.healthRating || 'N/A'})`);
      });
    } else if (user.simulationRuns.length > 10) {
      console.log(`   Simulation Timeline: (showing first 5 and last 5)`);
      user.simulationRuns.slice(0, 5).forEach((sim, simIdx) => {
        const time = sim.createdAt.toLocaleTimeString();
        const date = sim.createdAt.toLocaleDateString();
        console.log(`     ${simIdx + 1}. ${date} ${time} | ${sim.strategy} | Score: ${sim.healthScore || 'N/A'} (${sim.healthRating || 'N/A'})`);
      });
      console.log(`     ... (${user.simulationRuns.length - 10} more simulations) ...`);
      user.simulationRuns.slice(-5).forEach((sim, simIdx) => {
        const time = sim.createdAt.toLocaleTimeString();
        const date = sim.createdAt.toLocaleDateString();
        const actualIdx = user.simulationRuns.length - 5 + simIdx + 1;
        console.log(`     ${actualIdx}. ${date} ${time} | ${sim.strategy} | Score: ${sim.healthScore || 'N/A'} (${sim.healthRating || 'N/A'})`);
      });
    }
  });

  await prisma.$disconnect();
}

getLast3DaysActivity().catch(console.error);
