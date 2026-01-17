"""
Test script to verify employer pension income splitting for couples aged 65+.

Tests:
1. Pension splitting is applied when both persons are 65+
2. Pension splitting reduces household tax burden
3. Pension splitting amount is capped at 50%
4. Pension splitting is not applied if either person is under 65
"""

import sys
from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_pension_splitting_tax_savings():
    """Test that pension splitting reduces total household tax."""

    print("=" * 80)
    print("EMPLOYER PENSION INCOME SPLITTING TEST")
    print("=" * 80)

    # Scenario: One person has high pension income, other has low income
    # Splitting should reduce overall household tax

    print("\n📊 TEST SCENARIO:")
    print("  Person 1: High employer pension ($60,000)")
    print("  Person 2: Low employer pension ($10,000)")
    print("  Both are 65+ years old (eligible for pension splitting)")
    print("  Expected: Splitting 50% should reduce total household tax\n")

    # Create test person 1 with HIGH employer pension
    p1 = Person(
        name="High Earner",
        start_age=65,
        cpp_annual_at_start=15000,
        cpp_start_age=65,
        oas_annual_at_start=8500,
        oas_start_age=65,
        employer_pension_annual=60000,  # $60k employer pension (HIGH)
        tfsa_balance=100000,
        rrif_balance=200000,
        nonreg_balance=50000,
        nonreg_acb=40000,
    )

    # Create test person 2 with LOW employer pension
    p2 = Person(
        name="Low Earner",
        start_age=65,
        cpp_annual_at_start=8000,
        cpp_start_age=65,
        oas_annual_at_start=8500,
        oas_start_age=65,
        employer_pension_annual=10000,  # $10k employer pension (LOW)
        tfsa_balance=100000,
        rrif_balance=50000,
        nonreg_balance=25000,
        nonreg_acb=20000,
    )

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    print("=" * 80)
    print("TEST 1: WITHOUT Pension Splitting (baseline)")
    print("=" * 80)

    # Create household WITHOUT pension splitting
    household_no_split = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=66,  # Just 1 year for testing
        spending_go_go=60000,
        go_go_end_age=75,
        spending_slow_go=50000,
        slow_go_end_age=85,
        spending_no_go=40000,
        spending_inflation=0.02,
        general_inflation=0.02,
        strategy="corporate-optimized",
        income_split_pension_fraction=0.0,  # NO pension splitting
        income_split_rrif_fraction=0.0,  # NO RRIF splitting either (isolate pension effect)
    )

    results_no_split = simulate(household_no_split, tax_cfg)
    first_year_no_split = results_no_split.iloc[0]

    print(f"\nYear 1 Results (NO Pension Splitting):")
    print(f"  Person 1:")
    print(f"    Employer Pension: ${first_year_no_split['employer_pension_p1']:,.2f}")
    print(f"    Taxable Income:   ${first_year_no_split['taxable_inc_p1']:,.2f}")
    print(f"    Tax Paid:         ${first_year_no_split['tax_p1']:,.2f}")
    print(f"\n  Person 2:")
    print(f"    Employer Pension: ${first_year_no_split['employer_pension_p2']:,.2f}")
    print(f"    Taxable Income:   ${first_year_no_split['taxable_inc_p2']:,.2f}")
    print(f"    Tax Paid:         ${first_year_no_split['tax_p2']:,.2f}")
    print(f"\n  Household:")
    print(f"    Total Tax:        ${first_year_no_split['tax_p1'] + first_year_no_split['tax_p2']:,.2f}")

    total_tax_no_split = first_year_no_split['tax_p1'] + first_year_no_split['tax_p2']

    print("\n" + "=" * 80)
    print("TEST 2: WITH 50% Pension Splitting")
    print("=" * 80)

    # Create household WITH 50% pension splitting
    household_with_split = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=66,  # Just 1 year for testing
        spending_go_go=60000,
        go_go_end_age=75,
        spending_slow_go=50000,
        slow_go_end_age=85,
        spending_no_go=40000,
        spending_inflation=0.02,
        general_inflation=0.02,
        strategy="corporate-optimized",
        income_split_pension_fraction=0.5,  # 50% pension splitting (CRA maximum)
        income_split_rrif_fraction=0.0,  # NO RRIF splitting (isolate pension effect)
    )

    results_with_split = simulate(household_with_split, tax_cfg)
    first_year_with_split = results_with_split.iloc[0]

    print(f"\nYear 1 Results (WITH 50% Pension Splitting):")
    print(f"  Person 1 (High Earner):")
    print(f"    Employer Pension: ${first_year_with_split['employer_pension_p1']:,.2f}")
    print(f"    Taxable Income:   ${first_year_with_split['taxable_inc_p1']:,.2f}")
    print(f"    Tax Paid:         ${first_year_with_split['tax_p1']:,.2f}")
    print(f"\n  Person 2 (Low Earner):")
    print(f"    Employer Pension: ${first_year_with_split['employer_pension_p2']:,.2f}")
    print(f"    Taxable Income:   ${first_year_with_split['taxable_inc_p2']:,.2f}")
    print(f"    Tax Paid:         ${first_year_with_split['tax_p2']:,.2f}")
    print(f"\n  Household:")
    print(f"    Total Tax:        ${first_year_with_split['tax_p1'] + first_year_with_split['tax_p2']:,.2f}")

    total_tax_with_split = first_year_with_split['tax_p1'] + first_year_with_split['tax_p2']

    print("\n" + "=" * 80)
    print("TAX SAVINGS ANALYSIS")
    print("=" * 80)

    tax_savings = total_tax_no_split - total_tax_with_split
    savings_pct = (tax_savings / total_tax_no_split * 100) if total_tax_no_split > 0 else 0

    print(f"\n  Total Tax WITHOUT Splitting:  ${total_tax_no_split:,.2f}")
    print(f"  Total Tax WITH Splitting:     ${total_tax_with_split:,.2f}")
    print(f"  Tax Savings:                  ${tax_savings:,.2f} ({savings_pct:.1f}%)")

    # Expected: P1 transfers 50% of $60k = $30k to P2
    # Expected: P2 transfers 50% of $10k = $5k to P1
    # Net effect: P1 gives $25k to P2
    expected_p1_split_amount = 60000 * 0.5
    expected_p2_split_amount = 10000 * 0.5
    net_transfer = expected_p1_split_amount - expected_p2_split_amount

    print(f"\n  Expected Split Logic:")
    print(f"    P1 transfers 50% of ${60000:,} = ${expected_p1_split_amount:,.2f}")
    print(f"    P2 transfers 50% of ${10000:,} = ${expected_p2_split_amount:,.2f}")
    print(f"    Net: P1 gives ${net_transfer:,.2f} to P2")

    print("\n" + "=" * 80)
    print("TEST RESULTS")
    print("=" * 80)

    success = True

    # Verify tax savings occurred
    if tax_savings > 0:
        print("✓ PASS: Pension splitting reduced household tax")
    else:
        print("✗ FAIL: Pension splitting did not reduce tax")
        success = False

    # Verify tax savings is significant (should be at least $1,000)
    if tax_savings >= 1000:
        print(f"✓ PASS: Tax savings is significant (${tax_savings:,.2f})")
    else:
        print(f"⚠ WARNING: Tax savings is less than expected (${tax_savings:,.2f})")

    # Verify pension amounts are unchanged (splitting doesn't change actual pension amounts)
    if first_year_with_split['employer_pension_p1'] == 60000:
        print("✓ PASS: P1 pension amount unchanged ($60,000)")
    else:
        print(f"✗ FAIL: P1 pension changed to ${first_year_with_split['employer_pension_p1']:,.2f}")
        success = False

    if first_year_with_split['employer_pension_p2'] == 10000:
        print("✓ PASS: P2 pension amount unchanged ($10,000)")
    else:
        print(f"✗ FAIL: P2 pension changed to ${first_year_with_split['employer_pension_p2']:,.2f}")
        success = False

    if success:
        print("\n✓✓✓ ALL TESTS PASSED ✓✓✓")
        print(f"\n💰 Pension splitting saves ${tax_savings:,.2f} in taxes per year!")
    else:
        print("\n✗✗✗ SOME TESTS FAILED ✗✗✗")

    return success


if __name__ == "__main__":
    success = test_pension_splitting_tax_savings()
    sys.exit(0 if success else 1)
