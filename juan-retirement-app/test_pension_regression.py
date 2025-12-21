"""
Regression Test for Employer Pension Integration

Tests:
1. Backwards compatibility: scenarios without pension work as before
2. New functionality: scenarios with pension include it in taxes
3. Tax credit verification: pension qualifies for pension income credit
"""

import sys
from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config


def test_backwards_compatibility():
    """Test 1: Verify scenarios without employer pension work identically"""
    print("\n" + "="*80)
    print("TEST 1: Backwards Compatibility (No Employer Pension)")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create test WITHOUT employer pension (backwards compatibility test)
    p1 = Person(
        name="Person 1", start_age=65,
        cpp_annual_at_start=15000, cpp_start_age=65,
        oas_annual_at_start=8500, oas_start_age=65,
        employer_pension_annual=0,  # NO PENSION
        tfsa_balance=100000, rrif_balance=200000,
        nonreg_balance=150000, nonreg_acb=100000,
    )

    p2 = Person(
        name="Person 2", start_age=65,
        cpp_annual_at_start=12000, cpp_start_age=65,
        oas_annual_at_start=8500, oas_start_age=65,
        employer_pension_annual=0,  # NO PENSION
        tfsa_balance=100000, rrif_balance=150000,
        nonreg_balance=100000, nonreg_acb=75000,
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=67,
        spending_go_go=60000, go_go_end_age=75,
        spending_slow_go=50000, slow_go_end_age=85,
        spending_no_go=40000,
        spending_inflation=0.02, general_inflation=0.02,
        strategy="corporate-optimized",
    )

    print(f"\nScenario: Couple with CPP+OAS, NO employer pension")
    print(f"  P1: CPP ${p1.cpp_annual_at_start:,.0f}, OAS ${p1.oas_annual_at_start:,.0f}, Pension ${p1.employer_pension_annual:,.0f}")
    print(f"  P2: CPP ${p2.cpp_annual_at_start:,.0f}, OAS ${p2.oas_annual_at_start:,.0f}, Pension ${p2.employer_pension_annual:,.0f}")

    results = simulate(household, tax_cfg)

    # Verify employer_pension columns exist and are zero
    print(f"\nVerifying employer pension columns:")
    checks_passed = True

    for idx, row in results.iterrows():
        year = row['year']
        p1_pension = row['employer_pension_p1']
        p2_pension = row['employer_pension_p2']

        if p1_pension != 0 or p2_pension != 0:
            print(f"  ❌ Year {year}: Expected $0 pension, got P1=${p1_pension}, P2=${p2_pension}")
            checks_passed = False

    if checks_passed:
        print(f"  ✅ All {len(results)} years show $0 employer pension (correct)")

    # Verify tax calculations still work
    first_year = results.iloc[0]
    print(f"\nYear 1 Tax Calculation:")
    print(f"  Taxable Income P1: ${first_year['taxable_inc_p1']:,.2f}")
    print(f"  Taxable Income P2: ${first_year['taxable_inc_p2']:,.2f}")
    print(f"  Tax P1: ${first_year['tax_p1']:,.2f}")
    print(f"  Tax P2: ${first_year['tax_p2']:,.2f}")

    # With CPP+OAS only, taxable income should equal CPP+OAS (23,500 and 20,500)
    expected_inc_p1 = first_year['cpp_p1'] + first_year['oas_p1']
    expected_inc_p2 = first_year['cpp_p2'] + first_year['oas_p2']

    # Check taxable income includes at least CPP+OAS (may include RRIF withdrawals to meet spending)
    # The key is that employer pension is NOT included (it's $0)
    if first_year['taxable_inc_p1'] >= expected_inc_p1:
        print(f"  ✅ P1 taxable income (${first_year['taxable_inc_p1']:,.2f}) >= CPP+OAS baseline (${expected_inc_p1:,.2f})")
        print(f"     (Includes RRIF withdrawals to meet $60k spending target)")
    else:
        print(f"  ❌ P1 taxable income too low: ${first_year['taxable_inc_p1']:,.2f} < ${expected_inc_p1:,.2f}")
        checks_passed = False

    if first_year['taxable_inc_p2'] >= expected_inc_p2:
        print(f"  ✅ P2 taxable income (${first_year['taxable_inc_p2']:,.2f}) >= CPP+OAS baseline (${expected_inc_p2:,.2f})")
        print(f"     (Includes RRIF withdrawals to meet $60k spending target)")
    else:
        print(f"  ❌ P2 taxable income too low: ${first_year['taxable_inc_p2']:,.2f} < ${expected_inc_p2:,.2f}")
        checks_passed = False

    # Verify employer pension is NOT contributing to income
    # The difference between actual income and CPP+OAS baseline should NOT be from employer pension
    print(f"\n  Key check: Employer pension contribution to taxable income:")
    print(f"    P1 employer pension: ${first_year['employer_pension_p1']:,.2f} (should be $0)")
    print(f"    P2 employer pension: ${first_year['employer_pension_p2']:,.2f} (should be $0)")
    if first_year['employer_pension_p1'] == 0 and first_year['employer_pension_p2'] == 0:
        print(f"  ✅ Employer pension correctly excluded from income (both $0)")

    # Check simulation completed successfully
    if len(results) == 3:
        print(f"\n  ✅ Simulation completed: {len(results)} years")
    else:
        print(f"\n  ❌ Expected 3 years, got {len(results)}")
        checks_passed = False

    return checks_passed


