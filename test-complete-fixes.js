#!/usr/bin/env node
/**
 * Comprehensive test for pension display and TFSA allocation fixes
 * Tests Rafael's scenario with $100k pension and $40k surplus
 */

const fetch = require('node-fetch');

async function testSimulation() {
  console.log('========================================');
  console.log('TESTING PENSION & TFSA ALLOCATION FIXES');
  console.log('========================================\n');

  // Rafael's test scenario
  const testPayload = {
    person1: {
      name: "Rafael",
      birthDate: "1966-01-01",
      retirementDate: "2033-01-01",
      rrsp: 100000,
      tfsa: 1000,
      nonreg: 0,
      tfsa_room: 157500,  // Properly calculated accumulated room
      pensions: [{
        name: "Employer Pension",
        amount: 100000,
        startAge: 67,
        inflationIndexed: true
      }]
    },
    person2: null,
    couplesStrategy: "none",
    province: "AB",
    afterTaxSpending: 70000
  };

  console.log('📊 Test Scenario:');
  console.log('  • Rafael, born 1966, retiring 2033 (age 67)');
  console.log('  • Employer pension: $100,000/year');
  console.log('  • TFSA room: $157,500 (accumulated since 2009)');
  console.log('  • After-tax spending: $70,000/year');
  console.log('  • Expected surplus: ~$40,000/year\n');

  try {
    // Call the Next.js API endpoint
    console.log('🚀 Calling simulation API...');
    const response = await fetch('http://localhost:3001/api/run-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Find year 2033 results
    const year2033 = result.years.find(y => y.year === 2033);

    if (!year2033) {
      throw new Error('Year 2033 not found in results');
    }

    console.log('\n✅ YEAR 2033 RESULTS:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Test 1: Pension Income Display
    console.log('\n📌 TEST 1: PENSION INCOME');
    console.log('─────────────────────────');
    const employerPension = year2033.employer_pension_p1 || 0;
    const cpp = year2033.cpp_p1 || 0;
    const oas = year2033.oas_p1 || 0;
    const gis = year2033.gis_p1 || 0;
    const totalBenefits = cpp + oas + gis + employerPension;

    console.log(`  Employer Pension: $${employerPension.toLocaleString()}`);
    console.log(`  CPP: $${cpp.toLocaleString()}`);
    console.log(`  OAS: $${oas.toLocaleString()}`);
    console.log(`  GIS: $${gis.toLocaleString()}`);
    console.log(`  Total Benefits: $${totalBenefits.toLocaleString()}`);

    if (employerPension === 100000) {
      console.log('  ✅ Pension correctly included');
    } else {
      console.log(`  ❌ ERROR: Expected $100,000, got $${employerPension}`);
    }

    // Test 2: Total Inflows
    console.log('\n📌 TEST 2: TOTAL INFLOWS');
    console.log('────────────────────────');
    const withdrawals = (year2033.rrif_withdrawal_p1 || 0) +
                       (year2033.tfsa_withdrawal_p1 || 0) +
                       (year2033.nonreg_withdrawal_p1 || 0) +
                       (year2033.corporate_withdrawal_p1 || 0);
    const nonregDist = year2033.nonreg_distributions || 0;
    const expectedInflows = totalBenefits + withdrawals + nonregDist;

    console.log(`  Government Benefits: $${(cpp + oas + gis).toLocaleString()}`);
    console.log(`  Employer Pension: $${employerPension.toLocaleString()}`);
    console.log(`  Withdrawals: $${withdrawals.toLocaleString()}`);
    console.log(`  NonReg Distributions: $${nonregDist.toLocaleString()}`);
    console.log(`  Expected Total: $${expectedInflows.toLocaleString()}`);

    if (expectedInflows > 150000) {
      console.log('  ✅ Total inflows include pension (~$151k)');
    } else {
      console.log(`  ❌ ERROR: Total inflows too low: $${expectedInflows}`);
    }

    // Test 3: Cash Flow & Surplus
    console.log('\n📌 TEST 3: CASH FLOW & SURPLUS');
    console.log('──────────────────────────────');
    const totalOutflows = (year2033.total_tax || 0) + (year2033.spending_need || 0);
    const netCashFlow = expectedInflows - totalOutflows;

    console.log(`  Total Inflows: $${expectedInflows.toLocaleString()}`);
    console.log(`  Total Tax: $${(year2033.total_tax || 0).toLocaleString()}`);
    console.log(`  Spending Need: $${(year2033.spending_need || 0).toLocaleString()}`);
    console.log(`  Total Outflows: $${totalOutflows.toLocaleString()}`);
    console.log(`  Net Cash Flow: $${netCashFlow.toLocaleString()}`);

    if (netCashFlow > 35000 && netCashFlow < 45000) {
      console.log('  ✅ Surplus ~$40k as expected');
    } else {
      console.log(`  ⚠️  Surplus different than expected: $${netCashFlow}`);
    }

    // Test 4: TFSA Surplus Allocation
    console.log('\n📌 TEST 4: TFSA SURPLUS ALLOCATION');
    console.log('───────────────────────────────────');
    const tfsaReinvest = year2033.tfsa_reinvest_p1 || 0;
    const nonregReinvest = year2033.reinvest_nonreg_p1 || 0;
    const totalReinvest = tfsaReinvest + nonregReinvest;

    console.log(`  Available TFSA Room: $157,500`);
    console.log(`  Surplus to Allocate: $${Math.round(netCashFlow).toLocaleString()}`);
    console.log(`  → TFSA Reinvestment: $${tfsaReinvest.toLocaleString()}`);
    console.log(`  → Non-Reg Reinvestment: $${nonregReinvest.toLocaleString()}`);
    console.log(`  Total Reinvested: $${totalReinvest.toLocaleString()}`);

    if (tfsaReinvest >= 35000) {
      console.log('  ✅ TFSA getting full surplus (not limited to $7k)');
    } else if (tfsaReinvest === 7000) {
      console.log('  ❌ ERROR: TFSA still limited to $7,000');
    } else {
      console.log(`  ⚠️  TFSA reinvestment: $${tfsaReinvest}`);
    }

    // Test 5: Account Balances
    console.log('\n📌 TEST 5: END BALANCES');
    console.log('────────────────────────');
    console.log(`  RRIF: $${(year2033.rrif_balance_p1 || 0).toLocaleString()}`);
    console.log(`  TFSA: $${(year2033.tfsa_balance_p1 || 0).toLocaleString()}`);
    console.log(`  Non-Reg: $${(year2033.nonreg_balance_p1 || 0).toLocaleString()}`);
    console.log(`  Corporate: $${(year2033.corporate_balance_p1 || 0).toLocaleString()}`);
    console.log(`  Total: $${(year2033.total_value || 0).toLocaleString()}`);

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const tests = [
      { name: 'Pension in data', pass: employerPension === 100000 },
      { name: 'Total inflows > $150k', pass: expectedInflows > 150000 },
      { name: 'Surplus ~$40k', pass: netCashFlow > 35000 && netCashFlow < 45000 },
      { name: 'TFSA gets > $7k', pass: tfsaReinvest > 7000 },
    ];

    const passed = tests.filter(t => t.pass).length;
    const failed = tests.filter(t => !t.pass).length;

    tests.forEach(test => {
      console.log(`  ${test.pass ? '✅' : '❌'} ${test.name}`);
    });

    console.log(`\n  Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Fixes are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results above.');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nMake sure:');
    console.error('1. Next.js dev server is running on port 3001');
    console.error('2. Python API server is running on port 8000');
  }
}

// Run the test
testSimulation().catch(console.error);