#!/usr/bin/env python3
"""
Automated Test for Pension Start Age Feature (US-039)

Tests that pensions with startAge properly activate at the correct age
and apply inflation indexing from their start year.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config


def test_pension_starts_at_65():
    """Test that pension with startAge=65 is $0 before age 65 and active after"""
    print("=" * 80)
    print("TEST 1: Pension Starting at Age 65")
    print("=" * 80)

    person = Person(
        name="Test Person",
        start_age=60,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[
            {
                'name': 'Company Pension',
                'amount': 30000,
                'startAge': 65,
                'inflationIndexed': True
            }
        ],
        other_incomes=[],
        tfsa_balance=100000,
        rrsp_balance=300000,
        rrif_balance=0,
        nonreg_balance=200000,
        corporate_balance=0,
        nonreg_acb=160000,
    )

    # Empty person 2 (required by simulation)
    person2 = Person(
        name="None",
        start_age=60,
        tfsa_balance=0,
        rrsp_balance=0,
        nonreg_balance=0
    )

    household = Household(
        p1=person,
        p2=person2,
        province='ON',
        start_year=2025,
        end_age=70,
        strategy='balanced',
        spending_go_go=50000,
        spending_slow_go=40000,
        spending_no_go=35000,
        go_go_end_age=75,
        slow_go_end_age=85,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Run simulation
    print(f"\nRunning simulation: Age {person.start_age} to {household.end_age}")
    print(f"Pension: $30,000/year starting at age 65")
    print(f"General inflation: {household.general_inflation * 100}%\n")

    results = simulate(household, tax_cfg)

    print(f"Simulation completed: {len(results)} years\n")

    # Verify pension behavior
    tests_passed = 0
    tests_failed = 0
    failures = []

    print("Year-by-Year Verification:")
    print("-" * 80)
    print(f"{'Year':<6} {'Age':<5} {'Pension':<15} {'Expected':<15} {'Status':<20}")
    print("-" * 80)

    for idx, row in results.iterrows():
        year = int(row['year'])
        age = int(row['age_p1'])

        # Try to get pension income from various possible column names
        pension = 0
        if 'pension_income_p1' in results.columns:
            pension = float(row['pension_income_p1'])

        # Calculate expected pension
        if age < 65:
            expected = 0
        else:
            years_since_start = age - 65
            expected = 30000 * ((1 + household.general_inflation) ** years_since_start)

        # Verify (allow small rounding tolerance)
        if expected == 0:
            if abs(pension) < 0.01:  # Essentially zero
                status = "✅ PASS"
                tests_passed += 1
            else:
                status = f"❌ FAIL (got ${pension:.0f})"
                tests_failed += 1
                failures.append(f"Age {age}: Expected $0, got ${pension:.0f}")
        else:
            tolerance = 0.01  # 1% tolerance
            if abs(pension - expected) / expected < tolerance:
                status = "✅ PASS"
                tests_passed += 1
            else:
                status = f"❌ FAIL"
                tests_failed += 1
                failures.append(f"Age {age}: Expected ${expected:.0f}, got ${pension:.0f}")

        print(f"{year:<6} {age:<5} ${pension:>12,.0f}  ${expected:>12,.0f}  {status}")

    print("-" * 80)
    print(f"\nResults: {tests_passed} passed, {tests_failed} failed")

    if tests_failed > 0:
        print("\n❌ FAILURES:")
        for failure in failures:
            print(f"  - {failure}")
        return False

    print("\n✅ TEST 1 PASSED: Pension starts correctly at age 65 with inflation indexing\n")
    return True


def test_employment_starts_at_60():
    """Test that employment income with startAge=60 is active from start"""
    print("=" * 80)
    print("TEST 2: Employment Income Starting at Age 60")
    print("=" * 80)

    person = Person(
        name="Test Person",
        start_age=60,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[],
        other_incomes=[
            {
                'type': 'employment',
                'name': 'Part-Time Work',
                'amount': 20000,
                'startAge': 60,
                'inflationIndexed': True
            }
        ],
        tfsa_balance=100000,
        rrsp_balance=300000,
        rrif_balance=0,
        nonreg_balance=200000,
        corporate_balance=0,
        nonreg_acb=160000,
    )

    person2 = Person(
        name="None",
        start_age=60,
        tfsa_balance=0,
        rrsp_balance=0,
        nonreg_balance=0
    )

    household = Household(
        p1=person,
        p2=person2,
        province='ON',
        start_year=2025,
        end_age=65,
        strategy='balanced',
        spending_go_go=50000,
        spending_slow_go=40000,
        spending_no_go=35000,
        go_go_end_age=75,
        slow_go_end_age=85,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    print(f"\nRunning simulation: Age {person.start_age} to {household.end_age}")
    print(f"Employment: $20,000/year starting at age 60")
    print(f"General inflation: {household.general_inflation * 100}%\n")

    results = simulate(household, tax_cfg)

    print(f"Simulation completed: {len(results)} years\n")

    tests_passed = 0
    tests_failed = 0
    failures = []

    print("Year-by-Year Verification:")
    print("-" * 80)
    print(f"{'Year':<6} {'Age':<5} {'Employment':<15} {'Expected':<15} {'Status':<20}")
    print("-" * 80)

    for idx, row in results.iterrows():
        year = int(row['year'])
        age = int(row['age_p1'])

        # Try to get other income
        other_income = 0
        if 'other_income_p1' in results.columns:
            other_income = float(row['other_income_p1'])

        # Calculate expected (active from age 60)
        years_since_start = age - 60
        expected = 20000 * ((1 + household.general_inflation) ** years_since_start)

        # Verify
        tolerance = 0.01
        if abs(other_income - expected) / expected < tolerance:
            status = "✅ PASS"
            tests_passed += 1
        else:
            status = f"❌ FAIL"
            tests_failed += 1
            failures.append(f"Age {age}: Expected ${expected:.0f}, got ${other_income:.0f}")

        print(f"{year:<6} {age:<5} ${other_income:>12,.0f}  ${expected:>12,.0f}  {status}")

    print("-" * 80)
    print(f"\nResults: {tests_passed} passed, {tests_failed} failed")

    if tests_failed > 0:
        print("\n❌ FAILURES:")
        for failure in failures:
            print(f"  - {failure}")
        return False

    print("\n✅ TEST 2 PASSED: Employment income active from age 60 with inflation indexing\n")
    return True


def test_multiple_incomes():
    """Test multiple income sources with different start ages"""
    print("=" * 80)
    print("TEST 3: Multiple Income Sources with Different Start Ages")
    print("=" * 80)

    person = Person(
        name="Test Person",
        start_age=60,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[
            {
                'name': 'Military Pension',
                'amount': 25000,
                'startAge': 60,
                'inflationIndexed': True
            },
            {
                'name': 'Corporate Pension',
                'amount': 30000,
                'startAge': 65,
                'inflationIndexed': True
            }
        ],
        other_incomes=[
            {
                'type': 'employment',
                'name': 'Part-Time Work',
                'amount': 15000,
                'startAge': 60,
                'inflationIndexed': True
            }
        ],
        tfsa_balance=100000,
        rrsp_balance=300000,
        rrif_balance=0,
        nonreg_balance=200000,
        corporate_balance=0,
        nonreg_acb=160000,
    )

    person2 = Person(
        name="None",
        start_age=60,
        tfsa_balance=0,
        rrsp_balance=0,
        nonreg_balance=0
    )

    household = Household(
        p1=person,
        p2=person2,
        province='ON',
        start_year=2025,
        end_age=68,
        strategy='balanced',
        spending_go_go=60000,
        spending_slow_go=48000,
        spending_no_go=40000,
        go_go_end_age=75,
        slow_go_end_age=85,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    print(f"\nRunning simulation: Age {person.start_age} to {household.end_age}")
    print(f"Income sources:")
    print(f"  - Military Pension: $25,000/year (age 60+)")
    print(f"  - Corporate Pension: $30,000/year (age 65+)")
    print(f"  - Part-Time Work: $15,000/year (age 60+)")
    print(f"General inflation: {household.general_inflation * 100}%\n")

    results = simulate(household, tax_cfg)

    print(f"Simulation completed: {len(results)} years\n")

    tests_passed = 0
    tests_failed = 0

    print("Year-by-Year Verification:")
    print("-" * 100)
    print(f"{'Year':<6} {'Age':<5} {'Total Income':<15} {'Expected':<15} {'Military':<12} {'Corporate':<12} {'Status':<15}")
    print("-" * 100)

    for idx, row in results.iterrows():
        year = int(row['year'])
        age = int(row['age_p1'])

        # Get incomes
        pension = 0
        other = 0
        if 'pension_income_p1' in results.columns:
            pension = float(row['pension_income_p1'])
        if 'other_income_p1' in results.columns:
            other = float(row['other_income_p1'])

        total_income = pension + other

        # Calculate expected
        years_from_60 = age - 60
        military = 25000 * ((1 + 0.02) ** years_from_60)
        employment = 15000 * ((1 + 0.02) ** years_from_60)

        if age >= 65:
            years_from_65 = age - 65
            corporate = 30000 * ((1 + 0.02) ** years_from_65)
        else:
            corporate = 0

        expected = military + corporate + employment

        # Verify
        tolerance = 0.02  # 2% tolerance
        if abs(total_income - expected) / expected < tolerance:
            status = "✅ PASS"
            tests_passed += 1
        else:
            status = f"❌ FAIL"
            tests_failed += 1

        print(f"{year:<6} {age:<5} ${total_income:>12,.0f}  ${expected:>12,.0f}  "
              f"${military:>9,.0f}  ${corporate:>9,.0f}  {status}")

    print("-" * 100)
    print(f"\nResults: {tests_passed} passed, {tests_failed} failed")

    if tests_failed > 0:
        print("\n❌ TEST 3 FAILED")
        return False

    print("\n✅ TEST 3 PASSED: Multiple incomes with different start ages work correctly\n")
    return True


def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("AUTOMATED PENSION START AGE TEST SUITE (US-039)")
    print("=" * 80 + "\n")

    results = []

    try:
        results.append(("Pension starts at age 65", test_pension_starts_at_65()))
        results.append(("Employment starts at age 60", test_employment_starts_at_60()))
        results.append(("Multiple incomes with different start ages", test_multiple_incomes()))
    except Exception as e:
        print(f"\n❌ TEST SUITE FAILED WITH EXCEPTION")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # Summary
    print("=" * 80)
    print("TEST SUITE SUMMARY")
    print("=" * 80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED!")
        print("=" * 80)
        print("\nPension start age feature is working correctly:")
        print("  ✓ Pensions activate at specified start ages")
        print("  ✓ Income is $0 before start age")
        print("  ✓ Inflation indexing applies from start year")
        print("  ✓ Multiple income sources with different start ages work correctly")
        print("  ✓ Other income sources (employment) work correctly")
        print("\n")
        return 0
    else:
        print("\n" + "=" * 80)
        print(f"❌ {total - passed} TEST(S) FAILED")
        print("=" * 80 + "\n")
        return 1


if __name__ == '__main__':
    exit(main())
