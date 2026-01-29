#!/usr/bin/env python3
"""
Simulate Rafael and Lucy with their actual assets from the database.

Assets from database:
- Person 1 (Rafael): RRIF $306,000 + TFSA $104,000 = $410,000
- Person 2 (Lucy): RRIF $22,000 + TFSA $114,000 = $136,000
- Joint: NonReg $366,000 (split $183,000 each)
- Total: $912,000

Spending: $95,400 go-go, $76,320 slow-go, $66,780 no-go
Province: Alberta
Strategy: minimize-income
"""

import os
os.environ['MPLBACKEND'] = 'Agg'

from modules.simulation import simulate
from modules.models import Person, Household
from modules.config import load_tax_config

# Load tax config
tax_cfg = load_tax_config('tax_config_canada_2025.json')

print('\n╔════════════════════════════════════════════════════════════╗')
print('║         RAFAEL & LUCY CORRECTED SIMULATION                 ║')
print('╚════════════════════════════════════════════════════════════╝\n')

print('Using actual assets from database:')
print('  Rafael (P1):')
print('    - RRIF: $306,000')
print('    - TFSA: $104,000')
print('    - NonReg (joint share): $183,000')
print('    - Total: $593,000')
print('  Lucy (P2):')
print('    - RRIF: $22,000')
print('    - TFSA: $114,000')
print('    - NonReg (joint share): $183,000')
print('    - Total: $319,000')
print('  Combined: $912,000\n')

# Person 1 - Rafael (age 64 in 2026, so age 63 in 2025)
p1 = Person(
    name='Rafael',
    start_age=63,
    cpp_start_age=65,
    cpp_annual_at_start=12000,  # Assumed
    oas_start_age=65,
    oas_annual_at_start=8500,   # Assumed
    tfsa_balance=104000,
    rrif_balance=306000,
    rrsp_balance=0,
    nonreg_balance=183000,  # Half of joint $366k
    corporate_balance=0
)

# Person 2 - Lucy
p2 = Person(
    name='Lucy',
    start_age=62,  # Assumed age for Lucy
    cpp_start_age=65,
    cpp_annual_at_start=8000,  # Assumed lower CPP
    oas_start_age=65,
    oas_annual_at_start=8500,
    tfsa_balance=114000,
    rrif_balance=22000,
    rrsp_balance=0,
    nonreg_balance=183000,  # Half of joint $366k
    corporate_balance=0
)

# Household
hh = Household(
    p1, p2,
    province='AB',  # Alberta
    start_year=2025,
    end_age=95,
    strategy='minimize-income'
)

# Spending from database
hh.spending_go_go = 95400
hh.go_go_end_age = 75
hh.spending_slow_go = 76320
hh.slow_go_end_age = 85
hh.spending_no_go = 66780

print('Running simulation...')
df = simulate(hh, tax_cfg)
print(f'✓ Completed: {len(df)} years\n')

# Check plan success
successes = len(df[df['plan_success'] == True])
failures = len(df[df['plan_success'] == False])

print('═══════════════════════════════════════════════════════════\n')
print('SIMULATION RESULTS:\n')
print(f'  Years Simulated:    {len(df)}')
print(f'  Years Funded:       {successes}')
print(f'  Years with Gaps:    {failures}')
print(f'  Success Rate:       {successes/len(df)*100:.1f}%\n')

# First failure
if failures > 0:
    first_fail = df[df['plan_success'] == False].iloc[0]
    print(f'FIRST YEAR WITH GAP:')
    print(f'  Year:               {int(first_fail["year"])}')
    print(f'  Age (Rafael):       {int(first_fail["age_p1"])}')
    print(f'  Age (Lucy):         {int(first_fail["age_p2"])}')
    print(f'  Net Worth:          ${first_fail.get("net_worth_end", 0):,.0f}')
    print(f'  Underfunded:        ${first_fail.get("underfunded_after_tax", 0):,.0f}\n')
else:
    print('✅ NO GAPS - Fully funded!\n')

