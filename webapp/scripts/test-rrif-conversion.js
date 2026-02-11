const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRRIFConversion() {
  console.log('=== TESTING RRSP TO RRIF CONVERSION ===\n');

  // Test with person starting at age 68, so we can see conversion at 71
  const payload = {
    p1: {
      name: "Test Person",
      start_age: 68,  // Start close to conversion age
      rrsp_balance: 500000,
      rrif_balance: 0,
      tfsa_balance: 10000,
      nonreg_balance: 0,
      corporate_balance: 0,
      cpp_start_age: 70,
      cpp_annual_at_start: 15000,
      oas_start_age: 70,
      oas_annual_at_start: 8500,
    },
    p2: {
      name: "Person 2",
      start_age: 68,
      rrsp_balance: 0,
      rrif_balance: 0,
      tfsa_balance: 10000,
      nonreg_balance: 0,
      corporate_balance: 0,
      cpp_start_age: 70,
      cpp_annual_at_start: 15000,
      oas_start_age: 70,
      oas_annual_at_start: 8500,
    },
    province: 'ON',
    spending_go_go: 60000,
    strategy: 'balanced'
  };

  console.log('📤 TEST SCENARIO:');
  console.log('   P1 Start Age: 68');
  console.log('   P1 RRSP: $500,000');
  console.log('   P1 TFSA: $10,000');
  console.log('   Spending: $60,000/year');
  console.log('   Looking for RRSP→RRIF conversion at age 71\n');

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

    console.log('═══════════════════════════════════════════════════════════');
    console.log('YEAR-BY-YEAR RRSP/RRIF TRACKING');
    console.log('═══════════════════════════════════════════════════════════\n');

    let conversionFound = false;

    for (let i = 0; i < Math.min(8, result.year_by_year.length); i++) {
      const year = result.year_by_year[i];

      console.log(`Year ${year.year} (Age ${year.age_p1}):`);
      console.log(`  RRSP: Start=$${(year.rrsp_start_p1 || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}, End=$${(year.rrsp_end_p1 || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}`);
      console.log(`  RRIF: Start=$${(year.rrif_start_p1 || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}, End=$${(year.rrif_balance_p1 || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}`);
      console.log(`  RRIF Withdrawal: $${(year.rrif_withdrawal_p1 || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}`);

      if (year.rrsp_to_rrif_p1 && year.rrsp_to_rrif_p1 > 0) {
        console.log(`  🔄 CONVERSION: $${year.rrsp_to_rrif_p1.toLocaleString('en-US', {maximumFractionDigits: 0})} RRSP → RRIF`);
        conversionFound = true;
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Find the year where conversion should happen (age 71)
    const age71Year = result.year_by_year.find(y => y.age_p1 === 71);

    if (!age71Year) {
      console.log('⚠️  Could not find age 71 in results');
    } else {
      console.log(`Age 71 (Year ${age71Year.year}):`);

      if (age71Year.rrsp_to_rrif_p1 > 0) {
        console.log(`✅ RRSP→RRIF conversion tracked: $${age71Year.rrsp_to_rrif_p1.toLocaleString('en-US', {maximumFractionDigits: 0})}`);
      } else {
        console.log('❌ RRSP→RRIF conversion NOT tracked (field is $0)');
      }

      if (age71Year.rrsp_start_p1 > 0 && age71Year.rrsp_end_p1 === 0) {
        console.log('✅ RRSP balance went from positive to $0 (conversion happened)');
      } else {
        console.log(`⚠️  RRSP balance: Start=$${age71Year.rrsp_start_p1}, End=$${age71Year.rrsp_end_p1}`);
      }

      if (age71Year.rrif_start_p1 === 0 && age71Year.rrif_balance_p1 > 0) {
        console.log('✅ RRIF balance went from $0 to positive (received conversion)');
      } else {
        console.log(`⚠️  RRIF balance: Start=$${age71Year.rrif_start_p1}, End=$${age71Year.rrif_balance_p1}`);
      }

      if (age71Year.rrif_withdrawal_p1 > 0) {
        console.log(`✅ RRIF minimum withdrawal taken: $${age71Year.rrif_withdrawal_p1.toLocaleString('en-US', {maximumFractionDigits: 0})}`);
      } else {
        console.log('⚠️  No RRIF withdrawal at age 71 (might be using other accounts)');
      }
    }

    // Check age 72 to see ongoing RRIF withdrawals
    const age72Year = result.year_by_year.find(y => y.age_p1 === 72);

    if (age72Year) {
      console.log(`\nAge 72 (Year ${age72Year.year}):`);
      console.log(`  RRIF Start: $${(age72Year.rrif_start_p1 || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}`);
      console.log(`  RRIF End: $${(age72Year.rrif_balance_p1 || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}`);
      console.log(`  RRIF Withdrawal: $${(age72Year.rrif_withdrawal_p1 || 0).toLocaleString('en-US', {maximumFractionDigits: 0})}`);

      if (age72Year.rrif_start_p1 > 0 && age72Year.rrif_withdrawal_p1 > 0) {
        const withdrawalPct = (age72Year.rrif_withdrawal_p1 / age72Year.rrif_start_p1 * 100).toFixed(2);
        console.log(`  Withdrawal Rate: ${withdrawalPct}% (RRIF minimum ~5.4% at age 72)`);
      }
    }

    console.log('');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  await prisma.$disconnect();
}

testRRIFConversion();
