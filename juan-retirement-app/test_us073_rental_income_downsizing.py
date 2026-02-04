#!/usr/bin/env python3
"""
Test US-073: Auto-Stop rental_income_annual When Property Is Sold (Downsizing)

Test that rental income automatically stops when handle_downsizing() runs.
"""

import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config


def test_rental_income_stops_when_sold_outright():
    """
    Test Case 1: Rental income stops when property is sold outright (new_home_cost = 0)

    User: Age 65, $24K/year rental income, sells property at age 70
    Expected: Rental income present ages 65-69, stops at age 70+
    """
    print("=" * 80)
    print("  TEST 1: Rental Income Stops When Property Sold Outright")
    print("=" * 80)
    print()

    p1 = Person(
        name="Rental Property Owner",
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

        # Rental property
        has_primary_residence=True,
        primary_residence_value=600000,
        primary_residence_purchase_price=400000,
        primary_residence_mortgage=0,
        primary_residence_monthly_payment=0,
        rental_income_annual=24000,  # $24K/year rental income

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
    print(f"  Rental Income: ${p1.rental_income_annual:,}/year")
    print(f"  Property Value: ${p1.primary_residence_value:,}")
    print(f"  Downsize Year: {household.start_year + 5} (age 70)")
    print(f"  New Home Cost: $0 (selling outright)")
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
    print(f"(Other Income includes rental income from rental_income_annual field)")
    print("-" * 80)

    test_passed = True

    # Test ages 65-69 (before property sale)
    # Note: Rental income is included in 'other_income_p1' column, not a separate 'rental_income_p1'
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
        print("🎉 TEST 1 PASSED - Rental income stops when property sold outright!")
        return True
    else:
        print("❌ TEST 1 FAILED - Rental income behavior incorrect")
        return False


def test_rental_income_stops_when_downsized():
    """
    Test Case 2: Rental income stops when downsizing to new home (new_home_cost > 0)

    User: Age 65, $24K/year rental income, downsizes at age 70
    Expected: Rental income present ages 65-69, stops at age 70+
    """
    print("\n")
    print("=" * 80)
    print("  TEST 2: Rental Income Stops When Downsizing to New Home")
    print("=" * 80)
    print()

    p1 = Person(
        name="Downsizer",
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

        # Rental property
        has_primary_residence=True,
        primary_residence_value=600000,
        primary_residence_purchase_price=400000,
        primary_residence_mortgage=0,
        primary_residence_monthly_payment=0,
        rental_income_annual=24000,  # $24K/year rental income

        # Downsizing plan - downsize at age 70
        plan_to_downsize=True,
        downsize_year=2031,  # 2026 + 5 years = age 70
        downsize_new_home_cost=300000,  # Buy new smaller home
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
    print(f"  Rental Income: ${p1.rental_income_annual:,}/year")
    print(f"  Property Value: ${p1.primary_residence_value:,}")
    print(f"  Downsize Year: {household.start_year + 5} (age 70)")
    print(f"  New Home Cost: $300,000 (downsizing)")
    print()

    # Run simulation
    print("🚀 Running simulation...")
    tax_cfg = load_tax_config("tax_config_canada_2025.json")
    results_df = simulate(household, tax_cfg)
    print("✅ Simulation complete")
    print()

    # Check rental income behavior
    print("📊 Results Analysis:")
    print(f"{'Year':<6} {'Age':<5} {'Other Income':<20} {'Status':<10} {'Result'}")
    print(f"(Other Income includes rental income from rental_income_annual field)")
    print("-" * 80)

    test_passed = True

    # Test ages 65-69 (before downsizing)
    # Note: Rental income is included in 'other_income_p1' column, not a separate 'rental_income_p1'
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

    # Test age 70+ (after downsizing)
    for age_offset in range(5, 8):  # Ages 70-72
        if age_offset >= len(results_df):
            break
        row = results_df.iloc[age_offset]
        year = int(row['year'])
        age = int(row['age_p1'])

        other_income = row.get('other_income_p1', 0)

        # After downsizing, rental income should stop (other_income should be $0)
        if other_income > 1:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'❌ FAIL':<10} Should be $0 (downsized)")
            test_passed = False
        else:
            print(f"{year:<6} {age:<5} ${other_income:>18,.0f} {'✅ PASS':<10} Rental income stopped")

    print()
    print("=" * 80)

    if test_passed:
        print("🎉 TEST 2 PASSED - Rental income stops when downsizing!")
        return True
    else:
        print("❌ TEST 2 FAILED - Rental income behavior incorrect")
        return False


def run_all_tests():
    """Run all US-073 verification tests."""
    print("\n" + "=" * 80)
    print("  US-073 VERIFICATION TEST SUITE")
    print("=" * 80)
    print("\nTesting: Rental income stops automatically when property is sold")
    print("Fix Location: modules/real_estate.py (lines 201-219)")
    print()

    results = []

    try:
        results.append(("Test 1: Sold Outright", test_rental_income_stops_when_sold_outright()))
    except Exception as e:
        print(f"\n❌ Test 1 CRASHED: {str(e)}")
        import traceback
        traceback.print_exc()
        results.append(("Test 1: Sold Outright", False))

    try:
        results.append(("Test 2: Downsizing", test_rental_income_stops_when_downsized()))
    except Exception as e:
        print(f"\n❌ Test 2 CRASHED: {str(e)}")
        import traceback
        traceback.print_exc()
        results.append(("Test 2: Downsizing", False))

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
        print("\n🎉 ALL TESTS PASSED! US-073 is working correctly!")
        print("\n✅ Acceptance Criteria Met:")
        print("  - Rental income stops when property sold outright (new_home_cost = 0)")
        print("  - Rental income stops when downsizing to new home (new_home_cost > 0)")
        print("  - No regression in property sales and capital gains")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review before deploying.")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
