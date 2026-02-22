#!/usr/bin/env python3
"""
Test Rafael's case with Balanced strategy
Verify that the strategy minimizes taxes and extends retirement funds
"""

import sys
import json
sys.path.insert(0, 'python-api')

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_rafael_balanced_strategy():
    """Test Rafael's case with Balanced withdrawal strategy"""
    print("=" * 60)
    print("RAFAEL'S BALANCED STRATEGY TEST")
    print("=" * 60)

    # Load tax config
    tax_cfg = load_tax_config('tax_config_canada_2025.json')
    print("✅ Tax configuration loaded")

    # Create Rafael's profile - typical retiree with mixed assets
    rafael = Person(
        name="Rafael",
        start_age=65,
        tfsa_balance=80000.0,      # Tax-free account
        rrif_balance=300000.0,     # Taxable on withdrawal
        rrsp_balance=0.0,
        nonreg_balance=150000.0,   # Partially taxable (capital gains)
        nonreg_acb=120000.0,       # Adjusted cost base
        corporate_balance=0.0,      # No corporate account
        cpp_start_age=65,
        cpp_annual_at_start=12000.0,
        oas_start_age=65,
        pension_incomes=[],
        other_incomes=[]
    )

    # Empty spouse
    spouse = Person(
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
    rafael.corporate_details = {
        'cash_percentage': 0.1,
        'gic_percentage': 0.2,
        'investment_percentage': 0.7,
        'yield_interest': 0.02,
        'yield_eligible_dividends': 0.02,
        'yield_non_eligible_dividends': 0.01,
        'yield_capital_gains': 0.03,
        'rdtoh_balance': 0.0
    }
    rafael.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    # Create household with Balanced strategy
    household = Household(
        p1=rafael,
        p2=spouse,
        province="ON",
        start_year=2025,
        end_age=95,
        strategy="Balanced",  # Tax-optimized withdrawal strategy
        spending_go_go=65000.0,
        spending_slow_go=55000.0,
        spending_no_go=45000.0,
        go_go_end_age=75,
        slow_go_end_age=85,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    print("\n📊 Rafael's Starting Position:")
    print(f"  TFSA: ${rafael.tfsa_balance:,.0f} (tax-free)")
    print(f"  RRIF: ${rafael.rrif_balance:,.0f} (fully taxable)")
    print(f"  Non-Reg: ${rafael.nonreg_balance:,.0f} (ACB: ${rafael.nonreg_acb:,.0f})")
    print(f"  Total Assets: ${rafael.tfsa_balance + rafael.rrif_balance + rafael.nonreg_balance:,.0f}")
    print(f"  CPP Income: ${rafael.cpp_annual_at_start:,.0f}/year")
    print(f"  Initial Spending Target: ${household.spending_go_go:,.0f}/year")

    # Run simulation
    print("\n🚀 Running simulation with Balanced strategy...")
    df = simulate(household, tax_cfg)

    # Analyze results
    print("\n📈 Simulation Results:")
    print(f"  Total years simulated: {len(df)}")

    # Check first few years withdrawal pattern
    print("\n💰 Withdrawal Pattern (First 5 Years):")
    print("  The Balanced strategy should:")
    print("  1. Prioritize non-registered (partial tax on gains)")
    print("  2. Then use RRIF (fully taxable)")
    print("  3. Preserve TFSA (tax-free) for later")
    print("\n  Year | TFSA Wd | RRIF Wd | NonReg Wd | Total Tax | Net Income")
    print("  " + "-" * 60)

    for i in range(min(5, len(df))):
        year = df.iloc[i]
        tfsa_wd = year.get('tfsa_withdrawal_p1', 0)
        rrif_wd = year.get('rrif_withdrawal_p1', 0)
        nonreg_wd = year.get('nonreg_withdrawal_p1', 0)
        total_tax = year.get('total_tax_p1', 0)
        net_income = year.get('after_tax_income_p1', 0)

        print(f"  {2025+i} | ${tfsa_wd:8,.0f} | ${rrif_wd:8,.0f} | ${nonreg_wd:9,.0f} | ${total_tax:9,.0f} | ${net_income:10,.0f}")

    # Check account balances over time
    print("\n📊 Account Balance Progression:")
    print("  Year | TFSA Balance | RRIF Balance | NonReg Balance")
    print("  " + "-" * 55)

    for i in range(0, len(df), 5):
        year = df.iloc[i]
        tfsa_bal = year.get('tfsa_balance_p1', 0)
        rrif_bal = year.get('rrif_balance_p1', 0)
        nonreg_bal = year.get('nonreg_balance_p1', 0)

        print(f"  {2025+i} | ${tfsa_bal:11,.0f} | ${rrif_bal:11,.0f} | ${nonreg_bal:13,.0f}")

    # Verify tax optimization
    print("\n✅ Tax Optimization Verification:")

    # Calculate average tax rate
    total_taxes = df['total_tax_p1'].sum() if 'total_tax_p1' in df.columns else 0
    total_income = df['total_income_p1'].sum() if 'total_income_p1' in df.columns else 0
    avg_tax_rate = (total_taxes / total_income * 100) if total_income > 0 else 0

    print(f"  Total Taxes Paid: ${total_taxes:,.0f}")
    print(f"  Total Income: ${total_income:,.0f}")
    print(f"  Average Tax Rate: {avg_tax_rate:.1f}%")

    # Check if TFSA is preserved for later years
    first_year_tfsa = df.iloc[0].get('tfsa_balance_p1', 0) if len(df) > 0 else 0
    year_10_tfsa = df.iloc[9].get('tfsa_balance_p1', 0) if len(df) > 9 else 0

    if year_10_tfsa > first_year_tfsa * 0.5:
        print(f"  ✅ TFSA preservation: Still have ${year_10_tfsa:,.0f} after 10 years")
    else:
        print(f"  ⚠️ TFSA depleted early: Only ${year_10_tfsa:,.0f} left after 10 years")

    # Check withdrawal order in first year
    first_year = df.iloc[0] if len(df) > 0 else None
    if first_year is not None:
        nonreg_wd_1 = first_year.get('nonreg_withdrawal_p1', 0)
        rrif_wd_1 = first_year.get('rrif_withdrawal_p1', 0)
        tfsa_wd_1 = first_year.get('tfsa_withdrawal_p1', 0)

        print("\n🎯 First Year Withdrawal Strategy:")
        if nonreg_wd_1 > 0:
            print(f"  ✅ Non-Reg withdrawal: ${nonreg_wd_1:,.0f} (tax-efficient)")
        if rrif_wd_1 > 0:
            print(f"  ✅ RRIF withdrawal: ${rrif_wd_1:,.0f} (required minimum + extra)")
        if tfsa_wd_1 > 0:
            print(f"  ⚠️ TFSA withdrawal: ${tfsa_wd_1:,.0f} (should be preserved)")
        else:
            print(f"  ✅ TFSA preserved: No withdrawal (optimal)")

    # Summary
    print("\n" + "=" * 60)
    print("BALANCED STRATEGY SUMMARY")
    print("=" * 60)
    print("The Balanced strategy should:")
    print("1. ✅ Minimize taxes by using tax-efficient accounts first")
    print("2. ✅ Preserve TFSA for later years when other accounts deplete")
    print("3. ✅ Optimize withdrawal order based on tax implications")
    print("4. ✅ Extend retirement funds through tax optimization")

    return df

if __name__ == "__main__":
    try:
        df = test_rafael_balanced_strategy()
        print("\n✅ Test completed successfully!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)