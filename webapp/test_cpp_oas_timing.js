/**
 * Test CPP/OAS timing with user rightfooty218@gmail.com's exact configuration
 *
 * User Configuration:
 * - Age: 65
 * - CPP Start Age: 65 (configured in Scenario)
 * - OAS Start Age: 65 (configured in Scenario)
 *
 * Expected: CPP and OAS income should appear starting at age 65
 * Bug: If CPP/OAS income doesn't appear at age 65, there's a timing bug
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCPPOASTiming() {
  console.log('\n' + '='.repeat(80));
  console.log('US-038: Test CPP/OAS Income Timing');
  console.log('='.repeat(80) + '\n');

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'rightfooty218@gmail.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        dateOfBirth: true,
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.email);

    // Calculate age
    const age = user.dateOfBirth
      ? Math.floor((new Date() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : 65;

    console.log(`   Current Age: ${age}\n`);

    // Get scenario
    const scenario = await prisma.scenario.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        currentAge: true,
        retirementAge: true,
        cppStartAge: true,
        oasStartAge: true,
      }
    });

    console.log('📋 Scenario Configuration:');
    console.log(`   Name: ${scenario.name}`);
    console.log(`   Current Age: ${scenario.currentAge}`);
    console.log(`   Retirement Age: ${scenario.retirementAge}`);
    console.log(`   CPP Start Age: ${scenario.cppStartAge} ⬅️ Should trigger at age 65`);
    console.log(`   OAS Start Age: ${scenario.oasStartAge} ⬅️ Should trigger at age 65\n`);

    // Now test what the prefill API would return
    console.log('🔍 Testing Prefill API Logic...\n');

    // Check IncomeSource table for CPP/OAS
    const incomeSources = await prisma.incomeSource.findMany({
      where: {
        userId: user.id,
        type: { in: ['cpp', 'oas'] }
      },
      select: {
        type: true,
        startAge: true,
        annualAmount: true,
      }
    });

    console.log('📊 IncomeSource Table (what prefill API reads):');
    if (incomeSources.length === 0) {
      console.log('   ❌ NO CPP/OAS records in IncomeSource table');
      console.log('   ⚠️  Prefill API will NOT find CPP/OAS start ages here!\n');
    } else {
      incomeSources.forEach(income => {
        console.log(`   - ${income.type.toUpperCase()}: Start Age ${income.startAge}, Amount $${income.annualAmount}`);
      });
      console.log();
    }

    // Simulate prefill API logic
    const cppFromIncomeSource = incomeSources.find(i => i.type === 'cpp')?.startAge;
    const oasFromIncomeSource = incomeSources.find(i => i.type === 'oas')?.startAge;

    console.log('🧪 Simulating Prefill API Logic:');
    console.log(`   person1Income.cpp_start_age = ${cppFromIncomeSource || 'null'}`);
    console.log(`   person1Income.oas_start_age = ${oasFromIncomeSource || 'null'}\n`);

    // Apply fallback logic (line 339 in prefill/route.ts)
    const finalCPPAge = cppFromIncomeSource ?? Math.max(age, 65);
    const finalOASAge = oasFromIncomeSource ?? Math.max(age, 65);

    console.log('✅ Final Values After Fallback (Math.max(age, 65)):');
    console.log(`   cpp_start_age: ${cppFromIncomeSource} ?? Math.max(${age}, 65) = ${finalCPPAge}`);
    console.log(`   oas_start_age: ${oasFromIncomeSource} ?? Math.max(${age}, 65) = ${finalOASAge}\n`);

    // Compare with Scenario values
    console.log('🔎 Root Cause Analysis:\n');

    console.log('   SCENARIO TABLE (User\'s Configuration):');
    console.log(`   - CPP Start Age: ${scenario.cppStartAge}`);
    console.log(`   - OAS Start Age: ${scenario.oasStartAge}\n`);

    console.log('   PREFILL API OUTPUT (What Simulation Receives):');
    console.log(`   - CPP Start Age: ${finalCPPAge}`);
    console.log(`   - OAS Start Age: ${finalOASAge}\n`);

    // Determine if there's a bug
    const cppMismatch = scenario.cppStartAge !== finalCPPAge;
    const oasMismatch = scenario.oasStartAge !== finalOASAge;

    if (cppMismatch || oasMismatch) {
      console.log('❌ BUG CONFIRMED: Mismatch between Scenario and Prefill API!\n');

      if (cppMismatch) {
        console.log(`   CPP: User configured ${scenario.cppStartAge}, but simulation uses ${finalCPPAge}`);
      }
      if (oasMismatch) {
        console.log(`   OAS: User configured ${scenario.oasStartAge}, but simulation uses ${finalOASAge}`);
      }

      console.log('\n   ROOT CAUSE:');
      console.log('   - Prefill API only reads from IncomeSource table');
      console.log('   - User configured CPP/OAS in Scenario table');
      console.log('   - Scenario values are IGNORED by prefill API');
      console.log('   - Fallback to Math.max(age, 65) masks the bug for users age 65+\n');

    } else {
      console.log('✅ NO BUG DETECTED: Values match!\n');
      console.log('   For THIS user (age 65), the fallback Math.max(65, 65) = 65');
      console.log('   coincidentally matches the Scenario configuration.\n');
      console.log('   HOWEVER: The bug would appear for:');
      console.log('   - Users younger than 65 who configured later CPP start (e.g., age 70)');
      console.log('   - Users age 66+ who configured CPP at 65 (would use 66+ instead)\n');
    }

    console.log('='.repeat(80));
    console.log('CONCLUSION');
    console.log('='.repeat(80) + '\n');

    console.log('The prefill API has a design flaw:');
    console.log('- ❌ Ignores Scenario table (where users configure CPP/OAS)');
    console.log('- ❌ Only reads IncomeSource table (not used for CPP/OAS by most users)');
    console.log('- ⚠️  Falls back to Math.max(current_age, 65) when IncomeSource is empty\n');

    console.log('For user rightfooty218@gmail.com:');
    console.log(`- Configured CPP/OAS at age ${scenario.cppStartAge} in Scenario`);
    console.log(`- Prefill API returns age ${finalCPPAge} (from fallback)`);
    console.log(`- ${cppMismatch || oasMismatch ? '❌ MISMATCH' : '✅ COINCIDENTALLY CORRECT'}\n`);

    if (!cppMismatch && !oasMismatch) {
      console.log('⚠️  NOTE: User\'s complaint "pics come due" was about GICs, NOT CPP/OAS.');
      console.log('   GIC issue was resolved in Sprint 3.');
      console.log('   US-038 may not be valid if no actual CPP/OAS bug affects users.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testCPPOASTiming()
  .then(() => {
    console.log('✅ Test completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
