#!/usr/bin/env python3
"""
Comprehensive test suite for couple income handling
Tests multiple scenarios to ensure robustness
"""

import requests
import json
import sys

def run_test(test_name, test_payload, validations):
    """Run a single test and validate results"""
    print(f"\n{'='*60}")
    print(f"Test: {test_name}")
    print(f"{'='*60}")

    # Test against local API first
    url = "http://localhost:8000/api/run-simulation"

    try:
        response = requests.post(url, json=test_payload, timeout=30)

        if response.status_code == 200:
            result = response.json()

            if result.get('success'):
                print("✅ Simulation successful!")

                # Run validations
                year_by_year = result.get('year_by_year', [])
                all_passed = True

                for validation in validations:
                    year_data = next((y for y in year_by_year if y['year'] == validation['year']), None)
                    if year_data:
                        field = validation['field']
                        expected = validation['expected']
                        tolerance = validation.get('tolerance', 100)

                        actual = year_data.get(field, 0)

                        if abs(actual - expected) <= tolerance:
                            print(f"  ✅ Year {validation['year']}, {field}: ${actual:,.0f} (expected ${expected:,.0f})")
                        else:
                            print(f"  ❌ Year {validation['year']}, {field}: ${actual:,.0f} (expected ${expected:,.0f}, diff=${abs(actual-expected):,.0f})")
                            all_passed = False
                    else:
                        print(f"  ❌ Year {validation['year']} not found in results")
                        all_passed = False

                return all_passed
            else:
                print(f"❌ Simulation failed: {result.get('message', 'Unknown error')}")
                if 'error' in result:
                    print(f"   Error details: {result['error']}")
                return False
        else:
            print(f"❌ HTTP Error {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


# Test 1: Single person with mixed pensions
test1_payload = {
    "p1": {
        "name": "Alice",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 15000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 100000,
        "rrif_balance": 500000,
        "rrsp_balance": 0,
        "nonreg_balance": 200000,
        "corporate_balance": 0,
        "nonreg_acb": 160000,
        "tfsa_room_start": 95000,
        "tfsa_contribution_annual": 7000,
        "pension_incomes": [
            {
                "name": "DB Pension Indexed",
                "amount": 60000,
                "startAge": 65,
                "inflationIndexed": True
            },
            {
                "name": "Small Fixed Pension",
                "amount": 15000,
                "startAge": 65,
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
    "province": "ON",
    "start_year": 2025,
    "end_age": 90,
    "strategy": "balanced",
    "spending_go_go": 100000,
    "go_go_end_age": 75,
    "spending_slow_go": 85000,
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

test1_validations = [
    {"year": 2025, "field": "employer_pension_p1", "expected": 75000},  # 60K + 15K
    {"year": 2026, "field": "employer_pension_p1", "expected": 76200},  # 60K*1.02 + 15K
    {"year": 2030, "field": "employer_pension_p1", "expected": 81224},  # 60K*1.02^5 + 15K
]

# Test 2: Couple with different pension start ages
test2_payload = {
    "p1": {
        "name": "Bob",
        "start_age": 60,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 12000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8000,
        "tfsa_balance": 50000,
        "rrif_balance": 300000,
        "rrsp_balance": 100000,
        "nonreg_balance": 0,
        "corporate_balance": 0,
        "nonreg_acb": 0,
        "tfsa_room_start": 90000,
        "tfsa_contribution_annual": 7000,
        "pension_incomes": [
            {
                "name": "Bob Early Pension",
                "amount": 40000,
                "startAge": 60,
                "inflationIndexed": True
            }
        ],
        "other_incomes": [
            {
                "type": "employment",
                "name": "Part-time consulting",
                "amount": 30000,
                "startAge": 60,
                "endAge": 65,
                "inflationIndexed": True
            }
        ]
    },
    "p2": {
        "name": "Carol",
        "start_age": 58,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 10000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8000,
        "pension_incomes": [
            {
                "name": "Carol Late Pension",
                "amount": 50000,
                "startAge": 65,
                "inflationIndexed": True
            }
        ],
        "other_incomes": [],
        "tfsa_balance": 75000,
        "rrif_balance": 250000,
        "rrsp_balance": 50000,
        "nonreg_balance": 100000,
        "corporate_balance": 0,
        "nonreg_acb": 80000,
        "tfsa_room_start": 90000,
        "tfsa_contribution_annual": 7000
    },
    "include_partner": True,
    "province": "BC",
    "start_year": 2025,
    "end_age": 90,
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
    "income_split_rrif_fraction": 0.5,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False
}

test2_validations = [
    {"year": 2025, "field": "employer_pension_p1", "expected": 40000},  # Bob starts at 60
    {"year": 2025, "field": "employer_pension_p2", "expected": 0},      # Carol starts at 65
    {"year": 2032, "field": "employer_pension_p1", "expected": 45947},  # Bob's after 7 years inflation
    {"year": 2032, "field": "employer_pension_p2", "expected": 50000},  # Carol's first year
]

# Test 3: Complex scenario with multiple income types
test3_payload = {
    "p1": {
        "name": "David",
        "start_age": 65,
        "cpp_start_age": 70,  # Deferred CPP
        "cpp_annual_at_start": 18000,
        "oas_start_age": 67,  # Deferred OAS
        "oas_annual_at_start": 9000,
        "tfsa_balance": 150000,
        "rrif_balance": 600000,
        "rrsp_balance": 0,
        "nonreg_balance": 300000,
        "corporate_balance": 100000,
        "nonreg_acb": 240000,
        "tfsa_room_start": 100000,
        "tfsa_contribution_annual": 7000,
        "pension_incomes": [
            {
                "name": "Main Pension",
                "amount": 70000,
                "startAge": 65,
                "inflationIndexed": True
            },
            {
                "name": "Bridge Benefit",
                "amount": 12000,
                "startAge": 65,
                "inflationIndexed": False
            }
        ],
        "other_incomes": [
            {
                "type": "rental",
                "name": "Rental Property",
                "amount": 24000,
                "startAge": 65,
                "inflationIndexed": True
            }
        ]
    },
    "p2": {
        "name": "Emma",
        "start_age": 62,
        "cpp_start_age": 62,  # Early CPP
        "cpp_annual_at_start": 7000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8000,
        "pension_incomes": [
            {
                "name": "Emma Pension 1",
                "amount": 35000,
                "startAge": 62,
                "inflationIndexed": True
            },
            {
                "name": "Emma Pension 2",
                "amount": 20000,
                "startAge": 65,
                "inflationIndexed": False
            }
        ],
        "other_incomes": [
            {
                "type": "investment",
                "name": "Dividend Income",
                "amount": 15000,
                "inflationIndexed": False
            }
        ],
        "tfsa_balance": 100000,
        "rrif_balance": 400000,
        "rrsp_balance": 0,
        "nonreg_balance": 200000,
        "corporate_balance": 50000,
        "nonreg_acb": 160000,
        "tfsa_room_start": 95000,
        "tfsa_contribution_annual": 7000
    },
    "include_partner": True,
    "province": "ON",
    "start_year": 2025,
    "end_age": 90,
    "strategy": "minimize-income",
    "spending_go_go": 150000,
    "go_go_end_age": 75,
    "spending_slow_go": 120000,
    "slow_go_end_age": 85,
    "spending_no_go": 100000,
    "spending_inflation": 2,
    "general_inflation": 2,
    "tfsa_room_annual_growth": 7000,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0.5,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False
}

test3_validations = [
    {"year": 2025, "field": "employer_pension_p1", "expected": 82000},  # 70K + 12K
    {"year": 2025, "field": "employer_pension_p2", "expected": 35000},  # Only first pension
    {"year": 2028, "field": "employer_pension_p2", "expected": 57153},  # 35K*1.02^3 + 20K
    {"year": 2025, "field": "cpp_p1", "expected": 0},                   # Deferred to 70
    {"year": 2025, "field": "cpp_p2", "expected": 7000},                # Started early at 62
]

# Run all tests
print("=" * 60)
print("COMPREHENSIVE COUPLE INCOME TEST SUITE")
print("=" * 60)

results = []

# Test 1
passed1 = run_test(
    "Single Person with Mixed Pensions",
    test1_payload,
    test1_validations
)
results.append(("Single person mixed pensions", passed1))

# Test 2
passed2 = run_test(
    "Couple with Different Pension Start Ages",
    test2_payload,
    test2_validations
)
results.append(("Couple different start ages", passed2))

# Test 3
passed3 = run_test(
    "Complex Couple with Multiple Income Types",
    test3_payload,
    test3_validations
)
results.append(("Complex couple scenario", passed3))

# Summary
print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)

passed_count = sum(1 for _, passed in results if passed)
total_count = len(results)

for test_name, passed in results:
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {status}: {test_name}")

print(f"\nOverall: {passed_count}/{total_count} tests passed")

if passed_count == total_count:
    print("\n🎉 ALL TESTS PASSED! System is working correctly.")
    sys.exit(0)
else:
    print(f"\n⚠️ {total_count - passed_count} test(s) failed. Please review the results above.")
    sys.exit(1)