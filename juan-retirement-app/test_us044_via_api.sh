#!/bin/bash
# US-044 Auto-Optimization Test via API
# Tests auto-optimization by sending requests to the simulation API

API_URL="http://localhost:8000/api/simulate"

echo "================================================================================"
echo "US-044 AUTO-OPTIMIZATION TEST SUITE (via API)"
echo "================================================================================"
echo

# Test 1: Low RRIF Assets with rrif-first strategy
echo "================================================================================"
echo "🧪 TEST 1: Low RRIF Assets with rrif-first strategy"
echo "================================================================================"
echo "Description: Low RRIF (100k) but decent TFSA (150k). rrif-first should run out"
echo "Expected: Auto-switch from rrif-first to tfsa-first"
echo

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "province": "ON",
    "start_year": 2026,
    "end_age": 95,
    "strategy": "rrif-first",
    "spending_go_go": 80000,
    "go_go_end_age": 75,
    "spending_slow_go": 60000,
    "slow_go_end_age": 85,
    "spending_no_go": 50000,
    "spending_inflation": 2.5,
    "general_inflation": 2.0,
    "tfsa_room_annual_growth": 7000,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": false,
    "income_split_rrif_fraction": 0.0,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": false,
    "p1": {
      "name": "Test Person 1",
      "start_age": 65,
      "cpp_start_age": 65,
      "cpp_annual_at_start": 12000,
      "oas_start_age": 65,
      "oas_annual_at_start": 8000,
      "pension_incomes": [],
      "other_incomes": [],
      "tfsa_balance": 150000,
      "rrif_balance": 100000,
      "rrsp_balance": 0,
      "nonreg_balance": 80000,
      "corporate_balance": 0,
      "nonreg_acb": 64000,
      "nr_cash": 8000,
      "nr_gic": 16000,
      "nr_invest": 56000,
      "y_nr_cash_interest": 2.0,
      "y_nr_gic_interest": 3.5,
      "y_nr_inv_total_return": 6.0,
      "y_nr_inv_elig_div": 2.0,
      "y_nr_inv_nonelig_div": 0.5,
      "y_nr_inv_capg": 3.0,
      "y_nr_inv_roc_pct": 0.5,
      "nr_cash_pct": 10.0,
      "nr_gic_pct": 20.0,
      "nr_invest_pct": 70.0,
      "corp_cash_bucket": 0,
      "corp_gic_bucket": 0,
      "corp_invest_bucket": 0,
      "corp_rdtoh": 0,
      "y_corp_cash_interest": 2.0,
      "y_corp_gic_interest": 3.5,
      "y_corp_inv_total_return": 6.0,
      "y_corp_inv_elig_div": 2.0,
      "y_corp_inv_capg": 3.5,
      "corp_cash_pct": 5.0,
      "corp_gic_pct": 10.0,
      "corp_invest_pct": 85.0,
      "corp_dividend_type": "eligible",
      "tfsa_room_start": 7000,
      "tfsa_contribution_annual": 0,
      "enable_early_rrif_withdrawal": false,
      "early_rrif_withdrawal_start_age": 65,
      "early_rrif_withdrawal_end_age": 70,
      "early_rrif_withdrawal_annual": 20000,
      "early_rrif_withdrawal_percentage": 5.0,
      "early_rrif_withdrawal_mode": "fixed"
    },
    "p2": {
      "name": "",
      "start_age": 65,
      "cpp_start_age": 65,
      "cpp_annual_at_start": 15000,
      "oas_start_age": 65,
      "oas_annual_at_start": 8500,
      "pension_incomes": [],
      "other_incomes": [],
      "tfsa_balance": 0,
      "rrif_balance": 0,
      "rrsp_balance": 0,
      "nonreg_balance": 0,
      "corporate_balance": 0,
      "nonreg_acb": 0,
      "nr_cash": 0,
      "nr_gic": 0,
      "nr_invest": 0,
      "y_nr_cash_interest": 2.0,
      "y_nr_gic_interest": 3.5,
      "y_nr_inv_total_return": 6.0,
      "y_nr_inv_elig_div": 2.0,
      "y_nr_inv_nonelig_div": 0.5,
      "y_nr_inv_capg": 3.0,
      "y_nr_inv_roc_pct": 0.5,
      "nr_cash_pct": 10.0,
      "nr_gic_pct": 20.0,
      "nr_invest_pct": 70.0,
      "corp_cash_bucket": 0,
      "corp_gic_bucket": 0,
      "corp_invest_bucket": 0,
      "corp_rdtoh": 0,
      "y_corp_cash_interest": 2.0,
      "y_corp_gic_interest": 3.5,
      "y_corp_inv_total_return": 6.0,
      "y_corp_inv_elig_div": 2.0,
      "y_corp_inv_capg": 3.5,
      "corp_cash_pct": 5.0,
      "corp_gic_pct": 10.0,
      "corp_invest_pct": 85.0,
      "corp_dividend_type": "eligible",
      "tfsa_room_start": 7000,
      "tfsa_contribution_annual": 0,
      "enable_early_rrif_withdrawal": false,
      "early_rrif_withdrawal_start_age": 65,
      "early_rrif_withdrawal_end_age": 70,
      "early_rrif_withdrawal_annual": 20000,
      "early_rrif_withdrawal_percentage": 5.0,
      "early_rrif_withdrawal_mode": "fixed"
    }
  }' 2>&1 | python3 -m json.tool | grep -A 20 "optimization_result"

