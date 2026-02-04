#!/usr/bin/env python3
"""
Complete Verification Test Suite for US-072
Runs all 5 test cases from the verification plan.
"""

import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def print_header(title):
    """Print formatted header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_result(test_name, passed, details=""):
    """Print test result."""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {test_name}")
    if details:
        print(f"  {details}")

def test_1_daniel_gonzalez():
    """Test Case 1: Daniel Gonzalez (age 64, retire 66, $200K employment)"""
    print_header("Test 1: Daniel Gonzalez Profile")

    p1 = Person(
        name="Daniel Gonzalez",
        start_age=64,
        tfsa_balance=100000,
        rrsp_balance=500000,
        nonreg_balance=50000,
        cpp_start_age=66,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8000,
        other_incomes=[{
            'type': 'employment',
            'amount': 200000,
            'startAge': None,
            'endAge': None,
            'inflationIndexed': False,
        }]
    )

    household = Household(
        p1=p1,
        p2=Person(name="No Partner", start_age=65),
        province='AB',
        start_year=2026,
        end_age=85,
        strategy='minimize-income',
        spending_go_go=58000,
        spending_slow_go=58000,
        spending_no_go=58000,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    print(f"Profile: Age 64, Retire at 66, $200K employment")

    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df = simulate(household, tax_cfg)

    # Check ages 64, 65, 66
    passed = True
    for year_offset in range(3):
        row = results_df.iloc[year_offset]
        age = int(row['age_p1'])
        tax = row['total_tax_after_split']

        if age == 64 or age == 65:
            if tax < 50000:
                print(f"  Age {age}: Tax = ${tax:,.0f} ❌ (expected > $50,000)")
                passed = False
            else:
                print(f"  Age {age}: Tax = ${tax:,.0f} ✅")
        elif age == 66:
            if tax > 20000:
                print(f"  Age {age}: Tax = ${tax:,.0f} ❌ (expected < $20,000)")
                passed = False
            else:
                print(f"  Age {age}: Tax = ${tax:,.0f} ✅")

    return passed

def test_2_early_retirement():
    """Test Case 2: Early retirement (age 50, retire 55, $100K employment)"""
    print_header("Test 2: Early Retirement (Age 55)")

    p1 = Person(
        name="Early Retiree",
        start_age=50,
        tfsa_balance=100000,
        rrsp_balance=500000,
        nonreg_balance=50000,
        cpp_start_age=55,  # Retirement age
        cpp_annual_at_start=10000,
        oas_start_age=65,
        oas_annual_at_start=8000,
        other_incomes=[{
            'type': 'employment',
            'amount': 100000,
            'startAge': None,
            'endAge': None,
            'inflationIndexed': False,
        }]
    )

    household = Household(
        p1=p1,
        p2=Person(name="No Partner", start_age=65),
        province='AB',
        start_year=2026,
        end_age=85,
        strategy='minimize-income',
        spending_go_go=40000,
        spending_slow_go=40000,
        spending_no_go=40000,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    print(f"Profile: Age 50, Retire at 55, $100K employment")

    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df = simulate(household, tax_cfg)

    # Check ages 50 and 55
    passed = True

    age_50_row = results_df[results_df['age_p1'] == 50].iloc[0]
    tax_50 = age_50_row['total_tax_after_split']
    if tax_50 < 20000:
        print(f"  Age 50: Tax = ${tax_50:,.0f} ❌ (expected > $20,000)")
        passed = False
    else:
        print(f"  Age 50: Tax = ${tax_50:,.0f} ✅")

    age_55_row = results_df[results_df['age_p1'] == 55].iloc[0]
    tax_55 = age_55_row['total_tax_after_split']
    if tax_55 > 20000:
        print(f"  Age 55: Tax = ${tax_55:,.0f} ❌ (expected < $20,000)")
        passed = False
    else:
        print(f"  Age 55: Tax = ${tax_55:,.0f} ✅")

    return passed

def test_3_late_retirement():
    """Test Case 3: Late retirement (age 65, retire 70, $80K employment)"""
    print_header("Test 3: Late Retirement (Age 70)")

    p1 = Person(
        name="Late Retiree",
        start_age=65,
        tfsa_balance=100000,
        rrsp_balance=500000,
        nonreg_balance=50000,
        cpp_start_age=70,  # Retirement age
        cpp_annual_at_start=18000,
        oas_start_age=70,
        oas_annual_at_start=10000,
        other_incomes=[{
            'type': 'employment',
            'amount': 80000,
            'startAge': None,
            'endAge': None,
            'inflationIndexed': False,
        }]
    )

    household = Household(
        p1=p1,
        p2=Person(name="No Partner", start_age=65),
        province='AB',
        start_year=2026,
        end_age=85,
        strategy='minimize-income',
        spending_go_go=40000,
        spending_slow_go=40000,
        spending_no_go=40000,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    print(f"Profile: Age 65, Retire at 70, $80K employment")

    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df = simulate(household, tax_cfg)

    # Check ages 65 and 70
    passed = True

    age_65_row = results_df[results_df['age_p1'] == 65].iloc[0]
    tax_65 = age_65_row['total_tax_after_split']
    if tax_65 < 15000:
        print(f"  Age 65: Tax = ${tax_65:,.0f} ❌ (expected > $15,000)")
        passed = False
    else:
        print(f"  Age 65: Tax = ${tax_65:,.0f} ✅")

    age_70_row = results_df[results_df['age_p1'] == 70].iloc[0]
    tax_70 = age_70_row['total_tax_after_split']
    if tax_70 > 15000:
        print(f"  Age 70: Tax = ${tax_70:,.0f} ❌ (expected < $15,000)")
        passed = False
    else:
        print(f"  Age 70: Tax = ${tax_70:,.0f} ✅")

    return passed

def test_4_regression_no_employment():
    """Test Case 4: Regression test - retiree with no employment income"""
    print_header("Test 4: Regression Test (No Employment)")

    p1 = Person(
        name="Retiree No Employment",
        start_age=65,
        tfsa_balance=100000,
        rrif_balance=500000,
        nonreg_balance=50000,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8000,
    )

    household = Household(
        p1=p1,
        p2=Person(name="No Partner", start_age=65),
        province='AB',
        start_year=2026,
        end_age=85,
        strategy='minimize-income',
        spending_go_go=50000,
        spending_slow_go=50000,
        spending_no_go=50000,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    print(f"Profile: Age 65, No employment income")

    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df = simulate(household, tax_cfg)

    # Check that CPP and OAS are present
    passed = True

    age_65_row = results_df[results_df['age_p1'] == 65].iloc[0]
    cpp = age_65_row['cpp_p1']
    oas = age_65_row['oas_p1']
    other_income = age_65_row['other_income_p1']

    if cpp < 14000:
        print(f"  CPP: ${cpp:,.0f} ❌ (expected ~$15,000)")
        passed = False
    else:
        print(f"  CPP: ${cpp:,.0f} ✅")

    if oas < 7000:
        print(f"  OAS: ${oas:,.0f} ❌ (expected ~$8,000)")
        passed = False
    else:
        print(f"  OAS: ${oas:,.0f} ✅")

    if other_income > 1:
        print(f"  Other Income: ${other_income:,.0f} ❌ (expected $0)")
        passed = False
    else:
        print(f"  Other Income: ${other_income:,.0f} ✅")

    return passed

def test_5_multiple_incomes():
    """Test Case 5: Multiple income sources (employment + rental)"""
    print_header("Test 5: Multiple Income Sources")

    p1 = Person(
        name="Multiple Incomes",
        start_age=64,
        tfsa_balance=100000,
        rrsp_balance=500000,
        nonreg_balance=50000,
        cpp_start_age=66,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8000,
        other_incomes=[
            {
                'type': 'employment',
                'amount': 100000,
                'startAge': None,
                'endAge': None,
                'inflationIndexed': False,
            },
            {
                'type': 'rental',
                'amount': 24000,
                'startAge': None,
                'endAge': None,  # Rental continues forever
                'inflationIndexed': False,
            }
        ]
    )

    household = Household(
        p1=p1,
        p2=Person(name="No Partner", start_age=65),
        province='AB',
        start_year=2026,
        end_age=85,
        strategy='minimize-income',
        spending_go_go=50000,
        spending_slow_go=50000,
        spending_no_go=50000,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    print(f"Profile: Age 64, Retire at 66, $100K employment + $24K rental")

    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df = simulate(household, tax_cfg)

    # Check ages 64 and 66
    passed = True

    age_64_row = results_df[results_df['age_p1'] == 64].iloc[0]
    tax_64 = age_64_row['total_tax_after_split']
    other_income_64 = age_64_row['other_income_p1']

    if other_income_64 < 120000:
        print(f"  Age 64: Other Income = ${other_income_64:,.0f} ❌ (expected $124,000)")
        passed = False
    else:
        print(f"  Age 64: Other Income = ${other_income_64:,.0f} ✅")

    if tax_64 < 30000:
        print(f"  Age 64: Tax = ${tax_64:,.0f} ❌ (expected > $30,000)")
        passed = False
    else:
        print(f"  Age 64: Tax = ${tax_64:,.0f} ✅")

    age_66_row = results_df[results_df['age_p1'] == 66].iloc[0]
    other_income_66 = age_66_row['other_income_p1']

    if other_income_66 < 23000 or other_income_66 > 25000:
        print(f"  Age 66: Other Income = ${other_income_66:,.0f} ❌ (expected ~$24,000 rental only)")
        passed = False
    else:
        print(f"  Age 66: Other Income = ${other_income_66:,.0f} ✅ (rental only, employment stopped)")

    return passed

def run_all_tests():
    """Run all verification tests."""
    print("\n" + "=" * 80)
    print("  US-072 COMPLETE VERIFICATION TEST SUITE")
    print("=" * 80)
    print("\nTesting: Employment income stops at retirement age")
    print("Fix Location: modules/simulation.py (lines 1144-1163, 2383-2384)")

    results = []

    try:
        results.append(("Test 1: Daniel Gonzalez", test_1_daniel_gonzalez()))
    except Exception as e:
        print(f"\n❌ Test 1 CRASHED: {str(e)}")
        results.append(("Test 1: Daniel Gonzalez", False))

    try:
        results.append(("Test 2: Early Retirement", test_2_early_retirement()))
    except Exception as e:
        print(f"\n❌ Test 2 CRASHED: {str(e)}")
        results.append(("Test 2: Early Retirement", False))

    try:
        results.append(("Test 3: Late Retirement", test_3_late_retirement()))
    except Exception as e:
        print(f"\n❌ Test 3 CRASHED: {str(e)}")
        results.append(("Test 3: Late Retirement", False))

    try:
        results.append(("Test 4: Regression Test", test_4_regression_no_employment()))
    except Exception as e:
        print(f"\n❌ Test 4 CRASHED: {str(e)}")
        results.append(("Test 4: Regression Test", False))

    try:
        results.append(("Test 5: Multiple Incomes", test_5_multiple_incomes()))
    except Exception as e:
        print(f"\n❌ Test 5 CRASHED: {str(e)}")
        results.append(("Test 5: Multiple Incomes", False))

    # Print summary
    print("\n" + "=" * 80)
    print("  TEST SUMMARY")
    print("=" * 80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print("\n" + "-" * 80)
    print(f"Tests Passed: {passed}/{total}")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Ready for production deployment!")
        print("\n✅ Deployment Criteria Met:")
        print("  - All 5 test cases passed")
        print("  - Employment income counted correctly")
        print("  - Employment stops at retirement")
        print("  - No regressions in CPP/OAS/pension")
        print("  - Multiple income sources work correctly")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review before deploying.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
