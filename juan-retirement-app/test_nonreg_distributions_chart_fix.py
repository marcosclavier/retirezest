"""
Test to verify that non-registered distributions are:
1. Correctly included in taxable_income calculation
2. Properly passed through to chart data

This addresses the bug where NonReg distributions were:
- Missing from taxable_income calculation in converters.py
- Incorrectly categorized as "Government Benefits" in the UI
"""

import sys
from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate
from api.utils.converters import dataframe_to_year_results, extract_chart_data

def test_nonreg_distributions_in_chart():
    """Test that nonreg_distributions are correctly captured in chart data"""
    
    print("=" * 80)
    print("NON-REGISTERED DISTRIBUTIONS BUG FIX TEST")
    print("=" * 80)
    
    # Create household with significant NonReg account that will generate distributions
    person = Person(
        name="TestUser",
        start_age=65,
        
        # Government benefits
        cpp_start_age=65,
        cpp_annual_at_start=10000,
        oas_start_age=65,
        oas_annual_at_start=7500,
        
        # Accounts - Large NonReg balance to ensure distributions are generated
        tfsa_balance=50000,
        rrif_balance=100000,
        nonreg_balance=200000,  # $200k NonReg
        nonreg_acb=150000,      # ACB for capital gains tracking
    )
    
    household = Household(
        p1=person,
        p2=Person(name="Spouse", start_age=65),
        province="ON",
        start_year=2025,
        end_age=70,  # Short test
        spending_go_go=40000,
        go_go_end_age=75,
        spending_slow_go=30000,
        slow_go_end_age=85,
        spending_no_go=25000,
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
    
    # Get first year from both sources
    year_2025_df = df.iloc[0]
    chart_2025 = chart_data.data_points[0]
    
    print("\n" + "=" * 80)
    print("YEAR 2025 RESULTS")
    print("=" * 80)
    
    # Calculate NonReg distributions from dataframe
    nr_interest = float(year_2025_df.get('nr_interest_p1', 0)) + float(year_2025_df.get('nr_interest_p2', 0))
    nr_elig_div = float(year_2025_df.get('nr_elig_div_p1', 0)) + float(year_2025_df.get('nr_elig_div_p2', 0))
    nr_nonelig_div = float(year_2025_df.get('nr_nonelig_div_p1', 0)) + float(year_2025_df.get('nr_nonelig_div_p2', 0))
    nr_capg_dist = float(year_2025_df.get('nr_capg_dist_p1', 0)) + float(year_2025_df.get('nr_capg_dist_p2', 0))
    
    nonreg_distributions_df = nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist
    
    print(f"\n✓ NonReg Distributions (from dataframe):")
    print(f"  Interest:           ${nr_interest:,.2f}")
    print(f"  Eligible Dividends: ${nr_elig_div:,.2f}")
    print(f"  Non-Elig Dividends: ${nr_nonelig_div:,.2f}")
    print(f"  Capital Gains Dist: ${nr_capg_dist:,.2f}")
    print(f"  TOTAL:              ${nonreg_distributions_df:,.2f}")
    
    # Check chart data
    nonreg_distributions_chart = chart_2025.nonreg_distributions
    taxable_income_chart = chart_2025.taxable_income
    
    print(f"\n✓ Chart Data:")
    print(f"  nonreg_distributions: ${nonreg_distributions_chart:,.2f}")
    print(f"  taxable_income:       ${taxable_income_chart:,.2f}")
    
    # Calculate other income components
    cpp_total = chart_2025.cpp_total
    oas_total = chart_2025.oas_total
    rrif_withdrawal = chart_2025.rrif_withdrawal
    nonreg_withdrawal = chart_2025.nonreg_withdrawal
    
    print(f"\n✓ Income Components in Chart:")
    print(f"  CPP:                ${cpp_total:,.2f}")
    print(f"  OAS:                ${oas_total:,.2f}")
    print(f"  RRIF Withdrawal:    ${rrif_withdrawal:,.2f}")
    print(f"  NonReg Withdrawal:  ${nonreg_withdrawal:,.2f}")
    print(f"  NonReg Distributions: ${nonreg_distributions_chart:,.2f}")
    
    # VERIFICATION
    print(f"\n" + "=" * 80)
    print("VERIFICATION")
    print("=" * 80)
    
    success = True
    
    # Test 1: NonReg distributions captured in chart
    if nonreg_distributions_chart > 0:
        print(f"✅ TEST 1 PASS: NonReg distributions captured in chart (${nonreg_distributions_chart:,.2f})")
    else:
        print(f"❌ TEST 1 FAIL: NonReg distributions NOT captured in chart (${nonreg_distributions_chart:,.2f})")
        success = False
    
    # Test 2: NonReg distributions match dataframe
    if abs(nonreg_distributions_chart - nonreg_distributions_df) < 0.01:
        print(f"✅ TEST 2 PASS: Chart nonreg_distributions matches dataframe")
    else:
        print(f"❌ TEST 2 FAIL: Chart nonreg_distributions (${nonreg_distributions_chart:,.2f}) != Dataframe (${nonreg_distributions_df:,.2f})")
        success = False
    
    # Test 3: Taxable income includes nonreg_distributions
    expected_min_taxable = cpp_total + oas_total + nonreg_distributions_chart
    if taxable_income_chart >= expected_min_taxable:
        print(f"✅ TEST 3 PASS: Taxable income (${taxable_income_chart:,.2f}) includes nonreg_distributions")
        print(f"   Breakdown: CPP (${cpp_total:,.2f}) + OAS (${oas_total:,.2f}) + NonReg Dist (${nonreg_distributions_chart:,.2f}) + other")
    else:
        print(f"❌ TEST 3 FAIL: Taxable income (${taxable_income_chart:,.2f}) appears to be MISSING nonreg_distributions")
        print(f"   Expected at least: ${expected_min_taxable:,.2f}")
        success = False
    
    # Test 4: Verify nonreg_distributions is separate from nonreg_withdrawal
    if nonreg_distributions_chart != nonreg_withdrawal:
        print(f"✅ TEST 4 PASS: nonreg_distributions (${nonreg_distributions_chart:,.2f}) is separate from nonreg_withdrawal (${nonreg_withdrawal:,.2f})")
    else:
        print(f"⚠️  TEST 4 WARNING: nonreg_distributions equals nonreg_withdrawal - may be correct if both are the same value")
    
    return success

if __name__ == "__main__":
    try:
        success = test_nonreg_distributions_in_chart()
        
        if success:
            print("\n" + "=" * 80)
            print("✅ ALL TESTS PASSED: NonReg distributions bug is FIXED!")
            print("=" * 80)
            sys.exit(0)
        else:
            print("\n" + "=" * 80)
            print("❌ TESTS FAILED: NonReg distributions bug still present")
            print("=" * 80)
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ TEST ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
