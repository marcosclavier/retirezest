const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSimulationEndToEnd() {
  console.log('=== END-TO-END SIMULATION TEST ===\n');

  // Test payload similar to Stacy's scenario
  const testPayload = {
    p1: {
      age: 60,
      birth_year: 1969,
      retirement_age: 60,
      life_expectancy: 95,
      sex: 'F',

      // RRSP/RRIF
      rrsp_balance: 390000,
      rrif_balance: 0,
      age_rrsp_convert: 71,

      // TFSA
      tfsa_balance: 7000,
      tfsa_contrib_room: 0,

      // Non-registered (set to 0 like Stacy)
      nonreg_balance: 0,
      nonreg_acb: 0,
      nr_cash: 0,
      nr_gic: 0,
      nr_invest: 0,

      // Corporate
      corp_balance: 0,

      // Government benefits
      cpp_amount: 0,
      cpp_start_age: 65,
      oas_amount: 0,
      oas_start_age: 65,

      // Income
      pension_incomes: [],
      other_incomes: [],

      // Yields (test with explicit 5%)
      y_rrsp_growth: 5.0,
      y_rrif_growth: 5.0,
      y_tfsa_growth: 5.0,
      y_nr_cash_interest: 2.0,
      y_nr_gic_interest: 3.5,
      y_nr_inv_total_return: 6.0,
    },
    p2: {
      age: 63,
      birth_year: 1966,
      retirement_age: 63,
      life_expectancy: 95,
      sex: 'M',

      rrsp_balance: 0,
      rrif_balance: 0,
      tfsa_balance: 7000,
      nonreg_balance: 0,
      corp_balance: 0,

      cpp_amount: 0,
      cpp_start_age: 65,
      oas_amount: 0,
      oas_start_age: 65,

      pension_incomes: [],
      other_incomes: [],
    },
    household: {
      province: 'ON',
      spending_target: 60000,
      home_value: 0,
      mortgage_balance: 0,
    }
  };

  console.log('📤 TEST PAYLOAD:');
  console.log('   P1 Age:', testPayload.p1.age);
  console.log('   P1 RRSP:', testPayload.p1.rrsp_balance);
  console.log('   P1 RRIF:', testPayload.p1.rrif_balance);
  console.log('   P1 TFSA:', testPayload.p1.tfsa_balance);
  console.log('   P1 RRSP Yield:', testPayload.p1.y_rrsp_growth + '%');
  console.log('   P1 RRIF Yield:', testPayload.p1.y_rrif_growth + '%');
  console.log('   Spending Target:', testPayload.household.spending_target);

  console.log('\n🔌 Calling Python API...\n');

  const API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${API_URL}/api/run-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p1: testPayload.p1,
        p2: testPayload.p2,
        province: testPayload.household.province,
        spending_go_go: testPayload.household.spending_target,
        strategy: 'balanced'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, response.statusText);
      console.log('Error details:', errorText);
      return;
    }

    const result = await response.json();

    console.log('✅ API Response Received\n');

    if (!result.year_by_year || result.year_by_year.length === 0) {
      console.log('❌ No year-by-year results returned');
      return;
    }

    console.log('📊 SIMULATION RESULTS:\n');

    // Analyze first year
    const firstYear = result.year_by_year[0];

    console.log(`Year ${firstYear.year} (Age P1: ${firstYear.age_p1}, Age P2: ${firstYear.age_p2}):`);
    console.log('');

    console.log('RRSP/RRIF:');
    console.log('  P1 RRSP Start:     $' + (firstYear.rrsp_start_p1 || 0).toFixed(2));
    console.log('  P1 RRSP Return:    $' + (firstYear.rrsp_return_p1 || 0).toFixed(2));
    console.log('  P1 RRSP Withdraw:  $' + (firstYear.rrsp_withdrawal_p1 || 0).toFixed(2));
    console.log('  P1 RRSP End:       $' + (firstYear.rrsp_end_p1 || 0).toFixed(2));
    console.log('');
    console.log('  P1 RRIF Start:     $' + (firstYear.rrif_start_p1 || 0).toFixed(2));
    console.log('  P1 RRIF Return:    $' + (firstYear.rrif_return_p1 || 0).toFixed(2));
    console.log('  P1 RRIF Withdraw:  $' + (firstYear.rrif_withdrawal_p1 || 0).toFixed(2));
    console.log('  P1 RRIF End:       $' + (firstYear.rrif_end_p1 || 0).toFixed(2));
    console.log('');

    if (firstYear.rrsp_to_rrif_p1) {
      console.log('  🔄 RRSP→RRIF:      $' + firstYear.rrsp_to_rrif_p1.toFixed(2));
      console.log('');
    }

    const totalStart = (firstYear.rrsp_start_p1 || 0) + (firstYear.rrif_start_p1 || 0);
    const totalReturn = (firstYear.rrsp_return_p1 || 0) + (firstYear.rrif_return_p1 || 0);
    const totalWithdraw = (firstYear.rrsp_withdrawal_p1 || 0) + (firstYear.rrif_withdrawal_p1 || 0);
    const totalEnd = (firstYear.rrsp_end_p1 || 0) + (firstYear.rrif_end_p1 || 0);

    console.log('TOTALS:');
    console.log('  Total Start:       $' + totalStart.toFixed(2));
    console.log('  Total Return:      $' + totalReturn.toFixed(2));
    console.log('  Total Withdraw:    $' + totalWithdraw.toFixed(2));
    console.log('  Total End:         $' + totalEnd.toFixed(2));
    console.log('');

    // Math verification
    const expected = totalStart + totalReturn - totalWithdraw;
    const diff = Math.abs(totalEnd - expected);

    console.log('MATH CHECK:');
    console.log('  $' + totalStart.toFixed(2) + ' + $' + totalReturn.toFixed(2) + ' - $' + totalWithdraw.toFixed(2) + ' = $' + expected.toFixed(2));
    console.log('  Actual End: $' + totalEnd.toFixed(2));
    console.log('  Difference: $' + diff.toFixed(2));

    if (diff > 1) {
      console.log('  ❌ MATH ERROR!');
    } else {
      console.log('  ✅ Math correct');
    }
    console.log('');

    // Yield verification
    if (totalStart > 0 && totalReturn > 0) {
      const impliedYield = (totalReturn / totalStart) * 100;
      console.log('YIELD CHECK:');
      console.log('  Return / Start = Yield');
      console.log('  $' + totalReturn.toFixed(2) + ' / $' + totalStart.toFixed(2) + ' = ' + impliedYield.toFixed(2) + '%');
      console.log('  Expected: 5%');

      if (Math.abs(impliedYield - 5) > 0.5) {
        console.log('  ⚠️  Yield differs from expected 5%');
      } else {
        console.log('  ✅ Yield matches expected 5%');
      }
    } else {
      console.log('YIELD CHECK:');
      console.log('  ❌ Cannot calculate yield (Start=$' + totalStart.toFixed(2) + ', Return=$' + totalReturn.toFixed(2) + ')');

      if (totalStart === 0) {
        console.log('  🚨 CRITICAL: Starting balance is $0 (should be $390,000)!');
      }
    }
    console.log('');

    // Check TFSA
    console.log('TFSA:');
    console.log('  P1 TFSA Start:     $' + (firstYear.tfsa_start_p1 || 0).toFixed(2));
    console.log('  P1 TFSA End:       $' + (firstYear.tfsa_end_p1 || 0).toFixed(2));
    console.log('  P2 TFSA Start:     $' + (firstYear.tfsa_start_p2 || 0).toFixed(2));
    console.log('  P2 TFSA End:       $' + (firstYear.tfsa_end_p2 || 0).toFixed(2));
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('TEST SUMMARY:');
    console.log('='.repeat(60));

    let passed = true;

    if (totalStart === 0) {
      console.log('❌ FAIL: Starting RRSP/RRIF balance is $0 (expected $390,000)');
      passed = false;
    } else if (Math.abs(totalStart - 390000) > 100) {
      console.log('⚠️  WARNING: Starting balance is $' + totalStart.toFixed(2) + ' (expected $390,000)');
    } else {
      console.log('✅ PASS: Starting balance correct (~$390,000)');
    }

    if (diff > 1) {
      console.log('❌ FAIL: Math doesn\'t add up (difference: $' + diff.toFixed(2) + ')');
      passed = false;
    } else {
      console.log('✅ PASS: Math is correct');
    }

    if (totalReturn > 0 && totalStart > 0) {
      const impliedYield = (totalReturn / totalStart) * 100;
      if (Math.abs(impliedYield - 5) > 0.5) {
        console.log('⚠️  WARNING: Yield is ' + impliedYield.toFixed(2) + '% (expected 5%)');
      } else {
        console.log('✅ PASS: Yield is correct (~5%)');
      }
    }

    console.log('');
    if (passed) {
      console.log('🎉 ALL TESTS PASSED - Backend is working correctly!');
    } else {
      console.log('🚨 TESTS FAILED - Backend has issues!');
    }

  } catch (error) {
    console.log('❌ Error calling API:', error.message);
    console.log('');
    console.log('Make sure the Python API is running:');
    console.log('  cd juan-retirement-app');
    console.log('  uvicorn api.main:app --reload');
  }

  await prisma.$disconnect();
}

testSimulationEndToEnd();
