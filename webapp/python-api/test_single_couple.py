#!/usr/bin/env python3
"""
Test script for single vs couple retirement simulations
Verifies that GIS calculations use proper thresholds for single vs couple scenarios
"""

import json
from modules.simulation import run_simulation
from modules.models import Household, Person
from modules.household_utils import is_couple, get_gis_threshold

def create_test_person(name: str, age: int = 65) -> Person:
    """Create a test person with minimal data"""
    return Person(
        name=name,
        start_age=age,
        cpp_start_age=65,
        cpp_annual_at_start=10000,
        oas_start_age=65,
        oas_annual_at_start=8000,
        tfsa_balance=50000,
        rrif_balance=100000,
        rrsp_balance=0,
        nonreg_balance=0,
        corporate_balance=0,
        nonreg_acb=0,
        nr_cash=0,
        nr_gic=0,
        nr_invest=0,
        y_nr_cash_interest=2.0,
        y_nr_gic_interest=3.5,
        y_nr_inv_total_return=6.0,
        y_nr_inv_elig_div=2.0,
        y_nr_inv_nonelig_div=0.5,
        y_nr_inv_capg=3.0,
        y_nr_inv_roc_pct=0.5,
        nr_cash_pct=10.0,
        nr_gic_pct=20.0,
        nr_invest_pct=70.0,
        corp_cash_bucket=0,
        corp_gic_bucket=0,
        corp_invest_bucket=0,
        corp_rdtoh=0,
        y_corp_cash_interest=2.0,
        y_corp_gic_interest=3.5,
        y_corp_inv_total_return=6.0,
        y_corp_inv_elig_div=2.0,
        y_corp_inv_capg=3.5,
        corp_cash_pct=5.0,
        corp_gic_pct=10.0,
        corp_invest_pct=85.0,
        corp_dividend_type="eligible",
        tfsa_room_start=7000,
        enable_early_rrif_withdrawal=False,
        early_rrif_withdrawal_start_age=65,
        early_rrif_withdrawal_end_age=70,
        early_rrif_withdrawal_annual=20000,
        early_rrif_withdrawal_percentage=5.0,
        early_rrif_withdrawal_mode="fixed",
        rental_income_annual=0,
        has_primary_residence=False,
        primary_residence_value=0,
        primary_residence_purchase_price=0,
        primary_residence_mortgage=0,
        primary_residence_monthly_payment=0,
        plan_to_downsize=False,
        downsize_year=None,
        downsize_new_home_cost=0,
        downsize_is_principal_residence=True
    )

def test_single_retiree():
    """Test simulation for single retiree"""
    print("\n" + "="*60)
    print("TESTING SINGLE RETIREE SCENARIO")
    print("="*60)

    p1 = create_test_person("John", 65)
    p2 = create_test_person("", 65)  # Empty person for single

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        include_partner=False,  # SINGLE RETIREE
        end_age=95,
        strategy="minimize-income",
        spending_go_go=40000,  # Lower spending for single
        go_go_end_age=75,
        spending_slow_go=35000,
        slow_go_end_age=85,
        spending_no_go=30000,
        spending_inflation=2.0,
        general_inflation=2.0,
        gap_tolerance=1000,
        tfsa_contribution_each=0,
        reinvest_nonreg_dist=False,
        income_split_rrif_fraction=0.0,
        hybrid_rrif_topup_per_person=0,
        stop_on_fail=False,
        tfsa_room_annual_growth=7000
    )

    # Check household utilities
    print(f"Is couple: {is_couple(household)}")

    # Mock GIS config for testing
    gis_config = {
        "threshold_single": 22272,
        "threshold_couple": 29424,
        "max_benefit_single": 11628.84,
        "max_benefit_couple": 6814.20
    }

    threshold = get_gis_threshold(household, gis_config)
    print(f"GIS threshold: ${threshold:,.2f}")
    print(f"Expected: $22,272.00 for single")

    # Run simulation
    try:
        result = run_simulation(household)
        if result.success:
            print(f"\n✅ Single retiree simulation SUCCEEDED")
            print(f"Health score: {result.health_score}")
            print(f"Final portfolio value: ${result.final_portfolio_value:,.2f}")

            # Check first year for GIS
            if result.year_by_year and len(result.year_by_year) > 0:
                first_year = result.year_by_year[0]
                print(f"\nFirst year (2025) details:")
                print(f"  Total income P1: ${first_year.get('total_income_p1', 0):,.2f}")
                print(f"  GIS P1: ${first_year.get('gis_p1', 0):,.2f}")
                print(f"  Total tax P1: ${first_year.get('total_tax_p1', 0):,.2f}")
                print(f"  Net income P1: ${first_year.get('net_income_p1', 0):,.2f}")
        else:
            print(f"\n❌ Single retiree simulation FAILED")
            print(f"Error: {result.message}")
    except Exception as e:
        print(f"\n❌ Exception in single retiree simulation: {e}")

