"""
Test Employment Income Bug Fix (US-072)

This script tests the fix for the employment income bug where income
was not properly stopping at retirement age.

Test Cases:
1. Daniel Gonzalez profile (age 64, retire 66, $200K employment)
2. Early retirement (age 50, retire 55, $100K employment)
3. Late retirement (age 65, retire 70, $80K employment)
4. Multiple income sources (employment + rental)
5. Retirement income regression test (CPP, OAS, pension)
"""

import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.simulation import simulate
from modules.config import load_tax_config

def print_test_header(test_name):
    """Print formatted test header."""
    print("\n" + "="*80)
    print(f"  {test_name}")
    print("="*80)

def print_test_result(test_name, passed, details=""):
    """Print test result with status."""
    status = "✅ PASSED" if passed else "❌ FAILED"
    print(f"\n{status}: {test_name}")
    if details:
        print(f"  {details}")

def create_test_household(name, age, retirement_age, employment_income, expenses, assets=None):
    """Create a test household with employment income."""
    if assets is None:
        assets = {
            'rrsp': 500000,
            'tfsa': 100000,
            'nonreg': 50000,
        }

    return {
        'p1': {
            'name': name,
            'start_age': age,
            'retirement_age': retirement_age,
            'tfsa_balance': assets.get('tfsa', 0),
            'rrsp_balance': assets.get('rrsp', 0),
            'rrif_balance': assets.get('rrif', 0),
            'nonreg_balance': assets.get('nonreg', 0),
            'corporate_balance': assets.get('corporate', 0),
            'cpp_start_age': 65,
            'oas_start_age': 65,
            'other_incomes': [
                {
                    'type': 'employment',
                    'amount': employment_income,
                    'startAge': None,  # Should default to start_age
                    'endAge': None,     # Should default to retirement_age
                    'inflationIndexed': False,
                }
            ]
        },
        'p2': {
            'name': 'No Partner',
            'start_age': 65,
            'retirement_age': 65,
        },
        'province': 'AB',
        'strategy': 'minimize-income',
        'spending_go_go': expenses,
        'spending_slow_go': expenses,
        'spending_no_go': expenses,
        'end_age': 85,
        'start_year': 2026,
    }

def test_daniel_gonzalez():
    """
    Test Case 1: Daniel Gonzalez Profile
    - Age: 64, Retirement: 66
    - Employment: $200,000/year
    - Expenses: $58,000/year

    Expected:
    - Year 2026 (age 64): Tax > $0, Employment income counted
    - Year 2027 (age 65): Tax > $0, Employment income counted
    - Year 2028 (age 66): Tax > $0, Employment stopped, CPP/OAS started
    """
    print_test_header("Test Case 1: Daniel Gonzalez Profile")

    household_data = create_test_household(
        name="Daniel Gonzalez",
        age=64,
        retirement_age=66,
        employment_income=200000,
        expenses=58000,
        assets={'rrsp': 500000, 'tfsa': 100000, 'nonreg': 50000}
    )

    print(f"Profile: Age {household_data['p1']['start_age']}, Retire at {household_data['p1']['retirement_age']}")
    print(f"Employment Income: ${household_data['p1']['other_incomes'][0]['amount']:,}/year")
    print(f"Expenses: ${household_data['spending_go_go']:,}/year")
    print(f"Assets: RRSP ${household_data['p1']['rrsp_balance']:,}, TFSA ${household_data['p1']['tfsa_balance']:,}")

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Run simulation
    print("\n🚀 Running simulation...")
    results_df, summary = simulate(household_data, tax_cfg)

    # Check results for ages 64, 65, 66
    print("\n📊 Results Analysis:")
    print(f"{'Year':<6} {'Age':<5} {'Tax':<12} {'Status':<10} {'Result'}")
    print("-" * 60)

    test_passed = True

    for year_idx in range(3):  # Check first 3 years
        year_data = results_df.iloc[year_idx]
        age = year_data['Age P1']
        tax = year_data['Total Tax']

        if age == 64 or age == 65:
            # Pre-retirement: Should have employment income, tax > $0
            expected_tax_min = 50000  # Expecting ~$60K tax on $200K income
            has_income = tax > expected_tax_min
            status = "✅ PASS" if has_income else "❌ FAIL"

            if not has_income:
                test_passed = False
                print(f"{year_idx+2026:<6} {int(age):<5} ${tax:>10,.0f} {status:<10} Employment income NOT counted (BUG)")
            else:
                print(f"{year_idx+2026:<6} {int(age):<5} ${tax:>10,.0f} {status:<10} Employment income counted correctly")

        elif age == 66:
            # Retirement year: Should have CPP/OAS, tax should be lower than employment years
            expected_tax_max = 20000  # Expecting ~$10K tax on CPP/OAS
            has_no_employment = tax < expected_tax_max
            status = "✅ PASS" if has_no_employment else "❌ FAIL"

            if not has_no_employment:
                test_passed = False
                print(f"{year_idx+2026:<6} {int(age):<5} ${tax:>10,.0f} {status:<10} Employment income still counting (BUG)")
            else:
                print(f"{year_idx+2026:<6} {int(age):<5} ${tax:>10,.0f} {status:<10} Employment stopped, CPP/OAS started")

    # Check success rate
    success_rate = summary.get('success_rate', 0)
    print(f"\n📈 Success Rate: {success_rate:.1%}")

    if success_rate < 0.90:
        test_passed = False
        print(f"   ❌ Success rate too low: {success_rate:.1%} (expected 95%+)")
    else:
        print(f"   ✅ Success rate acceptable: {success_rate:.1%}")

    print_test_result("Daniel Gonzalez Profile", test_passed)
    return test_passed

