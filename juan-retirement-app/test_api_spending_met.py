"""
Test the spending_met calculation through the API endpoint.
This ensures the fix works end-to-end.
"""

import requests
import json

API_URL = "http://localhost:8000/api/run-simulation"

# Simple test case: household with non-reg accounts
test_input = {
    "p1": {
        "name": "Person 1",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 15000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 100000,
        "rrif_balance": 200000,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 1000000,
        "nonreg_acb": 0,
        "nr_cash": 0,
        "nr_gic": 0,
        "nr_invest": 300000,  # $300k in non-reg investments
        "y_nr_cash_interest": 2.0,
        "y_nr_gic_interest": 3.5,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 0.0,
        "nr_gic_pct": 0.0,
        "nr_invest_pct": 100.0,
        "corp_cash_bucket": 0,
        "corp_gic_bucket": 0,
        "corp_invest_bucket": 1000000,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 2.0,
        "y_corp_gic_interest": 3.5,
        "y_corp_inv_total_return": 6.0,
        "y_corp_inv_elig_div": 2.0,
        "y_corp_inv_capg": 3.5,
        "corp_cash_pct": 0.0,
        "corp_gic_pct": 0.0,
        "corp_invest_pct": 100.0,
        "corp_dividend_type": "eligible",
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "p2": {
        "name": "Person 2",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 15000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 100000,
        "rrif_balance": 200000,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 1000000,
        "nonreg_acb": 0,
        "nr_cash": 0,
        "nr_gic": 0,
        "nr_invest": 300000,  # $300k in non-reg investments
        "y_nr_cash_interest": 2.0,
        "y_nr_gic_interest": 3.5,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 0.0,
        "nr_gic_pct": 0.0,
        "nr_invest_pct": 100.0,
        "corp_cash_bucket": 0,
        "corp_gic_bucket": 0,
        "corp_invest_bucket": 1000000,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 2.0,
        "y_corp_gic_interest": 3.5,
        "y_corp_inv_total_return": 6.0,
        "y_corp_inv_elig_div": 2.0,
        "y_corp_inv_capg": 3.5,
        "corp_cash_pct": 0.0,
        "corp_gic_pct": 0.0,
        "corp_invest_pct": 100.0,
        "corp_dividend_type": "eligible",
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "corporate-optimized",
    "spending_go_go": 120000,
    "go_go_end_age": 75,
    "spending_slow_go": 90000,
    "slow_go_end_age": 85,
    "spending_no_go": 70000,
    "spending_inflation": 2.0,
    "general_inflation": 2.0,
    "gap_tolerance": 1000,
    "tfsa_contribution_each": 0,
    "reinvest_nonreg_dist": False,  # NOT reinvesting distributions
    "income_split_rrif_fraction": 0.0,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False
}

print("=" * 80)
print("TESTING API SPENDING_MET CALCULATION")
print("=" * 80)
print("\nSending simulation request to API...")
print(f"  API URL: {API_URL}")
print(f"  reinvest_nonreg_dist: {test_input['reinvest_nonreg_dist']}")
print(f"  NonReg balance per person: $300,000")
print(f"  Expected distributions: ~$18,000 per person (~6% total return)")

try:
    response = requests.post(API_URL, json=test_input, timeout=10)
    response.raise_for_status()

    result = response.json()

    if not result.get("success"):
        print(f"\n❌ API Error: {result.get('message')}")
        print(f"   Error details: {result.get('error_details')}")
        exit(1)

    # Get first year results
    year_results = result.get("year_by_year", [])
    if not year_results:
        print("\n❌ No year results returned")
        exit(1)

    first_year = year_results[0]

    print("\n" + "=" * 80)
    print("RESULTS - YEAR 2025")
    print("=" * 80)

    # Calculate components
    govt_benefits = (first_year["cpp_p1"] + first_year["cpp_p2"] +
                    first_year["oas_p1"] + first_year["oas_p2"])

    withdrawals = (first_year["tfsa_withdrawal_p1"] + first_year["tfsa_withdrawal_p2"] +
                  first_year["rrif_withdrawal_p1"] + first_year["rrif_withdrawal_p2"] +
                  first_year["nonreg_withdrawal_p1"] + first_year["nonreg_withdrawal_p2"] +
                  first_year["corporate_withdrawal_p1"] + first_year["corporate_withdrawal_p2"])

    # Get nonreg distributions from five_year_plan (more detailed)
    five_year_plan = result.get("five_year_plan", [])
    nonreg_dist = 0
    if five_year_plan:
        nonreg_dist = five_year_plan[0].get("nonreg_distributions_total", 0)

    total_tax = first_year["total_tax"]
    spending_met = first_year["spending_met"]
    spending_need = first_year["spending_need"]

    print(f"\nIncome Sources:")
    print(f"  Government Benefits:        ${govt_benefits:>10,.0f}")
    print(f"  Account Withdrawals:        ${withdrawals:>10,.0f}")
    print(f"  NonReg Distributions:       ${nonreg_dist:>10,.0f}")
    print(f"  Total Inflows:              ${govt_benefits + withdrawals + nonreg_dist:>10,.0f}")
    print(f"\nExpenses:")
    print(f"  Total Tax:                  ${total_tax:>10,.0f}")
    print(f"  " + "-" * 48)
    print(f"  Net Available (After Tax):  ${govt_benefits + withdrawals + nonreg_dist - total_tax:>10,.0f}")

    print(f"\nSpending:")
    print(f"  Spending Target:            ${spending_need:>10,.0f}")
    print(f"  Spending Met:               ${spending_met:>10,.0f}")
    print(f"  Surplus/Deficit:            ${spending_met - spending_need:>10,.0f}")

    # Verify the calculation
    expected_spending_met = govt_benefits + withdrawals + nonreg_dist - total_tax

    print("\n" + "=" * 80)
    if abs(spending_met - expected_spending_met) < 1:
        print("✅ TEST PASSED: API returns correct spending_met calculation!")
        print(f"   Spending Met = ${spending_met:,.0f}")
        if spending_met >= spending_need:
            print(f"   ✓ Spending target is fully funded with surplus of ${spending_met - spending_need:,.0f}")
        else:
            print(f"   ⚠ Shortfall of ${spending_need - spending_met:,.0f}")
    else:
        print("❌ TEST FAILED: Spending met calculation is incorrect")
        print(f"   Expected: ${expected_spending_met:,.0f}")
        print(f"   Got:      ${spending_met:,.0f}")
        print(f"   Difference: ${spending_met - expected_spending_met:,.0f}")
    print("=" * 80)

except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Could not connect to API")
    print("   Make sure the FastAPI server is running on port 8000")
except requests.exceptions.Timeout:
    print("\n❌ ERROR: API request timed out")
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
