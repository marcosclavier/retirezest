import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function getDetailedAnalytics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  console.log('📊 RetireZest Detailed Analytics Report');
  console.log('Generated:', new Date().toLocaleString());
  console.log('='.repeat(80));

  // === TODAY'S ACTIVITY ===
  console.log('\n🔥 TODAY\'S ACTIVITY (Jan 5, 2026)');
  console.log('-'.repeat(80));

  const todaySimulations = await prisma.simulationRun.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    },
    select: {
      userId: true,
      strategy: true,
      healthScore: true,
      healthRating: true,
      createdAt: true,
      isQuickStart: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Total Simulations: ${todaySimulations.length}`);
  console.log(`Unique Users Active: ${new Set(todaySimulations.map(s => s.userId)).size}`);

  // Health score distribution today
  const excellent = todaySimulations.filter(s => s.healthScore && s.healthScore >= 80).length;
  const good = todaySimulations.filter(s => s.healthScore && s.healthScore >= 60 && s.healthScore < 80).length;
  const fair = todaySimulations.filter(s => s.healthScore && s.healthScore >= 40 && s.healthScore < 60).length;
  const poor = todaySimulations.filter(s => s.healthScore && s.healthScore < 40).length;

  console.log('\nHealth Score Distribution Today:');
  console.log(`  Excellent (80-100): ${excellent} simulations`);
  console.log(`  Good (60-79): ${good} simulations`);
  console.log(`  Fair (40-59): ${fair} simulations`);
  console.log(`  Poor (0-39): ${poor} simulations`);

  // === WEEKLY TRENDS ===
  console.log('\n📈 WEEKLY TRENDS (Last 7 Days)');
  console.log('-'.repeat(80));

  const weekSimulations = await prisma.simulationRun.count({
    where: { createdAt: { gte: lastWeek } }
  });

  const weekUsers = await prisma.simulationRun.findMany({
    where: { createdAt: { gte: lastWeek } },
    select: { userId: true },
    distinct: ['userId']
  });

  const weekNewUsers = await prisma.user.count({
    where: {
      createdAt: { gte: lastWeek },
      deletedAt: null
    }
  });

  console.log(`Simulations This Week: ${weekSimulations}`);
  console.log(`Active Users This Week: ${weekUsers.length}`);
  console.log(`New Users This Week: ${weekNewUsers}`);

  // === MONTHLY TRENDS ===
  console.log('\n📊 MONTHLY TRENDS (Last 30 Days)');
  console.log('-'.repeat(80));

  const monthSimulations = await prisma.simulationRun.count({
    where: { createdAt: { gte: lastMonth } }
  });

  const monthUsers = await prisma.simulationRun.findMany({
    where: { createdAt: { gte: lastMonth } },
    select: { userId: true },
    distinct: ['userId']
  });

  const monthNewUsers = await prisma.user.count({
    where: {
      createdAt: { gte: lastMonth },
      deletedAt: null
    }
  });

  console.log(`Simulations This Month: ${monthSimulations}`);
  console.log(`Active Users This Month: ${monthUsers.length}`);
  console.log(`New Users This Month: ${monthNewUsers}`);

  // === STRATEGY PREFERENCES (ALL TIME) ===
  console.log('\n🎯 STRATEGY PREFERENCES (All Time)');
  console.log('-'.repeat(80));

  const allStrategies = await prisma.simulationRun.groupBy({
    by: ['strategy'],
    _count: { strategy: true }
  });

  allStrategies.sort((a, b) => b._count.strategy - a._count.strategy);

  allStrategies.forEach(s => {
    console.log(`  ${s.strategy}: ${s._count.strategy} runs`);
  });

  // === USER ENGAGEMENT ===
  console.log('\n👥 USER ENGAGEMENT METRICS');
  console.log('-'.repeat(80));

  const totalUsers = await prisma.user.count({
    where: { deletedAt: null }
  });

  const usersWithAssets = await prisma.user.count({
    where: {
      deletedAt: null,
      assets: { some: {} }
    }
  });

  const usersWithIncome = await prisma.user.count({
    where: {
      deletedAt: null,
      incomeSources: { some: {} }
    }
  });

  const usersWithExpenses = await prisma.user.count({
    where: {
      deletedAt: null,
      expenses: { some: {} }
    }
  });

  const usersWithSimulations = await prisma.user.count({
    where: {
      deletedAt: null,
      simulationRuns: { some: {} }
    }
  });

  const onboardingCompleted = await prisma.user.count({
    where: {
      deletedAt: null,
      onboardingCompleted: true
    }
  });

  console.log(`Total Active Users: ${totalUsers}`);
  console.log(`Users with Assets: ${usersWithAssets} (${((usersWithAssets/totalUsers)*100).toFixed(1)}%)`);
  console.log(`Users with Income: ${usersWithIncome} (${((usersWithIncome/totalUsers)*100).toFixed(1)}%)`);
  console.log(`Users with Expenses: ${usersWithExpenses} (${((usersWithExpenses/totalUsers)*100).toFixed(1)}%)`);
  console.log(`Users Who Ran Simulations: ${usersWithSimulations} (${((usersWithSimulations/totalUsers)*100).toFixed(1)}%)`);
  console.log(`Completed Onboarding: ${onboardingCompleted} (${((onboardingCompleted/totalUsers)*100).toFixed(1)}%)`);

  // === PARTNER PLANNING ===
  console.log('\n💑 PARTNER PLANNING');
  console.log('-'.repeat(80));

  const withPartner = await prisma.user.count({
    where: {
      deletedAt: null,
      includePartner: true
    }
  });

  const partnerSimulations = await prisma.simulationRun.count({
    where: { includePartner: true }
  });

  console.log(`Users with Partner Planning: ${withPartner} (${((withPartner/totalUsers)*100).toFixed(1)}%)`);
  console.log(`Simulations with Partner: ${partnerSimulations}`);

  // === RECENT ACTIVITY ===
  console.log('\n⏱️  RECENT ACTIVITY (Last 10 Simulations)');
  console.log('-'.repeat(80));

  const recentSimulations = await prisma.simulationRun.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      strategy: true,
      healthScore: true,
      healthRating: true,
      user: {
        select: {
          email: true
        }
      }
    }
  });

  recentSimulations.forEach(sim => {
    const time = new Date(sim.createdAt).toLocaleTimeString();
    const email = sim.user.email.substring(0, 20) + '...';
    console.log(`  ${time} | ${email.padEnd(25)} | ${sim.strategy.padEnd(25)} | Score: ${sim.healthScore || 'N/A'} (${sim.healthRating || 'N/A'})`);
  });

  await prisma.$disconnect();
}

getDetailedAnalytics().catch(console.error);
