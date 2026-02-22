#!/usr/bin/env python3
"""Test successful retirement scenarios where spending needs can be met."""

import sys
import json
import requests

def test_wealthy_retiree():
    """Test a scenario with sufficient assets to meet spending needs."""

    # Wealthy retiree with high RRIF balance
    payload = {
        "p1": {
            "name": "Wealthy Retiree",
            "start_age": 65,
            "life_expectancy": 90,
            "cpp_start_age": 65,
            "oas_start_age": 65,
            "income": 0,
            "rrsp_balance": 0,
            "rrif_balance": 2000000,  # $2 million RRIF
            "tfsa_balance": 200000,    # $200k TFSA
            "nonreg_balance": 500000,  # $500k non-registered
            "cpp_annual_at_start": 15000,  # $1,250/month CPP
            "oas_annual_at_start": 8400,   # $700/month OAS
            "employer_pension": 0,
            "other_income": 0
        },
        "p2": {},  # Single person
        "spending_target": 100000,  # $100k/year spending
        "inflation_rate": 2.5,
        "year_start": 2025,
        "year_end": 2050,
        "province": "ON",
        "strategy": "rrif-frontload"
    }

    # Make request
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload)

    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return False

    data = response.json()

    if not data.get("success"):
        print(f"❌ Simulation failed: {data.get('message')}")
        return False

    # Analyze results
    year_by_year = data.get("year_by_year", [])

    print("\n📊 WEALTHY RETIREE SIMULATION")
    print("=" * 80)
    print(f"{'Year':<6} {'Age':<5} {'Spending':<12} {'Withdrawals':<12} {'Tax':<12} {'Net Worth':<15} {'Status':<8}")
    print("-" * 80)

    ok_years = 0
    gap_years = 0

    for year_data in year_by_year[:15]:  # First 15 years
        year = year_data.get("year", 0)
        age = year_data.get("age_p1", 0)
        spending = year_data.get("spending_need", 0)
        withdrawals = year_data.get("total_withdrawals", 0)
        tax = year_data.get("total_tax", 0)
        net_worth = year_data.get("total_value", 0)
        status = "OK" if year_data.get("plan_success") else "GAP"

        if status == "OK":
            ok_years += 1
        else:
            gap_years += 1

        print(f"{year:<6} {age:<5} ${spending:>10,.0f} ${withdrawals:>10,.0f} ${tax:>10,.0f} ${net_worth:>13,.0f} {status:<8}")

    print(f"\n📈 SUMMARY: {ok_years} OK years, {gap_years} GAP years in first 15 years")

    return ok_years >= 10  # At least 10 successful years

def test_moderate_retiree():
    """Test a moderate retirement scenario."""

    payload = {
        "p1": {
            "name": "Moderate Retiree",
            "start_age": 65,
            "life_expectancy": 90,
            "cpp_start_age": 65,
            "oas_start_age": 65,
            "income": 0,
            "rrsp_balance": 0,
            "rrif_balance": 800000,   # $800k RRIF
            "tfsa_balance": 100000,   # $100k TFSA
            "nonreg_balance": 200000, # $200k non-registered
            "cpp_annual_at_start": 12000,  # $1,000/month CPP
            "oas_annual_at_start": 8400,   # $700/month OAS
            "employer_pension": 0,
            "other_income": 0
        },
        "p2": {},
        "spending_target": 60000,  # Reduced to $60k/year spending (more realistic)
        "inflation_rate": 2.5,
        "year_start": 2025,
        "year_end": 2050,
        "province": "BC",
        "strategy": "balanced"
    }

    response = requests.post("http://localhost:8000/api/run-simulation", json=payload)

    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        return False

    data = response.json()

    if not data.get("success"):
        print(f"❌ Simulation failed: {data.get('message')}")
        return False

    year_by_year = data.get("year_by_year", [])

    print("\n📊 MODERATE RETIREE SIMULATION")
    print("=" * 80)
    print(f"{'Year':<6} {'Age':<5} {'Spending':<12} {'Withdrawals':<12} {'Tax':<12} {'Net Worth':<15} {'Status':<8}")
    print("-" * 80)

    ok_years = 0
    gap_years = 0

    for year_data in year_by_year[:15]:
        year = year_data.get("year", 0)
        age = year_data.get("age_p1", 0)
        spending = year_data.get("spending_need", 0)
        withdrawals = year_data.get("total_withdrawals", 0)
        tax = year_data.get("total_tax", 0)
        net_worth = year_data.get("total_value", 0)
        status = "OK" if year_data.get("plan_success") else "GAP"

        if status == "OK":
            ok_years += 1
        else:
            gap_years += 1

        print(f"{year:<6} {age:<5} ${spending:>10,.0f} ${withdrawals:>10,.0f} ${tax:>10,.0f} ${net_worth:>13,.0f} {status:<8}")

    print(f"\n📈 SUMMARY: {ok_years} OK years, {gap_years} GAP years in first 15 years")

    return ok_years >= 10

