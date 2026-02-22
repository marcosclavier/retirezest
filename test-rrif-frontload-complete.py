#!/usr/bin/env python3
"""
Complete test suite for RRIF-frontload strategy
"""
import requests
import json
import sys

def test_rrif_percentage():
    """Test RRIF withdrawal percentages at different ages"""
    print("\n" + "="*70)
    print("TEST 1: RRIF Withdrawal Percentages")
    print("="*70)

    test_cases = [
        {"age": 65, "oas_start": 70, "expected_pct": 0.15, "desc": "Before OAS (age 65)"},
        {"age": 69, "oas_start": 70, "expected_pct": 0.15, "desc": "Before OAS (age 69)"},
        {"age": 70, "oas_start": 70, "expected_pct": 0.08, "desc": "At OAS start (age 70)"},
        {"age": 71, "oas_start": 70, "expected_pct": 0.08, "desc": "After OAS (age 71)"},
    ]

    all_pass = True
    for test in test_cases:
        payload = {
            'p1': {
                'name': 'Test',
                'start_age': test['age'],
                'end_age': 95,
                'cpp_start_age': test['oas_start'],
                'cpp_amount': 10000,
                'oas_start_age': test['oas_start'],
                'oas_amount': 8000,
                'tfsa_balance': 50000,
                'rrif_balance': 200000,
                'rrsp_balance': 0,
                'nonreg_balance': 100000,
                'nonreg_acb': 80000,
                'corporate_balance': 300000,
                'pension_incomes': [],
                'other_incomes': []
            },
            'province': 'AB',
            'start_year': 2025,
            'spending_target': 60000,
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

        response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=30)

        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'year_by_year' in data and len(data['year_by_year']) > 0:
                year1 = data['year_by_year'][0]
                rrif_withdrawal = year1.get('rrif_withdrawal_p1', 0)
                actual_pct = rrif_withdrawal / 200000

                print(f"\n  {test['desc']}:")
                print(f"    Expected: {test['expected_pct']*100:.0f}%")
                print(f"    Actual: {actual_pct*100:.1f}% (${rrif_withdrawal:,.0f})")

                if abs(actual_pct - test['expected_pct']) < 0.01:
                    print(f"    ✅ PASS")
                else:
                    print(f"    ❌ FAIL")
                    all_pass = False
            else:
                print(f"  ❌ {test['desc']}: Simulation failed")
                all_pass = False
        else:
            print(f"  ❌ {test['desc']}: HTTP error {response.status_code}")
            all_pass = False

    return all_pass

