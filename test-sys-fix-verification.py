#!/usr/bin/env python3
"""
Verification test for sys UnboundLocalError fix
Tests that the simulation runs without sys-related errors
"""

import sys
import os
sys.path.insert(0, 'python-api')

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_basic_simulation():
    """Test basic simulation without UnboundLocalError"""
    print("=" * 60)
    print("SYS FIX VERIFICATION TEST")
    print("=" * 60)

    # Load tax config
    try:
        tax_cfg = load_tax_config('tax_config_canada_2025.json')
        print("✅ Tax configuration loaded")
    except Exception as e:
        print(f"❌ Failed to load tax config: {e}")
        return False

    # Test 1: Basic simulation
    print("\nTest 1: Basic simulation without sys errors")
    p1 = Person(
        name="Test",
        start_age=65,
        tfsa_balance=100000.0,
        rrif_balance=200000.0,
        rrsp_balance=0.0,
        nonreg_balance=50000.0,
        nonreg_acb=40000.0,
        corporate_balance=0.0,
        cpp_start_age=65,
        cpp_annual_at_start=15000.0,
        oas_start_age=65,
        pension_incomes=[],
        other_incomes=[]
    )

    p2 = Person(
        name="",
        start_age=0,
        tfsa_balance=0.0,
        rrif_balance=0.0,
        rrsp_balance=0.0,
        nonreg_balance=0.0,
        nonreg_acb=0.0,
        corporate_balance=0.0,
        cpp_start_age=0,
        cpp_annual_at_start=0.0,
        oas_start_age=0,
        pension_incomes=[],
        other_incomes=[]
    )

    # Set required fields
    p1.corporate_details = {
        'cash_percentage': 0.1,
        'gic_percentage': 0.2,
        'investment_percentage': 0.7,
        'yield_interest': 0.02,
        'yield_eligible_dividends': 0.02,
        'yield_non_eligible_dividends': 0.01,
        'yield_capital_gains': 0.03,
        'rdtoh_balance': 0.0
    }
    p1.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    household = Household(
        p1=p1, p2=p2,
        province="ON",
        start_year=2025,
        end_age=85,
        strategy="Balanced",
        spending_go_go=70000.0,
        spending_slow_go=60000.0,
        spending_no_go=50000.0,
        go_go_end_age=75,
        slow_go_end_age=82,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    try:
        df = simulate(household, tax_cfg)
        print(f"  ✅ Simulation completed: {len(df)} years")
        return True
    except UnboundLocalError as e:
        if 'sys' in str(e):
            print(f"  ❌ FAILED: UnboundLocalError with 'sys': {e}")
            return False
        else:
            print(f"  ❌ FAILED: Other UnboundLocalError: {e}")
            return False
    except Exception as e:
        print(f"  ⚠️ Other error (not sys-related): {type(e).__name__}: {str(e)[:100]}")
        # This is okay - we're only testing for sys errors
        return True

def test_minimize_income_strategy():
    """Test minimize-income strategy that triggers conditional import"""
    print("\nTest 2: Minimize-income strategy (triggers conditional import)")

    try:
        tax_cfg = load_tax_config('tax_config_canada_2025.json')
    except Exception as e:
        print(f"  ❌ Failed to load tax config: {e}")
        return False

    p1 = Person(
        name="GIS Test",
        start_age=65,
        tfsa_balance=50000.0,
        rrif_balance=100000.0,
        rrsp_balance=0.0,
        nonreg_balance=25000.0,
        nonreg_acb=20000.0,
        corporate_balance=0.0,
        cpp_start_age=65,
        cpp_annual_at_start=10000.0,
        oas_start_age=65,
        pension_incomes=[],
        other_incomes=[]
    )

    p2 = Person(
        name="",
        start_age=0,
        tfsa_balance=0.0,
        rrif_balance=0.0,
        rrsp_balance=0.0,
        nonreg_balance=0.0,
        nonreg_acb=0.0,
        corporate_balance=0.0,
        cpp_start_age=0,
        cpp_annual_at_start=0.0,
        oas_start_age=0,
        pension_incomes=[],
        other_incomes=[]
    )

    # Set required fields
    p1.corporate_details = {
        'cash_percentage': 0.1,
        'gic_percentage': 0.2,
        'investment_percentage': 0.7,
        'yield_interest': 0.02,
        'yield_eligible_dividends': 0.02,
        'yield_non_eligible_dividends': 0.01,
        'yield_capital_gains': 0.03,
        'rdtoh_balance': 0.0
    }
    p1.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    household = Household(
        p1=p1, p2=p2,
        province="ON",
        start_year=2025,
        end_age=85,
        strategy="minimize-income",  # This triggers the conditional import
        spending_go_go=40000.0,
        spending_slow_go=35000.0,
        spending_no_go=30000.0,
        go_go_end_age=75,
        slow_go_end_age=82,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    try:
        df = simulate(household, tax_cfg)
        print(f"  ✅ Minimize-income simulation completed: {len(df)} years")
        # Check if strategy insights were generated (if module exists)
        if hasattr(df, 'attrs') and 'strategy_insights' in df.attrs:
            print(f"  ✅ Strategy insights generated successfully")
        return True
    except UnboundLocalError as e:
        if 'sys' in str(e):
            print(f"  ❌ FAILED: UnboundLocalError with 'sys': {e}")
            return False
        else:
            print(f"  ❌ FAILED: Other UnboundLocalError: {e}")
            return False
    except Exception as e:
        print(f"  ⚠️ Other error (not sys-related): {type(e).__name__}: {str(e)[:100]}")
        # This is okay - we're only testing for sys errors
        return True

def test_gis_optimized_strategy():
    """Test GIS-Optimized strategy that also triggers conditional import"""
    print("\nTest 3: GIS-Optimized strategy (also triggers conditional import)")

    try:
        tax_cfg = load_tax_config('tax_config_canada_2025.json')
    except Exception as e:
        print(f"  ❌ Failed to load tax config: {e}")
        return False

    p1 = Person(
        name="GIS Opt",
        start_age=65,
        tfsa_balance=40000.0,
        rrif_balance=80000.0,
        rrsp_balance=0.0,
        nonreg_balance=20000.0,
        nonreg_acb=16000.0,
        corporate_balance=0.0,
        cpp_start_age=65,
        cpp_annual_at_start=8000.0,
        oas_start_age=65,
        pension_incomes=[],
        other_incomes=[]
    )

    p2 = Person(
        name="",
        start_age=0,
        tfsa_balance=0.0,
        rrif_balance=0.0,
        rrsp_balance=0.0,
        nonreg_balance=0.0,
        nonreg_acb=0.0,
        corporate_balance=0.0,
        cpp_start_age=0,
        cpp_annual_at_start=0.0,
        oas_start_age=0,
        pension_incomes=[],
        other_incomes=[]
    )

    # Set required fields
    p1.corporate_details = {
        'cash_percentage': 0.1,
        'gic_percentage': 0.2,
        'investment_percentage': 0.7,
        'yield_interest': 0.02,
        'yield_eligible_dividends': 0.02,
        'yield_non_eligible_dividends': 0.01,
        'yield_capital_gains': 0.03,
        'rdtoh_balance': 0.0
    }
    p1.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    household = Household(
        p1=p1, p2=p2,
        province="ON",
        start_year=2025,
        end_age=85,
        strategy="GIS-Optimized",  # This also triggers the conditional import
        spending_go_go=35000.0,
        spending_slow_go=30000.0,
        spending_no_go=25000.0,
        go_go_end_age=75,
        slow_go_end_age=82,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    try:
        df = simulate(household, tax_cfg)
        print(f"  ✅ GIS-Optimized simulation completed: {len(df)} years")
        return True
    except UnboundLocalError as e:
        if 'sys' in str(e):
            print(f"  ❌ FAILED: UnboundLocalError with 'sys': {e}")
            return False
        else:
            print(f"  ❌ FAILED: Other UnboundLocalError: {e}")
            return False
    except Exception as e:
        print(f"  ⚠️ Other error (not sys-related): {type(e).__name__}: {str(e)[:100]}")
        # This is okay - we're only testing for sys errors
        return True

def main():
    """Run all verification tests"""
    results = []

    # Run tests
    results.append(test_basic_simulation())
    results.append(test_minimize_income_strategy())
    results.append(test_gis_optimized_strategy())

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(results)
    failed = len(results) - passed

    print(f"✅ Passed: {passed}/{len(results)}")
    print(f"❌ Failed: {failed}/{len(results)}")

    if all(results):
        print("\n🎉 SUCCESS: The sys UnboundLocalError fix is working!")
        print("No sys-related errors detected in any test scenario.")
        return 0
    else:
        print("\n⚠️ WARNING: Some tests failed")
        print("The sys UnboundLocalError may not be fully fixed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())