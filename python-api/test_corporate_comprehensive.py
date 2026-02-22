#!/usr/bin/env python3
"""
Comprehensive test for Corporate-Optimized strategy
Tests various spending levels to ensure corporate withdrawals work
"""

import requests
import json

def test_scenario(spending_amount, description):
    """Test a specific spending scenario"""

    print(f"\n{'='*60}")
    print(f"TEST: {description}")
    print(f"Spending: ${spending_amount:,}/year")
    print(f"{'='*60}")

    payload = {
        "p1": {
            "name": "Test",
            "start_age": 65,
            "rrif_balance": 100000,
            "tfsa_balance": 50000,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 100000,
            "corp_cash_bucket": 50000,
            "corp_gic_bucket": 50000,
            "corp_invest_bucket": 100000,  # Total Corp: $200k
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000,
            "pension_incomes": [],
            "other_incomes": []
        },
        "p2": {
            "name": "",
            "start_age": 65,
            "rrif_balance": 0,
            "tfsa_balance": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "include_partner": False,
        "province": "ON",
        "start_year": 2026,
        "end_age": 70,
        "strategy": "corporate-optimized",
        "spending_go_go": spending_amount,
        "spending_slow_go": spending_amount * 0.9,
        "slow_go_end_age": 85,
        "spending_no_go": spending_amount * 0.8,
        "go_go_end_age": 75,
        "spending_inflation": 2,
        "general_inflation": 2,
        "tfsa_contribution_each": 0
    }

    try:
        response = requests.post(
            "http://localhost:8000/api/run-simulation",
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()

            if data.get('five_year_plan'):
                first_year = data['five_year_plan'][0]

                # Get withdrawal amounts
                corp_wd = first_year.get('corp_withdrawal_p1', 0)
                rrif_wd = first_year.get('rrif_withdrawal_p1', 0)
                nonreg_wd = first_year.get('nonreg_withdrawal_p1', 0)
                tfsa_wd = first_year.get('tfsa_withdrawal_p1', 0)

                # Get other income
                cpp = first_year.get('cpp_p1', 0)
                oas = first_year.get('oas_p1', 0)

                # Calculate totals
                total_withdrawals = corp_wd + rrif_wd + nonreg_wd + tfsa_wd
                total_income = cpp + oas + total_withdrawals

                # Get spending targets
                spending_total = first_year.get('spending_target', 0)
                spending_p1 = first_year.get('spending_target_p1', 0)

                print(f"\n📊 RESULTS:")
                print(f"  Spending target (total): ${spending_total:,.0f}")
                print(f"  Spending target (P1):    ${spending_p1:,.0f} {'⚠️ Split!' if spending_p1 < spending_total else ''}")
                print(f"  CPP+OAS income:          ${cpp + oas:,.0f}")
                print(f"  Net need (P1 - income):  ${spending_p1 - (cpp + oas):,.0f}")

                print(f"\n💰 WITHDRAWALS:")
                print(f"  Corporate: ${corp_wd:>12,.2f} {'✅ CORRECT!' if corp_wd > 0 else '❌ ERROR'}")
                print(f"  RRIF:      ${rrif_wd:>12,.2f}")
                print(f"  NonReg:    ${nonreg_wd:>12,.2f}")
                print(f"  TFSA:      ${tfsa_wd:>12,.2f}")
                print(f"  TOTAL:     ${total_withdrawals:>12,.2f}")

                # Verification
                if corp_wd > 0:
                    print(f"\n✅ SUCCESS: Corporate is being used (${corp_wd:,.2f})")
                else:
                    print(f"\n❌ FAILURE: Corporate not being used despite having $200k balance")

                return {
                    'spending': spending_amount,
                    'corp_wd': corp_wd,
                    'total_wd': total_withdrawals,
                    'success': corp_wd > 0
                }
        else:
            print(f"❌ API Error: {response.status_code}")
            return None

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def main():
    """Run comprehensive tests"""

    print("=" * 80)
    print("CORPORATE-OPTIMIZED COMPREHENSIVE TEST SUITE")
    print("=" * 80)
    print("\nTesting various spending levels to find where Corporate withdrawals start")
    print("Assets: Corp=$200k, RRIF=$100k, NonReg=$100k, TFSA=$50k")
    print("Income: CPP=$10k, OAS=$8k")

    # Test different spending levels
    test_scenarios = [
        (40000, "Low spending ($40k) - might be covered by income alone"),
        (60000, "Moderate spending ($60k) - should need some withdrawals"),
        (80000, "High spending ($80k) - definitely needs withdrawals"),
        (100000, "Very high spending ($100k) - needs significant withdrawals"),
        (120000, "Extreme spending ($120k) - needs major withdrawals"),
    ]

    results = []
    for spending, description in test_scenarios:
        result = test_scenario(spending, description)
        if result:
            results.append(result)

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY OF RESULTS")
    print("=" * 80)

    print("\n📈 Corporate Withdrawal by Spending Level:")
    print("  Spending    Corp Withdrawal   Status")
    print("  ---------   --------------   -------")

    for r in results:
        status = "✅ Working" if r['success'] else "❌ Not working"
        print(f"  ${r['spending']:>8,}   ${r['corp_wd']:>13,.2f}   {status}")

    # Find threshold
    working = [r for r in results if r['success']]
    if working:
        min_working = min(working, key=lambda x: x['spending'])
        print(f"\n📍 Corporate withdrawals start at spending ≥ ${min_working['spending']:,}")
    else:
        print("\n❌ Corporate withdrawals not working at any spending level tested!")

    print("\n" + "=" * 80)
    print("CONCLUSION:")
    if all(r['success'] for r in results if r['spending'] >= 80000):
        print("✅ Corporate-Optimized strategy appears to be working for realistic spending levels")
    else:
        print("❌ Corporate-Optimized strategy still has issues - not withdrawing from Corporate first")

    print("=" * 80)


if __name__ == "__main__":
    main()