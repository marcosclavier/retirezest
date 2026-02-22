#!/usr/bin/env python3
"""
Complete validation test for RRIF-Frontload strategy after fixing CRA minimum rates
"""

import requests
import json

def test_multiple_ages():
    """Test RRIF-Frontload at different ages to ensure proper behavior"""

    print("=" * 80)
    print("COMPREHENSIVE RRIF-FRONTLOAD VALIDATION TEST")
    print("=" * 80)
    print("\nTesting with CORRECTED CRA minimum rates:\n")

    # Test different ages
    test_cases = [
        {"age": 64, "expected_pct": 15.0, "cra_min": 0.0, "description": "Before OAS (age < 65)"},
        {"age": 65, "expected_pct": 8.0, "cra_min": 3.71, "description": "OAS starts (age 65)"},
        {"age": 71, "expected_pct": 8.0, "cra_min": 5.28, "description": "Age 71 (mandatory RRIF conversion)"},
        {"age": 75, "expected_pct": 8.0, "cra_min": 5.82, "description": "Age 75"},
        {"age": 80, "expected_pct": 8.0, "cra_min": 6.82, "description": "Age 80 (Rafael's case)"},
        {"age": 81, "expected_pct": 8.0, "cra_min": 7.08, "description": "Age 81 (Rafael's case)"},
        {"age": 85, "expected_pct": 8.51, "cra_min": 8.51, "description": "Age 85 (minimum > 8%)"},
        {"age": 90, "expected_pct": 11.92, "cra_min": 11.92, "description": "Age 90 (minimum > 8%)"},
    ]

    all_passed = True

    for test in test_cases:
        age = test["age"]
        expected = test["expected_pct"]
        cra_min = test["cra_min"]
        desc = test["description"]

        print(f"\n{'=' * 60}")
        print(f"Testing {desc}")
        print(f"  Age: {age}")
        print(f"  CRA Minimum: {cra_min:.2f}%")
        print(f"  Expected withdrawal: {expected:.2f}%")
        print("-" * 60)

        # Create payload
        payload = {
            "p1": {
                "name": "Test",
                "start_age": age,
                "rrif_balance": 100000,  # $100k for easy percentage calculation
                "tfsa_balance": 50000,
                "nr_cash": 0,
                "nr_gic": 0,
                "nr_invest": 0,
                "corp_cash_bucket": 0,
                "corp_gic_bucket": 0,
                "corp_invest_bucket": 0,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 10000,
                "oas_start_age": 65,
                "oas_annual_at_start": 8000,
                "pension_incomes": [],
                "other_incomes": []
            },
            "p2": {
                "name": "",
                "start_age": age,
                "rrif_balance": 0,
                "tfsa_balance": 0,
                "nr_cash": 0,
                "nr_gic": 0,
                "nr_invest": 0,
                "corp_cash_bucket": 0,
                "corp_gic_bucket": 0,
                "corp_invest_bucket": 0,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 0,
                "oas_start_age": 65,
                "oas_annual_at_start": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "include_partner": False,
            "province": "AB",
            "start_year": 2026,
            "end_age": age + 1,  # Just one year
            "strategy": "rrif-frontload",
            "spending_go_go": 60000,
            "spending_slow_go": 50000,
            "slow_go_end_age": 90,
            "spending_no_go": 40000,
            "go_go_end_age": 85,
            "spending_inflation": 2,
            "general_inflation": 2,
            "tfsa_contribution_each": 0
        }

        try:
            response = requests.post(
                "http://localhost:8000/api/run-simulation",
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()

                # Find year 1
                year_data = None
                for year in data.get('five_year_plan', []):
                    if year['age_p1'] == age:
                        year_data = year
                        break

                if year_data:
                    rrif_withdrawal = year_data.get('rrif_withdrawal_p1', 0)
                    rrif_balance = 100000  # Our test starting balance
                    actual_pct = (rrif_withdrawal / rrif_balance) * 100 if rrif_balance > 0 else 0

                    # Check if it matches expected
                    passed = abs(actual_pct - expected) < 0.1

                    print(f"  RRIF Withdrawal: ${rrif_withdrawal:,.2f}")
                    print(f"  Actual %: {actual_pct:.2f}%")
                    print(f"  Expected %: {expected:.2f}%")

                    if passed:
                        print(f"  ✅ PASSED: Withdrawal matches expected")
                    else:
                        print(f"  ❌ FAILED: Expected {expected:.2f}%, got {actual_pct:.2f}%")
                        all_passed = False

                    # Check if it respects CRA minimum
                    if actual_pct < cra_min - 0.1:
                        print(f"  ⚠️ WARNING: Below CRA minimum of {cra_min:.2f}%!")
                        all_passed = False

                else:
                    print(f"  ❌ ERROR: Could not find data for age {age}")
                    all_passed = False
            else:
                print(f"  ❌ ERROR: API returned status {response.status_code}")
                all_passed = False

        except Exception as e:
            print(f"  ❌ ERROR: {str(e)}")
            all_passed = False

    print("\n" + "=" * 80)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("✅ RRIF-Frontload strategy is working correctly:")
        print("   - 15% before OAS (age < 65)")
        print("   - 8% after OAS (age >= 65)")
        print("   - Respects CRA minimums when they exceed the target %")
    else:
        print("⚠️ SOME TESTS FAILED")
        print("Please review the failures above.")
    print("=" * 80)

if __name__ == "__main__":
    test_multiple_ages()