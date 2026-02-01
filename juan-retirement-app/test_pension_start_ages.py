#!/usr/bin/env python3
"""
Test script for pension start age functionality (US-039)

Tests that pensions and other income sources properly activate at their
specified start ages and get inflation-indexed from their start year.
"""

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_pension_start_age_65():
    """Test pension starting at age 65"""
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
        nr_cash=20000,
        nr_gic=50000,
        nr_invest=130000,
        y_nr_cash_interest=2.0,
        y_nr_gic_interest=3.5,
        y_nr_inv_total_return=6.0,
        y_nr_inv_elig_div=2.0,
        y_nr_inv_nonelig_div=0.5,
        y_nr_inv_capg=3.0,
        y_nr_inv_roc_pct=0.5,
        nr_cash_pct=10.0,
        nr_gic_pct=25.0,
        nr_invest_pct=65.0,
        corp_cash_bucket=0,
        corp_gic_bucket=0,
        corp_invest_bucket=0,
        corp_rdtoh=0,
        y_corp_cash_interest=2.0,
        y_corp_gic_interest=3.5,
        y_corp_inv_total_return=6.0,
        y_corp_inv_elig_div=2.0,
        y_corp_inv_capg=3.5,
        corp_cash_pct=0,
        corp_gic_pct=0,
        corp_invest_pct=0,
        corp_dividend_type='eligible',
        tfsa_room_start=7000,
        tfsa_contribution_annual=0,
        gic_assets=[]
    )

    household = Household(
        p1=person,
        p2=None,
        province='ON',
        start_year=2025,
        end_age=70,
        strategy='balanced',
        spending_go_go=50000,
        go_go_end_age=75,
        spending_slow_go=40000,
        slow_go_end_age=85,
        spending_no_go=35000,
        spending_inflation=0.02,
        general_inflation=0.02,
        tfsa_room_annual_growth=7000,
        gap_tolerance=1000,
        reinvest_nonreg_dist=False,
        income_split_rrif_fraction=0.0,
        hybrid_rrif_topup_per_person=0,
        stop_on_fail=False
    )

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Run simulation (returns DataFrame)
    results = simulate(household, tax_cfg)

    # Check years 60-64 (before pension starts) - results is a DataFrame
    print("\nYears 60-64 (Before Pension Start):")
    for idx in range(5):
        if idx >= len(results):
            break
        row = results.iloc[idx]
        age = row['age']
        # Pension income columns may not exist yet - check for them
        pension_p1 = row.get('pension_income_p1', 0) if 'pension_income_p1' in results.columns else 0
        print(f"  Age {age}: Pension Income = ${pension_p1:,.0f} (Expected: $0)")
        assert pension_p1 == 0, f"Pension should be $0 at age {age}, got ${pension_p1}"

    # Check years 65+ (after pension starts)
    print("\nYears 65-70 (After Pension Start):")
    for idx in range(5, len(results)):
        row = results.iloc[idx]
        age = row['age']
        pension_p1 = row.get('pension_income_p1', 0) if 'pension_income_p1' in results.columns else 0
        expected_pension = 30000 * ((1 + household.general_inflation) ** (age - 65))
        print(f"  Age {age}: Pension Income = ${pension_p1:,.0f} (Expected: ${expected_pension:,.0f})")
        # Allow 1% tolerance for rounding
        if expected_pension > 0:
            assert abs(pension_p1 - expected_pension) / expected_pension < 0.01, \
                f"Pension mismatch at age {age}: expected ${expected_pension:,.0f}, got ${pension_p1:,.0f}"

    print("\n✅ TEST 1 PASSED: Pension starts correctly at age 65 with inflation indexing\n")


