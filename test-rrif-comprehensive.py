#!/usr/bin/env python3
"""
Comprehensive test for RRIF-Frontload strategy
Tests both before and after OAS age scenarios
"""

import requests
import json
import sys

API_URL = "http://localhost:8000/api/run-simulation"

def run_test(test_name, start_age, expected_pct, rrif_balance=100000):
    """Run a single test scenario"""

    test_data = {
        "p1": {
            "name": "TestUser",
            "is_retired": True,
            "retirement_age": 65,
            "start_age": start_age,
            "life_expectancy": 85,
            "rrsp_balance": 0,
            "rrif_balance": rrif_balance,
            "tfsa_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 8000,
            "oas_start_age": 65,  # OAS at 65
            "oas_annual_at_start": 7000,
            "gis_amount": 0,
            "yield_rrsp_growth": 0.04,
            "yield_rrif_growth": 0.04,
            "yield_tfsa_growth": 0.04,
            "yield_nonreg_growth": 0.04,
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
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
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
        "household_is_couple": False,
        "strategy": "rrif-frontload",  # Correct API field
        "spending_go_go": 30000,
        "spending_slow_go": 25000,
        "spending_no_go": 20000,
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

    response = requests.post(API_URL, json=test_data, timeout=30)

    if response.status_code != 200:
        return False, f"API Error: {response.status_code}"

    result = response.json()
    year_by_year = result.get("year_by_year", [])

    if not year_by_year:
        return False, "No year data returned"

    first_year = year_by_year[0]

    # Get values
    rrif_withdrawal = first_year.get("rrif_withdrawal_p1", 0)
    rrif_start = first_year.get("rrif_start_p1", 0)
    rrif_pct = first_year.get("rrif_frontload_pct_p1", 0)
    rrif_exceeded = first_year.get("rrif_frontload_exceeded_p1", False)

    # Calculate actual percentage
    if rrif_start > 0:
        actual_pct = (rrif_withdrawal / rrif_start) * 100
    else:
        actual_pct = 0

    # Check if it matches expected
    success = abs(actual_pct - expected_pct) < 0.5  # Allow 0.5% tolerance
    indicator_matches = abs(rrif_pct - expected_pct) < 0.5

    result_msg = f"""
    RRIF Start: ${rrif_start:,.0f}
    RRIF Withdrawal: ${rrif_withdrawal:,.0f}
    Calculated %: {actual_pct:.1f}%
    Indicator %: {rrif_pct:.1f}%
    Exceeded: {rrif_exceeded}
    Expected: {expected_pct}%
    Match: {'✅' if success else '❌'}
    Indicator Match: {'✅' if indicator_matches else '❌'}"""

    return success and indicator_matches, result_msg

# Run comprehensive tests
print("\n" + "="*80)
print("COMPREHENSIVE RRIF-FRONTLOAD TEST SUITE")
print("="*80)

tests = [
    ("Age 60 (Before OAS)", 60, 15.0),  # Should use 15% before OAS
    ("Age 64 (Before OAS)", 64, 15.0),  # Should still use 15%
    ("Age 65 (OAS Start)", 65, 8.0),    # Should switch to 8% at OAS
    ("Age 70 (After OAS)", 70, 8.0),    # Should use 8% after OAS
    ("Age 75 (After OAS)", 75, 8.0),    # Should still use 8%
]

all_passed = True

for test_name, age, expected_pct in tests:
    print(f"\n📝 Test: {test_name}")
    success, result = run_test(test_name, age, expected_pct)
    print(result)

    if not success:
        all_passed = False

# Test with larger balance
print(f"\n📝 Test: Large Balance ($500k)")
success, result = run_test("Large Balance", 70, 8.0, 500000)
print(result)
if not success:
    all_passed = False

# Final result
print("\n" + "="*80)
if all_passed:
    print("✅ ALL TESTS PASSED!")
else:
    print("❌ SOME TESTS FAILED - Review results above")
print("="*80)