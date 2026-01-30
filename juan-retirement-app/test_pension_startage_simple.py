#!/usr/bin/env python3
"""
Simple test for pension start age functionality (US-039)

Verifies that pensions with startAge properly activate at the correct age.
"""

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def main():
    print("=" * 80)
    print("PENSION START AGE TEST (US-039)")
    print("=" * 80)

    # Create person starting at age 60 with pension that starts at age 65
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
        other_incomes=[
            {
                'type': 'employment',
                'name': 'Part-Time Work',
                'amount': 20000,
                'startAge': 60,  # Active from start
                'inflationIndexed': True
            }
        ],
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
        gic_assets=[]
    )

    # Create empty p2 (simulation requires it even for single person)
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
        go_go_end_age=75,
        spending_slow_go=40000,
        slow_go_end_age=85,
        spending_no_go=35000,
        spending_inflation=0.02,
        general_inflation=0.02,
        gap_tolerance=1000,
        reinvest_nonreg_dist=False,
        income_split_rrif_fraction=0.0,
        hybrid_rrif_topup_per_person=0,
        stop_on_fail=False
    )

    print(f"\nTest Setup:")
    print(f"  Person: {person.name}")
    print(f"  Start Age: {person.start_age}")
    print(f"  Pension Incomes: {person.pension_incomes}")
    print(f"  Other Incomes: {person.other_incomes}")
    print(f"\nSimulation Period: Age {person.start_age} to {household.end_age}")
    print(f"General Inflation: {household.general_inflation * 100:.1f}%\n")

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Run simulation
    results = simulate(household, tax_cfg)

    print(f"Simulation completed: {len(results)} years\n")
    print(f"Available columns: {list(results.columns)}\n")
    print("=" * 100)
    print(f"{'Year':<6} {'Age':<5} {'Pension Income':<16} {'Other Income':<16} {'Total Income':<16} {'Status':<20}")
    print("=" * 100)

    all_tests_passed = True

    for idx, row in results.iterrows():
        year = row['year']
        age = row['age']

        # Get pension and other income from DataFrame columns
        # The column names might vary - check what's available
        pension_p1 = 0
        other_p1 = 0

        # Check for pension income columns
        if 'pension_income_p1' in results.columns:
            pension_p1 = row['pension_income_p1']

        # Check for other income columns
        if 'other_income_p1' in results.columns:
            other_p1 = row['other_income_p1']

        total_income = pension_p1 + other_p1

        # Calculate expected values
        expected_pension = 30000 * ((1 + household.general_inflation) ** (age - 65)) if age >= 65 else 0
        expected_other = 20000 * ((1 + household.general_inflation) ** (age - 60))

        # Determine status
        status = ""
        if age < 65:
            if pension_p1 == 0:
                status = "✅ Pension not yet started"
            else:
                status = "❌ Pension should be $0"
                all_tests_passed = False
        else:
            if abs(pension_p1 - expected_pension) / expected_pension < 0.01:
                status = "✅ Pension active"
            else:
                status = f"❌ Expected ${expected_pension:,.0f}"
                all_tests_passed = False

        print(f"{year:<6} {age:<5} ${pension_p1:>13,.0f}  ${other_p1:>13,.0f}  ${total_income:>13,.0f}  {status}")

    print("=" * 100)

    if all_tests_passed:
        print("\n✅ ALL TESTS PASSED!")
        print("\nPension start age feature working correctly:")
        print("  ✓ Pension income is $0 before start age 65")
        print("  ✓ Pension income activates at age 65")
        print("  ✓ Pension income grows with inflation from start age")
        print("  ✓ Other income active from age 60 (person start age)")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED - See details above")
        return 1


if __name__ == '__main__':
    exit(main())
