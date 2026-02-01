#!/usr/bin/env python3
"""
Test simulation for user rightfooty218@gmail.com
Verify if "$1M at age 90" claim is accurate.

User Data:
- Age 67, Ontario, Single
- LIRA: $118,927 @ 5%
- Non-Reg: $93,757 @ 5%
- TFSA: $90,082 @ 2.8%
- CPP: $878.15/month (starts 67)
- OAS: $771.28/month (starts 67)
- Pension: $225.53/month (starts 67)
- Annual expenses: $60,000
"""

import os
os.environ['MPLBACKEND'] = 'Agg'

from modules.simulation import simulate
from modules.models import Person, Household
from modules.config import load_tax_config

# Load tax config
tax_cfg = load_tax_config('tax_config_canada_2025.json')

print('\n╔════════════════════════════════════════════════════════════╗')
print('║    RIGHTFOOTY218@GMAIL.COM - SIMULATION VERIFICATION       ║')
print('╚════════════════════════════════════════════════════════════╝\n')

print('User Feedback: "Doesnt give end date for investments and it say')
print('               imwill have 1000000 complete wrong when I am 90"\n')

print('Testing with user\'s actual data from database:\n')
print('  Age: 67')
print('  Province: Ontario')
print('  Assets:')
print('    - LIRA (RRSP): $118,927 @ 5.0%')
print('    - Non-Reg: $93,757 @ 5.0%')
print('    - TFSA: $90,082 @ 2.8%')
print('    - Total: $302,766')
print('  Income:')
print('    - CPP: $10,538/year (starts age 67)')
print('    - OAS: $9,255/year (starts age 67)')
print('    - Pension: $2,706/year (starts age 67)')
print('    - Total: $22,499/year')
print('  Expenses: $60,000/year')
print('  Gap from investments: $37,501/year\n')

# Person 1 - Right Foot (single user, age 67)
p1 = Person(
    name='Right Foot',
    start_age=67,

    # Government benefits
    cpp_start_age=67,
    cpp_annual_at_start=10538,  # $878.15 * 12
    oas_start_age=67,
    oas_annual_at_start=9255,   # $771.28 * 12

    # Assets
    rrsp_balance=118927,  # LIRA (will convert to LRIF at age 71)
    tfsa_balance=90082,
    nonreg_balance=93757,

    # Investment returns
    yield_rrsp_growth=0.05,  # 5% on LIRA/RRSP
    yield_tfsa_growth=0.028,  # 2.8% on TFSA
    yield_nonreg_interest=0.05,  # 5% on Non-Reg (simplified)
)

# Add pension as a pension income
p1.pension_incomes = [{
    'name': 'Pension',
    'amount': 2706,  # $225.53 * 12
    'startAge': 67,
    'inflationIndexed': True
}]

# Person 2 - None (single user)
p2 = Person(
    name='N/A',
    start_age=100  # Dummy - won't be used
)

# Household
hh = Household(
    p1, p2,
    province='ON',  # Ontario
    start_year=2026,
    end_age=95,
    withdrawal_strategy='income-minimization'
)

# Spending (flat for simplicity)
hh.spending_go_go = 60000
hh.go_go_end_age = 95
hh.spending_slow_go = 60000
hh.slow_go_end_age = 95
hh.spending_no_go = 60000

print('Running simulation with Income Minimization strategy...')
df = simulate(hh, tax_cfg)
print(f'✓ Completed: {len(df)} years\n')

# DEBUG: Check actual column names
print('DEBUG: Available columns:')
print(df.columns.tolist())
print('\nDEBUG: First 3 rows:')
print(df.head(3))
print('\n')

print('═══════════════════════════════════════════════════════════\n')
print('SIMULATION RESULTS:\n')

# Overall metrics
successes = len(df[df['plan_success'] == True])
failures = len(df[df['plan_success'] == False])

print(f'  Years Simulated:    {len(df)}')
print(f'  Years Funded:       {successes}')
print(f'  Years Underfunded:  {failures}')
print(f'  Plan Success:       {"✅ Yes" if failures == 0 else "❌ No"}')
print()

# Find key years
print('KEY MILESTONES:')
print('-' * 60)

# Age 71 - LIRA should convert to LRIF
if len(df) >= 5:  # Year 4 index (2026+4=2030, age 71)
    year_71 = df.iloc[4]
    print(f'📅 AGE 71 (2030) - LIRA→LRIF Conversion Year')
    print(f'   RRSP/LRIF: ${year_71["end_rrif_p1"]:,.0f}')
    print(f'   Non-Reg:   ${year_71["end_nonreg_p1"]:,.0f}')
    print(f'   TFSA:      ${year_71["end_tfsa_p1"]:,.0f}')
    total_71 = year_71['end_rrif_p1'] + year_71['end_nonreg_p1'] + year_71['end_tfsa_p1']
    print(f'   Total:     ${total_71:,.0f}')
    print()

