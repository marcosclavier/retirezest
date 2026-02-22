#!/usr/bin/env python3
"""
Test for bug: Gaps appearing when TFSA contributions are enabled
despite having sufficient funds
"""

import requests
import json

def test_tfsa_gap_bug():
    """Test Juan & Daniela with TFSA contributions enabled"""

    print("="*80)
    print("TESTING TFSA GAP BUG")
    print("="*80)

    # Juan & Daniela with TFSA contributions enabled
    payload = {
        'p1': {
            'name': 'Juan',
            'start_age': 66,
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
        'tfsa_contribution_each': 7000  # $7,000 each = $14,000/year
    }

    print("\n📊 TEST CONFIGURATION:")
    print("  • TFSA Contributions: $7,000 each ($14,000/year)")
    print("  • Total Assets: ~$4.2M")
    print("  • Spending: $153,700/year (go-go phase)")
    print("  • Strategy: Corporate-Optimized")

    print("\n⏳ Running simulation...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()
    summary = data.get('summary', {})

    print("\n" + "="*80)
    print("SUMMARY RESULTS")
    print("="*80)

    health_score = summary.get('health_score', 0)
    success_rate = summary.get('success_rate', 0)
    underfunded_years = summary.get('total_underfunded_years', 0)
    total_underfunding = summary.get('total_underfunding', 0)

    print(f"\n🎯 KEY METRICS:")
    print(f"  • Health Score: {health_score}/100")
    print(f"  • Success Rate: {success_rate:.1f}%")
    print(f"  • Underfunded Years: {underfunded_years}")
    print(f"  • Total Shortfall: ${total_underfunding:,.0f}")

    # Check specific years 2031 and 2032
    print("\n" + "="*80)
    print("CHECKING YEARS 2031-2032 (WHERE GAPS APPEAR)")
    print("="*80)

    if data.get('year_by_year'):
        for year_data in data['year_by_year']:
            if year_data['year'] in [2031, 2032]:
                year = year_data['year']
                print(f"\n📅 YEAR {year} (Ages {year_data.get('age_p1')}/{year_data.get('age_p2')}):")

                # Income
                total_income = (year_data.get('cpp_p1', 0) + year_data.get('cpp_p2', 0) +
                               year_data.get('oas_p1', 0) + year_data.get('oas_p2', 0))
                print(f"  • Total Income: ${total_income:,.0f}")

                # Withdrawals
                total_withdrawals = (year_data.get('corporate_withdrawal_p1', 0) +
                                   year_data.get('corporate_withdrawal_p2', 0) +
                                   year_data.get('rrif_withdrawal_p1', 0) +
                                   year_data.get('rrif_withdrawal_p2', 0) +
                                   year_data.get('nonreg_withdrawal_p1', 0) +
                                   year_data.get('nonreg_withdrawal_p2', 0) +
                                   year_data.get('tfsa_withdrawal_p1', 0) +
                                   year_data.get('tfsa_withdrawal_p2', 0))
                print(f"  • Total Withdrawals: ${total_withdrawals:,.0f}")

                # Spending needs
                spending = year_data.get('spending_need', 0)
                tfsa_contrib = (year_data.get('tfsa_contribution_p1', 0) +
                               year_data.get('tfsa_contribution_p2', 0))
                taxes = year_data.get('total_tax', 0)
                total_needed = spending + tfsa_contrib + taxes

                print(f"  • Spending Need: ${spending:,.0f}")
                print(f"  • TFSA Contrib: ${tfsa_contrib:,.0f}")
                print(f"  • Taxes: ${taxes:,.0f}")
                print(f"  • Total Needed: ${total_needed:,.0f}")

                # Available funds
                gross_available = total_income + total_withdrawals
                print(f"  • Gross Available: ${gross_available:,.0f}")

                # Gap
                gap = year_data.get('gap', False)
                spending_gap = year_data.get('spending_gap', 0)
                print(f"  • Gap Flag: {gap}")
                print(f"  • Spending Gap: ${spending_gap:,.0f}")

                # Account balances
                total_assets = (year_data.get('corporate_p1', 0) + year_data.get('corporate_p2', 0) +
                               year_data.get('rrif_p1', 0) + year_data.get('rrif_p2', 0) +
                               year_data.get('tfsa_p1', 0) + year_data.get('tfsa_p2', 0) +
                               year_data.get('nonreg_p1', 0) + year_data.get('nonreg_p2', 0))
                print(f"  • Total Assets: ${total_assets:,.0f}")

                if gap and total_assets > 1000000:
                    print("  ❌ BUG DETECTED: Gap showing despite having ${:,.0f} in assets!".format(total_assets))

    print("\n" + "="*80)
    print("ANALYSIS")
    print("="*80)

    if underfunded_years > 0:
        print("\n❌ BUG CONFIRMED!")
        print("The system is showing gaps when TFSA contributions are enabled,")
        print("even though there are sufficient funds available.")
        print("\nLikely cause: The withdrawal logic is not properly accounting")
        print("for TFSA contributions when determining how much to withdraw.")
    else:
        print("\n✅ No gaps found - the bug may have been fixed")

    return underfunded_years

if __name__ == '__main__':
    gaps = test_tfsa_gap_bug()
    if gaps > 0:
        print(f"\n🔴 TEST FAILED: {gaps} years with gaps despite sufficient funds")
    else:
        print("\n🟢 TEST PASSED: No false gaps detected")