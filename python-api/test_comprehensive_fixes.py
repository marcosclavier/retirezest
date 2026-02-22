#!/usr/bin/env python3
"""
Comprehensive test suite for corporate balance and gap detection fixes
Tests all scenarios to ensure fixes are working correctly
"""

import requests
import json
import sys

def get_dummy_p2():
    """Return a dummy p2 for single-person tests"""
    return {
        'name': 'Dummy',
        'start_age': 65,
        'rrif_balance': 0,
        'tfsa_balance': 0,
        'nr_cash': 0,
        'nr_gic': 0,
        'nr_invest': 0,
        'corp_cash_bucket': 0,
        'corp_gic_bucket': 0,
        'corp_invest_bucket': 0,
        'corporate_balance': 0,
        'cpp_start_age': 65,
        'cpp_annual_at_start': 0,
        'oas_start_age': 65,
        'oas_annual_at_start': 0,
        'pension_incomes': [],
        'other_incomes': []
    }

def run_test(test_name, payload, expected_checks):
    """Run a single test and check expected results"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return False

    data = response.json()
    success = True

    # Run all expected checks
    for check_name, check_func in expected_checks.items():
        result, message = check_func(data)
        if result:
            print(f"✅ {check_name}: {message}")
        else:
            print(f"❌ {check_name}: {message}")
            success = False

    return success

def test_corporate_balance_decrease():
    """Test 1: Corporate balance should decrease after withdrawals"""

    payload = {
        'p1': {
            'name': 'Test Person',
            'start_age': 65,
            'rrif_balance': 0,  # No RRIF to ensure corporate is used
            'tfsa_balance': 0,  # No TFSA
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 0,
            'corp_cash_bucket': 500000,
            'corp_gic_bucket': 500000,
            'corp_invest_bucket': 500000,
            'corporate_balance': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 10000,
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': get_dummy_p2(),
        'include_partner': False,
        'province': 'ON',
        'start_year': 2026,
        'end_age': 70,
        'strategy': 'corporate-optimized',
        'spending_go_go': 80000,
        'spending_slow_go': 70000,
        'slow_go_end_age': 85,
        'spending_no_go': 60000,
        'go_go_end_age': 75,
        'spending_inflation': 0,
        'general_inflation': 0,
        'tfsa_contribution_each': 0
    }

    def check_corporate_withdrawal(data):
        if data.get('five_year_plan'):
            year1 = data['five_year_plan'][0]
            withdrawal = year1.get('corp_withdrawal_p1', 0)
            if withdrawal > 0:
                return True, f"Withdrew ${withdrawal:,.0f} from corporate"
            else:
                return False, "No corporate withdrawal detected"
        return False, "No five_year_plan in response"

    def check_balance_decrease(data):
        if data.get('year_by_year'):
            year1 = data['year_by_year'][0]
            start = year1.get('corporate_start_p1', 0)
            end = year1.get('corporate_balance_p1', 0)
            withdrawal = year1.get('corporate_withdrawal_p1', 0)

            if start > 0 and end < start:
                decrease = start - end
                return True, f"Balance decreased from ${start:,.0f} to ${end:,.0f} (decrease: ${decrease:,.0f})"
            else:
                return False, f"Balance did not decrease properly (start: ${start:,.0f}, end: ${end:,.0f})"
        return False, "No year_by_year data"

    return run_test(
        "Corporate Balance Decrease",
        payload,
        {
            "Corporate Withdrawal": check_corporate_withdrawal,
            "Balance Decrease": check_balance_decrease
        }
    )

def test_gap_detection_with_surplus():
    """Test 2: No gap should be detected when there's a surplus"""

    payload = {
        'p1': {
            'name': 'Test Person',
            'start_age': 65,
            'rrif_balance': 500000,
            'tfsa_balance': 100000,
            'nr_cash': 100000,
            'nr_gic': 100000,
            'nr_invest': 100000,
            'corp_cash_bucket': 200000,
            'corp_gic_bucket': 300000,
            'corp_invest_bucket': 500000,
            'corporate_balance': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': get_dummy_p2(),
        'include_partner': False,
        'province': 'ON',
        'start_year': 2026,
        'end_age': 75,
        'strategy': 'corporate-optimized',
        'spending_go_go': 60000,  # Low spending to ensure surplus
        'spending_slow_go': 50000,
        'slow_go_end_age': 85,
        'spending_no_go': 40000,
        'go_go_end_age': 75,
        'spending_inflation': 0,
        'general_inflation': 0,
        'tfsa_contribution_each': 7000  # TFSA contributions
    }

    def check_no_gap(data):
        if data.get('five_year_plan'):
            for year in data['five_year_plan'][:3]:
                gap = year.get('spending_gap', 0)
                is_gap = year.get('is_underfunded', False) or year.get('status') == 'Gap'
                net_cash = year.get('net_cash_flow', 0)

                if is_gap and net_cash >= 0:
                    return False, f"False gap detected in year {year.get('year', 'unknown')} with net cash ${net_cash:,.0f}"

            return True, "No false gaps detected in first 3 years"
        return False, "No five_year_plan in response"

    def check_tfsa_contribution(data):
        if data.get('five_year_plan'):
            year1 = data['five_year_plan'][0]
            tfsa_contrib = year1.get('tfsa_contrib_p1', 0)
            if tfsa_contrib > 0:
                return True, f"TFSA contribution made: ${tfsa_contrib:,.0f}"
            else:
                return False, "No TFSA contribution detected"
        return False, "No five_year_plan in response"

    return run_test(
        "Gap Detection with Surplus",
        payload,
        {
            "No False Gap": check_no_gap,
            "TFSA Contribution": check_tfsa_contribution
        }
    )

def test_corporate_optimized_order():
    """Test 3: Corporate-optimized should withdraw in correct order"""

    payload = {
        'p1': {
            'name': 'Test Person',
            'start_age': 65,
            'rrif_balance': 200000,
            'tfsa_balance': 100000,
            'nr_cash': 50000,
            'nr_gic': 50000,
            'nr_invest': 100000,
            'corp_cash_bucket': 300000,
            'corp_gic_bucket': 300000,
            'corp_invest_bucket': 400000,
            'corporate_balance': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 12000,
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': get_dummy_p2(),
        'include_partner': False,
        'province': 'ON',
        'start_year': 2026,
        'end_age': 75,
        'strategy': 'corporate-optimized',
        'spending_go_go': 100000,
        'spending_slow_go': 80000,
        'slow_go_end_age': 85,
        'spending_no_go': 60000,
        'go_go_end_age': 75,
        'spending_inflation': 0,
        'general_inflation': 0,
        'tfsa_contribution_each': 0
    }

    def check_withdrawal_order(data):
        if data.get('five_year_plan'):
            total_corp = 0
            total_rrif = 0
            total_nonreg = 0
            total_tfsa = 0

            for year in data['five_year_plan'][:3]:
                total_corp += year.get('corp_withdrawal_p1', 0)
                total_rrif += year.get('rrif_withdrawal_p1', 0)
                total_nonreg += year.get('nonreg_withdrawal_p1', 0)
                total_tfsa += year.get('tfsa_withdrawal_p1', 0)

            print(f"  3-year totals: Corp=${total_corp:,.0f}, RRIF=${total_rrif:,.0f}, NonReg=${total_nonreg:,.0f}, TFSA=${total_tfsa:,.0f}")

            # Corporate should be the primary source
            if total_corp > total_rrif and total_tfsa < 10000:
                return True, "Correct order: Corporate > RRIF, TFSA preserved"
            else:
                return False, f"Incorrect order or TFSA not preserved"
        return False, "No five_year_plan in response"

    return run_test(
        "Corporate-Optimized Withdrawal Order",
        payload,
        {
            "Withdrawal Order": check_withdrawal_order
        }
    )

def test_juan_daniela_exact_scenario():
    """Test 4: Exact Juan & Daniela scenario from screenshots"""

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
        'end_age': 75,
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

    def check_corporate_usage(data):
        if data.get('five_year_plan'):
            year1 = data['five_year_plan'][0]
            corp_p1 = year1.get('corp_withdrawal_p1', 0)
            corp_p2 = year1.get('corp_withdrawal_p2', 0)
            total_corp = corp_p1 + corp_p2

            if total_corp > 50000:  # Should be around $105k based on screenshot
                return True, f"Corporate withdrawals: Juan=${corp_p1:,.0f}, Daniela=${corp_p2:,.0f}, Total=${total_corp:,.0f}"
            else:
                return False, f"Corporate withdrawals too low: ${total_corp:,.0f}"
        return False, "No five_year_plan in response"

    def check_balances_decrease(data):
        if data.get('year_by_year'):
            year1 = data['year_by_year'][0]

            # Check Juan's corporate balance
            start_p1 = year1.get('corporate_start_p1', 0)
            end_p1 = year1.get('corporate_balance_p1', 0)

            # Check Daniela's corporate balance
            start_p2 = year1.get('corporate_start_p2', 0)
            end_p2 = year1.get('corporate_balance_p2', 0)

            if start_p1 > end_p1 and start_p2 > end_p2:
                return True, f"Both balances decreased: Juan ${start_p1:,.0f}→${end_p1:,.0f}, Daniela ${start_p2:,.0f}→${end_p2:,.0f}"
            else:
                return False, f"Balances not decreasing properly"
        return False, "No year_by_year data"

    def check_no_false_gap(data):
        if data.get('five_year_plan'):
            year1 = data['five_year_plan'][0]
            gap = year1.get('spending_gap', 0)
            is_gap = year1.get('is_underfunded', False) or year1.get('status') == 'Gap'
            net_cash = year1.get('net_cash_flow', 0)

            # Based on screenshot, there should be a $14,893 surplus, not a gap
            if not is_gap or gap == 0:
                return True, f"No gap detected (gap=${gap:,.0f}, net_cash=${net_cash:,.0f})"
            else:
                return False, f"False gap detected (gap=${gap:,.0f}, net_cash=${net_cash:,.0f})"
        return False, "No five_year_plan in response"

    return run_test(
        "Juan & Daniela Exact Scenario",
        payload,
        {
            "Corporate Usage": check_corporate_usage,
            "Balances Decrease": check_balances_decrease,
            "No False Gap": check_no_false_gap
        }
    )

def test_high_withdrawal_scenario():
    """Test 5: High withdrawal scenario to stress test balance calculations"""

    payload = {
        'p1': {
            'name': 'Test Person',
            'start_age': 65,
            'rrif_balance': 100000,
            'tfsa_balance': 50000,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 0,
            'corp_cash_bucket': 1000000,
            'corp_gic_bucket': 1000000,
            'corp_invest_bucket': 1000000,
            'corporate_balance': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 15000,
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': get_dummy_p2(),
        'include_partner': False,
        'province': 'ON',
        'start_year': 2026,
        'end_age': 70,
        'strategy': 'corporate-optimized',
        'spending_go_go': 200000,  # Very high spending
        'spending_slow_go': 150000,
        'slow_go_end_age': 85,
        'spending_no_go': 100000,
        'go_go_end_age': 75,
        'spending_inflation': 0,
        'general_inflation': 0,
        'tfsa_contribution_each': 0
    }

    def check_large_withdrawal(data):
        if data.get('five_year_plan'):
            year1 = data['five_year_plan'][0]
            corp_wd = year1.get('corp_withdrawal_p1', 0)

            if corp_wd > 150000:  # Should be around $177k after tax
                return True, f"Large corporate withdrawal handled: ${corp_wd:,.0f}"
            else:
                return False, f"Corporate withdrawal lower than expected: ${corp_wd:,.0f}"
        return False, "No five_year_plan in response"

    def check_balance_calculation(data):
        if data.get('year_by_year'):
            year1 = data['year_by_year'][0]
            start = year1.get('corporate_start_p1', 0)
            end = year1.get('corporate_balance_p1', 0)
            withdrawal = year1.get('corporate_withdrawal_p1', 0)

            # Rough check: end should be approximately start - withdrawal (ignoring growth)
            expected_min = start - withdrawal * 1.2  # Allow for some variance
            expected_max = start - withdrawal * 0.8

            if expected_min <= end <= expected_max:
                return True, f"Balance calculation reasonable: ${start:,.0f} - ${withdrawal:,.0f} ≈ ${end:,.0f}"
            else:
                return False, f"Balance calculation off: ${start:,.0f} - ${withdrawal:,.0f} = ${end:,.0f} (expected {expected_min:,.0f}-{expected_max:,.0f})"
        return False, "No year_by_year data"

    return run_test(
        "High Withdrawal Stress Test",
        payload,
        {
            "Large Withdrawal": check_large_withdrawal,
            "Balance Calculation": check_balance_calculation
        }
    )

# Main execution
if __name__ == '__main__':
    print("\n" + "🔬 " * 30)
    print("COMPREHENSIVE FIX VERIFICATION TEST SUITE")
    print("🔬 " * 30)

    all_tests = [
        test_corporate_balance_decrease,
        test_gap_detection_with_surplus,
        test_corporate_optimized_order,
        test_juan_daniela_exact_scenario,
        test_high_withdrawal_scenario
    ]

    passed = 0
    failed = 0

    for test_func in all_tests:
        if test_func():
            passed += 1
        else:
            failed += 1

    print("\n" + "="*80)
    print("FINAL RESULTS")
    print("="*80)
    print(f"✅ Passed: {passed}/{len(all_tests)}")
    print(f"❌ Failed: {failed}/{len(all_tests)}")

    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! The fixes are working correctly.")
        sys.exit(0)
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review the issues above.")
        sys.exit(1)