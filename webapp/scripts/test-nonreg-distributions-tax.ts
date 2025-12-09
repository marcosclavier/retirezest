/**
 * Test script to verify non-registered distributions are taxed correctly
 * regardless of reinvestment setting (phantom income concept)
 *
 * This tests two scenarios:
 * 1. Distributions paid out as cash (reinvest_nonreg_dist = false)
 * 2. Distributions reinvested (reinvest_nonreg_dist = true)
 *
 * Expected behavior:
 * - Both scenarios should have SAME tax amounts (distributions always taxed)
 * - Scenario 1 should have MORE cash available (distributions are cash)
 * - Scenario 2 should have HIGHER account balances (distributions stay invested)
 */

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

interface SimulationResult {
  success: boolean;
  message?: string;
  year_by_year?: YearData[];
}

interface YearData {
  year: number;
  age_p1: number;
  total_tax_p1: number;
  total_tax_p2: number;
  total_tax: number;
  nonreg_dist_p1?: number;
  nonreg_dist_p2?: number;
  nonreg_balance_p1: number;
  nonreg_balance_p2: number;
  nonreg_withdrawal_p1: number;
  nonreg_withdrawal_p2: number;
  taxable_income_p1: number;
  taxable_income_p2: number;
  rrif_withdrawal_p1: number;
  rrif_withdrawal_p2: number;
  cash_available_p1?: number;
  cash_available_p2?: number;
}

// Base simulation input
const baseInput = {
  p1: {
    name: "Test Person",
    start_age: 65,
    tfsa_balance: 50000,
    rrsp_balance: 0,
    rrif_balance: 0,  // Set to $0 to force non-registered withdrawals

    // Non-registered account with significant balance to generate distributions
    nr_cash: 0,
    nr_gic: 0,
    nr_invest: 500000,  // $500k in investments
    nr_acb: 400000,     // ACB = $400k (80% of balance)

    // Investment yields for non-registered
    y_nr_cash_interest: 4.5,
    y_nr_gic_interest: 5.0,
    y_nr_inv_total_return: 6.0,       // 6% total return
    y_nr_inv_elig_div: 2.0,            // 2% eligible dividends
    y_nr_inv_nonelig_div: 0.5,         // 0.5% non-eligible dividends
    y_nr_inv_capg: 2.5,                // 2.5% capital gains
    y_nr_inv_roc_pct: 1.0,             // 1% return of capital

    // Asset allocation
    nr_cash_pct: 0,
    nr_gic_pct: 0,
    nr_invest_pct: 100,    // 100% in investments

    // Corporate (empty)
    corp_cash_bucket: 0,
    corp_gic_bucket: 0,
    corp_invest_bucket: 0,
    corp_rdtoh: 0,
    corp_dividend_type: "eligible" as const,
    y_corp_cash: 4.5,
    y_corp_gic: 5.0,
    y_corp_total: 6.0,
    y_corp_eligdiv: 3.0,
    y_corp_capg: 3.0,
    corp_cash_pct: 10,
    corp_gic_pct: 10,
    corp_invest_pct: 80,

    // Government benefits
    cpp_start_age: 65,
    cpp_annual_at_start: 15000,
    oas_start_age: 65,
    oas_annual_at_start: 8500,

    // TFSA
    tfsa_room_start: 7000,
    tfsa_room_annual_growth: 7000,
  },
  p2: {
    name: "",
    start_age: 65,
    tfsa_balance: 0,
    rrsp_balance: 0,
    rrif_balance: 0,
    nr_cash: 0,
    nr_gic: 0,
    nr_invest: 0,
    nr_acb: 0,
    y_nr_cash_interest: 4.5,
    y_nr_gic_interest: 5.0,
    y_nr_inv_total_return: 6.0,
    y_nr_inv_elig_div: 2.0,
    y_nr_inv_nonelig_div: 0.5,
    y_nr_inv_capg: 2.5,
    y_nr_inv_roc_pct: 1.0,
    nr_cash_pct: 10,
    nr_gic_pct: 10,
    nr_invest_pct: 80,
    corp_cash_bucket: 0,
    corp_gic_bucket: 0,
    corp_invest_bucket: 0,
    corp_rdtoh: 0,
    corp_dividend_type: "eligible" as const,
    y_corp_cash_interest: 4.5,
    y_corp_gic_interest: 5.0,
    y_corp_inv_total_return: 6.0,
    y_corp_inv_elig_div: 3.0,
    y_corp_inv_capg: 3.0,
    corp_cash_pct: 10,
    corp_gic_pct: 10,
    corp_invest_pct: 80,
    cpp_start_age: 65,
    cpp_annual_at_start: 0,
    oas_start_age: 65,
    oas_annual_at_start: 0,
    tfsa_room_start: 0,
    tfsa_room_annual_growth: 0,
  },
  province: "AB",
  start_year: 2025,
  end_age: 85,  // Minimum allowed is 85

  strategy: "balanced",

  spending_go_go: 60000,
  go_go_end_age: 75,
  spending_slow_go: 50000,
  slow_go_end_age: 85,
  spending_no_go: 40000,

  spending_inflation: 2.0,
  general_inflation: 2.0,

  gap_tolerance: 1000,
  tfsa_contribution_each: 0,  // No TFSA contributions for simplicity

  // This will be toggled between test scenarios
  reinvest_nonreg_dist: false,

  stop_on_fail: false,
  income_split_rrif_fraction: 0,
  hybrid_rrif_topup_per_person: 0,
};

