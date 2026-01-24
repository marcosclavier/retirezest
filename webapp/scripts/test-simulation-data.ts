import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Test script to validate simulation data for specific users
 * This helps identify data pre-population and calculation issues
 */

async function testSimulationData() {
  console.log('🧪 Testing Simulation Data Pre-population');
  console.log('='.repeat(80));

  // Test with jrcb@hotmail.com (Juan Clavier) - has 41 simulations
  const testUserEmail = 'jrcb@hotmail.com';

  const user = await prisma.user.findUnique({
    where: { email: testUserEmail },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      province: true,
      maritalStatus: true,
      includePartner: true,
      partnerFirstName: true,
      partnerLastName: true,
      partnerDateOfBirth: true,
      lifeExpectancy: true,
      assets: {
        select: {
          type: true,
          balance: true,
          currentValue: true,
          owner: true,
          contributionRoom: true,
        },
      },
      incomeSources: {
        select: {
          type: true,
          amount: true,
          startAge: true,
          owner: true,
          frequency: true,
        },
      },
      expenses: {
        where: { isRecurring: true },
        select: {
          amount: true,
          frequency: true,
          essential: true,
        },
      },
      simulationRuns: {
        select: {
          id: true,
          strategy: true,
          healthScore: true,
          healthRating: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5, // Last 5 simulations
      },
    },
  });

  if (!user) {
    console.error(`❌ User ${testUserEmail} not found`);
    return;
  }

  console.log(`\n📋 USER PROFILE: ${user.email}`);
  console.log('-'.repeat(80));
  console.log(`Name: ${user.firstName} ${user.lastName}`);
  console.log(`Province: ${user.province}`);
  console.log(`Date of Birth: ${user.dateOfBirth}`);
  console.log(`Life Expectancy: ${user.lifeExpectancy || 95}`);
  console.log(`Include Partner: ${user.includePartner ? 'Yes' : 'No'}`);
  if (user.includePartner) {
    console.log(`Partner: ${user.partnerFirstName} ${user.partnerLastName}`);
    console.log(`Partner DOB: ${user.partnerDateOfBirth}`);
  }

  // Calculate age
  let age = 65;
  if (user.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(user.dateOfBirth);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }
  console.log(`Calculated Age: ${age}`);

  // Assets breakdown
  console.log(`\n💰 ASSETS (${user.assets.length} total)`);
  console.log('-'.repeat(80));

  const assetsByOwner: Record<string, Record<string, number>> = {};

  user.assets.forEach(asset => {
    const type = asset.type.toUpperCase();
    const balance = asset.balance || asset.currentValue || 0;
    const owner = asset.owner || 'person1';

    console.log(`  ${type.padEnd(15)} | ${owner.padEnd(10)} | $${balance.toLocaleString().padStart(12)}`);

    if (!assetsByOwner[owner]) {
      assetsByOwner[owner] = {
        TFSA: 0,
        RRSP: 0,
        RRIF: 0,
        NONREG: 0,
        CORPORATE: 0,
        TFSA_ROOM: 0,
      };
    }

    switch (type) {
      case 'TFSA':
        assetsByOwner[owner].TFSA += balance;
        assetsByOwner[owner].TFSA_ROOM = Math.max(assetsByOwner[owner].TFSA_ROOM, asset.contributionRoom || 0);
        break;
      case 'RRSP':
        assetsByOwner[owner].RRSP += balance;
        break;
      case 'RRIF':
        assetsByOwner[owner].RRIF += balance;
        break;
      case 'NONREG':
      case 'NON-REGISTERED':
      case 'NONREGISTERED':
      case 'NON_REGISTERED':
        assetsByOwner[owner].NONREG += balance;
        break;
      case 'CORPORATE':
      case 'CORP':
        assetsByOwner[owner].CORPORATE += balance;
        break;
    }
  });

  console.log(`\n📊 ASSETS BY OWNER`);
  Object.entries(assetsByOwner).forEach(([owner, totals]) => {
    console.log(`\n  ${owner}:`);
    console.log(`    TFSA:       $${totals.TFSA.toLocaleString()}`);
    console.log(`    RRSP:       $${totals.RRSP.toLocaleString()}`);
    console.log(`    RRIF:       $${totals.RRIF.toLocaleString()}`);
    console.log(`    Non-Reg:    $${totals.NONREG.toLocaleString()}`);
    console.log(`    Corporate:  $${totals.CORPORATE.toLocaleString()}`);
    console.log(`    TFSA Room:  $${totals.TFSA_ROOM.toLocaleString()}`);
    console.log(`    TOTAL:      $${(totals.TFSA + totals.RRSP + totals.RRIF + totals.NONREG + totals.CORPORATE).toLocaleString()}`);
  });

  // Income sources
  console.log(`\n💵 INCOME SOURCES (${user.incomeSources.length} total)`);
  console.log('-'.repeat(80));

  if (user.incomeSources.length === 0) {
    console.log('  ⚠️  No income sources defined');
  } else {
    user.incomeSources.forEach(income => {
      const owner = income.owner || 'person1';
      const frequency = income.frequency || 'annual';
      console.log(`  ${income.type.padEnd(15)} | ${owner.padEnd(10)} | $${income.amount.toLocaleString().padStart(10)} ${frequency.padEnd(10)} | Start: ${income.startAge || 'N/A'}`);
    });
  }

  // Expenses
  console.log(`\n💸 EXPENSES (${user.expenses.length} recurring)`);
  console.log('-'.repeat(80));

  if (user.expenses.length === 0) {
    console.log('  ⚠️  No recurring expenses defined');
  } else {
    let totalAnnual = 0;
    user.expenses.forEach(expense => {
      const amount = expense.amount;
      const frequency = expense.frequency.toLowerCase();

      // Convert to annual
      let annualAmount = 0;
      switch (frequency) {
        case 'monthly':
          annualAmount = amount * 12;
          break;
        case 'annual':
        case 'yearly':
          annualAmount = amount;
          break;
        case 'quarterly':
          annualAmount = amount * 4;
          break;
        case 'weekly':
          annualAmount = amount * 52;
          break;
        case 'biweekly':
          annualAmount = amount * 26;
          break;
        default:
          annualAmount = amount;
      }

      totalAnnual += annualAmount;
      console.log(`  $${amount.toLocaleString().padStart(10)} ${frequency.padEnd(10)} → $${annualAmount.toLocaleString().padStart(10)} annual | Essential: ${expense.essential ? 'Yes' : 'No'}`);
    });

    console.log(`  ${'TOTAL ANNUAL:'.padEnd(22)} $${totalAnnual.toLocaleString().padStart(10)}`);
  }

  // Recent simulations
  console.log(`\n🎯 RECENT SIMULATIONS (Last 5 of ${user.simulationRuns.length} total)`);
  console.log('-'.repeat(80));

  if (user.simulationRuns.length === 0) {
    console.log('  ⚠️  No simulations run yet');
  } else {
    user.simulationRuns.forEach((sim, idx) => {
      const date = new Date(sim.createdAt).toLocaleString();
      const strategy = sim.strategy || 'N/A';
      const score = sim.healthScore !== null ? sim.healthScore : 'N/A';
      const rating = sim.healthRating || 'N/A';
      console.log(`  ${idx + 1}. ${date} | ${strategy.padEnd(25)} | Score: ${String(score).padEnd(5)} (${rating})`);
    });
  }

  // Strategy analysis
  const strategyBreakdown = user.simulationRuns.reduce((acc, sim) => {
    const strategy = sim.strategy || 'Unknown';
    acc[strategy] = (acc[strategy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\n📈 STRATEGY USAGE`);
  console.log('-'.repeat(80));
  Object.entries(strategyBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([strategy, count]) => {
      const pct = ((count / user.simulationRuns.length) * 100).toFixed(1);
      console.log(`  ${strategy.padEnd(30)} | ${String(count).padStart(3)} times (${pct}%)`);
    });

  // Health score analysis
  const scoresWithValues = user.simulationRuns.filter(s => s.healthScore !== null);
  if (scoresWithValues.length > 0) {
    const avgScore = scoresWithValues.reduce((sum, s) => sum + (s.healthScore || 0), 0) / scoresWithValues.length;
    const minScore = Math.min(...scoresWithValues.map(s => s.healthScore || 0));
    const maxScore = Math.max(...scoresWithValues.map(s => s.healthScore || 0));

    console.log(`\n📊 HEALTH SCORE STATISTICS`);
    console.log('-'.repeat(80));
    console.log(`  Average: ${avgScore.toFixed(1)}`);
    console.log(`  Min:     ${minScore}`);
    console.log(`  Max:     ${maxScore}`);
    console.log(`  Range:   ${maxScore - minScore}`);
  }

  // CRITICAL CHECKS
  console.log(`\n\n⚠️  CRITICAL VALIDATION CHECKS`);
  console.log('='.repeat(80));

  // Check 1: Do they have assets?
  const totalAssets = Object.values(assetsByOwner).reduce((sum, owner) => {
    return sum + owner.TFSA + owner.RRSP + owner.RRIF + owner.NONREG + owner.CORPORATE;
  }, 0);

  if (totalAssets === 0) {
    console.log('❌ FAIL: User has NO ASSETS - simulations will be meaningless');
  } else {
    console.log(`✅ PASS: User has $${totalAssets.toLocaleString()} in total assets`);
  }

  // Check 2: Do they have income sources (CPP/OAS)?
  const hasCPP = user.incomeSources.some(i => i.type.toLowerCase() === 'cpp');
  const hasOAS = user.incomeSources.some(i => i.type.toLowerCase() === 'oas');

  if (!hasCPP) {
    console.log('⚠️  WARN: User has NO CPP income defined - will use defaults ($15,000)');
  } else {
    console.log('✅ PASS: User has CPP income defined');
  }

  if (!hasOAS) {
    console.log('⚠️  WARN: User has NO OAS income defined - will use defaults ($8,500)');
  } else {
    console.log('✅ PASS: User has OAS income defined');
  }

  // Check 3: Do they have expenses?
  if (user.expenses.length === 0) {
    console.log('⚠️  WARN: User has NO EXPENSES defined - spending will use defaults');
  } else {
    console.log('✅ PASS: User has expenses defined');
  }

  // Check 4: Recent simulation health scores
  if (user.simulationRuns.length > 0) {
    const recentScores = user.simulationRuns.slice(0, 5).filter(s => s.healthScore !== null);
    if (recentScores.length > 0) {
      const avgRecentScore = recentScores.reduce((sum, s) => sum + (s.healthScore || 0), 0) / recentScores.length;

      if (avgRecentScore < 50) {
        console.log(`❌ CONCERN: Recent avg health score is LOW (${avgRecentScore.toFixed(1)}/100)`);
        console.log('   → This could indicate calculation issues or poor retirement readiness');
      } else if (avgRecentScore < 70) {
        console.log(`⚠️  CONCERN: Recent avg health score is MODERATE (${avgRecentScore.toFixed(1)}/100)`);
      } else {
        console.log(`✅ GOOD: Recent avg health score is ${avgRecentScore.toFixed(1)}/100`);
      }
    }
  }

  await prisma.$disconnect();
}

testSimulationData().catch(console.error);
