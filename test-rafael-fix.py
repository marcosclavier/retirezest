#!/usr/bin/env python3
"""
Test Rafael's scenario to verify the RRIF-Frontload fix
Rafael: Single, 60, retiring at 67, $400k assets (RRIF $350k, TFSA $50k)
Needs $120k/year spending, CPP/OAS at 65
Problem: Shows "Gap" in early years despite having sufficient assets
"""

import requests
import json
import sys
from datetime import datetime

# API endpoint (local development)
API_URL = "http://localhost:8000/api/run-simulation"

def test_rafael_scenario():
    """Test Rafael's exact scenario with RRIF-Frontload strategy"""

    # Rafael's data (single person, RRIF-heavy portfolio)
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

        # Empty p2 for single person (API requires it but with proper structure)
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
        "withdrawal_strategy": "RRIF-Frontload (15%/8%)",  # RRIF-heavy strategy
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
        "province": "ON",
        "start_year": 2025
    }

    print("\n" + "="*80)
    print("TESTING RAFAEL'S SCENARIO - RRIF-FRONTLOAD FIX")
    print("="*80)
    print(f"Strategy: {test_data['withdrawal_strategy']}")
    print(f"Assets: RRIF=${test_data['p1']['rrif_balance']:,}, TFSA=${test_data['p1']['tfsa_balance']:,}")
    print(f"Spending: ${test_data['spending_go_go']:,}/year (Go-Go phase)")
    print(f"CPP/OAS: Starting at age {test_data['p1']['cpp_start_age']}")

    try:
        # Run simulation
        print("\nRunning simulation...")
        response = requests.post(API_URL, json=test_data, timeout=30)

        if response.status_code == 200:
            result = response.json()

            # Check first few years (where the bug was showing "Gap")
            print("\n" + "="*80)
            print("YEAR-BY-YEAR RESULTS (First 5 Years of Retirement)")
            print("="*80)

            retirement_start_year = 2025 + (67 - 60)  # 2032
            years_to_check = []

            for year_data in result.get("years", []):
                year = year_data.get("year", 0)
                if year >= retirement_start_year and year <= retirement_start_year + 4:
                    years_to_check.append(year_data)

            # Analyze results
            all_ok = True
            for year_data in years_to_check:
                year = year_data.get("year", 0)
                age = year_data.get("age_p1", 0)

                # Extract key values
                rrif_withdrawal = year_data.get("withdraw_rrif_p1", 0)
                tfsa_withdrawal = year_data.get("withdraw_tfsa_p1", 0)
                total_withdrawals = year_data.get("total_withdrawals", 0)

                # Calculate total income
                cpp = year_data.get("cpp_p1", 0)
                oas = year_data.get("oas_p1", 0)
                gis = year_data.get("gis_p1", 0)

                # Tax
                tax = year_data.get("total_tax_after_split", 0)

                # Net income
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

                # Status
                status = "Gap" if is_underfunded else "OK"
                if is_underfunded:
                    all_ok = False

                print(f"\nYear {year} (Age {age}):")
                print(f"  Withdrawals: RRIF=${rrif_withdrawal:,.0f}, TFSA=${tfsa_withdrawal:,.0f}, Total=${total_withdrawals:,.0f}")
                print(f"  Gov Benefits: CPP=${cpp:,.0f}, OAS=${oas:,.0f}, GIS=${gis:,.0f}")
                print(f"  Gross Income: ${gross_income:,.0f}")
                print(f"  Tax: ${tax:,.0f}")
                print(f"  Net Income: ${net_income:,.0f}")
                print(f"  Spending Need: ${spending:,.0f}")
                print(f"  Gap: ${gap:,.0f}")
                print(f"  Status: {status} {'❌' if is_underfunded else '✅'}")
                print(f"  Remaining Assets: RRIF=${end_rrif:,.0f}, TFSA=${end_tfsa:,.0f}, Total=${total_assets:,.0f}")

            # Summary
            print("\n" + "="*80)
            print("TEST RESULTS SUMMARY")
            print("="*80)

            if all_ok:
                print("✅ SUCCESS: No 'Gap' status in early retirement years!")
                print("The RRIF-Frontload fix is working correctly.")
                print("Rafael's simulation now properly withdraws sufficient funds to meet spending needs.")
            else:
                print("❌ FAILURE: Still seeing 'Gap' status in early years")
                print("The fix may not be fully addressing the issue.")

                # Additional debugging
                print("\n⚠️  DEBUGGING INFO:")
                print("Check if RRIF withdrawals are sufficient to meet after-tax spending needs.")
                print("With $120k spending and ~30% tax rate, need ~$170k gross withdrawals.")

            # Check health score
            health_score = result.get("health_score", 0)
            print(f"\nHealth Score: {health_score}/100")

            return all_ok

        else:
            print(f"\n❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Connection Error: {e}")
        print("Make sure the API server is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    success = test_rafael_scenario()
    sys.exit(0 if success else 1)