#!/usr/bin/env python3
"""
Test to reproduce the plan_success bug where years are marked as failed
even though spending is fully funded.
"""

import os
os.environ['MPLBACKEND'] = 'Agg'

from modules.simulation import simulate
from modules.models import Person, Household
from modules.config import load_tax_config

tax_cfg = load_tax_config('tax_config_canada_2025.json')

print('\n╔════════════════════════════════════════════════════════════╗')
print('║         TEST: plan_success Bug Reproduction               ║')
print('╚════════════════════════════════════════════════════════════╝\n')

# Create a simple scenario that should be fully funded
# Single person, age 65, modest spending, adequate assets
p1 = Person(
    name='Test',
    start_age=65,
    cpp_start_age=65,
    cpp_annual_at_start=12000,
    oas_start_age=65,
    oas_annual_at_start=8500,
    tfsa_balance=200000,  # $200K TFSA
    rrif_balance=300000,  # $300K RRIF
    rrsp_balance=0,
    nonreg_balance=150000,  # $150K NonReg
    corporate_balance=0
)

# Dummy person 2 (no assets)
p2 = Person(
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
    corporate_balance=0
)

hh = Household(
    p1, p2,
    province='AB',
    start_year=2025,
    end_age=85,  # Only 20 years
    strategy='minimize-income'
)
hh.has_partner = False

# Conservative spending: $40K/year
hh.spending_go_go = 40000
hh.go_go_end_age = 75
hh.spending_slow_go = 35000
hh.slow_go_end_age = 80
hh.spending_no_go = 30000

print('Scenario:')
print('  Starting Age: 65')
print('  End Age: 85 (20 years)')
print('  Total Assets: $650,000')
print('  Annual Spending: $40K → $35K → $30K')
print('  Government Benefits: CPP $12K + OAS $8.5K = $20.5K/year')
print()

print('Running simulation...')
df = simulate(hh, tax_cfg)
print(f'✓ Completed: {len(df)} years\n')

# Check each year
print('═══════════════════════════════════════════════════════════\n')
print('YEAR-BY-YEAR ANALYSIS:\n')

issues_found = []

for idx, row in df.iterrows():
    year = int(row['year'])
    age = int(row['age_p1'])

    # Get spending data
    spending_gap = float(row.get('spending_gap', 0))
    underfunded = float(row.get('underfunded_after_tax', 0))
    plan_success = bool(row.get('plan_success', True))
    is_underfunded = bool(row.get('is_underfunded', False))

    # Get asset balances
    net_worth = float(row.get('net_worth_end', 0))

    # Check for bug: plan_success=False when spending_gap=0
    if not plan_success and spending_gap == 0:
        issues_found.append({
            'year': year,
            'age': age,
            'spending_gap': spending_gap,
            'underfunded': underfunded,
            'plan_success': plan_success,
            'is_underfunded': is_underfunded,
            'net_worth': net_worth
        })
        print(f'❌ BUG FOUND in {year} (age {age}):')
        print(f'   plan_success={plan_success} BUT spending_gap={spending_gap:.2f}')
        print(f'   underfunded_after_tax={underfunded:.2f}')
        print(f'   is_underfunded={is_underfunded}')
        print(f'   net_worth=${net_worth:,.0f}')
        print()

# Summary
print('═══════════════════════════════════════════════════════════\n')
if issues_found:
    print(f'❌ TEST FAILED: Found {len(issues_found)} years with plan_success bug\n')
    print('SUMMARY OF ISSUES:')
    for issue in issues_found:
        print(f'  Year {issue["year"]} (age {issue["age"]}): '
              f'plan_success={issue["plan_success"]} but spending_gap=${issue["spending_gap"]:.2f}')
    print()
else:
    print(f'✅ TEST PASSED: No plan_success bugs found\n')

# Calculate success rate
successes = len(df[df['plan_success'] == True])
failures = len(df[df['plan_success'] == False])
print(f'Success Rate: {successes}/{len(df)} ({successes/len(df)*100:.1f}%)')
print(f'Years with gaps: {failures}')

# Show first 10 years
print('\n═══════════════════════════════════════════════════════════\n')
print('FIRST 10 YEARS DETAIL:\n')
for idx, row in df.head(10).iterrows():
    year = int(row['year'])
    age = int(row['age_p1'])
    gap = float(row.get('spending_gap', 0))
    success = bool(row.get('plan_success', True))
    net_worth = float(row.get('net_worth_end', 0))

    status = '✅' if success else '❌'
    print(f'{year} (age {age}): {status} gap=${gap:.2f} net_worth=${net_worth:,.0f}')

print()
