import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getTodayAnalytics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('📊 RetireZest User Activity Analytics for:', today.toDateString());
  console.log('='.repeat(80));

  // New users today
  const newUsers = await prisma.user.count({
    where: {
      createdAt: { gte: today, lt: tomorrow },
      deletedAt: null
    }
  });

  // Simulation runs today
  const simulationsToday = await prisma.simulationRun.count({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    }
  });

  // Quick-start simulations today
  const quickStartToday = await prisma.simulationRun.count({
    where: {
      createdAt: { gte: today, lt: tomorrow },
      isQuickStart: true
    }
  });

  // Simulations by strategy today
  const strategyBreakdown = await prisma.simulationRun.groupBy({
    by: ['strategy'],
    where: {
      createdAt: { gte: today, lt: tomorrow }
    },
    _count: true
  });

  // Average health score today
  const healthScoreStats = await prisma.simulationRun.aggregate({
    where: {
      createdAt: { gte: today, lt: tomorrow },
      healthScore: { not: null }
    },
    _avg: { healthScore: true },
    _min: { healthScore: true },
    _max: { healthScore: true }
  });

  // Assets created today
  const assetsCreated = await prisma.asset.count({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    }
  });

  // Income sources created today
  const incomeCreated = await prisma.income.count({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    }
  });

  // Expenses created today
  const expensesCreated = await prisma.expense.count({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    }
  });

  // Onboarding completions today
  const onboardingCompleted = await prisma.user.count({
    where: {
      completedGuideAt: { gte: today, lt: tomorrow },
      deletedAt: null
    }
  });

  // Total active users (not deleted)
  const totalActiveUsers = await prisma.user.count({
    where: {
      deletedAt: null
    }
  });

  // Users who ran simulations today
  const uniqueSimulationUsers = await prisma.simulationRun.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    },
    select: { userId: true },
    distinct: ['userId']
  });

  console.log('\n👥 USER ACTIVITY');
  console.log('-'.repeat(80));
  console.log(`New Users Today: ${newUsers}`);
  console.log(`Total Active Users: ${totalActiveUsers}`);
  console.log(`Users Who Ran Simulations Today: ${uniqueSimulationUsers.length}`);
  console.log(`Onboarding Completions Today: ${onboardingCompleted}`);

  console.log('\n🎯 SIMULATION ACTIVITY');
  console.log('-'.repeat(80));
  console.log(`Total Simulations Run Today: ${simulationsToday}`);
  console.log(`Quick-Start Simulations: ${quickStartToday}`);
  console.log(`Regular Simulations: ${simulationsToday - quickStartToday}`);

  if (strategyBreakdown.length > 0) {
    console.log('\nStrategy Breakdown:');
    strategyBreakdown.forEach(s => {
      console.log(`  - ${s.strategy}: ${s._count} runs`);
    });
  }

  if (healthScoreStats._avg.healthScore !== null) {
    console.log('\n📈 HEALTH SCORE STATISTICS');
    console.log('-'.repeat(80));
    console.log(`Average Health Score: ${healthScoreStats._avg.healthScore?.toFixed(1)}`);
    console.log(`Lowest Score: ${healthScoreStats._min.healthScore}`);
    console.log(`Highest Score: ${healthScoreStats._max.healthScore}`);
  }

  console.log('\n💰 PROFILE DATA ACTIVITY');
  console.log('-'.repeat(80));
  console.log(`Assets Created Today: ${assetsCreated}`);
  console.log(`Income Sources Created: ${incomeCreated}`);
  console.log(`Expenses Created: ${expensesCreated}`);

  await prisma.$disconnect();
}

getTodayAnalytics().catch(console.error);
