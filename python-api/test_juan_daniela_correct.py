#!/usr/bin/env python3
"""
Test Juan and Daniela with CORRECT ages and parameters
Juan: Born 1960, Age 66 in 2026
Daniela: Born 1961, Age 65 in 2026
Both delay CPP/OAS until age 70
"""

import requests
import json

def test_juan_daniela():
    """Test with correct ages and all parameters matching frontend"""

    print("="*80)
    print("JUAN & DANIELA - CORRECT CONFIGURATION TEST")
    print("="*80)

    # Juan & Daniela with correct ages and frontend defaults
    payload = {
        'p1': {
            'name': 'Juan',
            'start_age': 66,  # Juan is 66 in 2026 (born 1960)
            'rrif_balance': 189000,
            'tfsa_balance': 192200,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 448200,
            'corp_cash_bucket': 400000,
            'corp_gic_bucket': 400000,
            'corp_invest_bucket': 422000,
            'corporate_balance': 0,
            'cpp_start_age': 70,  # Delayed to 70
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,  # Delayed to 70
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': 'Daniela',
            'start_age': 65,  # Daniela is 65 in 2026 (born 1961)
            'rrif_balance': 263000,
            'tfsa_balance': 221065,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 448200,
            'corp_cash_bucket': 400000,
            'corp_gic_bucket': 400000,
            'corp_invest_bucket': 422000,
            'corporate_balance': 0,
            'cpp_start_age': 70,  # Delayed to 70
            'cpp_annual_at_start': 15000,
            'oas_start_age': 70,  # Delayed to 70
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': True,
        'province': 'AB',  # Alberta
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
        'tfsa_contribution_each': 7000  # $7,000 each = $14,000 total
    }

    print("\n📊 CONFIGURATION SUMMARY:")
    print("  • Juan: Born 1960, Age 66 in 2026")
    print("  • Daniela: Born 1961, Age 65 in 2026")
    print("  • Province: Alberta")
    print("  • Strategy: Corporate-Optimized")
    print("  • TFSA Contributions: $7,000 each ($14,000/year)")
    print("  • CPP/OAS: Both delayed to age 70")
    print("  • Juan gets CPP/OAS in 2030 (age 70)")
    print("  • Daniela gets CPP/OAS in 2031 (age 70)")

    print("\n⏳ Running simulation...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()
    summary = data.get('summary', {})

    print("\n" + "="*80)
    print("SIMULATION RESULTS")
    print("="*80)

    # Key metrics
    health_score = summary.get('health_score', 0)
    success_rate = summary.get('success_rate', 0)
    total_underfunding = summary.get('total_underfunding', 0)
    underfunded_years = summary.get('total_underfunded_years', 0)
    final_estate = summary.get('final_estate_after_tax', 0)

    print(f"\n🎯 KEY METRICS:")
    print(f"  • Health Score: {health_score}/100")
    print(f"  • Success Rate: {success_rate:.1f}%")
    print(f"  • Underfunded Years: {underfunded_years}")
    print(f"  • Total Shortfall: ${total_underfunding:,.0f}")
    print(f"  • Final Estate: ${final_estate:,.0f}")

    # Check Year 1 (2026)
    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        print("\n" + "="*80)
        print("YEAR 1 (2026) VERIFICATION")
        print("="*80)

        print(f"\n📅 AGES:")
        print(f"  • Juan: {year1.get('age_p1', 0)} (Expected: 66)")
        print(f"  • Daniela: {year1.get('age_p2', 0)} (Expected: 65)")

        print(f"\n💰 TFSA CONTRIBUTIONS:")
        tfsa_p1 = year1.get('tfsa_contribution_p1', 0)
        tfsa_p2 = year1.get('tfsa_contribution_p2', 0)
        print(f"  • Juan: ${tfsa_p1:,.0f} (Expected: $7,000)")
        print(f"  • Daniela: ${tfsa_p2:,.0f} (Expected: $7,000)")
        print(f"  • Total: ${tfsa_p1 + tfsa_p2:,.0f} (Expected: $14,000)")

        print(f"\n💵 WITHDRAWALS:")
        print(f"  • Corporate: ${year1.get('corporate_withdrawal_p1', 0) + year1.get('corporate_withdrawal_p2', 0):,.0f}")
        print(f"  • RRIF: ${year1.get('rrif_withdrawal_p1', 0) + year1.get('rrif_withdrawal_p2', 0):,.0f}")
        print(f"  • NonReg: ${year1.get('nonreg_withdrawal_p1', 0) + year1.get('nonreg_withdrawal_p2', 0):,.0f}")
        print(f"  • TFSA: ${year1.get('tfsa_withdrawal_p1', 0) + year1.get('tfsa_withdrawal_p2', 0):,.0f}")

        print(f"\n🏦 BALANCES:")
        print(f"  • Corporate: ${year1.get('corporate_p1', 0) + year1.get('corporate_p2', 0):,.0f}")
        print(f"  • RRIF: ${year1.get('rrif_p1', 0) + year1.get('rrif_p2', 0):,.0f}")
        print(f"  • NonReg: ${year1.get('nonreg_p1', 0) + year1.get('nonreg_p2', 0):,.0f}")
        print(f"  • TFSA: ${year1.get('tfsa_p1', 0) + year1.get('tfsa_p2', 0):,.0f}")

    # Check CPP/OAS start years
    print("\n" + "="*80)
    print("CPP/OAS START VERIFICATION")
    print("="*80)

    if data.get('year_by_year'):
        # Year 2030 - Juan turns 70
        year_2030_idx = 4  # 2026 + 4 = 2030
        if len(data['year_by_year']) > year_2030_idx:
            year_2030 = data['year_by_year'][year_2030_idx]
            print(f"\n📅 2030 (Juan age 70):")
            print(f"  • Juan CPP: ${year_2030.get('cpp_p1', 0):,.0f} (Should start)")
            print(f"  • Juan OAS: ${year_2030.get('oas_p1', 0):,.0f} (Should start)")
            print(f"  • Daniela CPP: ${year_2030.get('cpp_p2', 0):,.0f} (Should be 0)")
            print(f"  • Daniela OAS: ${year_2030.get('oas_p2', 0):,.0f} (Should be 0)")

        # Year 2031 - Daniela turns 70
        year_2031_idx = 5  # 2026 + 5 = 2031
        if len(data['year_by_year']) > year_2031_idx:
            year_2031 = data['year_by_year'][year_2031_idx]
            print(f"\n📅 2031 (Daniela age 70):")
            print(f"  • Juan CPP: ${year_2031.get('cpp_p1', 0):,.0f} (Should continue)")
            print(f"  • Juan OAS: ${year_2031.get('oas_p1', 0):,.0f} (Should continue)")
            print(f"  • Daniela CPP: ${year_2031.get('cpp_p2', 0):,.0f} (Should start)")
            print(f"  • Daniela OAS: ${year_2031.get('oas_p2', 0):,.0f} (Should start)")

    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80)

    return health_score

if __name__ == '__main__':
    score = test_juan_daniela()
    print(f"\n✅ Final Health Score: {score}/100")