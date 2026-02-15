#!/usr/bin/env node
/**
 * Find Breaking Point
 *
 * Identify when data saving stopped working by checking older simulations
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findBreakingPoint() {
  try {
    console.log('=== FINDING WHEN DATA SAVING BROKE ===\n');

    // Get last 100 simulations to find the transition point
    const simulations = await prisma.simulationRun.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 100,
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

    console.log(`📊 Analyzing ${simulations.length} simulations...\n`);

    let firstEmptyIndex = -1;
    let lastGoodIndex = -1;

    for (let i = 0; i < simulations.length; i++) {
      const sim = simulations[i];
      const input = sim.inputData;

      const isEmpty = !input ||
                     !input.person1 ||
                     !input.person1.currentAge ||
                     (input.person1.rrspBalance === 0 &&
                      input.person1.tfsaBalance === 0 &&
                      input.person1.nonRegisteredBalance === 0 &&
                      input.spending?.essentialExpenses === 0 &&
                      input.spending?.discretionaryExpenses === 0);

      if (!isEmpty && lastGoodIndex === -1) {
        lastGoodIndex = i;
      }

      if (isEmpty && firstEmptyIndex === -1 && lastGoodIndex !== -1) {
        firstEmptyIndex = i - 1;
      }
    }

    if (lastGoodIndex === -1) {
      console.log('❌ NO GOOD SIMULATIONS FOUND in last 100 records!');
      console.log('   Bug started more than 100 simulations ago.\n');

      // Show oldest simulation checked
      const oldest = simulations[simulations.length - 1];
      console.log('📅 Oldest simulation checked:');
      console.log(`   Date: ${new Date(oldest.createdAt).toISOString()}`);
      console.log(`   Status: EMPTY`);

      return;
    }

    // Found transition point
    console.log('✅ FOUND BREAKING POINT!\n');
    console.log('='.repeat(80));

    const lastGood = simulations[lastGoodIndex];
    console.log('LAST WORKING SIMULATION:');
    console.log('='.repeat(80));
    console.log(`📋 ID: ${lastGood.id}`);
    console.log(`📅 Date: ${new Date(lastGood.createdAt).toISOString()}`);
    console.log(`👤 User: ${lastGood.user?.email || 'unknown'}`);
    console.log(`✅ Status: HAS DATA`);
    console.log(`💰 RRSP: $${(lastGood.inputData.person1?.rrspBalance || 0).toLocaleString()}`);
    console.log(`💰 TFSA: $${(lastGood.inputData.person1?.tfsaBalance || 0).toLocaleString()}`);
    console.log(`💸 Spending: $${((lastGood.inputData.spending?.essentialExpenses || 0) + (lastGood.inputData.spending?.discretionaryExpenses || 0)).toLocaleString()}`);

    if (lastGoodIndex > 0) {
      const firstBroken = simulations[lastGoodIndex - 1];
      console.log('\n' + '='.repeat(80));
      console.log('FIRST BROKEN SIMULATION:');
      console.log('='.repeat(80));
      console.log(`📋 ID: ${firstBroken.id}`);
      console.log(`📅 Date: ${new Date(firstBroken.createdAt).toISOString()}`);
      console.log(`👤 User: ${firstBroken.user?.email || 'unknown'}`);
      console.log(`❌ Status: EMPTY`);

      const timeDiff = new Date(firstBroken.createdAt) - new Date(lastGood.createdAt);
      const minutesDiff = Math.round(timeDiff / 1000 / 60);

      console.log('\n' + '='.repeat(80));
      console.log('TIMELINE:');
      console.log('='.repeat(80));
      console.log(`⏰ Last working: ${new Date(lastGood.createdAt).toLocaleString()}`);
      console.log(`⏰ First broken: ${new Date(firstBroken.createdAt).toLocaleString()}`);
      console.log(`⏱️  Time difference: ${minutesDiff} minutes`);
      console.log('\n📋 ACTION: Check what changed between these times:');
      console.log('   - Git commits');
      console.log('   - Deployments');
      console.log('   - Database migrations');
      console.log('   - Environment variable changes');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

findBreakingPoint();
