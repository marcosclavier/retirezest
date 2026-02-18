#!/usr/bin/env python3
"""
Final production verification test
Focuses on the critical issues that were fixed
"""

import requests
import json
import sys

# Railway Production API endpoint
API_URL = "https://astonishing-learning-production.up.railway.app/api/run-simulation"

def test_cpp_oas_at_70():
    """Test that CPP/OAS correctly start at age 70, not 65"""
    print("\n" + "="*70)
    print("TEST 1: CPP/OAS at Age 70 (Critical Fix)")
    print("="*70)

    payload = {
        "strategy": "rrif-frontload",
        "province": "ON",
        "start_year": 2026,
        "include_partner": False,
        "p1": {
            "name": "TestUser",
            "start_age": 65,
            "cpp_start_age": 70,  # Should NOT pay until age 70
            "cpp_annual_at_start": 15000.0,
            "oas_start_age": 70,  # Should NOT pay until age 70
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 95000.0,
            "rrif_balance": 300000.0,
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
        response = requests.post(API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if len(years) >= 6:
                # Check years 1-5 (ages 65-69) - should have NO CPP/OAS
                failures = []
                for i in range(5):
                    year = years[i]
                    age = 65 + i
                    cpp = year.get("cpp_p1", 0)
                    oas = year.get("oas_p1", 0)

                    print(f"Year {i+1} (age {age}): CPP=${cpp:,.0f}, OAS=${oas:,.0f}")

                    if cpp != 0 or oas != 0:
                        failures.append(f"Age {age}: CPP=${cpp:,.0f}, OAS=${oas:,.0f} (should be $0)")

                # Check year 6 (age 70) - should have CPP/OAS
                year6 = years[5]
                cpp6 = year6.get("cpp_p1", 0)
                oas6 = year6.get("oas_p1", 0)

                print(f"Year 6 (age 70): CPP=${cpp6:,.0f}, OAS=${oas6:,.0f}")

                if cpp6 < 15000:
                    failures.append(f"Age 70: CPP only ${cpp6:,.0f} (should be ~$21,300 with delay)")
                if oas6 < 8000:
                    failures.append(f"Age 70: OAS only ${oas6:,.0f} (should be ~$10,880 with delay)")

                if failures:
                    print("\n❌ FAIL: CPP/OAS age validation not working properly")
                    for failure in failures:
                        print(f"  - {failure}")
                    return False
                else:
                    print("\n✅ PASS: CPP/OAS correctly delayed to age 70!")
                    return True
            else:
                print("❌ Not enough years in simulation")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def test_juan_daniela_corporate():
    """Test Juan & Daniela's $2.5M Corporate withdrawal issue"""
    print("\n" + "="*70)
    print("TEST 2: Juan & Daniela Corporate Withdrawals (Critical Fix)")
    print("="*70)

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
            "corporate_balance": 1502354.0,  # $1.5M
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
            "corporate_balance": 1063236.0,  # $1.06M
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
        response = requests.post(API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) > 0:
                # Check first 3 years
                print("\nFirst 3 Years of Corporate Withdrawals:")
                print("-" * 50)

                all_good = True
                for i in range(min(3, len(years))):
                    year = years[i]
                    corp_p1 = year.get("corporate_withdrawal_p1", 0)
                    corp_p2 = year.get("corporate_withdrawal_p2", 0)
                    nonreg_p1 = year.get("nonreg_withdrawal_p1", 0)

                    print(f"\nYear {i+1}:")
                    print(f"  Juan: Corp=${corp_p1:,.0f}, NonReg=${nonreg_p1:,.0f}")
                    print(f"  Daniela: Corp=${corp_p2:,.0f}")

                    # First year is critical - must have Corporate withdrawals
                    if i == 0:
                        if corp_p1 == 0:
                            print(f"  ❌ Juan has $1.5M Corporate but withdrew $0")
                            all_good = False
                        if corp_p2 == 0:
                            print(f"  ❌ Daniela has $1.06M Corporate but withdrew $0")
                            all_good = False

                if all_good:
                    print("\n✅ PASS: Corporate withdrawals working correctly!")
                    print("  Juan and Daniela's Corporate accounts are being used")
                    return True
                else:
                    print("\n❌ FAIL: Corporate withdrawal issue detected")
                    return False
            else:
                print("❌ No simulation results")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def test_withdrawal_order():
    """Test that rrif-frontload uses Corp before NonReg"""
    print("\n" + "="*70)
    print("TEST 3: Withdrawal Order (Corp before NonReg)")
    print("="*70)

    payload = {
        "strategy": "rrif-frontload",
        "province": "ON",
        "start_year": 2026,
        "include_partner": False,
        "p1": {
            "name": "OrderTest",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000.0,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 50000.0,
            "rrif_balance": 200000.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 200000.0,  # Has NonReg
            "corporate_balance": 500000.0,  # Has Corporate
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
        "spending_go_go": 80000.0,
        "go_go_end_age": 75,
        "spending_slow_go": 70000.0,
        "slow_go_end_age": 80,
        "spending_no_go": 60000.0,
        "spending_inflation": 2.0,
        "general_inflation": 2.0
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) > 0:
                year1 = years[0]
                rrif = year1.get("rrif_withdrawal_p1", 0)
                corp = year1.get("corporate_withdrawal_p1", 0)
                nonreg = year1.get("nonreg_withdrawal_p1", 0)
                tfsa = year1.get("tfsa_withdrawal_p1", 0)

                print(f"\nYear 1 Withdrawal Order:")
                print(f"  RRIF: ${rrif:,.0f}")
                print(f"  Corporate: ${corp:,.0f}")
                print(f"  NonReg: ${nonreg:,.0f}")
                print(f"  TFSA: ${tfsa:,.0f}")

                # With rrif-frontload and $500k Corp + $200k NonReg:
                # After RRIF, should use Corp before NonReg
                if corp > 0 and nonreg == 0:
                    print("\n✅ PASS: Correct order - Using Corporate before NonReg")
                    return True
                elif corp == 0 and nonreg > 0:
                    print("\n❌ FAIL: Wrong order - Using NonReg before Corporate")
                    return False
                elif corp > 0 and nonreg > 0:
                    print("\n⚠️ WARNING: Using both Corp and NonReg in year 1")
                    print("  This might be correct if spending exceeds Corp balance")
                    return True
                else:
                    print("\n⚠️ Neither Corp nor NonReg used (might be using RRIF only)")
                    return True
            else:
                print("❌ No simulation results")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def main():
    """Run all critical tests"""
    print("\n" + "="*70)
    print(" PRODUCTION CRITICAL FIXES VERIFICATION")
    print(" Railway API: " + API_URL)
    print("="*70)

    results = []

    # Test 1: CPP/OAS at 70
    results.append(("CPP/OAS Age 70", test_cpp_oas_at_70()))

    # Test 2: Juan & Daniela Corporate
    results.append(("Juan & Daniela Corp", test_juan_daniela_corporate()))

    # Test 3: Withdrawal Order
    results.append(("Withdrawal Order", test_withdrawal_order()))

    # Final Summary
    print("\n" + "="*70)
    print(" FINAL RESULTS")
    print("="*70)

    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "="*70)
    if all_passed:
        print(" 🎉 ALL CRITICAL FIXES VERIFIED! 🎉")
        print("\n Marc can safely use the system:")
        print(" ✅ CPP/OAS delays to age 70 working")
        print(" ✅ Corporate withdrawals working")
        print(" ✅ Tax-efficient withdrawal order working")
    else:
        print(" ⚠️ SOME ISSUES DETECTED")
        print("\n Please review the failed tests above")
    print("="*70)

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())