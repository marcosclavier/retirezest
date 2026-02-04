#!/usr/bin/env python3
"""
Direct test of Daniel Gonzalez employment income bug fix.
This bypasses the API and calls the simulation engine directly.
"""

import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_daniel_gonzalez():
    """
    Test employment income fix with Daniel Gonzalez's profile.

    Expected results AFTER fix:
    - Year 2026 (age 64): Tax > $50,000 (employment income counted)
    - Year 2027 (age 65): Tax > $50,000 (employment income counted)
    - Year 2028 (age 66): Tax ~$10,000 (employment stopped, CPP/OAS only)
    - Success rate > 90%
    """

    print("="*80)
    print("  DANIEL GONZALEZ EMPLOYMENT INCOME BUG FIX TEST")
    print("="*80)
    print()

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create Daniel's profile
    p1 = Person(
        name="Daniel Gonzalez",
        start_age=64,

        # Assets
        tfsa_balance=100000,
        rrsp_balance=500000,
        rrif_balance=0,
        nonreg_balance=50000,
        corporate_balance=0,

        # Government benefits
        cpp_start_age=66,  # ← This is his retirement age (when employment should stop)
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8000,

        # Employment income (this is the bug we're testing!)
        other_incomes=[
            {
                'type': 'employment',
                'amount': 200000,  # $200K employment income
                'startAge': None,  # Should default to start_age (64)
                'endAge': None,    # Should default to cpp_start_age (66) ← THE FIX
                'inflationIndexed': False,
            }
        ]
    )

    # No partner
    p2 = Person(
        name="No Partner",
        start_age=65,
    )

    # Create household
    household = Household(
        p1=p1,
        p2=p2,
        province='AB',
        start_year=2026,
        end_age=85,
        strategy='minimize-income',
        spending_go_go=58000,
        spending_slow_go=58000,
        spending_no_go=58000,
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    print("Profile:")
    print(f"  Name: {p1.name}")
    print(f"  Age: {p1.start_age}")
    print(f"  Retirement Age (CPP start): {p1.cpp_start_age}")
    print(f"  Employment Income: $200,000/year")
    print(f"  Assets: RRSP ${p1.rrsp_balance:,}, TFSA ${p1.tfsa_balance:,}")
    print(f"  CPP: ${p1.cpp_annual_at_start:,} at age {p1.cpp_start_age}")
    print(f"  OAS: ${p1.oas_annual_at_start:,} at age {p1.oas_start_age}")
    print()

    # Run simulation
    print("🚀 Running simulation...")
    results_df = simulate(household, tax_cfg)
    print("✅ Simulation complete")
    print()

    # DEBUG: Print DataFrame columns
    print("DEBUG: DataFrame columns:", list(results_df.columns))
    print("DEBUG: First row:", results_df.iloc[0] if len(results_df) > 0 else "No data")
    print()

    # Analyze results for years 2026-2028 (ages 64-66)
    print("📊 Results Analysis:")
    print(f"{'Year':<6} {'Age':<5} {'Tax':<15} {'Status':<10} {'Result'}")
    print("-" * 80)

    test_passed = True

    for idx in range(min(3, len(results_df))):
        row = results_df.iloc[idx]
        year = int(row.get('year', row.get('Year', 2026 + idx)))  # Try both column names
        age = int(row.get('age_p1', row.get('Age P1', 64 + idx)))  # Try both column names
        tax = row.get('total_tax_after_split', row.get('total_tax', row.get('Total Tax', 0)))  # Try all column names

        if age == 64 or age == 65:
            # Pre-retirement: Should have employment income → tax > $50,000
            expected_min = 50000
            has_employment = tax > expected_min
            status = "✅ PASS" if has_employment else "❌ FAIL"
            result = "Employment income counted" if has_employment else "BUG: No employment income!"

            if not has_employment:
                test_passed = False

            print(f"{year:<6} {age:<5} ${tax:>13,.0f} {status:<10} {result}")

        elif age == 66:
            # Retirement year: Should have CPP/OAS only → tax ~$10,000
            expected_max = 20000
            employment_stopped = tax < expected_max
            status = "✅ PASS" if employment_stopped else "❌ FAIL"
            result = "Employment stopped, CPP/OAS only" if employment_stopped else "BUG: Employment still counting!"

            if not employment_stopped:
                test_passed = False

            print(f"{year:<6} {age:<5} ${tax:>13,.0f} {status:<10} {result}")

    print()

    # Check overall success
    failed_years = len(results_df[results_df['plan_success'] == False])
    total_years = len(results_df)
    success_rate = (total_years - failed_years) / total_years if total_years > 0 else 0

    print(f"📈 Overall Results:")
    print(f"   Years simulated: {total_years}")
    print(f"   Years successful: {total_years - failed_years}")
    print(f"   Success rate: {success_rate:.1%}")

    if success_rate < 0.90:
        test_passed = False
        print(f"   ❌ Success rate too low (expected 95%+)")
    else:
        print(f"   ✅ Success rate acceptable")

    print()
    print("="*80)

    if test_passed:
        print("🎉 TEST PASSED - Employment income bug is FIXED!")
        print()
        print("✅ Employment income counted in ages 64-65 (before retirement)")
        print("✅ Employment stopped at age 66 (retirement age)")
        print("✅ Success rate > 90%")
        return 0
    else:
        print("❌ TEST FAILED - Bug may not be fully fixed")
        print()
        print("Expected behavior:")
        print("  - Ages 64-65: Tax > $50,000 (employment income)")
        print("  - Age 66: Tax ~$10,000 (employment stopped)")
        print("  - Success rate > 90%")
        return 1

if __name__ == "__main__":
    exit_code = test_daniel_gonzalez()
    sys.exit(exit_code)
