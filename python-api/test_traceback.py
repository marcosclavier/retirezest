#!/usr/bin/env python3
"""
Get full traceback for single person simulation error
"""

import sys
import traceback
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.utils.converters import api_household_to_internal
from api.models.requests import HouseholdInput, PersonInput
from modules.simulation import simulate
from modules.config import load_tax_config

# Create minimal single person input
p1_data = {
    "name": "John",
    "start_age": 65,
    "cpp_start_age": 65,
    "cpp_annual_at_start": 10000,
    "oas_start_age": 65,
    "oas_annual_at_start": 8000,
    "tfsa_balance": 50000,
    "rrif_balance": 100000,
    "rrsp_balance": 0,
    "nonreg_balance": 25000,
    "nonreg_acb": 20000
}

p2_data = {
    "name": "",
    "start_age": 65,
    "cpp_start_age": 65,
    "cpp_annual_at_start": 0,
    "oas_start_age": 65,
    "oas_annual_at_start": 0,
    "tfsa_balance": 0,
    "rrif_balance": 0,
    "rrsp_balance": 0,
    "nonreg_balance": 0,
    "nonreg_acb": 0
}

try:
    p1 = PersonInput(**p1_data)
    p2 = PersonInput(**p2_data)

    household_input = HouseholdInput(
        p1=p1,
        p2=p2,
        province='AB',
        start_year=2025,
        include_partner=False,  # Single person mode
        end_age=95,
        strategy='minimize-income',
        spending_go_go=40000,
        spending_slow_go=35000,
        spending_no_go=30000
    )

    # Load tax config
    tax_config_path = "/Users/jrcb/Documents/RetireZest/retirezest/webapp/tax_config_canada_2025.json"
    tax_cfg = load_tax_config(tax_config_path)

    # Keep the full tax config structure
    # The simulate function expects the full config with 'federal' and 'provinces'

    print("Converting household...")

    # The converter expects a different structure
    tax_cfg_for_converter = {
        'federal': tax_cfg.get('federal'),
        'provincial': tax_cfg.get('provinces', {}).get('AB', {})
    }

    household = api_household_to_internal(household_input, tax_cfg_for_converter)
    print(f"  p2 is None: {household.p2 is None}")
    print(f"  include_partner: {household.include_partner}")

    print("\nRunning simulation...")
    # The simulate function expects the full config
    df = simulate(household, tax_cfg)

    print(f"\n✅ SUCCESS! Simulation completed with {len(df)} years")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("\n" + "="*60)
    print("FULL TRACEBACK:")
    print("="*60)
    exc_type, exc_value, exc_traceback = sys.exc_info()

    # Print the traceback with line numbers
    tb_lines = traceback.format_exception(exc_type, exc_value, exc_traceback)
    for line in tb_lines:
        print(line.rstrip())

    # Find the exact error location
    print("\n" + "="*60)
    print("ERROR LOCATION DETAILS:")
    print("="*60)

    tb = traceback.extract_tb(exc_traceback)
    for frame in tb:
        print(f"\nFile: {frame.filename}")
        print(f"Line: {frame.lineno}")
        print(f"Function: {frame.name}")
        print(f"Code: {frame.line}")