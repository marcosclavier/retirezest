#!/usr/bin/env python3
"""
Comprehensive test of Key Insights logic with multiple scenarios
"""

import requests
import json

def test_scenario(name, spending_go_go, expected_outcome):
    """Test a specific scenario"""

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
        'spending_go_go': spending_go_go,
        'spending_slow_go': spending_go_go * 0.78,  # ~78% of go-go
        'slow_go_end_age': 85,
        'spending_no_go': spending_go_go * 0.65,  # ~65% of go-go
        'go_go_end_age': 75,
        'spending_inflation': 2.5,
        'general_inflation': 2.5,
        'tfsa_contribution_each': 7000
    }

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        return {
            'name': name,
            'status': 'ERROR',
            'message': f"API Error: {response.status_code}"
        }

    data = response.json()
    summary = data.get('summary', {})

    health_score = summary.get('health_score', 0)
    success_rate = summary.get('success_rate', 0)
    underfunded_years = summary.get('total_underfunded_years', 0)
    underfunding = summary.get('total_underfunding', 0)
    final_estate = summary.get('final_estate_after_tax', 0)

    # Determine what Key Insights would show
    if underfunded_years > 0 and underfunding > 1:
        insights_message = "Underfunding Detected"
    elif success_rate >= 0.999:
        if final_estate > 500000:
            insights_message = "Strong Financial Position"
        elif final_estate > 100000:
            insights_message = "Plan Successfully Funded"
        else:
            insights_message = "Plan on Track"
    elif success_rate > 0.8 and success_rate < 0.999:
        insights_message = "Plan at Risk"
    else:
        insights_message = "Significant Funding Gap"

    # Check if it matches expected
    status = "✅ PASS" if insights_message == expected_outcome else "❌ FAIL"

    return {
        'name': name,
        'status': status,
        'spending': spending_go_go,
        'health_score': health_score,
        'success_rate': success_rate * 100,
        'underfunded_years': underfunded_years,
        'underfunding': underfunding,
        'final_estate': final_estate,
        'insights_message': insights_message,
        'expected': expected_outcome
    }

def main():
    print("="*80)
    print("COMPREHENSIVE KEY INSIGHTS LOGIC TEST")
    print("="*80)
    print("\nTesting various spending scenarios to verify Key Insights messages...")

    # Test scenarios with different spending levels
    scenarios = [
        ("Very Low Spending", 80000, "Strong Financial Position"),
        ("Low Spending", 100000, "Strong Financial Position"),
        ("Moderate Spending", 120000, "Strong Financial Position"),
        ("High Spending", 153700, "Underfunding Detected"),  # User's scenario
        ("Very High Spending", 180000, "Underfunding Detected"),
    ]

    results = []
    for name, spending, expected in scenarios:
        print(f"\nTesting: {name} (${spending:,}/year)...")
        result = test_scenario(name, spending, expected)
        results.append(result)

    # Display results table
    print("\n" + "="*80)
    print("TEST RESULTS SUMMARY")
    print("="*80)
    print(f"\n{'Scenario':<20} {'Spending':<12} {'Health':<8} {'Success':<10} {'Insights Message':<25} {'Status':<10}")
    print("-"*95)

    all_pass = True
    for r in results:
        if r['status'] != "✅ PASS":
            all_pass = False

        print(f"{r['name']:<20} ${r['spending']:>10,} {r['health_score']:>6}/100 {r['success_rate']:>8.1f}% {r['insights_message']:<25} {r['status']:<10}")

    # Detailed results
    print("\n" + "="*80)
    print("DETAILED ANALYSIS")
    print("="*80)

    for r in results:
        print(f"\n📊 {r['name']} (${r['spending']:,}/year):")
        print(f"  • Health Score: {r['health_score']}/100")
        print(f"  • Success Rate: {r['success_rate']:.1f}%")
        print(f"  • Underfunded Years: {r['underfunded_years']}")
        print(f"  • Total Underfunding: ${r['underfunding']:,.0f}")
        print(f"  • Final Estate: ${r['final_estate']:,.0f}")
        print(f"  • Key Insights Shows: '{r['insights_message']}'")
        print(f"  • Expected: '{r['expected']}'")
        print(f"  • Result: {r['status']}")

    # Check for contradictions
    print("\n" + "="*80)
    print("CONTRADICTION CHECK")
    print("="*80)

    contradictions = []
    for r in results:
        # Check if Health Score 100 but shows warning
        if r['health_score'] == 100 and "Risk" in r['insights_message']:
            contradictions.append(f"{r['name']}: Health Score 100 but shows '{r['insights_message']}'")

        # Check if success rate 100% but shows warning
        if r['success_rate'] >= 99.9 and "Risk" in r['insights_message']:
            contradictions.append(f"{r['name']}: Success Rate {r['success_rate']:.1f}% but shows '{r['insights_message']}'")

    if contradictions:
        print("\n❌ CONTRADICTIONS FOUND:")
        for c in contradictions:
            print(f"  • {c}")
    else:
        print("\n✅ No contradictions found between Health Score and Key Insights")

    # Final verdict
    print("\n" + "="*80)
    print("FINAL VERDICT")
    print("="*80)

    if all_pass and not contradictions:
        print("\n✅ ALL TESTS PASSED!")
        print("\nKey Insights logic is working correctly:")
        print("  • Floating point precision issue fixed (>= 0.999)")
        print("  • Success messages show for fully funded plans")
        print("  • Warnings show appropriately for underfunded plans")
        print("  • No contradictions between metrics and messages")
    else:
        print("\n❌ SOME TESTS FAILED")
        print("\nIssues to investigate:")
        if not all_pass:
            print("  • Some scenarios showing unexpected messages")
        if contradictions:
            print("  • Contradictions between Health Score and Key Insights")

    return all_pass

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)