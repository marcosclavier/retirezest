#!/usr/bin/env python3
"""
Test to investigate the discrepancy between Health Score 100 and "Plan at Risk" message
Simulating the exact scenario shown in the screenshots
"""

import requests
import json

# Based on the screenshots, this appears to be Juan and Daniela's scenario
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

print("INVESTIGATING FRONTEND DISCREPANCY")
print("="*60)
print("Scenario: Juan & Daniela with Corporate-Optimized Strategy")
print("Frontend shows: Health Score 100 BUT 'Plan at Risk'")
print("="*60)

response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
else:
    data = response.json()

    # Check all the relevant fields that might cause this discrepancy
    print("\n📊 API RESPONSE ANALYSIS:")
    print("-"*60)

    # Get summary first
    summary = data.get('summary', {})

    # Health Score
    health_score = summary.get('health_score', 0)
    print(f"Health Score: {health_score}/100")

    # Success Rate
    success_rate = summary.get('success_rate', 0)
    print(f"Success Rate: {success_rate:.1f}%")

    # Estate Values
    final_estate = summary.get('final_estate_after_tax', 0)
    print(f"Final Estate: ${final_estate:,.0f}")

    # Check for shortfalls or gaps
    print("\n🔍 CHECKING FOR GAPS/SHORTFALLS:")
    print("-"*60)

    # Check summary for any shortfall mentions
    if 'summary' in data:
        summary = data['summary']
        print(f"Summary keys: {list(summary.keys())}")
        if 'shortfall' in str(summary).lower():
            print("⚠️ 'Shortfall' found in summary!")

    # Check key_assumptions
    if 'key_assumptions' in data:
        assumptions = data['key_assumptions']
        print(f"\nKey Assumptions: {assumptions}")

    # Check warnings
    if 'warnings' in data and data['warnings']:
        print(f"\n⚠️ Warnings: {data['warnings']}")

    # Check strategy insights
    if 'strategy_insights' in data and data['strategy_insights']:
        insights = data['strategy_insights']
        if isinstance(insights, dict):
            print(f"\nStrategy Insights keys: {list(insights.keys())}")
            if 'risk' in str(insights).lower() or 'shortfall' in str(insights).lower():
                print("⚠️ Risk/Shortfall mentioned in insights!")
                for key, value in insights.items():
                    if 'risk' in str(value).lower() or 'shortfall' in str(value).lower():
                        print(f"  {key}: {value}")
        else:
            print(f"\nStrategy Insights: {insights}")

    # Check spending analysis
    if 'spending_analysis' in data:
        spending = data['spending_analysis']
        print(f"\nSpending Analysis keys: {list(spending.keys())}")
        total_shortfall = spending.get('total_shortfall', 0)
        years_underfunded = spending.get('years_underfunded', 0)
        print(f"Total Shortfall: ${total_shortfall:,.0f}")
        print(f"Years Underfunded: {years_underfunded}")

        if total_shortfall > 0:
            print(f"\n❌ FOUND THE ISSUE: Total shortfall of ${total_shortfall:,.0f}")
            print("   This explains the 'Plan at Risk' message!")

    # Check if there's a discrepancy
    print("\n" + "="*60)
    print("DIAGNOSIS:")
    print("="*60)

    if health_score >= 95 and 'spending_analysis' in data:
        spending = data['spending_analysis']
        total_shortfall = spending.get('total_shortfall', 0)
        if total_shortfall > 0:
            print("❌ CONFIRMED BUG: Health Score is high (100) but there's a shortfall!")
            print(f"   Health Score: {health_score}")
            print(f"   Shortfall: ${total_shortfall:,.0f}")
            print("\n   The frontend is correctly showing both values from the API.")
            print("   The issue is in the backend calculation:")
            print("   - Either Health Score should be lower")
            print("   - OR the shortfall calculation is wrong")
        else:
            print("✅ No shortfall detected, 'Plan at Risk' message may be incorrect")
    else:
        print(f"Health Score: {health_score}, checking for other issues...")

    # Check the actual retirement success
    if 'year_by_year' in data:
        years = data['year_by_year']
        last_positive_year = None
        for year_data in years:
            year = year_data.get('year', 0)
            # Check various balance fields
            for person in ['p1', 'p2']:
                for account in ['rrif', 'tfsa', 'nonreg', 'corporate']:
                    balance_key = f'{account}_balance_{person}'
                    if balance_key in year_data and year_data[balance_key] > 0:
                        last_positive_year = year
                        break

        if last_positive_year:
            print(f"\nLast year with positive balance: {last_positive_year}")
            if last_positive_year >= 2026 + (95 - 65):
                print("✅ Funds last to age 95 as expected")
            else:
                shortfall_years = (2026 + (95 - 65)) - last_positive_year
                print(f"❌ Funds run out {shortfall_years} years early!")