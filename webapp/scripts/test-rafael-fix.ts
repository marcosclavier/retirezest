#!/usr/bin/env npx tsx
/**
 * Test script to verify the TFSA-First household rebalancing fix
 * Tests Rafael & Lucy scenario from juanclavierb@gmail.com
 */

const PYTHON_API_URL = 'http://localhost:8000';

// Rafael & Lucy's actual data from the database
const rafaelLucyScenario = {
  p1: {
    name: "Rafael",
    start_age: 67,
    cpp_start_age: 65,
    cpp_annual_at_start: 15500,
    oas_start_age: 65,
    oas_annual_at_start: 8500,
    employer_pension_annual: 0,
    rental_income_annual: 0,
    other_income_annual: 0,
    tfsa_balance: 312000,
    rrif_balance: 350000,
    rrsp_balance: 0,
    nonreg_balance: 915000,
    corporate_balance: 0,
    nonreg_acb: 915000,
    nr_cash: 91500,
    nr_gic: 183000,
    nr_invest: 640500,
    y_nr_cash_interest: 2.0,
    y_nr_gic_interest: 3.5,
    y_nr_inv_total_return: 6.0,
    y_nr_inv_elig_div: 2.0,
    y_nr_inv_nonelig_div: 0.5,
    y_nr_inv_capg: 3.0,
    y_nr_inv_roc_pct: 0.5,
    nr_cash_pct: 10.0,
    nr_gic_pct: 20.0,
    nr_invest_pct: 70.0,
    corp_cash_bucket: 0,
    corp_gic_bucket: 0,
    corp_invest_bucket: 0,
    corp_rdtoh: 0,
    y_corp_cash_interest: 2.0,
    y_corp_gic_interest: 3.5,
    y_corp_inv_total_return: 6.0,
    y_corp_inv_elig_div: 2.0,
    y_corp_inv_capg: 3.5,
    corp_cash_pct: 5.0,
    corp_gic_pct: 10.0,
    corp_invest_pct: 85.0,
    corp_dividend_type: "eligible" as const,
    tfsa_room_start: 7000,
    tfsa_contribution_annual: 0,
  },
  p2: {
    name: "Lucy",
    start_age: 70,
    cpp_start_age: 65,
    cpp_annual_at_start: 15500,
    oas_start_age: 65,
    oas_annual_at_start: 8500,
    employer_pension_annual: 0,
    rental_income_annual: 0,
    other_income_annual: 0,
    tfsa_balance: 114000,
    rrif_balance: 22000,
    rrsp_balance: 0,
    nonreg_balance: 183000,
    corporate_balance: 0,
    nonreg_acb: 183000,
    nr_cash: 18300,
    nr_gic: 36600,
    nr_invest: 128100,
    y_nr_cash_interest: 2.0,
    y_nr_gic_interest: 3.5,
    y_nr_inv_total_return: 6.0,
    y_nr_inv_elig_div: 2.0,
    y_nr_inv_nonelig_div: 0.5,
    y_nr_inv_capg: 3.0,
    y_nr_inv_roc_pct: 0.5,
    nr_cash_pct: 10.0,
    nr_gic_pct: 20.0,
    nr_invest_pct: 70.0,
    corp_cash_bucket: 0,
    corp_gic_bucket: 0,
    corp_invest_bucket: 0,
    corp_rdtoh: 0,
    y_corp_cash_interest: 2.0,
    y_corp_gic_interest: 3.5,
    y_corp_inv_total_return: 6.0,
    y_corp_inv_elig_div: 2.0,
    y_corp_inv_capg: 3.5,
    corp_cash_pct: 5.0,
    corp_gic_pct: 10.0,
    corp_invest_pct: 85.0,
    corp_dividend_type: "eligible" as const,
    tfsa_room_start: 7000,
    tfsa_contribution_annual: 0,
  },
  province: "AB",
  start_year: 2025,
  end_age: 95,
  strategy: "tfsa-first",
  spending_go_go: 160000,
  go_go_end_age: 75,
  spending_slow_go: 120000,
  slow_go_end_age: 85,
  spending_no_go: 90000,
  spending_inflation: 2.0,
  general_inflation: 2.0,
  tfsa_room_annual_growth: 7000,
  gap_tolerance: 1000,
  reinvest_nonreg_dist: false,
  income_split_rrif_fraction: 0.0,
  hybrid_rrif_topup_per_person: 0,
  stop_on_fail: false,
};

