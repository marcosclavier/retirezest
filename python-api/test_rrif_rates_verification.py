#!/usr/bin/env python3
"""
Test to verify RRIF minimum rates match CRA values
"""

import requests
import json

# CRA Official RRIF minimum rates for 2026+
CRA_RATES = {
    71: 0.0528,  # 5.28%
    72: 0.0540,  # 5.40%
    73: 0.0553,  # 5.53%
    74: 0.0567,  # 5.67%
    75: 0.0582,  # 5.82%
    76: 0.0598,  # 5.98%
    77: 0.0617,  # 6.17%
    78: 0.0636,  # 6.36%
    79: 0.0658,  # 6.58%
    80: 0.0682,  # 6.82%
    81: 0.0708,  # 7.08%
    82: 0.0738,  # 7.38%
    83: 0.0771,  # 7.71%
    84: 0.0808,  # 8.08%
    85: 0.0851,  # 8.51%
    86: 0.0899,  # 8.99%
    87: 0.0958,  # 9.58%
    88: 0.1027,  # 10.27%
    89: 0.1111,  # 11.11%
    90: 0.1215,  # 12.15%
    91: 0.1351,  # 13.51%
    92: 0.1540,  # 15.40%
    93: 0.1785,  # 17.85%
    94: 0.2000,  # 20.00%
    95: 0.2000   # 20.00%
}

def test_rrif_rates():
    """Test RRIF minimum rates at various ages"""

    print("TESTING RRIF MINIMUM RATES vs CRA VALUES")
    print("="*60)

    # Test scenario with RRIF account
    test_ages = [71, 75, 80, 85, 90]
    results = []

    for age in test_ages:
        payload = {
            'p1': {
                'name': 'Test User',
                'start_age': age,
                'rrif_balance': 1000000,  # $1M for easy percentage calc
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
            'spending_go_go': 50000,  # Low spending to see minimum
            'spending_slow_go': 50000,
            'slow_go_end_age': 85,
            'spending_no_go': 50000,
            'go_go_end_age': 75,
            'spending_inflation': 0,  # No inflation for cleaner test
            'general_inflation': 0,
            'tfsa_contribution_each': 0
        }

        response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

        if response.status_code != 200:
            print(f"❌ API Error for age {age}: {response.status_code}")
            continue

        data = response.json()

        if data.get('year_by_year') and len(data['year_by_year']) > 0:
            year_data = data['year_by_year'][0]

            # Get RRIF withdrawal
            rrif_withdrawal = year_data.get('rrif_withdrawal_p1', 0)
            rrif_balance = year_data.get('rrif_start_p1', 1000000)

            # Calculate actual rate
            actual_rate = rrif_withdrawal / rrif_balance if rrif_balance > 0 else 0
            expected_rate = CRA_RATES.get(age, 0)

            # Check if rates match (within 0.01% tolerance for rounding)
            rates_match = abs(actual_rate - expected_rate) < 0.0001

            results.append({
                'age': age,
                'expected_rate': expected_rate,
                'actual_rate': actual_rate,
                'expected_withdrawal': rrif_balance * expected_rate,
                'actual_withdrawal': rrif_withdrawal,
                'matches': rates_match
            })

    # Display results
    print("\n📊 RRIF MINIMUM RATE COMPARISON:")
    print("-"*60)
    print(f"{'Age':<5} {'CRA Rate':<10} {'Actual Rate':<12} {'Expected $':<12} {'Actual $':<12} {'Status':<10}")
    print("-"*60)

    all_pass = True
    for r in results:
        status = "✅ PASS" if r['matches'] else "❌ FAIL"
        if not r['matches']:
            all_pass = False

        print(f"{r['age']:<5} {r['expected_rate']*100:>7.2f}%  {r['actual_rate']*100:>9.2f}%  ${r['expected_withdrawal']:>10,.0f}  ${r['actual_withdrawal']:>10,.0f}  {status}")

    print("\n" + "="*60)
    if all_pass:
        print("✅ ALL RRIF MINIMUM RATES MATCH CRA VALUES!")
    else:
        print("❌ SOME RRIF RATES DO NOT MATCH CRA VALUES")
    print("="*60)

if __name__ == '__main__':
    test_rrif_rates()