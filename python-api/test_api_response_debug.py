#!/usr/bin/env python3
"""
Debug API response structure to understand the discrepancy
"""

import requests
import json

def debug_api_response():
    """Check the actual API response structure"""

    print("="*80)
    print("API RESPONSE STRUCTURE DEBUG")
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

    print("\n⏳ Running Corporate-Optimized simulation...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()

    # Print the entire summary structure
    print("\n📊 SUMMARY STRUCTURE:")
    print("-"*60)
    summary = data.get('summary', {})

    # Print all keys in summary
    print("Keys in summary:")
    for key in sorted(summary.keys()):
        value = summary[key]
        if isinstance(value, (int, float)):
            print(f"  • {key}: {value}")
        else:
            print(f"  • {key}: [type: {type(value).__name__}]")

    # Check for score breakdown keys
    print("\n📊 SCORE BREAKDOWN KEYS:")
    print("-"*60)

    possible_keys = [
        'full_period_funded', 'full_period_funded_score',
        'adequate_reserve', 'adequate_reserve_score',
        'tax_efficiency', 'tax_efficiency_score',
        'estate_value', 'estate_value_score',
        'income_stability', 'income_stability_score',
        'score_full_period_funded',
        'score_adequate_reserve',
        'score_tax_efficiency',
        'score_estate_value',
        'score_income_stability'
    ]

    for key in possible_keys:
        if key in summary:
            print(f"  ✅ Found: {key} = {summary[key]}")

    # Now test RRIF-Frontload for comparison
    print("\n" + "="*80)
    print("TESTING RRIF-FRONTLOAD FOR COMPARISON")
    print("="*80)

    payload['strategy'] = 'rrif-frontload'
    print("\n⏳ Running RRIF-Frontload simulation...")

    response2 = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response2.status_code == 200:
        data2 = response2.json()
        summary2 = data2.get('summary', {})

        print("\n📊 RRIF-FRONTLOAD RESULTS:")
        print(f"  • Health Score: {summary2.get('health_score', 0)}/100")
        print(f"  • Success Rate: {summary2.get('success_rate', 0):.1f}%")
        print(f"  • Underfunded Years: {summary2.get('total_underfunded_years', 0)}")
        print(f"  • Total Shortfall: ${summary2.get('total_underfunding', 0):,.0f}")

    # Compare the two
    print("\n" + "="*80)
    print("COMPARISON")
    print("="*80)

    corp_score = summary.get('health_score', 0)
    rrif_score = summary2.get('health_score', 0) if response2.status_code == 200 else 0

    print(f"\nHealth Scores:")
    print(f"  • Corporate-Optimized: {corp_score}/100")
    print(f"  • RRIF-Frontload: {rrif_score}/100")
    print(f"  • Frontend shows: 100/100")

    if corp_score != 100:
        print("\n⚠️ ISSUE CONFIRMED: API returns different result than frontend")
        print("\nPossible causes:")
        print("  1. Frontend may be using cached results")
        print("  2. Frontend may have different default parameters")
        print("  3. There might be a deployment sync issue")
        print("  4. The simulation logic may have changed")

if __name__ == '__main__':
    debug_api_response()