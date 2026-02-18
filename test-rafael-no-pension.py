#!/usr/bin/env python3
"""
Test Rafael's ACTUAL scenario - NO PENSION!
The issue is that Rafael now has a $100k pension that wasn't there before.
This test uses the CORRECT scenario with NO pension income.
"""

import requests
import json
import sys
from datetime import datetime

# API endpoint (local development)
API_URL = "http://localhost:8000/api/run-simulation"

def test_rafael_without_pension():
    """Test Rafael's REAL scenario - Alberta, NO PENSION"""

    print("\n" + "="*80)
    print("TESTING RAFAEL'S ACTUAL SCENARIO (NO PENSION)")
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
            "cpp_amount": 8789,  # Standard amount, not enhanced
            "oas_start_age": 65,
            "oas_amount": 6544,  # Standard amount
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

            # NO PENSION - This is the key difference!
            "pension_incomes": [],  # Empty - no pension!
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
        print(f"\nScenario Details:")
        print(f"  Location: Alberta")
        print(f"  Strategy: {test_data['withdrawal_strategy']}")
        print(f"  Assets: RRIF=${test_data['p1']['rrif_balance']:,}, TFSA=${test_data['p1']['tfsa_balance']:,}")
        print(f"  Spending: ${test_data['spending_go_go']:,}/year")
        print(f"  CPP/OAS: Starting at age {test_data['p1']['cpp_start_age']}")
        print(f"  Pension: NONE (this is the key!)")

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
        print("YEAR-BY-YEAR ANALYSIS (First 5 Retirement Years)")
        print("="*80)

        retirement_start_year = 2025 + (67 - 60)  # 2032

        for year_data in result.get("years", []):
            year = year_data.get("year", 0)
            age = year_data.get("age_p1", 0)

            # Focus on retirement years
            if age >= 67 and age <= 71:  # First 5 years
                # Extract key values
                rrif_withdrawal = year_data.get("withdraw_rrif_p1", 0)
                tfsa_withdrawal = year_data.get("withdraw_tfsa_p1", 0)
                total_withdrawals = year_data.get("total_withdrawals", 0)

                # Government benefits
                cpp = year_data.get("cpp_p1", 0)
                oas = year_data.get("oas_p1", 0)

                # Check for pension (should be 0!)
                pension = year_data.get("employer_pension_p1", 0)

                # Tax and net income
                tax = year_data.get("total_tax_after_split", 0)
                gross_income = cpp + oas + pension + total_withdrawals
                net_income = gross_income - tax

                # Spending and gap
                spending = year_data.get("spend_target_after_tax", 0)
                gap = year_data.get("spending_gap", 0)
                is_underfunded = year_data.get("is_underfunded", False)

                # Remaining balances
                end_rrif = year_data.get("end_rrif_p1", 0)
                end_tfsa = year_data.get("end_tfsa_p1", 0)

                # Calculate RRIF withdrawal percentage
                start_rrif = year_data.get("start_rrif_p1", 0)
                rrif_pct = (rrif_withdrawal / start_rrif * 100) if start_rrif > 0 else 0

                # Print year details
                status_symbol = "❌" if is_underfunded else "✅"

                print(f"\nYear {year} (Age {age}):")
                print(f"  Government Benefits: CPP=${cpp:,.0f}, OAS=${oas:,.0f}")
                print(f"  Pension: ${pension:,.0f} {'⚠️ UNEXPECTED!' if pension > 0 else '✓'}")
                print(f"  RRIF Withdrawal: ${rrif_withdrawal:,.0f} ({rrif_pct:.1f}% of ${start_rrif:,.0f})")
                print(f"  TFSA Withdrawal: ${tfsa_withdrawal:,.0f}")
                print(f"  Total Withdrawals: ${total_withdrawals:,.0f}")
                print(f"  Gross Income: ${gross_income:,.0f}")
                print(f"  Tax: ${tax:,.0f}")
                print(f"  Net Income: ${net_income:,.0f}")
                print(f"  Spending Need: ${spending:,.0f}")
                print(f"  Gap: ${gap:,.0f}")
                print(f"  Status: {status_symbol} {'Gap' if is_underfunded else 'OK'}")
                print(f"  Remaining: RRIF=${end_rrif:,.0f}, TFSA=${end_tfsa:,.0f}")

        # Check if fix is working
        print("\n" + "="*80)
        print("TEST RESULTS")
        print("="*80)

        # Look for RRIF withdrawals > 8% after OAS
        fix_working = False
        for year_data in result.get("years", []):
            age = year_data.get("age_p1", 0)
            if age >= 67 and age <= 71:
                start_rrif = year_data.get("start_rrif_p1", 0)
                rrif_withdrawal = year_data.get("withdraw_rrif_p1", 0)
                if start_rrif > 0:
                    rrif_pct = (rrif_withdrawal / start_rrif * 100)
                    if rrif_pct > 8.5:  # Allow 0.5% tolerance
                        fix_working = True
                        print(f"✅ Age {age}: RRIF withdrawal {rrif_pct:.1f}% exceeds 8% frontload")

        if fix_working:
            print("\n✅ FIX IS WORKING - RRIF withdrawals exceed frontload percentage when needed")
        else:
            print("\n❌ FIX NOT WORKING - RRIF withdrawals still capped at frontload percentage")

        # Check health score
        health_score = result.get("health_score", 0)
        print(f"\nHealth Score: {health_score}/100")

        return fix_working

    except Exception as e:
        print(f"\n❌ Test Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run the test"""
    print("\n" + "="*80)
    print("RAFAEL WITHOUT PENSION - RRIF-FRONTLOAD FIX TEST")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

    # Test Rafael's scenario WITHOUT pension
    success = test_rafael_without_pension()

    print("\n" + "="*80)
    print("FINAL RESULT")
    print("="*80)

    if success:
        print("✅ TEST PASSED - Fix is working for Rafael WITHOUT pension")
        return 0
    else:
        print("❌ TEST FAILED - Fix not working properly")
        return 1

if __name__ == "__main__":
    sys.exit(main())