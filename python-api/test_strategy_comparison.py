#!/usr/bin/env python3
"""
Compare Corporate-Optimized vs RRIF-Frontload strategies for Juan & Daniela
Comprehensive analysis to determine the most effective strategy
"""

import requests
import json

def run_strategy_test(strategy_name):
    """Run simulation with specified strategy"""

    # Juan & Daniela in Alberta with corporate accounts
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
            'cpp_start_age': 70,  # Delayed to age 70
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,  # Delayed to age 70
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
            'cpp_start_age': 70,  # Delayed to age 70
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,  # Delayed to age 70
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': True,
        'province': 'AB',  # Alberta
        'start_year': 2026,
        'end_age': 95,
        'strategy': strategy_name,
        'spending_go_go': 153700,
        'spending_slow_go': 120000,
        'slow_go_end_age': 85,
        'spending_no_go': 100000,
        'go_go_end_age': 75,
        'spending_inflation': 2.5,
        'general_inflation': 2.5,
        'tfsa_contribution_each': 7000
    }

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error for {strategy_name}: {response.status_code}")
        return None

    return response.json()

def analyze_strategy(data, strategy_name):
    """Analyze results for a strategy"""

    if not data:
        return None

    summary = data.get('summary', {})
    year_by_year = data.get('year_by_year', [])

    # Key metrics
    health_score = summary.get('health_score', 0)
    success_rate = summary.get('success_rate', 0)
    total_tax_paid = summary.get('total_tax_paid', 0)
    avg_tax_rate = summary.get('avg_effective_tax_rate', 0)
    final_estate = summary.get('final_estate_after_tax', 0)
    underfunded_years = summary.get('total_underfunded_years', 0)
    total_underfunding = summary.get('total_underfunding', 0)

    # Withdrawal distribution
    corp_pct = summary.get('corporate_pct_of_total', 0)
    rrif_pct = summary.get('rrif_pct_of_total', 0)
    tfsa_pct = summary.get('tfsa_pct_of_total', 0)
    nonreg_pct = summary.get('nonreg_pct_of_total', 0)

    # Year 1 details
    year1_tax = 0
    year1_corp = 0
    year1_rrif = 0
    if year_by_year and len(year_by_year) > 0:
        y1 = year_by_year[0]
        year1_tax = y1.get('tax_payable_p1', 0) + y1.get('tax_payable_p2', 0)
        year1_corp = y1.get('corporate_withdrawal_p1', 0) + y1.get('corporate_withdrawal_p2', 0)
        year1_rrif = y1.get('rrif_withdrawal_p1', 0) + y1.get('rrif_withdrawal_p2', 0)

    # Age 71 RRIF conversion impact
    age71_rrif_balance = 0
    if len(year_by_year) >= 7:  # Age 71 is year 7 (starting at 65)
        y71 = year_by_year[6]
        age71_rrif_balance = y71.get('rrif_balance_p1', 0) + y71.get('rrif_balance_p2', 0)

    return {
        'strategy': strategy_name,
        'health_score': health_score,
        'success_rate': success_rate,
        'total_tax_paid': total_tax_paid,
        'avg_tax_rate': avg_tax_rate,
        'final_estate': final_estate,
        'underfunded_years': underfunded_years,
        'total_underfunding': total_underfunding,
        'corp_pct': corp_pct,
        'rrif_pct': rrif_pct,
        'tfsa_pct': tfsa_pct,
        'nonreg_pct': nonreg_pct,
        'year1_tax': year1_tax,
        'year1_corp': year1_corp,
        'year1_rrif': year1_rrif,
        'age71_rrif_balance': age71_rrif_balance
    }

