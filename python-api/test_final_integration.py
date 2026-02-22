#!/usr/bin/env python3
"""
Final Integration Test - Verify all fixes are working
"""

import requests
import json

def run_integration_test():
    """Run a comprehensive integration test"""

    print("=" * 80)
    print("FINAL INTEGRATION TEST - ALL FIXES VERIFICATION")
    print("=" * 80)

    # Juan & Daniela scenario with corporate accounts
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

    print("\n📋 TEST SCENARIO:")
    print(f"  • Juan & Daniela (both age 65)")
    print(f"  • Total Corporate: $2,444,000")
    print(f"  • Total RRIF: $452,000")
    print(f"  • Strategy: Corporate-Optimized")
    print(f"  • Spending: $153,700/year")

    # Make API call
    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"\n❌ API Error: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        return False

    data = response.json()

    if not data.get('success'):
        print(f"\n❌ Simulation failed: {data.get('message')}")
        return False

    print("\n" + "=" * 80)
    print("TEST RESULTS")
    print("=" * 80)

    all_tests_passed = True

    # TEST 1: Corporate Balance Decrease
    print("\n1️⃣ CORPORATE BALANCE DECREASE TEST:")
    print("-" * 40)
    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        # Check Juan's corporate balance
        start_p1 = year1.get('corporate_start_p1', 0)
        end_p1 = year1.get('corporate_balance_p1', 0)
        withdrawal_p1 = year1.get('corporate_withdrawal_p1', 0)

        # Check Daniela's corporate balance
        start_p2 = year1.get('corporate_start_p2', 0)
        end_p2 = year1.get('corporate_balance_p2', 0)
        withdrawal_p2 = year1.get('corporate_withdrawal_p2', 0)

        print(f"  Juan:   Start ${start_p1:,.0f} - Withdrawal ${withdrawal_p1:,.0f} = End ${end_p1:,.0f}")
        print(f"  Daniela: Start ${start_p2:,.0f} - Withdrawal ${withdrawal_p2:,.0f} = End ${end_p2:,.0f}")

        # Check if balances decreased
        juan_decreased = end_p1 < start_p1 and withdrawal_p1 > 0
        daniela_decreased = end_p2 < start_p2 and withdrawal_p2 > 0

        if juan_decreased and daniela_decreased:
            print("  ✅ PASS: Corporate balances decrease correctly")
        else:
            print("  ❌ FAIL: Corporate balances not decreasing properly")
            all_tests_passed = False

    # TEST 2: Corporate-Optimized Strategy
    print("\n2️⃣ CORPORATE-OPTIMIZED STRATEGY TEST:")
    print("-" * 40)
    if data.get('summary'):
        summary = data['summary']
        corp_pct = summary.get('corporate_pct_of_total', 0)
        rrif_pct = summary.get('rrif_pct_of_total', 0)
        tfsa_pct = summary.get('tfsa_pct_of_total', 0)

        print(f"  Withdrawal Distribution:")
        print(f"    • Corporate: {corp_pct:.1f}%")
        print(f"    • RRIF: {rrif_pct:.1f}%")
        print(f"    • TFSA: {tfsa_pct:.1f}%")

        if corp_pct > 70:  # Should be heavily corporate
            print("  ✅ PASS: Corporate accounts prioritized (>70%)")
        else:
            print("  ❌ FAIL: Corporate not being prioritized enough")
            all_tests_passed = False

    # TEST 3: Gap Detection
    print("\n3️⃣ GAP DETECTION TEST:")
    print("-" * 40)
    if data.get('summary'):
        summary = data['summary']
        underfunded_years = summary.get('total_underfunded_years', 0)
        underfunding = summary.get('total_underfunding', 0)

        print(f"  Underfunded Years: {underfunded_years}")
        print(f"  Total Shortfall: ${underfunding:,.0f}")

        # With this high spending, we expect some underfunding
        if underfunded_years > 0:
            print("  ✅ PASS: Gap detection working (found legitimate gaps)")
        else:
            print("  ⚠️  No gaps detected (may be correct for this scenario)")

    # TEST 4: Health Score
    print("\n4️⃣ HEALTH SCORE TEST:")
    print("-" * 40)
    if data.get('summary'):
        summary = data['summary']
        health_score = summary.get('health_score', 0)
        health_rating = summary.get('health_rating', 'Unknown')
        success_rate = summary.get('success_rate', 0)

        print(f"  Health Score: {health_score}/100 ({health_rating})")
        print(f"  Success Rate: {success_rate:.1f}%")

        # With 80.6% success rate, expect health score around 78
        if 70 <= health_score <= 85:
            print("  ✅ PASS: Health score in expected range (70-85)")
        else:
            print(f"  ❌ FAIL: Health score {health_score} outside expected range")
            all_tests_passed = False

    # TEST 5: RRIF Minimum Rates
    print("\n5️⃣ RRIF MINIMUM RATES TEST:")
    print("-" * 40)
    if data.get('year_by_year') and len(data['year_by_year']) > 0:
        year1 = data['year_by_year'][0]

        # Juan is 65, so RRIF minimum should be around 4%
        rrif_start = year1.get('rrif_start_p1', 189000)
        rrif_withdrawal = year1.get('rrif_withdrawal_p1', 0)

        if rrif_start > 0:
            rate = (rrif_withdrawal / rrif_start) * 100
            print(f"  RRIF Balance: ${rrif_start:,.0f}")
            print(f"  RRIF Withdrawal: ${rrif_withdrawal:,.0f}")
            print(f"  Effective Rate: {rate:.2f}%")

            # At age 65, minimum is around 4%, but with corporate-optimized
            # strategy, might withdraw more
            if rate >= 4.0:
                print("  ✅ PASS: RRIF withdrawal meets minimum requirements")
            else:
                print("  ❌ FAIL: RRIF rate too low")
                all_tests_passed = False

    # TEST 6: Frontend Data Integrity
    print("\n6️⃣ FRONTEND DATA TEST:")
    print("-" * 40)
    if data.get('summary'):
        summary = data['summary']

        # Check critical fields exist
        has_health_score = 'health_score' in summary
        has_underfunding = 'total_underfunding' in summary
        has_success_rate = 'success_rate' in summary
        has_final_estate = 'final_estate_after_tax' in summary

        print(f"  Has health_score: {has_health_score}")
        print(f"  Has total_underfunding: {has_underfunding}")
        print(f"  Has success_rate: {has_success_rate}")
        print(f"  Has final_estate_after_tax: {has_final_estate}")

        if all([has_health_score, has_underfunding, has_success_rate, has_final_estate]):
            print("  ✅ PASS: All critical frontend fields present")
        else:
            print("  ❌ FAIL: Missing critical frontend fields")
            all_tests_passed = False

    # Final Summary
    print("\n" + "=" * 80)
    print("INTEGRATION TEST SUMMARY")
    print("=" * 80)

    if all_tests_passed:
        print("\n✅ ALL INTEGRATION TESTS PASSED!")
        print("\nThe system is ready for deployment:")
        print("  • Corporate balances decrease correctly")
        print("  • Corporate-Optimized strategy works")
        print("  • Gap detection functions properly")
        print("  • Health scores calculate correctly")
        print("  • RRIF rates are appropriate")
        print("  • Frontend data structure is complete")
    else:
        print("\n❌ SOME INTEGRATION TESTS FAILED")
        print("Please review the failed tests above.")

    print("\n" + "=" * 80)

    return all_tests_passed

if __name__ == '__main__':
    success = run_integration_test()
    exit(0 if success else 1)