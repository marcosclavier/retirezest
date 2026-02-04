#!/usr/bin/env python3
"""
Test US-074: Automatic endAge for Rental Income in other_incomes Array

Test that rental income from other_incomes array automatically stops when property is sold.
"""

import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config


def test_rental_income_linked_to_downsizing():
    """
    Test Case 1: Rental income in other_incomes array automatically stops when downsizing

    User: Age 65, $24K/year rental income (via other_incomes), downsizes at age 70
    Expected: Rental income present ages 65-69, stops at age 70+
    """
    print("=" * 80)
    print("  TEST 1: Rental Income (other_incomes) Linked to Downsizing")
    print("=" * 80)
    print()

    p1 = Person(
        name="Rental Income Owner",
        start_age=65,

        # Assets
        tfsa_balance=100000,
        rrif_balance=500000,
        nonreg_balance=50000,

        # Government benefits
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8000,

        # Rental income via other_incomes array (NO endAge specified)
        other_incomes=[
            {
                'type': 'rental',
                'name': 'Rental Property Income',
                'amount': 24000,  # $24K/year
                'startAge': 65,
                'endAge': None,  # ← US-074: Should auto-calculate based on downsizing
                'inflationIndexed': True,
            }
        ],

        # Property (for downsizing plan)
        has_primary_residence=True,
        primary_residence_value=600000,
        primary_residence_purchase_price=400000,
        primary_residence_mortgage=0,
        primary_residence_monthly_payment=0,

        # Downsizing plan - sell at age 70
        plan_to_downsize=True,
        downsize_year=2031,  # 2026 + 5 years = age 70
        downsize_new_home_cost=0,  # Selling outright
        downsize_is_principal_residence=False,  # Investment property
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

    print(f"Profile:")
    print(f"  Name: {p1.name}")
    print(f"  Start Age: {p1.start_age} (2026)")
    print(f"  Rental Income: $24,000/year (via other_incomes array)")
    print(f"  Property Value: ${p1.primary_residence_value:,}")
    print(f"  Downsize Year: {household.start_year + 5} (age 70)")
    print(f"  New Home Cost: $0 (selling outright)")
    print(f"  US-074: endAge should auto-calculate to age 70")
    print()

    # Run simulation
    print("🚀 Running simulation...")
    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df = simulate(household, tax_cfg)
    print("✅ Simulation complete")
    print()

    # Check ages 65-69 (rental income should be present)
    # Check ages 70+ (rental income should be $0)
    print("📊 Results Analysis:")
    print(f"{'Year':<6} {'Age':<5} {'Other Income':<20} {'Status':<10} {'Result'}")
    print(f"(Other Income includes rental income from other_incomes array)")
    print("-" * 80)

    test_passed = True

    # Test ages 65-69 (before property sale)
    for age_offset in range(5):  # Ages 65-69
        row = results_df.iloc[age_offset]
        year = int(row['year'])
        age = int(row['age_p1'])

        # Rental income is included in other_income_p1
        other_income = row.get('other_income_p1', 0)

        # Expected: ~$24K rental income (no other income sources in this test)
        if other_income < 20000:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'❌ FAIL':<10} Expected ~$24,000 (rental)")
            test_passed = False
        else:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'✅ PASS':<10} Rental income present")

    # Test age 70+ (after property sale)
    for age_offset in range(5, 8):  # Ages 70-72
        if age_offset >= len(results_df):
            break
        row = results_df.iloc[age_offset]
        year = int(row['year'])
        age = int(row['age_p1'])

        other_income = row.get('other_income_p1', 0)

        # After sale, rental income should stop (other_income should be $0)
        if other_income > 1:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'❌ FAIL':<10} Should be $0 (property sold)")
            test_passed = False
        else:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'✅ PASS':<10} Rental income stopped")

    print()
    print("=" * 80)

    if test_passed:
        print("🎉 TEST 1 PASSED - Rental income auto-stops when downsizing!")
        return True
    else:
        print("❌ TEST 1 FAILED - Rental income behavior incorrect")
        return False


