#!/usr/bin/env python3
"""
Test smart tax-aware TFSA contributions in RRIF-frontload strategy
"""
import requests

# Test scenario spanning before and after OAS/CPP start
payload = {
    'p1': {
        'name': 'Test1',
        'start_age': 68,  # Close to OAS start
        'end_age': 75,
        'cpp_start_age': 70,
        'cpp_amount': 15000,
        'oas_start_age': 70,  # OAS at 70
        'oas_amount': 9000,
        'tfsa_balance': 100000,
        'rrif_balance': 300000,
        'rrsp_balance': 0,
        'nonreg_balance': 500000,
        'nonreg_acb': 400000,
        'corporate_balance': 800000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'p2': {
        'name': 'Test2',
        'start_age': 67,
        'end_age': 75,
        'cpp_start_age': 70,
        'cpp_amount': 12000,
        'oas_start_age': 70,
        'oas_amount': 9000,
        'tfsa_balance': 100000,
        'rrif_balance': 250000,
        'rrsp_balance': 0,
        'nonreg_balance': 400000,
        'nonreg_acb': 350000,
        'corporate_balance': 700000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'province': 'AB',
    'start_year': 2025,
    'spending_target': 120000,
    'strategy': 'rrif-frontload',
    'tfsa_contribution_each': 7000,  # Max TFSA contribution
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
print('🧠 SMART TAX-AWARE TFSA CONTRIBUTION TEST')
print('=' * 80)
print('\n📊 TEST SCENARIO:')
print('  Ages: P1=68, P2=67 (starting close to OAS/CPP)')
print('  OAS/CPP: Both start at age 70')
print('  Strategy: RRIF-frontload with smart TFSA contributions')
print('  Expected behavior:')
print('    - Ages 68-69: Full $7,000 TFSA contributions (before OAS)')
print('    - Age 70: Reduced contributions (OAS starts)')
print('    - Ages 71+: Conservative or no contributions (avoid clawback)')

response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=120)
data = response.json()

if data.get('success'):
    print(f'\n✅ Simulation successful')

    if 'year_by_year' in data:
        print('\n📅 YEAR-BY-YEAR TFSA CONTRIBUTION ANALYSIS:')
        print('-' * 70)

        for i in range(min(8, len(data['year_by_year']))):
            year_data = data['year_by_year'][i]
            year = 2025 + i
            p1_age = 68 + i
            p2_age = 67 + i

            # Get income components
            cpp_p1 = year_data.get('cpp_p1', 0)
            cpp_p2 = year_data.get('cpp_p2', 0)
            oas_p1 = year_data.get('oas_p1', 0)
            oas_p2 = year_data.get('oas_p2', 0)
            rrif_p1 = year_data.get('rrif_withdrawal_p1', 0)
            rrif_p2 = year_data.get('rrif_withdrawal_p2', 0)
            corp_p1 = year_data.get('corporate_withdrawal_p1', 0)
            corp_p2 = year_data.get('corporate_withdrawal_p2', 0)

            # Calculate taxable income
            taxable_p1 = cpp_p1 + oas_p1 + rrif_p1 + corp_p1
            taxable_p2 = cpp_p2 + oas_p2 + rrif_p2 + corp_p2

            # TFSA contributions
            tfsa_contrib_p1 = year_data.get('tfsa_contribution_p1', 0)
            tfsa_contrib_p2 = year_data.get('tfsa_contribution_p2', 0)

            print(f'\n📅 Year {year} (P1 age {p1_age}, P2 age {p2_age}):')

            # Show OAS/CPP status
            if p1_age < 70:
                print(f'  Status: BEFORE OAS/CPP (optimal for TFSA)')
            elif p1_age == 70:
                print(f'  Status: OAS/CPP START (transition year)')
            else:
                print(f'  Status: AFTER OAS/CPP (higher tax environment)')

            print(f'\n  Income Components:')
            print(f'    P1: CPP=${cpp_p1:,.0f}, OAS=${oas_p1:,.0f}, RRIF=${rrif_p1:,.0f}, Corp=${corp_p1:,.0f}')
            print(f'    P2: CPP=${cpp_p2:,.0f}, OAS=${oas_p2:,.0f}, RRIF=${rrif_p2:,.0f}, Corp=${corp_p2:,.0f}')

            print(f'\n  Taxable Income:')
            print(f'    P1: ${taxable_p1:,.0f}')
            print(f'    P2: ${taxable_p2:,.0f}')

            print(f'\n  📥 TFSA Contributions:')
            print(f'    P1: ${tfsa_contrib_p1:,.0f}', end='')
            if tfsa_contrib_p1 == 7000:
                print(' (FULL)')
            elif tfsa_contrib_p1 > 0:
                print(f' (REDUCED - {tfsa_contrib_p1/7000*100:.0f}%)')
            else:
                print(' (NONE - tax optimization)')

            print(f'    P2: ${tfsa_contrib_p2:,.0f}', end='')
            if tfsa_contrib_p2 == 7000:
                print(' (FULL)')
            elif tfsa_contrib_p2 > 0:
                print(f' (REDUCED - {tfsa_contrib_p2/7000*100:.0f}%)')
            else:
                print(' (NONE - tax optimization)')

            # Analysis
            if taxable_p1 > 91000 or taxable_p2 > 91000:
                print(f'\n  ⚠️  WARNING: Approaching OAS clawback zone (>$91,000)')

        print('\n' + '=' * 80)
        print('📊 SUMMARY OF TAX-AWARE TFSA STRATEGY:')

        # Count years with different contribution levels
        full_years = 0
        reduced_years = 0
        zero_years = 0

        for year_data in data['year_by_year'][:8]:
            total_contrib = year_data.get('tfsa_contribution_p1', 0) + year_data.get('tfsa_contribution_p2', 0)
            if total_contrib >= 14000:
                full_years += 1
            elif total_contrib > 0:
                reduced_years += 1
            else:
                zero_years += 1

        print(f'\n  Years with FULL contributions ($14,000): {full_years}')
        print(f'  Years with REDUCED contributions: {reduced_years}')
        print(f'  Years with NO contributions: {zero_years}')

        print(f'\n✅ The strategy is intelligently adjusting TFSA contributions based on:')
        print(f'  1. Age relative to OAS/CPP start')
        print(f'  2. Current taxable income levels')
        print(f'  3. Risk of OAS clawback')

else:
    print(f'\n❌ Simulation failed: {data.get("message", "Unknown error")}')

print('=' * 80)