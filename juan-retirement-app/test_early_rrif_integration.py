#!/usr/bin/env python3
"""
Integration test for Early RRIF Withdrawal feature.
Tests the user's reported scenario: $5,000/month ($60,000/year) from age 60-66.
"""

import sys
import json
from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_early_rrif_fixed_amount():
    """Test fixed amount early RRIF withdrawals ($60,000/year from age 60-66)."""
    print("\n" + "="*80)
    print("TEST: Early RRIF Fixed Amount ($60,000/year from age 60-66)")
    print("="*80)

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create person with early RRIF settings
    p1 = Person(
        name="Test User",
        start_age=60,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        tfsa_balance=100000,
        rrsp_balance=500000,  # Will convert to RRIF at 71
        rrif_balance=0,
        nonreg_balance=200000,
        nonreg_acb=150000,
        corporate_balance=0,

        # Early RRIF withdrawal settings
        enable_early_rrif_withdrawal=True,
        early_rrif_withdrawal_start_age=60,
        early_rrif_withdrawal_end_age=66,
        early_rrif_withdrawal_annual=60000,  # $60k/year = $5k/month
        early_rrif_withdrawal_mode="fixed",
    )

    p2 = Person(name="", start_age=60)  # Dummy person

    hh = Household(
        p1=p1,
        p2=p2,
        province="ON",
        start_year=2025,
        end_age=75,  # Run for 16 years
        strategy="minimize-income",
        spending_go_go=50000,
        go_go_end_age=75,
        spending_slow_go=50000,
        slow_go_end_age=85,
        spending_no_go=40000,
    )

    try:
        # simulate returns a DataFrame
        df = simulate(hh, tax_cfg)

        print("\n✅ Simulation completed successfully!")
        print(f"   Total years simulated: {len(df)}")

        # Check RRIF withdrawals from age 60-66
        print("\n📊 RRIF Withdrawals by Age:")
        print("-" * 80)
        print(f"{'Age':>4} | {'Year':>6} | {'RRIF Withdrawal':>18} | {'Total Tax':>12} | {'Status':>20}")
        print("-" * 80)

        success = True
        for _, row in df.iterrows():
            # Use per-person column names (p1 is the test user)
            age = int(row.get('age_p1', 0))
            year = int(row.get('year', 0))
            rrif_wd = row.get('withdraw_rrif_p1', 0)
            total_tax = row.get('total_tax_p1', 0)

            # Determine status
            if age < 60:
                status = "Before early RRIF"
            elif 60 <= age <= 66:
                status = "✓ Early RRIF active"
                # Verify withdrawal amount (should be ~$60,000)
                if abs(rrif_wd - 60000) < 5000:  # Allow some tolerance for taxes/growth
                    status += " ✓"
                elif rrif_wd > 0:
                    status += f" ⚠️ (expected ~$60k, got ${rrif_wd:,.0f})"
                    success = False
                else:
                    status += " ❌ NO WITHDRAWAL"
                    success = False
            elif age < 71:
                status = "After early RRIF"
                # Should have no withdrawals in this period (or only standard minimums)
                if rrif_wd > 1000:  # Some small amount might be standard minimum
                    status += f" (${rrif_wd:,.0f})"
            else:
                status = "Standard RRIF min"

            print(f"{age:>4} | {year:>6} | ${rrif_wd:>16,.0f} | ${total_tax:>10,.0f} | {status}")

        print("\n" + "="*80)
        if success:
            print("✅ TEST PASSED: Early RRIF withdrawals working correctly!")
        else:
            print("❌ TEST FAILED: Early RRIF withdrawals not working as expected")
        print("="*80)

        return success

    except Exception as e:
        print(f"\n❌ TEST FAILED with exception:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "="*80)
    print("EARLY RRIF WITHDRAWAL INTEGRATION TESTS")
    print("="*80)

    test1_passed = test_early_rrif_fixed_amount()

    if test1_passed:
        print("\n🎉 TEST PASSED!")
        sys.exit(0)
    else:
        print("\n❌ TEST FAILED")
        sys.exit(1)
