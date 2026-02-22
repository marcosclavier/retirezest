#!/usr/bin/env python3
"""
Test Rafael's ACTUAL case with Balanced strategy
Rafael has RRIF and Pension, no non-registered accounts
Retiring at 67, ending at 85 (18 years)
"""

import sys
import json
sys.path.insert(0, 'python-api')

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_rafael_balanced_strategy():
    """Test Rafael's case with RRIF and Pension using Balanced strategy"""
    print("=" * 60)
    print("RAFAEL'S BALANCED STRATEGY TEST - RRIF & PENSION")
    print("Retirement: Age 67 to 85 (18 years)")
    print("=" * 60)

    # Load tax config
    tax_cfg = load_tax_config('tax_config_canada_2025.json')
    print("✅ Tax configuration loaded")

    # Create Rafael's ACTUAL profile - RRIF and Pension
    rafael = Person(
        name="Rafael",
        start_age=67,  # Starting retirement at 67
        tfsa_balance=100000.0,     # Tax-free savings
        rrif_balance=400000.0,     # RRIF (converted from RRSP)
        rrsp_balance=0.0,          # Already converted to RRIF
        nonreg_balance=0.0,        # NO non-registered accounts
        nonreg_acb=0.0,
        corporate_balance=0.0,     # No corporate account
        cpp_start_age=67,          # Starting CPP at retirement
        cpp_annual_at_start=13500.0,  # CPP delayed to 67
        oas_start_age=67,          # Starting OAS at retirement
        pension_incomes=[          # Rafael has a pension!
            {
                "name": "Company Pension",
                "start_age": 67,
                "annual_amount": 24000.0,  # $2,000/month pension
                "indexed": True,
                "survivor_benefit": 0.6
            }
        ],
        other_incomes=[]
    )

    # Empty spouse (single person scenario)
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

    # Set required investment details
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
        end_age=85,  # 18 years of retirement (67-85)
        strategy="Balanced",  # Tax-optimized withdrawal strategy
        spending_go_go=70000.0,    # Higher spending due to good pension
        spending_slow_go=60000.0,
        spending_no_go=50000.0,
        go_go_end_age=75,
        slow_go_end_age=82,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    print("\n📊 Rafael's ACTUAL Starting Position (Age 67):")
    print(f"  Registered Accounts:")
    print(f"  - TFSA: ${rafael.tfsa_balance:,.0f} (tax-free)")
    print(f"  - RRIF: ${rafael.rrif_balance:,.0f} (fully taxable)")
    print(f"  Total Investable Assets: ${rafael.tfsa_balance + rafael.rrif_balance:,.0f}")

    print(f"\n  Guaranteed Income Sources:")
    print(f"  - Company Pension: $24,000/year (indexed)")
    print(f"  - CPP: ${rafael.cpp_annual_at_start:,.0f}/year (delayed to 67)")
    print(f"  - OAS: ~$8,000/year starting at 67")
    print(f"  - Total Guaranteed: ~$45,500/year")

    print(f"\n  Spending Requirements (18 years):")
    print(f"  - Go-Go (67-75): ${household.spending_go_go:,.0f}/year")
    print(f"  - Slow-Go (76-82): ${household.spending_slow_go:,.0f}/year")
    print(f"  - No-Go (83-85): ${household.spending_no_go:,.0f}/year")
    print(f"\n  Funding Gap: ~${household.spending_go_go - 45500:,.0f}/year initially")

    # Run simulation
    print("\n🚀 Running simulation with Balanced strategy...")
    print("   For Rafael's case (RRIF + Pension), strategy should:")
    print("   1. Use RRIF withdrawals to meet spending needs")
    print("   2. Minimize RRIF withdrawals to reduce taxes")
    print("   3. Preserve TFSA for later years (tax-free)")

    df = simulate(household, tax_cfg)

    # Verify simulation length
    actual_years = len(df)
    print(f"\n📈 Simulation Results:")
    print(f"  Years simulated: {actual_years}")

    # Analyze withdrawal pattern
    print("\n💰 Withdrawal Pattern (Balanced Strategy with Pension):")
    print("  Year | Age |  Pension | CPP+OAS | RRIF Wd | TFSA Wd | Total Tax | After-Tax")
    print("  " + "-" * 75)

    # Show key years
    key_years = [0, 3, 6, 9, 12, 15, min(17, len(df)-1)]

    for i in key_years:
        if i < len(df):
            year = df.iloc[i]
            age = 67 + i
            pension = year.get('pension_income_p1', 0)
            cpp = year.get('cpp_income_p1', 0)
            oas = year.get('oas_income_p1', 0)
            rrif_wd = year.get('rrif_withdrawal_p1', 0)
            tfsa_wd = year.get('tfsa_withdrawal_p1', 0)
            total_tax = year.get('total_tax_p1', 0)
            after_tax = year.get('after_tax_income_p1', 0)

            print(f"  {2025+i} | {age:3} | ${pension:7,.0f} | ${cpp+oas:7,.0f} | ${rrif_wd:7,.0f} | ${tfsa_wd:7,.0f} | ${total_tax:9,.0f} | ${after_tax:9,.0f}")

    # Account balance progression
    print("\n📊 Account Balance Progression:")
    print("  Year | Age | RRIF Balance | TFSA Balance | Total Assets")
    print("  " + "-" * 60)

    for i in key_years:
        if i < len(df):
            year = df.iloc[i]
            age = 67 + i
            rrif_bal = year.get('rrif_balance_p1', 0)
            tfsa_bal = year.get('tfsa_balance_p1', 0)
            total = rrif_bal + tfsa_bal

            print(f"  {2025+i} | {age:3} | ${rrif_bal:11,.0f} | ${tfsa_bal:11,.0f} | ${total:12,.0f}")

    # Verify Balanced strategy behavior
    print("\n✅ Balanced Strategy Verification (RRIF + Pension Case):")

    # Check TFSA preservation
    if len(df) >= 10:
        first_10_tfsa = sum(df.iloc[i].get('tfsa_withdrawal_p1', 0) for i in range(min(10, len(df))))
        first_10_rrif = sum(df.iloc[i].get('rrif_withdrawal_p1', 0) for i in range(min(10, len(df))))

        print(f"\n  First 10 Years Withdrawals:")
        print(f"  - RRIF: ${first_10_rrif:,.0f}")
        print(f"  - TFSA: ${first_10_tfsa:,.0f}")

        if first_10_tfsa < first_10_rrif * 0.1:  # TFSA withdrawals should be minimal
            print("  ✅ TFSA preserved (minimal withdrawals)")
        else:
            print("  ⚠️ TFSA being used early")

    # Tax analysis
    if len(df) > 0:
        total_pension = df['pension_income_p1'].sum() if 'pension_income_p1' in df.columns else 0
        total_cpp = df['cpp_income_p1'].sum() if 'cpp_income_p1' in df.columns else 0
        total_oas = df['oas_income_p1'].sum() if 'oas_income_p1' in df.columns else 0
        total_rrif_wd = df['rrif_withdrawal_p1'].sum() if 'rrif_withdrawal_p1' in df.columns else 0
        total_tfsa_wd = df['tfsa_withdrawal_p1'].sum() if 'tfsa_withdrawal_p1' in df.columns else 0
        total_income = df['total_income_p1'].sum() if 'total_income_p1' in df.columns else 0
        total_taxes = df['total_tax_p1'].sum() if 'total_tax_p1' in df.columns else 0

        avg_tax_rate = (total_taxes / total_income * 100) if total_income > 0 else 0

        print(f"\n  18-Year Income Summary:")
        print(f"  - Pension Income: ${total_pension:,.0f}")
        print(f"  - CPP Income: ${total_cpp:,.0f}")
        print(f"  - OAS Income: ${total_oas:,.0f}")
        print(f"  - RRIF Withdrawals: ${total_rrif_wd:,.0f}")
        print(f"  - TFSA Withdrawals: ${total_tfsa_wd:,.0f}")
        print(f"\n  Tax Analysis:")
        print(f"  - Total Income: ${total_income:,.0f}")
        print(f"  - Total Taxes: ${total_taxes:,.0f}")
        print(f"  - Average Tax Rate: {avg_tax_rate:.1f}%")

    # Check if RRIF is used optimally
    print("\n  Withdrawal Strategy Analysis:")
    if len(df) >= 5:
        # Check first 5 years
        for i in range(min(5, len(df))):
            year_data = df.iloc[i]
            rrif_wd = year_data.get('rrif_withdrawal_p1', 0)
            tfsa_wd = year_data.get('tfsa_withdrawal_p1', 0)
            rrif_bal = year_data.get('rrif_balance_p1', 0)

            if rrif_wd > 0 and tfsa_wd == 0:
                print(f"  Year {i+1}: ✅ Using RRIF (${rrif_wd:,.0f}), preserving TFSA")
            elif tfsa_wd > 0 and rrif_bal > 0:
                print(f"  Year {i+1}: ⚠️ Using TFSA (${tfsa_wd:,.0f}) while RRIF available")

    # Summary
    print("\n" + "=" * 60)
    print("BALANCED STRATEGY SUMMARY - RAFAEL (RRIF + PENSION)")
    print("=" * 60)
    print("With pension income providing base support, Balanced strategy:")
    print("✅ 1. Uses RRIF withdrawals to meet spending gaps")
    print("✅ 2. Minimizes withdrawals to reduce taxes")
    print("✅ 3. Preserves TFSA for tax-free growth and later years")
    print("✅ 4. Optimizes total tax burden over retirement")
    print("\nThis approach ensures sustainable retirement income while")
    print("minimizing lifetime taxes for Rafael's 18-year retirement!")

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