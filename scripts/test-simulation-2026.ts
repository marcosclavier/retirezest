#!/usr/bin/env tsx
/**
 * Simulation Test Script for Year 2026
 *
 * This script tests the retirement simulation for a specific year
 * and provides detailed analysis of withdrawals and taxes.
 *
 * Date: 2025-12-07
 */

import type { HouseholdInput } from '../lib/types/simulation';

// Build the test household input based on user's actual portfolio
const testHousehold: HouseholdInput = {
  // Person 1 (Primary)
  p1: {
    name: 'Test User',
    start_age: 65,

    // Account balances (corrected with Non-Reg fix)
    tfsa_balance: 183000,
    rrsp_balance: 185000,
    rrif_balance: 0,
    nonreg_balance: 830000,    // Total non-registered
    corporate_balance: 2360000, // Total corporate

    // Non-Registered (previously broken, now fixed!)
    nr_cash: 83000,      // 10% of 830k
    nr_gic: 166000,      // 20% of 830k
    nr_invest: 581000,   // 70% of 830k
    nonreg_acb: 664000,  // 80% of 830k (estimated)

    // Corporate accounts
    corp_cash_bucket: 118000,    // 5% of 2.36M
    corp_gic_bucket: 236000,     // 10% of 2.36M
    corp_invest_bucket: 2006000, // 85% of 2.36M
    corp_rdtoh: 0,

    // Government benefits
    oas_annual_at_start: 7362,   // Default OAS
    oas_start_age: 65,
    cpp_annual_at_start: 13855,  // Default CPP
    cpp_start_age: 65,

    // Yields for corporate
    y_corp_cash_interest: 2.0,
    y_corp_gic_interest: 4.0,
    y_corp_inv_total_return: 7.0,
    y_corp_inv_elig_div: 2.0,
    y_corp_inv_capg: 3.5,

    // Corporate allocation percentages
    corp_cash_pct: 5.0,
    corp_gic_pct: 10.0,
    corp_invest_pct: 85.0,
    corp_dividend_type: 'eligible' as const,

    // Non-registered yields
    y_nr_cash_interest: 2.0,
    y_nr_gic_interest: 4.0,
    y_nr_inv_total_return: 7.0,
    y_nr_inv_elig_div: 2.0,
    y_nr_inv_nonelig_div: 0.5,
    y_nr_inv_capg: 3.0,
    y_nr_inv_roc_pct: 0.5,

    // Non-registered allocation
    nr_cash_pct: 10.0,
    nr_gic_pct: 20.0,
    nr_invest_pct: 70.0,

    // TFSA room
    tfsa_room_start: 7000,
    tfsa_room_annual_growth: 7000,
  },

  // Person 2 (Partner) - empty for now
  p2: {
    name: '',
    start_age: 65,
    tfsa_balance: 0,
    rrsp_balance: 0,
    rrif_balance: 0,
    nonreg_balance: 0,
    corporate_balance: 0,
    nr_cash: 0,
    nr_gic: 0,
    nr_invest: 0,
    nonreg_acb: 0,
    corp_cash_bucket: 0,
    corp_gic_bucket: 0,
    corp_invest_bucket: 0,
    corp_rdtoh: 0,
    oas_annual_at_start: 0,
    oas_start_age: 65,
    cpp_annual_at_start: 0,
    cpp_start_age: 65,
    y_nr_cash_interest: 2.0,
    y_nr_gic_interest: 4.0,
    y_nr_inv_total_return: 7.0,
    y_nr_inv_elig_div: 2.0,
    y_nr_inv_nonelig_div: 0.5,
    y_nr_inv_capg: 3.0,
    y_nr_inv_roc_pct: 0.5,
    nr_cash_pct: 10.0,
    nr_gic_pct: 20.0,
    nr_invest_pct: 70.0,
    y_corp_cash_interest: 2.0,
    y_corp_gic_interest: 4.0,
    y_corp_inv_total_return: 7.0,
    y_corp_inv_elig_div: 2.0,
    y_corp_inv_capg: 3.5,
    corp_cash_pct: 5.0,
    corp_gic_pct: 10.0,
    corp_invest_pct: 85.0,
    corp_dividend_type: 'eligible' as const,
    tfsa_room_start: 7000,
    tfsa_room_annual_growth: 7000,
  },

  // Household settings
  province: 'AB',
  start_year: 2025,
  end_age: 95,
  strategy: 'corporate-optimized',

  // Spending phases
  spending_go_go: 124000,
  go_go_end_age: 75,
  spending_slow_go: 90000,
  slow_go_end_age: 85,
  spending_no_go: 70000,

  // Inflation
  spending_inflation: 2.0,
  general_inflation: 2.0,

  // Advanced options
  gap_tolerance: 1000,
  tfsa_contribution_each: 0,
  reinvest_nonreg_dist: true,
  income_split_rrif_fraction: 0.0,
  hybrid_rrif_topup_per_person: 0,
  stop_on_fail: false,
};

