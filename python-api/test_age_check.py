#!/usr/bin/env python3
"""
Check ages in the simulation - Juan should be 1 year older than Daniela
Juan born 1960, Daniela born 1961
"""

import requests
import json

def check_ages():
    """Check if ages are correct"""

    print("="*80)
    print("AGE VERIFICATION TEST")
    print("="*80)

    # Juan & Daniela with correct birth years
    payload = {
        'p1': {
            'name': 'Juan',
            'start_age': 66,  # Juan is 66 in 2026 (born 1960)
            'rrif_balance': 189000,
            'tfsa_balance': 192200,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 448200,
            'corp_cash_bucket': 400000,
            'corp_gic_bucket': 400000,
            'corp_invest_bucket': 422000,
            'corporate_balance': 0,
            'cpp_start_age': 70,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': 'Daniela',
            'start_age': 65,  # Daniela is 65 in 2026 (born 1961)
            'rrif_balance': 263000,
            'tfsa_balance': 221065,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 448200,
            'corp_cash_bucket': 400000,
            'corp_gic_bucket': 400000,
            'corp_invest_bucket': 422000,
            'corporate_balance': 0,
            'cpp_start_age': 70,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': True,
        'province': 'AB',
        'start_year': 2026,
        'end_age': 95,
        'strategy': 'corporate-optimized',
        'spending_go_go': 153700,
        'spending_slow_go': 120000,
        'slow_go_end_age': 85,
        'spending_no_go': 100000,
        'go_go_end_age': 75,
        'spending_inflation': 2.5,
        'general_inflation': 2.5,
        'tfsa_contribution_each': 7000
    }

    print("\n📊 CORRECT AGES:")
    print("  • Juan: Born 1960, Age 66 in 2026")
    print("  • Daniela: Born 1961, Age 65 in 2026")
    print("  • Format should show: 66/65 in 2026")

    print("\n⏳ Running simulation...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()

    # Check first few years
    print("\n" + "="*80)
    print("YEAR-BY-YEAR AGE CHECK")
    print("="*80)
    print(f"\n{'Year':<10} {'Juan Age':<15} {'Daniela Age':<15} {'Display':<15} {'Expected':<15} {'Status':<10}")
    print("-"*85)

    if data.get('year_by_year'):
        for i in range(min(5, len(data['year_by_year']))):
            year_data = data['year_by_year'][i]
            year = 2026 + i

            age_p1 = year_data.get('age_p1', 0)
            age_p2 = year_data.get('age_p2', 0)

            expected_juan = 66 + i
            expected_daniela = 65 + i

            display = f"{age_p1}/{age_p2}"
            expected = f"{expected_juan}/{expected_daniela}"

            status = "✅" if display == expected else "❌ WRONG!"

            print(f"{year:<10} {age_p1:<15} {age_p2:<15} {display:<15} {expected:<15} {status:<10}")

    print("\n" + "="*80)
    print("DIAGNOSIS")
    print("="*80)

    print("\nIf ages are showing incorrectly:")
    print("  1. Check if start_age is being set correctly in the frontend")
    print("  2. Juan should have start_age: 66")
    print("  3. Daniela should have start_age: 65")
    print("  4. The API is returning the ages it receives")

if __name__ == '__main__':
    check_ages()