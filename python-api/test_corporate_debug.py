#!/usr/bin/env python3
"""
Debug test for Corporate-Optimized strategy discrepancy
Checking why frontend shows 100/100 but test shows 78/100
"""

import requests
import json

def test_corporate_optimized_debug():
    """Debug test with exact Juan & Daniela parameters"""

    print("="*80)
    print("DEBUGGING CORPORATE-OPTIMIZED STRATEGY RESULTS")
    print("="*80)

    # Exact Juan & Daniela scenario in Alberta
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
        'province': 'AB',  # Alberta
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

    print("\n📊 TEST PARAMETERS:")
    print(f"  • Strategy: {payload['strategy']}")
    print(f"  • Province: {payload['province']}")
    print(f"  • Spending: ${payload['spending_go_go']:,}/year")
    print(f"  • TFSA Contribution: ${payload['tfsa_contribution_each']:,} each")

    # Calculate total assets
    p1_total = (
        payload['p1']['rrif_balance'] +
        payload['p1']['tfsa_balance'] +
        payload['p1']['nr_invest'] +
        payload['p1']['corp_cash_bucket'] +
        payload['p1']['corp_gic_bucket'] +
        payload['p1']['corp_invest_bucket']
    )
    p2_total = (
        payload['p2']['rrif_balance'] +
        payload['p2']['tfsa_balance'] +
        payload['p2']['nr_invest'] +
        payload['p2']['corp_cash_bucket'] +
        payload['p2']['corp_gic_bucket'] +
        payload['p2']['corp_invest_bucket']
    )

    print(f"\n💰 TOTAL ASSETS:")
    print(f"  • Juan: ${p1_total:,}")
    print(f"  • Daniela: ${p2_total:,}")
    print(f"  • Combined: ${p1_total + p2_total:,}")

    # Run simulation
    print("\n⏳ Running simulation...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        print(f"Response: {response.text}")
        return

    data = response.json()
    summary = data.get('summary', {})

    print("\n" + "="*80)
    print("RESULTS")
    print("="*80)

    # Key metrics
    health_score = summary.get('health_score', 0)
    success_rate = summary.get('success_rate', 0)
    total_underfunding = summary.get('total_underfunding', 0)
    underfunded_years = summary.get('total_underfunded_years', 0)
    final_estate = summary.get('final_estate_after_tax', 0)
    total_tax_paid = summary.get('total_tax_paid', 0)

    print(f"\n🎯 KEY METRICS:")
    print(f"  • Health Score: {health_score}/100")
    print(f"  • Success Rate: {success_rate:.1f}%")
    print(f"  • Underfunded Years: {underfunded_years}")
    print(f"  • Total Shortfall: ${total_underfunding:,.0f}")
    print(f"  • Final Estate: ${final_estate:,.0f}")
    print(f"  • Total Tax Paid: ${total_tax_paid:,.0f}")

    # Check Year 1 details
    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        print(f"\n📅 YEAR 1 DETAILS:")
        print(f"  Juan:")
        print(f"    • Corporate Withdrawal: ${year1.get('corporate_withdrawal_p1', 0):,.0f}")
        print(f"    • RRIF Withdrawal: ${year1.get('rrif_withdrawal_p1', 0):,.0f}")
        print(f"    • NonReg Withdrawal: ${year1.get('nonreg_withdrawal_p1', 0):,.0f}")
        print(f"    • TFSA Withdrawal: ${year1.get('tfsa_withdrawal_p1', 0):,.0f}")

        print(f"  Daniela:")
        print(f"    • Corporate Withdrawal: ${year1.get('corporate_withdrawal_p2', 0):,.0f}")
        print(f"    • RRIF Withdrawal: ${year1.get('rrif_withdrawal_p2', 0):,.0f}")
        print(f"    • NonReg Withdrawal: ${year1.get('nonreg_withdrawal_p2', 0):,.0f}")
        print(f"    • TFSA Withdrawal: ${year1.get('tfsa_withdrawal_p2', 0):,.0f}")

        # Check gap flag
        has_gap = year1.get('gap', False)
        print(f"\n  • Gap Flag: {has_gap}")

    # Score breakdown
    print(f"\n📊 SCORE BREAKDOWN:")
    print(f"  • Full Period Funded: {summary.get('full_period_funded', 0)}/20")
    print(f"  • Adequate Reserve: {summary.get('adequate_reserve', 0)}/20")
    print(f"  • Tax Efficiency: {summary.get('tax_efficiency', 0)}/20")
    print(f"  • Estate Value: {summary.get('estate_value', 0)}/20")
    print(f"  • Income Stability: {summary.get('income_stability', 0)}/20")

    # Diagnosis
    print("\n" + "="*80)
    print("DIAGNOSIS")
    print("="*80)

    if health_score == 100:
        print("✅ Test shows 100/100 - Matches frontend!")
    else:
        print(f"❌ Test shows {health_score}/100 - Does NOT match frontend (100/100)")
        print("\nPossible issues:")
        print("  1. Different parameters being sent from frontend")
        print("  2. Caching issue in API")
        print("  3. Different simulation settings")
        print("  4. Version mismatch between test and production")

    return health_score

if __name__ == '__main__':
    score = test_corporate_optimized_debug()
    print("\n" + "="*80)
    print(f"Final Health Score: {score}/100")
    print("="*80)