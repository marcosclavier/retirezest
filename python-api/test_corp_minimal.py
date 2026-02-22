#!/usr/bin/env python3
"""
Minimal test for Corporate withdrawals
"""

import requests
import sys

# Minimal test - just corporate and spending
payload = {
    'p1': {
        'name': 'Test',
        'start_age': 65,
        'rrif_balance': 0,  # No RRIF
        'tfsa_balance': 0,  # No TFSA
        'nr_cash': 0,
        'nr_gic': 0,
        'nr_invest': 0,  # No NonReg
        'corp_cash_bucket': 100000,  # Only Corporate
        'corp_gic_bucket': 0,
        'corp_invest_bucket': 0,
        'cpp_start_age': 65,
        'cpp_annual_at_start': 0,  # No CPP
        'oas_start_age': 65,
        'oas_annual_at_start': 0,  # No OAS
        'pension_incomes': [],
        'other_incomes': []
    },
    'p2': {
        'name': '',
        'start_age': 65,
        'rrif_balance': 0,
        'tfsa_balance': 0,
        'nr_cash': 0,
        'nr_gic': 0,
        'nr_invest': 0,
        'corp_cash_bucket': 0,
        'corp_gic_bucket': 0,
        'corp_invest_bucket': 0,
        'cpp_start_age': 65,
        'cpp_annual_at_start': 0,
        'oas_start_age': 65,
        'oas_annual_at_start': 0,
        'pension_incomes': [],
        'other_incomes': []
    },
    'include_partner': False,
    'province': 'ON',
    'start_year': 2026,
    'end_age': 70,
    'strategy': 'corporate-optimized',
    'spending_go_go': 50000,  # Need $50k
    'spending_slow_go': 50000,
    'slow_go_end_age': 85,
    'spending_no_go': 50000,
    'go_go_end_age': 75,
    'spending_inflation': 0,  # No inflation
    'general_inflation': 0,
    'tfsa_contribution_each': 0
}

print('MINIMAL TEST - ONLY CORPORATE', file=sys.stderr)
print('=' * 50, file=sys.stderr)
print('Corporate: $100,000', file=sys.stderr)
print('Other assets: $0', file=sys.stderr)
print('Income: $0', file=sys.stderr)
print('Spending need: $50,000', file=sys.stderr)
print('Expected: Corporate withdrawal = $50,000', file=sys.stderr)
print('=' * 50, file=sys.stderr)

response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)
if response.status_code == 200:
    data = response.json()
    year1 = data.get('five_year_plan', [{}])[0]

    corp_wd = year1.get('corp_withdrawal_p1', 0)
    total_wd = year1.get('total_withdrawn_p1', 0)

    print(f'\nRESULT:')
    print(f'  Corporate withdrawal: ${corp_wd:,.2f}')
    print(f'  Total withdrawals: ${total_wd:,.2f}')

    if corp_wd > 0:
        print(f'\n✅ SUCCESS: Corporate is being used!')
    else:
        print(f'\n❌ FAILURE: Corporate withdrawal is $0 despite being only asset')
        print(f'    This is a CRITICAL BUG - no other assets available!')
else:
    print(f'Error: {response.status_code}')