def test_rental_income_not_linked():
    """
    Test Case 2: Rental income continues forever when NOT linked to downsizing

    User: Age 65, $24K/year rental income, NO downsizing plan
    Expected: Rental income present all years (continues indefinitely)
    """
    print("\n")
    print("=" * 80)
    print("  TEST 2: Rental Income NOT Linked to Downsizing (Continues Forever)")
    print("=" * 80)
    print()

    p1 = Person(
        name="Long-Term Landlord",
        start_age=65,

        # Assets
        tfsa_balance=100000,
        rrif_balance=500000,
        nonreg_balance=50000,

        # Government benefits
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8000,

        # Rental income via other_incomes array (NO endAge, NO downsizing plan)
        other_incomes=[
            {
                'type': 'rental',
                'name': 'Rental Property Income',
                'amount': 24000,  # $24K/year
                'startAge': 65,
                'endAge': None,  # ← No endAge, no downsizing → continues forever
                'inflationIndexed': True,
            }
        ],

        # Property but NO downsizing plan
        has_primary_residence=True,
        primary_residence_value=600000,
        primary_residence_purchase_price=400000,
        primary_residence_mortgage=0,
        primary_residence_monthly_payment=0,

        # NO downsizing plan
        plan_to_downsize=False,
        downsize_year=None,
        downsize_new_home_cost=0,
        downsize_is_principal_residence=False,
    )

    household = Household(
        p1=p1,
        p2=Person(name="No Partner", start_age=65),
        province='AB',
        start_year=2026,
        end_age=75,  # Shorter simulation for test
        strategy='minimize-income',
        spending_go_go=50000,
        spending_slow_go=50000,
        spending_no_go=50000,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    print(f"Profile:")
    print(f"  Name: {p1.name}")
    print(f"  Start Age: {p1.start_age} (2026)")
    print(f"  Rental Income: $24,000/year (via other_incomes array)")
    print(f"  Property Value: ${p1.primary_residence_value:,}")
    print(f"  Downsize Plan: None (keeping property)")
    print(f"  US-074: Rental income should continue all years")
    print()

    # Run simulation
    print("🚀 Running simulation...")
    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df = simulate(household, tax_cfg)
    print("✅ Simulation complete")
    print()

    # Check all years - rental income should be present
    print("📊 Results Analysis:")
    print(f"{'Year':<6} {'Age':<5} {'Other Income':<20} {'Status':<10} {'Result'}")
    print(f"(Rental income should continue all years)")
    print("-" * 80)

    test_passed = True

    # Test all years (ages 65-74)
    for age_offset in range(min(10, len(results_df))):
        row = results_df.iloc[age_offset]
        year = int(row['year'])
        age = int(row['age_p1'])

        other_income = row.get('other_income_p1', 0)

        # Expected: ~$24K+ rental income (with inflation)
        if other_income < 20000:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'❌ FAIL':<10} Expected ~$24,000+ (rental)")
            test_passed = False
        else:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'✅ PASS':<10} Rental income present")

    print()
    print("=" * 80)

    if test_passed:
        print("🎉 TEST 2 PASSED - Rental income continues indefinitely!")
        return True
    else:
        print("❌ TEST 2 FAILED - Rental income behavior incorrect")
        return False


