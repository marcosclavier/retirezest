import { prisma } from '../lib/prisma';

async function getUserActivityReport() {
  try {
    console.log('📊 RetireZest User Activity Report');
    console.log('=' .repeat(60));
    console.log('');

    // Total users
    const totalUsers = await prisma.user.count();
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log('');

    // Users who have added data (active users)
    const usersWithIncome = await prisma.user.count({
      where: {
        incomeSources: {
          some: {},
        },
      },
    });

    const usersWithAssets = await prisma.user.count({
      where: {
        assets: {
          some: {},
        },
      },
    });

    const usersWithExpenses = await prisma.user.count({
      where: {
        expenses: {
          some: {},
        },
      },
    });

    const usersWithDebts = await prisma.user.count({
      where: {
        debts: {
          some: {},
        },
      },
    });

    const usersWithScenarios = await prisma.user.count({
      where: {
        scenarios: {
          some: {},
        },
      },
    });

    console.log('📈 Active Users (with data):');
    console.log(`  • Users with income sources: ${usersWithIncome} (${((usersWithIncome/totalUsers)*100).toFixed(1)}%)`);
    console.log(`  • Users with assets: ${usersWithAssets} (${((usersWithAssets/totalUsers)*100).toFixed(1)}%)`);
    console.log(`  • Users with expenses: ${usersWithExpenses} (${((usersWithExpenses/totalUsers)*100).toFixed(1)}%)`);
    console.log(`  • Users with debts: ${usersWithDebts} (${((usersWithDebts/totalUsers)*100).toFixed(1)}%)`);
    console.log(`  • Users with scenarios: ${usersWithScenarios} (${((usersWithScenarios/totalUsers)*100).toFixed(1)}%)`);
    console.log('');

    // Get users with their data counts
    const activeUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        _count: {
          select: {
            incomeSources: true,
            assets: true,
            expenses: true,
            debts: true,
            scenarios: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter truly active users (those with at least some data)
    const activeUsersWithData = activeUsers.filter(
      user => user._count.incomeSources > 0 ||
              user._count.assets > 0 ||
              user._count.expenses > 0 ||
              user._count.debts > 0 ||
              user._count.scenarios > 0
    );

    console.log(`🎯 Truly Active Users: ${activeUsersWithData.length} out of ${totalUsers} (${((activeUsersWithData.length/totalUsers)*100).toFixed(1)}%)`);
    console.log('');

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    console.log(`📅 Recent Activity (Last 7 days):`);
    console.log(`  • New signups: ${recentUsers}`);
    console.log('');

    // Show most active users
    console.log('🏆 Most Active Users (Top 10):');
    console.log('-'.repeat(60));

    const sortedByActivity = activeUsersWithData
      .map(user => ({
        ...user,
        totalItems: user._count.incomeSources + user._count.assets +
                   user._count.expenses + user._count.debts + user._count.scenarios,
      }))
      .sort((a, b) => b.totalItems - a.totalItems)
      .slice(0, 10);

    sortedByActivity.forEach((user, index) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
      const daysAgo = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`${index + 1}. ${user.email} (${name})`);
      console.log(`   Registered: ${daysAgo} days ago`);
      console.log(`   Income: ${user._count.incomeSources} | Assets: ${user._count.assets} | Expenses: ${user._count.expenses} | Debts: ${user._count.debts} | Scenarios: ${user._count.scenarios}`);
      console.log(`   Total items: ${user.totalItems}`);
      console.log('');
    });

    // Onboarding completion
    const completedOnboarding = await prisma.user.count({
      where: {
        onboardingCompleted: true,
      },
    });

    const usedCppCalculator = await prisma.user.count({
      where: {
        cppCalculatorUsedAt: {
          not: null,
        },
      },
    });

    const usedOasCalculator = await prisma.user.count({
      where: {
        oasCalculatorUsedAt: {
          not: null,
        },
      },
    });

    console.log('🎓 User Journey:');
    console.log(`  • Completed onboarding: ${completedOnboarding} (${((completedOnboarding/totalUsers)*100).toFixed(1)}%)`);
    console.log(`  • Used CPP calculator: ${usedCppCalculator} (${((usedCppCalculator/totalUsers)*100).toFixed(1)}%)`);
    console.log(`  • Used OAS calculator: ${usedOasCalculator} (${((usedOasCalculator/totalUsers)*100).toFixed(1)}%)`);
    console.log('');

    // Email verification stats
    const verifiedEmails = await prisma.user.count({
      where: {
        emailVerified: true,
      },
    });

    console.log('📧 Email Verification:');
    console.log(`  • Verified emails: ${verifiedEmails} (${((verifiedEmails/totalUsers)*100).toFixed(1)}%)`);
    console.log(`  • Unverified emails: ${totalUsers - verifiedEmails} (${(((totalUsers - verifiedEmails)/totalUsers)*100).toFixed(1)}%)`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

getUserActivityReport();
