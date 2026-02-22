#!/usr/bin/env python3
"""
Debug test with verbose output
"""

import requests
import sys

payload = {
    'p1': {
        'name': 'Test',
        'start_age': 65,
        'rrif_balance': 100000,
        'tfsa_balance': 50000,
        'nr_cash': 0,
        'nr_gic': 0,
        'nr_invest': 100000,
        'corp_cash_bucket': 100000,
        'corp_gic_bucket': 0,
        'corp_invest_bucket': 100000,
        'cpp_start_age': 65,
        'cpp_annual_at_start': 10000,
        'oas_start_age': 65,
        'oas_annual_at_start': 8000,
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
    'spending_go_go': 100000,
    'spending_slow_go': 90000,
    'slow_go_end_age': 85,
    'spending_no_go': 80000,
    'go_go_end_age': 75,
    'spending_inflation': 2,
    'general_inflation': 2,
    'tfsa_contribution_each': 0
}

print('Sending request with:', file=sys.stderr)
print(f'  Strategy: {payload["strategy"]}', file=sys.stderr)
print(f'  Spending: ${payload["spending_go_go"]:,}', file=sys.stderr)
print(f'  Corporate total: $200k', file=sys.stderr)
print(f'  Include partner: {payload["include_partner"]}', file=sys.stderr)
print(f'  Corp buckets: cash=$100k, invest=$100k', file=sys.stderr)

response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)
if response.status_code == 200:
    data = response.json()
    year1 = data.get('five_year_plan', [{}])[0]
    print(f'\nYear 1 Results:')
    print(f'  Corporate withdrawal: ${year1.get("corp_withdrawal_p1", 0):,.2f}')
    print(f'  RRIF withdrawal: ${year1.get("rrif_withdrawal_p1", 0):,.2f}')
    print(f'  NonReg withdrawal: ${year1.get("nonreg_withdrawal_p1", 0):,.2f}')
    print(f'  TFSA withdrawal: ${year1.get("tfsa_withdrawal_p1", 0):,.2f}')
    print(f'  Total withdrawals: ${year1.get("total_withdrawn_p1", 0):,.2f}')
    print(f'\n  Spending target: ${year1.get("spending_target", 0):,.2f}')
    print(f'  Spending P1: ${year1.get("spending_target_p1", 0):,.2f}')
    print(f'  CPP+OAS: ${year1.get("cpp_p1", 0) + year1.get("oas_p1", 0):,.2f}')

    # Calculate needed
    spending_p1 = year1.get("spending_target_p1", 0)
    income = year1.get("cpp_p1", 0) + year1.get("oas_p1", 0)
    needed = spending_p1 - income
    total_wd = year1.get("total_withdrawn_p1", 0)

    print(f'\n  Needed after income: ${needed:,.2f}')
    print(f'  Actual withdrawals: ${total_wd:,.2f}')
    print(f'  Shortfall: ${needed - total_wd:,.2f}')

    # Check balances
    print(f'\n  End balances:')
    print(f'    Corporate: ${year1.get("corporate_p1", 0):,.2f}')
    print(f'    RRIF: ${year1.get("rrif_p1", 0):,.2f}')
    print(f'    NonReg: ${year1.get("nonreg_p1", 0):,.2f}')
    print(f'    TFSA: ${year1.get("tfsa_p1", 0):,.2f}')

    # Diagnosis
    print(f'\n📊 DIAGNOSIS:')
    if year1.get("corp_withdrawal_p1", 0) == 0:
        print('  ❌ Corporate NOT being used (should be first)')
    else:
        print('  ✅ Corporate being used')

    if needed > total_wd + 100:  # Allow small rounding difference
        print(f'  ❌ MAJOR ISSUE: Only withdrawing ${total_wd:,.2f} but need ${needed:,.2f}')
        print(f'     Missing ${needed - total_wd:,.2f} in withdrawals!')
    else:
        print('  ✅ Withdrawals meeting spending needs')

else:
    print(f'Error: {response.status_code}')