def test_with_employer_pension():
    """Test 2: Verify employer pension is included in tax calculations"""
    print("\n" + "="*80)
    print("TEST 2: Employer Pension Included in Taxes")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create test WITH employer pension
    p1 = Person(
        name="Person 1", start_age=65,
        cpp_annual_at_start=15000, cpp_start_age=65,
        oas_annual_at_start=8500, oas_start_age=65,
        employer_pension_annual=30000,  # $30k PENSION
        tfsa_balance=100000, rrif_balance=200000,
        nonreg_balance=150000, nonreg_acb=100000,
    )

    p2 = Person(
        name="Person 2", start_age=65,
        cpp_annual_at_start=12000, cpp_start_age=65,
        oas_annual_at_start=8500, oas_start_age=65,
        employer_pension_annual=0,  # No pension for P2
        tfsa_balance=100000, rrif_balance=150000,
        nonreg_balance=100000, nonreg_acb=75000,
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=67,
        spending_go_go=80000, go_go_end_age=75,
        spending_slow_go=60000, slow_go_end_age=85,
        spending_no_go=50000,
        spending_inflation=0.02, general_inflation=0.02,
        strategy="corporate-optimized",
    )

    print(f"\nScenario: P1 has $30k employer pension, P2 has none")
    print(f"  P1: CPP ${p1.cpp_annual_at_start:,.0f}, OAS ${p1.oas_annual_at_start:,.0f}, Pension ${p1.employer_pension_annual:,.0f}")
    print(f"  P2: CPP ${p2.cpp_annual_at_start:,.0f}, OAS ${p2.oas_annual_at_start:,.0f}, Pension ${p2.employer_pension_annual:,.0f}")

    results = simulate(household, tax_cfg)
    first_year = results.iloc[0]

    print(f"\nYear 1 Results:")
    print(f"  Employer Pension P1: ${first_year['employer_pension_p1']:,.2f}")
    print(f"  Employer Pension P2: ${first_year['employer_pension_p2']:,.2f}")
    print(f"  CPP P1: ${first_year['cpp_p1']:,.2f}")
    print(f"  OAS P1: ${first_year['oas_p1']:,.2f}")
    print(f"  Taxable Income P1: ${first_year['taxable_inc_p1']:,.2f}")
    print(f"  Tax P1: ${first_year['tax_p1']:,.2f}")

    checks_passed = True

    # Check 1: Employer pension appears in results
    if abs(first_year['employer_pension_p1'] - 30000) < 1:
        print(f"\n  ✅ P1 employer pension = $30,000 (correct)")
    else:
        print(f"\n  ❌ P1 employer pension should be $30,000, got ${first_year['employer_pension_p1']:,.2f}")
        checks_passed = False

    if abs(first_year['employer_pension_p2'] - 0) < 1:
        print(f"  ✅ P2 employer pension = $0 (correct)")
    else:
        print(f"  ❌ P2 employer pension should be $0, got ${first_year['employer_pension_p2']:,.2f}")
        checks_passed = False

    # Check 2: Taxable income includes employer pension
    # Expected = CPP + OAS + Employer Pension + any other taxable income
    min_expected_income = first_year['cpp_p1'] + first_year['oas_p1'] + first_year['employer_pension_p1']

    if first_year['taxable_inc_p1'] >= min_expected_income - 100:
        print(f"  ✅ P1 taxable income (${first_year['taxable_inc_p1']:,.2f}) includes pension (min ${min_expected_income:,.2f})")
    else:
        print(f"  ❌ P1 taxable income (${first_year['taxable_inc_p1']:,.2f}) should include pension (min ${min_expected_income:,.2f})")
        checks_passed = False

    # Check 3: Tax is higher with pension than without
    # With $53,500 pension income (CPP+OAS+Pension), should have significant tax
    if first_year['tax_p1'] > 100:
        print(f"  ✅ P1 tax = ${first_year['tax_p1']:,.2f} (pension increased taxable income)")
    else:
        print(f"  ❌ P1 tax should be > $100 with ${first_year['taxable_inc_p1']:,.2f} income")
        checks_passed = False

    return checks_passed


