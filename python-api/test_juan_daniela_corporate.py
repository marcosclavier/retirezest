#!/usr/bin/env python3
"""
Test for Juan and Daniela's scenario with $2.5M in corporate accounts
Testing corporate-optimized strategy with realistic couple scenario
"""

import requests
import json
import sys

def test_juan_daniela_corporate():
    """Test corporate-optimized strategy with Juan and Daniela's $2.5M corporate scenario"""

    print("=" * 80)
    print("TESTING JUAN & DANIELA - $2.5M CORPORATE SCENARIO")
    print("=" * 80)

    # Realistic scenario for Juan and Daniela
    payload = {
        'p1': {
            'name': 'Juan',
            'start_age': 60,  # Assuming Juan is 60
            'rrif_balance': 500000,  # $500k in RRIF
            'tfsa_balance': 100000,  # $100k in TFSA
            'nr_cash': 50000,  # Some non-reg cash
            'nr_gic': 100000,  # Some GICs
            'nr_invest': 200000,  # Some non-reg investments
            'corp_cash_bucket': 500000,  # $500k corporate cash
            'corp_gic_bucket': 500000,   # $500k corporate GICs
            'corp_invest_bucket': 1500000,  # $1.5M corporate investments
            'cpp_start_age': 65,
            'cpp_annual_at_start': 15000,  # Max CPP
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': 'Daniela',
            'start_age': 58,  # Assuming Daniela is 58
            'rrif_balance': 300000,  # $300k in RRIF
            'tfsa_balance': 100000,  # $100k in TFSA
            'nr_cash': 25000,
            'nr_gic': 50000,
            'nr_invest': 100000,
            'corp_cash_bucket': 0,  # Corporate owned by Juan
            'corp_gic_bucket': 0,
            'corp_invest_bucket': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 12000,
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': True,  # This is a couple
        'province': 'ON',
        'start_year': 2026,
        'end_age': 95,  # Plan to age 95
        'strategy': 'corporate-optimized',  # Use corporate-optimized strategy
        'spending_go_go': 150000,  # $150k/year go-go phase
        'spending_slow_go': 120000,  # $120k/year slow-go
        'slow_go_end_age': 85,
        'spending_no_go': 100000,  # $100k/year no-go
        'go_go_end_age': 75,
        'spending_inflation': 2.5,
        'general_inflation': 2.5,
        'tfsa_contribution_each': 7000  # Annual TFSA contributions
    }

    print("\nScenario Details:")
    print(f"  Juan (age 60):")
    print(f"    - Corporate: $2,500,000 (cash: $500k, GIC: $500k, invest: $1.5M)")
    print(f"    - RRIF: $500,000")
    print(f"    - TFSA: $100,000")
    print(f"    - NonReg: $350,000 total")
    print(f"  Daniela (age 58):")
    print(f"    - RRIF: $300,000")
    print(f"    - TFSA: $100,000")
    print(f"    - NonReg: $175,000 total")
    print(f"  Total Net Worth: ~$4,025,000")
    print(f"  Spending: $150k/year (go-go), $120k (slow-go), $100k (no-go)")
    print(f"  Strategy: corporate-optimized")

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=60)

    if response.status_code != 200:
        print(f"\n❌ ERROR: API returned status {response.status_code}")
        print(f"Response: {response.text[:1000]}")
        return False

    data = response.json()

    # Check if simulation was successful
    success_rate = data.get('success_rate', 0)
    final_estate = data.get('final_estate', 0)
    total_tax = data.get('lifetime_total_tax', 0)
    health_score = data.get('health_score', 0)

    print("\n" + "=" * 60)
    print("SIMULATION RESULTS")
    print("=" * 60)
    print(f"Success Rate: {success_rate:.1f}%")
    print(f"Final Estate: ${final_estate:,.0f}")
    print(f"Lifetime Total Tax: ${total_tax:,.0f}")
    print(f"Plan Health Score: {health_score}/100")

    if not data.get('five_year_plan'):
        print("\n❌ ERROR: No five_year_plan in response")
        return False

    # Analyze withdrawal pattern for first 5 years
    print("\n" + "=" * 60)
    print("WITHDRAWAL ANALYSIS (First 5 Years)")
    print("=" * 60)

    total_corp_5yr = 0
    total_rrif_5yr = 0
    total_nonreg_5yr = 0
    total_tfsa_5yr = 0

    for i in range(min(5, len(data['five_year_plan']))):
        year_data = data['five_year_plan'][i]
        year = year_data.get('year', 2026 + i)

        # Combined withdrawals for both partners
        corp_wd = year_data.get('corp_withdrawal_p1', 0) + year_data.get('corp_withdrawal_p2', 0)
        rrif_wd = year_data.get('rrif_withdrawal_p1', 0) + year_data.get('rrif_withdrawal_p2', 0)
        nonreg_wd = year_data.get('nonreg_withdrawal_p1', 0) + year_data.get('nonreg_withdrawal_p2', 0)
        tfsa_wd = year_data.get('tfsa_withdrawal_p1', 0) + year_data.get('tfsa_withdrawal_p2', 0)
        total_wd = year_data.get('total_withdrawn', 0)

        total_corp_5yr += corp_wd
        total_rrif_5yr += rrif_wd
        total_nonreg_5yr += nonreg_wd
        total_tfsa_5yr += tfsa_wd

        print(f"\nYear {year}:")
        print(f"  Corporate: ${corp_wd:,.0f}")
        print(f"  RRIF: ${rrif_wd:,.0f}")
        print(f"  NonReg: ${nonreg_wd:,.0f}")
        print(f"  TFSA: ${tfsa_wd:,.0f}")
        print(f"  Total: ${total_wd:,.0f}")

        # Check if corporate is being prioritized
        if i == 0 and corp_wd > 50000:
            print(f"  ✅ Corporate being used as primary source")
        elif i == 0 and corp_wd < 50000:
            print(f"  ⚠️  WARNING: Low corporate withdrawal in year 1")

    # Summary analysis
    print("\n" + "=" * 60)
    print("5-YEAR WITHDRAWAL SUMMARY")
    print("=" * 60)
    print(f"Total Corporate: ${total_corp_5yr:,.0f}")
    print(f"Total RRIF: ${total_rrif_5yr:,.0f}")
    print(f"Total NonReg: ${total_nonreg_5yr:,.0f}")
    print(f"Total TFSA: ${total_tfsa_5yr:,.0f}")

    # Calculate percentages
    total_all = total_corp_5yr + total_rrif_5yr + total_nonreg_5yr + total_tfsa_5yr
    if total_all > 0:
        corp_pct = (total_corp_5yr / total_all) * 100
        rrif_pct = (total_rrif_5yr / total_all) * 100
        nonreg_pct = (total_nonreg_5yr / total_all) * 100
        tfsa_pct = (total_tfsa_5yr / total_all) * 100

        print(f"\nWithdrawal Mix:")
        print(f"  Corporate: {corp_pct:.1f}%")
        print(f"  RRIF: {rrif_pct:.1f}%")
        print(f"  NonReg: {nonreg_pct:.1f}%")
        print(f"  TFSA: {tfsa_pct:.1f}%")

    # Analyze 10-year pattern if available
    if len(data.get('df_data', [])) >= 10:
        print("\n" + "=" * 60)
        print("10-YEAR ANALYSIS")
        print("=" * 60)

        total_corp_10yr = 0
        total_spending_10yr = 0

        for i in range(min(10, len(data['df_data']))):
            year_data = data['df_data'][i]
            corp_wd = year_data.get('corp_withdrawal_p1', 0) + year_data.get('corp_withdrawal_p2', 0)
            spending = year_data.get('spending_target', 0)
            total_corp_10yr += corp_wd
            total_spending_10yr += spending

        print(f"Total Corporate Withdrawals (10 years): ${total_corp_10yr:,.0f}")
        print(f"Total Spending Need (10 years): ${total_spending_10yr:,.0f}")

        if total_corp_10yr > 1000000:
            print(f"✅ Substantial corporate usage: ${total_corp_10yr:,.0f} over 10 years")
        else:
            print(f"⚠️  Lower than expected corporate usage")

    # Check estate planning efficiency
    print("\n" + "=" * 60)
    print("ESTATE & TAX EFFICIENCY")
    print("=" * 60)

    if success_rate >= 95:
        print(f"✅ Plan Success: {success_rate:.1f}% (Excellent)")
    elif success_rate >= 80:
        print(f"⚠️  Plan Success: {success_rate:.1f}% (Good, but some risk)")
    else:
        print(f"❌ Plan Success: {success_rate:.1f}% (Needs improvement)")

    if total_tax > 0:
        tax_efficiency = (1 - (total_tax / 4025000)) * 100  # Rough tax efficiency
        print(f"Tax Efficiency: ~{tax_efficiency:.1f}%")
        print(f"Effective Tax Rate: ~{(total_tax / 4025000) * 100:.1f}%")

    # Final verdict
    print("\n" + "=" * 60)
    print("STRATEGY ASSESSMENT")
    print("=" * 60)

    if total_corp_5yr > 500000:
        print("✅ Corporate-Optimized strategy is working well!")
        print(f"   - Using corporate accounts heavily (${total_corp_5yr:,.0f} in 5 years)")
        print("   - This helps with tax efficiency through eligible dividends")
        success = True
    else:
        print("❌ Corporate usage seems low for a $2.5M corporate portfolio")
        print(f"   - Only ${total_corp_5yr:,.0f} withdrawn in 5 years")
        print("   - Consider reviewing the strategy implementation")
        success = False

    # Recommendations
    print("\n" + "=" * 60)
    print("RECOMMENDATIONS FOR JUAN & DANIELA")
    print("=" * 60)
    print("1. Corporate-optimized strategy should prioritize corporate withdrawals")
    print("2. With $2.5M in corporate, expect significant eligible dividend income")
    print("3. TFSA should be preserved for estate planning")
    print("4. Consider income splitting opportunities between spouses")
    print("5. Monitor RDTOH refunds to optimize tax efficiency")

    return success


if __name__ == '__main__':
    print("\n🏢 " * 20)
    print("JUAN & DANIELA CORPORATE STRATEGY TEST")
    print("🏢 " * 20)

    success = test_juan_daniela_corporate()

    if success:
        print("\n🎉 TEST PASSED: Corporate strategy working for Juan & Daniela!")
        sys.exit(0)
    else:
        print("\n⚠️  TEST NEEDS REVIEW: Check corporate withdrawal patterns")
        sys.exit(1)