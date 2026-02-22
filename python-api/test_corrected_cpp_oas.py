#!/usr/bin/env python3
"""
Test Corporate-Optimized with CORRECT CPP/OAS ages
Juan and Daniela are delaying CPP and OAS until age 70
"""

import requests
import json

def test_corrected_parameters():
    """Test with CPP/OAS starting at age 70"""

    print("="*80)
    print("CORPORATE-OPTIMIZED TEST - CORRECTED CPP/OAS AGES")
    print("="*80)

    # CORRECTED: CPP and OAS start at age 70, not 65/66
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
            'cpp_start_age': 70,  # CORRECTED: Delayed to 70
            'cpp_annual_at_start': 15000,  # Base amount (enhancement calculated by system)
            'oas_start_age': 70,  # CORRECTED: Delayed to 70
            'oas_annual_at_start': 8000,  # Base amount (enhancement calculated by system)
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
            'cpp_start_age': 70,  # CORRECTED: Delayed to 70
            'cpp_annual_at_start': 15000,  # Base amount (enhancement calculated by system)
            'oas_start_age': 70,  # CORRECTED: Delayed to 70
            'oas_annual_at_start': 8000,  # Base amount (enhancement calculated by system)
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
        'tfsa_contribution_each': 7000
    }

    print("\n📊 CORRECTED PARAMETERS:")
    print("  • Juan & Daniela: Both delaying CPP/OAS until age 70")
    print("  • CPP at 70: $21,420 each (42% enhancement)")
    print("  • OAS at 70: $9,680 each (36% enhancement)")
    print("  • No government income for first 5 years (ages 65-69)")
    print("  • Province: Alberta")
    print("  • Strategy: corporate-optimized")

    print("\n⏳ Running simulation with corrected parameters...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()
    summary = data.get('summary', {})

    print("\n" + "="*80)
    print("RESULTS WITH CORRECTED CPP/OAS AGES")
    print("="*80)

    # Key metrics
    health_score = summary.get('health_score', 0)
    success_rate = summary.get('success_rate', 0)
    total_underfunding = summary.get('total_underfunding', 0)
    underfunded_years = summary.get('total_underfunded_years', 0)
    final_estate = summary.get('final_estate_after_tax', 0)
    total_tax_paid = summary.get('total_tax_paid', 0)

    print(f"\n🎯 KEY METRICS:")
    print(f"  • Health Score: {health_score}/100")
    print(f"  • Success Rate: {success_rate:.1f}%")
    print(f"  • Underfunded Years: {underfunded_years}")
    print(f"  • Total Shortfall: ${total_underfunding:,.0f}")
    print(f"  • Final Estate: ${final_estate:,.0f}")
    print(f"  • Total Tax Paid: ${total_tax_paid:,.0f}")

    # Check Year 1 (no government income)
    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        print(f"\n📅 YEAR 1 (Age 65 - No CPP/OAS):")
        print(f"  • Corporate Withdrawals: ${year1.get('corporate_withdrawal_p1', 0) + year1.get('corporate_withdrawal_p2', 0):,.0f}")
        print(f"  • RRIF Withdrawals: ${year1.get('rrif_withdrawal_p1', 0) + year1.get('rrif_withdrawal_p2', 0):,.0f}")
        print(f"  • Total Tax: ${year1.get('tax_payable_p1', 0) + year1.get('tax_payable_p2', 0):,.0f}")
        print(f"  • Gap: {year1.get('gap', False)}")

        # Check Year 6 (CPP/OAS starts)
        if len(data['year_by_year']) > 5:
            year6 = data['year_by_year'][5]
            print(f"\n📅 YEAR 6 (Age 70 - CPP/OAS Starts):")
            print(f"  • CPP Income: ${year6.get('cpp_income_p1', 0) + year6.get('cpp_income_p2', 0):,.0f}")
            print(f"  • OAS Income: ${year6.get('oas_income_p1', 0) + year6.get('oas_income_p2', 0):,.0f}")
            print(f"  • Corporate Withdrawals: ${year6.get('corporate_withdrawal_p1', 0) + year6.get('corporate_withdrawal_p2', 0):,.0f}")
            print(f"  • RRIF Withdrawals: ${year6.get('rrif_withdrawal_p1', 0) + year6.get('rrif_withdrawal_p2', 0):,.0f}")

    # Diagnosis
    print("\n" + "="*80)
    print("ANALYSIS")
    print("="*80)

    if health_score == 100:
        print("\n✅ SUCCESS! Test now shows 100/100 - Matches frontend!")
        print("   The delayed CPP/OAS was the key difference.")
    else:
        print(f"\n⚠️ Test shows {health_score}/100 - Still doesn't match frontend (100/100)")
        print("\nRemaining issues to investigate:")
        print("  1. Check if enhanced CPP/OAS amounts are correct")
        print("  2. Verify other parameters match exactly")
        print("  3. Check for any other configuration differences")

    return health_score

if __name__ == '__main__':
    score = test_corrected_parameters()
    print("\n" + "="*80)
    print(f"Final Result: {score}/100")
    if score == 100:
        print("✅ RESOLVED: Test matches frontend!")
    else:
        print("❌ Still investigating discrepancy...")
    print("="*80)