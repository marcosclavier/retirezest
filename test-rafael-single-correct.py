#!/usr/bin/env python3
"""
Test Rafael's ACTUAL case - Single person with RRIF and Pension
Rafael is SINGLE, retiring at 67 to 85 (18 years)
"""

import sys
sys.path.insert(0, 'python-api')

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def test_rafael_single():
    """Test Rafael as a single person with correct p2=None"""
    print("=" * 60)
    print("RAFAEL'S SINGLE PERSON TEST - BALANCED STRATEGY")
    print("Retirement: Age 67 to 85 (18 years)")
    print("=" * 60)

    # Load tax config
    tax_cfg = load_tax_config('tax_config_canada_2025.json')
    print("✅ Tax configuration loaded")

    # Create Rafael's profile - SINGLE person with pension
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
        oas_annual_at_start=8988.0,  # OAS maximum for 2025
        pension_incomes=[          # Rafael has a pension!
            {
                "name": "Company Pension",
                "startAge": 67,  # Use camelCase for field names
                "amount": 50000.0,  # Rafael's actual pension amount
                "inflationIndexed": True,  # Use correct field name
                "survivorBenefit": 0.6
            }
        ],
        other_incomes=[]
    )

    # Create household with Rafael as SINGLE person (p2=None, include_partner=False)
    household = Household(
        p1=rafael,
        p2=None,  # SINGLE person - no spouse!
        include_partner=False,  # IMPORTANT: Set to False for single person!
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

    print("\n📊 Rafael's Starting Position (Age 67, SINGLE):")
    print(f"  Registered Accounts:")
    print(f"  - TFSA: ${rafael.tfsa_balance:,.0f} (tax-free)")
    print(f"  - RRIF: ${rafael.rrif_balance:,.0f} (fully taxable)")
    print(f"  Total Investable Assets: ${rafael.tfsa_balance + rafael.rrif_balance:,.0f}")

    print(f"\n  Guaranteed Income Sources:")
    print(f"  - Company Pension: $50,000/year (indexed)")
    print(f"  - CPP: ${rafael.cpp_annual_at_start:,.0f}/year (delayed to 67)")
    print(f"  - OAS: ${rafael.oas_annual_at_start:,.0f}/year starting at 67")
    print(f"  - Total Guaranteed: ${50000 + rafael.cpp_annual_at_start + rafael.oas_annual_at_start:,.0f}/year")

    print(f"\n  Spending Requirements (18 years):")
    print(f"  - Go-Go (67-75): ${household.spending_go_go:,.0f}/year")
    print(f"  - Slow-Go (76-82): ${household.spending_slow_go:,.0f}/year")
    print(f"  - No-Go (83-85): ${household.spending_no_go:,.0f}/year")
    print(f"\n  With guaranteed income exceeding spending needs, Rafael may not need TFSA withdrawals initially")

    # Run simulation
    print("\n🚀 Running simulation with Balanced strategy...")
    print("   Enhanced strategy (85% OAS threshold) should:")
    print("   1. Be more proactive about OAS clawback")
    print("   2. Consider TFSA use when approaching $77,347 income")
    print("   3. Optimize for lifetime taxes")

    df = simulate(household, tax_cfg)

    # Verify simulation length
    actual_years = len(df)
    expected_years = 19  # Age 67 through 85 inclusive
    print(f"\n📈 Simulation Results:")
    print(f"  Years simulated: {actual_years}")
    print(f"  Expected: {expected_years}")

    if actual_years == expected_years:
        print("  ✅ CORRECT number of years!")
    else:
        print(f"  ❌ WRONG number of years (got {actual_years}, expected {expected_years})")

    # Analyze first year withdrawal pattern
    if len(df) > 0:
        print("\n💰 Year 1 Withdrawal Analysis (Age 67):")
        year1 = df.iloc[0]

        pension = year1.get('pension_income_p1', 0)
        cpp = year1.get('cpp_income_p1', 0)
        oas = year1.get('oas_income_p1', 0)
        rrif_wd = year1.get('rrif_withdrawal_p1', 0)
        tfsa_wd = year1.get('tfsa_withdrawal_p1', 0)
        total_income = year1.get('total_income_p1', 0)
        total_tax = year1.get('total_tax_p1', 0)
        after_tax = year1.get('after_tax_income_p1', 0)

        print(f"  Income Sources:")
        print(f"  - Pension: ${pension:,.0f}")
        print(f"  - CPP: ${cpp:,.0f}")
        print(f"  - OAS: ${oas:,.0f}")
        print(f"  - Guaranteed Total: ${pension + cpp + oas:,.0f}")

        print(f"\n  Withdrawals:")
        print(f"  - RRIF: ${rrif_wd:,.0f}")
        print(f"  - TFSA: ${tfsa_wd:,.0f}")

        print(f"\n  Tax Impact:")
        print(f"  - Total Income: ${total_income:,.0f}")
        print(f"  - Total Tax: ${total_tax:,.0f}")
        print(f"  - After-tax Income: ${after_tax:,.0f}")

        # Check if TFSA is being used strategically
        if tfsa_wd > 0:
            print(f"\n  ✅ TFSA is being used: ${tfsa_wd:,.0f}")
            print("  → This helps optimize taxes!")
        else:
            print(f"\n  ⚠️ TFSA not used in year 1")
            print(f"  → Income of ${total_income:,.0f} vs OAS threshold $90,997")
            print(f"  → 85% proactive threshold: $77,347")
            if total_income > 77347:
                print("  → Should consider TFSA use!")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    if actual_years == expected_years:
        print("✅ Simulation runs for correct number of years")
    else:
        print("❌ Simulation year count issue needs fixing")

    print("\nWith the enhanced 85% OAS threshold:")
    print("- More proactive OAS clawback management")
    print("- TFSA used strategically when beneficial")
    print("- Better lifetime tax optimization")

    return df

if __name__ == "__main__":
    try:
        df = test_rafael_single()
        print("\n✅ Test completed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)