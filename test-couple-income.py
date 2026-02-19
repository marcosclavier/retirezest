#!/usr/bin/env python3
"""
Test script to verify couple income handling
Tests that person1 and person2 can have separate pensions and salaries
"""

import requests
import json

# Test data with couple, each having their own pension
test_payload = {
    "p1": {
        "name": "John",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 12000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8000,
        "tfsa_balance": 50000,
        "rrif_balance": 400000,
        "rrsp_balance": 0,
        "nonreg_balance": 100000,
        "corporate_balance": 0,
        "nonreg_acb": 80000,
        "tfsa_room_start": 95000,
        "tfsa_contribution_annual": 7000,
        "pension_incomes": [
            {
                "name": "John's Company Pension",
                "amount": 45000,
                "startAge": 65,
                "inflationIndexed": True
            }
        ],
        "other_incomes": [
            {
                "type": "employment",
                "name": "John's Part-time Work",
                "amount": 20000,
                "startAge": 65,
                "endAge": 70,
                "inflationIndexed": True
            }
        ]
    },
    "p2": {
        "name": "Jane",
        "start_age": 63,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 10000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8000,
        "pension_incomes": [
            {
                "name": "Jane's Teacher Pension",
                "amount": 55000,
                "startAge": 63,
                "inflationIndexed": True
            },
            {
                "name": "Jane's Small Pension",
                "amount": 10000,
                "startAge": 65,
                "inflationIndexed": False  # Fixed pension
            }
        ],
        "other_incomes": [
            {
                "type": "rental",
                "name": "Rental Property Income",
                "amount": 18000,
                "startAge": 63,
                "inflationIndexed": True
            }
        ],
        "tfsa_balance": 75000,
        "rrif_balance": 300000,
        "rrsp_balance": 0,
        "nonreg_balance": 50000,
        "corporate_balance": 0,
        "nonreg_acb": 40000,
        "tfsa_room_start": 95000,
        "tfsa_contribution_annual": 7000
    },
    "include_partner": True,
    "province": "ON",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "rrif-frontload",
    "spending_go_go": 120000,
    "go_go_end_age": 75,
    "spending_slow_go": 100000,
    "slow_go_end_age": 85,
    "spending_no_go": 80000,
    "spending_inflation": 2,
    "general_inflation": 2,
    "tfsa_room_annual_growth": 7000,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0.5,  # Allow income splitting for tax efficiency
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False
}

print("Testing couple with separate income sources...")
print("=" * 60)

url = "http://localhost:8000/api/run-simulation"

try:
    response = requests.post(url, json=test_payload, timeout=30)

    if response.status_code == 200:
        result = response.json()

        if result.get('success'):
            print("✅ Simulation successful!")

            # Check year-by-year data
            year_by_year = result.get('year_by_year', [])

            # Check first year (2025) when both are retired
            year_2025 = next((y for y in year_by_year if y['year'] == 2025), None)
            if year_2025:
                print(f"\n📊 Year 2025 Income Analysis:")
                print(f"  John (Age {year_2025['age_p1']}):")
                print(f"    - CPP: ${year_2025.get('cpp_p1', 0):,.0f}")
                print(f"    - OAS: ${year_2025.get('oas_p1', 0):,.0f}")
                print(f"    - Pension: ${year_2025.get('employer_pension_p1', 0):,.0f} (Company Pension)")
                print(f"    - Employment: Should show in other income")
                print(f"    - RRIF: ${year_2025.get('rrif_withdrawal_p1', 0):,.0f}")

                print(f"\n  Jane (Age {year_2025['age_p2']}):")
                print(f"    - CPP: ${year_2025.get('cpp_p2', 0):,.0f}")
                print(f"    - OAS: ${year_2025.get('oas_p2', 0):,.0f}")
                print(f"    - Pension: ${year_2025.get('employer_pension_p2', 0):,.0f} (Teacher + Small Pension)")
                print(f"    - Rental: Should show in other income")
                print(f"    - RRIF: ${year_2025.get('rrif_withdrawal_p2', 0):,.0f}")

            # Check year 2027 (2 years later with inflation)
            year_2027 = next((y for y in year_by_year if y['year'] == 2027), None)
            if year_2027:
                print(f"\n📊 Year 2027 Income Analysis (with 2% inflation):")
                print(f"  John (Age {year_2027['age_p1']}):")
                print(f"    - Pension: ${year_2027.get('employer_pension_p1', 0):,.0f} (should be ~$46,800)")

                print(f"\n  Jane (Age {year_2027['age_p2']}):")
                jane_pension_2027 = year_2027.get('employer_pension_p2', 0)
                print(f"    - Pension: ${jane_pension_2027:,.0f}")
                print(f"      Expected: Teacher ~$57,200 + Fixed $10,000 = ~$67,200")

                # Verify Jane's fixed pension stayed at $10,000
                if abs(jane_pension_2027 - 67200) < 500:
                    print(f"      ✅ Pension indexing working correctly!")
                else:
                    print(f"      ⚠️ Pension amount may be incorrect")

            # Check that both people's incomes are tracked separately
            print(f"\n📈 Summary:")
            total_years = len(year_by_year)
            years_with_p1_pension = sum(1 for y in year_by_year if y.get('employer_pension_p1', 0) > 0)
            years_with_p2_pension = sum(1 for y in year_by_year if y.get('employer_pension_p2', 0) > 0)

            print(f"  - Person 1 has pension in {years_with_p1_pension}/{total_years} years")
            print(f"  - Person 2 has pension in {years_with_p2_pension}/{total_years} years")

            if years_with_p1_pension > 0 and years_with_p2_pension > 0:
                print(f"\n✅ SUCCESS: Both partners' income sources are properly tracked!")
            else:
                print(f"\n⚠️ WARNING: One or both partners may not have pension income tracked")

        else:
            print(f"❌ Simulation failed: {result.get('message', 'Unknown error')}")
    else:
        print(f"❌ HTTP Error {response.status_code}")
        print(response.text[:500])

except Exception as e:
    print(f"❌ Error: {str(e)}")

print("\n" + "=" * 60)
print("Test complete!")