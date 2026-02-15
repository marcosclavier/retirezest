/**
 * Test All 7 Withdrawal Strategies
 *
 * This script tests each withdrawal strategy to ensure they all work correctly
 * and produce valid simulation results.
 */

const NEXT_JS_URL = 'http://localhost:3000';

// All 7 strategies from lib/types/simulation.ts
const STRATEGIES = [
  'corporate-optimized',
  'minimize-income',
  'rrif-splitting',
  'capital-gains-optimized',
  'tfsa-first',
  'balanced',
  'rrif-frontload',
] as const;

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  'corporate-optimized': 'Best for corporate account holders - minimizes corporate tax',
  'minimize-income': 'Minimizes taxable income to preserve benefits (GIS, OAS)',
  'rrif-splitting': 'Uses pension income splitting to reduce household tax',
  'capital-gains-optimized': 'Prioritizes capital gains for favorable tax treatment',
  'tfsa-first': 'Withdraws from tax-free accounts first for maximum flexibility',
  'balanced': 'Balanced approach across all account types',
  'rrif-frontload': 'RRIF Front-Load (Tax Smoothing + OAS Protection)',
};

interface TestResult {
  strategy: string;
  success: boolean;
  healthScore?: number;
  totalTax?: number;
  finalEstate?: number;
  error?: string;
  responseTime?: number;
}

// Standard test household with meaningful balances
const getTestHousehold = (strategy: string) => ({
  p1: {
    name: 'Test User',
    start_age: 65,
    cpp_start_age: 65,
    cpp_annual_at_start: 15000,
    oas_start_age: 65,
    oas_annual_at_start: 8500,
    employer_pension_annual: 0,
    rental_income_annual: 0,
    other_income_annual: 0,
    tfsa_balance: 100000,
    rrif_balance: 500000,
    rrsp_balance: 0,
    nonreg_balance: 200000,
    corporate_balance: strategy === 'corporate-optimized' ? 300000 : 0,
    nonreg_acb: 150000,
    nr_cash: 0,
    nr_gic: 0,
    nr_invest: 200000,
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
    corp_invest_bucket: strategy === 'corporate-optimized' ? 300000 : 0,
    corp_rdtoh: 0,
    y_corp_cash_interest: 2.0,
    y_corp_gic_interest: 3.5,
    y_corp_inv_total_return: 6.0,
    y_corp_inv_elig_div: 2.0,
    y_corp_inv_capg: 3.5,
    corp_cash_pct: 5.0,
    corp_gic_pct: 10.0,
    corp_invest_pct: 85.0,
    corp_dividend_type: 'eligible' as const,
    tfsa_room_start: 7000,
    tfsa_contribution_annual: 0,
    enable_early_rrif_withdrawal: false,
    early_rrif_withdrawal_start_age: 65,
    early_rrif_withdrawal_end_age: 70,
    early_rrif_withdrawal_annual: 20000,
    early_rrif_withdrawal_percentage: 5.0,
    early_rrif_withdrawal_mode: 'fixed' as const,
  },
  p2: {
    name: 'Partner',
    start_age: 65,
    cpp_start_age: 65,
    cpp_annual_at_start: 12000,
    oas_start_age: 65,
    oas_annual_at_start: 8500,
    employer_pension_annual: 0,
    rental_income_annual: 0,
    other_income_annual: 0,
    tfsa_balance: 80000,
    rrif_balance: 400000,
    rrsp_balance: 0,
    nonreg_balance: 150000,
    corporate_balance: 0,
    nonreg_acb: 100000,
    nr_cash: 0,
    nr_gic: 0,
    nr_invest: 150000,
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
    corp_dividend_type: 'eligible' as const,
    tfsa_room_start: 7000,
    tfsa_contribution_annual: 0,
    enable_early_rrif_withdrawal: false,
    early_rrif_withdrawal_start_age: 65,
    early_rrif_withdrawal_end_age: 70,
    early_rrif_withdrawal_annual: 20000,
    early_rrif_withdrawal_percentage: 5.0,
    early_rrif_withdrawal_mode: 'fixed' as const,
  },
  province: 'AB',
  start_year: 2025,
  end_age: 95,
  strategy: strategy,
  spending_go_go: 90000,
  go_go_end_age: 75,
  spending_slow_go: 70000,
  slow_go_end_age: 85,
  spending_no_go: 50000,
  spending_inflation: 2.0,
  general_inflation: 2.0,
  tfsa_room_annual_growth: 7000,
  gap_tolerance: 1000,
  reinvest_nonreg_dist: false,
  income_split_rrif_fraction: 0.0,
  hybrid_rrif_topup_per_person: 0,
  stop_on_fail: false,
});

