#!/usr/bin/env python3
"""
Comprehensive test for pension indexing functionality
"""

import requests
import json

def test_pension(name, pension_configs, expected_results):
    """Test a pension configuration and verify expected results"""

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
            "pension_incomes": pension_configs,
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

    print(f"\nTest: {name}")
    print("-" * 50)

    url = "https://astonishing-learning-production.up.railway.app/api/run-simulation"

    try:
        response = requests.post(url, json=test_payload, timeout=30)

        if response.status_code == 200:
            result = response.json()

            if result.get('success'):
                year_by_year = result.get('year_by_year', [])

                # Check specific years
                passed = True
                for year, expected in expected_results.items():
                    year_data = next((y for y in year_by_year if y['year'] == year), None)
                    if year_data:
                        # Note: pension shows as employer_pension_p1 in the response
                        actual = year_data.get('employer_pension_p1', 0)

                        # Allow small tolerance for floating point
                        if abs(actual - expected) < 1:
                            print(f"  ✅ Year {year}: ${actual:,.0f} (expected ${expected:,.0f})")
                        else:
                            print(f"  ❌ Year {year}: ${actual:,.0f} (expected ${expected:,.0f})")
                            passed = False
                    else:
                        print(f"  ❌ Year {year}: No data found")
                        passed = False

                return passed
            else:
                print(f"  ❌ Simulation failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"  ❌ HTTP Error {response.status_code}")
            return False

    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False


print("=" * 60)
print("COMPREHENSIVE PENSION INDEXING TESTS")
print("=" * 60)

# Test 1: Non-indexed pension should stay flat
test1_passed = test_pension(
    "Non-Indexed Pension (should stay at $50,000)",
    [{
        "name": "Fixed Pension",
        "amount": 50000,
        "startAge": 67,
        "inflationIndexed": False
    }],
    {
        2033: 50000,  # Year 1
        2034: 50000,  # Year 2 - should be same
        2035: 50000,  # Year 3 - should be same
        2040: 50000,  # Year 8 - should still be same
    }
)

# Test 2: Indexed pension should grow with inflation (2% per year)
test2_passed = test_pension(
    "Indexed Pension (should grow at 2% per year)",
    [{
        "name": "Indexed Pension",
        "amount": 50000,
        "startAge": 67,
        "inflationIndexed": True
    }],
    {
        2033: 50000,      # Year 1
        2034: 51000,      # Year 2: 50000 * 1.02
        2035: 52020,      # Year 3: 50000 * 1.02^2
        2040: 57434,      # Year 8: 50000 * 1.02^7
    }
)

# Test 3: Mix of indexed and non-indexed
test3_passed = test_pension(
    "Mixed: $30K indexed + $20K non-indexed",
    [
        {
            "name": "Indexed Pension",
            "amount": 30000,
            "startAge": 67,
            "inflationIndexed": True
        },
        {
            "name": "Fixed Pension",
            "amount": 20000,
            "startAge": 67,
            "inflationIndexed": False
        }
    ],
    {
        2033: 50000,      # 30000 + 20000
        2034: 50600,      # (30000 * 1.02) + 20000
        2035: 51212,      # (30000 * 1.02^2) + 20000
        2040: 54460,      # (30000 * 1.02^7) + 20000
    }
)

# Test 4: Default behavior (omitting inflationIndexed should default to True)
test4_passed = test_pension(
    "Default behavior (no inflationIndexed field = True)",
    [{
        "name": "Default Pension",
        "amount": 40000,
        "startAge": 67
        # inflationIndexed omitted - should default to True
    }],
    {
        2033: 40000,      # Year 1
        2034: 40800,      # Year 2: 40000 * 1.02
        2035: 41616,      # Year 3: 40000 * 1.02^2
    }
)

print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
all_tests = [
    ("Non-indexed pension", test1_passed),
    ("Indexed pension", test2_passed),
    ("Mixed pensions", test3_passed),
    ("Default behavior", test4_passed)
]

passed_count = sum(1 for _, passed in all_tests if passed)
total_count = len(all_tests)

for test_name, passed in all_tests:
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {status}: {test_name}")

print(f"\nOverall: {passed_count}/{total_count} tests passed")

if passed_count == total_count:
    print("\n🎉 ALL TESTS PASSED! Pension indexing is working correctly.")
else:
    print(f"\n⚠️ {total_count - passed_count} test(s) failed. Please review the results above.")