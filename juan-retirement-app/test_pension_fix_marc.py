#!/usr/bin/env python3
"""
Test Pension Income Fix for Marc's Issue

This test validates that pension income now appears in:
1. YearResult API responses (employer_pension_p1, employer_pension_p2)
2. Five Year Plan table
3. Year by Year details

User reported:
- Entered 2 pensions ($100k and $50k)
- Pensions not showing in 5-Year Plan
- Pensions not showing in Year by Year view
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config
from api.utils.converters import dataframe_to_year_results, extract_five_year_plan

def test_marc_pension_scenario():
    """
    Test scenario matching Marc's user data:
    - Person 1: Age 52, Pension $100,000 starting at age 52
    - Person 2: Age 55, Pension $50,000 starting at age 55
    """
    print("=" * 80)
    print("TEST: Marc's Pension Income Issue")
    print("=" * 80)
    print("Scenario: Married couple with substantial pension income")
    print("  Person 1: $100,000 pension starting age 52")
    print("  Person 2: $50,000 pension starting age 55")
    print()

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create Marc's scenario
    p1 = Person(
        name="Person 1",
        start_age=52,
        tfsa_balance=0,
        rrif_balance=0,
        nonreg_balance=0,
        cpp_start_age=65,
        cpp_annual_at_start=14671.25,
        oas_start_age=65,
        oas_annual_at_start=8907.72,
        pension_incomes=[
            {
                "name": "Pension",
                "amount": 100000,
                "startAge": 52,
                "inflationIndexed": True
            }
        ]
    )

    p2 = Person(
        name="Person 2",
        start_age=55,
        tfsa_balance=0,
        rrif_balance=0,
        nonreg_balance=0,
        cpp_start_age=65,
        cpp_annual_at_start=0,  # No CPP for person 2
        oas_start_age=65,
        oas_annual_at_start=0,  # No OAS for person 2
        pension_incomes=[
            {
                "name": "Pension",
                "amount": 50000,
                "startAge": 55,
                "inflationIndexed": True
            }
        ]
    )

    household = Household(
        p1=p1,
        p2=p2,
        province='QC',  # Quebec (Marc's province)
        start_year=2026,
        end_age=95,
        spending_go_go=106121,
        spending_slow_go=106121,
        spending_no_go=106121,
        strategy='balanced',
    )

    # Run simulation
    print("Running simulation...")
    results_df = simulate(household, tax_cfg)
    print(f"✅ Simulation complete: {len(results_df)} years\n")

    # Extract API results
    yearly_results = dataframe_to_year_results(results_df)
    five_year_plan = extract_five_year_plan(results_df)

    # Validation
    print("=" * 80)
    print("VALIDATION: Pension Income Fix")
    print("=" * 80)

    all_passed = True

    # Test 1: Check first year YearResult has pension income
    print("\n[TEST 1] YearResult API Response")
    print("-" * 80)
    if yearly_results:
        year_1 = yearly_results[0]
        print(f"Year {year_1.year}:")
        print(f"  Person 1 Pension: ${year_1.employer_pension_p1:,.2f}")
        print(f"  Person 2 Pension: ${year_1.employer_pension_p2:,.2f}")

        if year_1.employer_pension_p1 >= 100000:
            print("  ✅ PASS: Person 1 pension in YearResult")
        else:
            print(f"  ❌ FAIL: Person 1 pension missing (expected ~$100k, got ${year_1.employer_pension_p1:,.2f})")
            all_passed = False

        if year_1.employer_pension_p2 >= 50000:
            print("  ✅ PASS: Person 2 pension in YearResult")
        else:
            print(f"  ❌ FAIL: Person 2 pension missing (expected ~$50k, got ${year_1.employer_pension_p2:,.2f})")
            all_passed = False
    else:
        print("  ❌ FAIL: No yearly results returned")
        all_passed = False

    # Test 2: Check Five Year Plan has pension income
    print("\n[TEST 2] Five Year Plan")
    print("-" * 80)
    if five_year_plan:
        year_1_plan = five_year_plan[0]
        print(f"Year {year_1_plan.year}:")
        print(f"  Person 1 Pension: ${year_1_plan.employer_pension_p1:,.2f}")
        print(f"  Person 2 Pension: ${year_1_plan.employer_pension_p2:,.2f}")

        if year_1_plan.employer_pension_p1 >= 100000:
            print("  ✅ PASS: Person 1 pension in 5-Year Plan")
        else:
            print(f"  ❌ FAIL: Person 1 pension missing (expected ~$100k, got ${year_1_plan.employer_pension_p1:,.2f})")
            all_passed = False

        if year_1_plan.employer_pension_p2 >= 50000:
            print("  ✅ PASS: Person 2 pension in 5-Year Plan")
        else:
            print(f"  ❌ FAIL: Person 2 pension missing (expected ~$50k, got ${year_1_plan.employer_pension_p2:,.2f})")
            all_passed = False
    else:
        print("  ❌ FAIL: No five year plan returned")
        all_passed = False

    # Test 3: Check pension appears in total income
    print("\n[TEST 3] Total Income Calculation")
    print("-" * 80)
    if five_year_plan:
        year_1_plan = five_year_plan[0]
        print(f"Year {year_1_plan.year}:")
        print(f"  Total Income (all sources): ${year_1_plan.total_withdrawn:,.2f}")
        print(f"  Spending Target: ${year_1_plan.spending_target:,.2f}")

        expected_min_income = year_1_plan.employer_pension_p1 + year_1_plan.employer_pension_p2
        if year_1_plan.total_withdrawn >= expected_min_income:
            print(f"  ✅ PASS: Total income includes pension (>= ${expected_min_income:,.2f})")
        else:
            print(f"  ❌ FAIL: Total income too low (expected >= ${expected_min_income:,.2f}, got ${year_1_plan.total_withdrawn:,.2f})")
            all_passed = False
    else:
        print("  ❌ FAIL: No plan data to test")
        all_passed = False

    # Test 4: Check pension values throughout first 5 years
    print("\n[TEST 4] Pension Values (First 5 Years)")
    print("-" * 80)
    if five_year_plan and len(five_year_plan) >= 5:
        for i, year_plan in enumerate(five_year_plan):
            # With inflation indexing, pensions should grow ~2% per year
            expected_p1 = 100000 * (1.02 ** i)
            expected_p2 = 50000 * (1.02 ** i)
            print(f"Year {year_plan.year}: P1=${year_plan.employer_pension_p1:,.0f}, P2=${year_plan.employer_pension_p2:,.0f}")

            # Allow 3% tolerance for inflation variations
            if abs(year_plan.employer_pension_p1 - expected_p1) / expected_p1 > 0.03:
                print(f"  ⚠️  WARNING: P1 pension unexpected value (expected ~${expected_p1:,.0f})")
            if abs(year_plan.employer_pension_p2 - expected_p2) / expected_p2 > 0.03:
                print(f"  ⚠️  WARNING: P2 pension unexpected value (expected ~${expected_p2:,.0f})")
    else:
        print("  ⚠️  WARNING: Less than 5 years in plan")

    # Summary
    print("\n" + "=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED")
        print("\nConclusion:")
        print("  ✓ Pension income appears in YearResult API responses")
        print("  ✓ Pension income appears in 5-Year Plan")
        print("  ✓ Pension income included in total income calculations")
        print("  ✓ Fix resolves Marc's reported issue")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        print("\nIssues found - fix needs more work")
        return 1

if __name__ == "__main__":
    exit_code = test_marc_pension_scenario()
    sys.exit(exit_code)
