#!/usr/bin/env python3
"""
Comprehensive test for Corporate-Optimized strategy
Verifies the correct withdrawal order and that corporate accounts are prioritized
"""

import requests
import json
import sys

def test_corporate_optimized_strategy():
    """Test that corporate-optimized strategy withdraws from corporate first"""

    print("=" * 80)
    print("TESTING CORPORATE-OPTIMIZED STRATEGY")
    print("=" * 80)

    # Test scenario with all account types
    payload = {
        'p1': {
            'name': 'Test Person',
            'start_age': 65,
            'rrif_balance': 100000,
            'tfsa_balance': 50000,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 100000,  # NonReg
            'corp_cash_bucket': 100000,  # Corporate cash
            'corp_gic_bucket': 0,
            'corp_invest_bucket': 100000,  # Corporate investments
            'cpp_start_age': 65,
            'cpp_annual_at_start': 10000,
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': '',
            'start_age': 65,
            'rrif_balance': 0,
            'tfsa_balance': 0,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 0,
            'corp_cash_bucket': 0,
            'corp_gic_bucket': 0,
            'corp_invest_bucket': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 0,
            'oas_start_age': 65,
            'oas_annual_at_start': 0,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': False,
        'province': 'ON',
        'start_year': 2026,
        'end_age': 70,
        'strategy': 'corporate-optimized',  # Testing this strategy
        'spending_go_go': 100000,
        'spending_slow_go': 90000,
        'slow_go_end_age': 85,
        'spending_no_go': 80000,
        'go_go_end_age': 75,
        'spending_inflation': 2,
        'general_inflation': 2,
        'tfsa_contribution_each': 0
    }

    print("\nTest Configuration:")
    print(f"  Strategy: corporate-optimized")
    print(f"  Corporate: $200,000 (cash: $100k, invest: $100k)")
    print(f"  RRIF: $100,000")
    print(f"  NonReg: $100,000")
    print(f"  TFSA: $50,000")
    print(f"  Spending need: $100,000/year")
    print(f"  CPP: $10,000/year")
    print(f"  OAS: $8,000/year")

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"\n❌ ERROR: API returned status {response.status_code}")
        print(f"Response: {response.text[:500]}")
        return False

    data = response.json()

    if not data.get('five_year_plan'):
        print("\n❌ ERROR: No five_year_plan in response")
        return False

    # Analyze withdrawal pattern for first 3 years
    print("\n" + "=" * 60)
    print("WITHDRAWAL ANALYSIS (First 3 Years)")
    print("=" * 60)

    success = True

    for i in range(min(3, len(data['five_year_plan']))):
        year_data = data['five_year_plan'][i]
        year = year_data.get('year', 2026 + i)

        corp_wd = year_data.get('corp_withdrawal_p1', 0)
        rrif_wd = year_data.get('rrif_withdrawal_p1', 0)
        nonreg_wd = year_data.get('nonreg_withdrawal_p1', 0)
        tfsa_wd = year_data.get('tfsa_withdrawal_p1', 0)

        print(f"\nYear {year}:")
        print(f"  Corporate withdrawal: ${corp_wd:,.2f}")
        print(f"  RRIF withdrawal: ${rrif_wd:,.2f}")
        print(f"  NonReg withdrawal: ${nonreg_wd:,.2f}")
        print(f"  TFSA withdrawal: ${tfsa_wd:,.2f}")

        # Check withdrawal order
        if i == 0:  # First year - should heavily use corporate
            if corp_wd > 50000:  # Should be withdrawing significantly from corporate
                print(f"  ✅ Corporate is being used as primary source (${corp_wd:,.2f})")
            else:
                print(f"  ❌ FAIL: Corporate withdrawal too low! Expected >$50k, got ${corp_wd:,.2f}")
                success = False

            # TFSA should be preserved (last in order)
            if tfsa_wd == 0:
                print(f"  ✅ TFSA preserved (as expected)")
            else:
                print(f"  ⚠️  WARNING: TFSA being used early (${tfsa_wd:,.2f})")

        # NonReg should be used after corporate is depleted
        if corp_wd > 0 and nonreg_wd > 10000:  # If both are being used significantly
            print(f"  ⚠️  WARNING: NonReg being used while Corporate still available")
            print(f"     This suggests order might not be: Corp → RRIF → NonReg → TFSA")

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    # Calculate total withdrawals over period
    total_corp = sum(y.get('corp_withdrawal_p1', 0) for y in data['five_year_plan'][:3])
    total_rrif = sum(y.get('rrif_withdrawal_p1', 0) for y in data['five_year_plan'][:3])
    total_nonreg = sum(y.get('nonreg_withdrawal_p1', 0) for y in data['five_year_plan'][:3])
    total_tfsa = sum(y.get('tfsa_withdrawal_p1', 0) for y in data['five_year_plan'][:3])

    print(f"Total withdrawals (3 years):")
    print(f"  Corporate: ${total_corp:,.2f}")
    print(f"  RRIF: ${total_rrif:,.2f}")
    print(f"  NonReg: ${total_nonreg:,.2f}")
    print(f"  TFSA: ${total_tfsa:,.2f}")

    # Final verdict
    if total_corp > 150000:  # Should use most of the $200k corporate over 3 years
        print(f"\n✅ SUCCESS: Corporate-Optimized strategy is working!")
        print(f"   Corporate accounts are being prioritized (${total_corp:,.2f} withdrawn)")
    else:
        print(f"\n❌ FAILURE: Corporate withdrawals too low!")
        print(f"   Expected >$150k over 3 years, got ${total_corp:,.2f}")
        success = False

    # Check if TFSA is preserved
    if total_tfsa < 10000:  # TFSA should be minimal
        print(f"✅ TFSA is being preserved (only ${total_tfsa:,.2f} withdrawn)")
    else:
        print(f"⚠️  TFSA being used more than expected (${total_tfsa:,.2f} withdrawn)")

    return success


