#!/usr/bin/env python3
"""
Test RRIF rate at age 65 specifically
"""

import requests
import json

def test_age_65():
    """Test RRIF minimum rate at age 65 (should be 4.00%)"""

    print("="*60)
    print("TESTING RRIF RATE AT AGE 65")
    print("="*60)

    # Juan & Daniela scenario - both age 65
    payload = {
        'p1': {
            'name': 'Juan',
            'start_age': 65,
            'rrif_balance': 189000,  # Test with Juan's actual RRIF balance
            'tfsa_balance': 192200,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 448200,
            'corp_cash_bucket': 400000,
            'corp_gic_bucket': 400000,
            'corp_invest_bucket': 422000,
            'corporate_balance': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': 'Daniela',
            'start_age': 65,
            'rrif_balance': 263000,  # Test with Daniela's actual RRIF balance
            'tfsa_balance': 221065,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 448200,
            'corp_cash_bucket': 400000,
            'corp_gic_bucket': 400000,
            'corp_invest_bucket': 422000,
            'corporate_balance': 0,
            'cpp_start_age': 66,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 66,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': True,
        'province': 'ON',
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

    print("\nScenario: Juan & Daniela (both age 65)")
    print("Juan's RRIF: $189,000")
    print("Daniela's RRIF: $263,000")
    print("\nExpected CRA minimum rate at 65: 4.00%")
    print("-"*60)

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        return False

    data = response.json()

    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        # Check Juan's RRIF
        rrif_start1 = year1.get('rrif_start_p1', 189000)
        rrif_withdrawal1 = year1.get('rrif_withdrawal_p1', 0)
        rate1 = (rrif_withdrawal1 / rrif_start1) * 100 if rrif_start1 > 0 else 0

        print(f"\n📊 JUAN (Age 65):")
        print(f"  RRIF Balance: ${rrif_start1:,.0f}")
        print(f"  RRIF Withdrawal: ${rrif_withdrawal1:,.0f}")
        print(f"  Effective Rate: {rate1:.2f}%")
        print(f"  Expected: 4.00%")
        print(f"  Status: {'✅ PASS' if abs(rate1 - 4.00) < 0.1 else '❌ FAIL'}")

        # Check Daniela's RRIF
        rrif_start2 = year1.get('rrif_start_p2', 263000)
        rrif_withdrawal2 = year1.get('rrif_withdrawal_p2', 0)
        rate2 = (rrif_withdrawal2 / rrif_start2) * 100 if rrif_start2 > 0 else 0

        print(f"\n📊 DANIELA (Age 65):")
        print(f"  RRIF Balance: ${rrif_start2:,.0f}")
        print(f"  RRIF Withdrawal: ${rrif_withdrawal2:,.0f}")
        print(f"  Effective Rate: {rate2:.2f}%")
        print(f"  Expected: 4.00%")
        print(f"  Status: {'✅ PASS' if abs(rate2 - 4.00) < 0.1 else '❌ FAIL'}")

        # Overall verdict
        print("\n" + "="*60)
        print("VERDICT")
        print("="*60)

        if abs(rate1 - 4.00) < 0.1 and abs(rate2 - 4.00) < 0.1:
            print("\n✅ SUCCESS! RRIF rates now match CRA minimum of 4.00% at age 65")
            return True
        else:
            print("\n❌ RRIF rates still not matching CRA minimum")
            return False
    else:
        print("❌ No year-by-year data available")
        return False

if __name__ == '__main__':
    success = test_age_65()
    exit(0 if success else 1)