echo
echo "================================================================================"
echo

# Test 2: High Spending with minimize-income
echo "================================================================================"
echo "🧪 TEST 2: High Spending with minimize-income strategy"
echo "================================================================================"
echo "Description: High spending with conservative minimize-income strategy"
echo "Expected: Auto-switch to balanced or tfsa-first"
echo

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "province": "BC",
    "start_year": 2026,
    "end_age": 90,
    "strategy": "minimize-income",
    "spending_go_go": 120000,
    "go_go_end_age": 75,
    "spending_slow_go": 100000,
    "slow_go_end_age": 85,
    "spending_no_go": 80000,
    "spending_inflation": 3.0,
    "general_inflation": 2.5,
    "tfsa_room_annual_growth": 7000,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": false,
    "income_split_rrif_fraction": 0.0,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": false,
    "p1": {
      "name": "High Spender",
      "start_age": 62,
      "cpp_start_age": 65,
      "cpp_annual_at_start": 10000,
      "oas_start_age": 65,
      "oas_annual_at_start": 8000,
      "pension_incomes": [],
      "other_incomes": [],
      "tfsa_balance": 120000,
      "rrif_balance": 200000,
      "rrsp_balance": 0,
      "nonreg_balance": 150000,
      "corporate_balance": 0,
      "nonreg_acb": 120000,
      "nr_cash": 15000,
      "nr_gic": 30000,
      "nr_invest": 105000,
      "y_nr_cash_interest": 2.0,
      "y_nr_gic_interest": 3.5,
      "y_nr_inv_total_return": 6.0,
      "y_nr_inv_elig_div": 2.0,
      "y_nr_inv_nonelig_div": 0.5,
      "y_nr_inv_capg": 3.0,
      "y_nr_inv_roc_pct": 0.5,
      "nr_cash_pct": 10.0,
      "nr_gic_pct": 20.0,
      "nr_invest_pct": 70.0,
      "corp_cash_bucket": 0,
      "corp_gic_bucket": 0,
      "corp_invest_bucket": 0,
      "corp_rdtoh": 0,
      "y_corp_cash_interest": 2.0,
      "y_corp_gic_interest": 3.5,
      "y_corp_inv_total_return": 6.0,
      "y_corp_inv_elig_div": 2.0,
      "y_corp_inv_capg": 3.5,
      "corp_cash_pct": 5.0,
      "corp_gic_pct": 10.0,
      "corp_invest_pct": 85.0,
      "corp_dividend_type": "eligible",
      "tfsa_room_start": 7000,
      "tfsa_contribution_annual": 0,
      "enable_early_rrif_withdrawal": false,
      "early_rrif_withdrawal_start_age": 65,
      "early_rrif_withdrawal_end_age": 70,
      "early_rrif_withdrawal_annual": 20000,
      "early_rrif_withdrawal_percentage": 5.0,
      "early_rrif_withdrawal_mode": "fixed"
    },
    "p2": {
      "name": "",
      "start_age": 65,
      "cpp_start_age": 65,
      "cpp_annual_at_start": 15000,
      "oas_start_age": 65,
      "oas_annual_at_start": 8500,
      "pension_incomes": [],
      "other_incomes": [],
      "tfsa_balance": 0,
      "rrif_balance": 0,
      "rrsp_balance": 0,
      "nonreg_balance": 0,
      "corporate_balance": 0,
      "nonreg_acb": 0,
      "nr_cash": 0,
      "nr_gic": 0,
      "nr_invest": 0,
      "y_nr_cash_interest": 2.0,
      "y_nr_gic_interest": 3.5,
      "y_nr_inv_total_return": 6.0,
      "y_nr_inv_elig_div": 2.0,
      "y_nr_inv_nonelig_div": 0.5,
      "y_nr_inv_capg": 3.0,
      "y_nr_inv_roc_pct": 0.5,
      "nr_cash_pct": 10.0,
      "nr_gic_pct": 20.0,
      "nr_invest_pct": 70.0,
      "corp_cash_bucket": 0,
      "corp_gic_bucket": 0,
      "corp_invest_bucket": 0,
      "corp_rdtoh": 0,
      "y_corp_cash_interest": 2.0,
      "y_corp_gic_interest": 3.5,
      "y_corp_inv_total_return": 6.0,
      "y_corp_inv_elig_div": 2.0,
      "y_corp_inv_capg": 3.5,
      "corp_cash_pct": 5.0,
      "corp_gic_pct": 10.0,
      "corp_invest_pct": 85.0,
      "corp_dividend_type": "eligible",
      "tfsa_room_start": 7000,
      "tfsa_contribution_annual": 0,
      "enable_early_rrif_withdrawal": false,
      "early_rrif_withdrawal_start_age": 65,
      "early_rrif_withdrawal_end_age": 70,
      "early_rrif_withdrawal_annual": 20000,
      "early_rrif_withdrawal_percentage": 5.0,
      "early_rrif_withdrawal_mode": "fixed"
    }
  }' 2>&1 | python3 -m json.tool | grep -A 20 "optimization_result"

echo
echo "================================================================================"
echo "✅ Test Suite Complete"
echo "================================================================================"