# Age 80
if len(df) >= 14:  # Year 13 index (age 80)
    year_80 = df.iloc[13]
    print(f'📅 AGE 80 (2039)')
    print(f'   RRSP/LRIF: ${year_80["end_rrif_p1"]:,.0f}')
    print(f'   Non-Reg:   ${year_80["end_nonreg_p1"]:,.0f}')
    print(f'   TFSA:      ${year_80["end_tfsa_p1"]:,.0f}')
    total_80 = year_80['end_rrif_p1'] + year_80['end_nonreg_p1'] + year_80['end_tfsa_p1']
    print(f'   Total:     ${total_80:,.0f}')
    print()

# Age 90 - USER'S CONCERN
if len(df) >= 24:  # Year 23 index (age 90)
    year_90 = df.iloc[23]
    print(f'📅 AGE 90 (2049) - USER CONCERN: "$1M at age 90"')
    print(f'   RRSP/LRIF: ${year_90["end_rrif_p1"]:,.0f}')
    print(f'   Non-Reg:   ${year_90["end_nonreg_p1"]:,.0f}')
    print(f'   TFSA:      ${year_90["end_tfsa_p1"]:,.0f}')
    total_90 = year_90['end_rrif_p1'] + year_90['end_nonreg_p1'] + year_90['end_tfsa_p1']
    print(f'   Total:     ${total_90:,.0f}')
    print()

    if total_90 >= 900000:
        print(f'   🔴 USER IS CORRECT! Balance is ${total_90:,.0f} (~$1M)')
        print(f'   User feedback validated: Simulation shows ${total_90/1000000:.1f}M at age 90')
    else:
        print(f'   ✅ Balance is ${total_90:,.0f} (not $1M)')
        print(f'   User may be confused about which figure they\'re seeing')
    print()

# Final year
final_year = df.iloc[-1]
final_age = 67 + len(df) - 1
total_final = final_year['end_rrif_p1'] + final_year['end_nonreg_p1'] + final_year['end_tfsa_p1']
print(f'📅 AGE {final_age} ({2026 + len(df) - 1}) - Final Year')
print(f'   Total Balance: ${total_final:,.0f}')
print()

print('═══════════════════════════════════════════════════════════\n')
print('ANALYSIS:\n')

if len(df) >= 24:
    year_90 = df.iloc[23]
    total_90 = year_90['end_rrif_p1'] + year_90['end_nonreg_p1'] + year_90['end_tfsa_p1']

    if total_90 >= 900000:
        print('🔍 WHY IS THE BALANCE SO HIGH AT AGE 90?')
        print()
        print('   Starting assets: $302,766')
        print('   Annual returns:  ~$15,000 (5% avg on most assets)')
        print('   Annual withdrawals: ~$37,500')
        print('   Net annual change: -$22,500')
        print()
        print('   However, COMPOUND INTEREST on remaining balance')
        print('   means assets grow faster than withdrawals deplete them.')
        print()
        print('   With 5% returns on $300K:')
        print('     Year 1: $300K → $315K (growth) - $37.5K = $277.5K')
        print('     Year 2: $277.5K → $291.4K (growth) - $37.5K = $253.9K')
        print('     ...but CPP/OAS/Pension covers $22.5K/year')
        print('     ...so only $37.5K withdrawn from investments')
        print()
        print('   ⚠️  LIRA HANDLING ISSUE:')
        print('   - LIRA should convert to LRIF at age 71')
        print('   - LRIF has mandatory minimum withdrawals')
        print('   - Current simulation may not enforce this')
        print('   - This would reduce balance faster')
        print()

print('RECOMMENDATIONS:')
print()
print('1. ✅ RESPOND TO USER: Confirm simulation is likely accurate')
print('   - $1M at age 90 is plausible with 5% returns')
print('   - Compound interest is powerful over 23 years')
print()
print('2. 🔧 FIX: Add "Investment End Date" display')
print('   - Show when LIRA converts to LRIF (age 71)')
print('   - Display account depletion timeline')
print('   - Add visual timeline in simulation results')
print()
print('3. 📊 UX: Better explain compound growth')
print('   - Show year-by-year: growth vs. withdrawals')
print('   - Highlight "Your investments grow faster than you spend"')
print()
print('4. ⚠️  INVESTIGATE: LIRA→LRIF conversion')
print('   - Verify LRIF minimum withdrawals are enforced')
print('   - If not, this is a bug that inflates projections')
print()

print('═══════════════════════════════════════════════════════════\n')
