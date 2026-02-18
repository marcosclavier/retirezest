#!/usr/bin/env python3
"""
Debug test for RRIF-Frontload with stderr capture
"""

import requests
import json
import sys
import subprocess

API_URL = "http://localhost:8000/api/run-simulation"

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
    "withdrawal_strategy": "RRIF-Frontload (15%/8%)",
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

print("Calling API and capturing stderr output...")
print("=" * 80)

# Write test data to temp file
with open('/tmp/test_data.json', 'w') as f:
    json.dump(test_data, f)

# Use curl with stderr redirect to capture debug output
result = subprocess.run(
    [
        'curl', '-s', '-X', 'POST',
        '-H', 'Content-Type: application/json',
        '-d', '@/tmp/test_data.json',
        API_URL
    ],
    capture_output=True,
    text=True
)

# Parse response
try:
    response = json.loads(result.stdout)
    year_by_year = response.get("year_by_year", [])

    if year_by_year:
        first_year = year_by_year[0]
        rrif_withdrawal = first_year.get("rrif_withdrawal_p1", 0)
        rrif_start = first_year.get("rrif_start_p1", 0)
        cpp = first_year.get("cpp_p1", 0)
        oas = first_year.get("oas_p1", 0)

        print(f"\n📊 FIRST YEAR RESULTS:")
        print(f"  CPP: ${cpp:,.0f}")
        print(f"  OAS: ${oas:,.0f}")
        print(f"  RRIF Start: ${rrif_start:,.0f}")
        print(f"  RRIF Withdrawal: ${rrif_withdrawal:,.0f}")

        if rrif_start > 0:
            pct = (rrif_withdrawal / rrif_start) * 100
            print(f"  Withdrawal %: {pct:.1f}%")

            if pct < 7.5:  # Less than expected 8%
                print(f"\n⚠️  ISSUE: Withdrawal is only {pct:.1f}%, expected ~8%")
            else:
                print(f"\n✅ Withdrawal percentage looks correct")

except json.JSONDecodeError:
    print("Failed to parse API response")
    print("Raw output:", result.stdout[:500])