# Year 2037 (age 75 for Rafael)
year_2037 = df[df['year'] == 2037]
if not year_2037.empty:
    row = year_2037.iloc[0]
    status = '✅ OK' if row.get('plan_success', False) else '❌ Gap'
    print('═══════════════════════════════════════════════════════════\n')
    print(f'YEAR 2037 (Rafael age 75): {status}')
    print(f'  Net Worth:          ${row.get("net_worth_end", 0):,.0f}')
    print(f'  RRIF (Rafael):      ${row.get("end_rrif_p1", 0):,.0f}')
    print(f'  RRIF (Lucy):        ${row.get("end_rrif_p2", 0):,.0f}')
    print(f'  TFSA (Rafael):      ${row.get("end_tfsa_p1", 0):,.0f}')
    print(f'  TFSA (Lucy):        ${row.get("end_tfsa_p2", 0):,.0f}')
    print(f'  NonReg (Rafael):    ${row.get("end_nonreg_p1", 0):,.0f}')
    print(f'  NonReg (Lucy):      ${row.get("end_nonreg_p2", 0):,.0f}')
    print(f'  Spending Target:    ${row.get("spend_target_after_tax", 0):,.0f}')
    print(f'  Spending Met:       ${row.get("spending_met", row.get("spend_target_after_tax", 0)):,.0f}')
    print(f'  Underfunded:        ${row.get("underfunded_after_tax", 0):,.0f}\n')

# Final year estate
final = df.iloc[-1]
print('═══════════════════════════════════════════════════════════\n')
print(f'FINAL YEAR {int(final["year"])} (Ages {int(final["age_p1"])}/{int(final["age_p2"])}):')
print(f'  Net Worth:          ${final.get("net_worth_end", 0):,.0f}')
print(f'  RRIF (both):        ${(final.get("end_rrif_p1", 0) + final.get("end_rrif_p2", 0)):,.0f}')
print(f'  TFSA (both):        ${(final.get("end_tfsa_p1", 0) + final.get("end_tfsa_p2", 0)):,.0f}')
print(f'  NonReg (both):      ${(final.get("end_nonreg_p1", 0) + final.get("end_nonreg_p2", 0)):,.0f}')
print(f'  Corporate (both):   ${(final.get("end_corp_p1", final.get("corp_p1", 0)) + final.get("end_corp_p2", final.get("corp_p2", 0))):,.0f}\n')

# Calculate estate (same logic as converters.py)
rrif_balance = float(final.get('end_rrif_p1', 0)) + float(final.get('end_rrif_p2', 0))
tfsa_balance = float(final.get('end_tfsa_p1', 0)) + float(final.get('end_tfsa_p2', 0))
nonreg_balance = float(final.get('end_nonreg_p1', 0)) + float(final.get('end_nonreg_p2', 0))
corporate_balance = float(final.get('corp_p1', final.get('end_corp_p1', 0))) + \
                    float(final.get('corp_p2', final.get('end_corp_p2', 0)))

gross_estate = rrif_balance + tfsa_balance + nonreg_balance + corporate_balance

# Tax estimates (35% marginal rate)
marginal_rate = 0.35
rrif_tax = rrif_balance * marginal_rate
nonreg_tax = (nonreg_balance * 0.5) * 0.5 * marginal_rate  # 50% is gains, 50% inclusion
corporate_tax = corporate_balance * 0.5 * marginal_rate
tfsa_tax = 0

taxes_at_death = rrif_tax + nonreg_tax + corporate_tax
after_tax_legacy = gross_estate - taxes_at_death

print('ESTATE SUMMARY (calculated):')
print(f'  Gross Estate:       ${gross_estate:,.0f}')
print(f'  Taxes at Death:     ${taxes_at_death:,.0f}')
print(f'  After-Tax Legacy:   ${after_tax_legacy:,.0f}')
print(f'  Effective Tax Rate: {(taxes_at_death/gross_estate*100):.1f}%\n')

print('═══════════════════════════════════════════════════════════\n')
print('COMPARISON TO DATABASE SIMULATION (with $0 assets):\n')
print('  Database showed:')
print('    - Gross Estate: ~$582,000')
print('    - Years Funded: 11/34 (32.4%)')
print('    - Status: Multiple gaps\n')
print('  Corrected simulation shows:')
print(f'    - Gross Estate: ${gross_estate:,.0f}')
print(f'    - Years Funded: {successes}/{len(df)} ({successes/len(df)*100:.1f}%)')
print(f'    - Status: {"Fully funded!" if failures == 0 else f"{failures} years with gaps"}\n')

if gross_estate > 582000:
    improvement = gross_estate - 582000
    print(f'  💰 Estate value INCREASED by ${improvement:,.0f} with correct assets!')
else:
    print('  ⚠️  Still showing issues - may need to review spending levels')

print('\n')
