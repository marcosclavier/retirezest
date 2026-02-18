#!/usr/bin/env python3
"""
Debug test for RRIF-Frontload withdrawals
"""

import requests
import json
import sys

API_URL = "http://localhost:8000/api/run-simulation"

def test_basic_rrif():
    """Test basic RRIF-Frontload with simple scenario"""

    test_data = {
        "p1": {
            "name": "TestUser",
            "is_retired": True,
            "retirement_age": 65,
            "start_age": 70,  # Start after OAS
            "life_expectancy": 85,
            "rrsp_balance": 0,
            "rrif_balance": 100000,  # $100k RRIF
            "tfsa_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 8000,
            "oas_start_age": 65,
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
        "strategy": "rrif-frontload",  # Use the correct API field name and value
        "spending_go_go": 30000,  # Moderate spending
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

    print("\n" + "="*80)
    print("RRIF-FRONTLOAD DEBUG TEST")
    print("="*80)
    print(f"Starting with:")
    print(f"  RRIF Balance: $100,000")
    print(f"  Age: 70 (after OAS)")
    print(f"  Strategy: rrif-frontload")
    print(f"  Expected RRIF withdrawal: ~$8,000 (8% of $100k)")

    response = requests.post(API_URL, json=test_data, timeout=30)

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return

    result = response.json()

    # Check first year - API returns data in 'year_by_year'
    year_by_year = result.get("year_by_year", [])

    if not year_by_year:
        print("❌ No year data returned!")
        print("Response keys:", list(result.keys()))
        return

    # year_by_year is a list of year records
    first_year = year_by_year[0] if isinstance(year_by_year, list) else year_by_year.get("years", [{}])[0]

    # Get all relevant fields
    fields_to_check = [
        "rrif_withdrawal_p1",
        "rrif_start_p1",
        "rrif_balance_p1",
        "rrif_frontload_exceeded_p1",
        "rrif_frontload_pct_p1",
        "total_withdrawals",
        "cpp_p1",
        "oas_p1"
    ]

    print("\nFirst Year Results:")
    for field in fields_to_check:
        value = first_year.get(field, "MISSING")
        if value == "MISSING":
            print(f"  ❌ {field}: FIELD NOT FOUND")
        else:
            print(f"  {field}: {value}")

    # Calculate actual percentage
    start_rrif = first_year.get("rrif_start_p1", 0)
    withdraw_rrif = first_year.get("rrif_withdrawal_p1", 0)

    if start_rrif > 0:
        actual_pct = (withdraw_rrif / start_rrif) * 100
        print(f"\n  Calculated: {actual_pct:.1f}% of RRIF withdrawn")

    # Test result
    if withdraw_rrif > 0:
        print(f"\n✅ RRIF withdrawal happening: ${withdraw_rrif:.0f}")
    else:
        print(f"\n❌ No RRIF withdrawal! Expected ~$8,000, got ${withdraw_rrif:.0f}")

    # Check if fields exist
    if "rrif_frontload_exceeded_p1" in first_year:
        print("✅ Indicator field 'rrif_frontload_exceeded_p1' exists")
    else:
        print("❌ Indicator field 'rrif_frontload_exceeded_p1' missing")

    if "rrif_frontload_pct_p1" in first_year:
        print("✅ Indicator field 'rrif_frontload_pct_p1' exists")
    else:
        print("❌ Indicator field 'rrif_frontload_pct_p1' missing")

if __name__ == "__main__":
    test_basic_rrif()