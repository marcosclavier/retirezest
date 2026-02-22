#!/usr/bin/env python3
"""
Test RRIF rates at multiple ages
"""

import requests
import json

def test_rrif_at_age(age, expected_rate):
    """Test RRIF rate at a specific age"""

    payload = {
        'p1': {
            'name': 'Test User',
            'start_age': age,
            'rrif_balance': 100000,  # $100k for easy percentage calc
            'tfsa_balance': 0,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 0,
            'corp_cash_bucket': 0,
            'corp_gic_bucket': 0,
            'corp_invest_bucket': 0,
            'corporate_balance': 0,
            'cpp_start_age': age,
            'cpp_annual_at_start': 10000,
            'oas_start_age': age,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': 'Dummy',
            'start_age': 65,
            'rrif_balance': 0,
            'tfsa_balance': 0,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 0,
            'corp_cash_bucket': 0,
            'corp_gic_bucket': 0,
            'corp_invest_bucket': 0,
            'corporate_balance': 0,
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
        'end_age': age + 1,  # Just simulate 1 year
        'strategy': 'balanced',
        'spending_go_go': 50000,
        'spending_slow_go': 50000,
        'slow_go_end_age': 85,
        'spending_no_go': 50000,
        'go_go_end_age': 75,
        'spending_inflation': 0,
        'general_inflation': 0,
        'tfsa_contribution_each': 0
    }

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        return {'age': age, 'status': 'ERROR', 'actual_rate': 0}

    data = response.json()

    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]
        rrif_withdrawal = year1.get('rrif_withdrawal_p1', 0)
        rrif_balance = year1.get('rrif_start_p1', 100000)

        actual_rate = (rrif_withdrawal / rrif_balance) * 100 if rrif_balance > 0 else 0
        status = 'PASS' if abs(actual_rate - expected_rate) < 0.05 else 'FAIL'

        return {
            'age': age,
            'expected_rate': expected_rate,
            'actual_rate': actual_rate,
            'withdrawal': rrif_withdrawal,
            'status': status
        }

    return {'age': age, 'status': 'NO DATA', 'actual_rate': 0}

def main():
    print("="*80)
    print("TESTING RRIF MINIMUM RATES AT MULTIPLE AGES")
    print("="*80)

    # Test key ages based on CRA table
    test_cases = [
        (65, 4.00),   # 4.00% at 65
        (70, 5.00),   # 5.00% at 70
        (71, 5.28),   # 5.28% at 71
        (75, 5.82),   # 5.82% at 75
        (80, 6.82),   # 6.82% at 80
        (85, 8.51),   # 8.51% at 85
        (90, 12.15),  # 12.15% at 90
        (95, 20.00),  # 20.00% at 95+
    ]

    print("\nTesting RRIF rates at key ages...")
    print("-"*80)

    results = []
    for age, expected_rate in test_cases:
        print(f"Testing age {age}...", end=' ')
        result = test_rrif_at_age(age, expected_rate)
        results.append(result)
        print(f"{result['status']}")

    # Display results table
    print("\n" + "="*80)
    print("RESULTS SUMMARY")
    print("="*80)
    print(f"\n{'Age':<5} {'CRA Rate':<10} {'Actual Rate':<12} {'Withdrawal':<12} {'Status':<10}")
    print("-"*60)

    all_pass = True
    for r in results:
        if r['status'] != 'PASS':
            all_pass = False

        if r['status'] != 'ERROR' and r['status'] != 'NO DATA':
            print(f"{r['age']:<5} {r['expected_rate']:>7.2f}%  {r['actual_rate']:>9.2f}%  ${r['withdrawal']:>10,.0f}  {r['status']:<10}")
        else:
            print(f"{r['age']:<5} {'N/A':<10} {'N/A':<12} {'N/A':<12} {r['status']:<10}")

    # Final verdict
    print("\n" + "="*80)
    if all_pass:
        print("✅ ALL RRIF RATES MATCH CRA MINIMUM VALUES!")
    else:
        print("❌ SOME RRIF RATES DO NOT MATCH CRA VALUES")
        print("\nFailed ages:")
        for r in results:
            if r['status'] != 'PASS':
                print(f"  • Age {r['age']}: {r['status']}")
    print("="*80)

    return all_pass

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)