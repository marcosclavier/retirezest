/**
 * Analyze Deleted User Simulations
 * Investigates whether simulation accuracy issues caused account deletions
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDeletedUserSimulations() {
  console.log('🔍 INVESTIGATING DELETED USER SIMULATIONS');
  console.log('='.repeat(80));
  console.log();

  // Get deleted users
  const deletedUsers = await prisma.user.findMany({
    where: {
      deletedAt: { not: null }
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      deletedAt: true,
      deletionReason: true,
    }
  });

  console.log(`Found ${deletedUsers.length} deleted users\n`);

  for (const user of deletedUsers) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`USER: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Created: ${user.createdAt.toISOString()}`);
    console.log(`Deleted: ${user.deletedAt.toISOString()}`);
    const accountLifetime = Math.round((user.deletedAt - user.createdAt) / 1000 / 60);
    console.log(`Account Lifetime: ${accountLifetime} minutes`);
    console.log(`Deletion Reason: ${user.deletionReason || 'Not provided'}`);
    console.log('-'.repeat(80));

    // Get their simulation runs
    const simulations = await prisma.simulationRun.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`\nTotal Simulations Run: ${simulations.length}`);

    if (simulations.length > 0) {
      console.log('\nSIMULATION DETAILS:');

      for (let i = 0; i < simulations.length; i++) {
        const sim = simulations[i];
        console.log(`\n  Simulation #${i + 1} (${sim.createdAt.toISOString()})`);
        console.log(`  Strategy: ${sim.strategy}`);
        console.log(`  Province: ${sim.province}`);
        console.log(`  Age Range: ${sim.startAge} → ${sim.endAge} (${sim.endAge - sim.startAge} years)`);
        console.log(`  Include Partner: ${sim.includePartner}`);

        if (sim.spendingGoGo || sim.spendingSlowGo || sim.spendingNoGo) {
          console.log(`  Spending: Go-Go $${sim.spendingGoGo?.toLocaleString() || 'N/A'}, Slow-Go $${sim.spendingSlowGo?.toLocaleString() || 'N/A'}, No-Go $${sim.spendingNoGo?.toLocaleString() || 'N/A'}`);
        }

        console.log(`\n  📊 RESULTS:`);
        console.log(`    Health Score: ${sim.healthScore || 'N/A'}/100 (${sim.healthRating || 'N/A'})`);
        console.log(`    Success Rate: ${sim.successRate || 'N/A'}%`);
        console.log(`    Years Funded: ${sim.yearsFunded || 'N/A'}/${sim.yearsSimulated || 'N/A'}`);

        console.log(`\n  💰 FINANCIAL OUTCOMES:`);
        console.log(`    Initial Net Worth: $${sim.initialNetWorth?.toLocaleString() || 'N/A'}`);
        console.log(`    Final Estate: $${sim.finalEstate?.toLocaleString() || 'N/A'}`);
        console.log(`    Total Tax Paid: $${sim.totalTaxPaid?.toLocaleString() || 'N/A'}`);
        console.log(`    Avg Tax Rate: ${sim.avgTaxRate?.toFixed(1) || 'N/A'}%`);

        console.log(`\n  🏛️ GOVERNMENT BENEFITS:`);
        console.log(`    Total CPP: $${sim.totalCPP?.toLocaleString() || 'N/A'}`);
        console.log(`    Total OAS: $${sim.totalOAS?.toLocaleString() || 'N/A'}`);
        console.log(`    Total GIS: $${sim.totalGIS?.toLocaleString() || 'N/A'}`);
        console.log(`    Total Benefits: $${sim.totalBenefits?.toLocaleString() || 'N/A'}`);

        console.log(`\n  💳 WITHDRAWALS BY SOURCE:`);
        console.log(`    RRIF: $${sim.totalRRIFWithdrawn?.toLocaleString() || 'N/A'}`);
        console.log(`    Non-Reg: $${sim.totalNonRegWithdrawn?.toLocaleString() || 'N/A'}`);
        console.log(`    TFSA: $${sim.totalTFSAWithdrawn?.toLocaleString() || 'N/A'}`);
        console.log(`    Corp: $${sim.totalCorpWithdrawn?.toLocaleString() || 'N/A'}`);

        console.log(`\n  📦 INITIAL ASSETS:`);
        console.log(`    TFSA: $${sim.initialTFSA?.toLocaleString() || 'N/A'}`);
        console.log(`    RRSP: $${sim.initialRRSP?.toLocaleString() || 'N/A'}`);
        console.log(`    RRIF: $${sim.initialRRIF?.toLocaleString() || 'N/A'}`);
        console.log(`    Non-Reg: $${sim.initialNonReg?.toLocaleString() || 'N/A'}`);
        console.log(`    Corp: $${sim.initialCorp?.toLocaleString() || 'N/A'}`);

        // Check for potential issues
        const issues = [];
        if (sim.healthScore !== null && sim.healthScore < 30) {
          issues.push('❌ VERY LOW health score - likely alarming result');
        }
        if (sim.successRate !== null && sim.successRate < 50) {
          issues.push('⚠️ Low success rate - plan not sustainable');
        }
        if (sim.yearsFunded !== null && sim.yearsSimulated !== null && sim.yearsFunded < sim.yearsSimulated * 0.5) {
          issues.push('❌ Less than 50% of years funded - critical failure');
        }
        if (sim.finalEstate !== null && sim.finalEstate < 0) {
          issues.push('❌ Negative final estate - ran out of money');
        }
        if (sim.totalTaxPaid !== null && sim.avgTaxRate !== null && sim.avgTaxRate > 40) {
          issues.push('⚠️ Very high tax rate - inefficient withdrawals');
        }

        if (issues.length > 0) {
          console.log(`\n  🚨 POTENTIAL ISSUES DETECTED:`);
          issues.forEach(issue => console.log(`    ${issue}`));
        }
      }

      // Analyze patterns
      console.log(`\n${'─'.repeat(80)}`);
      console.log('PATTERN ANALYSIS:');

      const avgHealthScore = simulations.reduce((sum, s) => sum + (s.healthScore || 0), 0) / simulations.length;
      const avgSuccessRate = simulations.reduce((sum, s) => sum + (s.successRate || 0), 0) / simulations.length;

      console.log(`  Average Health Score: ${avgHealthScore.toFixed(1)}/100`);
      console.log(`  Average Success Rate: ${avgSuccessRate.toFixed(1)}%`);

      const poorResults = simulations.filter(s =>
        (s.healthScore !== null && s.healthScore < 40) ||
        (s.successRate !== null && s.successRate < 60)
      ).length;

      console.log(`  Simulations with Poor Results: ${poorResults}/${simulations.length}`);

      if (poorResults === simulations.length && simulations.length > 0) {
        console.log(`  ⚠️⚠️⚠️ ALL SIMULATIONS SHOWED POOR RESULTS - LIKELY REASON FOR DELETION`);
      }
    }
  }

  await prisma.$disconnect();
}

analyzeDeletedUserSimulations().catch(console.error);
