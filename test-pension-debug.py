#!/usr/bin/env python3
"""
Debug test to check pension data flow
"""

import requests
import json

# Simpler test with just one non-indexed pension
test_payload = {
    "p1": {
        "name": "Test User",
        "start_age": 67,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 0,
        "oas_start_age": 70,
        "oas_annual_at_start": 0,
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
                "name": "Test Pension",
                "amount": 50000,
                "startAge": 67,
                "inflationIndexed": False
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
    "end_age": 75,
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

print("Testing pension data flow...")
print("=" * 60)

url = "https://astonishing-learning-production.up.railway.app/api/run-simulation"

try:
    response = requests.post(url, json=test_payload, timeout=30)
    print(f"Response status: {response.status_code}")

    if response.status_code == 200:
        result = response.json()

        if result.get('success'):
            print("✅ Simulation successful!")

            # Check first few years
            year_by_year = result.get('year_by_year', [])

            print("\n📊 Pension Income by Year:")
            for year_data in year_by_year[:5]:  # First 5 years
                year = year_data['year']
                age = year_data['age_p1']
                pension = year_data.get('pension_income_p1', 0)
                employer_pension = year_data.get('employer_pension_p1', 0)

                print(f"  Year {year} (Age {age}):")
                print(f"    - pension_income_p1: ${pension:,.0f}")
                print(f"    - employer_pension_p1: ${employer_pension:,.0f}")

                # Check income sources breakdown
                income_sources = year_data.get('income_sources_p1', {})
                if income_sources:
                    print(f"    - Income sources: {income_sources}")

            # Check if pension appears anywhere
            all_years_with_pension = [y for y in year_by_year if y.get('pension_income_p1', 0) > 0]
            print(f"\n📈 Years with pension income > 0: {len(all_years_with_pension)}")

            if len(all_years_with_pension) == 0:
                print("❌ FAIL: No pension income found in any year!")
                print("\n🔍 Checking other fields that might contain pension...")

                # Check first year in detail
                if year_by_year:
                    first_year = year_by_year[0]
                    print(f"\nAll fields in first year (2033):")
                    for key, value in first_year.items():
                        if 'pension' in key.lower() or 'employer' in key.lower() or 'income' in key.lower():
                            print(f"  {key}: {value}")

        else:
            print(f"❌ Simulation failed: {result.get('message', 'Unknown error')}")
            if 'warnings' in result:
                print(f"Warnings: {result['warnings']}")
    else:
        print(f"❌ HTTP Error {response.status_code}")
        print("Response:", response.text[:1000])

except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "=" * 60)