async function testRafaelScenario() {
  console.log('\n🧪 Testing Rafael & Lucy TFSA-First Strategy Fix\n');
  console.log('=' .repeat(70));

  try {
    const response = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rafaelLucyScenario),
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error('Response:', errorData);
      return;
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ Simulation failed:', data.message);
      if (data.errors) {
        console.error('Errors:', data.errors);
      }
      return;
    }

    console.log('✅ Simulation completed successfully!\n');

    // Check years 2032-2034 for gaps (the problematic years)
    const yearByYear = data.year_by_year || [];
    const problematicYears = [2032, 2033, 2034];

    console.log('📊 Checking Years 2032-2034 (Previously Had Gaps):\n');
    console.log('-'.repeat(70));

    let foundGaps = false;

    for (const targetYear of problematicYears) {
      const yearData = yearByYear.find((y: any) => y.year === targetYear);

      if (yearData) {
        const gap = yearData.spending_gap || 0;
        const tfsaP1 = yearData.tfsa_balance_p1 || 0;
        const tfsaP2 = yearData.tfsa_balance_p2 || 0;
        const tfsaWithdrawalP1 = yearData.tfsa_withdrawal_p1 || 0;
        const tfsaWithdrawalP2 = yearData.tfsa_withdrawal_p2 || 0;
        const totalTax = yearData.total_tax || 0;

        const hasGap = Math.abs(gap) > 1000; // Allowing $1k tolerance
        if (hasGap) foundGaps = true;

        const status = hasGap ? '❌ GAP FOUND' : '✅ FUNDED';

        console.log(`\nYear ${targetYear}: ${status}`);
        console.log(`  Spending Gap:        $${gap.toLocaleString()}`);
        console.log(`  TFSA Balance P1:     $${tfsaP1.toLocaleString()}`);
        console.log(`  TFSA Balance P2:     $${tfsaP2.toLocaleString()}`);
        console.log(`  TFSA Withdrawn P1:   $${tfsaWithdrawalP1.toLocaleString()}`);
        console.log(`  TFSA Withdrawn P2:   $${tfsaWithdrawalP2.toLocaleString()}`);
        console.log(`  Total Tax Paid:      $${totalTax.toLocaleString()}`);
      } else {
        console.log(`\nYear ${targetYear}: ⚠️  Data not found`);
      }
    }

    console.log('\n' + '-'.repeat(70));

    // Summary
    const summary = data.summary || {};
    console.log('\n📈 Overall Simulation Summary:\n');
    console.log(`  Strategy:            ${rafaelLucyScenario.strategy.toUpperCase()}`);
    console.log(`  Years Simulated:     ${summary.years_simulated || 'N/A'}`);
    console.log(`  Years Funded:        ${summary.years_funded || 'N/A'}`);
    console.log(`  Success Rate:        ${(summary.success_rate || 0).toFixed(1)}%`);
    console.log(`  Total Tax Paid:      $${(summary.total_tax_paid || 0).toLocaleString()}`);
    console.log(`  Final Estate:        $${(summary.final_estate_after_tax || 0).toLocaleString()}`);
    console.log(`  Health Score:        ${summary.health_score || 'N/A'}/100 (${summary.health_rating || 'N/A'})`);

    console.log('\n' + '='.repeat(70));

    if (foundGaps) {
      console.log('\n❌ TEST FAILED: Gaps still exist in years 2032-2034');
      console.log('The household rebalancing fix may not be working correctly.\n');
      process.exit(1);
    } else {
      console.log('\n✅ TEST PASSED: No gaps found! The fix is working correctly.');
      console.log('TFSA withdrawals are now properly covering spending needs.\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error running simulation:', error);
    process.exit(1);
  }
}

testRafaelScenario();
