#!/usr/bin/env python3
"""Debug script to test withdrawal logic for year 2039 shortfall."""

import sys
import logging

# Enable DEBUG logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(levelname)s - %(name)s - %(message)s'
)

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

# Load tax config
tax_cfg = load_tax_config("tax_config_canada_2025.json")

# Create household matching user's scenario
p1 = Person(
    name="Juan",
    age_now=64,  # Will be 79 in year 2039 (15 years from now)
    retire_age=65,
    life_expectancy=95,
    cpp_start_age=70,
    oas_start_age=70,
    cpp_annual=8577,
    oas_annual=5938,
    rrif_balance=172292,
    tfsa_balance=543274,
    nonreg_balance=869987,
    nonreg_acb=695989,  # From screenshot
)
p1.corp_balance = 885426

p2 = Person(
    name="Daniela",
    age_now=64,
    retire_age=65,
    life_expectancy=95,
    cpp_start_age=70,
    oas_start_age=70,
    cpp_annual=8577,
    oas_annual=5674,
    rrif_balance=242140,
    tfsa_balance=622274,
    nonreg_balance=842187,
    nonreg_acb=673749,
)
p2.corp_balance=885060

hh = Household(
    p1=p1,
    p2=p2,
    strategy="Corp->RRIF->NonReg->TFSA",
    province="AB",
    start_year=2025,
)

# Set spending targets
hh.spending_gogo = 151259  # From screenshot
hh.gogo_end_age = 95  # All years the same for testing
hh.spending_slowgo = 151259
hh.slowgo_end_age = 95
hh.spending_nogo = 151259

print("=" * 80)
print("TESTING YEAR 2039 (Age 79) WITHDRAWAL PRIORITY")
print("=" * 80)
print(f"\nScenario:")
print(f"  Spending target: ${hh.spending_gogo:,.0f}")
print(f"  Strategy: {hh.strategy}")
print(f"  P1 balances: RRIF=${p1.rrif_balance:,.0f}, Corp=${p1.corp_balance:,.0f}, NonReg=${p1.nonreg_balance:,.0f}, TFSA=${p1.tfsa_balance:,.0f}")
print(f"  P2 balances: RRIF=${p2.rrif_balance:,.0f}, Corp=${p2.corp_balance:,.0f}, NonReg=${p2.nonreg_balance:,.0f}, TFSA=${p2.tfsa_balance:,.0f}")

# Run simulation
result = simulate(hh, tax_cfg)

# Find year 2039 (index 14, since we start at 2025)
year_2039_idx = 14
if year_2039_idx < len(result.years):
    yr = result.years[year_2039_idx]

    print(f"\n{'=' * 80}")
    print(f"YEAR 2039 RESULTS:")
    print(f"{'=' * 80}")
    print(f"\nInflows:")
    print(f"  Gov Benefits: ${yr.govt_benefits:,.0f}")

    print(f"\nWithdrawals:")
    print(f"  RRIF (P1): ${yr.p1_rrif_withdrawal:,.0f}")
    print(f"  RRIF (P2): ${yr.p2_rrif_withdrawal:,.0f}")
    print(f"  Corp (P1): ${yr.p1_corp_withdrawal:,.0f}")
    print(f"  Corp (P2): ${yr.p2_corp_withdrawal:,.0f}")
    print(f"  NonReg (P1): ${yr.p1_nonreg_withdrawal:,.0f}")
    print(f"  NonReg (P2): ${yr.p2_nonreg_withdrawal:,.0f}")
    print(f"  TFSA (P1): ${yr.p1_tfsa_withdrawal:,.0f}")
    print(f"  TFSA (P2): ${yr.p2_tfsa_withdrawal:,.0f}")
    print(f"  Total: ${yr.total_withdrawals:,.0f}")

    print(f"\nOutflows:")
    print(f"  Total Tax: ${yr.total_tax:,.0f}")
    print(f"  Spending Met: ${yr.spending_met:,.0f}")
    print(f"  Spending Target: ${yr.spending_target:,.0f}")
    print(f"  Shortfall: ${yr.spending_gap:,.0f}")

    print(f"\n{'=' * 80}")
    if yr.spending_gap > 1000:
        print(f"❌ SHORTFALL EXISTS: ${yr.spending_gap:,.0f}")
        print(f"   NonReg and TFSA should be withdrawn to cover this!")
    else:
        print(f"✅ SPENDING MET!")
else:
    print(f"\n❌ Year 2039 not found in results")

print("\n" + "=" * 80)
