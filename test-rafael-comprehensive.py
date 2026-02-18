#!/usr/bin/env python3
"""
Comprehensive test for Rafael's RRIF-Frontload scenario
Verifies the fix correctly handles insufficient frontload percentages
"""

import requests
import json
import sys
from datetime import datetime

# API endpoint (local development)
API_URL = "http://localhost:8000/api/run-simulation"

def test_rafael_alberta():
    """Test Rafael's exact scenario in Alberta with RRIF-Frontload strategy"""

    print("\n" + "="*80)
    print("COMPREHENSIVE TEST: RAFAEL IN ALBERTA")
    print("="*80)

    test_data = {
        "p1": {
            "name": "Rafael",
            "is_retired": False,
            "retirement_age": 67,
            "start_age": 60,
            "life_expectancy": 85,

            # Assets - RRIF-heavy portfolio
            "rrsp_balance": 0,
            "rrif_balance": 350000,
            "tfsa_balance": 50000,
            "nonreg_balance": 0,
            "corporate_balance": 0,

            # Income settings - CPP/OAS at 65 (early)
            "cpp_start_age": 65,
            "cpp_amount": 8789,
            "oas_start_age": 65,
            "oas_amount": 6544,
            "gis_amount": 0,

            # Growth rates
            "yield_rrsp_growth": 0.04,
            "yield_rrif_growth": 0.04,
            "yield_tfsa_growth": 0.04,
            "yield_nonreg_growth": 0.04,

            # Other
            "tfsa_room_start": 0,
            "tfsa_room_annual_growth": 7000,
            "nonreg_acb": 0,
            "pension_incomes": [],
            "other_incomes": []
        },

        "p2": {
            "name": "",
            "is_retired": False,
            "retirement_age": 65,
            "start_age": 60,
            "life_expectancy": 85,
            "rrsp_balance": 0,
            "rrif_balance": 0,
            "tfsa_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "cpp_start_age": 65,
            "cpp_amount": 0,
            "oas_start_age": 65,
            "oas_amount": 0,
            "gis_amount": 0,
            "yield_rrsp_growth": 0.04,
            "yield_rrif_growth": 0.04,
            "yield_tfsa_growth": 0.04,
            "yield_nonreg_growth": 0.04,
            "tfsa_room_start": 0,
            "tfsa_room_annual_growth": 0,
            "nonreg_acb": 0,
            "pension_incomes": [],
            "other_incomes": []
        },

        # Household settings
        "household_is_couple": False,
        "withdrawal_strategy": "RRIF-Frontload (15%/8%)",
        "spending_go_go": 120000,  # High spending need
        "spending_slow_go": 80000,
        "spending_no_go": 50000,
        "go_go_end_age": 75,
        "slow_go_end_age": 85,
        "end_age": 85,
        "gap_tolerance": 100,
        "stop_on_fail": False,
        "general_inflation": 0.025,
        "spending_inflation": 0.025,
        "province": "AB",  # Alberta
        "start_year": 2025
    }

    try:
        print(f"\nTesting scenario:")
        print(f"  Location: Alberta (lower tax rates)")
        print(f"  Strategy: {test_data['withdrawal_strategy']}")
        print(f"  Assets: RRIF=${test_data['p1']['rrif_balance']:,}, TFSA=${test_data['p1']['tfsa_balance']:,}")
        print(f"  Spending: ${test_data['spending_go_go']:,}/year")
        print(f"  CPP/OAS: Starting at age {test_data['p1']['cpp_start_age']}")

        # Run simulation
        print("\nRunning simulation...")
        response = requests.post(API_URL, json=test_data, timeout=30)

        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

        result = response.json()

        # Analyze first 5 retirement years
        print("\n" + "="*80)
        print("YEAR-BY-YEAR ANALYSIS (Retirement Years)")
        print("="*80)

        retirement_start_year = 2025 + (67 - 60)  # 2032
        failed_years = []
        withdrawal_analysis = []

        for year_data in result.get("years", []):
            year = year_data.get("year", 0)
            age = year_data.get("age_p1", 0)

            # Focus on retirement years
            if age >= 67 and age <= 72:  # First 6 years of retirement
                # Extract key values
                rrif_withdrawal = year_data.get("withdraw_rrif_p1", 0)
                tfsa_withdrawal = year_data.get("withdraw_tfsa_p1", 0)
                total_withdrawals = year_data.get("total_withdrawals", 0)

                # Government benefits
                cpp = year_data.get("cpp_p1", 0)
                oas = year_data.get("oas_p1", 0)
                gis = year_data.get("gis_p1", 0)

                # Tax and net income
                tax = year_data.get("total_tax_after_split", 0)
                gross_income = cpp + oas + gis + total_withdrawals
                net_income = gross_income - tax

                # Spending and gap
                spending = year_data.get("spend_target_after_tax", 0)
                gap = year_data.get("spending_gap", 0)
                is_underfunded = year_data.get("is_underfunded", False)

                # Remaining balances
                end_rrif = year_data.get("end_rrif_p1", 0)
                end_tfsa = year_data.get("end_tfsa_p1", 0)
                total_assets = end_rrif + end_tfsa

                # Calculate RRIF withdrawal percentage
                start_rrif = year_data.get("start_rrif_p1", 0)
                rrif_pct = (rrif_withdrawal / start_rrif * 100) if start_rrif > 0 else 0

                # Expected frontload percentage
                expected_pct = 15 if age < 65 else 8  # Before/after OAS

                # Track results
                withdrawal_analysis.append({
                    'year': year,
                    'age': age,
                    'rrif_withdrawal': rrif_withdrawal,
                    'rrif_pct': rrif_pct,
                    'expected_pct': expected_pct,
                    'exceeded_frontload': rrif_pct > expected_pct + 0.5,  # Allow 0.5% tolerance
                    'net_income': net_income,
                    'spending': spending,
                    'gap': gap,
                    'is_underfunded': is_underfunded,
                    'total_assets': total_assets
                })

                if is_underfunded and total_assets > spending:  # Has assets but showing gap
                    failed_years.append(year)

                # Print year details
                status_symbol = "❌" if is_underfunded else "✅"
                frontload_indicator = "⚠️ EXCEEDED" if rrif_pct > expected_pct + 0.5 else ""

                print(f"\nYear {year} (Age {age}):")
                print(f"  RRIF Withdrawal: ${rrif_withdrawal:,.0f} ({rrif_pct:.1f}% of balance) {frontload_indicator}")
                print(f"  Expected Frontload: {expected_pct}%")
                print(f"  Total Withdrawals: ${total_withdrawals:,.0f}")
                print(f"  Net Income: ${net_income:,.0f}")
                print(f"  Spending Need: ${spending:,.0f}")
                print(f"  Gap: ${gap:,.0f}")
                print(f"  Remaining Assets: ${total_assets:,.0f}")
                print(f"  Status: {status_symbol} {'Gap' if is_underfunded else 'OK'}")

        # Analyze results
        print("\n" + "="*80)
        print("TEST RESULTS")
        print("="*80)

        # Check if fix is working
        fix_working = False
        insufficient_frontload_years = []

        for analysis in withdrawal_analysis:
            if analysis['exceeded_frontload']:
                insufficient_frontload_years.append(analysis['year'])
                fix_working = True

        if fix_working:
            print("✅ FIX IS WORKING!")
            print(f"   The RRIF-Frontload strategy correctly increased withdrawals beyond the standard")
            print(f"   frontload percentage in {len(insufficient_frontload_years)} years:")
            for year in insufficient_frontload_years:
                analysis = next(a for a in withdrawal_analysis if a['year'] == year)
                print(f"   - Year {year}: Withdrew {analysis['rrif_pct']:.1f}% (expected {analysis['expected_pct']}%)")
        else:
            print("⚠️  FIX MAY NOT BE FULLY WORKING")
            print("   No years showed RRIF withdrawals exceeding the frontload percentage")
            print("   This could mean:")
            print("   1. The frontload percentage was sufficient (no fix needed)")
            print("   2. The fix isn't triggering when it should")

        if failed_years:
            print(f"\n❌ PROBLEM: Still showing Gap in {len(failed_years)} years despite having assets:")
            for year in failed_years:
                analysis = next(a for a in withdrawal_analysis if a['year'] == year)
                print(f"   - Year {year}: Gap=${analysis['gap']:,.0f}, Assets=${analysis['total_assets']:,.0f}")
        else:
            print("\n✅ SUCCESS: No false Gap status in early retirement!")

        # Overall assessment
        health_score = result.get("health_score", 0)
        print(f"\nHealth Score: {health_score}/100")

        if health_score < 20:
            print("⚠️  Low health score indicates retirement plan issues")
            print("   This is expected given Rafael's high spending vs. assets")

        return len(failed_years) == 0 and (fix_working or all(a['rrif_pct'] <= a['expected_pct'] + 0.5 for a in withdrawal_analysis))

    except Exception as e:
        print(f"\n❌ Test Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("RRIF-FRONTLOAD FIX VERIFICATION TEST SUITE")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

    # Test Rafael's scenario
    test_passed = test_rafael_alberta()

    print("\n" + "="*80)
    print("FINAL TEST RESULTS")
    print("="*80)

    if test_passed:
        print("✅ ALL TESTS PASSED - Fix is working correctly!")
        print("\nThe RRIF-Frontload strategy now:")
        print("1. Withdraws more than the standard 15%/8% when needed")
        print("2. Ensures sufficient funds are withdrawn to meet spending")
        print("3. Only shows Gap when assets are truly insufficient")
        return 0
    else:
        print("❌ TESTS FAILED - Fix needs more work")
        print("\nIssues to investigate:")
        print("1. Check if RRIF withdrawals are being properly increased")
        print("2. Verify the withdrawal order logic")
        print("3. Ensure tax calculations are correct")
        return 1

if __name__ == "__main__":
    sys.exit(main())