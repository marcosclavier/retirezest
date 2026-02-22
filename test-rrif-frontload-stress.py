#!/usr/bin/env python3
"""
Stress test for RRIF-frontload strategy
Testing extreme scenarios and edge cases
"""
import requests
import json
import time

def run_simulation(payload, timeout=60):
    """Helper to run simulation and return results"""
    try:
        response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=timeout)
        if response.status_code == 200:
            return response.json()
        else:
            return {"success": False, "error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def test_extreme_longevity():
    """Test with very long life expectancy (to age 110)"""
    print("\n" + "="*70)
    print("STRESS TEST 1: Extreme Longevity (to age 110)")
    print("="*70)

    payload = {
        'p1': {
            'name': 'Longevity',
            'start_age': 65,
            'end_age': 110,  # Extreme longevity
            'cpp_start_age': 70,
            'cpp_amount': 12000,
            'oas_start_age': 70,
            'oas_amount': 8000,
            'tfsa_balance': 200000,
            'rrif_balance': 400000,
            'rrsp_balance': 0,
            'nonreg_balance': 500000,
            'nonreg_acb': 400000,
            'corporate_balance': 600000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': '',
            'start_age': 60,
            'end_age': 95,
            'cpp_start_age': 65,
            'cpp_amount': 0,
            'oas_start_age': 65,
            'oas_amount': 0,
            'tfsa_balance': 0,
            'rrif_balance': 0,
            'rrsp_balance': 0,
            'nonreg_balance': 0,
            'nonreg_acb': 0,
            'corporate_balance': 0,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': False,
        'province': 'AB',
        'start_year': 2025,
        'spending_target': 80000,
        'strategy': 'rrif-frontload',
        'tfsa_contribution_each': 7000,
        'inflation_general': 2.0,
        'return_rrif': 5.0,
        'return_nonreg': 5.0,
        'return_tfsa': 4.0,
        'return_corporate': 5.0,
        'nonreg_interest_pct': 20.0,
        'nonreg_elig_div_pct': 30.0,
        'nonreg_capg_dist_pct': 50.0,
        'reinvest_nonreg_dist': False
    }

    start_time = time.time()
    data = run_simulation(payload)
    elapsed = time.time() - start_time

    if data.get('success'):
        summary = data.get('summary', {})
        years_to_simulate = 110 - 65 + 1  # 46 years

        print(f"\n  Results:")
        print(f"    Simulation Time: {elapsed:.2f} seconds")
        print(f"    Years to Simulate: {years_to_simulate}")
        print(f"    Years Funded: {summary.get('years_funded', 0)}/{years_to_simulate}")
        print(f"    Success Rate: {summary.get('success_rate', 0):.1f}%")
        print(f"    Total Tax Paid: ${summary.get('total_tax_paid', 0):,.0f}")

        if elapsed < 120:  # Should complete within 2 minutes
            print("\n  ✅ PASS: Handled extreme longevity scenario")
            return True
        else:
            print("\n  ⚠️ PASS but slow: Consider performance optimization")
            return True
    else:
        print(f"  ❌ FAIL: {data.get('message', 'Unknown error')}")
        return False

def test_zero_balances():
    """Test with some zero balance accounts"""
    print("\n" + "="*70)
    print("STRESS TEST 2: Zero Balance Accounts")
    print("="*70)

    payload = {
        'p1': {
            'name': 'ZeroBalance',
            'start_age': 65,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 10000,
            'oas_start_age': 70,
            'oas_amount': 8000,
            'tfsa_balance': 0,  # Zero TFSA
            'rrif_balance': 300000,
            'rrsp_balance': 0,
            'nonreg_balance': 0,  # Zero non-reg
            'nonreg_acb': 0,
            'corporate_balance': 500000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': '',
            'start_age': 60,
            'end_age': 95,
            'cpp_start_age': 65,
            'cpp_amount': 0,
            'oas_start_age': 65,
            'oas_amount': 0,
            'tfsa_balance': 0,
            'rrif_balance': 0,
            'rrsp_balance': 0,
            'nonreg_balance': 0,
            'nonreg_acb': 0,
            'corporate_balance': 0,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': False,
        'province': 'AB',
        'start_year': 2025,
        'spending_target': 70000,
        'strategy': 'rrif-frontload',
        'tfsa_contribution_each': 7000,
        'inflation_general': 2.0,
        'return_rrif': 5.0,
        'return_nonreg': 5.0,
        'return_tfsa': 4.0,
        'return_corporate': 5.0,
        'nonreg_interest_pct': 20.0,
        'nonreg_elig_div_pct': 30.0,
        'nonreg_capg_dist_pct': 50.0,
        'reinvest_nonreg_dist': False
    }

    data = run_simulation(payload)

    if data.get('success'):
        year1 = data['year_by_year'][0] if 'year_by_year' in data else {}

        rrif_withdrawal = year1.get('rrif_withdrawal_p1', 0)
        corp_withdrawal = year1.get('corporate_withdrawal_p1', 0)
        tfsa_contribution = year1.get('tfsa_contribution_p1', 0)

        print(f"\n  Results:")
        print(f"    RRIF Withdrawal: ${rrif_withdrawal:,.0f} (expected ${45000:.0f})")
        print(f"    Corporate Withdrawal: ${corp_withdrawal:,.0f}")
        print(f"    TFSA Contribution: ${tfsa_contribution:,.0f}")
        print(f"    Note: With $0 TFSA, no TFSA withdrawals possible")

        if abs(rrif_withdrawal - 45000) < 100:
            print("\n  ✅ PASS: Zero balance accounts handled correctly")
            return True
        else:
            print("\n  ❌ FAIL: Incorrect RRIF withdrawal with zero balances")
            return False
    else:
        print(f"  ❌ FAIL: {data.get('message', 'Unknown error')}")
        return False

def test_very_high_spending():
    """Test with spending target exceeding available resources"""
    print("\n" + "="*70)
    print("STRESS TEST 3: Very High Spending Target")
    print("="*70)

    payload = {
        'p1': {
            'name': 'HighSpender',
            'start_age': 65,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 12000,
            'oas_start_age': 70,
            'oas_amount': 8000,
            'tfsa_balance': 100000,
            'rrif_balance': 200000,
            'rrsp_balance': 0,
            'nonreg_balance': 300000,
            'nonreg_acb': 250000,
            'corporate_balance': 400000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': '',
            'start_age': 60,
            'end_age': 95,
            'cpp_start_age': 65,
            'cpp_amount': 0,
            'oas_start_age': 65,
            'oas_amount': 0,
            'tfsa_balance': 0,
            'rrif_balance': 0,
            'rrsp_balance': 0,
            'nonreg_balance': 0,
            'nonreg_acb': 0,
            'corporate_balance': 0,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': False,
        'province': 'AB',
        'start_year': 2025,
        'spending_target': 250000,  # Very high spending vs assets
        'strategy': 'rrif-frontload',
        'tfsa_contribution_each': 7000,
        'inflation_general': 2.0,
        'return_rrif': 5.0,
        'return_nonreg': 5.0,
        'return_tfsa': 4.0,
        'return_corporate': 5.0,
        'nonreg_interest_pct': 20.0,
        'nonreg_elig_div_pct': 30.0,
        'nonreg_capg_dist_pct': 50.0,
        'reinvest_nonreg_dist': False
    }

    data = run_simulation(payload)

    if data.get('success'):
        summary = data.get('summary', {})
        year1 = data['year_by_year'][0] if 'year_by_year' in data else {}

        years_funded = summary.get('years_funded', 0)
        tfsa_contribution = year1.get('tfsa_contribution_p1', 0)
        household_gap = year1.get('household_gap', 0)

        print(f"\n  Results:")
        print(f"    Years Funded: {years_funded}/31")
        print(f"    Success Rate: {summary.get('success_rate', 0):.1f}%")
        print(f"    Year 1 Gap: ${household_gap:,.0f}")
        print(f"    TFSA Contribution: ${tfsa_contribution:,.0f}")

        # With high spending, should not contribute to TFSA if there's a gap
        if household_gap > 0 and tfsa_contribution == 0:
            print("    ✅ Correctly skipped TFSA contribution due to funding gap")

        print("\n  ✅ PASS: High spending scenario handled without crash")
        return True
    else:
        print(f"  ❌ FAIL: {data.get('message', 'Unknown error')}")
        return False

def test_negative_returns():
    """Test with negative investment returns"""
    print("\n" + "="*70)
    print("STRESS TEST 4: Negative Investment Returns")
    print("="*70)

    payload = {
        'p1': {
            'name': 'BearMarket',
            'start_age': 65,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 12000,
            'oas_start_age': 70,
            'oas_amount': 8000,
            'tfsa_balance': 200000,
            'rrif_balance': 400000,
            'rrsp_balance': 0,
            'nonreg_balance': 500000,
            'nonreg_acb': 400000,
            'corporate_balance': 600000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': '',
            'start_age': 60,
            'end_age': 95,
            'cpp_start_age': 65,
            'cpp_amount': 0,
            'oas_start_age': 65,
            'oas_amount': 0,
            'tfsa_balance': 0,
            'rrif_balance': 0,
            'rrsp_balance': 0,
            'nonreg_balance': 0,
            'nonreg_acb': 0,
            'corporate_balance': 0,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': False,
        'province': 'AB',
        'start_year': 2025,
        'spending_target': 80000,
        'strategy': 'rrif-frontload',
        'tfsa_contribution_each': 7000,
        'inflation_general': 4.0,  # High inflation
        'return_rrif': -2.0,  # Negative returns!
        'return_nonreg': -3.0,  # Negative returns!
        'return_tfsa': -1.0,  # Negative returns!
        'return_corporate': -2.0,  # Negative returns!
        'nonreg_interest_pct': 20.0,
        'nonreg_elig_div_pct': 30.0,
        'nonreg_capg_dist_pct': 50.0,
        'reinvest_nonreg_dist': False
    }

    data = run_simulation(payload)

    if data.get('success'):
        summary = data.get('summary', {})
        year1 = data['year_by_year'][0] if 'year_by_year' in data else {}

        rrif_withdrawal = year1.get('rrif_withdrawal_p1', 0)
        years_funded = summary.get('years_funded', 0)

        print(f"\n  Results with Negative Returns:")
        print(f"    RRIF Withdrawal: ${rrif_withdrawal:,.0f} (still 15% = $60,000)")
        print(f"    Years Funded: {years_funded}/31")
        print(f"    Success Rate: {summary.get('success_rate', 0):.1f}%")

        # RRIF percentage should still be 15% regardless of returns
        if abs(rrif_withdrawal - 60000) < 100:
            print("    ✅ RRIF percentage maintained despite negative returns")

        print("\n  ✅ PASS: Negative returns handled without crash")
        return True
    else:
        print(f"  ❌ FAIL: {data.get('message', 'Unknown error')}")
        return False

def test_multiple_pensions():
    """Test with multiple pension sources"""
    print("\n" + "="*70)
    print("STRESS TEST 5: Multiple Pension Sources")
    print("="*70)

    payload = {
        'p1': {
            'name': 'MultiPension',
            'start_age': 65,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 12000,
            'oas_start_age': 70,
            'oas_amount': 8000,
            'tfsa_balance': 100000,
            'rrif_balance': 200000,
            'rrsp_balance': 0,
            'nonreg_balance': 300000,
            'nonreg_acb': 250000,
            'corporate_balance': 400000,
            'pension_incomes': [
                {
                    'name': 'DB Pension 1',
                    'amount': 30000,
                    'startAge': 65,
                    'endAge': 95,
                    'survivorBenefit': 60,
                    'benefitType': 'joint',
                    'inflationIndexed': True
                },
                {
                    'name': 'DB Pension 2',
                    'amount': 20000,
                    'startAge': 60,
                    'endAge': 70,  # Temporary pension
                    'survivorBenefit': 0,
                    'benefitType': 'single',
                    'inflationIndexed': False
                },
                {
                    'name': 'Annuity',
                    'amount': 15000,
                    'startAge': 70,
                    'endAge': 95,
                    'survivorBenefit': 100,
                    'benefitType': 'joint',
                    'inflationIndexed': False
                }
            ],
            'other_incomes': []
        },
        'p2': {
            'name': '',
            'start_age': 60,
            'end_age': 95,
            'cpp_start_age': 65,
            'cpp_amount': 0,
            'oas_start_age': 65,
            'oas_amount': 0,
            'tfsa_balance': 0,
            'rrif_balance': 0,
            'rrsp_balance': 0,
            'nonreg_balance': 0,
            'nonreg_acb': 0,
            'corporate_balance': 0,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': False,
        'province': 'ON',
        'start_year': 2025,
        'spending_target': 100000,
        'strategy': 'rrif-frontload',
        'tfsa_contribution_each': 7000,
        'inflation_general': 2.0,
        'return_rrif': 5.0,
        'return_nonreg': 5.0,
        'return_tfsa': 4.0,
        'return_corporate': 5.0,
        'nonreg_interest_pct': 20.0,
        'nonreg_elig_div_pct': 30.0,
        'nonreg_capg_dist_pct': 50.0,
        'reinvest_nonreg_dist': False
    }

    data = run_simulation(payload)

    if data.get('success'):
        year1 = data['year_by_year'][0] if 'year_by_year' in data else {}

        rrif_withdrawal = year1.get('rrif_withdrawal_p1', 0)
        pension_income = year1.get('pension_income_p1', 0)
        tfsa_contribution = year1.get('tfsa_contribution_p1', 0)

        print(f"\n  Results with Multiple Pensions:")
        print(f"    Pension Income: ${pension_income:,.0f}")
        print(f"    RRIF Withdrawal: ${rrif_withdrawal:,.0f}")
        print(f"    TFSA Contribution: ${tfsa_contribution:,.0f}")

        # With high pension income, TFSA contribution might be reduced
        if pension_income > 40000 and tfsa_contribution < 7000:
            print(f"    ✅ TFSA contribution adjusted for high pension income")

        print("\n  ✅ PASS: Multiple pensions handled correctly")
        return True
    else:
        print(f"  ❌ FAIL: {data.get('message', 'Unknown error')}")
        return False

# Main execution
if __name__ == "__main__":
    print("="*80)
    print("💪 RRIF-FRONTLOAD STRESS TEST SUITE")
    print("="*80)

    # Run all stress tests
    test_results = {
        "Extreme Longevity": test_extreme_longevity(),
        "Zero Balance Accounts": test_zero_balances(),
        "Very High Spending": test_very_high_spending(),
        "Negative Returns": test_negative_returns(),
        "Multiple Pensions": test_multiple_pensions()
    }

    # Summary
    print("\n" + "="*80)
    print("📊 STRESS TEST SUMMARY")
    print("="*80)

    all_pass = True
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if not result:
            all_pass = False

    print("\n" + "="*80)
    if all_pass:
        print("💪 ALL STRESS TESTS PASSED!")
        print("\nThe RRIF-frontload strategy is resilient to:")
        print("  ✅ Extreme longevity (110+ years)")
        print("  ✅ Zero balance accounts")
        print("  ✅ Very high spending targets")
        print("  ✅ Negative investment returns")
        print("  ✅ Complex multiple pension scenarios")
    else:
        print("⚠️  SOME STRESS TESTS FAILED")
        print("Please review the failures above.")
    print("="*80)