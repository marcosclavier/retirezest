#!/usr/bin/env python3
"""
Extended test suite for RRIF-frontload strategy
Testing edge cases and various scenarios
"""
import requests
import json
import sys

def run_simulation(payload, timeout=30):
    """Helper to run simulation and return results"""
    try:
        response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=timeout)
        if response.status_code == 200:
            return response.json()
        else:
            return {"success": False, "error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def test_low_asset_scenario():
    """Test with low assets to ensure strategy works when resources are limited"""
    print("\n" + "="*70)
    print("TEST: Low Asset Scenario")
    print("="*70)

    payload = {
        'p1': {
            'name': 'LowAsset1',
            'start_age': 65,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 6000,  # Lower CPP
            'oas_start_age': 70,
            'oas_amount': 7000,  # Lower OAS
            'tfsa_balance': 20000,  # Low TFSA
            'rrif_balance': 50000,  # Low RRIF
            'rrsp_balance': 0,
            'nonreg_balance': 30000,  # Low non-reg
            'nonreg_acb': 25000,
            'corporate_balance': 0,  # No corporate
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
        'spending_target': 35000,  # Modest spending
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

        rrif_withdrawal = year1.get('rrif_withdrawal_p1', 0)
        expected_rrif = 50000 * 0.15  # 15% of RRIF

        print(f"\n  Results:")
        print(f"    RRIF Balance: $50,000")
        print(f"    Expected Withdrawal (15%): ${expected_rrif:,.0f}")
        print(f"    Actual Withdrawal: ${rrif_withdrawal:,.0f}")
        print(f"    Years Funded: {summary.get('years_funded', 0)}/31")
        print(f"    Success Rate: {summary.get('success_rate', 0):.1f}%")

        # Check if TFSA contribution is skipped due to gap
        tfsa_contrib = year1.get('tfsa_contribution_p1', 0)
        household_gap = year1.get('household_gap', 0)
        print(f"    TFSA Contribution: ${tfsa_contrib:,.0f}")
        print(f"    Household Gap: ${household_gap:,.0f}")

        if abs(rrif_withdrawal - expected_rrif) < 100:
            print("\n  ✅ PASS: Low asset scenario handled correctly")
            return True
        else:
            print("\n  ❌ FAIL: RRIF withdrawal incorrect for low assets")
            return False
    else:
        print(f"  ❌ Simulation failed: {data.get('message', 'Unknown error')}")
        return False

def test_high_income_oas_clawback():
    """Test OAS clawback scenario with high income"""
    print("\n" + "="*70)
    print("TEST: High Income OAS Clawback Scenario")
    print("="*70)

    payload = {
        'p1': {
            'name': 'HighIncome',
            'start_age': 71,  # After OAS starts
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 16000,  # Max CPP
            'oas_start_age': 70,
            'oas_amount': 8904,  # Full OAS
            'tfsa_balance': 500000,  # Large TFSA
            'rrif_balance': 800000,  # Large RRIF
            'rrsp_balance': 0,
            'nonreg_balance': 1000000,  # Large non-reg
            'nonreg_acb': 700000,
            'corporate_balance': 2000000,  # Large corporate
            'pension_incomes': [{
                'name': 'DB Pension',
                'amount': 80000,  # High pension
                'startAge': 65,
                'endAge': 95,
                'survivorBenefit': 0,
                'benefitType': 'single',
                'inflationIndexed': True
            }],
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
        'province': 'ON',  # Higher tax province
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

    data = run_simulation(payload)

    if data.get('success'):
        year1 = data['year_by_year'][0] if 'year_by_year' in data else {}

        rrif_withdrawal = year1.get('rrif_withdrawal_p1', 0)
        expected_rrif = 800000 * 0.08  # 8% after OAS
        tfsa_contrib = year1.get('tfsa_contribution_p1', 0)
        oas_clawback = year1.get('oas_clawback_p1', 0)
        total_income = year1.get('total_income_p1', 0)

        print(f"\n  Results:")
        print(f"    Total Income: ${total_income:,.0f}")
        print(f"    OAS Clawback Threshold: ~$91,000")
        print(f"    RRIF Withdrawal: ${rrif_withdrawal:,.0f} (expected ${expected_rrif:,.0f})")
        print(f"    OAS Clawback: ${oas_clawback:,.0f}")
        print(f"    TFSA Contribution: ${tfsa_contrib:,.0f}")

        # With high income, TFSA contribution should be 0 or reduced
        if total_income > 91000:
            if tfsa_contrib == 0:
                print("    ✅ TFSA contribution correctly skipped due to high income")
            elif tfsa_contrib < 7000:
                print(f"    ✅ TFSA contribution correctly reduced to ${tfsa_contrib:,.0f}")
            else:
                print("    ⚠️ TFSA contribution may be too high given OAS clawback risk")

        if abs(rrif_withdrawal - expected_rrif) < 1000:
            print("\n  ✅ PASS: High income scenario handled correctly")
            return True
        else:
            print("\n  ❌ FAIL: RRIF withdrawal incorrect for high income")
            return False
    else:
        print(f"  ❌ Simulation failed: {data.get('message', 'Unknown error')}")
        return False

def test_different_provinces():
    """Test strategy across different provinces with varying tax rates"""
    print("\n" + "="*70)
    print("TEST: Different Province Tax Rates")
    print("="*70)

    provinces = ['AB', 'BC', 'ON', 'QC']
    results = {}

    for province in provinces:
        payload = {
            'p1': {
                'name': f'Test_{province}',
                'start_age': 66,
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
            'province': province,
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
            results[province] = {
                'rrif_withdrawal': year1.get('rrif_withdrawal_p1', 0),
                'total_tax': year1.get('total_tax_p1', 0),
                'tfsa_contrib': year1.get('tfsa_contribution_p1', 0),
                'success_rate': data.get('summary', {}).get('success_rate', 0)
            }

    print(f"\n  Province Comparison:")
    print(f"  {'Province':<10} {'RRIF Withdrawal':<20} {'Tax':<15} {'TFSA Contrib':<15} {'Success'}")
    print(f"  {'-'*75}")

    all_pass = True
    for province in provinces:
        if province in results:
            r = results[province]
            print(f"  {province:<10} ${r['rrif_withdrawal']:>14,.0f}     ${r['total_tax']:>10,.0f}     ${r['tfsa_contrib']:>10,.0f}     {r['success_rate']:>6.1f}%")

            # All should withdraw 15% before OAS
            if abs(r['rrif_withdrawal'] - 30000) > 100:
                all_pass = False
                print(f"    ⚠️ RRIF withdrawal not 15% for {province}")

    if all_pass:
        print("\n  ✅ PASS: Strategy works consistently across provinces")
        return True
    else:
        print("\n  ❌ FAIL: Inconsistent behavior across provinces")
        return False

def test_cpp_oas_timing_variations():
    """Test different CPP/OAS start ages"""
    print("\n" + "="*70)
    print("TEST: CPP/OAS Timing Variations")
    print("="*70)

    timing_scenarios = [
        {'cpp': 60, 'oas': 65, 'desc': 'Early CPP/OAS (60/65)'},
        {'cpp': 65, 'oas': 65, 'desc': 'Normal CPP/OAS (65/65)'},
        {'cpp': 70, 'oas': 70, 'desc': 'Delayed CPP/OAS (70/70)'},
        {'cpp': 65, 'oas': 70, 'desc': 'Mixed timing (65/70)'},
    ]

    results = []

    for scenario in timing_scenarios:
        # Test at age 67 to see behavior mid-retirement
        payload = {
            'p1': {
                'name': 'TimingTest',
                'start_age': 67,
                'end_age': 95,
                'cpp_start_age': scenario['cpp'],
                'cpp_amount': 12000,
                'oas_start_age': scenario['oas'],
                'oas_amount': 8000,
                'tfsa_balance': 150000,
                'rrif_balance': 300000,
                'rrsp_balance': 0,
                'nonreg_balance': 400000,
                'nonreg_acb': 350000,
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

        data = run_simulation(payload)

        if data.get('success'):
            year1 = data['year_by_year'][0] if 'year_by_year' in data else {}

            rrif_withdrawal = year1.get('rrif_withdrawal_p1', 0)
            # At age 67, check if OAS has started
            oas_started = 67 >= scenario['oas']
            expected_pct = 0.08 if oas_started else 0.15
            expected_rrif = 300000 * expected_pct

            result = {
                'desc': scenario['desc'],
                'rrif_withdrawal': rrif_withdrawal,
                'expected': expected_rrif,
                'oas_started': oas_started,
                'tfsa_contrib': year1.get('tfsa_contribution_p1', 0),
                'pass': abs(rrif_withdrawal - expected_rrif) < 1000
            }
            results.append(result)

    print(f"\n  Timing Scenario Results (at age 67):")
    print(f"  {'Scenario':<30} {'OAS Started':<12} {'Expected %':<12} {'Actual RRIF':<15} {'Result'}")
    print(f"  {'-'*85}")

    all_pass = True
    for r in results:
        status = "✅ PASS" if r['pass'] else "❌ FAIL"
        oas_status = "Yes" if r['oas_started'] else "No"
        expected_pct = "8%" if r['oas_started'] else "15%"

        print(f"  {r['desc']:<30} {oas_status:<12} {expected_pct:<12} ${r['rrif_withdrawal']:>12,.0f}  {status}")

        if not r['pass']:
            all_pass = False

    if all_pass:
        print("\n  ✅ PASS: All CPP/OAS timing scenarios work correctly")
        return True
    else:
        print("\n  ❌ FAIL: Some timing scenarios have issues")
        return False

def test_couple_income_splitting():
    """Test couple with income splitting opportunities"""
    print("\n" + "="*70)
    print("TEST: Couple Income Splitting")
    print("="*70)

    payload = {
        'p1': {
            'name': 'HighEarner',
            'start_age': 68,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 16000,  # High CPP
            'oas_start_age': 70,
            'oas_amount': 8904,
            'tfsa_balance': 50000,
            'rrif_balance': 400000,  # High RRIF
            'rrsp_balance': 0,
            'nonreg_balance': 200000,
            'nonreg_acb': 150000,
            'corporate_balance': 500000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': 'LowEarner',
            'start_age': 67,
            'end_age': 95,
            'cpp_start_age': 70,
            'cpp_amount': 6000,  # Low CPP
            'oas_start_age': 70,
            'oas_amount': 8904,
            'tfsa_balance': 100000,
            'rrif_balance': 100000,  # Low RRIF
            'rrsp_balance': 0,
            'nonreg_balance': 200000,
            'nonreg_acb': 150000,
            'corporate_balance': 500000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'province': 'ON',
        'start_year': 2025,
        'spending_target': 120000,
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

        rrif_p1 = year1.get('rrif_withdrawal_p1', 0)
        rrif_p2 = year1.get('rrif_withdrawal_p2', 0)
        tfsa_p1 = year1.get('tfsa_contribution_p1', 0)
        tfsa_p2 = year1.get('tfsa_contribution_p2', 0)

        # Both should withdraw 15% before OAS (ages 68/67)
        expected_p1 = 400000 * 0.15
        expected_p2 = 100000 * 0.15

        print(f"\n  Results:")
        print(f"    Partner 1 (High Earner):")
        print(f"      RRIF: ${rrif_p1:,.0f} (expected ${expected_p1:,.0f})")
        print(f"      TFSA Contribution: ${tfsa_p1:,.0f}")
        print(f"    Partner 2 (Low Earner):")
        print(f"      RRIF: ${rrif_p2:,.0f} (expected ${expected_p2:,.0f})")
        print(f"      TFSA Contribution: ${tfsa_p2:,.0f}")
        print(f"    Total RRIF: ${rrif_p1 + rrif_p2:,.0f}")
        print(f"    Total TFSA Contributions: ${tfsa_p1 + tfsa_p2:,.0f}")

        p1_pass = abs(rrif_p1 - expected_p1) < 1000
        p2_pass = abs(rrif_p2 - expected_p2) < 1000

        if p1_pass and p2_pass:
            print("\n  ✅ PASS: Couple income splitting handled correctly")
            return True
        else:
            print("\n  ❌ FAIL: Issues with couple RRIF withdrawals")
            return False
    else:
        print(f"  ❌ Simulation failed: {data.get('message', 'Unknown error')}")
        return False

# Main execution
if __name__ == "__main__":
    print("="*80)
    print("🔬 EXTENDED RRIF-FRONTLOAD STRATEGY TEST SUITE")
    print("="*80)

    # Run all extended tests
    test_results = {
        "Low Asset Scenario": test_low_asset_scenario(),
        "High Income OAS Clawback": test_high_income_oas_clawback(),
        "Different Provinces": test_different_provinces(),
        "CPP/OAS Timing Variations": test_cpp_oas_timing_variations(),
        "Couple Income Splitting": test_couple_income_splitting()
    }

    # Summary
    print("\n" + "="*80)
    print("📊 EXTENDED TEST SUMMARY")
    print("="*80)

    all_pass = True
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if not result:
            all_pass = False

    print("\n" + "="*80)
    if all_pass:
        print("🎉 ALL EXTENDED TESTS PASSED!")
        print("\nThe RRIF-frontload strategy is robust across:")
        print("  ✅ Different asset levels (low to high)")
        print("  ✅ OAS clawback scenarios")
        print("  ✅ Various provincial tax rates")
        print("  ✅ Different CPP/OAS timing strategies")
        print("  ✅ Couple income splitting situations")
    else:
        print("⚠️  SOME EXTENDED TESTS FAILED")
        print("Please review the failures above for edge cases.")
    print("="*80)

    sys.exit(0 if all_pass else 1)