def test_tfsa_contributions():
    """Test TFSA contribution logic"""
    print("\n" + "="*70)
    print("TEST 2: TFSA Contributions")
    print("="*70)

    test_cases = [
        {"p1_age": 65, "p2_age": 64, "oas": 70, "expected": 14000, "desc": "Before OAS"},
        {"p1_age": 69, "p2_age": 68, "oas": 70, "expected": 14000, "desc": "Last year before OAS"},
        {"p1_age": 70, "p2_age": 69, "oas": 70, "expected": 10500, "desc": "OAS starts (mixed)"},
        {"p1_age": 71, "p2_age": 70, "oas": 70, "expected": 4620, "desc": "After OAS (both reduced)"},
    ]

    all_pass = True
    for test in test_cases:
        payload = {
            'p1': {
                'name': 'Test1',
                'start_age': test['p1_age'],
                'end_age': 95,
                'cpp_start_age': test['oas'],
                'cpp_amount': 10000,
                'oas_start_age': test['oas'],
                'oas_amount': 8000,
                'tfsa_balance': 50000,
                'rrif_balance': 100000,
                'rrsp_balance': 0,
                'nonreg_balance': 200000,
                'nonreg_acb': 150000,
                'corporate_balance': 300000,
                'pension_incomes': [],
                'other_incomes': []
            },
            'p2': {
                'name': 'Test2',
                'start_age': test['p2_age'],
                'end_age': 95,
                'cpp_start_age': test['oas'],
                'cpp_amount': 8000,
                'oas_start_age': test['oas'],
                'oas_amount': 8000,
                'tfsa_balance': 50000,
                'rrif_balance': 100000,
                'rrsp_balance': 0,
                'nonreg_balance': 200000,
                'nonreg_acb': 150000,
                'corporate_balance': 300000,
                'pension_incomes': [],
                'other_incomes': []
            },
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

        response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=30)

        if response.status_code == 200:
            data = response.json()
            if data.get('success') and 'year_by_year' in data and len(data['year_by_year']) > 0:
                year1 = data['year_by_year'][0]
                tfsa_total = year1.get('tfsa_contribution_p1', 0) + year1.get('tfsa_contribution_p2', 0)

                print(f"\n  {test['desc']} (P1: {test['p1_age']}, P2: {test['p2_age']}):")
                print(f"    Expected: ${test['expected']:,}")
                print(f"    Actual: ${tfsa_total:,}")

                # Allow some tolerance for the calculated amounts
                if abs(tfsa_total - test['expected']) < 2000:
                    print(f"    ✅ PASS (within tolerance)")
                else:
                    print(f"    ❌ FAIL (difference: ${abs(tfsa_total - test['expected']):,})")
                    all_pass = False
            else:
                print(f"  ❌ {test['desc']}: Simulation failed")
                all_pass = False
        else:
            print(f"  ❌ {test['desc']}: HTTP error {response.status_code}")
            all_pass = False

    return all_pass

