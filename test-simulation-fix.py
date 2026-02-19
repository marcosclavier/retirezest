#!/usr/bin/env python3
"""
Test that the sys UnboundLocalError is fixed
"""

import sys
import os
sys.path.insert(0, 'python-api')

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_simulation():
    """Test that simulation runs without UnboundLocalError"""

    # Load tax config
    tax_cfg = load_tax_config('python-api/data/tax_config.yaml')

    # Create a simple test household
    p1 = Person(
        name="Test Person",
        start_age=65,
        tfsa_balance=100000.0,
        rrif_balance=200000.0,
        rrsp_balance=0.0,
        nonreg_balance=50000.0,
        nonreg_acb=40000.0,
        corporate_balance=0.0,
        home_value=500000.0,
        home_mortgage=0.0,
        cpp_start_age=65,
        cpp_amount=15000.0,
        oas_start_age=65,
        pension_incomes=[],
        other_incomes=[]
    )

    # Set corporate details
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

    # Set non-reg details
    p1.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    # Create empty p2
    p2 = Person(
        name="",
        start_age=0,
        tfsa_balance=0.0,
        rrif_balance=0.0,
        rrsp_balance=0.0,
        nonreg_balance=0.0,
        nonreg_acb=0.0,
        corporate_balance=0.0,
        home_value=0.0,
        home_mortgage=0.0,
        cpp_start_age=0,
        cpp_amount=0.0,
        oas_start_age=0,
        pension_incomes=[],
        other_incomes=[]
    )

    household = Household(
        p1=p1,
        p2=p2,
        province="ON",
        start_year=2025,
        end_age=95,
        strategy="Balanced",
        spending_go_go=80000.0,
        spending_slow_go=70000.0,
        spending_no_go=60000.0,
        go_go_end_age=75,
        slow_go_end_age=85,
        spending_inflation=0.02,
        asset_inflation=0.05,
        inflation=0.02,
        spending_safety_buffer_percentage=0.05
    )

    print("Running simulation test...")

    try:
        # Run the simulation
        df = simulate(household, tax_cfg)

        # Check if simulation completed
        if len(df) > 0:
            print(f"✅ Simulation completed successfully with {len(df)} years")
            print(f"   First year: {df.iloc[0]['year']}")
            print(f"   Last year: {df.iloc[-1]['year']}")
            print(f"   No UnboundLocalError with 'sys'!")
            return True
        else:
            print("❌ Simulation returned empty results")
            return False

    except UnboundLocalError as e:
        if 'sys' in str(e):
            print(f"❌ UnboundLocalError with 'sys' still exists: {e}")
            return False
        else:
            print(f"❌ Other UnboundLocalError: {e}")
            return False
    except Exception as e:
        print(f"❌ Other error occurred: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_simulation()

    if success:
        print("\n✅ All tests passed! The sys UnboundLocalError has been fixed.")
    else:
        print("\n❌ Test failed. The issue may not be fully resolved.")
        sys.exit(1)