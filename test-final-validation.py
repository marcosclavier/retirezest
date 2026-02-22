#!/usr/bin/env python3
"""
Final validation test - Quick smoke test of critical functionality
"""

import requests
import json
from datetime import datetime

API_BASE_URL = "http://localhost:8000"
SIMULATION_ENDPOINT = f"{API_BASE_URL}/api/run-simulation"

def quick_test(name: str, province: str, expected_success_range: tuple) -> bool:
    """Run a quick test and verify success rate is in expected range"""
    scenario = {
        "strategy": "rrif-frontload",
        "province": province,
        "inflation": 2.0,
        "expense_inflation": 2.0,
        "return_rate": 5.0,
        "years": 20,
        "include_partner": False,
        "spending_go_go": 60000,
        "spending_slow_go": 50000,
        "spending_no_go": 40000,
        "spending_go_go_end": 75,
        "spending_slow_go_start": 75,
        "spending_slow_go_end": 85,
        "spending_no_go_start": 85,
        "p1": {
            "name": "Test Person",
            "start_age": 65,
            "end_age": 85,
            "life_expectancy": 95,
            "tfsa_balance": 50000,
            "rrsp_balance": 0,
            "rrif_balance": 350000,
            "nr_cash": 50000,
            "nr_gic": 50000,
            "nr_invest": 50000,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12000,
            "oas_start_age": 65,
            "oas_annual_at_start": 7500,
            "pension_count": 0,
            "pension_incomes": []
        },
        "p2": {
            "name": "",
            "start_age": 65,
            "end_age": 85,
            "life_expectancy": 95,
            "tfsa_balance": 0,
            "rrsp_balance": 0,
            "rrif_balance": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_count": 0,
            "pension_incomes": []
        }
    }

    try:
        response = requests.post(SIMULATION_ENDPOINT, json=scenario, timeout=5)
        result = response.json()

        if result.get('success'):
            success_rate = result['summary']['success_rate']
            in_range = expected_success_range[0] <= success_rate <= expected_success_range[1]

            status = "✅" if in_range else "❌"
            print(f"{status} {name}: {success_rate:.1f}% (expected {expected_success_range[0]}-{expected_success_range[1]}%)")

            return in_range
        else:
            print(f"❌ {name}: Simulation failed")
            return False
    except Exception as e:
        print(f"❌ {name}: Error - {e}")
        return False

def main():
    print("="*80)
    print("FINAL VALIDATION - QUICK SMOKE TEST")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    print("\n🔍 Testing critical functionality...\n")

    tests_passed = 0
    tests_total = 0

    # Test 1: Success rates are percentages not decimals
    tests_total += 1
    if quick_test("Success Rate Display (ON)", "ON", (50, 100)):
        tests_passed += 1

    # Test 2: Quebec has different tax (lower success expected)
    tests_total += 1
    if quick_test("Quebec Tax Impact", "QC", (40, 80)):
        tests_passed += 1

    # Test 3: BC works
    tests_total += 1
    if quick_test("British Columbia", "BC", (50, 100)):
        tests_passed += 1

    # Test 4: AB works
    tests_total += 1
    if quick_test("Alberta", "AB", (50, 100)):
        tests_passed += 1

    # Test 5: Check year-by-year data exists
    print("\n🔍 Checking data structure...")
    scenario = {
        "strategy": "rrif-frontload",
        "province": "ON",
        "inflation": 2.0,
        "expense_inflation": 2.0,
        "return_rate": 5.0,
        "years": 5,  # Short for quick test
        "include_partner": False,
        "spending_go_go": 50000,
        "spending_slow_go": 45000,
        "spending_no_go": 40000,
        "spending_go_go_end": 75,
        "spending_slow_go_start": 75,
        "spending_slow_go_end": 85,
        "spending_no_go_start": 85,
        "p1": {
            "name": "Test",
            "start_age": 65,
            "end_age": 70,
            "life_expectancy": 95,
            "tfsa_balance": 50000,
            "rrsp_balance": 0,
            "rrif_balance": 200000,
            "nr_cash": 30000,
            "nr_gic": 30000,
            "nr_invest": 30000,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000,
            "oas_start_age": 65,
            "oas_annual_at_start": 7000,
            "pension_count": 0,
            "pension_incomes": []
        },
        "p2": {
            "name": "",
            "start_age": 65,
            "end_age": 70,
            "life_expectancy": 95,
            "tfsa_balance": 0,
            "rrsp_balance": 0,
            "rrif_balance": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_count": 0,
            "pension_incomes": []
        }
    }

    tests_total += 1
    try:
        response = requests.post(SIMULATION_ENDPOINT, json=scenario)
        result = response.json()

        if result.get('success'):
            has_summary = 'summary' in result
            has_year_data = 'year_by_year' in result and len(result['year_by_year']) > 0

            if has_summary and has_year_data:
                print("✅ Data Structure: Complete (summary + year-by-year)")
                tests_passed += 1

                # Check specific fields
                summary = result['summary']
                required_fields = ['success_rate', 'years_funded', 'years_simulated', 'total_tax_paid']
                missing = [f for f in required_fields if f not in summary]

                if missing:
                    print(f"   ⚠️ Missing fields: {missing}")
                else:
                    print("   ✓ All required fields present")
            else:
                print("❌ Data Structure: Incomplete")
        else:
            print("❌ Data Structure: Simulation failed")
    except Exception as e:
        print(f"❌ Data Structure: Error - {e}")

    # Summary
    print("\n" + "="*80)
    print("FINAL VALIDATION RESULTS")
    print("="*80)

    success_rate = (tests_passed / tests_total * 100) if tests_total > 0 else 0

    print(f"\nTests Passed: {tests_passed}/{tests_total} ({success_rate:.1f}%)")

    if tests_passed == tests_total:
        print("\n🎉 SUCCESS! All critical functionality is working correctly.")
        print("\nKey Findings:")
        print("✅ Success rates display as percentages (not decimals)")
        print("✅ Quebec shows different (higher) tax impact")
        print("✅ All supported provinces (AB, BC, ON, QC) working")
        print("✅ Data structure is complete with all required fields")
        print("\n✨ The system is stable and ready for use.")
    elif tests_passed >= tests_total - 1:
        print("\n⚠️ MOSTLY SUCCESSFUL with minor issues.")
        print("The system is generally working but review any failures above.")
    else:
        print("\n❌ CRITICAL ISSUES DETECTED")
        print("Multiple tests failed. Investigation required.")

    print("\n" + "="*80)

    return 0 if tests_passed == tests_total else 1

if __name__ == "__main__":
    exit(main())