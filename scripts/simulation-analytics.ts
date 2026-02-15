#!/usr/bin/env tsx
/**
 * RetireZest Simulation Analytics
 *
 * Tracks and analyzes simulation usage patterns:
 * - How many users run simulations
 * - Which strategies are most popular
 * - Average time to first simulation
 * - Health scores and success rates
 * - Simulation repeat patterns
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RETIREZEST SIMULATION ANALYTICS');
  console.log('Generated:', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  console.log('='.repeat(80) + '\n');

  const totalUsers = await prisma.user.count({ where: { deletedAt: null } });

  // === SIMULATION USAGE OVERVIEW ===
  console.log('🎯 SIMULATION USAGE OVERVIEW');
  console.log('-'.repeat(80));

  const totalSimulations = await prisma.simulationRun.count();
  const usersWhoRanSims = await prisma.user.count({
    where: {
      deletedAt: null,
      simulationRuns: {
        some: {}
      }
    }
  });

  const usersWhoNeverRan = totalUsers - usersWhoRanSims;

  console.log(`Total Users:                  ${totalUsers}`);
  console.log(`Users Who Ran Simulations:    ${usersWhoRanSims} (${((usersWhoRanSims/totalUsers)*100).toFixed(1)}%)`);
  console.log(`Users Who Never Ran:          ${usersWhoNeverRan} (${((usersWhoNeverRan/totalUsers)*100).toFixed(1)}%)`);
  console.log(`Total Simulations Run:        ${totalSimulations}`);
  if (usersWhoRanSims > 0) {
    console.log(`Avg Simulations per User:     ${(totalSimulations / usersWhoRanSims).toFixed(1)}`);
  }
  console.log('');

  // === TIME TO FIRST SIMULATION ===
  console.log('⏱️  TIME TO FIRST SIMULATION');
  console.log('-'.repeat(80));

  const usersWithFirstSim = await prisma.user.findMany({
    where: {
      deletedAt: null,
      simulationRuns: {
        some: {}
      }
    },
    include: {
      simulationRuns: {
        orderBy: { createdAt: 'asc' },
        take: 1
      }
    }
  });

  if (usersWithFirstSim.length > 0) {
    const timesToFirst = usersWithFirstSim
      .filter(u => u.simulationRuns[0])
      .map(u => u.simulationRuns[0].createdAt.getTime() - u.createdAt.getTime());

    const avgTimeToFirst = timesToFirst.reduce((sum, t) => sum + t, 0) / timesToFirst.length;
    const minTime = Math.min(...timesToFirst);
    const maxTime = Math.max(...timesToFirst);

    console.log(`Average time to first simulation: ${formatDuration(avgTimeToFirst)}`);
    console.log(`Fastest:                          ${formatDuration(minTime)}`);
    console.log(`Slowest:                          ${formatDuration(maxTime)}`);
  } else {
    console.log('No simulations run yet.');
  }
  console.log('');

  // === STRATEGY POPULARITY ===
  console.log('📈 STRATEGY POPULARITY');
  console.log('-'.repeat(80));

  const strategyStats = await prisma.simulationRun.groupBy({
    by: ['strategy'],
    _count: {
      strategy: true
    },
    orderBy: {
      _count: {
        strategy: 'desc'
      }
    }
  });

  if (strategyStats.length > 0) {
    strategyStats.forEach((stat, index) => {
      const percentage = ((stat._count.strategy / totalSimulations) * 100).toFixed(1);
      const bar = '█'.repeat(Math.max(1, Math.round(stat._count.strategy / totalSimulations * 50)));
      console.log(`${index + 1}. ${stat.strategy.padEnd(30)} ${bar} ${stat._count.strategy} (${percentage}%)`);
    });
  } else {
    console.log('No simulations run yet.');
  }
  console.log('');

  // === HEALTH SCORE DISTRIBUTION ===
  console.log('💚 HEALTH SCORE DISTRIBUTION');
  console.log('-'.repeat(80));

  const simulations = await prisma.simulationRun.findMany({
    where: {
      healthScore: {
        not: null
      }
    },
    select: {
      healthScore: true,
      healthRating: true,
      successRate: true
    }
  });

  if (simulations.length > 0) {
    const avgHealthScore = simulations.reduce((sum, s) => sum + (s.healthScore || 0), 0) / simulations.length;
    const avgSuccessRate = simulations.reduce((sum, s) => sum + (s.successRate || 0), 0) / simulations.length;

    const ratingCounts: Record<string, number> = {};
    simulations.forEach(s => {
      const rating = s.healthRating || 'Unknown';
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    });

    console.log(`Average Health Score:         ${avgHealthScore.toFixed(1)}/100`);
    console.log(`Average Success Rate:         ${avgSuccessRate.toFixed(1)}%`);
    console.log('');
    console.log('Rating Distribution:');
    Object.entries(ratingCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([rating, count]) => {
        const percentage = ((count / simulations.length) * 100).toFixed(1);
        const bar = '█'.repeat(Math.max(1, Math.round(count / simulations.length * 50)));
        console.log(`  ${rating.padEnd(15)} ${bar} ${count} (${percentage}%)`);
      });
  } else {
    console.log('No simulation data available.');
  }
  console.log('');

  // === FINANCIAL OUTCOMES ===
  console.log('💰 FINANCIAL OUTCOMES (AVERAGES)');
  console.log('-'.repeat(80));

  if (simulations.length > 0) {
    const sims = await prisma.simulationRun.findMany({
      select: {
        totalTaxPaid: true,
        avgTaxRate: true,
        finalEstate: true,
        totalBenefits: true,
        initialNetWorth: true
      }
    });

    const avgTaxPaid = sims.reduce((sum, s) => sum + (s.totalTaxPaid || 0), 0) / sims.length;
    const avgTaxRate = sims.reduce((sum, s) => sum + (s.avgTaxRate || 0), 0) / sims.length;
    const avgFinalEstate = sims.reduce((sum, s) => sum + (s.finalEstate || 0), 0) / sims.length;
    const avgBenefits = sims.reduce((sum, s) => sum + (s.totalBenefits || 0), 0) / sims.length;
    const avgInitialNW = sims.reduce((sum, s) => sum + (s.initialNetWorth || 0), 0) / sims.length;

    console.log(`Avg Initial Net Worth:        $${avgInitialNW.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    console.log(`Avg Total Tax Paid:           $${avgTaxPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    console.log(`Avg Effective Tax Rate:       ${avgTaxRate.toFixed(1)}%`);
    console.log(`Avg Final Estate (after-tax): $${avgFinalEstate.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    console.log(`Avg Gov't Benefits:           $${avgBenefits.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  } else {
    console.log('No simulation data available.');
  }
  console.log('');

  // === REPEAT USAGE PATTERNS ===
  console.log('🔁 REPEAT USAGE PATTERNS');
  console.log('-'.repeat(80));

  const userSimCounts = await prisma.user.findMany({
    where: {
      deletedAt: null,
      simulationRuns: {
        some: {}
      }
    },
    include: {
      _count: {
        select: {
          simulationRuns: true
        }
      }
    }
  });

  // Define variables outside the conditional block so they're available for insights
  let oneTimers = 0;
  let repeatUsers = 0;
  let powerUsers = 0;

  if (userSimCounts.length > 0) {
    oneTimers = userSimCounts.filter(u => u._count.simulationRuns === 1).length;
    repeatUsers = userSimCounts.filter(u => u._count.simulationRuns > 1).length;
    powerUsers = userSimCounts.filter(u => u._count.simulationRuns >= 5).length;

    console.log(`One-time users:               ${oneTimers} (${((oneTimers/usersWhoRanSims)*100).toFixed(1)}%)`);
    console.log(`Repeat users (2-4 runs):      ${repeatUsers} (${((repeatUsers/usersWhoRanSims)*100).toFixed(1)}%)`);
    console.log(`Power users (5+ runs):        ${powerUsers} (${((powerUsers/usersWhoRanSims)*100).toFixed(1)}%)`);

    const maxSimCount = Math.max(...userSimCounts.map(u => u._count.simulationRuns));
    console.log(`Most simulations by one user: ${maxSimCount}`);
  } else {
    console.log('No simulation data available.');
  }
  console.log('');

  // === RECENT SIMULATIONS ===
  console.log('📅 RECENT SIMULATIONS (Last 10)');
  console.log('-'.repeat(80));

  const recentSims = await prisma.simulationRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (recentSims.length > 0) {
    recentSims.forEach((sim, index) => {
      const name = [sim.user.firstName, sim.user.lastName].filter(Boolean).join(' ') || 'No name';
      const timeAgo = Date.now() - sim.createdAt.getTime();
      const hoursAgo = Math.floor(timeAgo / (1000 * 60 * 60));
      const daysAgo = Math.floor(timeAgo / (1000 * 60 * 60 * 24));

      const timeStr = daysAgo > 0 ? `${daysAgo}d ago` : `${hoursAgo}h ago`;

      console.log(`${index + 1}. ${sim.user.email} (${name})`);
      console.log(`   Time: ${timeStr} | Strategy: ${sim.strategy}`);
      console.log(`   Health: ${sim.healthScore?.toFixed(0) || 'N/A'}/100 (${sim.healthRating}) | Success: ${sim.successRate?.toFixed(0) || 'N/A'}%`);
      console.log('');
    });
  } else {
    console.log('No simulations run yet.');
  }

  // === READINESS VS USAGE ===
  console.log('🎯 READINESS VS. ACTUAL USAGE');
  console.log('-'.repeat(80));

  const usersReady = await prisma.user.count({
    where: {
      deletedAt: null,
      AND: [
        { assets: { some: {} } },
        {
          OR: [
            { incomeSources: { some: {} } },
            { expenses: { some: {} } }
          ]
        }
      ]
    }
  });

  const potentialUsers = usersReady - usersWhoRanSims;
  const conversionRate = usersReady > 0 ? (usersWhoRanSims / usersReady * 100) : 0;

  console.log(`Users Ready for Simulation:    ${usersReady} (${((usersReady/totalUsers)*100).toFixed(1)}% of total)`);
  console.log(`Users Who Ran Simulation:      ${usersWhoRanSims} (${((usersWhoRanSims/totalUsers)*100).toFixed(1)}% of total)`);
  console.log(`Conversion Rate (Ready→Run):   ${conversionRate.toFixed(1)}%`);
  console.log(`Potential Users Not Using:     ${potentialUsers} (${((potentialUsers/usersReady)*100).toFixed(1)}% of ready)`);
  console.log('');

  // === KEY INSIGHTS ===
  console.log('💡 KEY INSIGHTS & RECOMMENDATIONS');
  console.log('-'.repeat(80));

  const insights: string[] = [];

  if (usersWhoRanSims === 0) {
    insights.push('🚨 CRITICAL: Zero simulation usage! Feature is invisible or inaccessible.');
    insights.push('   → Add prominent dashboard CTA');
    insights.push('   → Send email notifications when users are ready');
  } else if (conversionRate < 25) {
    insights.push(`⚠️  LOW CONVERSION: Only ${conversionRate.toFixed(1)}% of ready users run simulations.`);
    insights.push('   → Improve feature discoverability');
    insights.push('   → Add in-app prompts/notifications');
  } else if (conversionRate >= 50) {
    insights.push(`✅ GOOD CONVERSION: ${conversionRate.toFixed(1)}% of ready users run simulations.`);
  }

  const repeatRate = repeatUsers > 0 ? (repeatUsers / usersWhoRanSims * 100) : 0;
  if (repeatRate < 20 && usersWhoRanSims > 0) {
    insights.push(`⚠️  LOW REPEAT USAGE: Only ${repeatRate.toFixed(1)}% of users run multiple simulations.`);
    insights.push('   → Add "compare scenarios" feature');
    insights.push('   → Prompt users to try different strategies');
  } else if (repeatRate >= 50) {
    insights.push(`✅ HIGH ENGAGEMENT: ${repeatRate.toFixed(1)}% of users run multiple simulations.`);
  }

  if (simulations.length > 0) {
    const excellentCount = simulations.filter(s => s.healthScore && s.healthScore >= 80).length;
    const poorCount = simulations.filter(s => s.healthScore && s.healthScore < 50).length;
    const excellentPct = (excellentCount / simulations.length * 100);
    const poorPct = (poorCount / simulations.length * 100);

    if (excellentPct >= 50) {
      insights.push(`✅ HEALTHY PLANS: ${excellentPct.toFixed(1)}% of simulations score 80+ health.`);
    }
    if (poorPct >= 30) {
      insights.push(`⚠️  CONCERNING: ${poorPct.toFixed(1)}% of simulations score below 50 health.`);
      insights.push('   → Provide actionable recommendations');
      insights.push('   → Offer educational content on improving plans');
    }
  }

  if (insights.length === 0) {
    insights.push('No major issues detected. Continue monitoring trends.');
  }

  insights.forEach(insight => console.log(insight));

  console.log('\n' + '='.repeat(80) + '\n');

  await prisma.$disconnect();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
