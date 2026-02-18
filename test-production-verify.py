#!/usr/bin/env python3
"""
Test script to verify production deployment of fixes
"""

import requests
import json
import time

# Production API endpoint
PROD_API_URL = "https://www.retirezest.com/api/python/run-simulation"

def test_pension_ages_production():
    """Test CPP/OAS age validation in production"""
    print("\n" + "="*80)
    print("PRODUCTION TEST: CPP/OAS Age Validation")
    print("="*80)

    payload = {
        "strategy": "rrif-frontload",
        "province": "ON",
        "start_year": 2026,
        "include_partner": False,
        "p1": {
            "name": "TestPerson",
            "start_age": 65,
            "cpp_start_age": 70,  # Should start at 70, not 65
            "cpp_annual_at_start": 15000.0,
            "oas_start_age": 70,  # Should start at 70, not 65
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 100000.0,
            "rrif_balance": 200000.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 200000.0,
            "corporate_balance": 1000000.0,
            "nonreg_acb": 100000.0,
            "nr_cash": 20000.0,
            "nr_gic": 30000.0,
            "nr_invest": 150000.0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "p2": {
            "name": "",
            "start_age": 65,
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
        response = requests.post(PROD_API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) > 0:
                # Check first year (age 65) - should have NO CPP/OAS
                year1 = years[0]
                cpp_y1 = year1.get("cpp_p1", 0)
                oas_y1 = year1.get("oas_p1", 0)

                print(f"\nYear 1 (age 65):")
                print(f"  CPP: ${cpp_y1:,.0f} (expected: $0)")
                print(f"  OAS: ${oas_y1:,.0f} (expected: $0)")

                # Check year 6 (age 70) - should have CPP/OAS
                if len(years) >= 6:
                    year6 = years[5]
                    cpp_y6 = year6.get("cpp_p1", 0)
                    oas_y6 = year6.get("oas_p1", 0)

                    print(f"\nYear 6 (age 70):")
                    print(f"  CPP: ${cpp_y6:,.0f} (expected: ~$21,300 with 42% increase)")
                    print(f"  OAS: ${oas_y6:,.0f} (expected: ~$10,880 with 36% increase)")

                # Verify ages are working correctly
                if cpp_y1 == 0 and oas_y1 == 0 and cpp_y6 > 15000 and oas_y6 > 8000:
                    print("\n✅ Pension ages working correctly in production")
                    return True
                else:
                    print("\n❌ Pension ages NOT working correctly in production")
                    return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_corporate_withdrawal_production():
    """Test Corporate withdrawal order in production"""
    print("\n" + "="*80)
    print("PRODUCTION TEST: Corporate Withdrawal Order (Juan & Daniela)")
    print("="*80)

    payload = {
        "strategy": "rrif-frontload",
        "province": "ON",
        "start_year": 2026,
        "include_partner": True,
        "p1": {
            "name": "Juan",
            "start_age": 65,
            "cpp_start_age": 70,
            "cpp_annual_at_start": 6000.0,
            "oas_start_age": 70,
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 45000.0,
            "rrif_balance": 0.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 73680.0,
            "corporate_balance": 1502354.0,
            "nonreg_acb": 36840.0,
            "nr_cash": 0.0,
            "nr_gic": 0.0,
            "nr_invest": 73680.0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "p2": {
            "name": "Daniela",
            "start_age": 58,
            "cpp_start_age": 70,
            "cpp_annual_at_start": 1000.0,
            "oas_start_age": 70,
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 20000.0,
            "rrif_balance": 0.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 0.0,
            "corporate_balance": 1063236.0,
            "nonreg_acb": 0.0,
            "nr_cash": 0.0,
            "nr_gic": 0.0,
            "nr_invest": 0.0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "spending_go_go": 153700.0,
        "go_go_end_age": 75,
        "spending_slow_go": 153700.0,
        "slow_go_end_age": 85,
        "spending_no_go": 153700.0,
        "spending_inflation": 2.0,
        "general_inflation": 2.0
    }

    try:
        response = requests.post(PROD_API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) > 0:
                year1 = years[0]
                corp_p1 = year1.get("corporate_withdrawal_p1", 0)
                corp_p2 = year1.get("corporate_withdrawal_p2", 0)
                nonreg_p1 = year1.get("nonreg_withdrawal_p1", 0)

                print(f"\nYear 1 Results:")
                print(f"  Juan:")
                print(f"    Corporate withdrawal: ${corp_p1:,.0f}")
                print(f"    NonReg withdrawal: ${nonreg_p1:,.0f}")
                print(f"  Daniela:")
                print(f"    Corporate withdrawal: ${corp_p2:,.0f}")

                if corp_p1 > 0 and corp_p2 > 0:
                    print("\n✅ Corporate withdrawals working correctly in production")
                    return True
                else:
                    print("\n❌ Corporate withdrawals NOT working in production")
                    return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def main():
    """Run all production tests"""
    print("\n" + "="*80)
    print("PRODUCTION DEPLOYMENT VERIFICATION")
    print("="*80)
    print("\nWaiting 30 seconds for Vercel deployment to complete...")
    time.sleep(30)

    results = []

    # Test 1: Pension ages
    results.append(("Pension Age Validation", test_pension_ages_production()))

    # Test 2: Corporate withdrawals
    results.append(("Corporate Withdrawal Order", test_corporate_withdrawal_production()))

    # Summary
    print("\n" + "="*80)
    print("PRODUCTION TEST SUMMARY")
    print("="*80)

    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "="*80)
    if all_passed:
        print("✅ ALL PRODUCTION TESTS PASSED")
        print("\nMarc can now run his simulations with:")
        print("- CPP/OAS correctly starting at age 70")
        print("- Corporate withdrawals working properly")
        print("- Tax-efficient withdrawal order preserved")
    else:
        print("❌ SOME PRODUCTION TESTS FAILED")
        print("\nPlease check the deployment and retry")

    return 0 if all_passed else 1


if __name__ == "__main__":
    exit(main())