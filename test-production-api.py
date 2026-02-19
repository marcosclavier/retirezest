#!/usr/bin/env python3
"""
Test the production API to ensure deployed fixes are working
"""

import requests
import json
import sys

# Production API URL
PROD_URL = "https://astonishing-learning-production.up.railway.app/api/run-simulation"

def test_production(test_name, test_payload, expected_results):
    """Test against production API"""
    print(f"\n{'='*60}")
    print(f"Production Test: {test_name}")
    print(f"{'='*60}")

    try:
        response = requests.post(PROD_URL, json=test_payload, timeout=30)

        if response.status_code == 200:
            result = response.json()

            if result.get('success'):
                print("✅ Production simulation successful!")

                year_by_year = result.get('year_by_year', [])
                all_passed = True

                for expected in expected_results:
                    year_data = next((y for y in year_by_year if y['year'] == expected['year']), None)
                    if year_data:
                        for field, value in expected['fields'].items():
                            actual = year_data.get(field, 0)
                            tolerance = expected.get('tolerance', 100)

                            if abs(actual - value) <= tolerance:
                                print(f"  ✅ Year {expected['year']}, {field}: ${actual:,.0f}")
                            else:
                                print(f"  ❌ Year {expected['year']}, {field}: ${actual:,.0f} (expected ${value:,.0f})")
                                all_passed = False
                    else:
                        print(f"  ❌ Year {expected['year']} not found")
                        all_passed = False

                return all_passed
            else:
                print(f"❌ Production simulation failed: {result.get('message')}")
                return False
        else:
            print(f"❌ HTTP Error {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


# Test 1: Basic pension indexing
test1 = {
    "p1": {
        "name": "Test User",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 12000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8000,
        "tfsa_balance": 100000,
        "rrif_balance": 400000,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 0,
        "nonreg_acb": 0,
        "tfsa_room_start": 95000,
        "tfsa_contribution_annual": 7000,
        "pension_incomes": [
            {
                "name": "Fixed Pension",
                "amount": 30000,
                "startAge": 65,
                "inflationIndexed": False
            },
            {
                "name": "Indexed Pension",
                "amount": 40000,
                "startAge": 65,
                "inflationIndexed": True
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
    "province": "ON",
    "start_year": 2025,
    "end_age": 75,
    "strategy": "balanced",
    "spending_go_go": 90000,
    "go_go_end_age": 75,
    "spending_slow_go": 75000,
    "slow_go_end_age": 85,
    "spending_no_go": 60000,
    "spending_inflation": 2,
    "general_inflation": 2,
    "tfsa_room_annual_growth": 7000,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False
}

test1_expected = [
    {"year": 2025, "fields": {"employer_pension_p1": 70000}},
    {"year": 2026, "fields": {"employer_pension_p1": 70800}},  # 30K fixed + 40K*1.02
    {"year": 2030, "fields": {"employer_pension_p1": 74163}},  # 30K fixed + 40K*1.02^5
]

# Test 2: Couple with separate incomes
test2 = {
    "p1": {
        "name": "Partner 1",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 10000,
        "oas_start_age": 65,
        "oas_annual_at_start": 7500,
        "tfsa_balance": 50000,
        "rrif_balance": 250000,
        "rrsp_balance": 0,
        "nonreg_balance": 50000,
        "corporate_balance": 0,
        "nonreg_acb": 40000,
        "tfsa_room_start": 90000,
        "tfsa_contribution_annual": 7000,
        "pension_incomes": [
            {
                "name": "P1 Pension",
                "amount": 35000,
                "startAge": 65,
                "inflationIndexed": True
            }
        ],
        "other_incomes": []
    },
    "p2": {
        "name": "Partner 2",
        "start_age": 63,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 8000,
        "oas_start_age": 65,
        "oas_annual_at_start": 7500,
        "pension_incomes": [
            {
                "name": "P2 Pension",
                "amount": 45000,
                "startAge": 63,
                "inflationIndexed": True
            }
        ],
        "other_incomes": [],
        "tfsa_balance": 60000,
        "rrif_balance": 200000,
        "rrsp_balance": 0,
        "nonreg_balance": 75000,
        "corporate_balance": 0,
        "nonreg_acb": 60000,
        "tfsa_room_start": 90000,
        "tfsa_contribution_annual": 7000
    },
    "include_partner": True,
    "province": "BC",
    "start_year": 2025,
    "end_age": 80,
    "strategy": "rrif-frontload",
    "spending_go_go": 110000,
    "go_go_end_age": 75,
    "spending_slow_go": 90000,
    "slow_go_end_age": 85,
    "spending_no_go": 75000,
    "spending_inflation": 2,
    "general_inflation": 2,
    "tfsa_room_annual_growth": 7000,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0.5,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False
}

test2_expected = [
    {"year": 2025, "fields": {"employer_pension_p1": 35000, "employer_pension_p2": 45000}},
    {"year": 2027, "fields": {"employer_pension_p1": 36421, "employer_pension_p2": 46818}},
]

# Run tests
print("=" * 60)
print("PRODUCTION API TESTING")
print("=" * 60)

results = []

# Test 1
passed1 = test_production(
    "Pension Indexing (Fixed + Indexed)",
    test1,
    test1_expected
)
results.append(("Pension indexing", passed1))

# Test 2
passed2 = test_production(
    "Couple with Separate Pensions",
    test2,
    test2_expected
)
results.append(("Couple pensions", passed2))

# Summary
print("\n" + "=" * 60)
print("PRODUCTION TEST SUMMARY")
print("=" * 60)

passed_count = sum(1 for _, passed in results if passed)
total_count = len(results)

for test_name, passed in results:
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {status}: {test_name}")

print(f"\nOverall: {passed_count}/{total_count} production tests passed")

if passed_count == total_count:
    print("\n🎉 ALL PRODUCTION TESTS PASSED!")
    print("The fixes have been successfully deployed and are working in production.")
    sys.exit(0)
else:
    print(f"\n⚠️ {total_count - passed_count} production test(s) failed.")
    print("Please check the deployment status.")
    sys.exit(1)