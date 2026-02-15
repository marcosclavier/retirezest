#!/usr/bin/env tsx
/**
 * RetireZest User Journey Analysis
 *
 * Analyzes user behavior patterns to identify:
 * - Onboarding flow completion rates
 * - Feature adoption sequences
 * - Time to first action metrics
 * - Drop-off points in user journey
 * - Common user paths
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserJourneyData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
  hasSeenWelcome: boolean;
  userPath: string | null;
  onboardingCompleted: boolean;
  onboardingStep: number | null;
  completedGuideAt: Date | null;
  emailVerified: boolean;
  verificationEmailSentAt: Date | null;
  cppCalculatorUsedAt: Date | null;
  oasCalculatorUsedAt: Date | null;
  incomeCount: number;
  assetCount: number;
  expenseCount: number;
  debtCount: number;
  scenarioCount: number;
  firstIncomeAt: Date | null;
  firstAssetAt: Date | null;
  firstExpenseAt: Date | null;
  firstDebtAt: Date | null;
}

async function getUserJourneyData(): Promise<UserJourneyData[]> {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null, // Exclude deleted accounts
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
      hasSeenWelcome: true,
      userPath: true,
      onboardingCompleted: true,
      onboardingStep: true,
      completedGuideAt: true,
      emailVerified: true,
      verificationEmailSentAt: true,
      cppCalculatorUsedAt: true,
      oasCalculatorUsedAt: true,
      incomeSources: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { createdAt: true },
      },
      assets: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { createdAt: true },
      },
      expenses: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { createdAt: true },
      },
      debts: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { createdAt: true },
      },
      simulationRuns: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { createdAt: true, healthScore: true, healthRating: true },
      },
      _count: {
        select: {
          incomeSources: true,
          assets: true,
          expenses: true,
          debts: true,
          scenarios: true,
          simulationRuns: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return users.map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    hasSeenWelcome: user.hasSeenWelcome,
    userPath: user.userPath,
    onboardingCompleted: user.onboardingCompleted,
    onboardingStep: user.onboardingStep,
    completedGuideAt: user.completedGuideAt,
    emailVerified: user.emailVerified,
    verificationEmailSentAt: user.verificationEmailSentAt,
    cppCalculatorUsedAt: user.cppCalculatorUsedAt,
    oasCalculatorUsedAt: user.oasCalculatorUsedAt,
    incomeCount: user._count.incomeSources,
    assetCount: user._count.assets,
    expenseCount: user._count.expenses,
    debtCount: user._count.debts,
    scenarioCount: user._count.scenarios,
    simulationCount: user._count.simulationRuns,
    firstIncomeAt: user.incomeSources[0]?.createdAt || null,
    firstAssetAt: user.assets[0]?.createdAt || null,
    firstExpenseAt: user.expenses[0]?.createdAt || null,
    firstDebtAt: user.debts[0]?.createdAt || null,
    firstSimulationAt: user.simulationRuns[0]?.createdAt || null,
    firstSimHealthScore: user.simulationRuns[0]?.healthScore || null,
    firstSimHealthRating: user.simulationRuns[0]?.healthRating || null,
  }));
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function calculatePercentage(count: number, total: number): string {
  return total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 RETIREZEST USER JOURNEY ANALYSIS');
  console.log('Generated:', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log('='.repeat(80) + '\n');

  const users = await getUserJourneyData();
  const totalUsers = users.length;

  if (totalUsers === 0) {
    console.log('No users found.');
    return;
  }

  // === ONBOARDING ANALYSIS ===
  console.log('📋 ONBOARDING FLOW ANALYSIS');
  console.log('-'.repeat(80));

  const seenWelcome = users.filter(u => u.hasSeenWelcome).length;
  const completedOnboarding = users.filter(u => u.onboardingCompleted).length;
  const guidedPath = users.filter(u => u.userPath === 'guided').length;
  const experiencedPath = users.filter(u => u.userPath === 'experienced').length;
  const noPathSelected = users.filter(u => !u.userPath).length;

  console.log(`Total Users:                  ${totalUsers}`);
  console.log(`Seen Welcome Screen:          ${seenWelcome} (${calculatePercentage(seenWelcome, totalUsers)})`);
  console.log(`Selected Path:`);
  console.log(`  - Guided:                   ${guidedPath} (${calculatePercentage(guidedPath, totalUsers)})`);
  console.log(`  - Experienced:              ${experiencedPath} (${calculatePercentage(experiencedPath, totalUsers)})`);
  console.log(`  - No path selected:         ${noPathSelected} (${calculatePercentage(noPathSelected, totalUsers)})`);
  console.log(`Completed Onboarding:         ${completedOnboarding} (${calculatePercentage(completedOnboarding, totalUsers)})`);

  // Onboarding step distribution
  const stepsDistribution: Record<number, number> = {};
  users.forEach(u => {
    if (u.onboardingStep !== null && u.onboardingStep > 0) {
      stepsDistribution[u.onboardingStep] = (stepsDistribution[u.onboardingStep] || 0) + 1;
    }
  });

  if (Object.keys(stepsDistribution).length > 0) {
    console.log(`\nOnboarding Step Distribution (for incomplete users):`);
    Object.entries(stepsDistribution)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([step, count]) => {
        const bar = '█'.repeat(Math.max(1, Math.round(count / totalUsers * 50)));
        console.log(`  Step ${step}: ${bar} ${count} users`);
      });
  }

  // === EMAIL VERIFICATION ===
  console.log('\n📧 EMAIL VERIFICATION ANALYSIS');
  console.log('-'.repeat(80));

  const verifiedEmails = users.filter(u => u.emailVerified).length;
  const sentVerification = users.filter(u => u.verificationEmailSentAt).length;
  const notSentVerification = totalUsers - sentVerification;

  console.log(`Verified Emails:              ${verifiedEmails} (${calculatePercentage(verifiedEmails, totalUsers)})`);
  console.log(`Verification Email Sent:      ${sentVerification} (${calculatePercentage(sentVerification, totalUsers)})`);
  console.log(`Verification Email Not Sent:  ${notSentVerification} (${calculatePercentage(notSentVerification, totalUsers)})`);

  if (sentVerification > 0) {
    const conversionRate = (verifiedEmails / sentVerification * 100).toFixed(1);
    console.log(`Verification Conversion Rate: ${conversionRate}% (verified / sent)`);
  }

  // === DATA ENTRY PATTERNS ===
  console.log('\n📊 DATA ENTRY PATTERNS');
  console.log('-'.repeat(80));

  const usersWithData = users.filter(u =>
    u.incomeCount > 0 || u.assetCount > 0 || u.expenseCount > 0 || u.debtCount > 0
  ).length;
  const usersWithNoData = totalUsers - usersWithData;

  console.log(`Users who entered data:       ${usersWithData} (${calculatePercentage(usersWithData, totalUsers)})`);
  console.log(`Users with no data:           ${usersWithNoData} (${calculatePercentage(usersWithNoData, totalUsers)})`);
  console.log('');
  console.log('Data Entry by Type:');
  console.log(`  Income sources:             ${users.filter(u => u.incomeCount > 0).length} users (${calculatePercentage(users.filter(u => u.incomeCount > 0).length, totalUsers)})`);
  console.log(`  Assets:                     ${users.filter(u => u.assetCount > 0).length} users (${calculatePercentage(users.filter(u => u.assetCount > 0).length, totalUsers)})`);
  console.log(`  Expenses:                   ${users.filter(u => u.expenseCount > 0).length} users (${calculatePercentage(users.filter(u => u.expenseCount > 0).length, totalUsers)})`);
  console.log(`  Debts:                      ${users.filter(u => u.debtCount > 0).length} users (${calculatePercentage(users.filter(u => u.debtCount > 0).length, totalUsers)})`);
  console.log(`  Scenarios:                  ${users.filter(u => u.scenarioCount > 0).length} users (${calculatePercentage(users.filter(u => u.scenarioCount > 0).length, totalUsers)})`);
  console.log(`  Simulations:                ${users.filter(u => u.simulationCount > 0).length} users (${calculatePercentage(users.filter(u => u.simulationCount > 0).length, totalUsers)})`);

  // === SIMULATION USAGE (PRIMARY FEATURE) ===
  console.log('\n🎯 SIMULATION USAGE (PRIMARY FEATURE)');
  console.log('-'.repeat(80));

  const usersWhoRanSim = users.filter(u => u.simulationCount > 0).length;
  const usersReady = users.filter(u => u.assetCount > 0 && (u.incomeCount > 0 || u.expenseCount > 0)).length;
  const usersReadyButDidntRun = users.filter(u =>
    u.assetCount > 0 &&
    (u.incomeCount > 0 || u.expenseCount > 0) &&
    u.simulationCount === 0
  ).length;

  console.log(`Users who ran simulations:    ${usersWhoRanSim} (${calculatePercentage(usersWhoRanSim, totalUsers)})`);
  console.log(`Users ready for simulation:   ${usersReady} (${calculatePercentage(usersReady, totalUsers)})`);
  console.log(`Ready but didn't run:         ${usersReadyButDidntRun} (${calculatePercentage(usersReadyButDidntRun, usersReady)} of ready)`);
  if (usersReady > 0) {
    const conversionRate = (usersWhoRanSim / usersReady * 100).toFixed(1);
    console.log(`Conversion rate (ready→run):  ${conversionRate}%`);
  }

  // Simulation health scores for those who ran
  const simsWithHealth = users.filter(u => u.firstSimHealthScore !== null);
  if (simsWithHealth.length > 0) {
    const avgHealth = simsWithHealth.reduce((sum, u) => sum + (u.firstSimHealthScore || 0), 0) / simsWithHealth.length;
    console.log(`\nAverage first simulation health score: ${avgHealth.toFixed(1)}/100`);

    const ratingCounts: Record<string, number> = {};
    simsWithHealth.forEach(u => {
      const rating = u.firstSimHealthRating || 'Unknown';
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    });

    console.log('Health rating distribution:');
    Object.entries(ratingCounts).forEach(([rating, count]) => {
      console.log(`  ${rating}: ${count} users (${calculatePercentage(count, simsWithHealth.length)})`);
    });
  }

  // === TIME TO FIRST ACTION ===
  console.log('\n⏱️  TIME TO FIRST ACTION');
  console.log('-'.repeat(80));

  const usersWithFirstIncome = users.filter(u => u.firstIncomeAt);
  const usersWithFirstAsset = users.filter(u => u.firstAssetAt);
  const usersWithFirstExpense = users.filter(u => u.firstExpenseAt);
  const usersWithFirstDebt = users.filter(u => u.firstDebtAt);

  function calculateAverageTime(usersWithAction: UserJourneyData[], getTimestamp: (u: UserJourneyData) => Date | null): string {
    if (usersWithAction.length === 0) return 'N/A';

    const times = usersWithAction
      .map(u => {
        const timestamp = getTimestamp(u);
        return timestamp ? timestamp.getTime() - u.createdAt.getTime() : null;
      })
      .filter((t): t is number => t !== null);

    if (times.length === 0) return 'N/A';

    const avgMs = times.reduce((sum, t) => sum + t, 0) / times.length;
    return formatDuration(avgMs);
  }

  const usersWithFirstSimulation = users.filter(u => u.firstSimulationAt);

  console.log('Average time from signup to first:');
  console.log(`  Income entry:               ${calculateAverageTime(usersWithFirstIncome, u => u.firstIncomeAt)}`);
  console.log(`  Asset entry:                ${calculateAverageTime(usersWithFirstAsset, u => u.firstAssetAt)}`);
  console.log(`  Expense entry:              ${calculateAverageTime(usersWithFirstExpense, u => u.firstExpenseAt)}`);
  console.log(`  Debt entry:                 ${calculateAverageTime(usersWithFirstDebt, u => u.firstDebtAt)}`);
  console.log(`  Simulation run:             ${calculateAverageTime(usersWithFirstSimulation, u => u.firstSimulationAt)}`);

  // First action overall
  const firstActions = users
    .map(u => {
      const actions = [
        { type: 'Income', time: u.firstIncomeAt },
        { type: 'Asset', time: u.firstAssetAt },
        { type: 'Expense', time: u.firstExpenseAt },
        { type: 'Debt', time: u.firstDebtAt },
      ].filter(a => a.time !== null) as { type: string; time: Date }[];

      if (actions.length === 0) return null;

      const earliest = actions.reduce((min, a) => a.time < min.time ? a : min);
      return {
        user: u,
        type: earliest.type,
        time: earliest.time,
        timeSinceSignup: earliest.time.getTime() - u.createdAt.getTime(),
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  if (firstActions.length > 0) {
    const avgFirstAction = firstActions.reduce((sum, a) => sum + a.timeSinceSignup, 0) / firstActions.length;
    console.log(`\nAverage time to ANY first action: ${formatDuration(avgFirstAction)}`);

    const firstActionTypes = firstActions.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nMost common first action:');
    Object.entries(firstActionTypes)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} users (${calculatePercentage(count, firstActions.length)})`);
      });
  }

  // === FEATURE ADOPTION ===
  console.log('\n🎯 FEATURE ADOPTION');
  console.log('-'.repeat(80));

  const cppUsers = users.filter(u => u.cppCalculatorUsedAt).length;
  const oasUsers = users.filter(u => u.oasCalculatorUsedAt).length;

  console.log(`CPP Calculator Used:          ${cppUsers} (${calculatePercentage(cppUsers, totalUsers)})`);
  console.log(`OAS Calculator Used:          ${oasUsers} (${calculatePercentage(oasUsers, totalUsers)})`);

  // Time to calculator usage
  const cppTimes = users
    .filter(u => u.cppCalculatorUsedAt)
    .map(u => u.cppCalculatorUsedAt!.getTime() - u.createdAt.getTime());

  const oasTimes = users
    .filter(u => u.oasCalculatorUsedAt)
    .map(u => u.oasCalculatorUsedAt!.getTime() - u.createdAt.getTime());

  if (cppTimes.length > 0) {
    const avgCppTime = cppTimes.reduce((sum, t) => sum + t, 0) / cppTimes.length;
    console.log(`Avg time to CPP calculator:   ${formatDuration(avgCppTime)}`);
  }

  if (oasTimes.length > 0) {
    const avgOasTime = oasTimes.reduce((sum, t) => sum + t, 0) / oasTimes.length;
    console.log(`Avg time to OAS calculator:   ${formatDuration(avgOasTime)}`);
  }

  // === USER ENGAGEMENT COHORTS ===
  console.log('\n👥 USER ENGAGEMENT COHORTS');
  console.log('-'.repeat(80));

  const powerUsers = users.filter(u =>
    (u.incomeCount + u.assetCount + u.expenseCount + u.debtCount) >= 15
  );
  const activeUsers = users.filter(u =>
    (u.incomeCount + u.assetCount + u.expenseCount + u.debtCount) >= 5 &&
    (u.incomeCount + u.assetCount + u.expenseCount + u.debtCount) < 15
  );
  const experimenters = users.filter(u =>
    (u.incomeCount + u.assetCount + u.expenseCount + u.debtCount) > 0 &&
    (u.incomeCount + u.assetCount + u.expenseCount + u.debtCount) < 5
  );
  const inactive = users.filter(u =>
    u.incomeCount === 0 && u.assetCount === 0 && u.expenseCount === 0 && u.debtCount === 0
  );

  console.log(`Power Users (15+ items):      ${powerUsers.length} (${calculatePercentage(powerUsers.length, totalUsers)})`);
  console.log(`Active Users (5-14 items):    ${activeUsers.length} (${calculatePercentage(activeUsers.length, totalUsers)})`);
  console.log(`Experimenters (1-4 items):    ${experimenters.length} (${calculatePercentage(experimenters.length, totalUsers)})`);
  console.log(`Inactive (0 items):           ${inactive.length} (${calculatePercentage(inactive.length, totalUsers)})`);

  // === DROP-OFF ANALYSIS ===
  console.log('\n⚠️  DROP-OFF POINTS ANALYSIS');
  console.log('-'.repeat(80));

  console.log('Users who:');
  console.log(`  Signed up but never logged in:        ${users.filter(u => !u.hasSeenWelcome).length}`);
  console.log(`  Saw welcome but no path selected:     ${users.filter(u => u.hasSeenWelcome && !u.userPath).length}`);
  console.log(`  Selected path but entered no data:    ${users.filter(u => u.userPath && usersWithNoData > 0 && u.incomeCount === 0 && u.assetCount === 0 && u.expenseCount === 0 && u.debtCount === 0).length}`);
  console.log(`  Entered data but didn't verify email: ${users.filter(u => usersWithData > 0 && (u.incomeCount > 0 || u.assetCount > 0 || u.expenseCount > 0 || u.debtCount > 0) && !u.emailVerified).length}`);
  console.log(`  Have data but no scenarios:           ${users.filter(u => (u.incomeCount > 0 || u.assetCount > 0) && u.scenarioCount === 0).length}`);
  console.log(`  Ready but never ran simulation:       ${usersReadyButDidntRun}`);

  // === RECENT USER EXAMPLES ===
  console.log('\n📝 RECENT USER JOURNEY EXAMPLES (Last 5 Users)');
  console.log('-'.repeat(80));

  const recentUsers = users.slice(-5).reverse();
  recentUsers.forEach((user, idx) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
    const totalItems = user.incomeCount + user.assetCount + user.expenseCount + user.debtCount;
    const daysSinceSignup = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`${idx + 1}. ${user.email} (${name}) - ${daysSinceSignup}d ago`);
    console.log(`   Path: ${user.userPath || 'Not selected'} | Onboarding: ${user.onboardingCompleted ? '✅' : user.onboardingStep ? `Step ${user.onboardingStep}` : '❌'} | Email: ${user.emailVerified ? '✅' : '❌'}`);
    console.log(`   Data: ${totalItems} items (I:${user.incomeCount} A:${user.assetCount} E:${user.expenseCount} D:${user.debtCount} S:${user.scenarioCount})`);
    console.log(`   Calculators: CPP:${user.cppCalculatorUsedAt ? '✅' : '❌'} OAS:${user.oasCalculatorUsedAt ? '✅' : '❌'}`);
    console.log(`   Simulations: ${user.simulationCount}${user.firstSimHealthScore ? ` (Health: ${user.firstSimHealthScore.toFixed(0)}/100)` : ''}`);
    console.log('');
  });

  // === KEY INSIGHTS ===
  console.log('💡 KEY INSIGHTS & RECOMMENDATIONS');
  console.log('-'.repeat(80));

  const insights: string[] = [];

  if (completedOnboarding < totalUsers * 0.2) {
    insights.push(`❌ CRITICAL: Only ${calculatePercentage(completedOnboarding, totalUsers)} complete onboarding. Investigate onboarding flow urgently.`);
  }

  if (verifiedEmails < totalUsers * 0.5) {
    insights.push(`⚠️  WARNING: Low email verification (${calculatePercentage(verifiedEmails, totalUsers)}). Review verification UX and reminder emails.`);
  }

  if (users.filter(u => u.scenarioCount > 0).length === 0) {
    insights.push(`🚨 CRITICAL: Zero scenario usage. This core feature needs immediate attention.`);
  }

  if (usersWhoRanSim === 0) {
    insights.push(`🚨 CRITICAL: Zero simulation usage despite ${usersReady} users being ready. Main feature is not being used!`);
  } else if (usersReady > 0) {
    const simConversionRate = (usersWhoRanSim / usersReady * 100);
    if (simConversionRate < 25) {
      insights.push(`⚠️  WARNING: Low simulation adoption (${simConversionRate.toFixed(1)}% of ready users). Improve discoverability.`);
    } else if (simConversionRate >= 50) {
      insights.push(`✅ POSITIVE: Good simulation adoption (${simConversionRate.toFixed(1)}% of ready users running simulations).`);
    }
  }

  if (inactive.length > totalUsers * 0.3) {
    insights.push(`⚠️  WARNING: ${calculatePercentage(inactive.length, totalUsers)} of users never enter data. Improve first-time user experience.`);
  }

  if (powerUsers.length > activeUsers.length) {
    insights.push(`✅ POSITIVE: More power users than casual users suggests strong product-market fit for engaged users.`);
  }

  const retentionRate = ((totalUsers - inactive.length) / totalUsers);
  if (retentionRate > 0.6) {
    insights.push(`✅ POSITIVE: ${(retentionRate * 100).toFixed(1)}% of users enter data, showing good activation.`);
  }

  if (insights.length === 0) {
    insights.push('No major issues detected. Monitor trends over time.');
  }

  insights.forEach(insight => console.log(insight));

  console.log('\n' + '='.repeat(80) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