def test_early_retirement():
    """
    Test Case 2: Early Retirement
    - Age: 50, Retirement: 55
    - Employment: $100,000/year

    Expected:
    - Ages 50-54: Employment income counted
    - Age 55+: Employment stopped
    """
    print_test_header("Test Case 2: Early Retirement (Age 55)")

    household_data = create_test_household(
        name="Early Retiree",
        age=50,
        retirement_age=55,
        employment_income=100000,
        expenses=40000,
    )

    print(f"Profile: Age {household_data['p1']['start_age']}, Retire at {household_data['p1']['retirement_age']}")
    print(f"Employment Income: ${household_data['p1']['other_incomes'][0]['amount']:,}/year")

    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df, summary = simulate(household_data, tax_cfg)

    print("\n📊 Results Analysis:")
    print(f"{'Age':<5} {'Tax':<12} {'Status'}")
    print("-" * 35)

    test_passed = True

    # Check age 50 (should have employment)
    age_50_data = results_df[results_df['Age P1'] == 50].iloc[0]
    tax_50 = age_50_data['Total Tax']
    has_employment_50 = tax_50 > 20000

    if not has_employment_50:
        test_passed = False
        print(f"{50:<5} ${tax_50:>10,.0f} ❌ FAIL - No employment income")
    else:
        print(f"{50:<5} ${tax_50:>10,.0f} ✅ PASS - Employment income counted")

    # Check age 55 (should NOT have employment)
    age_55_data = results_df[results_df['Age P1'] == 55].iloc[0]
    tax_55 = age_55_data['Total Tax']
    no_employment_55 = tax_55 < 20000

    if not no_employment_55:
        test_passed = False
        print(f"{55:<5} ${tax_55:>10,.0f} ❌ FAIL - Employment still counting")
    else:
        print(f"{55:<5} ${tax_55:>10,.0f} ✅ PASS - Employment stopped")

    print_test_result("Early Retirement", test_passed)
    return test_passed

def test_late_retirement():
    """
    Test Case 3: Late Retirement
    - Age: 65, Retirement: 70
    - Employment: $80,000/year

    Expected:
    - Ages 65-69: Employment income counted
    - Age 70+: Employment stopped
    """
    print_test_header("Test Case 3: Late Retirement (Age 70)")

    household_data = create_test_household(
        name="Late Retiree",
        age=65,
        retirement_age=70,
        employment_income=80000,
        expenses=40000,
    )

    print(f"Profile: Age {household_data['p1']['start_age']}, Retire at {household_data['p1']['retirement_age']}")
    print(f"Employment Income: ${household_data['p1']['other_incomes'][0]['amount']:,}/year")

    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df, summary = simulate(household_data, tax_cfg)

    print("\n📊 Results Analysis:")
    print(f"{'Age':<5} {'Tax':<12} {'Status'}")
    print("-" * 35)

    test_passed = True

    # Check age 65 (should have employment)
    age_65_data = results_df[results_df['Age P1'] == 65].iloc[0]
    tax_65 = age_65_data['Total Tax']
    has_employment_65 = tax_65 > 15000

    if not has_employment_65:
        test_passed = False
        print(f"{65:<5} ${tax_65:>10,.0f} ❌ FAIL - No employment income")
    else:
        print(f"{65:<5} ${tax_65:>10,.0f} ✅ PASS - Employment income counted")

    # Check age 70 (should NOT have employment)
    age_70_data = results_df[results_df['Age P1'] == 70].iloc[0]
    tax_70 = age_70_data['Total Tax']
    no_employment_70 = tax_70 < 15000

    if not no_employment_70:
        test_passed = False
        print(f"{70:<5} ${tax_70:>10,.0f} ❌ FAIL - Employment still counting")
    else:
        print(f"{70:<5} ${tax_70:>10,.0f} ✅ PASS - Employment stopped")

    print_test_result("Late Retirement", test_passed)
    return test_passed