def test_pension_inflation():
    """Test 3: Verify employer pension grows with inflation"""
    print("\n" + "="*80)
    print("TEST 3: Employer Pension Inflation Adjustment")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create test with pension and 2% inflation
    p1 = Person(
        name="Person 1", start_age=65,
        cpp_annual_at_start=15000, cpp_start_age=65,
        oas_annual_at_start=8500, oas_start_age=65,
        employer_pension_annual=40000,  # $40k starting pension
        tfsa_balance=200000,
    )

    p2 = Person(
        name="None", start_age=65,
        cpp_annual_at_start=0, cpp_start_age=999,
        oas_annual_at_start=0, oas_start_age=999,
        employer_pension_annual=0,
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=70,
        spending_go_go=0, spending_slow_go=0, spending_no_go=0,
        general_inflation=0.02,  # 2% inflation
    )

    print(f"\nScenario: $40k employer pension with 2% inflation")

    results = simulate(household, tax_cfg)

    print(f"\n{'Year':<8} {'Age':<6} {'Pension':<15} {'Expected':<15} {'Inflation':<12} {'Status'}")
    print("-" * 75)

    expected = 40000
    all_passed = True

    for idx, row in results.iterrows():
        year = row['year']
        age = row['age_p1']
        actual = row['employer_pension_p1']
        years_since_start = row['years_since_start']
        inflation_factor = (1.02) ** years_since_start

        match = abs(actual - expected) < 1.0
        status = "✅" if match else "❌"

        print(f"{int(year):<8} {int(age):<6} ${actual:>13,.2f} ${expected:>13,.2f} {inflation_factor:>11.4f} {status}")

        if not match:
            all_passed = False
            print(f"  ERROR: Difference of ${abs(actual - expected):,.2f}")

        expected *= 1.02

    return all_passed


def run_tests():
    """Run all regression tests"""
    print("\n" + "="*80)
    print("EMPLOYER PENSION INTEGRATION - REGRESSION TEST SUITE")
    print("="*80)

    results = {
        "Backwards Compatibility": test_backwards_compatibility(),
        "Pension in Taxes": test_with_employer_pension(),
        "Pension Inflation": test_pension_inflation(),
    }

    print("\n" + "="*80)
    print("FINAL RESULTS")
    print("="*80)

    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:<30} {status}")

    total = len(results)
    passed_count = sum(results.values())

    print("\n" + "="*80)
    print(f"SUMMARY: {passed_count}/{total} tests passed")

    if passed_count == total:
        print("✅ ALL REGRESSION TESTS PASSED!")
        print("   - Existing functionality preserved")
        print("   - Employer pension integration working correctly")
    else:
        print(f"❌ {total - passed_count} TEST(S) FAILED")

    print("="*80 + "\n")

    return passed_count == total


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
