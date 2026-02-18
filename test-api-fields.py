#!/usr/bin/env python3
"""
Quick test to see what fields the API is actually returning
"""

import requests
import json

API_URL = "http://localhost:8000/api/run-simulation"

test_data = {
    "p1": {
        "name": "TestUser",
        "is_retired": True,
        "retirement_age": 65,
        "start_age": 70,
        "life_expectancy": 85,
        "rrsp_balance": 0,
        "rrif_balance": 100000,
        "tfsa_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 0,
        "cpp_start_age": 65,
        "cpp_amount": 8000,
        "oas_start_age": 65,
        "oas_amount": 7000,
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
    "household_is_couple": False,
    "withdrawal_strategy": "RRIF-Frontload (15%/8%)",
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

print("Testing API field response...")
response = requests.post(API_URL, json=test_data, timeout=30)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
else:
    result = response.json()
    year_by_year = result.get("year_by_year", [])

    if year_by_year and len(year_by_year) > 0:
        first_year = year_by_year[0]

        print("\n📋 ALL FIELDS IN FIRST YEAR:")
        print("-" * 50)

        # Sort fields alphabetically for easier reading
        for field in sorted(first_year.keys()):
            value = first_year[field]
            # Truncate long values for readability
            if isinstance(value, (int, float, bool)):
                print(f"  {field}: {value}")
            else:
                print(f"  {field}: {str(value)[:50]}...")

        print("\n🔍 RRIF-RELATED FIELDS:")
        print("-" * 50)
        rrif_fields = [k for k in first_year.keys() if 'rrif' in k.lower()]
        if rrif_fields:
            for field in sorted(rrif_fields):
                print(f"  {field}: {first_year[field]}")
        else:
            print("  No RRIF-related fields found!")

        print("\n🎯 FRONTLOAD INDICATOR FIELDS:")
        print("-" * 50)
        frontload_fields = [k for k in first_year.keys() if 'frontload' in k.lower()]
        if frontload_fields:
            for field in sorted(frontload_fields):
                print(f"  {field}: {first_year[field]}")
        else:
            print("  No frontload indicator fields found!")