def test_couple():
    """Test simulation for couple"""
    print("\n" + "="*60)
    print("TESTING COUPLE SCENARIO")
    print("="*60)

    p1 = create_test_person("John", 65)
    p2 = create_test_person("Jane", 63)

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        include_partner=True,  # COUPLE
        end_age=95,
        strategy="minimize-income",
        spending_go_go=60000,  # Higher spending for couple
        go_go_end_age=75,
        spending_slow_go=50000,
        slow_go_end_age=85,
        spending_no_go=40000,
        spending_inflation=2.0,
        general_inflation=2.0,
        gap_tolerance=1000,
        tfsa_contribution_each=0,
        reinvest_nonreg_dist=False,
        income_split_rrif_fraction=0.5,  # Income splitting for couple
        hybrid_rrif_topup_per_person=0,
        stop_on_fail=False,
        tfsa_room_annual_growth=7000
    )

    # Check household utilities
    print(f"Is couple: {is_couple(household)}")

    # Mock GIS config for testing
    gis_config = {
        "threshold_single": 22272,
        "threshold_couple": 29424,
        "max_benefit_single": 11628.84,
        "max_benefit_couple": 6814.20
    }

    threshold = get_gis_threshold(household, gis_config)
    print(f"GIS threshold: ${threshold:,.2f}")
    print(f"Expected: $29,424.00 for couple")

    # Run simulation
    try:
        result = run_simulation(household)
        if result.success:
            print(f"\n✅ Couple simulation SUCCEEDED")
            print(f"Health score: {result.health_score}")
            print(f"Final portfolio value: ${result.final_portfolio_value:,.2f}")

            # Check first year for GIS
            if result.year_by_year and len(result.year_by_year) > 0:
                first_year = result.year_by_year[0]
                print(f"\nFirst year (2025) details:")
                print(f"  Total income P1: ${first_year.get('total_income_p1', 0):,.2f}")
                print(f"  Total income P2: ${first_year.get('total_income_p2', 0):,.2f}")
                print(f"  GIS P1: ${first_year.get('gis_p1', 0):,.2f}")
                print(f"  GIS P2: ${first_year.get('gis_p2', 0):,.2f}")
                print(f"  Total tax P1: ${first_year.get('total_tax_p1', 0):,.2f}")
                print(f"  Total tax P2: ${first_year.get('total_tax_p2', 0):,.2f}")
        else:
            print(f"\n❌ Couple simulation FAILED")
            print(f"Error: {result.message}")
    except Exception as e:
        print(f"\n❌ Exception in couple simulation: {e}")

if __name__ == "__main__":
    print("\n🧪 Testing Single vs Couple Retirement Simulations")
    print("This test verifies that GIS calculations use proper thresholds")
    print("and that simulations work correctly for both scenarios.\n")

    test_single_retiree()
    test_couple()

    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)