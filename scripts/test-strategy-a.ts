/**
 * Test Strategy A: NonReg -> RRIF -> Corp -> TFSA
 *
 * This strategy prioritizes Non-Registered accounts first to take advantage
 * of the Adjusted Cost Base (ACB), minimizing taxable capital gains.
 */

async function testStrategyA() {
  console.log('🧪 Testing Strategy A: NonReg -> RRIF -> Corp -> TFSA\n');
  console.log('=' .repeat(80));

  const testPayload = {
    province: 'AB',
    start_year: 2025,
    end_age: 95,
    strategy: 'capital-gains-optimized', // Maps to "NonReg->RRIF->Corp->TFSA"
    spending_go_go: 120000,
    go_go_end_age: 75,
    spending_slow_go: 90000,
    slow_go_end_age: 85,
    spending_no_go: 70000,
    spending_inflation: 2.0,
    general_inflation: 2.0,
    gap_tolerance: 1000,
    tfsa_contribution_each: 0,
    reinvest_nonreg_dist: true,
    income_split_rrif_fraction: 0.0,
    hybrid_rrif_topup_per_person: 0,
    stop_on_fail: false,
    p1: {
      name: 'Test User',
      start_age: 65,
      end_age: 95,

      // All accounts have balances to test priority order
      tfsa_balance: 183000,
      rrsp_balance: 185000,
      rrif_balance: 0,
      nonreg_balance: 830000,
      corporate_balance: 2360000,

      // NonReg bucket breakdown
      nr_cash: 83000,
      nr_gic: 166000,
      nr_invest: 581000,
      nonreg_acb: 664000, // 80% ACB
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

      // Corporate bucket breakdown
      corp_cash_bucket: 118000,
      corp_gic_bucket: 236000,
      corp_invest_bucket: 2006000,
      corp_rdtoh: 0,
      y_corp_cash_interest: 2.0,
      y_corp_gic_interest: 3.5,
      y_corp_inv_total_return: 6.0,
      y_corp_inv_elig_div: 2.0,
      y_corp_inv_capg: 3.5,
      corp_cash_pct: 5.0,
      corp_gic_pct: 10.0,
      corp_invest_pct: 85.0,
      corp_dividend_type: 'eligible',

      // TFSA and RRSP yields
      y_tfsa: 5.0,
      y_rrsp: 6.0,

      // Government benefits
      cpp_start_age: 65,
      cpp_annual_at_start: 13855,
      oas_start_age: 65,
      oas_annual_at_start: 7362,
    },
    p2: {
      name: '',
      start_age: 65,
      end_age: 95,
      tfsa_balance: 0,
      rrsp_balance: 0,
      rrif_balance: 0,
      nonreg_balance: 0,
      nr_cash: 0,
      nr_gic: 0,
      nr_invest: 0,
      nonreg_acb: 0,
      y_nr_cash_interest: 0,
      y_nr_gic_interest: 0,
      y_nr_inv_total_return: 0,
      y_nr_inv_elig_div: 0,
      y_nr_inv_nonelig_div: 0,
      y_nr_inv_capg: 0,
      y_nr_inv_roc_pct: 0,
      nr_cash_pct: 0,
      nr_gic_pct: 0,
      nr_invest_pct: 0,
      corporate_balance: 0,
      corp_cash_bucket: 0,
      corp_gic_bucket: 0,
      corp_invest_bucket: 0,
      corp_rdtoh: 0,
      y_corp_cash_interest: 0,
      y_corp_gic_interest: 0,
      y_corp_inv_total_return: 0,
      y_corp_inv_elig_div: 0,
      y_corp_inv_capg: 0,
      corp_cash_pct: 0,
      corp_gic_pct: 0,
      corp_invest_pct: 0,
      corp_dividend_type: 'eligible',
      y_tfsa: 0,
      y_rrsp: 0,
      cpp_start_age: 0,
      cpp_annual_at_start: 0,
      oas_start_age: 0,
      oas_annual_at_start: 0,
    },
  };

  try {
    const response = await fetch('http://localhost:8000/api/run-simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('\n✅ Simulation completed successfully!\n');
    console.log('=' .repeat(80));
    console.log('STRATEGY A VERIFICATION: NonReg -> RRIF -> Corp -> TFSA');
    console.log('=' .repeat(80));

    // Check first 10 years
    console.log('\n📊 Withdrawal Pattern (First 10 Years):');
    console.log('-' .repeat(80));
    console.log('Year  Age  NonReg      RRIF        Corp        TFSA        Priority');
    console.log('-' .repeat(80));

    const years = result.year_by_year.slice(0, 10);
    for (const year of years) {
      const nonreg = year.nonreg_withdrawal_p1 || 0;
      const rrif = year.rrif_withdrawal_p1 || 0;
      const corp = year.corporate_withdrawal_p1 || 0;
      const tfsa = year.tfsa_withdrawal_p1 || 0;

      // Determine which account was used first
      let priority = '';
      if (nonreg > 100) priority = '1️⃣ NonReg';
      else if (rrif > 100) priority = '2️⃣ RRIF';
      else if (corp > 100) priority = '3️⃣ Corp';
      else if (tfsa > 100) priority = '4️⃣ TFSA';

      console.log(
        `${year.year}  ${year.age_p1}   ` +
        `$${nonreg.toFixed(0).padStart(8)}  ` +
        `$${rrif.toFixed(0).padStart(8)}  ` +
        `$${corp.toFixed(0).padStart(8)}  ` +
        `$${tfsa.toFixed(0).padStart(8)}  ` +
        `${priority}`
      );
    }

    // Verify Strategy A criteria
    console.log('\n' + '=' .repeat(80));
    console.log('VERIFICATION CHECKLIST:');
    console.log('=' .repeat(80));

    const year1 = result.year_by_year[0];
    const nonregUsedFirst = (year1.nonreg_withdrawal_p1 || 0) > 100;
    const corpNotUsedFirst = (year1.corporate_withdrawal_p1 || 0) < 100;

    console.log(
      nonregUsedFirst
        ? '✅ NonReg used FIRST (Strategy A correct)'
        : '❌ NonReg NOT used first (Strategy A FAILED)'
    );
    console.log(
      corpNotUsedFirst
        ? '✅ Corporate NOT used first (correct for Strategy A)'
        : '❌ Corporate used first (WRONG for Strategy A)'
    );

    // Check when NonReg runs out and RRIF/Corp kick in
    let nonregDepletedYear = null;
    for (const year of result.year_by_year) {
      if ((year.nonreg_balance_p1 || 0) < 1000 && nonregDepletedYear === null) {
        nonregDepletedYear = year.year;
        console.log(`\n💡 NonReg depleted in year ${nonregDepletedYear}`);
        break;
      }
    }

    // Check account balances
    console.log('\n📈 Account Balance Trends:');
    console.log('-' .repeat(80));
    console.log('Year  NonReg Balance  RRIF Balance   Corp Balance   TFSA Balance');
    console.log('-' .repeat(80));
    for (let i = 0; i < 10; i++) {
      const year = result.year_by_year[i];
      console.log(
        `${year.year}  ` +
        `$${(year.nonreg_balance_p1 || 0).toFixed(0).padStart(12)}  ` +
        `$${(year.rrif_balance_p1 || 0).toFixed(0).padStart(12)}  ` +
        `$${(year.corporate_balance_p1 || 0).toFixed(0).padStart(12)}  ` +
        `$${(year.tfsa_balance_p1 || 0).toFixed(0).padStart(12)}`
      );
    }

    console.log('\n' + '=' .repeat(80));
    console.log('✅ STRATEGY A TEST COMPLETE');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testStrategyA();
