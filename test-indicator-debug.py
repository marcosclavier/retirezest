#!/usr/bin/env python3
"""
Debug test to check if indicator fields are being calculated and passed through
"""

import sys
sys.path.insert(0, 'python-api')

from modules.simulation import simulate
from modules.models import Person, Household
from modules.tax_config import TaxConfig
import pandas as pd

# Create test scenario
p1 = Person(
    name="TestUser",
    is_retired=True,
    retirement_age=65,
    start_age=70,
    life_expectancy=85,
    rrsp_balance=0,
    rrif_balance=100000,
    tfsa_balance=0,
    nonreg_balance=0,
    corporate_balance=0,
    cpp_start_age=65,
    cpp_annual_at_start=8000,
    oas_start_age=65,
    oas_annual_at_start=7000,
    gis_annual_at_start=0,
    yield_rrsp_growth=0.04,
    yield_rrif_growth=0.04,
    yield_tfsa_growth=0.04,
    yield_nonreg_growth=0.04,
    tfsa_room_start=0,
    tfsa_room_annual_growth=7000,
    nonreg_acb=0,
    pension_incomes=[],
    other_incomes=[]
)

p2 = Person(
    name="",
    is_retired=False,
    retirement_age=65,
    start_age=60,
    life_expectancy=85,
    rrsp_balance=0,
    rrif_balance=0,
    tfsa_balance=0,
    nonreg_balance=0,
    corporate_balance=0,
    cpp_start_age=65,
    cpp_annual_at_start=0,
    oas_start_age=65,
    oas_annual_at_start=0,
    gis_annual_at_start=0,
    yield_rrsp_growth=0.04,
    yield_rrif_growth=0.04,
    yield_tfsa_growth=0.04,
    yield_nonreg_growth=0.04,
    tfsa_room_start=0,
    tfsa_room_annual_growth=0,
    nonreg_acb=0,
    pension_incomes=[],
    other_incomes=[]
)

hh = Household(
    p1=p1,
    p2=p2,
    is_couple=False,
    withdrawal_strategy="RRIF-Frontload (15%/8%)",
    spending_go_go=30000,
    spending_slow_go=25000,
    spending_no_go=20000,
    go_go_end_age=75,
    slow_go_end_age=85,
    end_age=85,
    gap_tolerance=100,
    stop_on_fail=False,
    general_inflation=0.025,
    spending_inflation=0.025,
    province="ON",
    start_year=2025
)

# Load tax config
tax_cfg = TaxConfig("python-api/config/2025_tax_params.yaml")

print("\n" + "="*80)
print("BACKEND INDICATOR FIELD DEBUG TEST")
print("="*80)

# Run simulation
df = simulate(hh, tax_cfg)

# Check first year results
if not df.empty:
    first_year = df.iloc[0]

    print("\nFirst Year Backend Results:")
    print(f"  Year: {first_year['year']}")
    print(f"  Age P1: {first_year['age_p1']}")
    print(f"  CPP P1: ${first_year['cpp_p1']:,.0f}")
    print(f"  OAS P1: ${first_year['oas_p1']:,.0f}")
    print(f"  RRIF Start P1: ${first_year['start_rrif_p1']:,.0f}")
    print(f"  RRIF Withdrawal P1: ${first_year['withdraw_rrif_p1']:,.0f}")

    # Check if indicator fields exist
    if 'rrif_frontload_pct_p1' in first_year:
        print(f"  RRIF Frontload % P1: {first_year['rrif_frontload_pct_p1']:.2f}%")
    else:
        print("  ❌ rrif_frontload_pct_p1 field missing!")

    if 'rrif_frontload_exceeded_p1' in first_year:
        print(f"  RRIF Frontload Exceeded P1: {first_year['rrif_frontload_exceeded_p1']}")
    else:
        print("  ❌ rrif_frontload_exceeded_p1 field missing!")

    # Calculate actual percentage
    if first_year['start_rrif_p1'] > 0:
        actual_pct = (first_year['withdraw_rrif_p1'] / first_year['start_rrif_p1']) * 100
        print(f"\n  Calculated from values: {actual_pct:.2f}% of RRIF withdrawn")

        if actual_pct < 7.5:  # Less than expected 8%
            print(f"  ⚠️  ISSUE: Withdrawal is only {actual_pct:.1f}%, expected ~8%")
        else:
            print(f"  ✅ Withdrawal percentage looks correct")

    # Now test the API converter
    print("\n" + "-"*40)
    print("Testing API Converter...")

    from api.utils.converters import dataframe_to_year_results

    # Convert using API converter
    api_results = dataframe_to_year_results(df)

    if api_results:
        first_api = api_results[0]
        print("\nFirst Year API Results:")
        print(f"  RRIF Withdrawal P1: ${first_api.rrif_withdrawal_p1:,.0f}")
        print(f"  RRIF Frontload % P1: {first_api.rrif_frontload_pct_p1:.2f}%")
        print(f"  RRIF Frontload Exceeded P1: {first_api.rrif_frontload_exceeded_p1}")

        if first_api.rrif_frontload_pct_p1 == 0 and first_api.rrif_withdrawal_p1 > 0:
            print("\n  ❌ ERROR: Indicator field value not being passed through converter!")
        elif first_api.rrif_frontload_pct_p1 > 0:
            print("\n  ✅ Indicator field value is being passed correctly!")
else:
    print("❌ No simulation results returned!")