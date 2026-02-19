#!/usr/bin/env python3
"""
Test script to verify pension indexing fix
Tests both indexed and non-indexed pensions
"""

import requests
import json

# Test data with both indexed and non-indexed pensions
test_payload = {
    "p1": {
        "name": "Test User",
        "start_age": 67,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 12492,
        "oas_start_age": 65,
        "oas_annual_at_start": 8904,
        "tfsa_balance": 50000,
        "rrif_balance": 350000,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 0,
        "nonreg_acb": 0,
        "tfsa_room_start": 108500,
        "tfsa_contribution_annual": 7000,
        "pension_incomes": [
            {
                "name": "Fixed Pension",
                "amount": 50000,
                "startAge": 67,
                "inflationIndexed": False  # This should NOT be indexed
            },
            {
                "name": "Indexed Pension",
                "amount": 30000,
                "startAge": 67,
                "inflationIndexed": True  # This SHOULD be indexed
            }
        ],
        "other_incomes": []
    },
    "p2": {
        "name": "",
        "start_age": 60,
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
        "nonreg_acb": 0,
        "tfsa_room_start": 0,
        "tfsa_contribution_annual": 0
    },
    "include_partner": False,
    "province": "AB",
    "start_year": 2033,
    "end_age": 85,
    "strategy": "rrif-frontload",
    "spending_go_go": 100000,
    "go_go_end_age": 75,
    "spending_slow_go": 80000,
    "slow_go_end_age": 85,
    "spending_no_go": 70000,
    "spending_inflation": 2,
    "general_inflation": 2,
    "tfsa_room_annual_growth": 7000,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False
}

# Test against production API
print("Testing pension indexing against production API...")
print("=" * 60)

url = "https://astonishing-learning-production.up.railway.app/api/run-simulation"

try:
    response = requests.post(url, json=test_payload, timeout=30)
    if response.status_code == 200:
        result = response.json()

        if result.get('success'):
            print("✅ Simulation successful!")

            # Check year-by-year data
            year_by_year = result.get('year_by_year', [])

            # Check years 2041 and 2042 (years 8 and 9 after retirement)
            year_2041 = next((y for y in year_by_year if y['year'] == 2041), None)
            year_2042 = next((y for y in year_by_year if y['year'] == 2042), None)

            if year_2041 and year_2042:
                # Extract pension income
                pension_2041 = year_2041.get('pension_income_p1', 0)
                pension_2042 = year_2042.get('pension_income_p1', 0)

                print(f"\n📊 Pension Income Analysis:")
                print(f"  2041 (Age 75): ${pension_2041:,.0f}")
                print(f"  2042 (Age 76): ${pension_2042:,.0f}")

                # Expected values with 2% inflation
                # Fixed: $50,000 (no change)
                # Indexed after 8 years: $30,000 * (1.02^8) = $35,146
                # Total 2041: $50,000 + $35,146 = $85,146

                # Fixed: $50,000 (no change)
                # Indexed after 9 years: $30,000 * (1.02^9) = $35,849
                # Total 2042: $50,000 + $35,849 = $85,849

                expected_2041 = 50000 + 30000 * (1.02 ** 8)
                expected_2042 = 50000 + 30000 * (1.02 ** 9)

                print(f"\n📈 Expected Values (2% inflation):")
                print(f"  2041: ${expected_2041:,.0f}")
                print(f"  2042: ${expected_2042:,.0f}")

                # Check if fixed pension is actually fixed
                tolerance = 100  # Allow small rounding differences

                diff_2041 = abs(pension_2041 - expected_2041)
                diff_2042 = abs(pension_2042 - expected_2042)

                if diff_2041 < tolerance and diff_2042 < tolerance:
                    print("\n✅ PASS: Pension indexing working correctly!")
                    print("  - Fixed pension staying at $50,000")
                    print("  - Indexed pension growing with inflation")
                else:
                    print(f"\n❌ FAIL: Pension values don't match expected!")
                    print(f"  Difference 2041: ${diff_2041:,.0f}")
                    print(f"  Difference 2042: ${diff_2042:,.0f}")

            else:
                print("❌ Could not find year 2041 or 2042 in results")

        else:
            print(f"❌ Simulation failed: {result.get('message', 'Unknown error')}")
    else:
        print(f"❌ HTTP Error {response.status_code}")
        print(response.text[:500])

except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "=" * 60)
print("Test complete!")