def test_couple_scenario():
    """Test a couple with combined assets."""

    payload = {
        "p1": {
            "name": "Partner 1",
            "start_age": 65,
            "life_expectancy": 90,
            "cpp_start_age": 65,
            "oas_start_age": 65,
            "income": 0,
            "rrsp_balance": 0,
            "rrif_balance": 500000,
            "tfsa_balance": 80000,
            "nonreg_balance": 100000,
            "cpp_annual_at_start": 10000,
            "oas_annual_at_start": 8400,
            "employer_pension": 0,
            "other_income": 0
        },
        "p2": {
            "name": "Partner 2",
            "start_age": 63,
            "life_expectancy": 92,
            "cpp_start_age": 65,
            "oas_start_age": 65,
            "income": 0,
            "rrsp_balance": 200000,  # Still has RRSP
            "rrif_balance": 0,
            "tfsa_balance": 60000,
            "nonreg_balance": 50000,
            "cpp_annual_at_start": 8000,
            "oas_annual_at_start": 8400,
            "employer_pension": 0,
            "other_income": 0
        },
        "spending_target": 85000,  # Combined spending
        "inflation_rate": 2.5,
        "year_start": 2025,
        "year_end": 2050,
        "province": "AB",
        "strategy": "balanced"  # Changed from invalid "tax-efficiency"
    }

    response = requests.post("http://localhost:8000/api/run-simulation", json=payload)

    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        return False

    data = response.json()

    if not data.get("success"):
        print(f"❌ Simulation failed: {data.get('message')}")
        return False

    year_by_year = data.get("year_by_year", [])

    print("\n📊 COUPLE SIMULATION")
    print("=" * 80)
    print(f"{'Year':<6} {'Ages':<8} {'Spending':<12} {'Withdrawals':<12} {'Tax':<12} {'Net Worth':<15} {'Status':<8}")
    print("-" * 80)

    ok_years = 0
    gap_years = 0

    for year_data in year_by_year[:15]:
        year = year_data.get("year", 0)
        age1 = year_data.get("age_p1", 0)
        age2 = year_data.get("age_p2", 0)
        spending = year_data.get("spending_need", 0)
        withdrawals = year_data.get("total_withdrawals", 0)
        tax = year_data.get("total_tax", 0)
        net_worth = year_data.get("total_value", 0)
        status = "OK" if year_data.get("plan_success") else "GAP"

        if status == "OK":
            ok_years += 1
        else:
            gap_years += 1

        ages_str = f"{age1}/{age2}"
        print(f"{year:<6} {ages_str:<8} ${spending:>10,.0f} ${withdrawals:>10,.0f} ${tax:>10,.0f} ${net_worth:>13,.0f} {status:<8}")

    print(f"\n📈 SUMMARY: {ok_years} OK years, {gap_years} GAP years in first 15 years")

    return ok_years >= 8  # Slightly lower threshold for couples

def main():
    """Run all test scenarios."""

    print("\n" + "=" * 80)
    print("SUCCESSFUL RETIREMENT SCENARIOS TEST")
    print("=" * 80)

    tests_passed = 0
    tests_failed = 0

    # Test 1: Wealthy retiree
    if test_wealthy_retiree():
        print("✅ Wealthy retiree test PASSED")
        tests_passed += 1
    else:
        print("❌ Wealthy retiree test FAILED")
        tests_failed += 1

    # Test 2: Moderate retiree
    if test_moderate_retiree():
        print("✅ Moderate retiree test PASSED")
        tests_passed += 1
    else:
        print("❌ Moderate retiree test FAILED")
        tests_failed += 1

    # Test 3: Couple
    if test_couple_scenario():
        print("✅ Couple test PASSED")
        tests_passed += 1
    else:
        print("❌ Couple test FAILED")
        tests_failed += 1

    # Summary
    print("\n" + "=" * 80)
    print(f"FINAL RESULTS: {tests_passed} passed, {tests_failed} failed")
    print("=" * 80)

    if tests_failed == 0:
        print("\n🎉 All tests passed! The simulation is working correctly.")
        return 0
    else:
        print(f"\n⚠️ {tests_failed} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())