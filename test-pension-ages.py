#!/usr/bin/env python3
"""
Test to verify CPP/OAS age handling
"""

import requests
import json

# API endpoint
API_URL = "http://localhost:8000/api/run-simulation"

def test_pension_ages():
    """Test CPP/OAS at different ages"""

    tests = [
        {
            "name": "CPP/OAS at 65",
            "cpp_age": 65,
            "oas_age": 65,
            "expected_cpp_year1": True,
            "expected_oas_year1": True
        },
        {
            "name": "CPP/OAS at 70",
            "cpp_age": 70,
            "oas_age": 70,
            "expected_cpp_year1": False,  # Should be 0 in year 1 (age 65)
            "expected_oas_year1": False   # Should be 0 in year 1 (age 65)
        }
    ]

    for test in tests:
        print(f"\n{'='*60}")
        print(f"TEST: {test['name']}")
        print(f"{'='*60}")

        payload = {
            "strategy": "rrif-frontload",
            "province": "ON",
            "start_year": 2026,
            "include_partner": False,
            "p1": {
                "name": "TestPerson",
                "start_age": 65,
                "cpp_start_age": test['cpp_age'],
                "cpp_annual_at_start": 15000.0,
                "oas_start_age": test['oas_age'],
                "oas_annual_at_start": 8000.0,
                "tfsa_balance": 100000.0,
                "rrif_balance": 200000.0,
                "rrsp_balance": 0.0,
                "nonreg_balance": 200000.0,
                "corporate_balance": 1000000.0,
                "nonreg_acb": 100000.0,
                "nr_cash": 20000.0,
                "nr_gic": 30000.0,
                "nr_invest": 150000.0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "p2": {
                "name": "",
                "start_age": 65,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 0.0,
                "oas_start_age": 65,
                "oas_annual_at_start": 0.0,
                "tfsa_balance": 0.0,
                "rrif_balance": 0.0,
                "rrsp_balance": 0.0,
                "nonreg_balance": 0.0,
                "corporate_balance": 0.0,
                "nonreg_acb": 0.0,
                "nr_cash": 0.0,
                "nr_gic": 0.0,
                "nr_invest": 0.0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "spending_go_go": 100000.0,
            "go_go_end_age": 75,
            "spending_slow_go": 90000.0,
            "slow_go_end_age": 80,
            "spending_no_go": 80000.0,
            "spending_inflation": 2.0,
            "general_inflation": 2.0
        }

        try:
            response = requests.post(API_URL, json=payload, timeout=30)

            if response.status_code == 200:
                result = response.json()
                years = result.get("year_by_year", [])

                if years and len(years) > 0:
                    # Check first year (age 65)
                    year1 = years[0]
                    cpp_y1 = year1.get("cpp_p1", 0)
                    oas_y1 = year1.get("oas_p1", 0)

                    print(f"\nYear 1 (age 65):")
                    print(f"  CPP: ${cpp_y1:,.0f} (expected: ${15000 if test['expected_cpp_year1'] else 0:,.0f})")
                    print(f"  OAS: ${oas_y1:,.0f} (expected: ${8000 if test['expected_oas_year1'] else 0:,.0f})")

                    # Check year 6 (age 70) if CPP/OAS start at 70
                    if test['cpp_age'] == 70 and len(years) >= 6:
                        year6 = years[5]  # Index 5 = year 6
                        cpp_y6 = year6.get("cpp_p1", 0)
                        oas_y6 = year6.get("oas_p1", 0)

                        print(f"\nYear 6 (age 70):")
                        print(f"  CPP: ${cpp_y6:,.0f} (expected: ~${15000*1.42:,.0f} with 42% increase)")
                        print(f"  OAS: ${oas_y6:,.0f} (expected: ~${8000*1.36:,.0f} with 36% increase)")

                    # Check if ages are working correctly
                    cpp_correct = (cpp_y1 > 0) == test['expected_cpp_year1']
                    oas_correct = (oas_y1 > 0) == test['expected_oas_year1']

                    if cpp_correct and oas_correct:
                        print("\n✅ Pension ages are working correctly")
                    else:
                        print("\n❌ ISSUE: Pension ages not working as expected")
                        if not cpp_correct:
                            print(f"   CPP: Got ${cpp_y1:,.0f} but expected ${15000 if test['expected_cpp_year1'] else 0:,.0f}")
                        if not oas_correct:
                            print(f"   OAS: Got ${oas_y1:,.0f} but expected ${8000 if test['expected_oas_year1'] else 0:,.0f}")

                    return cpp_correct and oas_correct
            else:
                print(f"❌ API Error: {response.status_code}")
                return False

        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return False

    return True

def main():
    """Run the test"""
    print("\n" + "="*80)
    print("PENSION AGE VALIDATION TEST")
    print("="*80)

    success = test_pension_ages()

    print("\n" + "="*80)
    if success:
        print("✅ All pension age tests passed")
    else:
        print("❌ Some pension age tests failed")
        print("\nThis confirms the issue: CPP/OAS ages are not being respected")
        print("When set to start at age 70, they're still starting at 65")

    return 0 if success else 1

if __name__ == "__main__":
    exit(main())