def test_withdrawal_order():
    """Test withdrawal order priority"""
    print("\n" + "="*70)
    print("TEST 3: Withdrawal Order (RRIF → Corp → NonReg → TFSA)")
    print("="*70)

    # Test with limited corporate to force NonReg use
    payload = {
        'p1': {
            'name': 'Test1',
            'start_age': 65,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 10000,
            'oas_start_age': 70,
            'oas_amount': 8000,
            'tfsa_balance': 200000,  # Large TFSA
            'rrif_balance': 100000,  # Will withdraw 15%
            'rrsp_balance': 0,
            'nonreg_balance': 200000,  # Available for gap
            'nonreg_acb': 150000,
            'corporate_balance': 50000,  # Small Corp to test order
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': None,
        'include_partner': False,
        'province': 'AB',
        'start_year': 2025,
        'spending_target': 80000,  # High spending to force multiple withdrawals
        'strategy': 'rrif-frontload',
        'tfsa_contribution_each': 0,  # Disable TFSA contributions for this test
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

    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=30)

    if response.status_code == 200:
        data = response.json()
        if data.get('success') and 'year_by_year' in data and len(data['year_by_year']) > 0:
            # Check first 3 years
            print("\n  Withdrawal patterns (first 3 years):")

            order_correct = True
            for i in range(min(3, len(data['year_by_year']))):
                year = data['year_by_year'][i]
                rrif = year.get('rrif_withdrawal_p1', 0)
                corp = year.get('corporate_withdrawal_p1', 0)
                nonreg = year.get('nonreg_withdrawal_p1', 0)
                tfsa = year.get('tfsa_withdrawal_p1', 0)

                print(f"\n  Year {2025+i}:")
                print(f"    RRIF: ${rrif:,.0f}")
                print(f"    Corp: ${corp:,.0f}")
                print(f"    NonReg: ${nonreg:,.0f}")
                print(f"    TFSA: ${tfsa:,.0f}")

                # Check order: TFSA should only be used if Corp and NonReg are exhausted
                if tfsa > 0 and corp == 0 and nonreg > 0:
                    print(f"    ⚠️  TFSA used while NonReg available")
                    order_correct = False

            if order_correct:
                print("\n  ✅ PASS: Withdrawal order correct")
                return True
            else:
                print("\n  ❌ FAIL: Withdrawal order violation")
                return False
        else:
            print("  ❌ Simulation failed")
            return False
    else:
        print(f"  ❌ HTTP error {response.status_code}")
        return False

def test_juan_daniela_scenario():
    """Test the specific Juan and Daniela scenario"""
    print("\n" + "="*70)
    print("TEST 4: Juan & Daniela Complete Scenario")
    print("="*70)

    payload = {
        'p1': {
            'name': 'Juan',
            'start_age': 66,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 15000,
            'oas_start_age': 70,
            'oas_amount': 8904,
            'tfsa_balance': 182000,
            'rrif_balance': 185000,
            'rrsp_balance': 0,
            'nonreg_balance': 415000,
            'nonreg_acb': 350000,
            'corporate_balance': 1195000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': 'Daniela',
            'start_age': 65,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 12000,
            'oas_start_age': 70,
            'oas_amount': 8904,
            'tfsa_balance': 220000,
            'rrif_balance': 260000,
            'rrsp_balance': 0,
            'nonreg_balance': 415000,
            'nonreg_acb': 350000,
            'corporate_balance': 1195000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'province': 'AB',
        'start_year': 2025,
        'spending_target': 150000,
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

    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=30)

    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            summary = data.get('summary', {})

            print(f"\n  Overall Results:")
            print(f"    Years Funded: {summary.get('years_funded', 0)}/31")
            print(f"    Success Rate: {summary.get('success_rate', 0):.1f}%")
            print(f"    Total Tax: ${summary.get('total_tax_paid', 0):,}")

            if 'year_by_year' in data and len(data['year_by_year']) > 0:
                year1 = data['year_by_year'][0]
                rrif_total = year1.get('rrif_withdrawal_p1', 0) + year1.get('rrif_withdrawal_p2', 0)
                tfsa_total = year1.get('tfsa_contribution_p1', 0) + year1.get('tfsa_contribution_p2', 0)

                print(f"\n  Year 1 Details:")
                print(f"    RRIF Withdrawal: ${rrif_total:,} (expected: $66,750)")
                print(f"    TFSA Contributions: ${tfsa_total:,} (expected: $14,000)")

                rrif_correct = abs(rrif_total - 66750) < 1000
                tfsa_correct = abs(tfsa_total - 14000) < 1000
                success = summary.get('success_rate', 0) == 100

                if rrif_correct and tfsa_correct and success:
                    print("\n  ✅ PASS: All metrics correct")
                    return True
                else:
                    issues = []
                    if not rrif_correct:
                        issues.append("RRIF withdrawal incorrect")
                    if not tfsa_correct:
                        issues.append("TFSA contribution incorrect")
                    if not success:
                        issues.append("Not all years funded")
                    print(f"\n  ❌ FAIL: {', '.join(issues)}")
                    return False
            else:
                print("  ❌ No year data available")
                return False
        else:
            print(f"  ❌ Simulation failed: {data.get('message', 'Unknown error')}")
            return False
    else:
        print(f"  ❌ HTTP error {response.status_code}")
        return False

# Main test execution
if __name__ == "__main__":
    print("="*80)
    print("🧪 COMPREHENSIVE RRIF-FRONTLOAD STRATEGY TEST SUITE")
    print("="*80)

    # Run all tests
    results = {
        "RRIF Percentages": test_rrif_percentage(),
        "TFSA Contributions": test_tfsa_contributions(),
        "Withdrawal Order": test_withdrawal_order(),
        "Juan & Daniela": test_juan_daniela_scenario()
    }

    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)

    all_pass = True
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if not result:
            all_pass = False

    print("\n" + "="*80)
    if all_pass:
        print("🎉 ALL TESTS PASSED!")
        print("The RRIF-frontload strategy is fully operational.")
    else:
        print("⚠️  SOME TESTS FAILED")
        print("Please review the failures above.")
    print("="*80)

    sys.exit(0 if all_pass else 1)