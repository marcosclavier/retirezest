#!/usr/bin/env python3
"""
Detailed debug test for single person simulation with full traceback
"""

import traceback
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.utils.converters import api_household_to_internal
from api.models.requests import HouseholdInput, PersonInput
from modules.simulation import simulate
from modules.tax_config import load_federal_tax_config, load_provincial_tax_config

# Create single person input
p1 = PersonInput(
    name='John',
    start_age=65,
    cpp_start_age=65,
    cpp_annual_at_start=10000,
    oas_start_age=65,
    oas_annual_at_start=8000,
    tfsa_balance=50000,
    rrif_balance=100000,
    rrsp_balance=0,
    nonreg_balance=25000,
    corporate_balance=0,
    nonreg_acb=20000,
    nr_cash=2500,
    nr_gic=5000,
    nr_invest=17500,
    y_nr_cash_interest=2.0,
    y_nr_gic_interest=3.5,
    y_nr_inv_total_return=6.0,
    y_nr_inv_elig_div=2.0,
    y_nr_inv_nonelig_div=0.5,
    y_nr_inv_capg=3.0,
    y_nr_inv_roc_pct=0.5,
    nr_cash_pct=10.0,
    nr_gic_pct=20.0,
    nr_invest_pct=70.0,
    tfsa_room_start=7000,
    tfsa_contribution_annual=0,
    enable_early_rrif_withdrawal=True,
    early_rrif_withdrawal_start_age=65,
    early_rrif_withdrawal_end_age=70,
    early_rrif_withdrawal_annual=20000,
    early_rrif_withdrawal_percentage=5.0,
    early_rrif_withdrawal_mode='percentage',
    pension_incomes=[],
    other_incomes=[]
)

# Create empty p2
p2 = PersonInput(
    name='',
    start_age=65,
    cpp_start_age=65,
    cpp_annual_at_start=0,
    oas_start_age=65,
    oas_annual_at_start=0,
    tfsa_balance=0,
    rrif_balance=0,
    rrsp_balance=0,
    nonreg_balance=0,
    corporate_balance=0,
    nonreg_acb=0,
    nr_cash=0,
    nr_gic=0,
    nr_invest=0,
    y_nr_cash_interest=2.0,
    y_nr_gic_interest=3.5,
    y_nr_inv_total_return=6.0,
    y_nr_inv_elig_div=2.0,
    y_nr_inv_nonelig_div=0.5,
    y_nr_inv_capg=3.0,
    y_nr_inv_roc_pct=0.5,
    nr_cash_pct=10.0,
    nr_gic_pct=20.0,
    nr_invest_pct=70.0,
    tfsa_room_start=0,
    tfsa_contribution_annual=0,
    enable_early_rrif_withdrawal=False,
    early_rrif_withdrawal_start_age=65,
    early_rrif_withdrawal_end_age=70,
    early_rrif_withdrawal_annual=0,
    early_rrif_withdrawal_percentage=0,
    early_rrif_withdrawal_mode='fixed',
    pension_incomes=[],
    other_incomes=[]
)

household_input = HouseholdInput(
    p1=p1,
    p2=p2,
    province='AB',
    start_year=2025,
    include_partner=False,  # Single person mode
    end_age=95,
    strategy='minimize-income',
    spending_go_go=40000,
    go_go_end_age=75,
    spending_slow_go=35000,
    slow_go_end_age=85,
    spending_no_go=30000,
    spending_inflation=2.0,
    general_inflation=2.0,
    gap_tolerance=1000,
    reinvest_nonreg_dist=False,
    income_split_rrif_fraction=0.0,
    hybrid_rrif_topup_per_person=0,
    stop_on_fail=False,
    tfsa_room_annual_growth=7000
)

print("Testing Single Person Simulation in Detail...")
print(f"include_partner: {household_input.include_partner}")
print(f"P1 name: {household_input.p1.name}")
print(f"P2 name: {household_input.p2.name}")
print()

try:
    # Load tax config
    federal_cfg = load_federal_tax_config()
    provincial_cfg = load_provincial_tax_config('AB')
    tax_cfg = {'federal': federal_cfg, 'provincial': provincial_cfg}
    print("✓ Tax config loaded")

    # Convert household
    household = api_household_to_internal(household_input, tax_cfg)
    print(f"✓ Household converted")
    print(f"  - p2 is None: {household.p2 is None}")
    print(f"  - include_partner: {household.include_partner}")

    if household.p2 is not None:
        print(f"  ⚠️ WARNING: p2 should be None for single person mode!")
        print(f"  - p2 type: {type(household.p2)}")
        print(f"  - p2 name: {household.p2.name if hasattr(household.p2, 'name') else 'N/A'}")

    print()
    print("Running simulation...")
    result = simulate(household, tax_cfg)

    print("✅ Simulation completed successfully!")
    print(f"  - Success Rate: {result.get('success_rate', 'N/A')}%")
    print(f"  - Years Funded: {result.get('years_funded', 'N/A')}/{result.get('years_simulated', 'N/A')}")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("\nFull Traceback:")
    print("=" * 60)
    traceback.print_exc()
    print("=" * 60)

    # Try to identify the specific line causing the issue
    tb = traceback.extract_tb(sys.exc_info()[2])
    for frame in tb:
        if 'strategy_insights' in frame.filename:
            print(f"\n⚠️ Error in strategy_insights.py")
            print(f"  File: {frame.filename}")
            print(f"  Line: {frame.lineno}")
            print(f"  Code: {frame.line}")