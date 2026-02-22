#!/usr/bin/env python3
"""
Trace corporate withdrawal issue
"""

import requests
import json

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

print('TRACING CORPORATE WITHDRAWAL...')
response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)
if response.status_code == 200:
    data = response.json()

    # Print raw response to see structure
    print('\nRAW FIVE YEAR PLAN:')
    if data.get('five_year_plan'):
        for year in data['five_year_plan']:
            print(f"Year {year.get('year', 'N/A')}:")
            print(f"  corp_withdrawal_p1: {year.get('corp_withdrawal_p1', 'NOT FOUND')}")
            print(f"  corporate_p1: {year.get('corporate_p1', 'NOT FOUND')}")
            for key in year.keys():
                if 'corp' in key.lower():
                    print(f"  {key}: {year[key]}")
    else:
        print('  No five_year_plan in response')

    # Print raw JSON for first year
    if data.get('five_year_plan'):
        print('\nFIRST YEAR JSON:')
        print(json.dumps(data['five_year_plan'][0], indent=2))
else:
    print(f'Error: {response.status_code}')
    print(response.text[:500])