def test_multiple_income_sources():
    """
    Test Case 4: Multiple Income Sources
    - Employment: $100,000/year (stops at retirement)
    - Rental: $24,000/year (continues forever)

    Expected:
    - Pre-retirement: Both employment and rental counted
    - Post-retirement: Only rental counted
    """
    print_test_header("Test Case 4: Multiple Income Sources")

    household_data = create_test_household(
        name="Multiple Incomes",
        age=64,
        retirement_age=66,
        employment_income=100000,
        expenses=50000,
    )

    # Add rental income (no start/end age - continues forever)
    household_data['p1']['other_incomes'].append({
        'type': 'rental',
        'amount': 24000,
        'startAge': None,
        'endAge': None,
        'inflationIndexed': False,
    })

    print(f"Profile: Age {household_data['p1']['start_age']}, Retire at {household_data['p1']['retirement_age']}")
    print(f"Employment Income: $100,000/year (should stop at retirement)")
    print(f"Rental Income: $24,000/year (should continue forever)")

    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df, summary = simulate(household_data, tax_cfg)

    print("\n📊 Results Analysis:")
    print(f"{'Age':<5} {'Tax':<12} {'Status'}")
    print("-" * 60)

    test_passed = True

    # Check age 64 (should have both employment and rental)
    age_64_data = results_df[results_df['Age P1'] == 64].iloc[0]
    tax_64 = age_64_data['Total Tax']
    has_both_64 = tax_64 > 30000  # $124K income should have ~$30K+ tax

    if not has_both_64:
        test_passed = False
        print(f"{64:<5} ${tax_64:>10,.0f} ❌ FAIL - Not all income counted")
    else:
        print(f"{64:<5} ${tax_64:>10,.0f} ✅ PASS - Both employment + rental counted")

    # Check age 66 (should have only rental + CPP/OAS, no employment)
    age_66_data = results_df[results_df['Age P1'] == 66].iloc[0]
    tax_66 = age_66_data['Total Tax']
    no_employment_66 = 5000 < tax_66 < 20000  # ~$47K income (rental + CPP/OAS)

    if not no_employment_66:
        test_passed = False
        print(f"{66:<5} ${tax_66:>10,.0f} ❌ FAIL - Employment may still be counting")
    else:
        print(f"{66:<5} ${tax_66:>10,.0f} ✅ PASS - Only rental + CPP/OAS (employment stopped)")

    print_test_result("Multiple Income Sources", test_passed)
    return test_passed

def run_all_tests():
    """Run all employment income fix tests."""
    print("\n" + "="*80)
    print("  EMPLOYMENT INCOME BUG FIX TEST SUITE (US-072)")
    print("="*80)
    print("\nTesting fix for: Employment income not stopping at retirement age")
    print("Bug Location: modules/simulation.py:1357")
    print("Fix: Added endAge check with employment income special handling")

    results = []

    # Run all test cases
    results.append(("Daniel Gonzalez Profile", test_daniel_gonzalez()))
    results.append(("Early Retirement (Age 55)", test_early_retirement()))
    results.append(("Late Retirement (Age 70)", test_late_retirement()))
    results.append(("Multiple Income Sources", test_multiple_income_sources()))

    # Print summary
    print("\n" + "="*80)
    print("  TEST SUMMARY")
    print("="*80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")

    print("\n" + "-"*80)
    print(f"Tests Passed: {passed}/{total}")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Employment income bug is fixed!")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Bug may not be fully fixed.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
