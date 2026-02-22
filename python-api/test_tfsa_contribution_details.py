#!/usr/bin/env python3
"""
Investigate TFSA contribution showing $25K instead of $7K in 2026
Check what's happening with TFSA contributions year by year
"""

import requests
import json

def test_tfsa_contributions():
    """Check TFSA contributions year by year"""

    print("="*80)
    print("TFSA CONTRIBUTION ANALYSIS")
    print("="*80)

    # Test with explicit TFSA contribution of $7,000
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
            'cpp_start_age': 70,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,
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
            'cpp_start_age': 70,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,
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
        'tfsa_contribution_each': 7000  # Explicitly set to $7,000
    }

    print("\n📊 TEST PARAMETERS:")
    print(f"  • TFSA Contribution Each: $7,000")
    print(f"  • Expected total per year: $14,000 (Juan + Daniela)")
    print(f"  • Start Year: 2026")

    print("\n⏳ Running simulation...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()

    # Check first 5 years
    print("\n" + "="*80)
    print("YEAR-BY-YEAR TFSA CONTRIBUTIONS")
    print("="*80)
    print(f"\n{'Year':<10} {'Age':<10} {'TFSA Cont. Juan':<20} {'TFSA Cont. Daniela':<20} {'Total':<15} {'Expected':<15}")
    print("-"*100)

    if data.get('year_by_year'):
        for i in range(min(10, len(data['year_by_year']))):
            year_data = data['year_by_year'][i]
            year = 2026 + i
            age = 65 + i

            tfsa_p1 = year_data.get('tfsa_contribution_p1', 0)
            tfsa_p2 = year_data.get('tfsa_contribution_p2', 0)
            total = tfsa_p1 + tfsa_p2

            # Check if it's regular contribution or includes surplus
            expected = 14000 if payload['tfsa_contribution_each'] > 0 else 0

            flag = ""
            if total > expected + 1000:  # Allow small rounding differences
                flag = "❌ TOO HIGH!"
            elif total < expected - 1000:
                flag = "⚠️ TOO LOW"
            else:
                flag = "✅"

            print(f"{year:<10} {age:<10} ${tfsa_p1:>17,.0f} ${tfsa_p2:>17,.0f} ${total:>12,.0f} ${expected:>12,.0f} {flag}")

            # If 2026 shows high contribution, analyze it
            if year == 2026 and total > 20000:
                print(f"\n⚠️ ISSUE DETECTED IN 2026:")
                print(f"  • Expected: $14,000 ($7,000 each)")
                print(f"  • Actual: ${total:,.0f}")
                print(f"  • Excess: ${total - 14000:,.0f}")

                # Check for surplus reinvestment
                surplus = year_data.get('surplus', 0)
                if surplus > 0:
                    print(f"  • Surplus available: ${surplus:,.0f}")
                    print(f"  • This might be surplus being reinvested in TFSA")

    # Check summary totals
    summary = data.get('summary', {})
    print("\n" + "="*80)
    print("SUMMARY ANALYSIS")
    print("="*80)

    if summary:
        years_simulated = summary.get('years_simulated', 31)
        health_score = summary.get('health_score', 0)

        print(f"\n📊 SIMULATION SUMMARY:")
        print(f"  • Health Score: {health_score}/100")
        print(f"  • Years Simulated: {years_simulated}")

    print("\n" + "="*80)
    print("DIAGNOSIS")
    print("="*80)

    print("\n🔍 FINDINGS:")
    print("If TFSA contributions in 2026 show $25K instead of $14K:")
    print("  1. The extra $11K might be surplus reinvestment")
    print("  2. The system might be automatically maximizing TFSA when there's excess cash")
    print("  3. This is separate from regular contributions")
    print("\n💡 RECOMMENDATION:")
    print("  • Regular TFSA contributions should be capped at $7K per person")
    print("  • Surplus reinvestment should be tracked separately")
    print("  • Frontend should distinguish between regular and surplus contributions")

if __name__ == '__main__':
    test_tfsa_contributions()