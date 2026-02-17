#!/usr/bin/env python3
"""Test Next.js API route to see full response"""
import requests
import json

# Test payload
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

print("Testing Next.js API route...")
try:
    response = requests.post(
        "http://localhost:3001/api/simulation/run",
        json=payload,
        headers={"Cookie": "authjs.session-token=test"}
    )

    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        if "year_by_year" in data and data["year_by_year"]:
            year_2033 = data["year_by_year"][0]
            print(f"\n📊 Year {year_2033.get('year', 'N/A')} Results:")
            print(f"  Age: {year_2033.get('age_p1', 'N/A')}")
            print(f"  CPP: ${year_2033.get('cpp_p1', 0):,.2f}")
            print(f"  OAS: ${year_2033.get('oas_p1', 0):,.2f}")
            print(f"  Pension: ${year_2033.get('employer_pension_p1', 0):,.2f}")

            if year_2033.get('employer_pension_p1', 0) > 0:
                print("\n✅ SUCCESS: Pension is showing in Next.js response!")
            else:
                print("\n❌ FAIL: Pension is 0 in Next.js response")
        else:
            print("\n❌ No year_by_year data in response")
    else:
        print(f"Error: {response.text}")

except Exception as e:
    print(f"Error: {e}")