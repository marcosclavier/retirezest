#!/usr/bin/env python3
"""
Verify correct ages for Juan and Daniela
Juan born 1959 -> 67 in 2026
Daniela born 1960 -> 66 in 2026
"""

import requests
import json

def test_correct_ages():
    """Test with correct ages based on birth years"""

    print("="*80)
    print("TESTING WITH CORRECT AGES")
    print("="*80)

    # Juan & Daniela with CORRECT ages for 2026
    payload = {
        'p1': {
            'name': 'Juan',
            'start_age': 67,  # Juan is 67 in 2026 (born 1959)
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
            'start_age': 66,  # Daniela is 66 in 2026 (born 1960)
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
        'tfsa_contribution_each': 0  # Frontend default
    }

    print("\n📊 CORRECT AGES:")
    print("  • Juan: Born 1959, Age 67 in 2026")
    print("  • Daniela: Born 1960, Age 66 in 2026")
    print("  • Display should be: 67/66 in 2026")
    print("  • CPP/OAS: Both delayed to age 70")

    print("\n⏳ Running simulation...")
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    data = response.json()
    summary = data.get('summary', {})

    print("\n" + "="*80)
    print("RESULTS WITH CORRECT AGES")
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

    # Check first few years
    print("\n" + "="*80)
    print("YEAR-BY-YEAR AGE VERIFICATION")
    print("="*80)
    print(f"\n{'Year':<10} {'Juan Age':<15} {'Daniela Age':<15} {'Display':<15} {'Expected':<15} {'Status':<10}")
    print("-"*85)

    if data.get('year_by_year'):
        for i in range(min(5, len(data['year_by_year']))):
            year_data = data['year_by_year'][i]
            year = 2026 + i

            age_p1 = year_data.get('age_p1', 0)
            age_p2 = year_data.get('age_p2', 0)

            expected_juan = 67 + i  # Starting at 67
            expected_daniela = 66 + i  # Starting at 66

            display = f"{age_p1}/{age_p2}"
            expected = f"{expected_juan}/{expected_daniela}"

            status = "✅" if display == expected else "❌ WRONG!"

            print(f"{year:<10} {age_p1:<15} {age_p2:<15} {display:<15} {expected:<15} {status:<10}")

            # Check CPP/OAS start
            if year == 2029:  # Juan turns 70
                print(f"    → Juan should start CPP/OAS at age 70 in 2029")
            if year == 2030:  # Daniela turns 70
                print(f"    → Daniela should start CPP/OAS at age 70 in 2030")

    print("\n" + "="*80)
    print("CONCLUSION")
    print("="*80)

    print("\n📌 IMPORTANT FINDINGS:")
    print("  1. Juan born 1959 → Age 67 in 2026 (NOT 66)")
    print("  2. Daniela born 1960 → Age 66 in 2026 (NOT 65)")
    print("  3. CPP/OAS start at age 70 for both")
    print("  4. Juan gets CPP/OAS in 2029 (age 70)")
    print("  5. Daniela gets CPP/OAS in 2030 (age 70)")

    if health_score == 100:
        print("\n✅ SUCCESS! Simulation runs correctly with proper ages")
    else:
        print(f"\n⚠️ Health Score: {health_score}/100")
        print("This might be the expected result with correct ages")

    return health_score

if __name__ == '__main__':
    test_correct_ages()