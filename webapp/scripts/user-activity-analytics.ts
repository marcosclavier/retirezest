#!/usr/bin/env npx tsx
/**
 * User Activity Analytics for RetireZest
 * Comprehensive report on user engagement and activity
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function getUserActivityAnalytics() {
  try {
    console.log('\n============================================================');
    console.log('RETIREZEST USER ACTIVITY ANALYTICS');
    console.log('============================================================\n');

    // 1. Total Users
    const totalUsers = await prisma.user.count();
    console.log(`📊 TOTAL USERS: ${totalUsers}\n`);

    // 2. Email Verification Status
    const verifiedUsers = await prisma.user.count({
      where: { emailVerified: true }
    });
    const unverifiedUsers = totalUsers - verifiedUsers;
    console.log('📧 EMAIL VERIFICATION:');
    console.log(`   Verified: ${verifiedUsers} (${((verifiedUsers/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   Unverified: ${unverifiedUsers} (${((unverifiedUsers/totalUsers)*100).toFixed(1)}%)\n`);

    // 3. Onboarding Status
    const onboardingCompleted = await prisma.user.count({
      where: { onboardingCompleted: true }
    });
    const onboardingInProgress = totalUsers - onboardingCompleted;
    console.log('🚀 ONBOARDING STATUS:');
    console.log(`   Completed: ${onboardingCompleted} (${((onboardingCompleted/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   In Progress: ${onboardingInProgress} (${((onboardingInProgress/totalUsers)*100).toFixed(1)}%)\n`);

    // 4. Welcome Guide Completion
    const completedGuide = await prisma.user.count({
      where: { completedGuideAt: { not: null } }
    });
    console.log('📖 WELCOME GUIDE:');
    console.log(`   Completed: ${completedGuide} (${((completedGuide/totalUsers)*100).toFixed(1)}%)\n`);

    // 5. Data Entry Activity
    const usersWithAssets = await prisma.user.count({
      where: { assets: { some: {} } }
    });
    const usersWithIncome = await prisma.user.count({
      where: { incomeSources: { some: {} } }
    });
    const usersWithExpenses = await prisma.user.count({
      where: { expenses: { some: {} } }
    });
    const usersWithDebts = await prisma.user.count({
      where: { debts: { some: {} } }
    });

    console.log('💼 DATA ENTRY ACTIVITY:');
    console.log(`   Users with Assets: ${usersWithAssets} (${((usersWithAssets/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   Users with Income: ${usersWithIncome} (${((usersWithIncome/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   Users with Expenses: ${usersWithExpenses} (${((usersWithExpenses/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   Users with Debts: ${usersWithDebts} (${((usersWithDebts/totalUsers)*100).toFixed(1)}%)\n`);

    // 6. Scenario Activity
    const usersWithScenarios = await prisma.user.count({
      where: { scenarios: { some: {} } }
    });
    const totalScenarios = await prisma.scenario.count();
    console.log('📋 SCENARIOS:');
    console.log(`   Users with Scenarios: ${usersWithScenarios} (${((usersWithScenarios/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   Total Scenarios: ${totalScenarios}\n`);

    // 7. Simulation Activity
    const usersWithSimulations = await prisma.user.count({
      where: { simulationRuns: { some: {} } }
    });
    const totalSimulations = await prisma.simulationRun.count();
    console.log('🔮 SIMULATIONS:');
    console.log(`   Users who ran simulations: ${usersWithSimulations} (${((usersWithSimulations/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   Total Simulation Runs: ${totalSimulations}\n`);

    // 8. Calculator Usage
    const usedCPPCalc = await prisma.user.count({
      where: { cppCalculatorUsedAt: { not: null } }
    });
    const usedOASCalc = await prisma.user.count({
      where: { oasCalculatorUsedAt: { not: null } }
    });
    console.log('🧮 CALCULATOR USAGE:');
    console.log(`   CPP Calculator: ${usedCPPCalc} (${((usedCPPCalc/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   OAS Calculator: ${usedOASCalc} (${((usedOASCalc/totalUsers)*100).toFixed(1)}%)\n`);

    // 9. User Signup Trends (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLast7Days = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });

    console.log('📈 SIGNUP TRENDS:');
    console.log(`   Last 7 days: ${newUsersLast7Days} users`);
    console.log(`   Last 30 days: ${newUsersLast30Days} users\n`);

    // 10. Asset Details
    const totalAssets = await prisma.asset.count();
    const assetsByType = await prisma.asset.groupBy({
      by: ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    });

    console.log('💰 ASSET BREAKDOWN:');
    console.log(`   Total Assets: ${totalAssets}`);
    assetsByType.forEach(asset => {
      console.log(`   ${asset.type}: ${asset._count.type}`);
    });
    console.log('');

    // 11. Income Source Details
    try {
      const totalIncome = await prisma.incomeSource.count();
      const incomeByType = await prisma.incomeSource.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } }
      });

      console.log('💵 INCOME SOURCE BREAKDOWN:');
      console.log(`   Total Income Sources: ${totalIncome}`);
      incomeByType.forEach(income => {
        console.log(`   ${income.type}: ${income._count.type}`);
      });
      console.log('');
    } catch (err) {
      console.log('💵 INCOME SOURCE BREAKDOWN:');
      console.log('   Error fetching income data\n');
    }

    // 12. Engagement Score (users with at least some data)
    const engagedUsers = await prisma.user.count({
      where: {
        OR: [
          { assets: { some: {} } },
          { incomeSources: { some: {} } },
          { scenarios: { some: {} } },
          { simulationRuns: { some: {} } }
        ]
      }
    });

    console.log('🎯 USER ENGAGEMENT:');
    console.log(`   Engaged Users (with data): ${engagedUsers} (${((engagedUsers/totalUsers)*100).toFixed(1)}%)`);
    console.log(`   Inactive Users: ${totalUsers - engagedUsers} (${(((totalUsers - engagedUsers)/totalUsers)*100).toFixed(1)}%)\n`);

    // 13. Most Active Users (by data points)
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            assets: true,
            incomeSources: true,
            expenses: true,
            debts: true,
            scenarios: true,
            simulationRuns: true,
          }
        }
      }
    });

    // Sort by total data points in JavaScript
    const mostActiveUsers = allUsers
      .map(user => ({
        ...user,
        totalDataPoints: user._count.assets + user._count.incomeSources +
                        user._count.expenses + user._count.debts +
                        user._count.scenarios + user._count.simulationRuns
      }))
      .sort((a, b) => b.totalDataPoints - a.totalDataPoints)
      .slice(0, 10);

    console.log('🏆 TOP 10 MOST ACTIVE USERS:');
    mostActiveUsers.forEach((user, index) => {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
      console.log(`   ${index + 1}. ${fullName} (${user.email})`);
      console.log(`      Total data points: ${user.totalDataPoints} (${user._count.assets} assets, ${user._count.incomeSources} income, ${user._count.expenses} expenses, ${user._count.debts} debts, ${user._count.scenarios} scenarios, ${user._count.simulationRuns} simulations)`);
    });

    console.log('\n============================================================\n');

  } catch (error) {
    console.error('Error querying database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

getUserActivityAnalytics();
