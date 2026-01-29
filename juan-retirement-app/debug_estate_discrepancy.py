#!/usr/bin/env python3
"""
Debug estate value discrepancy.
Check what happens in the simulation after year 2037 when it shows "Gap".
"""

import os
os.environ['MPLBACKEND'] = 'Agg'

from modules.simulation import simulate
from modules.models import Person, Household
from modules.config import load_tax_config

# Load tax config
tax_cfg = load_tax_config('tax_config_canada_2025.json')

# Create test household matching the user's scenario
# Assumptions based on the screenshots:
# - Age 64 in 2026, so start_age = 63 in 2025
# - Has significant assets (RRIF, TFSA, NonReg around $800k+ total at age 64)

p1 = Person(
    name='Test User',
    start_age=63,  # Age 64 in 2026
    cpp_start_age=65,
    cpp_annual_at_start=12000,
    oas_start_age=65,
    oas_annual_at_start=8500,
    tfsa_balance=350000,
    rrif_balance=250000,
    rrsp_balance=0,
    nonreg_balance=250000,
    corporate_balance=0
)

p2 = Person(name='', start_age=65)

hh = Household(
    p1, p2,
    province='ON',
    start_year=2025,
    end_age=95,
    strategy='minimize-income'
)
hh.spending_go_go = 95400  # From screenshot (spending target in 2026)
hh.go_go_end_age = 75
hh.spending_slow_go = 100000  # High spending in slow-go
hh.slow_go_end_age = 85
hh.spending_no_go = 80000

print('\n╔════════════════════════════════════════════════════════════╗')
print('║           ESTATE VALUE DISCREPANCY DIAGNOSIS                ║')
print('╚════════════════════════════════════════════════════════════╝\n')

print('Running simulation...')
df = simulate(hh, tax_cfg)
print(f'✓ Simulation completed: {len(df)} years\n')

# Show key years
print('═══════════════════════════════════════════════════════════\n')
print('KEY YEARS:\n')

# Year 2037 (where "Gap" appears in screenshot)
year_2037 = df[df['year'] == 2037]
if not year_2037.empty:
    row = year_2037.iloc[0]
    print('2037 (Age 75) - WHERE "GAP" APPEARS:')
    print(f'  Net Worth:          ${row.get("net_worth_end", 0):,.0f}')
    print(f'  Plan Success:       {row.get("plan_success", "N/A")}')
    print(f'  Spending Target:    ${row.get("spend_target_after_tax", 0):,.0f}')
    print(f'  Spending Met:       ${row.get("spending_met", row.get("spend_target_after_tax", 0)):,.0f}')
    print(f'  Underfunded:        ${row.get("underfunded_after_tax", 0):,.0f}')
    print(f'  RRIF:               ${row.get("end_rrif_p1", 0):,.0f}')
    print(f'  TFSA:               ${row.get("end_tfsa_p1", 0):,.0f}')
    print(f'  NonReg:             ${row.get("end_nonreg_p1", 0):,.0f}\n')

# Final year (used for estate calculation)
final_row = df.iloc[-1]
print(f'FINAL YEAR {int(final_row["year"])} (Age {int(final_row["age_p1"])}) - USED FOR ESTATE:')
print(f'  Net Worth:          ${final_row.get("net_worth_end", 0):,.0f}')
print(f'  Plan Success:       {final_row.get("plan_success", "N/A")}')
print(f'  RRIF:               ${final_row.get("end_rrif_p1", 0):,.0f}')
print(f'  TFSA:               ${final_row.get("end_tfsa_p1", 0):,.0f}')
print(f'  NonReg:             ${final_row.get("end_nonreg_p1", 0):,.0f}')
print(f'  Corporate:          ${final_row.get("end_corp_p1", final_row.get("corp_p1", 0)):,.0f}\n')

# Calculate estate (same as converters.py)
rrif_balance = float(final_row.get('end_rrif_p1', 0)) + float(final_row.get('end_rrif_p2', 0))
tfsa_balance = float(final_row.get('end_tfsa_p1', 0)) + float(final_row.get('end_tfsa_p2', 0))
nonreg_balance = float(final_row.get('end_nonreg_p1', 0)) + float(final_row.get('end_nonreg_p2', 0))
corporate_balance = float(final_row.get('corp_p1', final_row.get('end_corp_p1', 0))) + \
                    float(final_row.get('corp_p2', final_row.get('end_corp_p2', 0)))

gross_estate = rrif_balance + tfsa_balance + nonreg_balance + corporate_balance

print('CALCULATED ESTATE (from final year):')
print(f'  Gross Estate:       ${gross_estate:,.0f}\n')

# Count successes vs failures
successes = len(df[df['plan_success'] == True])
failures = len(df[df['plan_success'] == False])

print('═══════════════════════════════════════════════════════════\n')
print('SIMULATION SUMMARY:')
print(f'  Total Years:        {len(df)}')
print(f'  Successful Years:   {successes}')
print(f'  Failed Years:       {failures}')
print(f'  Success Rate:       {successes/len(df)*100:.1f}%\n')

# Show when failure starts
if failures > 0:
    first_failure = df[df['plan_success'] == False].iloc[0]
    print(f'FIRST FAILURE:')
    print(f'  Year:               {int(first_failure["year"])}')
    print(f'  Age:                {int(first_failure["age_p1"])}')
    print(f'  Net Worth:          ${first_failure.get("net_worth_end", 0):,.0f}')
    print(f'  Underfunded:        ${first_failure.get("underfunded_after_tax", 0):,.0f}\n')

# Show years 2035-2040 for context
print('═══════════════════════════════════════════════════════════\n')
print('YEARS AROUND "GAP" (2035-2040):\n')
for year in range(2035, 2041):
    year_data = df[df['year'] == year]
    if not year_data.empty:
        row = year_data.iloc[0]
        status = '✅ OK' if row.get('plan_success', False) else '❌ Gap'
        print(f'{year}: {status:8s}  Net Worth: ${row.get("net_worth_end", 0):>10,.0f}')

print('\n')
