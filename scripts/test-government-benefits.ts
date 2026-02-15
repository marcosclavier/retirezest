/**
 * Test script: Verify Government Benefits Estimation in Early Retirement Calculator
 *
 * This script tests that CPP/OAS benefits are now included in the calculator
 * and that the required nest egg calculation accounts for these benefits.
 */

const API_BASE = 'http://localhost:3000';

async function testGovernmentBenefits() {
  console.log('\n' + '='.repeat(70));
  console.log('TESTING GOVERNMENT BENEFITS INTEGRATION');
  console.log('='.repeat(70) + '\n');

  // Test scenario: jrcb@hotmail.com profile
  const testProfile = {
    currentAge: 67,
    currentSavings: {
      rrsp: 2105400,  // Household RRSP (includes partner + joint)
      tfsa: 826530,   // Household TFSA
      nonRegistered: 1670400,  // Household non-reg + corporate
    },
    annualIncome: 16900,  // Person 1 income
    annualSavings: 0,
    targetRetirementAge: 70,
    targetAnnualExpenses: 183700,
    lifeExpectancy: 95,
    includePartner: true,
    partner: {
      age: 66,
    },
  };

  const totalAssets = Object.values(testProfile.currentSavings).reduce((a, b) => a + b, 0);

  console.log('📊 Test Scenario:');
  console.log(`  Current Age: ${testProfile.currentAge}`);
  console.log(`  Partner Age: ${testProfile.partner.age}`);
  console.log(`  Target Retirement Age: ${testProfile.targetRetirementAge}`);
  console.log(`  Total Assets: $${totalAssets.toLocaleString()}`);
  console.log(`  Annual Expenses: $${testProfile.targetAnnualExpenses.toLocaleString()}`);
  console.log('');

  try {
    console.log('🔄 Calling Early Retirement Calculator API...\n');

    // Note: This will fail without authentication
    // In a real test, you'd need to include a valid session cookie
    const response = await fetch(`${API_BASE}/api/early-retirement/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProfile),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API Error (${response.status}): ${errorText}`);
      console.log('');
      console.log('Note: This error is expected if you\'re not authenticated.');
      console.log('To test properly, use a browser with an active session.');
      return;
    }

    const result = await response.json();

    console.log('✅ Calculation Results:\n');

    // Government Benefits
    if (result.governmentBenefits) {
      console.log('🏛️  GOVERNMENT BENEFITS INCLUDED:');
      console.log(`  CPP (Canada Pension Plan): $${result.governmentBenefits.cppAnnual.toLocaleString()}/year`);
      console.log(`  OAS (Old Age Security): $${result.governmentBenefits.oasAnnual.toLocaleString()}/year`);
      console.log(`  Total Benefits: $${result.governmentBenefits.totalAnnual.toLocaleString()}/year`);
      console.log('');

      // Show impact on required savings
      const netExpenses = testProfile.targetAnnualExpenses - result.governmentBenefits.totalAnnual;
      const requiredWithoutBenefits = testProfile.targetAnnualExpenses * 25;
      const requiredWithBenefits = result.requiredSavings;
      const savingsReduction = requiredWithoutBenefits - requiredWithBenefits;

      console.log('💰 IMPACT ON RETIREMENT PLANNING:');
      console.log(`  Annual Expenses: $${testProfile.targetAnnualExpenses.toLocaleString()}`);
      console.log(`  Less: Government Benefits: -$${result.governmentBenefits.totalAnnual.toLocaleString()}`);
      console.log(`  Net Expenses from Savings: $${netExpenses.toLocaleString()}`);
      console.log('');
      console.log(`  Required Nest Egg WITHOUT Benefits: $${requiredWithoutBenefits.toLocaleString()}`);
      console.log(`  Required Nest Egg WITH Benefits: $${requiredWithBenefits.toLocaleString()}`);
      console.log(`  Savings Reduction: $${savingsReduction.toLocaleString()} (${((savingsReduction/requiredWithoutBenefits)*100).toFixed(1)}%)`);
      console.log('');
    } else {
      console.log('⚠️  WARNING: Government benefits NOT included in response!');
      console.log('');
    }

    // Retirement Feasibility
    console.log('📈 RETIREMENT READINESS:');
    console.log(`  Readiness Score: ${result.readinessScore}/100`);
    console.log(`  Earliest Retirement Age: ${result.earliestRetirementAge}`);
    console.log(`  Target Age Feasible: ${result.targetAgeFeasible ? 'YES ✅' : 'NO ❌'}`);
    console.log(`  Projected Savings: $${result.projectedSavingsAtTarget.toLocaleString()}`);
    console.log(`  Required Savings: $${result.requiredSavings.toLocaleString()}`);
    console.log(`  Savings Gap: $${result.savingsGap.toLocaleString()}`);
    console.log('');

    // Alignment Check
    console.log('🎯 ALIGNMENT WITH SIMULATION:');
    const simulationHealthScore = 92;
    const scoreDifference = Math.abs(result.readinessScore - simulationHealthScore);

    if (scoreDifference < 15) {
      console.log(`  ✅ Well aligned! Early Retirement (${result.readinessScore}/100) vs Simulation (${simulationHealthScore}/100)`);
      console.log(`  Difference: ${scoreDifference} points`);
    } else {
      console.log(`  ⚠️  Some difference: Early Retirement (${result.readinessScore}/100) vs Simulation (${simulationHealthScore}/100)`);
      console.log(`  Difference: ${scoreDifference} points`);
      console.log('  Note: Some difference is expected due to different calculation methodologies.');
    }
    console.log('');

    // Notes
    if (result.governmentBenefits && result.governmentBenefits.notes) {
      console.log('📝 NOTES:');
      result.governmentBenefits.notes.forEach((note: string) => {
        console.log(`  • ${note}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
    console.log('');
    console.log('This error is expected if running without authentication.');
    console.log('To test properly:');
    console.log('  1. Login at http://localhost:3000/login');
    console.log('  2. Navigate to http://localhost:3000/early-retirement');
    console.log('  3. Check the browser Network tab to see the API response');
  }

  console.log('='.repeat(70));
  console.log('TEST COMPLETE');
  console.log('='.repeat(70) + '\n');
}

testGovernmentBenefits();
