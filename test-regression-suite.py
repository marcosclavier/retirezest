#!/usr/bin/env python3
"""
Comprehensive regression test suite to ensure pension and GIS fixes don't break other scenarios
Tests multiple retirement scenarios with different income levels and configurations
"""
import requests
import json
import sys
from typing import Dict, List, Tuple

def run_simulation(payload: dict, scenario_name: str) -> Tuple[bool, dict]:
    """Run a single simulation and return success status and results"""
    try:
        response = requests.post(
            "http://localhost:8000/api/run-simulation",
            json=payload
        )

        if response.status_code != 200:
            print(f"  ❌ {scenario_name}: API Error {response.status_code}")
            return False, {}

        result = response.json()
        years = result.get("year_by_year", [])

        if not years:
            print(f"  ❌ {scenario_name}: No year data returned")
            return False, {}

        return True, years[0]  # Return first year for analysis

    except Exception as e:
        print(f"  ❌ {scenario_name}: Exception {str(e)}")
        return False, {}

def test_low_income_with_gis():
    """Test 1: Low-income senior who SHOULD receive GIS"""
    print("\n📊 TEST 1: Low-Income Senior (Should get GIS)")
    print("-" * 50)

    payload = {
        "p1": {
            "name": "LowIncome",
            "start_age": 67,
            "cpp_start_age": 67,
            "cpp_annual_at_start": 5000,  # Low CPP
            "oas_start_age": 67,
            "oas_annual_at_start": 8904,
            "pension_incomes": [],  # No pension
            "other_incomes": [],
            "tfsa_balance": 5000,
            "rrif_balance": 50000,  # Small RRIF
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "tfsa_room_start": 50000,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            "nonreg_acb": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "p2": {
            "name": "",
            "start_age": 67,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_incomes": [],
            "other_incomes": [],
            "tfsa_balance": 0,
            "rrif_balance": 0,
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "tfsa_room_start": 0,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            "nonreg_acb": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "include_partner": False,
        "province": "AB",
        "start_year": 2033,
        "end_age": 85,
        "strategy": "minimize-income",  # Use valid strategy that minimizes income for GIS
        "spending_go_go": 25000,  # Low spending
        "go_go_end_age": 75,
        "spending_slow_go": 25000,
        "slow_go_end_age": 85,
        "spending_no_go": 20000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
        "tfsa_room_annual_growth": 2.0,
        "gap_tolerance": 0.01,
        "reinvest_nonreg_dist": False,
        "income_split_rrif_fraction": 0.5,
        "hybrid_rrif_topup_per_person": 0,
        "stop_on_fail": False
    }

    success, year_data = run_simulation(payload, "Low Income GIS Test")

    if success:
        gis = year_data.get("gis_p1", 0)
        cpp = year_data.get("cpp_p1", 0)
        oas = year_data.get("oas_p1", 0)
        rrif_wd = year_data.get("rrif_withdrawal_p1", 0)

        print(f"  CPP: ${cpp:,.0f}")
        print(f"  OAS: ${oas:,.0f}")
        print(f"  GIS: ${gis:,.0f}")
        print(f"  RRIF Withdrawal: ${rrif_wd:,.0f}")

        # With low income, should receive GIS
        if gis > 0:
            print(f"  ✅ PASS: Low-income senior correctly receives GIS (${gis:,.0f})")
            return True
        else:
            print(f"  ❌ FAIL: Low-income senior should receive GIS but got $0")
            return False

    return False

def test_moderate_income_no_pension():
    """Test 2: Moderate income without pension"""
    print("\n📊 TEST 2: Moderate Income, No Pension")
    print("-" * 50)

    payload = {
        "p1": {
            "name": "Moderate",
            "start_age": 67,
            "cpp_start_age": 67,
            "cpp_annual_at_start": 10000,
            "oas_start_age": 67,
            "oas_annual_at_start": 8904,
            "pension_incomes": [],  # No pension
            "other_incomes": [],
            "tfsa_balance": 50000,
            "rrif_balance": 300000,
            "rrsp_balance": 0,
            "nonreg_balance": 100000,
            "corporate_balance": 0,
            "tfsa_room_start": 100000,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            "nonreg_acb": 100000,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 100000,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "p2": {
            "name": "",
            "start_age": 67,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_incomes": [],
            "other_incomes": [],
            "tfsa_balance": 0,
            "rrif_balance": 0,
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "tfsa_room_start": 0,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            "nonreg_acb": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "include_partner": False,
        "province": "AB",
        "start_year": 2033,
        "end_age": 85,
        "strategy": "rrif-frontload",
        "spending_go_go": 50000,
        "go_go_end_age": 75,
        "spending_slow_go": 45000,
        "slow_go_end_age": 85,
        "spending_no_go": 40000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
        "tfsa_room_annual_growth": 2.0,
        "gap_tolerance": 0.01,
        "reinvest_nonreg_dist": False,
        "income_split_rrif_fraction": 0.5,
        "hybrid_rrif_topup_per_person": 0,
        "stop_on_fail": False
    }

    success, year_data = run_simulation(payload, "Moderate Income Test")

    if success:
        gis = year_data.get("gis_p1", 0)
        cpp = year_data.get("cpp_p1", 0)
        oas = year_data.get("oas_p1", 0)
        rrif_wd = year_data.get("rrif_withdrawal_p1", 0)
        nonreg_wd = year_data.get("nonreg_withdrawal_p1", 0)
        employer_pension = year_data.get("employer_pension_p1", 0)
        total_tax = year_data.get("total_tax", 0)

        print(f"  CPP: ${cpp:,.0f}")
        print(f"  OAS: ${oas:,.0f}")
        print(f"  GIS: ${gis:,.0f}")
        print(f"  RRIF Withdrawal: ${rrif_wd:,.0f}")
        print(f"  NonReg Withdrawal: ${nonreg_wd:,.0f}")
        print(f"  Employer Pension: ${employer_pension:,.0f}")
        print(f"  Total Tax: ${total_tax:,.0f}")

        # Check that basic functionality works
        if cpp > 0 and oas > 0 and rrif_wd > 0:
            print(f"  ✅ PASS: Basic income sources working correctly")
            return True
        else:
            print(f"  ❌ FAIL: Basic income sources not functioning")
            return False

    return False

def test_couple_scenario():
    """Test 3: Couple with mixed income levels"""
    print("\n📊 TEST 3: Couple Scenario")
    print("-" * 50)

    payload = {
        "p1": {
            "name": "Partner1",
            "start_age": 67,
            "cpp_start_age": 67,
            "cpp_annual_at_start": 8000,
            "oas_start_age": 67,
            "oas_annual_at_start": 8904,
            "pension_incomes": [{
                "name": "Small Pension",
                "amount": 20000,
                "startAge": 67,
                "inflationIndexed": True
            }],
            "other_incomes": [],
            "tfsa_balance": 30000,
            "rrif_balance": 200000,
            "rrsp_balance": 0,
            "nonreg_balance": 50000,
            "corporate_balance": 0,
            "tfsa_room_start": 80000,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            "nonreg_acb": 50000,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 50000,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "p2": {
            "name": "Partner2",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 6000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8904,
            "pension_incomes": [],
            "other_incomes": [],
            "tfsa_balance": 20000,
            "rrif_balance": 150000,
            "rrsp_balance": 0,
            "nonreg_balance": 30000,
            "corporate_balance": 0,
            "tfsa_room_start": 70000,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            "nonreg_acb": 30000,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 30000,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "include_partner": True,
        "province": "AB",
        "start_year": 2033,
        "end_age": 85,
        "strategy": "rrif-frontload",
        "spending_go_go": 70000,
        "go_go_end_age": 75,
        "spending_slow_go": 65000,
        "slow_go_end_age": 85,
        "spending_no_go": 60000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
        "tfsa_room_annual_growth": 2.0,
        "gap_tolerance": 0.01,
        "reinvest_nonreg_dist": False,
        "income_split_rrif_fraction": 0.5,
        "hybrid_rrif_topup_per_person": 0,
        "stop_on_fail": False
    }

    success, year_data = run_simulation(payload, "Couple Test")

    if success:
        cpp_p1 = year_data.get("cpp_p1", 0)
        cpp_p2 = year_data.get("cpp_p2", 0)
        oas_p1 = year_data.get("oas_p1", 0)
        oas_p2 = year_data.get("oas_p2", 0)
        gis_p1 = year_data.get("gis_p1", 0)
        gis_p2 = year_data.get("gis_p2", 0)
        pension_p1 = year_data.get("employer_pension_p1", 0)

        print(f"  Partner 1 - CPP: ${cpp_p1:,.0f}, OAS: ${oas_p1:,.0f}, GIS: ${gis_p1:,.0f}, Pension: ${pension_p1:,.0f}")
        print(f"  Partner 2 - CPP: ${cpp_p2:,.0f}, OAS: ${oas_p2:,.0f}, GIS: ${gis_p2:,.0f}")

        # Check couple functionality
        if cpp_p1 > 0 and cpp_p2 > 0 and pension_p1 == 20000:
            print(f"  ✅ PASS: Couple simulation working correctly")
            return True
        else:
            print(f"  ❌ FAIL: Couple simulation has issues")
            return False

    return False

def test_high_pension_no_gis():
    """Test 4: High pension should NOT receive GIS (original fix validation)"""
    print("\n📊 TEST 4: High Pension (Should NOT get GIS)")
    print("-" * 50)

    payload = {
        "p1": {
            "name": "HighPension",
            "start_age": 67,
            "cpp_start_age": 67,
            "cpp_annual_at_start": 12492,
            "oas_start_age": 67,
            "oas_annual_at_start": 8904,
            "pension_incomes": [{
                "name": "Large Pension",
                "amount": 80000,
                "startAge": 67,
                "inflationIndexed": True
            }],
            "other_incomes": [],
            "tfsa_balance": 100000,
            "rrif_balance": 500000,
            "rrsp_balance": 0,
            "nonreg_balance": 200000,
            "corporate_balance": 0,
            "tfsa_room_start": 150000,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            "nonreg_acb": 200000,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 200000,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "p2": {
            "name": "",
            "start_age": 67,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_incomes": [],
            "other_incomes": [],
            "tfsa_balance": 0,
            "rrif_balance": 0,
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "tfsa_room_start": 0,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            "nonreg_acb": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "include_partner": False,
        "province": "AB",
        "start_year": 2033,
        "end_age": 85,
        "strategy": "rrif-frontload",
        "spending_go_go": 80000,
        "go_go_end_age": 75,
        "spending_slow_go": 75000,
        "slow_go_end_age": 85,
        "spending_no_go": 70000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
        "tfsa_room_annual_growth": 2.0,
        "gap_tolerance": 0.01,
        "reinvest_nonreg_dist": False,
        "income_split_rrif_fraction": 0.5,
        "hybrid_rrif_topup_per_person": 0,
        "stop_on_fail": False
    }

    success, year_data = run_simulation(payload, "High Pension Test")

    if success:
        gis = year_data.get("gis_p1", 0)
        pension = year_data.get("employer_pension_p1", 0)

        print(f"  Employer Pension: ${pension:,.0f}")
        print(f"  GIS: ${gis:,.0f}")

        # With high pension, should NOT receive GIS
        if gis == 0 and pension == 80000:
            print(f"  ✅ PASS: High-pension individual correctly receives NO GIS")
            return True
        else:
            print(f"  ❌ FAIL: High-pension individual incorrectly receives GIS (${gis:,.0f})")
            return False

    return False

def main():
    print("=" * 70)
    print("REGRESSION TEST SUITE - PENSION & GIS FIXES")
    print("=" * 70)
    print("Running comprehensive tests to ensure fixes don't break other scenarios...")

    results = []

    # Run all tests
    results.append(("Low Income with GIS", test_low_income_with_gis()))
    results.append(("Moderate Income No Pension", test_moderate_income_no_pension()))
    results.append(("Couple Scenario", test_couple_scenario()))
    results.append(("High Pension No GIS", test_high_pension_no_gis()))

    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)

    passed = sum(1 for _, result in results if result)
    failed = sum(1 for _, result in results if not result)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")

    print("\n" + "-" * 70)
    print(f"Total: {passed} passed, {failed} failed")

    if failed == 0:
        print("\n🎉 ALL REGRESSION TESTS PASSED!")
        print("The pension and GIS fixes are working correctly without breaking other scenarios.")
        return True
    else:
        print(f"\n⚠️  {failed} regression test(s) failed.")
        print("Please review the failed tests above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)