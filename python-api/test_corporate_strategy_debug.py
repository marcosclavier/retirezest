#!/usr/bin/env python3
"""
Debug why Corporate-Optimized strategy shows only 45.8% corporate withdrawals
"""

import requests
import json

def test_corporate_strategy():
    print("="*80)
    print("CORPORATE-OPTIMIZED STRATEGY DEBUG TEST")
    print("="*80)

    payload = {
        'p1': {
            'name': 'Juan',
            'start_age': 65,
            'rrif_balance': 189000,
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
            'rrif_balance': 263000,
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

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()

    print("\n📊 YEAR 1 WITHDRAWAL ANALYSIS:")
    print("-"*60)

    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        # Get withdrawals from each account type
        corp_w1 = year1.get('corporate_withdrawal_p1', 0)
        corp_w2 = year1.get('corporate_withdrawal_p2', 0)
        rrif_w1 = year1.get('rrif_withdrawal_p1', 0)
        rrif_w2 = year1.get('rrif_withdrawal_p2', 0)
        tfsa_w1 = year1.get('tfsa_withdrawal_p1', 0)
        tfsa_w2 = year1.get('tfsa_withdrawal_p2', 0)
        nonreg_w1 = year1.get('nonreg_withdrawal_p1', 0)
        nonreg_w2 = year1.get('nonreg_withdrawal_p2', 0)

        total_corp = corp_w1 + corp_w2
        total_rrif = rrif_w1 + rrif_w2
        total_tfsa = tfsa_w1 + tfsa_w2
        total_nonreg = nonreg_w1 + nonreg_w2
        total_withdrawals = total_corp + total_rrif + total_tfsa + total_nonreg

        print(f"Juan's Withdrawals:")
        print(f"  Corporate: ${corp_w1:,.0f}")
        print(f"  RRIF: ${rrif_w1:,.0f}")
        print(f"  TFSA: ${tfsa_w1:,.0f}")
        print(f"  NonReg: ${nonreg_w1:,.0f}")

        print(f"\nDaniela's Withdrawals:")
        print(f"  Corporate: ${corp_w2:,.0f}")
        print(f"  RRIF: ${rrif_w2:,.0f}")
        print(f"  TFSA: ${tfsa_w2:,.0f}")
        print(f"  NonReg: ${nonreg_w2:,.0f}")

        print(f"\nCombined Withdrawals:")
        print(f"  Corporate: ${total_corp:,.0f} ({total_corp/total_withdrawals*100:.1f}%)")
        print(f"  RRIF: ${total_rrif:,.0f} ({total_rrif/total_withdrawals*100:.1f}%)")
        print(f"  TFSA: ${total_tfsa:,.0f} ({total_tfsa/total_withdrawals*100:.1f}%)")
        print(f"  NonReg: ${total_nonreg:,.0f} ({total_nonreg/total_withdrawals*100:.1f}%)")
        print(f"  TOTAL: ${total_withdrawals:,.0f}")

        # Check RRIF minimum rates
        print(f"\n📊 RRIF MINIMUM ANALYSIS:")
        print("-"*60)

        rrif_start1 = year1.get('rrif_start_p1', 189000)
        rrif_start2 = year1.get('rrif_start_p2', 263000)

        if rrif_start1 > 0:
            rate1 = (rrif_w1 / rrif_start1) * 100
            print(f"Juan (age 65):")
            print(f"  RRIF Balance: ${rrif_start1:,.0f}")
            print(f"  RRIF Withdrawal: ${rrif_w1:,.0f}")
            print(f"  Rate: {rate1:.2f}%")
            print(f"  Expected minimum at 65: ~4.00%")

        if rrif_start2 > 0:
            rate2 = (rrif_w2 / rrif_start2) * 100
            print(f"\nDaniela (age 65):")
            print(f"  RRIF Balance: ${rrif_start2:,.0f}")
            print(f"  RRIF Withdrawal: ${rrif_w2:,.0f}")
            print(f"  Rate: {rate2:.2f}%")
            print(f"  Expected minimum at 65: ~4.00%")

    # Check if strategy is actually being used
    print(f"\n🔍 STRATEGY VERIFICATION:")
    print("-"*60)

    if 'strategy_used' in data:
        print(f"Strategy Used: {data['strategy_used']}")

    if 'household_input' in data:
        strategy = data['household_input'].get('strategy', 'unknown')
        print(f"Strategy in Input: {strategy}")

    print("\n📊 5-YEAR SUMMARY:")
    print("-"*60)

    if 'summary' in data:
        summary = data['summary']
        corp_pct = summary.get('corporate_pct_of_total', 0)
        rrif_pct = summary.get('rrif_pct_of_total', 0)
        tfsa_pct = summary.get('tfsa_pct_of_total', 0)
        nonreg_pct = summary.get('nonreg_pct_of_total', 0)

        print(f"Average Distribution (first 5 years):")
        print(f"  Corporate: {corp_pct:.1f}%")
        print(f"  RRIF: {rrif_pct:.1f}%")
        print(f"  TFSA: {tfsa_pct:.1f}%")
        print(f"  NonReg: {nonreg_pct:.1f}%")

    print("\n" + "="*80)
    print("ANALYSIS")
    print("="*80)

    if total_corp / total_withdrawals < 0.5:
        print("❌ ISSUE: Corporate-Optimized strategy not working correctly")
        print("   Corporate should be prioritized but only represents <50% of withdrawals")
        print("\nPossible causes:")
        print("  1. Strategy not being applied correctly")
        print("  2. RRIF minimum withdrawals forcing higher RRIF usage")
        print("  3. Tax optimization overriding strategy preference")
    else:
        print("✅ Corporate withdrawals are being prioritized")

if __name__ == '__main__':
    test_corporate_strategy()