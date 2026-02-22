#!/usr/bin/env python3
"""
Debug Year 1 failure in Corporate-Optimized strategy
"""

import requests
import json

def debug_year1():
    """Debug why Year 1 is failing"""

    print("="*80)
    print("YEAR 1 FAILURE DEBUG - CORPORATE-OPTIMIZED")
    print("="*80)

    # Exact Juan & Daniela scenario
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

    print("\n⏳ Running simulation...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()

    # Get Year 1 details
    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        print("\n" + "="*80)
        print("YEAR 1 ANALYSIS (2026)")
        print("="*80)

        # Income
        print("\n💰 INCOME:")
        print("-"*60)
        cpp1 = year1.get('cpp_income_p1', 0)
        cpp2 = year1.get('cpp_income_p2', 0)
        oas1 = year1.get('oas_income_p1', 0)
        oas2 = year1.get('oas_income_p2', 0)

        print(f"Juan:")
        print(f"  • CPP: ${cpp1:,.0f}")
        print(f"  • OAS: ${oas1:,.0f}")
        print(f"Daniela:")
        print(f"  • CPP: ${cpp2:,.0f}")
        print(f"  • OAS: ${oas2:,.0f}")
        print(f"Total Government Income: ${cpp1 + cpp2 + oas1 + oas2:,.0f}")

        # Withdrawals
        print("\n📤 WITHDRAWALS:")
        print("-"*60)
        corp1 = year1.get('corporate_withdrawal_p1', 0)
        corp2 = year1.get('corporate_withdrawal_p2', 0)
        rrif1 = year1.get('rrif_withdrawal_p1', 0)
        rrif2 = year1.get('rrif_withdrawal_p2', 0)
        nr1 = year1.get('nonreg_withdrawal_p1', 0)
        nr2 = year1.get('nonreg_withdrawal_p2', 0)
        tfsa1 = year1.get('tfsa_withdrawal_p1', 0)
        tfsa2 = year1.get('tfsa_withdrawal_p2', 0)

        print(f"Juan:")
        print(f"  • Corporate: ${corp1:,.0f}")
        print(f"  • RRIF: ${rrif1:,.0f}")
        print(f"  • NonReg: ${nr1:,.0f}")
        print(f"  • TFSA: ${tfsa1:,.0f}")
        print(f"Daniela:")
        print(f"  • Corporate: ${corp2:,.0f}")
        print(f"  • RRIF: ${rrif2:,.0f}")
        print(f"  • NonReg: ${nr2:,.0f}")
        print(f"  • TFSA: ${tfsa2:,.0f}")

        total_withdrawals = corp1 + corp2 + rrif1 + rrif2 + nr1 + nr2 + tfsa1 + tfsa2
        print(f"\nTotal Withdrawals: ${total_withdrawals:,.0f}")

        # Tax
        print("\n💸 TAXES:")
        print("-"*60)
        tax1 = year1.get('tax_payable_p1', 0)
        tax2 = year1.get('tax_payable_p2', 0)
        print(f"Juan's Tax: ${tax1:,.0f}")
        print(f"Daniela's Tax: ${tax2:,.0f}")
        print(f"Total Tax: ${tax1 + tax2:,.0f}")

        # Net Available
        print("\n💵 NET AVAILABLE AFTER TAX:")
        print("-"*60)
        gross_income = cpp1 + cpp2 + oas1 + oas2 + total_withdrawals
        net_available = gross_income - (tax1 + tax2)
        print(f"Gross Income: ${gross_income:,.0f}")
        print(f"Less Tax: ${tax1 + tax2:,.0f}")
        print(f"Net Available: ${net_available:,.0f}")

        # TFSA Contributions
        print("\n🏦 TFSA CONTRIBUTIONS:")
        print("-"*60)
        tfsa_cont1 = year1.get('tfsa_contribution_p1', 0)
        tfsa_cont2 = year1.get('tfsa_contribution_p2', 0)
        print(f"Juan: ${tfsa_cont1:,.0f}")
        print(f"Daniela: ${tfsa_cont2:,.0f}")
        print(f"Total: ${tfsa_cont1 + tfsa_cont2:,.0f}")

        # Spending
        print("\n🛍️ SPENDING REQUIREMENT:")
        print("-"*60)
        spending_target = year1.get('spending_target', 153700)
        print(f"Target Spending: ${spending_target:,.0f}")
        print(f"Available for Spending: ${net_available - (tfsa_cont1 + tfsa_cont2):,.0f}")

        # Gap Analysis
        print("\n⚠️ GAP ANALYSIS:")
        print("-"*60)
        available_for_spending = net_available - (tfsa_cont1 + tfsa_cont2)
        gap = spending_target - available_for_spending

        print(f"Required: ${spending_target:,.0f}")
        print(f"Available: ${available_for_spending:,.0f}")
        print(f"Gap: ${gap:,.0f}")

        has_gap = year1.get('gap', False)
        print(f"Gap Flag in Data: {has_gap}")

        if gap > 0:
            print("\n❌ YEAR 1 FAILS: Cannot meet spending requirement!")
        else:
            print("\n✅ YEAR 1 PASSES: Spending requirement met")

        # Check account balances
        print("\n📊 END OF YEAR BALANCES:")
        print("-"*60)
        print(f"Juan:")
        print(f"  • Corporate: ${year1.get('corporate_balance_p1', 0):,.0f}")
        print(f"  • RRIF: ${year1.get('rrif_balance_p1', 0):,.0f}")
        print(f"  • TFSA: ${year1.get('tfsa_balance_p1', 0):,.0f}")
        print(f"  • NonReg: ${year1.get('nonreg_balance_p1', 0):,.0f}")

        print(f"Daniela:")
        print(f"  • Corporate: ${year1.get('corporate_balance_p2', 0):,.0f}")
        print(f"  • RRIF: ${year1.get('rrif_balance_p2', 0):,.0f}")
        print(f"  • TFSA: ${year1.get('tfsa_balance_p2', 0):,.0f}")
        print(f"  • NonReg: ${year1.get('nonreg_balance_p2', 0):,.0f}")

        # Summary
        print("\n" + "="*80)
        print("DIAGNOSIS")
        print("="*80)

        if gap > 0:
            print(f"\n❌ The Corporate-Optimized strategy is failing in Year 1!")
            print(f"   There is a ${gap:,.0f} shortfall in meeting spending needs.")
            print(f"\nPossible reasons:")
            print(f"  1. Not enough corporate withdrawals (only ${corp1 + corp2:,.0f})")
            print(f"  2. TFSA contributions reducing available cash")
            print(f"  3. Strategy may not be withdrawing optimally")
        else:
            print(f"\n✅ Year 1 should be passing but API shows failure")
            print(f"   This indicates a calculation issue in the simulation")

if __name__ == '__main__':
    debug_year1()