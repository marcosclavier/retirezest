#!/usr/bin/env python3
"""
Test Corporate-Optimized with TFSA contributions = 0
This matches the frontend default behavior
"""

import requests
import json

def test_with_zero_tfsa():
    """Test with TFSA contributions set to 0 like frontend"""

    print("="*80)
    print("TESTING WITH TFSA CONTRIBUTIONS = 0 (FRONTEND DEFAULT)")
    print("="*80)

    # Juan & Daniela with TFSA = 0 (matching frontend default)
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
            'cpp_start_age': 70,  # Delayed to 70
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,  # Delayed to 70
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
            'cpp_start_age': 70,  # Delayed to 70
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,  # Delayed to 70
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
        'tfsa_contribution_each': 0  # CRITICAL: Set to 0 like frontend!
    }

    print("\n📊 KEY DIFFERENCE:")
    print("  • TFSA Contribution: $0 (matching frontend default)")
    print("  • Previous tests used: $7,000")
    print("  • This reduces spending pressure by $14,000/year")

    print("\n⏳ Running simulation...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return None

    data = response.json()
    summary = data.get('summary', {})

    print("\n" + "="*80)
    print("RESULTS WITH TFSA = 0")
    print("="*80)

    # Key metrics
    health_score = summary.get('health_score', 0)
    success_rate = summary.get('success_rate', 0)
    total_underfunding = summary.get('total_underfunding', 0)
    underfunded_years = summary.get('total_underfunded_years', 0)
    final_estate = summary.get('final_estate_after_tax', 0)

    print(f"\n🎯 KEY METRICS:")
    print(f"  • Health Score: {health_score}/100")
    print(f"  • Success Rate: {success_rate:.1f}%")
    print(f"  • Underfunded Years: {underfunded_years}")
    print(f"  • Total Shortfall: ${total_underfunding:,.0f}")
    print(f"  • Final Estate: ${final_estate:,.0f}")

    # Check Year 1
    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        print(f"\n📅 YEAR 1 DETAILS:")
        print(f"  • Corporate Withdrawals: ${year1.get('corporate_withdrawal_p1', 0) + year1.get('corporate_withdrawal_p2', 0):,.0f}")
        print(f"  • RRIF Withdrawals: ${year1.get('rrif_withdrawal_p1', 0) + year1.get('rrif_withdrawal_p2', 0):,.0f}")
        print(f"  • TFSA Contributions: ${year1.get('tfsa_contribution_p1', 0) + year1.get('tfsa_contribution_p2', 0):,.0f}")
        print(f"  • Gap Flag: {year1.get('gap', False)}")

    # Comparison
    print("\n" + "="*80)
    print("COMPARISON")
    print("="*80)

    print(f"\n📊 RESULTS COMPARISON:")
    print(f"{'Setting':<30} {'Score':<15} {'Success Rate':<15}")
    print("-"*60)
    print(f"{'TFSA = $0 (Frontend)':<30} {str(health_score)+'/100':<15} {str(round(success_rate, 1))+'%':<15}")
    print(f"{'TFSA = $7,000 (My tests)':<30} {'98/100':<15} {'96.8%':<15}")
    print(f"{'Your Frontend Shows':<30} {'100/100':<15} {'100%?':<15}")

    if health_score == 100:
        print("\n✅ SUCCESS! Setting TFSA=0 matches your frontend!")
        print("   The $14,000/year difference in TFSA contributions")
        print("   was causing the discrepancy.")
    elif health_score > 98:
        print(f"\n⚠️ Very close! Score improved from 98 to {health_score}")
        print("   Almost matching your frontend.")
    else:
        print(f"\n❌ Still not matching. Score is {health_score}/100")
        print("   There may be other parameter differences.")

    return health_score

if __name__ == '__main__':
    score = test_with_zero_tfsa()

    print("\n" + "="*80)
    print("CONCLUSION")
    print("="*80)

    if score == 100:
        print("\n🎯 PROBLEM SOLVED!")
        print("The discrepancy was caused by TFSA contribution settings:")
        print("  • Frontend defaults to: $0")
        print("  • Test scripts used: $7,000")
        print("  • Impact: $14,000/year difference in available spending")
    else:
        print(f"\nScore: {score}/100")
        print("Still investigating remaining differences...")
    print("="*80)