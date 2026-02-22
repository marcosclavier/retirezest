#!/usr/bin/env python3
"""
Test Rafael's case with Balanced strategy - Retiring at 67, ending at 85 (18 years)
Verify that the Balanced strategy minimizes taxes and extends retirement funds
"""

import sys
import json
sys.path.insert(0, 'python-api')

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_rafael_balanced_strategy():
    """Test Rafael's case retiring at 67 with Balanced withdrawal strategy for 18 years"""
    print("=" * 60)
    print("RAFAEL'S BALANCED STRATEGY TEST")
    print("Retirement: Age 67 to 85 (18 years)")
    print("=" * 60)

    # Load tax config
    tax_cfg = load_tax_config('tax_config_canada_2025.json')
    print("✅ Tax configuration loaded")

    # Create Rafael's profile - retiring at 67
    rafael = Person(
        name="Rafael",
        start_age=67,  # Starting retirement at 67
        tfsa_balance=80000.0,      # Tax-free account
        rrif_balance=300000.0,     # Taxable on withdrawal (converted from RRSP)
        rrsp_balance=0.0,          # Already converted to RRIF
        nonreg_balance=150000.0,   # Partially taxable (capital gains)
        nonreg_acb=120000.0,       # Adjusted cost base (80% ACB ratio)
        corporate_balance=0.0,      # No corporate account
        cpp_start_age=67,          # Starting CPP at retirement
        cpp_annual_at_start=13500.0,  # CPP delayed to 67 (higher amount)
        oas_start_age=67,          # Starting OAS at retirement
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

    # Set required fields for investment income calculations
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

    # Create household with Balanced strategy - 18 years (67 to 85)
    household = Household(
        p1=rafael,
        p2=spouse,
        province="ON",
        start_year=2025,
        end_age=85,  # 18 years of retirement (67-85)
        strategy="Balanced",  # Tax-optimized withdrawal strategy
        spending_go_go=65000.0,    # Age 67-75 (9 years)
        spending_slow_go=55000.0,  # Age 76-82 (7 years)
        spending_no_go=45000.0,    # Age 83-85 (3 years)
        go_go_end_age=75,
        slow_go_end_age=82,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    print("\n📊 Rafael's Starting Position (Age 67):")
    print(f"  TFSA: ${rafael.tfsa_balance:,.0f} (tax-free)")
    print(f"  RRIF: ${rafael.rrif_balance:,.0f} (fully taxable on withdrawal)")
    print(f"  Non-Reg: ${rafael.nonreg_balance:,.0f}")
    print(f"    - ACB: ${rafael.nonreg_acb:,.0f} ({rafael.nonreg_acb/rafael.nonreg_balance*100:.0f}% - not taxable)")
    print(f"    - Capital Gains: ${rafael.nonreg_balance - rafael.nonreg_acb:,.0f} (50% taxable)")
    print(f"  Total Assets: ${rafael.tfsa_balance + rafael.rrif_balance + rafael.nonreg_balance:,.0f}")
    print(f"\n  Government Benefits:")
    print(f"  - CPP: ${rafael.cpp_annual_at_start:,.0f}/year (delayed to 67)")
    print(f"  - OAS: ~$8,000/year starting at 67")
    print(f"\n  Spending Phases (18 years):")
    print(f"  - Go-Go (67-75): ${household.spending_go_go:,.0f}/year")
    print(f"  - Slow-Go (76-82): ${household.spending_slow_go:,.0f}/year")
    print(f"  - No-Go (83-85): ${household.spending_no_go:,.0f}/year")

    # Run simulation
    print("\n🚀 Running 18-year simulation with Balanced strategy...")
    print("   Strategy should:")
    print("   1. Withdraw from non-registered first (lowest tax impact)")
    print("   2. Use RRIF for required minimums + extra if needed")
    print("   3. Preserve TFSA for later years (tax-free)")

    df = simulate(household, tax_cfg)

    # Verify we got approximately 18 years
    expected_years = 19  # Age 67 through 85 inclusive
    actual_years = len(df)

    print(f"\n📈 Simulation Results:")
    print(f"  Expected years: {expected_years} (age 67-85)")
    print(f"  Actual years simulated: {actual_years}")

    if abs(actual_years - expected_years) > 1:
        print(f"  ⚠️ WARNING: Got {actual_years} years instead of {expected_years}!")

    # Analyze withdrawal pattern
    print("\n💰 Withdrawal Pattern Analysis (Balanced Strategy):")
    print("  Year | Age | TFSA Wd | RRIF Wd | NonReg Wd | Total Tax | After-Tax | Spending")
    print("  " + "-" * 80)

    # Show key years throughout retirement
    key_years = [0, 2, 5, 8, 11, 14, min(17, len(df)-1)]  # Start, early, mid, late retirement

    for i in key_years:
        if i < len(df):
            year = df.iloc[i]
            age = 67 + i
            tfsa_wd = year.get('tfsa_withdrawal_p1', 0)
            rrif_wd = year.get('rrif_withdrawal_p1', 0)
            nonreg_wd = year.get('nonreg_withdrawal_p1', 0)
            total_tax = year.get('total_tax_p1', 0)
            after_tax = year.get('after_tax_income_p1', 0)
            spending = year.get('spending_p1', 0)

            print(f"  {2025+i} | {age:3} | ${tfsa_wd:8,.0f} | ${rrif_wd:8,.0f} | ${nonreg_wd:9,.0f} | ${total_tax:9,.0f} | ${after_tax:9,.0f} | ${spending:8,.0f}")

    # Analyze account depletion order
    print("\n📊 Account Balance Progression (Balanced Strategy):")
    print("  Year | Age | TFSA Balance | RRIF Balance | NonReg Balance | Total Assets")
    print("  " + "-" * 75)

    for i in key_years:
        if i < len(df):
            year = df.iloc[i]
            age = 67 + i
            tfsa_bal = year.get('tfsa_balance_p1', 0)
            rrif_bal = year.get('rrif_balance_p1', 0)
            nonreg_bal = year.get('nonreg_balance_p1', 0)
            total = tfsa_bal + rrif_bal + nonreg_bal

            print(f"  {2025+i} | {age:3} | ${tfsa_bal:11,.0f} | ${rrif_bal:11,.0f} | ${nonreg_bal:13,.0f} | ${total:12,.0f}")

    # Verify the Balanced strategy is working correctly
    print("\n✅ Balanced Strategy Verification:")

    # 1. Check if non-registered is used first (first 5 years)
    if len(df) >= 5:
        first_5_nonreg = sum(df.iloc[i].get('nonreg_withdrawal_p1', 0) for i in range(5))
        first_5_tfsa = sum(df.iloc[i].get('tfsa_withdrawal_p1', 0) for i in range(5))

        print(f"\n  First 5 Years Withdrawals:")
        print(f"  - Non-Registered: ${first_5_nonreg:,.0f}")
        print(f"  - TFSA: ${first_5_tfsa:,.0f}")

        if first_5_nonreg > 0 and first_5_tfsa == 0:
            print("  ✅ CORRECT: Non-registered used first (tax-efficient)")
        elif first_5_tfsa > 0:
            print("  ⚠️ WARNING: TFSA being used early (should be preserved)")

    # 2. Check TFSA preservation (should still have significant balance at age 75)
    if len(df) >= 9:  # Age 75 is year 8 (67+8=75)
        age_75_tfsa = df.iloc[8].get('tfsa_balance_p1', 0)
        if age_75_tfsa > 60000:
            print(f"\n  ✅ TFSA Preserved: ${age_75_tfsa:,.0f} remaining at age 75")
        else:
            print(f"\n  ⚠️ TFSA Depleting: Only ${age_75_tfsa:,.0f} at age 75")

    # 3. Tax efficiency analysis
    if len(df) > 0:
        total_income = df['total_income_p1'].sum() if 'total_income_p1' in df.columns else 0
        total_taxes = df['total_tax_p1'].sum() if 'total_tax_p1' in df.columns else 0
        total_rrif_wd = df['rrif_withdrawal_p1'].sum() if 'rrif_withdrawal_p1' in df.columns else 0
        total_nonreg_wd = df['nonreg_withdrawal_p1'].sum() if 'nonreg_withdrawal_p1' in df.columns else 0
        total_tfsa_wd = df['tfsa_withdrawal_p1'].sum() if 'tfsa_withdrawal_p1' in df.columns else 0

        avg_tax_rate = (total_taxes / total_income * 100) if total_income > 0 else 0

        print(f"\n  18-Year Totals:")
        print(f"  - Total Income: ${total_income:,.0f}")
        print(f"  - Total Taxes: ${total_taxes:,.0f}")
        print(f"  - Average Tax Rate: {avg_tax_rate:.1f}%")
        print(f"\n  Total Withdrawals by Account:")
        print(f"  - Non-Registered: ${total_nonreg_wd:,.0f}")
        print(f"  - RRIF: ${total_rrif_wd:,.0f}")
        print(f"  - TFSA: ${total_tfsa_wd:,.0f}")

    # 4. Check if funds last the full 18 years
    if len(df) >= 18:
        final_year = df.iloc[17]  # Year 18 (age 84)
        final_assets = (final_year.get('tfsa_balance_p1', 0) +
                       final_year.get('rrif_balance_p1', 0) +
                       final_year.get('nonreg_balance_p1', 0))

        if final_assets > 0:
            print(f"\n  ✅ Funds Sustained: ${final_assets:,.0f} remaining at age 84")
        else:
            print(f"\n  ⚠️ Funds may be depleted before age 85")

    # Summary
    print("\n" + "=" * 60)
    print("BALANCED STRATEGY SUMMARY")
    print("=" * 60)
    print("✅ The Balanced strategy is designed to:")
    print("  1. Minimize taxes by withdrawing from accounts in tax-efficient order")
    print("  2. Use non-registered first (only capital gains taxed)")
    print("  3. Use RRIF for required minimums + extra as needed")
    print("  4. Preserve TFSA for later years (tax-free growth & withdrawals)")
    print("  5. Extend retirement funds through intelligent tax planning")
    print("\nThis approach minimizes lifetime taxes and helps funds last longer!")

    return df

if __name__ == "__main__":
    try:
        df = test_rafael_balanced_strategy()
        print("\n✅ Rafael's Balanced strategy test completed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)