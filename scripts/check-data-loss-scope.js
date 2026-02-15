#!/usr/bin/env node
/**
 * Check Data Loss Scope
 *
 * Determine if empty inputData affects:
 * - All users (systemic bug)
 * - Just Marc (account-specific issue)
 * - Some users (intermittent bug)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDataLossScope() {
  try {
    console.log('=== CHECKING DATA LOSS SCOPE ===\n');
    console.log('Analyzing last 20 simulations across all users...\n');

    // Get last 20 simulations across all users
    const simulations = await prisma.simulationRun.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        inputData: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${simulations.length} recent simulations\n`);
    console.log('=' .repeat(80));

    let emptyCount = 0;
    let populatedCount = 0;
    const userStats = {};

    for (let i = 0; i < simulations.length; i++) {
      const sim = simulations[i];
      const input = sim.inputData;
      const userEmail = sim.user?.email || 'unknown';

      // Check if inputData is empty/null
      const isEmpty = !input ||
                     !input.person1 ||
                     !input.person1.currentAge ||
                     (input.person1.rrspBalance === 0 &&
                      input.person1.tfsaBalance === 0 &&
                      input.person1.nonRegisteredBalance === 0 &&
                      input.spending?.essentialExpenses === 0 &&
                      input.spending?.discretionaryExpenses === 0);

      if (isEmpty) {
        emptyCount++;
      } else {
        populatedCount++;
      }

      // Track per user
      if (!userStats[userEmail]) {
        userStats[userEmail] = { empty: 0, populated: 0, total: 0 };
      }
      userStats[userEmail].total++;
      if (isEmpty) {
        userStats[userEmail].empty++;
      } else {
        userStats[userEmail].populated++;
      }

      // Display each simulation
      console.log(`\n${i + 1}. ${sim.id.substring(0, 8)}...`);
      console.log(`   📅 ${new Date(sim.createdAt).toISOString()}`);
      console.log(`   👤 ${userEmail}`);
      console.log(`   📊 Status: ${isEmpty ? '❌ EMPTY' : '✅ HAS DATA'}`);

      if (!isEmpty) {
        console.log(`   💰 RRSP: $${(input.person1?.rrspBalance || 0).toLocaleString()}`);
        console.log(`   💰 TFSA: $${(input.person1?.tfsaBalance || 0).toLocaleString()}`);
        console.log(`   💸 Spending: $${((input.spending?.essentialExpenses || 0) + (input.spending?.discretionaryExpenses || 0)).toLocaleString()}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));

    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Simulations: ${simulations.length}`);
    console.log(`   Empty InputData: ${emptyCount} (${(emptyCount/simulations.length*100).toFixed(1)}%)`);
    console.log(`   Has Data: ${populatedCount} (${(populatedCount/simulations.length*100).toFixed(1)}%)`);

    console.log(`\n👥 Per-User Statistics:`);
    const sortedUsers = Object.entries(userStats).sort((a, b) => b[1].total - a[1].total);

    for (const [email, stats] of sortedUsers) {
      const emptyPercent = (stats.empty / stats.total * 100).toFixed(0);
      const status = stats.empty === stats.total ? '❌ ALL EMPTY' :
                    stats.empty === 0 ? '✅ ALL GOOD' :
                    `⚠️  ${emptyPercent}% EMPTY`;
      console.log(`   ${email}: ${stats.total} sims - ${status}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS');
    console.log('='.repeat(80));

    if (emptyCount === simulations.length) {
      console.log('\n🚨 CRITICAL: ALL simulations have empty inputData!');
      console.log('   This is a SYSTEMIC BUG affecting all users.');
      console.log('   Likely cause: Recent deployment broke data saving.');
      console.log('\n📋 Action: Check recent commits and deployment history.');
    } else if (emptyCount === 0) {
      console.log('\n✅ No empty inputData found in recent simulations.');
      console.log('   This suggests Marc\'s issue may be:');
      console.log('   - Account-specific problem');
      console.log('   - Already fixed (check if Marc\'s sims are old)');
      console.log('   - User error in form submission');
    } else {
      console.log(`\n⚠️  INTERMITTENT BUG: ${emptyCount}/${simulations.length} simulations affected.`);
      console.log('   This suggests:');
      console.log('   - Race condition in data saving');
      console.log('   - Specific user/form state causes failure');
      console.log('   - Network/timeout issues during save');

      // Check if specific users affected
      const affectedUsers = sortedUsers.filter(([_, stats]) => stats.empty > 0);
      if (affectedUsers.length === 1) {
        console.log(`\n   📌 Only affects: ${affectedUsers[0][0]}`);
        console.log('   This is likely an ACCOUNT-SPECIFIC issue.');
      }
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataLossScope();
