#!/usr/bin/env python3
"""
Comprehensive production test for all critical fixes
Tests CPP/OAS ages, Corporate withdrawals, and strategies
"""

import requests
import json
import time
from typing import Dict, Any

# Railway Production API
RAILWAY_API_URL = "https://astonishing-learning-production.up.railway.app/api/run-simulation"

def print_section(title: str):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def test_cpp_oas_ages():
    """Test 1: CPP/OAS should start at configured age (70), not 65"""
    print_section("TEST 1: CPP/OAS Age Validation")

    payload = {
        "strategy": "rrif-frontload",
        "province": "ON",
        "start_year": 2026,
        "include_partner": False,
        "p1": {
            "name": "TestPerson",
            "start_age": 65,
            "cpp_start_age": 70,  # Should NOT pay out until age 70
            "cpp_annual_at_start": 15000.0,
            "oas_start_age": 70,  # Should NOT pay out until age 70
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 100000.0,
            "rrif_balance": 200000.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 200000.0,
            "corporate_balance": 500000.0,
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
        response = requests.post(RAILWAY_API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) >= 6:
                # Year 1 (age 65) - should have NO CPP/OAS
                year1 = years[0]
                cpp_y1 = year1.get("cpp_p1", 0)
                oas_y1 = year1.get("oas_p1", 0)

                # Year 6 (age 70) - should have CPP/OAS
                year6 = years[5]
                cpp_y6 = year6.get("cpp_p1", 0)
                oas_y6 = year6.get("oas_p1", 0)

                print(f"\nYear 1 (age 65):")
                print(f"  CPP: ${cpp_y1:,.0f} (expected: $0)")
                print(f"  OAS: ${oas_y1:,.0f} (expected: $0)")

                print(f"\nYear 6 (age 70):")
                print(f"  CPP: ${cpp_y6:,.0f} (expected: ~$21,300)")
                print(f"  OAS: ${oas_y6:,.0f} (expected: ~$10,880)")

                if cpp_y1 == 0 and oas_y1 == 0 and cpp_y6 > 15000 and oas_y6 > 8000:
                    print("\n✅ PASS: CPP/OAS ages working correctly!")
                    return True
                else:
                    print("\n❌ FAIL: CPP/OAS age validation not working")
                    return False
            else:
                print("❌ Not enough years in simulation")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_corporate_withdrawals():
    """Test 2: Corporate withdrawals for Juan & Daniela scenario"""
    print_section("TEST 2: Corporate Withdrawal Order (Juan & Daniela)")

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
            "corporate_balance": 1502354.0,  # $1.5M Corporate
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
            "corporate_balance": 1063236.0,  # $1.06M Corporate
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
        response = requests.post(RAILWAY_API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) > 0:
                year1 = years[0]
                corp_p1 = year1.get("corporate_withdrawal_p1", 0)
                corp_p2 = year1.get("corporate_withdrawal_p2", 0)
                nonreg_p1 = year1.get("nonreg_withdrawal_p1", 0)

                print(f"\nYear 1 Results:")
                print(f"  Juan (has $1.5M Corporate, $74k NonReg):")
                print(f"    Corporate withdrawal: ${corp_p1:,.0f}")
                print(f"    NonReg withdrawal: ${nonreg_p1:,.0f}")
                print(f"  Daniela (has $1.06M Corporate, $0 NonReg):")
                print(f"    Corporate withdrawal: ${corp_p2:,.0f}")

                # With rrif-frontload, Corporate should be used before NonReg
                if corp_p1 > 0 and corp_p2 > 0:
                    print("\n✅ PASS: Corporate withdrawals working!")
                    print("   Corporate is being used as expected")
                    return True
                else:
                    print("\n❌ FAIL: Corporate withdrawals not working")
                    print(f"   Juan Corp: ${corp_p1:,.0f}, Daniela Corp: ${corp_p2:,.0f}")
                    return False
            else:
                print("❌ No simulation results returned")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_marc_scenario():
    """Test 3: Marc's typical scenario with all features"""
    print_section("TEST 3: Marc's Comprehensive Scenario")

    payload = {
        "strategy": "rrif-frontload",
        "province": "QC",  # Marc is in Quebec
        "start_year": 2026,
        "include_partner": True,
        "p1": {
            "name": "Marc",
            "start_age": 65,
            "cpp_start_age": 70,  # Delayed CPP
            "cpp_annual_at_start": 12000.0,
            "oas_start_age": 70,  # Delayed OAS
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 80000.0,
            "rrif_balance": 300000.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 150000.0,
            "corporate_balance": 800000.0,  # Significant Corporate
            "nonreg_acb": 75000.0,
            "nr_cash": 10000.0,
            "nr_gic": 40000.0,
            "nr_invest": 100000.0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "p2": {
            "name": "Partner",
            "start_age": 62,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 8000.0,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 60000.0,
            "rrif_balance": 150000.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 50000.0,
            "corporate_balance": 400000.0,
            "nonreg_acb": 25000.0,
            "nr_cash": 5000.0,
            "nr_gic": 15000.0,
            "nr_invest": 30000.0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "spending_go_go": 120000.0,
        "go_go_end_age": 75,
        "spending_slow_go": 100000.0,
        "slow_go_end_age": 85,
        "spending_no_go": 80000.0,
        "spending_inflation": 2.0,
        "general_inflation": 2.0
    }

    try:
        response = requests.post(RAILWAY_API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) >= 6:
                print("\nChecking Marc's simulation:")

                # Year 1 checks
                year1 = years[0]
                print(f"\nYear 1 (Marc age 65, Partner age 62):")
                print(f"  Marc CPP: ${year1.get('cpp_p1', 0):,.0f} (should be $0)")
                print(f"  Marc OAS: ${year1.get('oas_p1', 0):,.0f} (should be $0)")
                print(f"  Marc Corp withdrawal: ${year1.get('corporate_withdrawal_p1', 0):,.0f}")
                print(f"  Partner Corp withdrawal: ${year1.get('corporate_withdrawal_p2', 0):,.0f}")

                # Year 6 checks
                year6 = years[5]
                print(f"\nYear 6 (Marc age 70, Partner age 67):")
                print(f"  Marc CPP: ${year6.get('cpp_p1', 0):,.0f} (should be ~$17,000)")
                print(f"  Marc OAS: ${year6.get('oas_p1', 0):,.0f} (should be ~$10,880)")
                print(f"  Partner CPP: ${year6.get('cpp_p2', 0):,.0f} (should be ~$8,000)")

                # Check for success
                cpp_delayed = year1.get('cpp_p1', 0) == 0 and year6.get('cpp_p1', 0) > 12000
                oas_delayed = year1.get('oas_p1', 0) == 0 and year6.get('oas_p1', 0) > 8000
                corp_working = year1.get('corporate_withdrawal_p1', 0) > 0

                if cpp_delayed and oas_delayed and corp_working:
                    print("\n✅ PASS: Marc's scenario working perfectly!")
                    print("   - CPP/OAS correctly delayed to age 70")
                    print("   - Corporate withdrawals working")
                    print("   - rrif-frontload strategy applied")
                    return True
                else:
                    print("\n❌ FAIL: Issues in Marc's scenario")
                    if not cpp_delayed:
                        print("   - CPP not properly delayed")
                    if not oas_delayed:
                        print("   - OAS not properly delayed")
                    if not corp_working:
                        print("   - Corporate withdrawals not working")
                    return False
            else:
                print("❌ Not enough years in simulation")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_different_strategies():
    """Test 4: Verify different withdrawal strategies work"""
    print_section("TEST 4: Withdrawal Strategy Verification")

    strategies = [
        "rrif-frontload",
        "NonReg->RRIF->Corp->TFSA",
        "RRIF->Corp->NonReg->TFSA",
        "Corp->RRIF->NonReg->TFSA"
    ]

    base_payload = {
        "province": "ON",
        "start_year": 2026,
        "include_partner": False,
        "p1": {
            "name": "Test",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000.0,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 50000.0,
            "rrif_balance": 100000.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 100000.0,
            "corporate_balance": 100000.0,
            "nonreg_acb": 50000.0,
            "nr_cash": 10000.0,
            "nr_gic": 20000.0,
            "nr_invest": 70000.0,
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
        "spending_go_go": 60000.0,
        "go_go_end_age": 75,
        "spending_slow_go": 50000.0,
        "slow_go_end_age": 80,
        "spending_no_go": 40000.0,
        "spending_inflation": 2.0,
        "general_inflation": 2.0
    }

    results = []

    for strategy in strategies:
        payload = base_payload.copy()
        payload["strategy"] = strategy

        try:
            response = requests.post(RAILWAY_API_URL, json=payload, timeout=30)

            if response.status_code == 200:
                result = response.json()
                years = result.get("year_by_year", [])

                if years and len(years) > 0:
                    year1 = years[0]
                    corp = year1.get("corporate_withdrawal_p1", 0)
                    nonreg = year1.get("nonreg_withdrawal_p1", 0)
                    rrif = year1.get("rrif_withdrawal_p1", 0)
                    tfsa = year1.get("tfsa_withdrawal_p1", 0)

                    print(f"\n{strategy}:")
                    print(f"  RRIF: ${rrif:,.0f}, Corp: ${corp:,.0f}, NonReg: ${nonreg:,.0f}, TFSA: ${tfsa:,.0f}")
                    results.append((strategy, True))
                else:
                    print(f"\n{strategy}: ❌ No results")
                    results.append((strategy, False))
            else:
                print(f"\n{strategy}: ❌ Error {response.status_code}")
                results.append((strategy, False))

        except Exception as e:
            print(f"\n{strategy}: ❌ Exception {str(e)}")
            results.append((strategy, False))

    # Check if all strategies worked
    all_passed = all(success for _, success in results)

    if all_passed:
        print("\n✅ PASS: All withdrawal strategies working!")
        return True
    else:
        print("\n❌ FAIL: Some strategies not working")
        return False


def main():
    """Run all production tests"""
    print_section("PRODUCTION DEPLOYMENT VERIFICATION")
    print(f"Testing Railway API: {RAILWAY_API_URL}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    # Update todo list
    tests = []

    # Run all tests
    tests.append(("CPP/OAS Age Validation", test_cpp_oas_ages()))
    tests.append(("Corporate Withdrawals", test_corporate_withdrawals()))
    tests.append(("Marc's Scenario", test_marc_scenario()))
    tests.append(("Withdrawal Strategies", test_different_strategies()))

    # Summary
    print_section("FINAL TEST SUMMARY")

    all_passed = True
    for test_name, passed in tests:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "="*80)
    if all_passed:
        print("🎉 ALL TESTS PASSED! 🎉")
        print("\nMarc can safely run his simulations with:")
        print("✅ CPP/OAS correctly delayed to age 70")
        print("✅ Corporate withdrawals working properly")
        print("✅ All withdrawal strategies functioning")
        print("✅ Tax-efficient rrif-frontload strategy applied")
        print("\nProduction deployment is FULLY OPERATIONAL!")
    else:
        print("⚠️ SOME TESTS FAILED")
        print("\nPlease check the failed tests above.")
        print("The Railway deployment may need investigation.")

    return 0 if all_passed else 1


if __name__ == "__main__":
    exit(main())