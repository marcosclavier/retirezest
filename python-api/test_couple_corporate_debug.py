#!/usr/bin/env python3
"""
Debug test for couple with corporate accounts
Testing why corporate isn't being prioritized properly
"""

import requests
import json

# Simpler test - both have corporate accounts
payload = {
    'p1': {
        'name': 'Juan',
        'start_age': 65,
        'rrif_balance': 100000,
        'tfsa_balance': 50000,
        'nr_cash': 0,
        'nr_gic': 0,
        'nr_invest': 0,
        'corp_cash_bucket': 500000,  # $500k corporate
        'corp_gic_bucket': 500000,   # $500k corporate
        'corp_invest_bucket': 1000000,  # $1M corporate
        'corporate_balance': 0,  # Will be summed from buckets
        'cpp_start_age': 65,
        'cpp_annual_at_start': 10000,
        'oas_start_age': 65,
        'oas_annual_at_start': 8000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'p2': {
        'name': 'Daniela',
        'start_age': 65,
        'rrif_balance': 100000,
        'tfsa_balance': 50000,
        'nr_cash': 0,
        'nr_gic': 0,
        'nr_invest': 0,
        'corp_cash_bucket': 250000,  # $250k corporate
        'corp_gic_bucket': 250000,   # $250k corporate
        'corp_invest_bucket': 0,
        'corporate_balance': 0,
        'cpp_start_age': 65,
        'cpp_annual_at_start': 8000,
        'oas_start_age': 65,
        'oas_annual_at_start': 8000,
        'pension_incomes': [],
        'other_incomes': []
    },
    'include_partner': True,  # Couple
    'province': 'ON',
    'start_year': 2026,
    'end_age': 70,
    'strategy': 'corporate-optimized',
    'spending_go_go': 120000,  # $120k total spending
    'spending_slow_go': 100000,
    'slow_go_end_age': 85,
    'spending_no_go': 80000,
    'go_go_end_age': 75,
    'spending_inflation': 0,  # No inflation for simplicity
    'general_inflation': 0,
    'tfsa_contribution_each': 0
}

print("COUPLE CORPORATE TEST")
print("=" * 60)
print("Juan: $2M corporate, $100k RRIF, $50k TFSA")
print("Daniela: $500k corporate, $100k RRIF, $50k TFSA")
print("Total Corporate: $2.5M")
print("Spending: $120k/year")
print("Strategy: corporate-optimized")
print("=" * 60)

response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

if response.status_code != 200:
    print(f"ERROR: Status {response.status_code}")
    print(response.text[:500])
else:
    data = response.json()

    if data.get('five_year_plan'):
        print("\nYEAR-BY-YEAR WITHDRAWALS:")
        print("-" * 60)

        for i in range(min(3, len(data['five_year_plan']))):
            yr = data['five_year_plan'][i]
            print(f"\nYear {yr.get('year', 2026+i)}:")

            # Juan's withdrawals
            corp_p1 = yr.get('corp_withdrawal_p1', 0)
            rrif_p1 = yr.get('rrif_withdrawal_p1', 0)
            tfsa_p1 = yr.get('tfsa_withdrawal_p1', 0)

            # Daniela's withdrawals
            corp_p2 = yr.get('corp_withdrawal_p2', 0)
            rrif_p2 = yr.get('rrif_withdrawal_p2', 0)
            tfsa_p2 = yr.get('tfsa_withdrawal_p2', 0)

            print(f"  Juan:")
            print(f"    Corporate: ${corp_p1:,.0f}")
            print(f"    RRIF: ${rrif_p1:,.0f}")
            print(f"    TFSA: ${tfsa_p1:,.0f}")

            print(f"  Daniela:")
            print(f"    Corporate: ${corp_p2:,.0f}")
            print(f"    RRIF: ${rrif_p2:,.0f}")
            print(f"    TFSA: ${tfsa_p2:,.0f}")

            print(f"  Combined:")
            print(f"    Total Corporate: ${corp_p1 + corp_p2:,.0f}")
            print(f"    Total RRIF: ${rrif_p1 + rrif_p2:,.0f}")
            print(f"    Total TFSA: ${tfsa_p1 + tfsa_p2:,.0f}")

            # Check if corporate is being prioritized
            total_corp = corp_p1 + corp_p2
            total_rrif = rrif_p1 + rrif_p2

            if total_corp > total_rrif:
                print(f"    ✅ Corporate > RRIF (Good)")
            else:
                print(f"    ❌ RRIF >= Corporate (Problem!)")

        # Summary
        print("\n" + "=" * 60)
        print("ANALYSIS:")
        total_corp_3yr = sum(yr.get('corp_withdrawal_p1', 0) + yr.get('corp_withdrawal_p2', 0)
                           for yr in data['five_year_plan'][:3])
        total_rrif_3yr = sum(yr.get('rrif_withdrawal_p1', 0) + yr.get('rrif_withdrawal_p2', 0)
                           for yr in data['five_year_plan'][:3])

        print(f"3-year totals:")
        print(f"  Corporate: ${total_corp_3yr:,.0f}")
        print(f"  RRIF: ${total_rrif_3yr:,.0f}")

        if total_corp_3yr > 200000:
            print("\n✅ Corporate withdrawals look reasonable")
        else:
            print(f"\n❌ Corporate withdrawals too low for $2.5M balance!")
            print(f"   Expected >$200k, got ${total_corp_3yr:,.0f}")
    else:
        print("No five_year_plan in response")