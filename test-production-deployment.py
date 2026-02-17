#!/usr/bin/env python3
"""
Test production deployment to verify critical fixes are working
"""
import requests
import json

# Test Rafael's scenario against production
test_payload = {
    'p1': {
        'name': 'Rafael',
        'start_age': 67,
        'cpp_start_age': 67,
        'cpp_annual_at_start': 12492,
        'oas_start_age': 67,
        'oas_annual_at_start': 8904,
        'pension_incomes': [{
            'name': 'Employer Pension',
            'amount': 100000,
            'startAge': 67,
            'inflationIndexed': True
        }],
        'other_incomes': [],
        'tfsa_balance': 0,
        'rrif_balance': 350000,
        'rrsp_balance': 0,
        'nonreg_balance': 0,
        'corporate_balance': 0,
        'tfsa_room_start': 157500,
        'tfsa_contribution_annual': 0,
        'enable_early_rrif_withdrawal': False
    },
    'p2': {'name': '', 'start_age': 67},
    'include_partner': False,
    'province': 'AB',
    'start_year': 2033,
    'end_age': 85,
    'strategy': 'rrif-frontload',
    'spending_go_go': 60000,
    'go_go_end_age': 75,
    'spending_slow_go': 60000,
    'slow_go_end_age': 85,
    'spending_no_go': 50000,
    'spending_inflation': 2.0,
    'general_inflation': 2.0
}

# Minimal p2 fields
for field in ['cpp_start_age', 'cpp_annual_at_start', 'oas_start_age', 'oas_annual_at_start',
              'pension_incomes', 'other_incomes', 'tfsa_balance', 'rrif_balance', 'rrsp_balance',
              'nonreg_balance', 'corporate_balance', 'tfsa_room_start', 'tfsa_contribution_annual',
              'enable_early_rrif_withdrawal']:
    test_payload['p2'][field] = 0 if 'age' not in field else 65
    if field == 'pension_incomes' or field == 'other_incomes':
        test_payload['p2'][field] = []
    if field == 'enable_early_rrif_withdrawal':
        test_payload['p2'][field] = False

print('=' * 70)
print('PRODUCTION DEPLOYMENT VERIFICATION')
print('=' * 70)
print('\nTesting critical fixes on production...\n')

try:
    # Test against production API endpoint
    response = requests.post(
        'https://www.retirezest.com/api/simulation/run',
        json=test_payload,
        timeout=30
    )

    if response.status_code == 200:
        result = response.json()
        year_2033 = result.get('year_by_year', [])[0] if result.get('year_by_year') else {}

        # Extract key values
        employer_pension = year_2033.get('employer_pension_p1', 0)
        gis = year_2033.get('gis_p1', 0)
        tfsa_reinvest = year_2033.get('tfsa_reinvest_p1', 0)
        spending = year_2033.get('spending_need', 0)
        total_tax = year_2033.get('total_tax', 0)

        print('Production Results for 2033:')
        print(f'  Employer Pension: ${employer_pension:,.0f}')
        print(f'  GIS Benefits: ${gis:,.0f}')
        print(f'  TFSA Reinvestment: ${tfsa_reinvest:,.0f}')
        print(f'  Spending Need: ${spending:,.0f}')
        print(f'  Total Tax: ${total_tax:,.0f}')
        print()

        # Verify fixes
        tests_passed = []
        tests_failed = []

        # Test 1: GIS should be $0 for high-income individual
        if gis == 0:
            tests_passed.append('GIS correctly $0 for Rafael with $100k pension')
        else:
            tests_failed.append(f'GIS should be $0 but is ${gis:,.0f}')

        # Test 2: TFSA allocation should be reasonable (~$43k)
        if tfsa_reinvest > 30000 and tfsa_reinvest < 50000:
            tests_passed.append(f'TFSA allocation reasonable (${tfsa_reinvest:,.0f})')
        elif tfsa_reinvest > 100000:
            tests_failed.append(f'TFSA allocation too high (${tfsa_reinvest:,.0f}) - likely surplus bug')
        else:
            tests_failed.append(f'TFSA allocation unexpected: ${tfsa_reinvest:,.0f}')

        # Test 3: Spending target should remain at $60k
        if spending == 60000:
            tests_passed.append('Spending target correctly maintained at $60k')
        else:
            tests_failed.append(f'Spending target incorrect: ${spending:,.0f}')

        print('Verification Results:')
        for test in tests_passed:
            print(f'  ✅ {test}')
        for test in tests_failed:
            print(f'  ❌ {test}')

        print()
        if not tests_failed:
            print('🎉 ALL CRITICAL FIXES VERIFIED IN PRODUCTION!')
            print('   - GIS eligibility fix: Working')
            print('   - Surplus allocation fix: Working')
            print('   - Spending target fix: Working')
        else:
            print(f'⚠️  {len(tests_failed)} issue(s) detected in production')
            print('   Please check deployment status')

    else:
        print(f'❌ API returned status {response.status_code}')
        print('Response:', response.text[:500])

except Exception as e:
    print(f'❌ Error testing production: {e}')

print('\n' + '=' * 70)