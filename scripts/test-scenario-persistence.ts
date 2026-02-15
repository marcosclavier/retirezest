/**
 * Test script for scenario persistence functionality
 * Tests saving, loading, updating, and deleting scenarios
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('🧪 Starting Scenario Persistence Tests...\n');

  let testUserId: string | null = null;
  let testScenarioId: string | null = null;

  try {
    // Test 1: Find or create a test user
    console.log('Test 1: Setting up test user...');
    let testUser = await prisma.user.findFirst({
      where: {
        email: 'test-scenarios@example.com',
      },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-scenarios@example.com',
          passwordHash: 'test-hash-not-real',
          firstName: 'Test',
          lastName: 'User',
          subscriptionTier: 'free',
          emailVerified: true,
        },
      });
      console.log('✅ Created test user');
    } else {
      console.log('✅ Using existing test user');
    }

    testUserId = testUser.id;
    results.push({ test: 'Setup test user', passed: true });

    // Test 2: Create a saved scenario
    console.log('\nTest 2: Creating a saved scenario...');
    const mockInputData = {
      p1: {
        age: 55,
        retirement_age: 65,
        life_expectancy: 95,
        rrsp_balance: 500000,
        tfsa_balance: 100000,
        non_reg_balance: 50000,
        employment_income: 80000,
        pension_income: 0,
        cpp_start_age: 65,
        oas_start_age: 65,
        tfsa_contribution_annual: 7000,
      },
      p2: {
        age: 53,
        retirement_age: 65,
        life_expectancy: 95,
        rrsp_balance: 400000,
        tfsa_balance: 80000,
        non_reg_balance: 30000,
        employment_income: 70000,
        pension_income: 0,
        cpp_start_age: 65,
        oas_start_age: 65,
        tfsa_contribution_annual: 7000,
      },
      province: 'ON',
      strategy: 'corporate-optimized',
      spending_go_go: 60000,
      spending_slow_go: 45000,
      spending_no_go: 35000,
    };

    const scenario = await prisma.savedSimulationScenario.create({
      data: {
        userId: testUserId,
        name: 'Test Scenario - Baseline',
        description: 'Test scenario for automated testing',
        scenarioType: 'baseline',
        inputData: JSON.stringify(mockInputData),
        hasResults: false,
      },
    });

    testScenarioId = scenario.id;
    console.log(`✅ Created scenario with ID: ${scenario.id}`);
    results.push({ test: 'Create scenario', passed: true });

    // Test 3: Retrieve the scenario
    console.log('\nTest 3: Retrieving saved scenario...');
    const retrieved = await prisma.savedSimulationScenario.findUnique({
      where: { id: testScenarioId },
    });

    if (!retrieved) {
      throw new Error('Failed to retrieve scenario');
    }

    const parsedInput = JSON.parse(retrieved.inputData);
    if (parsedInput.p1.age !== 55) {
      throw new Error('Input data not correctly saved/retrieved');
    }

    console.log('✅ Successfully retrieved scenario with correct data');
    results.push({ test: 'Retrieve scenario', passed: true });

    // Test 4: Update scenario
    console.log('\nTest 4: Updating scenario...');
    await prisma.savedSimulationScenario.update({
      where: { id: testScenarioId },
      data: {
        isFavorite: true,
        hasResults: true,
        results: JSON.stringify({ success: true, summary: { years_funded: 30 } }),
      },
    });

    const updated = await prisma.savedSimulationScenario.findUnique({
      where: { id: testScenarioId },
    });

    if (!updated?.isFavorite || !updated.hasResults) {
      throw new Error('Scenario not updated correctly');
    }

    console.log('✅ Successfully updated scenario');
    results.push({ test: 'Update scenario', passed: true });

    // Test 5: List scenarios for user
    console.log('\nTest 5: Listing scenarios for user...');
    const userScenarios = await prisma.savedSimulationScenario.findMany({
      where: { userId: testUserId },
      orderBy: [
        { isFavorite: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (userScenarios.length === 0) {
      throw new Error('No scenarios found for user');
    }

    console.log(`✅ Found ${userScenarios.length} scenario(s) for user`);
    results.push({ test: 'List scenarios', passed: true });

    // Test 6: Test freemium limits
    console.log('\nTest 6: Testing freemium limits...');
    const userWithScenarios = await prisma.user.findUnique({
      where: { id: testUserId },
      select: {
        subscriptionTier: true,
        savedSimulationScenarios: {
          select: { id: true },
        },
      },
    });

    const scenarioCount = userWithScenarios?.savedSimulationScenarios.length || 0;
    const isPremium = userWithScenarios?.subscriptionTier === 'premium';

    console.log(`   User tier: ${userWithScenarios?.subscriptionTier}`);
    console.log(`   Scenario count: ${scenarioCount}`);
    console.log(`   Can save more: ${isPremium || scenarioCount < 3 ? 'Yes' : 'No'}`);

    if (!isPremium && scenarioCount > 3) {
      throw new Error('Freemium limit not enforced - user has more than 3 scenarios');
    }

    console.log('✅ Freemium limits check passed');
    results.push({ test: 'Freemium limits', passed: true });

    // Test 7: Create multiple scenarios (test limit)
    console.log('\nTest 7: Testing scenario creation limits...');
    const scenariosToCreate = 3 - scenarioCount;

    if (scenariosToCreate > 0 && !isPremium) {
      for (let i = 0; i < scenariosToCreate; i++) {
        await prisma.savedSimulationScenario.create({
          data: {
            userId: testUserId,
            name: `Test Scenario ${i + 2}`,
            description: 'Additional test scenario',
            scenarioType: 'custom',
            inputData: JSON.stringify(mockInputData),
            hasResults: false,
          },
        });
      }
      console.log(`✅ Created ${scenariosToCreate} additional scenarios`);
    } else {
      console.log('✅ User already at or over free limit, skipping creation');
    }

    results.push({ test: 'Multiple scenario creation', passed: true });

    // Test 8: Verify ordering (favorites first)
    console.log('\nTest 8: Verifying scenario ordering...');
    const orderedScenarios = await prisma.savedSimulationScenario.findMany({
      where: { userId: testUserId },
      orderBy: [
        { isFavorite: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        isFavorite: true,
      },
    });

    if (orderedScenarios.length > 0 && orderedScenarios[0].isFavorite) {
      console.log('✅ Favorite scenario appears first');
    } else if (orderedScenarios.every(s => !s.isFavorite)) {
      console.log('✅ No favorites - ordering by created date');
    } else {
      throw new Error('Ordering not working correctly');
    }

    results.push({ test: 'Scenario ordering', passed: true });

    // Test 9: Delete scenario
    console.log('\nTest 9: Deleting scenario...');
    if (testScenarioId) {
      await prisma.savedSimulationScenario.delete({
        where: { id: testScenarioId },
      });

      const deleted = await prisma.savedSimulationScenario.findUnique({
        where: { id: testScenarioId },
      });

      if (deleted) {
        throw new Error('Scenario not deleted');
      }

      console.log('✅ Successfully deleted scenario');
      results.push({ test: 'Delete scenario', passed: true });
    }

    // Clean up remaining test scenarios
    console.log('\nCleaning up test scenarios...');
    await prisma.savedSimulationScenario.deleteMany({
      where: {
        userId: testUserId,
        name: { startsWith: 'Test Scenario' },
      },
    });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed:', error);
    results.push({
      test: 'Current test',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await prisma.$disconnect();
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
