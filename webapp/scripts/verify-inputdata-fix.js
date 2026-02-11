#!/usr/bin/env node
/**
 * Verify inputData Fix - Real-time Monitor
 *
 * This script monitors the database for new simulations and verifies
 * that inputData is properly populated with user's original input.
 *
 * Usage: node scripts/verify-inputdata-fix.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getLatestSimulation() {
  const sim = await prisma.simulationRun.findFirst({
    orderBy: {
      createdAt: 'desc'
    },
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

  return sim;
}

async function verifyInputData(sim) {
  console.log('\n' + '='.repeat(80));
  console.log('VERIFYING LATEST SIMULATION');
  console.log('='.repeat(80));

  console.log(`\n📋 Simulation ID: ${sim.id.substring(0, 8)}...`);
  console.log(`📅 Created: ${new Date(sim.createdAt).toLocaleString()}`);
  console.log(`👤 User: ${sim.user?.email || 'unknown'}`);

  const input = sim.inputData;

  // Check if inputData exists and is not empty
  if (!input) {
    console.log('\n❌ CRITICAL: inputData is NULL!');
    console.log('   The fix did NOT work - inputData is still null.');
    return false;
  }

  if (typeof input === 'string') {
    console.log('\n⚠️  WARNING: inputData is a string (should be JSON object)');
    try {
      const parsed = JSON.parse(input);
      return verifyParsedInput(parsed);
    } catch (e) {
      console.log('❌ ERROR: Cannot parse inputData string:', e.message);
      return false;
    }
  }

  return verifyParsedInput(input);
}

function verifyParsedInput(input) {
  console.log('\n✅ inputData is present and is a JSON object');

  // Check for person1 data
  if (!input.person1) {
    console.log('\n❌ FAIL: person1 is missing from inputData');
    return false;
  }

  console.log('\n📊 Person 1 Data:');
  console.log(`  Name: ${input.person1.name || 'NOT SET'}`);
  console.log(`  Current Age: ${input.person1.currentAge || 'NOT SET'}`);
  console.log(`  RRSP Balance: $${(input.person1.rrspBalance || 0).toLocaleString()}`);
  console.log(`  TFSA Balance: $${(input.person1.tfsaBalance || 0).toLocaleString()}`);
  console.log(`  Non-Reg Balance: $${(input.person1.nonRegisteredBalance || 0).toLocaleString()}`);

  // Check for income sources (the critical fields that were being lost)
  const hasPensionIncomes = input.person1.pensionIncomes && input.person1.pensionIncomes.length > 0;
  const hasOtherIncomes = input.person1.otherIncomes && input.person1.otherIncomes.length > 0;

  console.log('\n💰 Income Sources:');

  if (hasPensionIncomes) {
    console.log(`  ✅ Pension Incomes: ${input.person1.pensionIncomes.length} configured`);
    input.person1.pensionIncomes.forEach((p, idx) => {
      console.log(`     ${idx + 1}. $${p.amount?.toLocaleString() || 0}/year starting age ${p.startAge}`);
    });
  } else {
    console.log('  ℹ️  Pension Incomes: None configured');
  }

  if (hasOtherIncomes) {
    console.log(`  ✅ Other Incomes: ${input.person1.otherIncomes.length} configured`);
    input.person1.otherIncomes.forEach((o, idx) => {
      console.log(`     ${idx + 1}. $${o.amount?.toLocaleString() || 0}/year starting age ${o.startAge}`);
    });
  } else {
    console.log('  ℹ️  Other Incomes: None configured');
  }

  // Check household/spending data
  if (!input.household && !input.spending) {
    console.log('\n⚠️  WARNING: No household or spending data found');
  } else {
    console.log('\n💸 Spending:');
    const spending = input.household || input.spending || {};
    console.log(`  Go-Go: $${(spending.spendingGoGo || spending.essentialExpenses || 0).toLocaleString()}`);
    console.log(`  Slow-Go: $${(spending.spendingSlowGo || 0).toLocaleString()}`);
    console.log(`  No-Go: $${(spending.spendingNoGo || spending.discretionaryExpenses || 0).toLocaleString()}`);
  }

  // Final verdict
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION RESULT:');
  console.log('='.repeat(80));

  const hasName = input.person1.name && input.person1.name !== '';
  const hasAge = input.person1.currentAge > 0;
  const hasAnyBalance = (input.person1.rrspBalance || 0) +
                        (input.person1.tfsaBalance || 0) +
                        (input.person1.nonRegisteredBalance || 0) > 0;

  if (!hasName && !hasAge && !hasAnyBalance) {
    console.log('\n❌ FAIL: inputData appears to be EMPTY');
    console.log('   All critical fields are missing or zero.');
    console.log('   The fix did NOT work properly.');
    return false;
  }

  console.log('\n✅ PASS: inputData is properly populated!');
  console.log('   The fix is working correctly.');
  console.log('\n   Critical fields present:');
  if (hasName) console.log('   ✅ Name');
  if (hasAge) console.log('   ✅ Age');
  if (hasAnyBalance) console.log('   ✅ Account balances');
  if (hasPensionIncomes) console.log('   ✅ Pension income sources');
  if (hasOtherIncomes) console.log('   ✅ Other income sources');

  return true;
}

async function monitorForNewSimulations(lastSimId) {
  console.log('\n👀 Monitoring for new simulations...');
  console.log('   (Run a simulation through the UI to test the fix)');
  console.log('   Press Ctrl+C to stop monitoring\n');

  let currentLastId = lastSimId;

  const checkInterval = setInterval(async () => {
    try {
      const latest = await getLatestSimulation();

      if (!latest) {
        return;
      }

      if (latest.id !== currentLastId) {
        console.log('\n🎉 NEW SIMULATION DETECTED!');
        await verifyInputData(latest);
        currentLastId = latest.id;
        console.log('\n👀 Continuing to monitor for more simulations...\n');
      }
    } catch (error) {
      console.error('Error checking for new simulations:', error.message);
    }
  }, 2000); // Check every 2 seconds

  // Keep process alive
  return new Promise(() => {});
}

async function main() {
  try {
    console.log('=' .repeat(80));
    console.log('inputData FIX VERIFICATION');
    console.log('='.repeat(80));

    console.log('\n🔍 Checking latest simulation in database...\n');

    const latest = await getLatestSimulation();

    if (!latest) {
      console.log('❌ No simulations found in database');
      await prisma.$disconnect();
      return;
    }

    const passed = await verifyInputData(latest);

    if (passed) {
      console.log('\n✅ The inputData fix appears to be working!');
      console.log('\n📋 Next step: Ask Marc or any user to run a new simulation');
      console.log('   to confirm the fix works end-to-end in production.');
    } else {
      console.log('\n❌ The inputData fix is NOT working yet.');
      console.log('   Latest simulation still has empty/missing inputData.');
    }

    // Ask if user wants to monitor
    console.log('\n' + '='.repeat(80));
    console.log('MONITORING MODE');
    console.log('='.repeat(80));
    console.log('\nTo test the fix in real-time:');
    console.log('1. Run this script with --monitor flag');
    console.log('2. Run a simulation through the UI');
    console.log('3. Script will automatically verify the new simulation');
    console.log('\nUsage: node scripts/verify-inputdata-fix.js --monitor');

    if (process.argv.includes('--monitor')) {
      await monitorForNewSimulations(latest.id);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (!process.argv.includes('--monitor')) {
      await prisma.$disconnect();
    }
  }
}

main();
