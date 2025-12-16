"""
Test Withdrawal Priority Fix - Verify spending is prioritized over legacy preservation.

This script tests that:
1. TFSA is used to fund spending shortfalls
2. Spending requirement is met before preserving legacy
3. System withdraws from all available accounts when needed
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from modules.models import Person, Household
from modules.simulation import simulate
import pandas as pd

def test_withdrawal_priority():
    """
    Test case simulating year 2039 scenario:
    - High spending target ($151,259)
    - Government benefits ($28,765)
    - Need to withdraw ~$123K to meet spending
    - Verify TFSA is used when other accounts insufficient
    """

    print("=" * 80)
    print("WITHDRAWAL PRIORITY FIX - TEST")
    print("=" * 80)
    print("\nScenario: High spending with modest account balances")
    print("Expected: System should tap TFSA to meet spending requirement\n")

    # Create test household - similar to user's scenario
    # Ages set to match year 2039 scenario (age ~74)
    p1 = Person(
        name="Person1",
        start_age=74,

        # Government benefits (matching user's data)
        cpp_amount=15000,
        cpp_start_age=65,
        oas_amount=8000,
        oas_start_age=65,

        # Account balances - intentionally modest to create shortfall
        # Total: $200K across all accounts
        rrif_balance=60000,   # RRIF
        tfsa_balance=80000,   # TFSA (should be used if needed!)
        nonreg_balance=40000,  # NonReg
        nonreg_acb=32000,      # ACB = 80% of balance
        corporate_balance=20000,  # Corp

        # NonReg bucket allocation
        nr_cash=4000,
        nr_gic=8000,
        nr_invest=28000,

        # Corporate bucket allocation
        corp_cash_bucket=1000,
        corp_gic_bucket=2000,
        corp_invest_bucket=17000,

        # TFSA contribution room
        tfsa_room_start=10000,

        # Returns
        yield_cash=0.03,
        yield_gic=0.04,
        yield_stocks=0.06,
    )

    p2 = Person(
        name="Person2",
        start_age=74,

        # Government benefits
        cpp_amount=13765,
        cpp_start_age=65,
        oas_amount=8000,
        oas_start_age=65,

        # Modest balances
        rrif_balance=40000,
        tfsa_balance=60000,  # Should be used if needed!
        nonreg_balance=30000,
        nonreg_acb=24000,
        corporate_balance=10000,

        nr_cash=3000,
        nr_gic=6000,
        nr_invest=21000,

        corp_cash_bucket=500,
        corp_gic_bucket=1000,
        corp_invest_bucket=8500,

        tfsa_room_start=10000,

        yield_cash=0.03,
        yield_gic=0.04,
        yield_stocks=0.06,
    )

    # Household with HIGH spending requirement
    hh = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=95,

        # HIGH SPENDING: $151,259 (matching user's scenario)
        # This intentionally creates a shortfall to test TFSA usage
        spending_annual=151259,

        # Withdrawal strategy: NonReg -> RRIF -> Corp -> TFSA
        withdrawal_strategy="NonReg->RRIF->Corp->TFSA",

        # Returns
        ret_stocks=0.06,
        ret_bonds=0.04,
        ret_cash=0.03,

        # Inflation
        general_inflation=0.025,

        # No reinvestment to keep it simple
        reinvest_nonreg_dist=False,

        # Simulation control
        gap_tolerance=5000,  # $5K tolerance
        stop_on_fail=False,  # Continue even if underfunded
    )

    print(f"Starting Balances:")
    print(f"  Person 1:")
    print(f"    RRIF: ${p1.rrif_balance:,.0f}")
    print(f"    TFSA: ${p1.tfsa_balance:,.0f}")
    print(f"    NonReg: ${p1.nonreg_balance:,.0f}")
    print(f"    Corp: ${p1.corporate_balance:,.0f}")
    print(f"    Total: ${p1.rrif_balance + p1.tfsa_balance + p1.nonreg_balance + p1.corporate_balance:,.0f}")
    print(f"\n  Person 2:")
    print(f"    RRIF: ${p2.rrif_balance:,.0f}")
    print(f"    TFSA: ${p2.tfsa_balance:,.0f}")
    print(f"    NonReg: ${p2.nonreg_balance:,.0f}")
    print(f"    Corp: ${p2.corporate_balance:,.0f}")
    print(f"    Total: ${p2.rrif_balance + p2.tfsa_balance + p2.nonreg_balance + p2.corporate_balance:,.0f}")

    total_assets = (p1.rrif_balance + p1.tfsa_balance + p1.nonreg_balance + p1.corporate_balance +
                   p2.rrif_balance + p2.tfsa_balance + p2.nonreg_balance + p2.corporate_balance)
    print(f"\n  Household Total: ${total_assets:,.0f}")

    # Run simulation for first year only
    print(f"\n{'─' * 80}")
    print(f"Running Simulation...")
    print(f"  Spending Target: ${hh.spending_annual:,.0f}")
    print(f"  Strategy: {hh.withdrawal_strategy}")
    print(f"{'─' * 80}\n")

    df = simulate(hh)

    if df is None or df.empty:
        print("❌ ERROR: Simulation returned no data")
        return

    # Analyze first year results
    first_year = df.iloc[0]

    print("\n" + "=" * 80)
    print("RESULTS - Year 1 (Test Year)")
    print("=" * 80)

    # Government Benefits
    gov_benefits = (
        first_year.get('cpp_p1', 0) + first_year.get('cpp_p2', 0) +
        first_year.get('oas_p1', 0) + first_year.get('oas_p2', 0) +
        first_year.get('gis_p1', 0) + first_year.get('gis_p2', 0)
    )

    print(f"\nGovernment Benefits:")
    print(f"  CPP P1: ${first_year.get('cpp_p1', 0):,.0f}")
    print(f"  CPP P2: ${first_year.get('cpp_p2', 0):,.0f}")
    print(f"  OAS P1: ${first_year.get('oas_p1', 0):,.0f}")
    print(f"  OAS P2: ${first_year.get('oas_p2', 0):,.0f}")
    print(f"  GIS P1: ${first_year.get('gis_p1', 0):,.0f}")
    print(f"  GIS P2: ${first_year.get('gis_p2', 0):,.0f}")
    print(f"  Total: ${gov_benefits:,.0f}")

    # Withdrawals
    print(f"\nAccount Withdrawals:")

    # Person 1
    rrif_w1 = first_year.get('withdraw_rrif_p1', 0)
    tfsa_w1 = first_year.get('withdraw_tfsa_p1', 0)
    nonreg_w1 = first_year.get('withdraw_nonreg_p1', 0)
    corp_w1 = first_year.get('withdraw_corp_p1', 0)

    print(f"  Person 1:")
    print(f"    RRIF: ${rrif_w1:,.0f}")
    print(f"    TFSA: ${tfsa_w1:,.0f} {'✅ USED!' if tfsa_w1 > 100 else '❌ NOT USED'}")
    print(f"    NonReg: ${nonreg_w1:,.0f}")
    print(f"    Corp: ${corp_w1:,.0f}")
    print(f"    Subtotal: ${rrif_w1 + tfsa_w1 + nonreg_w1 + corp_w1:,.0f}")

    # Person 2
    rrif_w2 = first_year.get('withdraw_rrif_p2', 0)
    tfsa_w2 = first_year.get('withdraw_tfsa_p2', 0)
    nonreg_w2 = first_year.get('withdraw_nonreg_p2', 0)
    corp_w2 = first_year.get('withdraw_corp_p2', 0)

    print(f"  Person 2:")
    print(f"    RRIF: ${rrif_w2:,.0f}")
    print(f"    TFSA: ${tfsa_w2:,.0f} {'✅ USED!' if tfsa_w2 > 100 else '❌ NOT USED'}")
    print(f"    NonReg: ${nonreg_w2:,.0f}")
    print(f"    Corp: ${corp_w2:,.0f}")
    print(f"    Subtotal: ${rrif_w2 + tfsa_w2 + nonreg_w2 + corp_w2:,.0f}")

    total_withdrawals = (rrif_w1 + tfsa_w1 + nonreg_w1 + corp_w1 +
                        rrif_w2 + tfsa_w2 + nonreg_w2 + corp_w2)

    print(f"\n  Total Withdrawals: ${total_withdrawals:,.0f}")

    # Taxes
    total_tax = first_year.get('total_tax_after_split', first_year.get('total_tax', 0))
    print(f"\nTaxes Paid: ${total_tax:,.0f}")

    # Spending calculation
    spending_target = first_year.get('spend_target_after_tax', hh.spending_annual)
    spending_met = gov_benefits + total_withdrawals - total_tax
    spending_gap = max(0, spending_target - spending_met)

    print(f"\n{'─' * 80}")
    print("SPENDING ANALYSIS:")
    print(f"{'─' * 80}")
    print(f"  Spending Target: ${spending_target:,.0f}")
    print(f"  Government Benefits: ${gov_benefits:,.0f}")
    print(f"  Account Withdrawals: ${total_withdrawals:,.0f}")
    print(f"  Taxes Paid: -${total_tax:,.0f}")
    print(f"  ────────────────────────────")
    print(f"  Spending Met: ${spending_met:,.0f}")
    print(f"  Spending Gap: ${spending_gap:,.0f}")

    # Test Results
    print(f"\n{'=' * 80}")
    print("TEST RESULTS:")
    print(f"{'=' * 80}")

    tfsa_total = tfsa_w1 + tfsa_w2
    coverage_pct = (spending_met / spending_target) * 100 if spending_target > 0 else 0

    tests_passed = 0
    tests_total = 4

    # Test 1: TFSA was used
    test1 = tfsa_total > 100
    print(f"\n✅ Test 1: TFSA Used for Spending" if test1 else f"\n❌ Test 1: TFSA Used for Spending")
    print(f"  Expected: TFSA withdrawal > $100")
    print(f"  Actual: ${tfsa_total:,.0f}")
    if test1:
        tests_passed += 1

    # Test 2: Spending gap is minimal (< $10K or < 10%)
    test2 = spending_gap < 10000 or coverage_pct > 90
    print(f"\n✅ Test 2: Spending Requirement Met" if test2 else f"\n❌ Test 2: Spending Requirement Met")
    print(f"  Expected: Gap < $10K or Coverage > 90%")
    print(f"  Actual: Gap = ${spending_gap:,.0f}, Coverage = {coverage_pct:.1f}%")
    if test2:
        tests_passed += 1

    # Test 3: Total withdrawals are substantial (attempting to meet spending)
    expected_withdrawals = spending_target - gov_benefits + total_tax
    withdrawal_effort_pct = (total_withdrawals / expected_withdrawals) * 100 if expected_withdrawals > 0 else 0
    test3 = withdrawal_effort_pct > 80
    print(f"\n✅ Test 3: System Attempted Full Withdrawal" if test3 else f"\n❌ Test 3: System Attempted Full Withdrawal")
    print(f"  Expected: Withdrawal effort > 80%")
    print(f"  Actual: {withdrawal_effort_pct:.1f}% (${total_withdrawals:,.0f} of ${expected_withdrawals:,.0f} needed)")
    if test3:
        tests_passed += 1

    # Test 4: Non-TFSA accounts were depleted or heavily used first
    non_tfsa_withdrawals = total_withdrawals - tfsa_total
    test4 = non_tfsa_withdrawals > tfsa_total or (p1.rrif_balance + p2.rrif_balance +
                                                   p1.nonreg_balance + p2.nonreg_balance +
                                                   p1.corporate_balance + p2.corporate_balance) < 10000
    print(f"\n✅ Test 4: Strategy Order Followed" if test4 else f"\n❌ Test 4: Strategy Order Followed")
    print(f"  Expected: Non-TFSA withdrawn first, or Non-TFSA depleted")
    print(f"  Actual: Non-TFSA withdrawals = ${non_tfsa_withdrawals:,.0f}, TFSA = ${tfsa_total:,.0f}")
    if test4:
        tests_passed += 1

    # Final Summary
    print(f"\n{'=' * 80}")
    print(f"FINAL SUMMARY: {tests_passed}/{tests_total} tests passed")
    print(f"{'=' * 80}")

    if tests_passed == tests_total:
        print("\n🎉 SUCCESS! Withdrawal priority fix is working correctly!")
        print("   - TFSA is being used to fund spending shortfalls")
        print("   - Spending requirement is prioritized over legacy preservation")
        print("   - System withdraws from all available accounts when needed")
    elif tests_passed >= 2:
        print("\n⚠️  PARTIAL SUCCESS - Fix is working but needs refinement")
        print("   Some tests failed. Review the results above.")
    else:
        print("\n❌ FAILURE - Fix is not working as expected")
        print("   Multiple tests failed. Review the implementation.")

    print(f"\n{'=' * 80}\n")

    return df

if __name__ == "__main__":
    test_withdrawal_priority()
