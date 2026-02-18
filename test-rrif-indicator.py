#!/usr/bin/env python3
"""
Test RRIF frontload exceeded indicator for Rafael's scenario
"""

import requests
import json
import sys
from datetime import datetime

# API endpoint (local development)
API_URL = "http://localhost:8000/api/run-simulation"

def test_rrif_frontload_indicator():
    """Test if RRIF frontload exceeded indicator is working"""

    print("\n" + "="*80)
    print("TESTING RRIF FRONTLOAD EXCEEDED INDICATOR")
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

            # NO PENSION
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
        print(f"\nScenario Details:")
        print(f"  Strategy: {test_data['withdrawal_strategy']}")
        print(f"  Assets: RRIF=${test_data['p1']['rrif_balance']:,}, TFSA=${test_data['p1']['tfsa_balance']:,}")
        print(f"  Spending: ${test_data['spending_go_go']:,}/year")
        print(f"  Expected: RRIF withdrawals should exceed 8% frontload after OAS")

        # Run simulation
        print("\nRunning simulation...")
        response = requests.post(API_URL, json=test_data, timeout=30)

        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

        result = response.json()

        # Check for RRIF frontload exceeded indicators
        print("\n" + "="*80)
        print("CHECKING RRIF FRONTLOAD EXCEEDED INDICATORS")
        print("="*80)

        indicator_found = False
        exceeded_years = []

        for year_data in result.get("years", []):
            year = year_data.get("year", 0)
            age = year_data.get("age_p1", 0)

            # Check retirement years
            if age >= 67:
                # Check for the new fields
                rrif_frontload_exceeded = year_data.get("rrif_frontload_exceeded_p1", False)
                rrif_frontload_pct = year_data.get("rrif_frontload_pct_p1", 0.0)

                # Also calculate from withdrawal data
                rrif_withdrawal = year_data.get("withdraw_rrif_p1", 0)
                start_rrif = year_data.get("start_rrif_p1", 0)
                actual_pct = (rrif_withdrawal / start_rrif * 100) if start_rrif > 0 else 0

                print(f"\nYear {year} (Age {age}):")
                print(f"  RRIF Balance Start: ${start_rrif:,.0f}")
                print(f"  RRIF Withdrawal: ${rrif_withdrawal:,.0f}")
                print(f"  Actual %: {actual_pct:.1f}%")
                print(f"  rrif_frontload_exceeded_p1: {rrif_frontload_exceeded}")
                print(f"  rrif_frontload_pct_p1: {rrif_frontload_pct:.1f}%")

                # Check if indicator is set when it should be
                expected_pct = 8.0 if age >= 65 else 15.0  # After/before OAS
                if actual_pct > expected_pct + 0.5:
                    if rrif_frontload_exceeded:
                        print(f"  ✅ Indicator correctly set (exceeded {expected_pct}%)")
                        indicator_found = True
                        exceeded_years.append(year)
                    else:
                        print(f"  ❌ Indicator MISSING (should be set, exceeded {expected_pct}%)")

                # Stop checking after first 5 retirement years
                if age > 71:
                    break

        # Summary
        print("\n" + "="*80)
        print("TEST RESULTS")
        print("="*80)

        if indicator_found:
            print(f"✅ RRIF frontload exceeded indicator is WORKING!")
            print(f"   Indicator set in years: {exceeded_years}")
            print(f"   Frontend should show warning icon with tooltip")
            return True
        else:
            print(f"⚠️  No RRIF frontload exceeded indicators found")
            print(f"   This could mean:")
            print(f"   1. The backend tracking isn't working")
            print(f"   2. RRIF withdrawals aren't exceeding frontload")
            print(f"   3. The fields aren't being populated")
            return False

    except Exception as e:
        print(f"\n❌ Test Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run the test"""
    print("\n" + "="*80)
    print("RRIF FRONTLOAD EXCEEDED INDICATOR TEST")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

    # Test the indicator
    success = test_rrif_frontload_indicator()

    print("\n" + "="*80)
    print("FINAL RESULT")
    print("="*80)

    if success:
        print("✅ TEST PASSED - RRIF frontload exceeded indicator is working!")
        print("\nThe frontend should now show:")
        print("- Warning icon next to RRIF withdrawals that exceed standard frontload")
        print("- Tooltip explaining the percentage withdrawn vs. expected")
        return 0
    else:
        print("❌ TEST FAILED - Indicator not working as expected")
        return 1

if __name__ == "__main__":
    sys.exit(main())