#!/usr/bin/env python3
"""Test pension calculation fix directly with Python API"""
import requests
import json

# Test payload with $100,000 pension
payload = {
    "household_input": {
        "p1": {
            "name": "Rafael",
            "start_age": 67,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12492,
            "oas_start_age": 65,
            "oas_annual_at_start": 8904,
            "pension_incomes": [
                {
                    "name": "Pension",
                    "amount": 100000,
                    "startAge": 67,
                    "inflationIndexed": True
                }
            ],
            "other_incomes": [],
            "tfsa_balance": 0,
            "rrif_balance": 350000,
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0
        },
        "p2": {
            "name": "",
            "start_age": 60,
            "pension_incomes": [],
            "other_incomes": []
        },
        "include_partner": False,
        "province": "AB",
        "start_year": 2033,
        "end_age": 85,
        "strategy": "rrif-frontload",
        "spending_go_go": 60000,
        "go_go_end_age": 75,
        "spending_slow_go": 48000,
        "slow_go_end_age": 85,
        "spending_no_go": 42000,
        "spending_inflation": 2,
        "general_inflation": 2
    }
}

print("Testing Python API for pension calculation...")
try:
    response = requests.post(
        "http://localhost:8000/api/simulation/run",
        json=payload,
        timeout=10
    )

    if response.status_code == 200:
        data = response.json()
        if "year_by_year" in data and data["year_by_year"]:
            year_2033 = data["year_by_year"][0]
            pension_amount = year_2033.get('employer_pension_p1', 0)

            print(f"\n✅ SUCCESS: Pension is ${pension_amount:,.2f}")
            print(f"  CPP: ${year_2033.get('cpp_p1', 0):,.2f}")
            print(f"  OAS: ${year_2033.get('oas_p1', 0):,.2f}")
            print(f"  RRIF: ${year_2033.get('rrif_withdrawal_p1', 0):,.2f}")
            print(f"  Total: ${year_2033.get('total_income_p1', 0):,.2f}")

            if pension_amount == 0:
                print("\n❌ FAIL: Pension is still $0")
    else:
        print(f"Error {response.status_code}: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")