def test_other_income_start_age_55():
    """Test part-time employment income starting at age 55"""
    print("=" * 80)
    print("TEST 2: Part-Time Employment Starting at Age 55")
    print("=" * 80)

    person = Person(
        name="Early Retiree",
        start_age=55,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[],
        other_incomes=[
            {
                'type': 'employment',
                'name': 'Part-Time Consulting',
                'amount': 20000,
                'startAge': 55,
                'inflationIndexed': True
            }
        ],
        tfsa_balance=100000,
        rrsp_balance=400000,
        rrif_balance=0,
        nonreg_balance=150000,
        corporate_balance=0,
        nonreg_acb=120000,
        nr_cash=15000,
        nr_gic=45000,
        nr_invest=90000,
        y_nr_cash_interest=2.0,
        y_nr_gic_interest=3.5,
        y_nr_inv_total_return=6.0,
        y_nr_inv_elig_div=2.0,
        y_nr_inv_nonelig_div=0.5,
        y_nr_inv_capg=3.0,
        y_nr_inv_roc_pct=0.5,
        nr_cash_pct=10.0,
        nr_gic_pct=30.0,
        nr_invest_pct=60.0,
        corp_cash_bucket=0,
        corp_gic_bucket=0,
        corp_invest_bucket=0,
        corp_rdtoh=0,
        y_corp_cash_interest=2.0,
        y_corp_gic_interest=3.5,
        y_corp_inv_total_return=6.0,
        y_corp_inv_elig_div=2.0,
        y_corp_inv_capg=3.5,
        corp_cash_pct=0,
        corp_gic_pct=0,
        corp_invest_pct=0,
        corp_dividend_type='eligible',
        tfsa_room_start=7000,
        tfsa_contribution_annual=0,
        gic_assets=[]
    )

    household = Household(
        province='ON',
        start_year=2025,
        end_age=60,
        strategy='balanced',
        spending_go_go=60000,
        go_go_end_age=75,
        spending_slow_go=48000,
        slow_go_end_age=85,
        spending_no_go=40000,
        spending_inflation=2.0,
        general_inflation=2.0,
        tfsa_room_annual_growth=7000,
        gap_tolerance=1000,
        reinvest_nonreg_dist=False,
        income_split_rrif_fraction=0.0,
        hybrid_rrif_topup_per_person=0,
        stop_on_fail=False
    )

    result = simulate_household(household, person, None)

    # Check all years (employment should be active from age 55)
    print("\nYears 55-60 (Employment Income Active):")
    for year in result['years']:
        age = year['age']
        other_income = sum(year.get('income_details', {}).get('other_income', {}).values())
        expected_income = 20000 * ((1 + household.general_inflation / 100) ** (age - 55))
        print(f"  Age {age}: Other Income = ${other_income:,.0f} (Expected: ${expected_income:,.0f})")
        # Allow 1% tolerance for rounding
        assert abs(other_income - expected_income) / expected_income < 0.01, \
            f"Income mismatch at age {age}: expected ${expected_income:,.0f}, got ${other_income:,.0f}"

    print("\n✅ TEST 2 PASSED: Part-time employment starts correctly at age 55 with inflation indexing\n")


def test_rental_income_no_start_age():
    """Test rental income with no start age (active immediately)"""
    print("=" * 80)
    print("TEST 3: Rental Income Without Start Age (Active Immediately)")
    print("=" * 80)

    person = Person(
        name="Rental Property Owner",
        start_age=60,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[],
        other_incomes=[
            {
                'type': 'rental',
                'name': 'Rental Property',
                'amount': 12000,
                'inflationIndexed': True
                # No startAge - should be active immediately
            }
        ],
        tfsa_balance=80000,
        rrsp_balance=250000,
        rrif_balance=0,
        nonreg_balance=150000,
        corporate_balance=0,
        nonreg_acb=120000,
        nr_cash=15000,
        nr_gic=45000,
        nr_invest=90000,
        y_nr_cash_interest=2.0,
        y_nr_gic_interest=3.5,
        y_nr_inv_total_return=6.0,
        y_nr_inv_elig_div=2.0,
        y_nr_inv_nonelig_div=0.5,
        y_nr_inv_capg=3.0,
        y_nr_inv_roc_pct=0.5,
        nr_cash_pct=10.0,
        nr_gic_pct=30.0,
        nr_invest_pct=60.0,
        corp_cash_bucket=0,
        corp_gic_bucket=0,
        corp_invest_bucket=0,
        corp_rdtoh=0,
        y_corp_cash_interest=2.0,
        y_corp_gic_interest=3.5,
        y_corp_inv_total_return=6.0,
        y_corp_inv_elig_div=2.0,
        y_corp_inv_capg=3.5,
        corp_cash_pct=0,
        corp_gic_pct=0,
        corp_invest_pct=0,
        corp_dividend_type='eligible',
        tfsa_room_start=7000,
        tfsa_contribution_annual=0,
        gic_assets=[]
    )

    household = Household(
        province='ON',
        start_year=2025,
        end_age=65,
        strategy='balanced',
        spending_go_go=50000,
        go_go_end_age=75,
        spending_slow_go=40000,
        slow_go_end_age=85,
        spending_no_go=35000,
        spending_inflation=2.0,
        general_inflation=2.0,
        tfsa_room_annual_growth=7000,
        gap_tolerance=1000,
        reinvest_nonreg_dist=False,
        income_split_rrif_fraction=0.0,
        hybrid_rrif_topup_per_person=0,
        stop_on_fail=False
    )

    result = simulate_household(household, person, None)

    # Check all years (rental income should be active from start)
    print("\nYears 60-65 (Rental Income Active from Start):")
    for year in result['years']:
        age = year['age']
        years_since_start = age - 60
        other_income = sum(year.get('income_details', {}).get('other_income', {}).values())
        expected_income = 12000 * ((1 + household.general_inflation / 100) ** years_since_start)
        print(f"  Age {age}: Rental Income = ${other_income:,.0f} (Expected: ${expected_income:,.0f})")
        # Allow 1% tolerance for rounding
        assert abs(other_income - expected_income) / expected_income < 0.01, \
            f"Income mismatch at age {age}: expected ${expected_income:,.0f}, got ${other_income:,.0f}"

    print("\n✅ TEST 3 PASSED: Rental income active immediately (no startAge) with inflation indexing\n")


