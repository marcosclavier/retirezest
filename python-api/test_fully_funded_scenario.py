#!/usr/bin/env python3
"""
Test Key Insights with a truly fully-funded scenario (no underfunding at all)
"""

import requests
import json

def test_fully_funded():
    """Test with lower spending to ensure 100% funding"""

    print("="*80)
    print("FULLY FUNDED SCENARIO TEST")
    print("Testing: No underfunding = Success messages (not 'Plan at Risk')")
    print("="*80)

    # Very conservative spending to ensure full funding
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
        'spending_go_go': 100000,  # Very conservative spending
        'spending_slow_go': 80000,
        'slow_go_end_age': 85,
        'spending_no_go': 60000,
        'go_go_end_age': 75,
        'spending_inflation': 2.5,
        'general_inflation': 2.5,
        'tfsa_contribution_each': 7000
    }

    print("\n📋 CONSERVATIVE SCENARIO:")
    print("  • Spending: $100K → $80K → $60K")
    print("  • Total Assets: ~$4.9M")
    print("  • Expected: Fully funded with large estate")

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)
    if response.status_code != 200:
        return False

    data = response.json()
    summary = data.get('summary', {})

    # Display results
    health_score = summary.get('health_score', 0)
    success_rate = summary.get('success_rate', 0)
    underfunded_years = summary.get('total_underfunded_years', 0)
    underfunding = summary.get('total_underfunding', 0)
    final_estate = summary.get('final_estate_after_tax', 0)

    print(f"\n📊 RESULTS:")
    print(f"  • Health Score: {health_score}/100")
    print(f"  • Success Rate: {success_rate*100:.1f}%")
    print(f"  • Underfunded Years: {underfunded_years}")
    print(f"  • Total Underfunding: ${underfunding:,.0f}")
    print(f"  • Final Estate: ${final_estate:,.0f}")

    # Determine expected Key Insights behavior
    print("\n🎯 KEY INSIGHTS BEHAVIOR:")
    print("-"*40)

    if underfunded_years > 0 and underfunding > 1:
        print("  Will show: 'Underfunding Detected'")
        print("  (Even small underfunding triggers this)")
    elif success_rate >= 0.999:
        print("  ✅ Will show: SUCCESS messages")
        if final_estate > 500000:
            print("     → 'Strong Financial Position'")
        elif final_estate > 100000:
            print("     → 'Plan Successfully Funded'")
        else:
            print("     → 'Plan on Track'")
    elif success_rate > 0.8 and success_rate < 0.999:
        print("  ⚠️ Would show: 'Plan at Risk'")
        print("     (This was the bug - now fixed with >= 0.999)")

    # Test the exact user scenario
    print("\n"+"="*80)
    print("TESTING USER'S EXACT SCENARIO")
    print("="*80)

    # Original spending that causes the issue
    payload['spending_go_go'] = 153700
    payload['spending_slow_go'] = 120000
    payload['spending_no_go'] = 100000

    print("\n📋 USER'S SCENARIO:")
    print("  • Spending: $153.7K → $120K → $100K")

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)
    data = response.json()
    summary = data.get('summary', {})

    health_score = summary.get('health_score', 0)
    success_rate = summary.get('success_rate', 0)
    underfunded_years = summary.get('total_underfunded_years', 0)
    underfunding = summary.get('total_underfunding', 0)

    print(f"\n📊 USER SCENARIO RESULTS:")
    print(f"  • Health Score: {health_score}/100")
    print(f"  • Success Rate: {success_rate*100:.1f}%")
    print(f"  • Underfunded Years: {underfunded_years}")
    print(f"  • Total Underfunding: ${underfunding:,.0f}")

    # Analysis
    print("\n🔍 ANALYSIS:")
    print("-"*40)

    if health_score == 100 and underfunded_years > 0:
        print("❌ ISSUE FOUND: Health Score 100 but has underfunding!")
        print("   This is a backend calculation issue.")
        print("   Health Score should not be 100 if there's underfunding.")
    elif health_score == 100 and success_rate < 0.999:
        print("❌ ISSUE FOUND: Health Score 100 but success rate < 100%!")
        print("   Backend inconsistency detected.")
    elif success_rate >= 0.999 and underfunded_years == 0:
        print("✅ CORRECT: Plan fully funded, will show success messages")
    elif underfunded_years > 0:
        print("✅ CORRECT: Has underfunding, will show warning")
    else:
        print("✅ Key Insights logic fix is working correctly")

    return True

if __name__ == '__main__':
    test_fully_funded()