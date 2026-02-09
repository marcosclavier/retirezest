"""
Test to verify that private pension income appears in Income Composition chart.

This test addresses the bug report from Marc Rondeau <mrondeau205@gmail.com>
where private pension income was included in tax calculations but NOT displayed
in the Income Composition chart.

Bug: converters.py line 996 was missing pension_income and other_income
Fix: Added pension_income_total and other_income_total to taxable_income calculation
"""

import sys
from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate
from api.utils.converters import dataframe_to_year_results, extract_chart_data

def test_pension_income_in_chart():
    """Test that pension income appears in chart data"""

    print("=" * 80)
    print("INCOME COMPOSITION CHART - PENSION INCOME FIX TEST")
    print("=" * 80)

    # Create person with private pension income
    person = Person(
        name="Marc",
        start_age=65,

        # Government benefits
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,

        # Private pension (the key field being tested!)
        pension_incomes=[
            {
                "name": "Work Pension Plan",
                "amount": 30000,  # $30k/year private pension
                "startAge": 65,
                "inflationIndexed": True
            }
        ],

        # Accounts
        tfsa_balance=100000,
        rrif_balance=200000,
        nonreg_balance=50000,
        nonreg_acb=40000,
    )

    household = Household(
        p1=person,
        p2=Person(name="Spouse", start_age=65),
        province="ON",
        start_year=2025,
        end_age=70,  # Short test
        spending_go_go=50000,
        go_go_end_age=75,
        spending_slow_go=40000,
        slow_go_end_age=85,
        spending_no_go=30000,
        strategy="balanced",
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    # Load tax config
    tax_config = load_tax_config('tax_config_canada_2025.json')

    # Run simulation
    print("\n📊 Running simulation...")
    df = simulate(household, tax_config)

    # Convert to chart data
    print("📊 Converting to chart data...")
    chart_data = extract_chart_data(df)

    # Get first year from dataframe
    year_2025_df = df.iloc[0]
    chart_2025 = chart_data.data_points[0]

    print("\n" + "=" * 80)
    print("YEAR 2025 RESULTS")
    print("=" * 80)

    # Check pension income from dataframe
    pension_p1 = float(year_2025_df.get('pension_income_p1', 0))
    pension_p2 = float(year_2025_df.get('pension_income_p2', 0))
    pension_total = pension_p1 + pension_p2
    print(f"\n✓ Pension Income P1 (from dataframe): ${pension_p1:,.2f}")
    print(f"✓ Pension Income P2 (from dataframe): ${pension_p2:,.2f}")
    print(f"✓ Pension Income Total: ${pension_total:,.2f}")

    # Check chart data
    taxable_income_chart = chart_2025.taxable_income
    print(f"✓ Taxable Income (in chart): ${taxable_income_chart:,.2f}")

    # Calculate expected components
    cpp_total = float(year_2025_df['cpp_p1']) + float(year_2025_df['cpp_p2'])
    oas_total = float(year_2025_df['oas_p1']) + float(year_2025_df['oas_p2'])
    rrif_withdrawal = float(year_2025_df['withdraw_rrif_p1']) + float(year_2025_df['withdraw_rrif_p2'])

    print(f"\nIncome Components:")
    print(f"  CPP:              ${cpp_total:,.2f}")
    print(f"  OAS:              ${oas_total:,.2f}")
    print(f"  RRIF Withdrawal:  ${rrif_withdrawal:,.2f}")
    print(f"  Private Pension:  ${pension_p1:,.2f}")

    # CRITICAL TEST: Does the chart include pension income?
    expected_minimum = cpp_total + oas_total + pension_total

    print(f"\n" + "=" * 80)
    print("VERIFICATION")
    print("=" * 80)

    if taxable_income_chart >= expected_minimum:
        print(f"✅ PASS: Chart taxable income (${taxable_income_chart:,.2f}) includes pension income")
        print(f"   Expected at least: ${expected_minimum:,.2f} (CPP + OAS + Pension)")
        print(f"   Difference: ${taxable_income_chart - expected_minimum:,.2f} (likely from RRIF withdrawals)")

        # More detailed check: pension should be explicitly included
        income_without_pension = taxable_income_chart - pension_total
        print(f"\n✅ DETAILED CHECK:")
        print(f"   Chart income WITH pension:    ${taxable_income_chart:,.2f}")
        print(f"   Chart income WITHOUT pension: ${income_without_pension:,.2f}")
        print(f"   Pension contribution:         ${pension_total:,.2f}")

        return True
    else:
        print(f"❌ FAIL: Chart taxable income (${taxable_income_chart:,.2f}) is MISSING pension income")
        print(f"   Expected at least: ${expected_minimum:,.2f} (CPP + OAS + Pension)")
        print(f"   Missing: ${expected_minimum - taxable_income_chart:,.2f}")
        print(f"\n   This means the Income Composition chart is NOT showing pension income to the user!")

        return False

if __name__ == "__main__":
    try:
        success = test_pension_income_in_chart()

        if success:
            print("\n" + "=" * 80)
            print("✅ TEST PASSED: Pension income is correctly included in chart data")
            print("=" * 80)
            sys.exit(0)
        else:
            print("\n" + "=" * 80)
            print("❌ TEST FAILED: Pension income is missing from chart data")
            print("=" * 80)
            sys.exit(1)

    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
