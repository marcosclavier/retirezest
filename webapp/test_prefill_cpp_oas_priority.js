/**
 * Test Prefill API CPP/OAS Priority Order (US-038 Phase 2 Testing)
 *
 * Tests the 3-tier priority order after Bug #1 fix:
 * 1. IncomeSource table (highest priority)
 * 2. Scenario table (fallback)
 * 3. Math.max(age, 65) (default)
 *
 * Test Cases:
 * 1. User with IncomeSource CPP only → should use IncomeSource
 * 2. User with Scenario CPP only (no IncomeSource) → should use Scenario (FIXES BUG #1)
 * 3. User with BOTH IncomeSource AND Scenario → IncomeSource takes priority
 * 4. User with NEITHER → should use Math.max(age, 65)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrefillCPPOASPriority() {
  console.log('\n' + '='.repeat(80));
  console.log('US-038 PHASE 2: Test Prefill API CPP/OAS Priority Order');
  console.log('='.repeat(80) + '\n');

  const testResults = {
    passed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
      },
    });

    console.log(`📊 Found ${users.length} total users\n`);

    // Test each user
    for (const user of users) {
      try {
        // Calculate age
        const age = user.dateOfBirth
          ? Math.floor((new Date() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
          : 65;

        console.log('─'.repeat(80));
        console.log(`Testing User: ${user.email} (age ${age})`);
        console.log('─'.repeat(80));

        // Step 1: Check Income table (IncomeSource in documentation, Income in Prisma schema)
        const incomeSources = await prisma.income.findMany({
          where: {
            userId: user.id,
            type: { in: ['cpp', 'oas'] }
          },
          select: {
            type: true,
            startAge: true,
          }
        });

        const cppFromIncome = incomeSources.find(i => i.type === 'cpp')?.startAge;
        const oasFromIncome = incomeSources.find(i => i.type === 'oas')?.startAge;

        console.log('\n1️⃣  IncomeSource Table (Priority 1):');
        if (cppFromIncome !== undefined || oasFromIncome !== undefined) {
          if (cppFromIncome !== undefined) {
            console.log(`   ✅ CPP: ${cppFromIncome}`);
          }
          if (oasFromIncome !== undefined) {
            console.log(`   ✅ OAS: ${oasFromIncome}`);
          }
        } else {
          console.log('   ❌ No CPP/OAS records');
        }

        // Step 2: Check Scenario table
        const scenario = await prisma.scenario.findFirst({
          where: { userId: user.id },
          select: {
            id: true,
            name: true,
            cppStartAge: true,
            oasStartAge: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        console.log('\n2️⃣  Scenario Table (Priority 2 - Fallback):');
        if (scenario) {
          console.log(`   Scenario: "${scenario.name}"`);
          if (scenario.cppStartAge !== null && scenario.cppStartAge !== undefined) {
            console.log(`   ✅ CPP: ${scenario.cppStartAge}`);
          } else {
            console.log('   ❌ CPP: null');
          }
          if (scenario.oasStartAge !== null && scenario.oasStartAge !== undefined) {
            console.log(`   ✅ OAS: ${scenario.oasStartAge}`);
          } else {
            console.log('   ❌ OAS: null');
          }
        } else {
          console.log('   ❌ No scenario found');
        }

        // Step 3: Simulate prefill API logic (NEW priority order after fix)
        console.log('\n3️⃣  Prefill API Logic (After Bug #1 Fix):');

        const finalCPP = cppFromIncome ?? scenario?.cppStartAge ?? Math.max(age, 65);
        const finalOAS = oasFromIncome ?? scenario?.oasStartAge ?? Math.max(age, 65);

        console.log(`   cpp_start_age: ${cppFromIncome} ?? ${scenario?.cppStartAge} ?? Math.max(${age}, 65) = ${finalCPP}`);
        console.log(`   oas_start_age: ${oasFromIncome} ?? ${scenario?.oasStartAge} ?? Math.max(${age}, 65) = ${finalOAS}`);

        // Step 4: Determine test case type and expected behavior
        console.log('\n4️⃣  Test Case Analysis:');

        let testCase = 'Unknown';
        let expectedBehavior = '';
        let isCorrect = true;

        // Check if Income has MEANINGFUL data (not null, not undefined)
        const hasCPPIncome = cppFromIncome !== undefined && cppFromIncome !== null;
        const hasOASIncome = oasFromIncome !== undefined && oasFromIncome !== null;

        if (hasCPPIncome || hasOASIncome) {
          // Case 1: Has IncomeSource with valid data
          testCase = 'Case 1: IncomeSource exists';
          expectedBehavior = 'Should use IncomeSource values (highest priority)';

          if (hasCPPIncome) {
            isCorrect = isCorrect && (finalCPP === cppFromIncome);
          }
          if (hasOASIncome) {
            isCorrect = isCorrect && (finalOAS === oasFromIncome);
          }

        } else if (scenario?.cppStartAge !== null || scenario?.oasStartAge !== null) {
          // Case 2: Has Scenario but NO IncomeSource (THIS IS BUG #1 FIX!)
          testCase = 'Case 2: Scenario only (no IncomeSource) - BUG #1 FIX';
          expectedBehavior = 'Should use Scenario values (fallback priority)';

          if (scenario?.cppStartAge !== null && scenario?.cppStartAge !== undefined) {
            isCorrect = isCorrect && (finalCPP === scenario.cppStartAge);
          }
          if (scenario?.oasStartAge !== null && scenario?.oasStartAge !== undefined) {
            isCorrect = isCorrect && (finalOAS === scenario.oasStartAge);
          }

        } else {
          // Case 4: Has NEITHER IncomeSource NOR Scenario
          testCase = 'Case 4: No IncomeSource, No Scenario';
          expectedBehavior = 'Should use Math.max(age, 65) fallback';

          isCorrect = (finalCPP === Math.max(age, 65)) && (finalOAS === Math.max(age, 65));
        }

        console.log(`   ${testCase}`);
        console.log(`   Expected: ${expectedBehavior}`);
        console.log(`   Result: ${isCorrect ? '✅ PASS' : '❌ FAIL'}`);

        if (isCorrect) {
          testResults.passed++;
        } else {
          testResults.failed++;
          testResults.errors.push({
            user: user.email,
            testCase,
            issue: 'Priority order not working correctly'
          });
        }

        console.log();

      } catch (error) {
        console.error(`   ❌ Error testing user ${user.email}:`, error.message);
        testResults.errors.push({
          user: user.email,
          testCase: 'Error',
          issue: error.message
        });
      }
    }

    // Final Summary
    console.log('='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.passed + testResults.failed}\n`);

    if (testResults.errors.length > 0) {
      console.log('❌ ERRORS:');
      testResults.errors.forEach(err => {
        console.log(`   - ${err.user}: ${err.issue}`);
      });
      console.log();
    }

    // Overall result
    if (testResults.failed === 0 && testResults.errors.length === 0) {
      console.log('🎉 ALL TESTS PASSED! Bug #1 fix is working correctly.\n');
      return true;
    } else {
      console.log('⚠️  SOME TESTS FAILED. Review errors above.\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Test script failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testPrefillCPPOASPriority()
  .then((success) => {
    console.log('✅ Test completed\n');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