async function runSimulation(reinvest: boolean): Promise<SimulationResult> {
  const input = {
    ...baseInput,
    reinvest_nonreg_dist: reinvest,
  };

  console.log(`\nRunning simulation with reinvest_nonreg_dist = ${reinvest}...`);

  const response = await fetch(`${PYTHON_API_URL}/api/run-simulation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Simulation failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function main() {
  console.log('='.repeat(80));
  console.log('Testing Non-Registered Distribution Taxation');
  console.log('='.repeat(80));
  console.log('\nTest Setup:');
  console.log('- Non-registered balance: $500,000 (PRIMARY FUNDING SOURCE)');
  console.log('- Total return: 6.0% breakdown:');
  console.log('  - 2% eligible dividends = $10,000 (taxable)');
  console.log('  - 0.5% non-eligible dividends = $2,500 (taxable)');
  console.log('  - 2.5% capital gains = $12,500 (taxable at 50% inclusion)');
  console.log('  - 1% ROC = $5,000 (not taxable, reduces ACB)');
  console.log('- Expected TAXABLE distributions: $25,000/year');
  console.log('- Annual spending: $60,000');
  console.log('- RRIF balance: $0 (forces non-registered withdrawals)');
  console.log('- TFSA balance: $50,000');
  console.log('- CPP: $15,000/year + OAS: $8,500/year = $23,500/year government benefits');
  console.log('- Spending gap: $60,000 - $23,500 = $36,500/year must come from investments');
  console.log('\n');

  try {
    // Scenario 1: Distributions paid out as cash
    console.log('\n' + '='.repeat(80));
    console.log('SCENARIO 1: Distributions PAID OUT (reinvest_nonreg_dist = false)');
    console.log('='.repeat(80));
    const result1 = await runSimulation(false);

    if (!result1.success || !result1.year_by_year) {
      console.error('❌ Scenario 1 failed:', result1.message);
      return;
    }

    // Debug: Show all available fields in the first year
    console.log('\n📊 Available fields in year_by_year[0]:');
    console.log(Object.keys(result1.year_by_year[0]).join(', '));
    console.log('\n📊 Sample data from first year:');
    console.log(JSON.stringify(result1.year_by_year[0], null, 2));

    // Scenario 2: Distributions reinvested
    console.log('\n' + '='.repeat(80));
    console.log('SCENARIO 2: Distributions REINVESTED (reinvest_nonreg_dist = true)');
    console.log('='.repeat(80));
    const result2 = await runSimulation(true);

    if (!result2.success || !result2.year_by_year) {
      console.error('❌ Scenario 2 failed:', result2.message);
      return;
    }

    // Compare results
    console.log('\n' + '='.repeat(80));
    console.log('COMPARISON: Year-by-Year Analysis');
    console.log('='.repeat(80));

    const years1 = result1.year_by_year;
    const years2 = result2.year_by_year;

    console.log('\nFormat: Year | Age | Scenario 1 (Paid Out) | Scenario 2 (Reinvested) | Difference\n');

    // Compare taxes
    console.log('TOTAL TAX COMPARISON:');
    console.log('-'.repeat(80));
    for (let i = 0; i < Math.min(years1.length, years2.length); i++) {
      const y1 = years1[i];
      const y2 = years2[i];
      const taxDiff = y2.total_tax - y1.total_tax;
      const taxDiffPct = y1.total_tax > 0 ? ((taxDiff / y1.total_tax) * 100).toFixed(2) : 'N/A';

      console.log(
        `${y1.year} | ${y1.age_p1} | ` +
        `$${y1.total_tax.toFixed(0).padStart(8)} | ` +
        `$${y2.total_tax.toFixed(0).padStart(8)} | ` +
        `$${taxDiff.toFixed(0).padStart(8)} (${taxDiffPct}%)`
      );
    }

    // Compare taxable income - CRITICAL for phantom income verification
    console.log('\n\nTAXABLE INCOME (Person 1):');
    console.log('-'.repeat(80));
    for (let i = 0; i < Math.min(years1.length, years2.length); i++) {
      const y1 = years1[i];
      const y2 = years2[i];
      const incomeDiff = y2.taxable_income_p1 - y1.taxable_income_p1;
      const incomeDiffPct = y1.taxable_income_p1 > 0 ? ((incomeDiff / y1.taxable_income_p1) * 100).toFixed(2) : 'N/A';

      console.log(
        `${y1.year} | ${y1.age_p1} | ` +
        `$${y1.taxable_income_p1.toFixed(0).padStart(8)} | ` +
        `$${y2.taxable_income_p1.toFixed(0).padStart(8)} | ` +
        `$${incomeDiff.toFixed(0).padStart(8)} (${incomeDiffPct}%)`
      );
    }

    // Compare non-registered withdrawals
    console.log('\n\nNON-REGISTERED WITHDRAWALS (Person 1):');
    console.log('-'.repeat(80));
    for (let i = 0; i < Math.min(years1.length, years2.length); i++) {
      const y1 = years1[i];
      const y2 = years2[i];
      const wdDiff = y2.nonreg_withdrawal_p1 - y1.nonreg_withdrawal_p1;

      console.log(
        `${y1.year} | ${y1.age_p1} | ` +
        `$${y1.nonreg_withdrawal_p1.toFixed(0).padStart(8)} | ` +
        `$${y2.nonreg_withdrawal_p1.toFixed(0).padStart(8)} | ` +
        `$${wdDiff.toFixed(0).padStart(8)}`
      );
    }

    // Compare RRIF withdrawals
    console.log('\n\nRRIF WITHDRAWALS (Person 1):');
    console.log('-'.repeat(80));
    for (let i = 0; i < Math.min(years1.length, years2.length); i++) {
      const y1 = years1[i];
      const y2 = years2[i];
      const rrifDiff = y2.rrif_withdrawal_p1 - y1.rrif_withdrawal_p1;

      console.log(
        `${y1.year} | ${y1.age_p1} | ` +
        `$${y1.rrif_withdrawal_p1.toFixed(0).padStart(8)} | ` +
        `$${y2.rrif_withdrawal_p1.toFixed(0).padStart(8)} | ` +
        `$${rrifDiff.toFixed(0).padStart(8)}`
      );
    }

    // Compare distributions (if field exists)
    if (years1[0].hasOwnProperty('nonreg_dist_p1')) {
      console.log('\n\nNON-REGISTERED DISTRIBUTIONS (Person 1):');
      console.log('-'.repeat(80));
      for (let i = 0; i < Math.min(years1.length, years2.length); i++) {
        const y1 = years1[i];
        const y2 = years2[i];
        const distDiff = (y2.nonreg_dist_p1 || 0) - (y1.nonreg_dist_p1 || 0);

        console.log(
          `${y1.year} | ${y1.age_p1} | ` +
          `$${(y1.nonreg_dist_p1 || 0).toFixed(0).padStart(8)} | ` +
          `$${(y2.nonreg_dist_p1 || 0).toFixed(0).padStart(8)} | ` +
          `$${distDiff.toFixed(0).padStart(8)}`
        );
      }
    } else {
      console.log('\n\n⚠️  Field "nonreg_dist_p1" not found in response');
    }

    // Compare non-registered balances (if field exists)
    if (years1[0].hasOwnProperty('nonreg_balance_p1')) {
      console.log('\n\nNON-REGISTERED BALANCE (Person 1):');
      console.log('-'.repeat(80));
      for (let i = 0; i < Math.min(years1.length, years2.length); i++) {
        const y1 = years1[i];
        const y2 = years2[i];
        const balDiff = (y2.nonreg_balance_p1 || 0) - (y1.nonreg_balance_p1 || 0);

        console.log(
          `${y1.year} | ${y1.age_p1} | ` +
          `$${(y1.nonreg_balance_p1 || 0).toFixed(0).padStart(8)} | ` +
          `$${(y2.nonreg_balance_p1 || 0).toFixed(0).padStart(8)} | ` +
          `$${balDiff.toFixed(0).padStart(8)}`
        );
      }
    } else {
      console.log('\n\n⚠️  Field "nonreg_balance_p1" not found in response');
    }

    // Analysis
    console.log('\n' + '='.repeat(80));
    console.log('ANALYSIS & VERIFICATION');
    console.log('='.repeat(80));

    // Calculate average tax difference
    const avgTaxDiff = years1.reduce((sum, y1, i) => {
      return sum + (years2[i].total_tax - y1.total_tax);
    }, 0) / years1.length;

    // Calculate average distribution amounts (if field exists)
    const avgDist1 = years1[0].hasOwnProperty('nonreg_dist_p1')
      ? years1.reduce((sum, y) => sum + (y.nonreg_dist_p1 || 0), 0) / years1.length
      : 0;
    const avgDist2 = years2[0].hasOwnProperty('nonreg_dist_p1')
      ? years2.reduce((sum, y) => sum + (y.nonreg_dist_p1 || 0), 0) / years2.length
      : 0;

    // Calculate final balance difference (if field exists)
    const finalBalDiff = years1[0].hasOwnProperty('nonreg_balance_p1')
      ? (years2[years2.length - 1].nonreg_balance_p1 || 0) - (years1[years1.length - 1].nonreg_balance_p1 || 0)
      : 0;

    console.log('\n✓ Key Findings:');
    console.log(`  - Average tax difference: $${avgTaxDiff.toFixed(2)}`);
    console.log(`  - Average distributions (paid out): $${avgDist1.toFixed(0)}`);
    console.log(`  - Average distributions (reinvested): $${avgDist2.toFixed(0)}`);
    console.log(`  - Final non-reg balance difference: $${finalBalDiff.toFixed(0)}`);

    // Calculate taxable income difference
    const avgIncomeDiff = years1.reduce((sum, y1, i) => {
      return sum + (years2[i].taxable_income_p1 - y1.taxable_income_p1);
    }, 0) / years1.length;

    // Calculate withdrawal differences
    const avgNonregWdDiff = years1.reduce((sum, y1, i) => {
      return sum + (years2[i].nonreg_withdrawal_p1 - y1.nonreg_withdrawal_p1);
    }, 0) / years1.length;

    const avgRrifWdDiff = years1.reduce((sum, y1, i) => {
      return sum + (years2[i].rrif_withdrawal_p1 - y1.rrif_withdrawal_p1);
    }, 0) / years1.length;

    console.log('\n✓ Expected Behavior IF Phantom Income Is Working:');
    console.log('  1. Taxable income should be HIGHER in reinvested scenario (distributions taxed)');
    console.log('  2. Taxable income difference should equal ~distribution amounts (~$30k/year)');
    console.log('  3. Withdrawals should be similar (same spending needs)');
    console.log('  4. Final balance should be HIGHER when reinvested (distributions stay in account)');

    console.log('\n✓ Test Results:');

    // Verify taxable income is higher in reinvested scenario
    if (avgIncomeDiff > 0) {
      console.log('  ✅ PASS: Taxable income IS higher in reinvested scenario');
      console.log(`     (Average difference: $${avgIncomeDiff.toFixed(0)}/year)`);

      // Check if difference is in expected range for distributions
      const expectedDistRange = { min: 20000, max: 40000 }; // Expected ~$30k distributions
      if (avgIncomeDiff >= expectedDistRange.min && avgIncomeDiff <= expectedDistRange.max) {
        console.log('  ✅ PASS: Income difference matches expected distribution range ($20k-$40k)');
        console.log('     → This strongly suggests distributions ARE being taxed (phantom income working)');
      } else if (avgIncomeDiff < expectedDistRange.min) {
        console.log(`  ⚠️  WARNING: Income difference ($${avgIncomeDiff.toFixed(0)}) is lower than expected`);
        console.log('     → Distributions may not be fully taxed, or distribution amounts are lower than expected');
      } else {
        console.log(`  ⚠️  WARNING: Income difference ($${avgIncomeDiff.toFixed(0)}) is higher than expected`);
        console.log('     → Additional factors beyond distributions are affecting taxable income');
      }
    } else {
      console.log('  ❌ FAIL: Taxable income is LOWER in reinvested scenario');
      console.log(`     (Difference: $${avgIncomeDiff.toFixed(0)})`);
      console.log('     → This suggests distributions are NOT being taxed (phantom income broken)');
    }

    // Verify withdrawals
    console.log(`\n  Withdrawal patterns:`);
    console.log(`     - Avg non-reg withdrawal diff: $${avgNonregWdDiff.toFixed(0)}/year`);
    console.log(`     - Avg RRIF withdrawal diff: $${avgRrifWdDiff.toFixed(0)}/year`);

    if (Math.abs(avgNonregWdDiff) < 5000 && Math.abs(avgRrifWdDiff) < 5000) {
      console.log('  ✅ PASS: Withdrawals are similar between scenarios');
      console.log('     → Strategy is not significantly altered by reinvestment');
    } else {
      console.log('  ⚠️  WARNING: Withdrawals differ significantly between scenarios');
      console.log('     → Strategy adapts based on account balances');
    }

    // Verify reinvested scenario has higher balance
    if (finalBalDiff > 0) {
      console.log(`\n  ✅ PASS: Reinvested scenario has higher final balance`);
      console.log(`     (Difference: $${finalBalDiff.toFixed(0)})`);
    } else {
      console.log(`\n  ❌ FAIL: Reinvested scenario should have higher balance`);
      console.log(`     (Difference: $${finalBalDiff.toFixed(0)})`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    throw error;
  }
}

main().catch(console.error);