console.log('🧪 Simulation Test for Year 2026\n');
console.log('='.repeat(80));
console.log('📊 Portfolio Summary (Start of Retirement - Age 65)');
console.log('='.repeat(80));

const p1 = testHousehold.p1;

// Calculate total balances
const tfsa_total = p1.tfsa_balance;
const rrsp_total = p1.rrsp_balance;
const rrif_total = p1.rrif_balance;
const nonreg_total = p1.nr_cash + p1.nr_gic + p1.nr_invest;
const corporate_total = p1.corp_cash_bucket + p1.corp_gic_bucket + p1.corp_invest_bucket;
const total_portfolio = tfsa_total + rrsp_total + rrif_total + nonreg_total + corporate_total;

console.log(`
Account Type          Balance        Allocation    Asset Mix
${'─'.repeat(80)}
TFSA                  $${tfsa_total.toLocaleString().padStart(12)}    ${((tfsa_total/total_portfolio)*100).toFixed(1).padStart(6)}%     100% in account
RRSP                  $${rrsp_total.toLocaleString().padStart(12)}    ${((rrsp_total/total_portfolio)*100).toFixed(1).padStart(6)}%     100% in account
RRIF                  $${rrif_total.toLocaleString().padStart(12)}    ${((rrif_total/total_portfolio)*100).toFixed(1).padStart(6)}%     100% in account
Non-Registered ⭐     $${nonreg_total.toLocaleString().padStart(12)}    ${((nonreg_total/total_portfolio)*100).toFixed(1).padStart(6)}%     ${((p1.nr_cash/nonreg_total)*100).toFixed(0)}% cash, ${((p1.nr_gic/nonreg_total)*100).toFixed(0)}% GIC, ${((p1.nr_invest/nonreg_total)*100).toFixed(0)}% invest
Corporate             $${corporate_total.toLocaleString().padStart(12)}    ${((corporate_total/total_portfolio)*100).toFixed(1).padStart(6)}%     ${((p1.corp_cash_bucket/corporate_total)*100).toFixed(0)}% cash, ${((p1.corp_gic_bucket/corporate_total)*100).toFixed(0)}% GIC, ${((p1.corp_invest_bucket/corporate_total)*100).toFixed(0)}% invest
${'─'.repeat(80)}
TOTAL PORTFOLIO       $${total_portfolio.toLocaleString().padStart(12)}    100.0%
`);

console.log('='.repeat(80));
console.log('💰 Income Sources (Annual)');
console.log('='.repeat(80));
console.log(`
CPP (starting age ${p1.cpp_start_age}):     $${p1.cpp_annual_at_start.toLocaleString().padStart(10)}
OAS (starting age ${p1.oas_start_age}):     $${p1.oas_annual_at_start.toLocaleString().padStart(10)}
${'─'.repeat(80)}
Government Benefits:     $${(p1.cpp_annual_at_start + p1.oas_annual_at_start).toLocaleString().padStart(10)}
`);

