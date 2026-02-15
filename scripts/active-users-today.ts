import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getActiveUsersToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('👥 Active Users Today:', today.toDateString());
  console.log('='.repeat(80));

  // Get users who ran simulations today
  const simulationUsers = await prisma.simulationRun.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    },
    select: {
      userId: true,
      createdAt: true,
      strategy: true,
      healthScore: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          province: true,
          includePartner: true,
          onboardingCompleted: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Group by user
  const userActivity = new Map<string, {
    email: string;
    firstName: string | null;
    lastName: string | null;
    province: string | null;
    includePartner: boolean;
    onboardingCompleted: boolean;
    accountCreated: Date;
    simulationCount: number;
    strategies: string[];
    healthScores: (number | null)[];
    firstActivity: Date;
    lastActivity: Date;
  }>();

  simulationUsers.forEach(sim => {
    const existing = userActivity.get(sim.userId);
    if (existing) {
      existing.simulationCount++;
      existing.strategies.push(sim.strategy);
      existing.healthScores.push(sim.healthScore);
      if (sim.createdAt < existing.firstActivity) {
        existing.firstActivity = sim.createdAt;
      }
      if (sim.createdAt > existing.lastActivity) {
        existing.lastActivity = sim.createdAt;
      }
    } else {
      userActivity.set(sim.userId, {
        email: sim.user.email,
        firstName: sim.user.firstName,
        lastName: sim.user.lastName,
        province: sim.user.province,
        includePartner: sim.user.includePartner,
        onboardingCompleted: sim.user.onboardingCompleted,
        accountCreated: sim.user.createdAt,
        simulationCount: 1,
        strategies: [sim.strategy],
        healthScores: [sim.healthScore],
        firstActivity: sim.createdAt,
        lastActivity: sim.createdAt
      });
    }
  });

  // Get users who created assets/income/expenses today (but may not have run simulations)
  const assetUsers = await prisma.asset.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    },
    select: {
      userId: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    distinct: ['userId']
  });

  const incomeUsers = await prisma.income.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    },
    select: {
      userId: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    distinct: ['userId']
  });

  const expenseUsers = await prisma.expense.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    },
    select: {
      userId: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    distinct: ['userId']
  });

  console.log(`\n📊 SUMMARY`);
  console.log('-'.repeat(80));
  console.log(`Total Unique Users Active: ${userActivity.size}`);
  console.log(`Users Who Created Assets: ${assetUsers.length}`);
  console.log(`Users Who Created Income: ${incomeUsers.length}`);
  console.log(`Users Who Created Expenses: ${expenseUsers.length}`);

  console.log(`\n\n👤 DETAILED USER ACTIVITY`);
  console.log('='.repeat(80));

  let userNum = 1;
  for (const [userId, activity] of userActivity.entries()) {
    const name = activity.firstName && activity.lastName
      ? `${activity.firstName} ${activity.lastName}`
      : 'Not provided';

    const accountAge = Math.floor((today.getTime() - activity.accountCreated.getTime()) / (1000 * 60 * 60 * 24));
    const avgScore = activity.healthScores.filter(s => s !== null).length > 0
      ? (activity.healthScores.filter(s => s !== null).reduce((a, b) => a! + b!, 0)! / activity.healthScores.filter(s => s !== null).length).toFixed(1)
      : 'N/A';

    const uniqueStrategies = [...new Set(activity.strategies)];

    console.log(`\n${userNum}. ${activity.email}`);
    console.log('-'.repeat(80));
    console.log(`   Name: ${name}`);
    console.log(`   Province: ${activity.province || 'Not set'}`);
    console.log(`   Partner Planning: ${activity.includePartner ? 'Yes' : 'No'}`);
    console.log(`   Onboarding Completed: ${activity.onboardingCompleted ? 'Yes' : 'No'}`);
    console.log(`   Account Age: ${accountAge} days`);
    console.log(`   Simulations Today: ${activity.simulationCount}`);
    console.log(`   Strategies Tested: ${uniqueStrategies.join(', ')}`);
    console.log(`   Average Health Score: ${avgScore}`);
    console.log(`   First Activity Today: ${activity.firstActivity.toLocaleTimeString()}`);
    console.log(`   Last Activity Today: ${activity.lastActivity.toLocaleTimeString()}`);

    userNum++;
  }

  // Additional activity from users who didn't run simulations but updated profile
  const otherActiveUsers = [...assetUsers, ...incomeUsers, ...expenseUsers]
    .filter(u => !userActivity.has(u.userId))
    .reduce((acc, u) => {
      if (!acc.find(existing => existing.userId === u.userId)) {
        acc.push(u);
      }
      return acc;
    }, [] as typeof assetUsers);

  if (otherActiveUsers.length > 0) {
    console.log(`\n\n👤 USERS WHO UPDATED PROFILE (No Simulations)`);
    console.log('='.repeat(80));

    otherActiveUsers.forEach((u, idx) => {
      const name = u.user.firstName && u.user.lastName
        ? `${u.user.firstName} ${u.user.lastName}`
        : 'Not provided';
      console.log(`${idx + 1}. ${u.user.email} - ${name}`);
    });
  }

  await prisma.$disconnect();
}

getActiveUsersToday().catch(console.error);
