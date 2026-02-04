#!/usr/bin/env python3
"""
Debug script to see exactly what's in the simulation DataFrame.
"""

import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

# Create Daniel's profile
p1 = Person(
    name="Daniel Gonzalez",
    start_age=64,

    # Assets
    tfsa_balance=100000,
    rrsp_balance=500000,
    rrif_balance=0,
    nonreg_balance=50000,
    corporate_balance=0,

    # Government benefits
    cpp_start_age=66,  # ← This is his retirement age (when employment should stop)
    cpp_annual_at_start=15000,
    oas_start_age=65,
    oas_annual_at_start=8000,

    # Employment income (this is the bug we're testing!)
    other_incomes=[
        {
            'type': 'employment',
            'amount': 200000,  # $200K employment income
            'startAge': None,  # Should default to start_age (64)
            'endAge': None,    # Should default to cpp_start_age (66) ← THE FIX
            'inflationIndexed': False,
        }
    ]
)

# No partner
p2 = Person(
    name="No Partner",
    start_age=65,
)

# Create household
household = Household(
    p1=p1,
    p2=p2,
    province='AB',
    start_year=2026,
    end_age=85,
    strategy='minimize-income',
    spending_go_go=58000,
    spending_slow_go=58000,
    spending_no_go=58000,
    spending_inflation=0.02,
    general_inflation=0.02,
)

print("=" * 80)
print("DEBUG: Daniel Gonzalez Employment Income Test")
print("=" * 80)
print()
print(f"P1 other_incomes: {p1.other_incomes}")
print()

# Load tax config
tax_cfg = load_tax_config("tax_config_canada_2025.json")

# Run simulation
print("Running simulation...")
results_df = simulate(household, tax_cfg)
print("Simulation complete")
print()

# Check first 3 years
print("=" * 80)
print("YEAR-BY-YEAR INCOME BREAKDOWN")
print("=" * 80)

for idx in range(3):
    row = results_df.iloc[idx]
    year = int(row['year'])
    age = int(row['age_p1'])

    print(f"\nYear {year} (Age {age}):")
    print(f"  CPP P1:                ${row.get('cpp_p1', 0):>10,.0f}")
    print(f"  OAS P1:                ${row.get('oas_p1', 0):>10,.0f}")
    print(f"  Other Income P1:       ${row.get('other_income_p1', 0):>10,.0f}")
    print(f"  Employment P1:         ${row.get('employment_p1', 0):>10,.0f}")
    print(f"  RRSP Withdrawal P1:    ${row.get('rrsp_withdrawal_p1', 0):>10,.0f}")
    print(f"  RRIF Withdrawal P1:    ${row.get('withdraw_rrif_p1', 0):>10,.0f}")
    print(f"  TFSA Withdrawal P1:    ${row.get('withdraw_tfsa_p1', 0):>10,.0f}")
    print(f"  Tax P1:                ${row.get('tax_p1', 0):>10,.0f}")
    print(f"  Tax After Split P1:    ${row.get('tax_after_split_p1', 0):>10,.0f}")
    print(f"  Total Tax After Split: ${row.get('total_tax_after_split', 0):>10,.0f}")
    print(f"  Success:               {row.get('plan_success', row.get('success', False))}")

print()
print("=" * 80)
print("AVAILABLE COLUMNS IN DATAFRAME:")
print("=" * 80)
print(list(results_df.columns))
