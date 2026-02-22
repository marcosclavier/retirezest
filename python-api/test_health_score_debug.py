#!/usr/bin/env python3
"""
Debug health score calculation for Juan & Daniela scenario
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

print("DEBUGGING HEALTH SCORE CALCULATION")
print("="*60)

response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
else:
    data = response.json()

    # Get all the values used in health score calculation
    summary = data.get('summary', {})

    print("\n📊 HEALTH SCORE INPUTS:")
    print("-"*60)

    years_simulated = summary.get('years_simulated', 0)
    years_funded = summary.get('years_funded', 0)
    success_rate = summary.get('success_rate', 0)
    avg_effective_tax_rate = summary.get('avg_effective_tax_rate', 0)
    total_government_benefits = summary.get('total_government_benefits', 0)
    initial_net_worth = summary.get('initial_net_worth', 0)
    final_net_worth = summary.get('final_net_worth', 0)
    health_score = summary.get('health_score', 0)
    health_rating = summary.get('health_rating', 'Unknown')

    print(f"Years Simulated: {years_simulated}")
    print(f"Years Funded: {years_funded}")
    print(f"Success Rate: {success_rate:.1f}%")
    print(f"Avg Effective Tax Rate: {avg_effective_tax_rate:.1f}%")
    print(f"Total Government Benefits: ${total_government_benefits:,.0f}")
    print(f"Initial Net Worth: ${initial_net_worth:,.0f}")
    print(f"Final Net Worth: ${final_net_worth:,.0f}")

    print(f"\n📈 HEALTH SCORE RESULT:")
    print("-"*60)
    print(f"Health Score: {health_score}/100")
    print(f"Health Rating: {health_rating}")

    # Check the health criteria breakdown
    if 'health_criteria' in summary:
        criteria = summary['health_criteria']
        print(f"\n📝 CRITERIA BREAKDOWN:")
        print("-"*60)

        for key, value in criteria.items():
            score = value.get('score', 0)
            max_score = value.get('max_score', 20)
            status = value.get('status', 'Unknown')
            desc = value.get('description', '')
            print(f"\n{key.replace('_', ' ').title()}:")
            print(f"  Score: {score}/{max_score}")
            print(f"  Status: {status}")
            print(f"  Description: {desc}")

    # Check for discrepancies
    print(f"\n🔍 ANALYSIS:")
    print("-"*60)

    # Calculate what the success rate should be
    calculated_success = (years_funded / years_simulated * 100) if years_simulated > 0 else 0
    print(f"Calculated Success Rate: {calculated_success:.1f}%")
    print(f"Reported Success Rate: {success_rate:.1f}%")

    if abs(calculated_success - success_rate) > 0.1:
        print("⚠️ Success rate calculation mismatch!")

    # Check if health score matches expected calculation
    expected_score = 0
    print(f"\nExpected Health Score Calculation:")

    # Criterion 1: Full period funded
    if success_rate >= 100:
        c1_points = 20
    elif success_rate >= 95:
        c1_points = 18
    elif success_rate >= 90:
        c1_points = 15
    elif success_rate >= 85:
        c1_points = 12
    elif success_rate >= 80:
        c1_points = 8
    elif success_rate >= 70:
        c1_points = 4
    else:
        c1_points = 0
    print(f"  Criterion 1 (Funding): {c1_points} points (success_rate={success_rate:.1f}%)")
    expected_score += c1_points

    # Criterion 2: Adequate reserve
    if success_rate >= 95:
        c2_points = 20
    elif success_rate >= 90:
        c2_points = 17
    elif success_rate >= 85:
        c2_points = 14
    elif success_rate >= 80:
        c2_points = 10
    elif success_rate >= 70:
        c2_points = 5
    else:
        c2_points = 0
    print(f"  Criterion 2 (Reserve): {c2_points} points")
    expected_score += c2_points

    print(f"\nExpected minimum score (first 2 criteria): {expected_score}")
    print(f"Actual health score: {health_score}")

    if health_score < expected_score:
        print("❌ Health score is lower than expected based on success rate!")

    # Check warnings
    if 'warnings' in data and data['warnings']:
        print(f"\n⚠️ WARNINGS:")
        for warning in data['warnings']:
            print(f"  - {warning}")