#!/usr/bin/env python3
"""
Test RRIF-frontload withdrawal order
"""
import requests

# Test with spending target that requires gap-filling
payload = {
    'p1': {
        'name': 'Juan',
        'start_age': 66,
        'end_age': 95,
        'cpp_start_age': 66,
        'cpp_amount': 15000,
        'oas_start_age': 70,
        'oas_amount': 8904,
        'tfsa_balance': 182000,
        'rrif_balance': 185000,
        'rrsp_balance': 0,
        'nonreg_balance': 415000,
        'nonreg_acb': 350000,
        'corporate_balance': 1195000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'p2': {
        'name': 'Daniela',
        'start_age': 65,
        'end_age': 95,
        'cpp_start_age': 65,
        'cpp_amount': 12000,
        'oas_start_age': 70,
        'oas_amount': 8904,
        'tfsa_balance': 220000,
        'rrif_balance': 260000,
        'rrsp_balance': 0,
        'nonreg_balance': 415000,
        'nonreg_acb': 350000,
        'corporate_balance': 1195000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'province': 'AB',
    'start_year': 2025,
    'spending_target': 150000,  # High spending to force gap-filling
    'strategy': 'rrif-frontload',
    'inflation_general': 2.0,
    'return_rrif': 5.0,
    'return_nonreg': 5.0,
    'return_tfsa': 4.0,
    'return_corporate': 5.0,
    'nonreg_interest_pct': 20.0,
    'nonreg_elig_div_pct': 30.0,
    'nonreg_capg_dist_pct': 50.0,
    'reinvest_nonreg_dist': False
}

response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=120)
data = response.json()

if 'year_by_year' in data and len(data['year_by_year']) > 0:
    print('=' * 80)
    print('RRIF-FRONTLOAD STRATEGY - WITHDRAWAL ORDER VERIFICATION')
    print('=' * 80)
    print(f'\n🎯 Spending Target: $150,000/year')

    # Check first 3 years
    for i in range(min(3, len(data['year_by_year']))):
        year_data = data['year_by_year'][i]
        year = 2025 + i

        # Get all income sources
        cpp_total = year_data.get('cpp_p1', 0) + year_data.get('cpp_p2', 0)
        oas_total = year_data.get('oas_p1', 0) + year_data.get('oas_p2', 0)
        rrif_total = year_data.get('rrif_withdrawal_p1', 0) + year_data.get('rrif_withdrawal_p2', 0)
        corp_total = year_data.get('corporate_withdrawal_p1', 0) + year_data.get('corporate_withdrawal_p2', 0)
        nonreg_total = year_data.get('nonreg_withdrawal_p1', 0) + year_data.get('nonreg_withdrawal_p2', 0)
        tfsa_total = year_data.get('tfsa_withdrawal_p1', 0) + year_data.get('tfsa_withdrawal_p2', 0)

        gross_income = cpp_total + oas_total + rrif_total + corp_total + nonreg_total + tfsa_total
        tax = year_data.get('tax_total', 0)
        net_income = year_data.get('net_spending', gross_income - tax)

        print(f'\n📅 YEAR {year}:')
        print(f'\n  Income Sources:')
        print(f'    CPP: ${cpp_total:,.0f}')
        print(f'    OAS: ${oas_total:,.0f}')
        print(f'    RRIF: ${rrif_total:,.0f}')
        print(f'    Corporate: ${corp_total:,.0f}')
        print(f'    NonReg: ${nonreg_total:,.0f}')
        print(f'    TFSA: ${tfsa_total:,.0f}')
        print(f'    ----------------------')
        print(f'    Gross Income: ${gross_income:,.0f}')
        print(f'    Tax: ${tax:,.0f}')
        print(f'    Net Spending: ${net_income:,.0f}')

        # Check withdrawal order
        print(f'\n  ✅ WITHDRAWAL ORDER:')
        if rrif_total > 0:
            print(f'    1️⃣ RRIF: ${rrif_total:,.0f} (frontload)')
        if corp_total > 0:
            print(f'    2️⃣ Corporate: ${corp_total:,.0f} (gap-fill)')
        if nonreg_total > 0:
            print(f'    3️⃣ NonReg: ${nonreg_total:,.0f} (gap-fill)')
        if tfsa_total > 0:
            print(f'    4️⃣ TFSA: ${tfsa_total:,.0f} (last resort)')

    # Summary assessment
    print('\n' + '=' * 80)
    print('📊 WITHDRAWAL ORDER ASSESSMENT:')

    year1 = data['year_by_year'][0]
    corp1 = year1.get('corporate_withdrawal_p1', 0) + year1.get('corporate_withdrawal_p2', 0)
    nonreg1 = year1.get('nonreg_withdrawal_p1', 0) + year1.get('nonreg_withdrawal_p2', 0)
    tfsa1 = year1.get('tfsa_withdrawal_p1', 0) + year1.get('tfsa_withdrawal_p2', 0)

    if corp1 > 0:
        print('  ✅ Corporate is being used for gap-filling (CORRECT)')
    else:
        print('  ⚠️  No Corporate withdrawals in Year 1')

    if nonreg1 > 0 and corp1 == 0:
        print('  ❌ NonReg used before Corporate (INCORRECT ORDER)')
    elif nonreg1 > 0:
        print('  ✅ NonReg used after Corporate (CORRECT)')

    if tfsa1 > 0 and (corp1 == 0 or nonreg1 == 0):
        print('  ❌ TFSA used before exhausting Corp/NonReg (INCORRECT)')
    elif tfsa1 > 0:
        print('  ✅ TFSA used as last resort (CORRECT)')
    elif tfsa1 == 0:
        print('  ✅ TFSA preserved (not needed for gap-filling)')

    print('=' * 80)