async function testStrategy(strategy: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    console.log(`\n🧪 Testing: ${strategy}`);
    console.log(`   Description: ${STRATEGY_DESCRIPTIONS[strategy]}`);

    const householdInput = getTestHousehold(strategy);

    // Call Next.js simulation API
    const response = await fetch(`${NEXT_JS_URL}/api/simulation/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(householdInput),
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Failed (HTTP ${response.status})`);
      return {
        strategy,
        success: false,
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
        responseTime,
      };
    }

    const result = await response.json();

    if (!result.success) {
      console.log(`   ❌ Failed (Simulation Error)`);
      return {
        strategy,
        success: false,
        error: result.error || result.message,
        responseTime,
      };
    }

    // Extract key metrics
    const healthScore = result.summary?.health_score || 0;
    const totalTax = result.summary?.total_tax_paid || 0;
    const finalEstate = result.summary?.final_estate_after_tax || 0;

    console.log(`   ✅ Success!`);
    console.log(`      Health Score: ${healthScore.toFixed(1)}`);
    console.log(`      Total Tax: $${(totalTax / 1000).toFixed(0)}k`);
    console.log(`      Final Estate: $${(finalEstate / 1000).toFixed(0)}k`);
    console.log(`      Response Time: ${responseTime}ms`);

    return {
      strategy,
      success: true,
      healthScore,
      totalTax,
      finalEstate,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      strategy,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      responseTime,
    };
  }
}

async function main() {
  console.log('🚀 Testing All 7 Withdrawal Strategies\n');
  console.log('=' .repeat(90));
  console.log(`Next.js API: ${NEXT_JS_URL}/api/simulation/run`);
  console.log(`Test Scenario: Couple (both 65), $1.8M total assets`);
  console.log('=' .repeat(90));

  const results: TestResult[] = [];

  // Test each strategy
  for (const strategy of STRATEGIES) {
    const result = await testStrategy(strategy);
    results.push(result);

    // Small delay between tests to avoid overwhelming backend
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  console.log('\n');
  console.log('=' .repeat(90));
  console.log('📋 STRATEGY TEST RESULTS SUMMARY');
  console.log('=' .repeat(90));
  console.log('');

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`✅ Passed: ${successCount}/${STRATEGIES.length}`);
  console.log(`❌ Failed: ${failCount}/${STRATEGIES.length}`);
  console.log('');

  // Detailed results table
  console.log('Strategy                      | Status | Health | Tax Paid   | Estate      | Time (ms)');
  console.log('-'.repeat(90));

  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const health = result.healthScore?.toFixed(0).padStart(6) || '  N/A ';
    const tax = result.totalTax ? `$${(result.totalTax / 1000).toFixed(0)}k`.padStart(10) : '      N/A ';
    const estate = result.finalEstate ? `$${(result.finalEstate / 1000).toFixed(0)}k`.padStart(10) : '      N/A ';
    const time = result.responseTime?.toString().padStart(8) || '    N/A';

    console.log(
      `${result.strategy.padEnd(29)} | ${status} | ${health} | ${tax} | ${estate} | ${time}`
    );
  }

  console.log('');

  // Show errors for failed tests
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('=' .repeat(90));
    console.log('❌ FAILURES:');
    console.log('=' .repeat(90));
    for (const failure of failures) {
      console.log(`\n${failure.strategy}:`);
      console.log(`  Error: ${failure.error}`);
    }
    console.log('');
  }

  // Strategy performance comparison (only for successful strategies)
  const successful = results.filter(r => r.success);
  if (successful.length > 1) {
    console.log('=' .repeat(90));
    console.log('📊 STRATEGY PERFORMANCE COMPARISON (Successful Strategies Only)');
    console.log('=' .repeat(90));
    console.log('');

    // Best health score
    const bestHealth = successful.reduce((best, curr) =>
      (curr.healthScore || 0) > (best.healthScore || 0) ? curr : best
    );
    console.log(`🏆 Best Health Score: ${bestHealth.strategy} (${bestHealth.healthScore?.toFixed(1)})`);

    // Lowest tax
    const lowestTax = successful.reduce((best, curr) =>
      (curr.totalTax || Infinity) < (best.totalTax || Infinity) ? curr : best
    );
    console.log(`💰 Lowest Tax Paid: ${lowestTax.strategy} ($${((lowestTax.totalTax || 0) / 1000).toFixed(0)}k)`);

    // Highest estate
    const highestEstate = successful.reduce((best, curr) =>
      (curr.finalEstate || 0) > (best.finalEstate || 0) ? curr : best
    );
    console.log(`🏡 Highest Final Estate: ${highestEstate.strategy} ($${((highestEstate.finalEstate || 0) / 1000).toFixed(0)}k)`);

    // Fastest response
    const fastest = successful.reduce((best, curr) =>
      (curr.responseTime || Infinity) < (best.responseTime || Infinity) ? curr : best
    );
    console.log(`⚡ Fastest Response: ${fastest.strategy} (${fastest.responseTime}ms)`);

    console.log('');
  }

  console.log('=' .repeat(90));

  if (failCount === 0) {
    console.log('🎉 ALL STRATEGIES PASSED!');
  } else {
    console.log(`⚠️  ${failCount} STRATEGY(IES) FAILED - REVIEW REQUIRED`);
  }

  console.log('=' .repeat(90));
}

main().catch(console.error);
