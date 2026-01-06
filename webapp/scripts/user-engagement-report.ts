import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserEngagement {
  id: string;
  email: string;
  name: string;
  registeredAt: Date;
  emailVerified: boolean;

  // Profile completeness
  hasPersonalInfo: boolean;
  hasPartnerInfo: boolean;
  hasAssets: boolean;
  hasIncome: boolean;
  hasExpenses: boolean;
  hasRetirementGoals: boolean;
  profileCompleteness: number; // 0-100%

  // Onboarding
  onboardingCompleted: boolean;
  onboardingCompletedAt: Date | null;

  // Activity
  totalSimulations: number;
  lastSimulationAt: Date | null;
  savedSimulations: number;

  // Data quality
  hasMinimalDataForSimulation: boolean;
  readyToSimulate: boolean;
}

async function generateUserEngagementReport() {
  console.log('🔍 Analyzing user engagement and data completeness...\n');

  // Get all users with their related data
  const users = await prisma.user.findMany({
    include: {
      simulationRuns: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      incomeSources: true,
      assets: true,
      expenses: true,
      _count: {
        select: {
          simulationRuns: true,
          incomeSources: true,
          assets: true,
          expenses: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const engagementData: UserEngagement[] = [];

  for (const user of users) {
    // Calculate profile completeness
    let completenessScore = 0;

    // Personal Info (weight: 20%)
    const personalInfoFields = [
      user.firstName,
      user.lastName,
      user.dateOfBirth,
      user.province,
    ];
    const personalInfoComplete = personalInfoFields.filter(Boolean).length;
    completenessScore += (personalInfoComplete / personalInfoFields.length) * 20;

    // Partner Info (weight: 10% - optional)
    let hasPartnerInfo = false;
    if (user.includePartner) {
      const partnerFields = [
        user.partnerFirstName,
        user.partnerLastName,
        user.partnerDateOfBirth,
      ];
      const partnerComplete = partnerFields.filter(Boolean).length;
      completenessScore += (partnerComplete / partnerFields.length) * 10;
      hasPartnerInfo = partnerComplete > 0;
    } else {
      completenessScore += 10; // No partner needed
    }

    // Assets (weight: 25%)
    const hasAssets = user._count.assets > 0;
    completenessScore += hasAssets ? 25 : 0;

    // Income (weight: 20%)
    const hasIncome = user._count.incomeSources > 0;
    completenessScore += hasIncome ? 20 : 0;

    // Expenses (weight: 15%)
    const hasExpenses = user._count.expenses > 0;
    completenessScore += hasExpenses ? 15 : 0;

    // Retirement Goals (weight: 10%)
    const hasRetirementGoals = user.targetRetirementAge || user.lifeExpectancy;
    completenessScore += hasRetirementGoals ? 10 : 0;

    // Check if user has minimal data to run a simulation
    const hasMinimalDataForSimulation = Boolean(
      user.dateOfBirth &&
      user.province &&
      (hasAssets || hasIncome) &&
      user.lifeExpectancy
    );

    // User is ready to simulate if they have minimal data OR have run simulations before
    const readyToSimulate = hasMinimalDataForSimulation || user._count.simulationRuns > 0;

    engagementData.push({
      id: user.id,
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name',
      registeredAt: user.createdAt,
      emailVerified: user.emailVerified,
      hasPersonalInfo: personalInfoComplete >= 3,
      hasPartnerInfo,
      hasAssets: Boolean(hasAssets),
      hasIncome: Boolean(hasIncome),
      hasExpenses: Boolean(hasExpenses),
      hasRetirementGoals: Boolean(hasRetirementGoals),
      profileCompleteness: Math.round(completenessScore),
      onboardingCompleted: Boolean(user.onboardingCompleted),
      onboardingCompletedAt: user.completedGuideAt || null,
      totalSimulations: user._count.simulationRuns,
      lastSimulationAt: user.simulationRuns[0]?.createdAt || null,
      savedSimulations: user._count.simulationRuns,
      hasMinimalDataForSimulation,
      readyToSimulate,
    });
  }

  // Generate report
  console.log('📊 USER ENGAGEMENT REPORT');
  console.log('=' .repeat(120));
  console.log();

  // Summary statistics
  const totalUsers = engagementData.length;
  const verifiedUsers = engagementData.filter(u => u.emailVerified).length;
  const onboardingCompleted = engagementData.filter(u => u.onboardingCompleted).length;
  const activeSimulators = engagementData.filter(u => u.totalSimulations > 0).length;
  const readyToSimulate = engagementData.filter(u => u.readyToSimulate).length;
  const avgCompleteness = Math.round(
    engagementData.reduce((sum, u) => sum + u.profileCompleteness, 0) / totalUsers
  );

  console.log('SUMMARY STATISTICS');
  console.log('-'.repeat(120));
  console.log(`Total Users:              ${totalUsers}`);
  console.log(`Email Verified:           ${verifiedUsers} (${Math.round(verifiedUsers/totalUsers*100)}%)`);
  console.log(`Onboarding Completed:     ${onboardingCompleted} (${Math.round(onboardingCompleted/totalUsers*100)}%)`);
  console.log(`Ready to Simulate:        ${readyToSimulate} (${Math.round(readyToSimulate/totalUsers*100)}%)`);
  console.log(`Active Simulators:        ${activeSimulators} (${Math.round(activeSimulators/totalUsers*100)}%)`);
  console.log(`Avg Profile Completeness: ${avgCompleteness}%`);
  console.log();

  // Data completeness breakdown
  console.log('DATA COMPLETENESS BREAKDOWN');
  console.log('-'.repeat(120));
  const withPersonalInfo = engagementData.filter(u => u.hasPersonalInfo).length;
  const withAssets = engagementData.filter(u => u.hasAssets).length;
  const withIncome = engagementData.filter(u => u.hasIncome).length;
  const withExpenses = engagementData.filter(u => u.hasExpenses).length;
  const withGoals = engagementData.filter(u => u.hasRetirementGoals).length;

  console.log(`Personal Info:       ${withPersonalInfo} (${Math.round(withPersonalInfo/totalUsers*100)}%)`);
  console.log(`Assets:              ${withAssets} (${Math.round(withAssets/totalUsers*100)}%)`);
  console.log(`Income:              ${withIncome} (${Math.round(withIncome/totalUsers*100)}%)`);
  console.log(`Expenses:            ${withExpenses} (${Math.round(withExpenses/totalUsers*100)}%)`);
  console.log(`Retirement Goals:    ${withGoals} (${Math.round(withGoals/totalUsers*100)}%)`);
  console.log();

  // Simulation activity breakdown
  console.log('SIMULATION ACTIVITY');
  console.log('-'.repeat(120));
  const noSims = engagementData.filter(u => u.totalSimulations === 0).length;
  const oneSim = engagementData.filter(u => u.totalSimulations === 1).length;
  const twoToFive = engagementData.filter(u => u.totalSimulations >= 2 && u.totalSimulations <= 5).length;
  const sixPlus = engagementData.filter(u => u.totalSimulations >= 6).length;

  console.log(`0 simulations:       ${noSims} (${Math.round(noSims/totalUsers*100)}%)`);
  console.log(`1 simulation:        ${oneSim} (${Math.round(oneSim/totalUsers*100)}%)`);
  console.log(`2-5 simulations:     ${twoToFive} (${Math.round(twoToFive/totalUsers*100)}%)`);
  console.log(`6+ simulations:      ${sixPlus} (${Math.round(sixPlus/totalUsers*100)}%)`);
  console.log();

  // Detailed user list
  console.log('DETAILED USER LIST');
  console.log('-'.repeat(120));
  console.log(
    'Email'.padEnd(35) +
    'Name'.padEnd(25) +
    'Verified'.padEnd(10) +
    'Complete'.padEnd(10) +
    'Ready'.padEnd(8) +
    'Sims'.padEnd(6) +
    'Registered'
  );
  console.log('-'.repeat(120));

  for (const user of engagementData) {
    const verifiedIcon = user.emailVerified ? '✓' : '✗';
    const readyIcon = user.readyToSimulate ? '✓' : '✗';
    const daysAgo = Math.floor((Date.now() - user.registeredAt.getTime()) / (1000 * 60 * 60 * 24));

    console.log(
      user.email.padEnd(35).substring(0, 35) +
      user.name.padEnd(25).substring(0, 25) +
      `${verifiedIcon}`.padEnd(10) +
      `${user.profileCompleteness}%`.padEnd(10) +
      `${readyIcon}`.padEnd(8) +
      `${user.totalSimulations}`.padEnd(6) +
      `${daysAgo}d ago`
    );
  }
  console.log();

  // Export detailed data
  console.log('DETAILED USER DATA (JSON)');
  console.log('-'.repeat(120));

  const exportData = engagementData.map(u => ({
    email: u.email,
    name: u.name,
    registeredAt: u.registeredAt.toISOString(),
    emailVerified: u.emailVerified,
    onboardingCompleted: u.onboardingCompleted,
    profileCompleteness: u.profileCompleteness,
    dataBreakdown: {
      personalInfo: u.hasPersonalInfo,
      assets: u.hasAssets,
      income: u.hasIncome,
      expenses: u.hasExpenses,
      retirementGoals: u.hasRetirementGoals,
    },
    activity: {
      totalSimulations: u.totalSimulations,
      lastSimulationAt: u.lastSimulationAt?.toISOString() || null,
    },
    status: {
      hasMinimalData: u.hasMinimalDataForSimulation,
      readyToSimulate: u.readyToSimulate,
    },
  }));

  console.log(JSON.stringify(exportData, null, 2));
}

generateUserEngagementReport()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
