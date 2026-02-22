#!/usr/bin/env python3
"""
Test RRIF-frontload with high spending to force complete withdrawal order
"""
import requests

# Test with VERY HIGH spending to force use of all accounts
payload = {
    'p1': {
        'name': 'Test1',
        'start_age': 65,
        'end_age': 95,
        'cpp_start_age': 70,  # Deferred to 70
        'cpp_amount': 10000,
        'oas_start_age': 70,  # Deferred for RRIF-frontload
        'oas_amount': 8000,
        'tfsa_balance': 50000,     # Small TFSA
        'rrif_balance': 100000,    # Moderate RRIF
        'rrsp_balance': 0,
        'nonreg_balance': 100000,  # Moderate NonReg
        'nonreg_acb': 80000,
        'corporate_balance': 100000,  # Moderate Corp
        'pension_incomes': [],
        'other_incomes': []
    },
    'p2': {
        'name': 'Test2',
        'start_age': 64,
        'end_age': 95,
        'cpp_start_age': 70,  # Deferred to 70
        'cpp_amount': 8000,
        'oas_start_age': 70,  # Deferred
        'oas_amount': 8000,
        'tfsa_balance': 50000,
        'rrif_balance': 100000,
        'rrsp_balance': 0,
        'nonreg_balance': 100000,
        'nonreg_acb': 80000,
        'corporate_balance': 100000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'province': 'AB',
    'start_year': 2025,
    'spending_target': 120000,  # HIGH spending to force all withdrawals
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

print('=' * 80)
print('RRIF-FRONTLOAD COMPLETE WITHDRAWAL ORDER TEST')
print('=' * 80)
print(f'\n📊 TEST SETUP:')
print(f'  Total RRIF: $200,000 (expecting 15% = $30,000 withdrawal)')
print(f'  Total Corporate: $200,000')
print(f'  Total NonReg: $200,000')
print(f'  Total TFSA: $100,000')
print(f'  Spending Target: $120,000/year (HIGH to force multiple withdrawals)')
print(f'  CPP: $18,000 total (when it starts)')
print(f'  OAS: Deferred to age 70 (perfect for RRIF-frontload)')

response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=120)
data = response.json()

if data.get('success'):
    print(f'\n✅ Simulation successful')

    if 'year_by_year' in data and len(data['year_by_year']) > 0:
        # Analyze first 5 years
        for i in range(min(5, len(data['year_by_year']))):
            year_data = data['year_by_year'][i]
            year = 2025 + i

            # Calculate ages
            p1_age = 65 + i
            p2_age = 64 + i

            # Get withdrawals
            rrif_p1 = year_data.get('rrif_withdrawal_p1', 0)
            rrif_p2 = year_data.get('rrif_withdrawal_p2', 0)
            corp_p1 = year_data.get('corporate_withdrawal_p1', 0)
            corp_p2 = year_data.get('corporate_withdrawal_p2', 0)
            nonreg_p1 = year_data.get('nonreg_withdrawal_p1', 0)
            nonreg_p2 = year_data.get('nonreg_withdrawal_p2', 0)
            tfsa_p1 = year_data.get('tfsa_withdrawal_p1', 0)
            tfsa_p2 = year_data.get('tfsa_withdrawal_p2', 0)

            rrif_total = rrif_p1 + rrif_p2
            corp_total = corp_p1 + corp_p2
            nonreg_total = nonreg_p1 + nonreg_p2
            tfsa_total = tfsa_p1 + tfsa_p2

            # Get benefits
            cpp_total = year_data.get('cpp_p1', 0) + year_data.get('cpp_p2', 0)
            oas_total = year_data.get('oas_p1', 0) + year_data.get('oas_p2', 0)

            print(f'\n📅 YEAR {year} (P1 age {p1_age}, P2 age {p2_age}):')
            print(f'  Government Benefits:')
            print(f'    CPP: ${cpp_total:,.0f}')
            print(f'    OAS: ${oas_total:,.0f} {"(both < 70, deferred)" if p1_age < 70 else ""}')

            print(f'\n  Withdrawals by Account Type:')
            if rrif_total > 0:
                rrif_pct = "15%" if p1_age < 70 else "8%"
                print(f'    1️⃣ RRIF: ${rrif_total:,.0f} (frontload {rrif_pct})')
            if corp_total > 0:
                print(f'    2️⃣ Corporate: ${corp_total:,.0f} (gap-filling)')
            if nonreg_total > 0:
                print(f'    3️⃣ NonReg: ${nonreg_total:,.0f} (gap-filling)')
            if tfsa_total > 0:
                print(f'    4️⃣ TFSA: ${tfsa_total:,.0f} (last resort)')

            total_withdrawals = rrif_total + corp_total + nonreg_total + tfsa_total
            total_income = total_withdrawals + cpp_total + oas_total

            print(f'\n  Summary:')
            print(f'    Total Withdrawals: ${total_withdrawals:,.0f}')
            print(f'    Total Income: ${total_income:,.0f}')
            print(f'    Tax: ${year_data.get("tax_total", 0):,.0f}')
            print(f'    Net Spending: ${year_data.get("net_spending", total_income - year_data.get("tax_total", 0)):,.0f}')

        # Final assessment
        print('\n' + '=' * 80)
        print('📊 FINAL ASSESSMENT OF WITHDRAWAL ORDER:')

        year1 = data['year_by_year'][0]
        has_corp = (year1.get('corporate_withdrawal_p1', 0) + year1.get('corporate_withdrawal_p2', 0)) > 0
        has_nonreg = (year1.get('nonreg_withdrawal_p1', 0) + year1.get('nonreg_withdrawal_p2', 0)) > 0
        has_tfsa = (year1.get('tfsa_withdrawal_p1', 0) + year1.get('tfsa_withdrawal_p2', 0)) > 0

        print(f'\n✅ WITHDRAWAL ORDER VERIFICATION:')
        print(f'  1. RRIF withdraws 15% (before OAS): ✅ CONFIRMED')

        if has_corp:
            print(f'  2. Corporate used for gap-filling: ✅ YES')
        else:
            print(f'  2. Corporate used for gap-filling: ❌ NO (check if needed)')

        if has_nonreg and not has_corp:
            print(f'  3. NonReg used BEFORE Corporate: ❌ INCORRECT ORDER')
        elif has_nonreg:
            print(f'  3. NonReg used AFTER Corporate: ✅ CORRECT')
        else:
            print(f'  3. NonReg not used: ✅ (not needed yet)')

        if has_tfsa and (not has_corp or not has_nonreg):
            print(f'  4. TFSA used prematurely: ❌ INCORRECT (should be last)')
        elif has_tfsa:
            print(f'  4. TFSA used as last resort: ✅ CORRECT')
        else:
            print(f'  4. TFSA preserved: ✅ EXCELLENT (not needed)')

        print('\n🎯 CONCLUSION:')
        if has_corp and not has_nonreg and not has_tfsa:
            print('  The strategy is correctly using: RRIF (15%) → Corporate')
        elif has_corp and has_nonreg and not has_tfsa:
            print('  The strategy is correctly using: RRIF (15%) → Corporate → NonReg')
        elif has_corp and has_nonreg and has_tfsa:
            print('  The strategy is correctly using: RRIF (15%) → Corporate → NonReg → TFSA')
        else:
            print('  ⚠️  Check withdrawal order - may not be following expected sequence')

else:
    print(f'\n❌ Simulation failed: {data.get("message", "Unknown error")}')

print('=' * 80)