def test_rrif_frontload_8percent():
    """Test that RRIF-Frontload withdraws 8% after age 65"""

    print("\n" + "=" * 80)
    print("TESTING RRIF-FRONTLOAD STRATEGY (8% after OAS)")
    print("=" * 80)

    payload = {
        'p1': {
            'name': 'RRIF Test',
            'start_age': 65,
            'rrif_balance': 100000,
            'tfsa_balance': 100000,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 100000,
            'corp_cash_bucket': 0,
            'corp_gic_bucket': 0,
            'corp_invest_bucket': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 10000,
            'oas_start_age': 65,
            'oas_annual_at_start': 8000,
            'pension_incomes': [],
            'other_incomes': []
        },
        'p2': {
            'name': '',
            'start_age': 65,
            'rrif_balance': 0,
            'tfsa_balance': 0,
            'nr_cash': 0,
            'nr_gic': 0,
            'nr_invest': 0,
            'corp_cash_bucket': 0,
            'corp_gic_bucket': 0,
            'corp_invest_bucket': 0,
            'cpp_start_age': 65,
            'cpp_annual_at_start': 0,
            'oas_start_age': 65,
            'oas_annual_at_start': 0,
            'pension_incomes': [],
            'other_incomes': []
        },
        'include_partner': False,
        'province': 'ON',
        'start_year': 2026,
        'end_age': 67,
        'strategy': 'rrif-frontload',
        'spending_go_go': 50000,
        'spending_slow_go': 50000,
        'slow_go_end_age': 85,
        'spending_no_go': 50000,
        'go_go_end_age': 75,
        'spending_inflation': 0,
        'general_inflation': 0,
        'tfsa_contribution_each': 0
    }

    print("\nTest Configuration:")
    print(f"  Strategy: rrif-frontload")
    print(f"  RRIF: $100,000")
    print(f"  Age: 65 (OAS started)")
    print(f"  Expected RRIF withdrawal: 8% = $8,000")

    response = requests.post('http://localhost:8000/api/run-simulation', json=payload, timeout=30)

    if response.status_code != 200:
        print(f"\n❌ ERROR: API returned status {response.status_code}")
        return False

    data = response.json()

    if data.get('five_year_plan'):
        year1 = data['five_year_plan'][0]
        rrif_wd = year1.get('rrif_withdrawal_p1', 0)

        print(f"\nYear 1 RRIF withdrawal: ${rrif_wd:,.2f}")

        if 7900 <= rrif_wd <= 8100:  # Allow small tolerance
            print(f"✅ SUCCESS: RRIF-Frontload withdrawing correct 8% after OAS")
            return True
        else:
            print(f"❌ FAILURE: Expected ~$8,000 (8%), got ${rrif_wd:,.2f}")
            return False

    return False


if __name__ == '__main__':
    print("\n" + "🚀 " * 20)
    print("COMPREHENSIVE STRATEGY TESTING")
    print("🚀 " * 20)

    # Run tests
    corp_test = test_corporate_optimized_strategy()
    rrif_test = test_rrif_frontload_8percent()

    # Final results
    print("\n" + "=" * 80)
    print("FINAL TEST RESULTS")
    print("=" * 80)

    if corp_test:
        print("✅ Corporate-Optimized Strategy: PASSED")
    else:
        print("❌ Corporate-Optimized Strategy: FAILED")

    if rrif_test:
        print("✅ RRIF-Frontload 8% Strategy: PASSED")
    else:
        print("❌ RRIF-Frontload 8% Strategy: FAILED")

    if corp_test and rrif_test:
        print("\n🎉 ALL TESTS PASSED! Strategies are working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  SOME TESTS FAILED. Please review the issues above.")
        sys.exit(1)