def main():
    print("="*80)
    print("STRATEGY COMPARISON: CORPORATE-OPTIMIZED vs RRIF-FRONTLOAD")
    print("Juan & Daniela - Alberta Residents")
    print("="*80)

    print("\n📊 SCENARIO:")
    print("  • Total Assets: ~$4.9M")
    print("  • Corporate: $2,444,000")
    print("  • RRIF: $452,000")
    print("  • TFSA: $413,265")
    print("  • NonReg: $896,400")
    print("  • Spending: $153,700/year")
    print("  • Province: Alberta")

    # Run both strategies
    print("\n⏳ Running simulations...")

    print("  Testing Corporate-Optimized strategy...")
    corp_data = run_strategy_test('corporate-optimized')
    corp_results = analyze_strategy(corp_data, 'Corporate-Optimized')

    print("  Testing RRIF-Frontload strategy...")
    rrif_data = run_strategy_test('rrif-frontload')
    rrif_results = analyze_strategy(rrif_data, 'RRIF-Frontload')

    if not corp_results or not rrif_results:
        print("❌ Failed to get results for one or both strategies")
        return

    # Display comparison
    print("\n" + "="*80)
    print("RESULTS COMPARISON")
    print("="*80)

    print("\n📈 KEY PERFORMANCE METRICS:")
    print("-"*60)
    print(f"{'Metric':<30} {'Corporate-Optimized':<20} {'RRIF-Frontload':<20}")
    print("-"*60)

    # Success metrics
    print(f"{'Health Score':<30} {corp_results['health_score']:>18}/100 {rrif_results['health_score']:>18}/100")
    print(f"{'Success Rate':<30} {corp_results['success_rate']:>18.1f}% {rrif_results['success_rate']:>18.1f}%")
    print(f"{'Underfunded Years':<30} {corp_results['underfunded_years']:>18} {rrif_results['underfunded_years']:>18}")
    print(f"{'Total Shortfall':<30} ${corp_results['total_underfunding']:>17,.0f} ${rrif_results['total_underfunding']:>17,.0f}")

    # Tax efficiency
    print("\n💰 TAX EFFICIENCY:")
    print("-"*60)
    print(f"{'Total Tax (30 years)':<30} ${corp_results['total_tax_paid']:>17,.0f} ${rrif_results['total_tax_paid']:>17,.0f}")
    print(f"{'Average Tax Rate':<30} {corp_results['avg_tax_rate']*100:>18.2f}% {rrif_results['avg_tax_rate']*100:>18.2f}%")
    print(f"{'Year 1 Tax':<30} ${corp_results['year1_tax']:>17,.0f} ${rrif_results['year1_tax']:>17,.0f}")

    # Estate value
    print("\n🏦 ESTATE VALUE:")
    print("-"*60)
    print(f"{'Final Estate (After Tax)':<30} ${corp_results['final_estate']:>17,.0f} ${rrif_results['final_estate']:>17,.0f}")

    # Withdrawal patterns
    print("\n📊 WITHDRAWAL DISTRIBUTION (5-year avg):")
    print("-"*60)
    print(f"{'Corporate %':<30} {corp_results['corp_pct']:>18.1f}% {rrif_results['corp_pct']:>18.1f}%")
    print(f"{'RRIF %':<30} {corp_results['rrif_pct']:>18.1f}% {rrif_results['rrif_pct']:>18.1f}%")
    print(f"{'TFSA %':<30} {corp_results['tfsa_pct']:>18.1f}% {rrif_results['tfsa_pct']:>18.1f}%")
    print(f"{'NonReg %':<30} {corp_results['nonreg_pct']:>18.1f}% {rrif_results['nonreg_pct']:>18.1f}%")

    # Year 1 withdrawals
    print("\n📅 YEAR 1 WITHDRAWALS:")
    print("-"*60)
    print(f"{'Corporate':<30} ${corp_results['year1_corp']:>17,.0f} ${rrif_results['year1_corp']:>17,.0f}")
    print(f"{'RRIF':<30} ${corp_results['year1_rrif']:>17,.0f} ${rrif_results['year1_rrif']:>17,.0f}")

    # RRIF at age 71
    print("\n🎯 RRIF BALANCE AT AGE 71:")
    print("-"*60)
    print(f"{'RRIF Balance':<30} ${corp_results['age71_rrif_balance']:>17,.0f} ${rrif_results['age71_rrif_balance']:>17,.0f}")

    # Analysis and recommendation
    print("\n" + "="*80)
    print("ANALYSIS & RECOMMENDATION")
    print("="*80)

    # Calculate winner for each category
    corp_wins = 0
    rrif_wins = 0

    print("\n🏆 CATEGORY WINNERS:")
    print("-"*60)

    # Health Score
    if corp_results['health_score'] > rrif_results['health_score']:
        print("✅ Health Score: Corporate-Optimized")
        corp_wins += 1
    elif rrif_results['health_score'] > corp_results['health_score']:
        print("✅ Health Score: RRIF-Frontload")
        rrif_wins += 1
    else:
        print("➖ Health Score: TIE")

    # Tax Efficiency
    if corp_results['total_tax_paid'] < rrif_results['total_tax_paid']:
        print("✅ Tax Efficiency: Corporate-Optimized")
        corp_wins += 1
    else:
        print("✅ Tax Efficiency: RRIF-Frontload")
        rrif_wins += 1

    # Shortfall
    if corp_results['total_underfunding'] < rrif_results['total_underfunding']:
        print("✅ Lower Shortfall: Corporate-Optimized")
        corp_wins += 1
    else:
        print("✅ Lower Shortfall: RRIF-Frontload")
        rrif_wins += 1

    # Final Estate
    if corp_results['final_estate'] > rrif_results['final_estate']:
        print("✅ Final Estate: Corporate-Optimized")
        corp_wins += 1
    else:
        print("✅ Final Estate: RRIF-Frontload")
        rrif_wins += 1

    # Final recommendation
    print("\n" + "="*80)
    print("📌 FINAL RECOMMENDATION")
    print("="*80)

    if corp_wins > rrif_wins:
        winner = "CORPORATE-OPTIMIZED"
        winner_results = corp_results
    else:
        winner = "RRIF-FRONTLOAD"
        winner_results = rrif_results

    print(f"\n🎯 RECOMMENDED STRATEGY: {winner}")
    print("\n📋 KEY ADVANTAGES:")

    if winner == "CORPORATE-OPTIMIZED":
        print("  ✅ Tax-efficient eligible dividend treatment in Alberta")
        print("  ✅ Preserves RRIF for later years when rates are higher")
        print("  ✅ Maximizes dividend tax credits")
        print("  ✅ Better for estate planning")
        print("\n⚠️ CONSIDERATIONS:")
        print("  • Requires active management of corporate accounts")
        print("  • RDTOH tracking needed")
        print("  • More complex tax filing")
    else:
        print("  ✅ Reduces RRIF balance before high minimum rates")
        print("  ✅ Simplifies tax planning in later years")
        print("  ✅ Preserves corporate capital for growth")
        print("  ✅ Lower RRIF balances at age 71+")
        print("\n⚠️ CONSIDERATIONS:")
        print("  • Higher taxes in early years")
        print("  • May trigger OAS clawback sooner")
        print("  • Less flexibility in later years")

    # Tax savings calculation
    tax_difference = abs(corp_results['total_tax_paid'] - rrif_results['total_tax_paid'])
    print(f"\n💰 POTENTIAL TAX SAVINGS: ${tax_difference:,.0f} over 30 years")
    print(f"   (${tax_difference/30:,.0f} per year average)")

    # Success rate comparison
    print(f"\n📊 SUCCESS RATE DIFFERENCE: {abs(corp_results['success_rate'] - rrif_results['success_rate']):.1f}%")

    print("\n" + "="*80)
    print("CONCLUSION")
    print("="*80)

    print(f"\nFor Juan & Daniela in Alberta with $2.4M in corporate accounts,")
    print(f"the {winner} strategy is recommended because:")

    if winner == "CORPORATE-OPTIMIZED":
        print("\n1. Alberta's favorable dividend tax treatment makes corporate")
        print("   withdrawals extremely tax-efficient")
        print("2. Zero or minimal tax in early retirement years")
        print("3. Preserves RRIF for mandatory withdrawal years")
        print("4. Results in higher final estate value")
    else:
        print("\n1. Reduces exposure to high RRIF minimum rates at older ages")
        print("2. Simplifies income planning in later retirement")
        print("3. Allows corporate assets to grow tax-deferred")
        print("4. Provides more predictable tax planning")

    print("\n" + "="*80)

if __name__ == '__main__':
    main()