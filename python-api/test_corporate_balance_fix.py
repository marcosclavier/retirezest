#!/usr/bin/env python3
"""
Test that corporate balance decreases correctly after withdrawals
"""

import requests
import json

payload = {
    'p1': {
        'name': 'Juan',
        'start_age': 65,
        'rrif_balance': 189000,
        'tfsa_balance': 192200,
        'nr_cash': 0,
        'nr_gic': 0,
        'nr_invest': 448200,
        'corp_cash_bucket': 400000,  # Total corporate = $1,222,000
        'corp_gic_bucket': 400000,
        'corp_invest_bucket': 422000,
        'corporate_balance': 0,
        'cpp_start_age': 65,
        'cpp_annual_at_start': 0,  # Start simple
        'oas_start_age': 65,
        'oas_annual_at_start': 0,
        'pension_incomes': [],
        'other_incomes': []
    },
    'p2': {
        'name': 'Daniela',
        'start_age': 65,
        'rrif_balance': 263000,
        'tfsa_balance': 221065,
        'nr_cash': 0,
        'nr_gic': 0,
        'nr_invest': 448200,
        'corp_cash_bucket': 400000,  # Total corporate = $1,222,000
        'corp_gic_bucket': 400000,
        'corp_invest_bucket': 422000,
        'corporate_balance': 0,
        'cpp_start_age': 66,
        'cpp_annual_at_start': 15000,
        'oas_start_age': 66,
        'oas_annual_at_start': 0,
        'pension_incomes': [],
        'other_incomes': []
    },
    'include_partner': True,
    'province': 'ON',
    'start_year': 2026,
    'end_age': 70,  # Minimum allowed by API
    'strategy': 'corporate-optimized',
    'spending_go_go': 153700,
    'spending_slow_go': 120000,
    'slow_go_end_age': 85,
    'spending_no_go': 100000,
    'go_go_end_age': 75,
    'spending_inflation': 0,
    'general_inflation': 0,
    'tfsa_contribution_each': 7000
}

print("TESTING CORPORATE BALANCE DECREASE")
print("="*60)
print("Juan starting corporate: $1,222,000")
print("Daniela starting corporate: $1,222,000")
print("Strategy: corporate-optimized")
print("Spending target: $153,700")
print("="*60)

response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

if response.status_code != 200:
    print(f"ERROR: Status {response.status_code}")
else:
    data = response.json()

    # Debug: Show all top-level keys
    print(f"\nAPI Response keys: {list(data.keys())}")

    if data.get('five_year_plan'):
        year1 = data['five_year_plan'][0]

        # Get withdrawals
        corp_wd_p1 = year1.get('corp_withdrawal_p1', 0)
        corp_wd_p2 = year1.get('corp_withdrawal_p2', 0)

        print(f"\n2026 WITHDRAWALS:")
        print(f"  Juan corporate withdrawal: ${corp_wd_p1:,.0f}")
        print(f"  Daniela corporate withdrawal: ${corp_wd_p2:,.0f}")
        print(f"  Total corporate withdrawn: ${corp_wd_p1 + corp_wd_p2:,.0f}")

        # Check end balances from year_by_year (more detailed)
        if data.get('year_by_year'):
            year1_detail = data['year_by_year'][0]

            print(f"\nDEBUG - Available fields in year_by_year[0]:")
            for key in sorted(year1_detail.keys()):
                if 'corp' in key.lower():
                    print(f"  {key}: {year1_detail.get(key, 'N/A')}")

            # These should show the ending corporate balances
            end_corp_p1 = year1_detail.get('corporate_balance_p1', 0)
            end_corp_p2 = year1_detail.get('corporate_balance_p2', 0)

            print(f"\n2026 END BALANCES:")
            print(f"  Juan ending corporate: ${end_corp_p1:,.0f}")
            print(f"  Daniela ending corporate: ${end_corp_p2:,.0f}")

            # Calculate expected balances (ignoring growth for simplicity)
            expected_p1 = 1222000 - corp_wd_p1
            expected_p2 = 1222000 - corp_wd_p2

            print(f"\nEXPECTED vs ACTUAL:")
            print(f"  Juan:")
            print(f"    Expected: ~${expected_p1:,.0f} (start - withdrawal)")
            print(f"    Actual: ${end_corp_p1:,.0f}")
            if end_corp_p1 > 1222000:
                print(f"    ❌ ERROR: Balance INCREASED instead of decreasing!")
            elif abs(end_corp_p1 - expected_p1) < 100000:  # Allow for some growth/tax effects
                print(f"    ✅ Balance decreased correctly")
            else:
                print(f"    ⚠️  Balance change larger than expected")

            print(f"  Daniela:")
            print(f"    Expected: ~${expected_p2:,.0f} (start - withdrawal)")
            print(f"    Actual: ${end_corp_p2:,.0f}")
            if end_corp_p2 > 1222000:
                print(f"    ❌ ERROR: Balance INCREASED instead of decreasing!")
            elif abs(end_corp_p2 - expected_p2) < 100000:
                print(f"    ✅ Balance decreased correctly")
            else:
                print(f"    ⚠️  Balance change larger than expected")

        # Check gap flag
        gap = year1.get('spending_gap', 0)
        is_gap = year1.get('is_underfunded', False) or year1.get('status') == 'Gap'
        net_cash = year1.get('net_cash_flow', 0)

        print(f"\nGAP DETECTION:")
        print(f"  Spending gap: ${gap:,.0f}")
        print(f"  Net cash flow: ${net_cash:,.0f}")
        print(f"  Gap flag: {is_gap}")

        if net_cash > 0 and is_gap:
            print(f"  ❌ ERROR: False gap detected with positive cash flow!")
        elif net_cash > 0 and not is_gap:
            print(f"  ✅ No gap correctly - have surplus")
        elif net_cash < 0 and is_gap:
            print(f"  ✅ Gap correctly detected")
        else:
            print(f"  ⚠️  Check gap detection logic")