def test_rental_income_with_manual_endAge():
    """
    Test Case 3: Rental income respects manually-set endAge

    User: Age 65, $24K/year rental income, manual endAge=72
    Expected: Rental income present ages 65-71, stops at age 72+
    """
    print("\n")
    print("=" * 80)
    print("  TEST 3: Rental Income with Manual endAge")
    print("=" * 80)
    print()

    p1 = Person(
        name="Manual endAge User",
        start_age=65,

        # Assets
        tfsa_balance=100000,
        rrif_balance=500000,
        nonreg_balance=50000,

        # Government benefits
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8000,

        # Rental income with MANUAL endAge (should NOT be overridden)
        other_incomes=[
            {
                'type': 'rental',
                'name': 'Rental Property Income',
                'amount': 24000,
                'startAge': 65,
                'endAge': 72,  # ← Manual endAge, should be respected
                'inflationIndexed': True,
            }
        ],

        # Property with downsizing plan (but endAge already set, so should NOT override)
        has_primary_residence=True,
        primary_residence_value=600000,
        plan_to_downsize=True,
        downsize_year=2031,  # Age 70 (but endAge=72 should win)
    )

    household = Household(
        p1=p1,
        p2=Person(name="No Partner", start_age=65),
        province='AB',
        start_year=2026,
        end_age=75,
        strategy='minimize-income',
        spending_go_go=50000,
        spending_slow_go=50000,
        spending_no_go=50000,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    print(f"Profile:")
    print(f"  Manual endAge: 72")
    print(f"  Downsize Year: 2031 (age 70)")
    print(f"  US-074: Manual endAge should NOT be overridden")
    print()

    # Run simulation
    print("🚀 Running simulation...")
    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df = simulate(household, tax_cfg)
    print("✅ Simulation complete")
    print()

    print("📊 Results Analysis:")
    print(f"{'Year':<6} {'Age':<5} {'Other Income':<20} {'Status':<10} {'Result'}")
    print("-" * 80)

    test_passed = True

    # Check ages 65-71 (should have rental income)
    for age_offset in range(7):  # Ages 65-71
        if age_offset >= len(results_df):
            break
        row = results_df.iloc[age_offset]
        year = int(row['year'])
        age = int(row['age_p1'])

        other_income = row.get('other_income_p1', 0)

        if other_income < 20000:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'❌ FAIL':<10} Expected ~$24,000")
            test_passed = False
        else:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'✅ PASS':<10} Rental income present")

    # Check age 72+ (should stop)
    for age_offset in range(7, 10):  # Ages 72-74
        if age_offset >= len(results_df):
            break
        row = results_df.iloc[age_offset]
        year = int(row['year'])
        age = int(row['age_p1'])

        other_income = row.get('other_income_p1', 0)

        if other_income > 1:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'❌ FAIL':<10} Should be $0 (endAge=72)")
            test_passed = False
        else:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'✅ PASS':<10} Rental income stopped")

    print()
    print("=" * 80)

    if test_passed:
        print("🎉 TEST 3 PASSED - Manual endAge respected!")
        return True
    else:
        print("❌ TEST 3 FAILED - Manual endAge not respected")
        return False


def run_all_tests():
    """Run all US-074 verification tests."""
    print("\n" + "=" * 80)
    print("  US-074 VERIFICATION TEST SUITE")
    print("=" * 80)
    print("\nTesting: Automatic endAge for rental income in other_incomes array")
    print("Fix Location: modules/simulation.py (lines 1376-1382)")
    print()

    results = []

    try:
        results.append(("Test 1: Linked to Downsizing", test_rental_income_linked_to_downsizing()))
    except Exception as e:
        print(f"\n❌ Test 1 CRASHED: {str(e)}")
        import traceback
        traceback.print_exc()
        results.append(("Test 1: Linked to Downsizing", False))

    try:
        results.append(("Test 2: NOT Linked (Continues Forever)", test_rental_income_not_linked()))
    except Exception as e:
        print(f"\n❌ Test 2 CRASHED: {str(e)}")
        import traceback
        traceback.print_exc()
        results.append(("Test 2: NOT Linked", False))

    try:
        results.append(("Test 3: Manual endAge", test_rental_income_with_manual_endAge()))
    except Exception as e:
        print(f"\n❌ Test 3 CRASHED: {str(e)}")
        import traceback
        traceback.print_exc()
        results.append(("Test 3: Manual endAge", False))

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
        print("\n🎉 ALL TESTS PASSED! US-074 is working correctly!")
        print("\n✅ Acceptance Criteria Met:")
        print("  - Rental income auto-stops when linked to downsizing")
        print("  - Rental income continues forever when NOT linked")
        print("  - Manual endAge is respected (not overridden)")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review before deploying.")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
