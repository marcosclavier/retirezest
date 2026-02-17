#!/usr/bin/env python3
"""
Direct test of Python backend to verify pension and TFSA fixes
"""
import requests
import json
from datetime import datetime

# Test Rafael's scenario
test_payload = {
    "p1": {
        "name": "Rafael",
        "start_age": 67,
        "cpp_start_age": 67,
        "cpp_annual_at_start": 12492,
        "oas_start_age": 67,
        "oas_annual_at_start": 8904,
        "pension_incomes": [{
            "name": "Employer Pension",
            "amount": 100000,
            "startAge": 67,
            "inflationIndexed": True
        }],
        "other_incomes": [],
        "tfsa_balance": 1000,
        "rrif_balance": 0,
        "rrsp_balance": 100000,
        "nonreg_balance": 0,
        "corporate_balance": 0,
        "tfsa_room_start": 157500,  # Accumulated room
        "tfsa_contribution_annual": 0,
        "enable_early_rrif_withdrawal": False,
        # NonReg details
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
        # Corporate details
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
        # NonReg details
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
        # Corporate details
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
    "spending_go_go": 70000,
    "go_go_end_age": 75,
    "spending_slow_go": 60000,
    "slow_go_end_age": 85,
    "spending_no_go": 50000,
    "spending_inflation": 2.0,
    "general_inflation": 2.0,
    "tfsa_room_annual_growth": 2.0,
    "gap_tolerance": 0.01,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0.5,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False
}

print("=" * 60)
print("TESTING BACKEND DIRECTLY - PENSION & TFSA FIXES")
print("=" * 60)
print()

# Call backend API
response = requests.post(
    "http://localhost:8000/api/run-simulation",
    json=test_payload
)

if response.status_code == 200:
    result = response.json()

    # Debug: print the response structure
    print("Response keys:", result.keys() if isinstance(result, dict) else "Not a dict")

    # Check what years are returned - the API uses "year_by_year" not "years"
    years = result.get("year_by_year", [])
    print(f"Received {len(years)} years of data")

    if years:
        print(f"Years range: {years[0]['year']} to {years[-1]['year']}")

        # Use first retirement year
        year_2033 = years[0]
        print(f"\nUsing year {year_2033['year']} for testing:")
    else:
        year_2033 = None

    if year_2033:
        print("✅ YEAR 2033 RESULTS:")
        print("-" * 40)

        # Check pension
        employer_pension = year_2033.get("employer_pension_p1", 0)
        print(f"1. Employer Pension: ${employer_pension:,.0f}")
        if employer_pension == 100000:
            print("   ✅ Pension correctly included")
        else:
            print(f"   ❌ ERROR: Expected $100,000")

        # Check TFSA reinvestment
        tfsa_reinvest = year_2033.get("tfsa_reinvest_p1", 0)
        print(f"\n2. TFSA Reinvestment: ${tfsa_reinvest:,.0f}")
        if tfsa_reinvest > 7000:
            print(f"   ✅ TFSA getting surplus (not limited to $7k)")
        else:
            print(f"   ❌ ERROR: TFSA limited to $7,000")

        # Check Non-Reg reinvestment
        nonreg_reinvest = year_2033.get("reinvest_nonreg_p1", 0)
        print(f"\n3. Non-Reg Reinvestment: ${nonreg_reinvest:,.0f}")

        # Check balances
        print(f"\n4. End Balances:")
        print(f"   RRIF: ${year_2033.get('rrif_balance_p1', 0):,.0f}")
        print(f"   TFSA: ${year_2033.get('tfsa_balance_p1', 0):,.0f}")
        print(f"   Non-Reg: ${year_2033.get('nonreg_balance_p1', 0):,.0f}")

        # Calculate total inflows
        cpp = year_2033.get("cpp_p1", 0)
        oas = year_2033.get("oas_p1", 0)
        gis = year_2033.get("gis_p1", 0)
        rrif_wd = year_2033.get("rrif_withdrawal_p1", 0)
        tfsa_wd = year_2033.get("tfsa_withdrawal_p1", 0)
        nonreg_wd = year_2033.get("nonreg_withdrawal_p1", 0)

        total_inflows = cpp + oas + gis + employer_pension + rrif_wd + tfsa_wd + nonreg_wd
        print(f"\n5. Total Inflows: ${total_inflows:,.0f}")
        if total_inflows > 150000:
            print("   ✅ Includes pension (>$150k)")
        else:
            print("   ❌ Missing pension income")

    else:
        print("❌ Year 2033 not found in results")
else:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)