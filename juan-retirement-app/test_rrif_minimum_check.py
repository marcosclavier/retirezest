#!/usr/bin/env python3
"""
Quick test to check if RRIF minimum withdrawals are being enforced.

This will run a simple simulation and check years 72-75 to see if RRIF withdrawals
meet the CRA minimum percentages.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate, rrif_minimum
from modules.config import load_tax_config

# CRA RRIF Minimum Percentages
RRIF_MINIMUMS = {
    71: 0.0528,
    72: 0.0748,
    73: 0.0785,
    74: 0.0826,
    75: 0.0869,
}

def test_rrif_minimum():
    """Test RRIF minimum enforcement with a simple profile."""

    # Create a simple profile with RRSP balance that will convert to RRIF
    # Person age 70, will be 72 in 2 years
    p1 = Person(
        name="Test Person",
        start_age=70,
        cpp_start_age=65,
        oas_start_age=65,
        cpp_annual_at_start=12000,
        oas_annual_at_start=7500,
        # Start with RRSP, will convert to RRIF at age 71
        rrsp_balance=500000,
        rrif_balance=0,
        tfsa_balance=0,
        nonreg_balance=0,
        nonreg_acb=0,
        corporate_balance=0,
    )

    p2 = Person(name="None", start_age=100)  # Very old so doesn't participate

    hh = Household(
        p1=p1,
        p2=p2,
        start_year=2026,
        province="ON",
        strategy="NonReg->RRIF->Corporate->TFSA",
        spending_go_go=50000,
        spending_slow_go=50000,
        spending_no_go=50000,
    )

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Run simulation
    print("Running simulation...")
    result_df = simulate(hh, tax_cfg)

    print("\n" + "="*80)
    print("RRIF MINIMUM WITHDRAWAL CHECK")
    print("="*80)

    # Check years when person should have RRIF (age 71+)
    for _, row in result_df.iterrows():
        age = row.get('age_p1', 0)
        if age >= 71 and age <= 75:  # Check first 5 years of RRIF
            year = row.get('year', 0)
            rrif_balance_start = row.get('start_rrif_p1', 0)
            rrif_withdrawal = row.get('rrif_withdrawal_p1', 0)

            # Get minimum percentage for this age
            min_pct = RRIF_MINIMUMS.get(age, 0.08)  # Default to 8% if not in table
            required_minimum = rrif_balance_start * min_pct

            # Check if withdrawal meets minimum
            meets_minimum = rrif_withdrawal >= (required_minimum - 1)  # Allow $1 rounding error

            status = "✅ PASS" if meets_minimum else "❌ FAIL"

            print(f"\nYear {year} (Age {age}):")
            print(f"  RRIF Balance (start): ${rrif_balance_start:,.2f}")
            print(f"  Required Minimum ({min_pct*100:.2f}%): ${required_minimum:,.2f}")
            print(f"  Actual Withdrawal: ${rrif_withdrawal:,.2f}")
            print(f"  Status: {status}")

            if not meets_minimum:
                shortfall = required_minimum - rrif_withdrawal
                print(f"  ⚠️  Shortfall: ${shortfall:,.2f}")

    print("\n" + "="*80)

    # Now test the rrif_minimum() function directly
    print("\nTesting rrif_minimum() function directly:")
    test_balance = 500000
    for age in [71, 72, 73, 74, 75]:
        min_withdrawal = rrif_minimum(test_balance, age)
        expected_pct = RRIF_MINIMUMS.get(age, 0)
        expected_amount = test_balance * expected_pct

        print(f"  Age {age}: rrif_minimum({test_balance:,.0f}, {age}) = ${min_withdrawal:,.2f}")
        print(f"           Expected ({expected_pct*100:.2f}%): ${expected_amount:,.2f}")

        if abs(min_withdrawal - expected_amount) < 1:
            print(f"           ✅ Matches CRA table")
        else:
            print(f"           ❌ Does NOT match CRA table")

    print("\n" + "="*80)

if __name__ == "__main__":
    test_rrif_minimum()
