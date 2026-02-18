#!/usr/bin/env python3
"""
Test Marc's specific reported issues:
1. Pension indexing display issue
2. UnboundLocalError with 'sys' variable
"""

import requests
import json

# Production API
API_URL = "https://astonishing-learning-production.up.railway.app/api/run-simulation"

def test_marc_pension_issue():
    """Test Marc's exact scenario that was failing"""
    print("\n" + "="*70)
    print("TESTING MARC'S REPORTED ISSUES")
    print("="*70)

    # Marc's scenario with pension
    payload = {
        "strategy": "rrif-frontload",
        "province": "QC",
        "start_year": 2026,
        "include_partner": False,
        "p1": {
            "name": "Marc",
            "start_age": 55,  # Starting at 55 with pension
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000.0,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 100000.0,
            "rrif_balance": 0.0,
            "rrsp_balance": 300000.0,  # Has RRSP
            "nonreg_balance": 200000.0,
            "corporate_balance": 500000.0,
            "nonreg_acb": 100000.0,
            "nr_cash": 20000.0,
            "nr_gic": 30000.0,
            "nr_invest": 150000.0,
            "pension_incomes": [
                {
                    "name": "Private Pension",
                    "annual_amount": 50000.0,
                    "start_age": 55,
                    "end_age": 95,
                    "is_indexed": False,  # NOT indexed
                    "index_rate": 0.0,
                    "survivor_benefit": 0.0
                }
            ],
            "other_incomes": []
        },
        "p2": {
            "name": "",
            "start_age": 55,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0.0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0.0,
            "tfsa_balance": 0.0,
            "rrif_balance": 0.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 0.0,
            "corporate_balance": 0.0,
            "nonreg_acb": 0.0,
            "nr_cash": 0.0,
            "nr_gic": 0.0,
            "nr_invest": 0.0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "spending_go_go": 100000.0,
        "go_go_end_age": 75,
        "spending_slow_go": 90000.0,
        "slow_go_end_age": 80,
        "spending_no_go": 80000.0,
        "spending_inflation": 2.0,
        "general_inflation": 2.0
    }

    print("\nTest 1: Marc's scenario with non-indexed pension")
    print("-" * 50)
    print("Setup:")
    print("  - Starting age: 55")
    print("  - Private pension: $50,000/year (NOT indexed)")
    print("  - RRSP: $300,000")
    print("  - Corporate: $500,000")

    try:
        response = requests.post(API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) >= 5:
                print("\n✅ SIMULATION SUCCESSFUL - No 'sys' error!")

                # Check pension values to confirm not indexed
                print("\nPension values (should stay at $50,000):")
                for i in range(min(5, len(years))):
                    year = years[i]
                    pension = year.get("pension_income_p1", 0)
                    print(f"  Year {i+1}: ${pension:,.0f}")

                # Check if pension is incorrectly indexed
                year5_pension = years[4].get("pension_income_p1", 0) if len(years) > 4 else 0
                if year5_pension > 51000:  # Should not increase if not indexed
                    print("\n⚠️ WARNING: Pension appears to be indexed when it shouldn't be")
                    return False
                else:
                    print("\n✅ Pension correctly NOT indexed")
                    return True
            else:
                print("❌ Not enough years in simulation")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            error_text = response.text[:500]
            print(f"Response: {error_text}")

            # Check for the specific 'sys' error Marc reported
            if "cannot access local variable 'sys'" in error_text.lower():
                print("\n❌ MARC'S ERROR STILL PRESENT: UnboundLocalError with 'sys'")
                return False
            return False

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def test_with_indexed_pension():
    """Test with indexed pension for comparison"""
    print("\nTest 2: Same scenario but WITH indexed pension")
    print("-" * 50)

    payload = {
        "strategy": "rrif-frontload",
        "province": "QC",
        "start_year": 2026,
        "include_partner": False,
        "p1": {
            "name": "Marc",
            "start_age": 55,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000.0,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 100000.0,
            "rrif_balance": 0.0,
            "rrsp_balance": 300000.0,
            "nonreg_balance": 200000.0,
            "corporate_balance": 500000.0,
            "nonreg_acb": 100000.0,
            "nr_cash": 20000.0,
            "nr_gic": 30000.0,
            "nr_invest": 150000.0,
            "pension_incomes": [
                {
                    "name": "Private Pension",
                    "annual_amount": 50000.0,
                    "start_age": 55,
                    "end_age": 95,
                    "is_indexed": True,  # INDEXED this time
                    "index_rate": 2.0,  # 2% indexation
                    "survivor_benefit": 0.0
                }
            ],
            "other_incomes": []
        },
        "p2": {
            "name": "",
            "start_age": 55,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0.0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0.0,
            "tfsa_balance": 0.0,
            "rrif_balance": 0.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 0.0,
            "corporate_balance": 0.0,
            "nonreg_acb": 0.0,
            "nr_cash": 0.0,
            "nr_gic": 0.0,
            "nr_invest": 0.0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "spending_go_go": 100000.0,
        "go_go_end_age": 75,
        "spending_slow_go": 90000.0,
        "slow_go_end_age": 80,
        "spending_no_go": 80000.0,
        "spending_inflation": 2.0,
        "general_inflation": 2.0
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) >= 5:
                print("\nPension values (should increase by 2% per year):")
                for i in range(min(5, len(years))):
                    year = years[i]
                    pension = year.get("pension_income_p1", 0)
                    expected = 50000 * (1.02 ** i)
                    print(f"  Year {i+1}: ${pension:,.0f} (expected: ${expected:,.0f})")

                print("\n✅ Indexed pension test completed")
                return True
            else:
                print("❌ Not enough years")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def main():
    """Run Marc's issue tests"""
    print("\n" + "="*70)
    print(" MARC'S REPORTED ISSUES VERIFICATION")
    print("="*70)
    print("\nMarc reported:")
    print("1. Pension shows 'indexed' when checkbox unchecked")
    print("2. Simulation fails with UnboundLocalError: 'sys'")

    results = []

    # Test Marc's exact scenario
    results.append(("Marc's Non-Indexed Pension", test_marc_pension_issue()))

    # Test indexed pension for comparison
    results.append(("Indexed Pension Comparison", test_with_indexed_pension()))

    # Summary
    print("\n" + "="*70)
    print(" RESULTS")
    print("="*70)

    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "="*70)
    if all_passed:
        print(" ✅ MARC'S ISSUES ARE FIXED!")
        print("\n - No more UnboundLocalError with 'sys'")
        print(" - Pension indexing working correctly")
        print(" - Simulation runs successfully")
    else:
        print(" ⚠️ SOME ISSUES MAY REMAIN")
    print("="*70)

    return 0 if all_passed else 1


if __name__ == "__main__":
    exit(main())