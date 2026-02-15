/**
 * Quick diagnostic to check what columns the simulation dataframe actually contains
 */

async function checkDataframeColumns() {
  try {
    const response = await fetch('http://localhost:8000/api/run-simulation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        province: 'AB',
        start_year: 2025,
        end_age: 95,
        strategy: 'corporate-optimized',
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
          age_today: 65,
          retirement_age: 65,
          life_expectancy: 95,
          tfsa_balance: 183000,
          rrsp_balance: 185000,
          nonreg_balance: 830000,
          nr_cash: 83000,
          nr_gic: 166000,
          nr_invest: 581000,
          nonreg_acb: 664000,
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
          corporate_balance: 2360000,
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
          y_tfsa: 5.0,
          y_rrsp: 6.0,
          cpp_start_age: 65,
          cpp_annual_at_start: 13855,
          oas_start_age: 65,
          oas_annual_at_start: 7362,
        },
        p2: {
          age_today: 0,
          retirement_age: 0,
          life_expectancy: 0,
          tfsa_balance: 0,
          rrsp_balance: 0,
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
      }),
    });

    const result = await response.json();

    if (result.year_by_year && result.year_by_year.length > 0) {
      const firstYear = result.year_by_year[0];
      console.log('Year 0 Keys:', Object.keys(firstYear).sort().join(', '));
      console.log('\nYear 0 Withdrawal Fields:');
      console.log(`  withdraw_corp_p1: ${firstYear.withdraw_corp_p1}`);
      console.log(`  corporate_withdrawal_p1: ${firstYear.corporate_withdrawal_p1}`);
      console.log(`  withdraw_nonreg_p1: ${firstYear.withdraw_nonreg_p1}`);
      console.log(`  nonreg_withdrawal_p1: ${firstYear.nonreg_withdrawal_p1}`);
      console.log(`  corp_div_paid_p1: ${firstYear.corp_div_paid_p1}`);
      console.log('\nYear 0 Balance Fields:');
      console.log(`  end_corp_p1: ${firstYear.end_corp_p1}`);
      console.log(`  corporate_balance_p1: ${firstYear.corporate_balance_p1}`);
      console.log(`  corp_p1: ${firstYear.corp_p1}`);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

checkDataframeColumns();
