#!/usr/bin/env python3
"""
Debug test for single person simulation
"""

import json
import requests

API_URL = "http://localhost:8000/api/run-simulation"

# Single person payload
payload = {
    "p1": {
        "name": "John",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 10000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8000,
        "tfsa_balance": 50000,
        "rrif_balance": 100000,
        "rrsp_balance": 0,
        "nonreg_balance": 25000,
        "corporate_balance": 0,
        "nonreg_acb": 20000,
        "nr_cash": 2500,
        "nr_gic": 5000,
        "nr_invest": 17500,
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
        "enable_early_rrif_withdrawal": True,
        "early_rrif_withdrawal_start_age": 65,
        "early_rrif_withdrawal_end_age": 70,
        "early_rrif_withdrawal_annual": 20000,
        "early_rrif_withdrawal_percentage": 5.0,
        "early_rrif_withdrawal_mode": "percentage",
        "pension_incomes": [],
        "other_incomes": []
    },
    "p2": {
        "name": "",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 0,
        "oas_start_age": 65,
        "oas_annual_at_start": 0,
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
        "tfsa_room_start": 0,
        "tfsa_contribution_annual": 0,
        "enable_early_rrif_withdrawal": False,
        "early_rrif_withdrawal_start_age": 65,
        "early_rrif_withdrawal_end_age": 70,
        "early_rrif_withdrawal_annual": 0,
        "early_rrif_withdrawal_percentage": 0,
        "early_rrif_withdrawal_mode": "fixed",
        "pension_incomes": [],
        "other_incomes": []
    },
    "province": "AB",
    "start_year": 2025,
    "include_partner": False,  # SINGLE PERSON MODE
    "end_age": 95,
    "strategy": "minimize-income",
    "spending_go_go": 40000,
    "go_go_end_age": 75,
    "spending_slow_go": 35000,
    "slow_go_end_age": 85,
    "spending_no_go": 30000,
    "spending_inflation": 2.0,
    "general_inflation": 2.0,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0.0,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False,
    "tfsa_room_annual_growth": 7000
}

print("Testing Single Person Simulation...")
print(f"include_partner: {payload['include_partner']}")
print(f"P1 name: {payload['p1']['name']}")
print(f"P2 name: {payload['p2']['name']}")
print()

response = requests.post(API_URL, json=payload)

print(f"Status Code: {response.status_code}")
print()

if response.status_code == 200:
    data = response.json()
    print("Response structure:")
    print(f"  Keys: {list(data.keys())}")
    print(f"  Success: {data.get('success')}")
    print(f"  Message: {data.get('message')}")
    print()

    if data.get('summary'):
        print("✅ Summary exists!")
        summary = data['summary']
        print(f"  Health Score: {summary.get('health_score')}")
        print(f"  Success Rate: {summary.get('success_rate')}")
        print(f"  Years Funded: {summary.get('years_funded')}/{summary.get('years_simulated')}")
        print(f"  Final Estate: ${summary.get('final_estate_after_tax', 0):,.0f}")
    else:
        print("❌ Summary is None or missing")

    if data.get('year_by_year'):
        print(f"\n✅ Year-by-year data exists with {len(data['year_by_year'])} years")
    else:
        print("\n❌ Year-by-year data is None or missing")

    if data.get('error'):
        print(f"\n❌ ERROR: {data.get('error')}")
        if data.get('error_details'):
            print(f"   Details: {data.get('error_details')}")
else:
    print(f"Error: {response.text}")