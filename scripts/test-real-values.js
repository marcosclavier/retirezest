const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRealValues() {
  console.log('=== TESTING FIX WITH REAL VALUES ===\n');

  // Test with Stacy's actual scenario
  const payload = {
    p1: {
      name: "Test Person",
      age: 60,  // Start at retirement age
      birth_year: 2029 - 60,
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

      // Non-registered
      nonreg_balance: 0,
      nonreg_acb: 0,

      // Corporate
      corp_balance: 0,

      // Government benefits (will start at 65)
      cpp_amount: 0,
      cpp_start_age: 65,
      oas_amount: 0,
      oas_start_age: 65,

      // Income
      pension_incomes: [],
      other_incomes: [],

      // Yields
      y_rrsp_growth: 5.0,
      y_rrif_growth: 5.0,
      y_tfsa_growth: 5.0,
    },
    p2: {
      age: 63,
      birth_year: 2029 - 63,
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
    province: 'ON',
    spending_go_go: 60000,
    strategy: 'balanced'
  };

  console.log('📤 TEST SCENARIO:');
  console.log('   P1 Age: 60 (STARTING at retirement)');
  console.log('   P1 RRSP: $390,000');
  console.log('   P1 TFSA: $7,000');
  console.log('   P2 Age: 63');
  console.log('   P2 TFSA: $7,000');
  console.log('   Spending Target: $60,000/year');
  console.log('   Strategy: Balanced');
  console.log('');

  try {
    const response = await fetch('http://localhost:8000/api/run-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ API Error:', response.status, response.statusText);
      console.log(error);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.log('❌ Simulation failed:', result.message);
      return;
    }

    console.log('✅ Simulation SUCCESS\n');

    if (!result.year_by_year || result.year_by_year.length === 0) {
      console.log('❌ No year results');
      return;
    }

    // Check first year (age 60) - should have withdrawals
    const firstYear = result.year_by_year[0];

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`FIRST YEAR (${firstYear.year}, Age P1: ${firstYear.age_p1}, Age P2: ${firstYear.age_p2})`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📊 RRSP/RRIF BALANCES:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`  RRSP Start P1:      $${(firstYear.rrsp_start_p1 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  RRSP End P1:        $${(firstYear.rrsp_end_p1 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  RRIF Start P1:      $${(firstYear.rrif_start_p1 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  RRIF End P1:        $${(firstYear.rrif_balance_p1 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log('');

    console.log('💰 WITHDRAWALS:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`  RRIF Withdrawal P1: $${(firstYear.rrif_withdrawal_p1 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  TFSA Withdrawal P1: $${(firstYear.tfsa_withdrawal_p1 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  TFSA Withdrawal P2: $${(firstYear.tfsa_withdrawal_p2 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  Total Withdrawals:  $${((firstYear.rrif_withdrawal_p1 || 0) + (firstYear.tfsa_withdrawal_p1 || 0) + (firstYear.tfsa_withdrawal_p2 || 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log('');

    console.log('📈 TFSA BALANCES:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`  TFSA Start P1:      $${(firstYear.tfsa_start_p1 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  TFSA End P1:        $${(firstYear.tfsa_balance_p1 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  TFSA Start P2:      $${(firstYear.tfsa_start_p2 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log(`  TFSA End P2:        $${(firstYear.tfsa_balance_p2 || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    console.log('');

    // Verify the math
    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    let allGood = true;

    // Check RRSP starting balance
    if (firstYear.rrsp_start_p1 > 0) {
      console.log('✅ RRSP starting balance is reported');
    } else {
      console.log('❌ RRSP starting balance is $0 (should be $390,000)');
      allGood = false;
    }

    // Check RRIF withdrawals are happening
    if (firstYear.rrif_withdrawal_p1 > 0) {
      console.log('✅ RRIF withdrawals are being made');
    } else {
      console.log('⚠️  No RRIF withdrawals in first year (might be using TFSA first)');
    }

    // Check TFSA starting balances
    if (firstYear.tfsa_start_p1 === 7000) {
      console.log('✅ TFSA P1 starting balance is correct ($7,000)');
    } else {
      console.log(`❌ TFSA P1 starting balance is $${firstYear.tfsa_start_p1} (should be $7,000)`);
      allGood = false;
    }

    if (firstYear.tfsa_start_p2 === 7000) {
      console.log('✅ TFSA P2 starting balance is correct ($7,000)');
    } else {
      console.log(`❌ TFSA P2 starting balance is $${firstYear.tfsa_start_p2} (should be $7,000)`);
      allGood = false;
    }

    // Check that withdrawals are happening
    const totalWithdrawals = (firstYear.rrif_withdrawal_p1 || 0) +
                             (firstYear.tfsa_withdrawal_p1 || 0) +
                             (firstYear.tfsa_withdrawal_p2 || 0);
    if (totalWithdrawals > 0) {
      console.log(`✅ Total withdrawals: $${totalWithdrawals.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    } else {
      console.log('❌ No withdrawals happening');
      allGood = false;
    }

    console.log('');

    if (allGood) {
      console.log('🎉 ALL CHECKS PASSED - Fix is working correctly!\n');
    } else {
      console.log('🚨 SOME CHECKS FAILED - Fix needs more work\n');
    }

    // Show next few years to see progression
    console.log('═══════════════════════════════════════════════════════════');
    console.log('NEXT 4 YEARS (Year-over-Year Progression)');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (let i = 1; i < Math.min(5, result.year_by_year.length); i++) {
      const year = result.year_by_year[i];
      console.log(`Year ${year.year} (Age ${year.age_p1}/${year.age_p2}):`);
      console.log(`  RRSP: Start=$${(year.rrsp_start_p1 || 0).toFixed(0)}, End=$${(year.rrsp_end_p1 || 0).toFixed(0)}`);
      console.log(`  RRIF: Start=$${(year.rrif_start_p1 || 0).toFixed(0)}, End=$${(year.rrif_balance_p1 || 0).toFixed(0)}, Withdrawal=$${(year.rrif_withdrawal_p1 || 0).toFixed(0)}`);
      console.log(`  TFSA: P1=$${(year.tfsa_balance_p1 || 0).toFixed(0)}, P2=$${(year.tfsa_balance_p2 || 0).toFixed(0)}`);
      console.log('');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  await prisma.$disconnect();
}

testRealValues();