console.log('='.repeat(80));
console.log('🎯 Target Annual Spending');
console.log('='.repeat(80));
console.log(`
Go-Go Phase (until age ${testHousehold.go_go_end_age}):  $${testHousehold.spending_go_go.toLocaleString()}
Slow-Go Phase (until age ${testHousehold.slow_go_end_age}): $${testHousehold.spending_slow_go.toLocaleString()}
No-Go Phase (after age ${testHousehold.slow_go_end_age}):   $${testHousehold.spending_no_go.toLocaleString()}
${'─'.repeat(80)}
Initial Spending:        $${testHousehold.spending_go_go.toLocaleString()}
Less Gov't Benefits:     $${(p1.cpp_annual_at_start + p1.oas_annual_at_start).toLocaleString()}
${'─'.repeat(80)}
Required from Assets:    $${(testHousehold.spending_go_go - p1.cpp_annual_at_start - p1.oas_annual_at_start).toLocaleString()}
`);

console.log('='.repeat(80));
console.log('🔄 Making API Call to Simulation Engine...');
console.log('='.repeat(80));

// Make the actual API call
async function runSimulation() {
  try {
    // First, get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/csrf');
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.token;

    if (!csrfToken) {
      console.error('❌ Failed to get CSRF token');
      return;
    }

    console.log('✅ CSRF token obtained');
    console.log('📡 Sending simulation request...\n');

    // Call simulation API
    const response = await fetch('http://localhost:3000/api/simulation/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify(testHousehold),
    });

    if (!response.ok) {
      console.error('❌ Simulation API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Simulation failed:', result.message);
      if (result.error) console.error('Error:', result.error);
      return;
    }

    console.log('✅ Simulation completed successfully!\n');

    // Display summary results
    console.log('='.repeat(80));
    console.log('📈 SIMULATION SUMMARY');
    console.log('='.repeat(80));

    if (result.summary) {
      const s = result.summary;
      console.log(`
Years Funded:            ${s.years_funded}/${s.total_years} (${s.funding_rate?.toFixed(1)}%)
Final Estate (Net):      $${s.final_estate_net?.toLocaleString()}
Final Estate (Gross):    $${s.final_estate_gross?.toLocaleString()}
Estate Taxes:            $${((s.final_estate_gross || 0) - (s.final_estate_net || 0)).toLocaleString()}

Total Withdrawals:       $${s.total_withdrawals?.toLocaleString()}
Total Spending:          $${s.total_spending?.toLocaleString()}
Total Tax Paid:          $${s.total_tax_paid?.toLocaleString()}
Avg Effective Tax Rate:  ${((s.avg_effective_tax_rate || 0) * 100).toFixed(2)}% ⭐

Health Score:            ${s.health_score}/100
Recommended Strategy:    ${s.recommended_strategy}
      `);
    }

    // Find year 2026 data (year 1 of simulation)
    console.log('='.repeat(80));
    console.log('🔍 DETAILED ANALYSIS: YEAR 2026 (Age 65)');
    console.log('='.repeat(80));

    if (result.year_by_year && result.year_by_year.length > 0) {
      const year2026 = result.year_by_year[0]; // First year

      console.log('\n📅 Year Details:');
      console.log(`  Year: ${year2026.year}`);
      console.log(`  Age: ${year2026.age}`);
      console.log(`  Survival Probability: ${((year2026.survival_prob || 1) * 100).toFixed(1)}%`);

      // Account balances (start of year)
      console.log('\n💼 Account Balances (Start of Year):');
      console.log('─'.repeat(80));
      console.log(`  TFSA:           $${(year2026.tfsa_balance || 0).toLocaleString().padStart(12)}`);
      console.log(`  RRSP:           $${(year2026.rrsp_balance || 0).toLocaleString().padStart(12)}`);
      console.log(`  RRIF:           $${(year2026.rrif_balance || 0).toLocaleString().padStart(12)}`);
      console.log(`  Non-Registered: $${(year2026.nonreg_balance || 0).toLocaleString().padStart(12)} ⭐`);
      console.log(`  Corporate:      $${(year2026.corporate_balance || 0).toLocaleString().padStart(12)}`);
      console.log('─'.repeat(80));
      console.log(`  TOTAL:          $${(year2026.total_assets || 0).toLocaleString().padStart(12)}`);

      // Withdrawals by account
      console.log('\n💸 Withdrawals by Account:');
      console.log('─'.repeat(80));
      console.log(`  TFSA Withdrawal:      $${(year2026.tfsa_withdrawal || 0).toLocaleString().padStart(10)}`);
      console.log(`  RRSP Withdrawal:      $${(year2026.rrsp_withdrawal || 0).toLocaleString().padStart(10)}`);
      console.log(`  RRIF Withdrawal:      $${(year2026.rrif_withdrawal || 0).toLocaleString().padStart(10)}`);
      console.log(`  Non-Reg Withdrawal:   $${(year2026.nonreg_withdrawal || 0).toLocaleString().padStart(10)} ⭐`);
      console.log(`  Corporate Dividend:   $${(year2026.corporate_withdrawal || 0).toLocaleString().padStart(10)}`);
      console.log('─'.repeat(80));
      console.log(`  Total Withdrawals:    $${(year2026.total_withdrawals || 0).toLocaleString().padStart(10)}`);

      // Income composition
      console.log('\n💵 Income Composition:');
      console.log('─'.repeat(80));
      console.log(`  CPP Income:           $${(year2026.cpp_income || 0).toLocaleString().padStart(10)}`);
      console.log(`  OAS Income:           $${(year2026.oas_income || 0).toLocaleString().padStart(10)}`);
      console.log(`  Employment Income:    $${(year2026.employment_income || 0).toLocaleString().padStart(10)}`);
      console.log(`  Pension Income:       $${(year2026.pension_income || 0).toLocaleString().padStart(10)}`);
      console.log(`  Investment Income:    $${(year2026.investment_income || 0).toLocaleString().padStart(10)}`);
      console.log(`  Account Withdrawals:  $${(year2026.total_withdrawals || 0).toLocaleString().padStart(10)}`);
      console.log('─'.repeat(80));
      console.log(`  Total Gross Income:   $${(year2026.total_income || 0).toLocaleString().padStart(10)}`);

      // Tax breakdown
      console.log('\n💰 Tax Breakdown:');
      console.log('─'.repeat(80));
      console.log(`  Federal Tax:          $${(year2026.federal_tax || 0).toLocaleString().padStart(10)}`);
      console.log(`  Provincial Tax (AB):  $${(year2026.provincial_tax || 0).toLocaleString().padStart(10)}`);
      console.log(`  Dividend Tax Credit:  $${(-(year2026.dividend_tax_credit || 0)).toLocaleString().padStart(10)} (credit)`);
      console.log(`  Capital Gains Tax:    $${(year2026.capital_gains_tax || 0).toLocaleString().padStart(10)} ⭐`);
      console.log('─'.repeat(80));
      console.log(`  Total Tax:            $${(year2026.total_tax || 0).toLocaleString().padStart(10)}`);
      console.log(`  Effective Tax Rate:   ${((year2026.effective_tax_rate || 0) * 100).toFixed(2)}%`);

      // Spending
      console.log('\n🛒 Spending & Cash Flow:');
      console.log('─'.repeat(80));
      console.log(`  Target Spending:      $${(year2026.spending || 0).toLocaleString().padStart(10)}`);
      console.log(`  Less: Total Tax:      $${(year2026.total_tax || 0).toLocaleString().padStart(10)}`);
      console.log('─'.repeat(80));
      console.log(`  Net Available:        $${((year2026.spending || 0) - (year2026.total_tax || 0)).toLocaleString().padStart(10)}`);

      // Investment returns
      console.log('\n📊 Investment Returns:');
      console.log('─'.repeat(80));
      console.log(`  TFSA Growth:          $${(year2026.tfsa_growth || 0).toLocaleString().padStart(10)}`);
      console.log(`  RRSP Growth:          $${(year2026.rrsp_growth || 0).toLocaleString().padStart(10)}`);
      console.log(`  RRIF Growth:          $${(year2026.rrif_growth || 0).toLocaleString().padStart(10)}`);
      console.log(`  Non-Reg Growth:       $${(year2026.nonreg_growth || 0).toLocaleString().padStart(10)}`);
      console.log(`  Corporate Growth:     $${(year2026.corporate_growth || 0).toLocaleString().padStart(10)}`);
      console.log('─'.repeat(80));
      console.log(`  Total Growth:         $${(year2026.total_growth || 0).toLocaleString().padStart(10)}`);

      // Calculate withdrawal strategy percentages
      const totalWithdrawals = year2026.total_withdrawals || 0;
      if (totalWithdrawals > 0) {
        console.log('\n🎯 Withdrawal Strategy Breakdown:');
        console.log('─'.repeat(80));
        console.log(`  TFSA:           ${((year2026.tfsa_withdrawal || 0) / totalWithdrawals * 100).toFixed(1).padStart(6)}%`);
        console.log(`  RRSP:           ${((year2026.rrsp_withdrawal || 0) / totalWithdrawals * 100).toFixed(1).padStart(6)}%`);
        console.log(`  RRIF:           ${((year2026.rrif_withdrawal || 0) / totalWithdrawals * 100).toFixed(1).padStart(6)}%`);
        console.log(`  Non-Registered: ${((year2026.nonreg_withdrawal || 0) / totalWithdrawals * 100).toFixed(1).padStart(6)}% ⭐`);
        console.log(`  Corporate:      ${((year2026.corporate_withdrawal || 0) / totalWithdrawals * 100).toFixed(1).padStart(6)}%`);
      }

      // Tax efficiency analysis
      console.log('\n📉 Tax Efficiency Analysis:');
      console.log('─'.repeat(80));
      const grossIncome = year2026.total_income || 0;
      const netIncome = grossIncome - (year2026.total_tax || 0);
      console.log(`  Gross Income:         $${grossIncome.toLocaleString().padStart(10)}`);
      console.log(`  Total Tax:            $${(year2026.total_tax || 0).toLocaleString().padStart(10)}`);
      console.log(`  Net Income:           $${netIncome.toLocaleString().padStart(10)}`);
      console.log(`  Tax as % of Gross:    ${((year2026.total_tax || 0) / grossIncome * 100).toFixed(2)}%`);
      console.log(`  After-tax Keep Rate:  ${(netIncome / grossIncome * 100).toFixed(2)}%`);

    } else {
      console.log('❌ No year-by-year data available');
    }

    // Summary comparison
    console.log('\n' + '='.repeat(80));
    console.log('🔄 BEFORE vs AFTER BUG FIX COMPARISON');
    console.log('='.repeat(80));

    console.log(`
PORTFOLIO ALLOCATION:
  Before Fix (WRONG):        After Fix (CORRECT):
  - TFSA:       11.3%         - TFSA:        5.1% ✅
  - Corporate:  88.7%         - RRSP:        5.2% ✅
  - Non-Reg:     0.0% ❌      - Corporate:  66.3% ✅
                              - Non-Reg:    23.3% ✅

EXPECTED TAX RATE CHANGE:
  Before Fix:  1.7%           After Fix:  4-6% (expected) ⭐

  Current Simulation: ${((result.summary?.avg_effective_tax_rate || 0) * 100).toFixed(2)}%
  ${((result.summary?.avg_effective_tax_rate || 0) * 100) > 3.5 ? '✅ Tax rate increased as expected!' : '⚠️  Tax rate may still be low - verify capital gains calculation'}
    `);

    console.log('='.repeat(80));
    console.log('✅ SIMULATION TEST COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error running simulation:', error);
  }
}

// Run the simulation
runSimulation();
