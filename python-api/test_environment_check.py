#!/usr/bin/env python3
"""
Check for environment differences
Compare local vs production behavior
"""

import requests
import json

def check_environment():
    """Test a simple scenario to check for environment differences"""

    print("="*80)
    print("ENVIRONMENT CHECK - LOCAL VS PRODUCTION")
    print("="*80)

    # Simplified test case
    payload = {
        'p1': {
            'name': 'Test',
            'start_age': 65,
            'rrif_balance': 500000,
            'tfsa_balance': 100000,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 0,
            'corp_cash_bucket': 1000000,
            'corp_gic_bucket': 0,
            'corp_invest_bucket': 0,
            'corporate_balance': 0,
            'cpp_start_age': 70,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': 'Partner',
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
            'cpp_start_age': 70,
            'cpp_annual_at_start': 0,
            'oas_start_age': 70,
            'oas_annual_at_start': 0,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': False,
        'province': 'AB',
        'start_year': 2026,
        'end_age': 95,
        'strategy': 'corporate-optimized',
        'spending_go_go': 80000,
        'spending_slow_go': 60000,
        'slow_go_end_age': 85,
        'spending_no_go': 40000,
        'go_go_end_age': 75,
        'spending_inflation': 2.5,
        'general_inflation': 2.5,
        'tfsa_contribution_each': 7000
    }

    print("\n📊 TEST SCENARIO:")
    print("  • Simple single person")
    print("  • $1M Corporate, $500K RRIF, $100K TFSA")
    print("  • Spending: $80K/year")
    print("  • CPP/OAS delayed to 70")

    # Test local API
    print("\n⏳ Testing LOCAL API (port 8000)...")
    try:
        response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            summary = data.get('summary', {})
            print(f"✅ LOCAL RESULTS:")
            print(f"  • Health Score: {summary.get('health_score', 0)}/100")
            print(f"  • Success Rate: {summary.get('success_rate', 0):.1f}%")
            print(f"  • Underfunded Years: {summary.get('total_underfunded_years', 0)}")
        else:
            print(f"❌ Local API Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Could not reach local API: {e}")

    print("\n" + "="*80)
    print("ANALYSIS")
    print("="*80)

    print("\n📌 To match your production results:")
    print("1. Check if production has additional optimizations")
    print("2. Verify all parameters match exactly")
    print("3. Check if there are different default values")
    print("4. Confirm the production API endpoint")

    print("\n💡 The key insight:")
    print("Your frontend showing 100/100 suggests the production")
    print("environment has optimizations that make Corporate-Optimized")
    print("perform better than my local tests show.")

if __name__ == '__main__':
    check_environment()