def test_multiple_pensions_different_start_ages():
    """Test multiple pensions starting at different ages"""
    print("=" * 80)
    print("TEST 4: Multiple Pensions with Different Start Ages")
    print("=" * 80)

    person = Person(
        name="Multiple Pension Holder",
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
        other_incomes=[],
        tfsa_balance=100000,
        rrsp_balance=200000,
        rrif_balance=0,
        nonreg_balance=150000,
        corporate_balance=0,
        nonreg_acb=120000,
        nr_cash=15000,
        nr_gic=45000,
        nr_invest=90000,
        y_nr_cash_interest=2.0,
        y_nr_gic_interest=3.5,
        y_nr_inv_total_return=6.0,
        y_nr_inv_elig_div=2.0,
        y_nr_inv_nonelig_div=0.5,
        y_nr_inv_capg=3.0,
        y_nr_inv_roc_pct=0.5,
        nr_cash_pct=10.0,
        nr_gic_pct=30.0,
        nr_invest_pct=60.0,
        corp_cash_bucket=0,
        corp_gic_bucket=0,
        corp_invest_bucket=0,
        corp_rdtoh=0,
        y_corp_cash_interest=2.0,
        y_corp_gic_interest=3.5,
        y_corp_inv_total_return=6.0,
        y_corp_inv_elig_div=2.0,
        y_corp_inv_capg=3.5,
        corp_cash_pct=0,
        corp_gic_pct=0,
        corp_invest_pct=0,
        corp_dividend_type='eligible',
        tfsa_room_start=7000,
        tfsa_contribution_annual=0,
        gic_assets=[]
    )

    household = Household(
        province='ON',
        start_year=2025,
        end_age=70,
        strategy='balanced',
        spending_go_go=60000,
        go_go_end_age=75,
        spending_slow_go=48000,
        slow_go_end_age=85,
        spending_no_go=40000,
        spending_inflation=2.0,
        general_inflation=2.0,
        tfsa_room_annual_growth=7000,
        gap_tolerance=1000,
        reinvest_nonreg_dist=False,
        income_split_rrif_fraction=0.0,
        hybrid_rrif_topup_per_person=0,
        stop_on_fail=False
    )

    result = simulate_household(household, person, None)

    # Check years 60-64 (only military pension)
    print("\nYears 60-64 (Military Pension Only):")
    for year in result['years'][:5]:
        age = year['age']
        pension_income = sum(year.get('income_details', {}).get('pension_income', {}).values())
        expected_pension = 25000 * ((1 + household.general_inflation / 100) ** (age - 60))
        print(f"  Age {age}: Pension Income = ${pension_income:,.0f} (Expected: ${expected_pension:,.0f})")
        # Allow 1% tolerance for rounding
        assert abs(pension_income - expected_pension) / expected_pension < 0.01, \
            f"Pension mismatch at age {age}: expected ${expected_pension:,.0f}, got ${pension_income:,.0f}"

    # Check years 65-70 (both pensions)
    print("\nYears 65-70 (Both Pensions Active):")
    for year in result['years'][5:]:
        age = year['age']
        pension_income = sum(year.get('income_details', {}).get('pension_income', {}).values())
        military_pension = 25000 * ((1 + household.general_inflation / 100) ** (age - 60))
        corporate_pension = 30000 * ((1 + household.general_inflation / 100) ** (age - 65))
        expected_pension = military_pension + corporate_pension
        print(f"  Age {age}: Pension Income = ${pension_income:,.0f} (Expected: ${expected_pension:,.0f})")
        # Allow 1% tolerance for rounding
        assert abs(pension_income - expected_pension) / expected_pension < 0.01, \
            f"Pension mismatch at age {age}: expected ${expected_pension:,.0f}, got ${pension_income:,.0f}"

    print("\n✅ TEST 4 PASSED: Multiple pensions start at correct ages with independent inflation indexing\n")


if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("PENSION START AGE FEATURE TEST SUITE (US-039)")
    print("=" * 80 + "\n")

    try:
        test_pension_start_age_65()
        test_other_income_start_age_55()
        test_rental_income_no_start_age()
        test_multiple_pensions_different_start_ages()

        print("=" * 80)
        print("✅ ALL TESTS PASSED!")
        print("=" * 80)
        print("\nPension start age feature is working correctly:")
        print("  ✓ Pensions activate at specified start ages")
        print("  ✓ Other income sources activate at specified start ages")
        print("  ✓ Income without startAge is active immediately")
        print("  ✓ Inflation indexing applies from start year")
        print("  ✓ Multiple income sources with different start ages work correctly")
        print("\n")

    except AssertionError as e:
        print("\n" + "=" * 80)
        print("❌ TEST FAILED")
        print("=" * 80)
        print(f"\nError: {e}\n")
        exit(1)
    except Exception as e:
        print("\n" + "=" * 80)
        print("❌ UNEXPECTED ERROR")
        print("=" * 80)
        print(f"\nError: {e}\n")
        import traceback
        traceback.print_exc()
        exit(1)
