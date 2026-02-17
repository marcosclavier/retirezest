#!/usr/bin/env python3
"""
Check what's actually in the API response
"""
import requests
import json

payload = {
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
        "corporate_balance": 0,
    },
    "p2": {
        "name": "",
        "start_age": 60,
        "pension_incomes": [],
        "other_incomes": [],
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
    "general_inflation": 2,
}

response = requests.post(
    "http://localhost:8000/api/run-simulation",
    json=payload
)

if response.status_code == 200:
    data = response.json()

    # Check five_year_plan
    if "five_year_plan" in data and data["five_year_plan"]:
        print("✅ five_year_plan exists with", len(data["five_year_plan"]), "years")
        year_2033 = data["five_year_plan"][0]
        print(f"Year 2033 data keys: {list(year_2033.keys())}")
        if "employer_pension_p1" in year_2033:
            print(f"✅ employer_pension_p1 = ${year_2033['employer_pension_p1']:,.2f}")
        else:
            print("❌ employer_pension_p1 NOT FOUND in five_year_plan")
            print("Available fields:", [k for k in year_2033.keys() if 'pension' in k.lower()])

    # Check year_by_year
    if "year_by_year" in data and data["year_by_year"]:
        print("\n✅ year_by_year exists with", len(data["year_by_year"]), "years")
        year_2033 = next((y for y in data["year_by_year"] if y.get("year") == 2033), None)
        if year_2033:
            if "employer_pension_p1" in year_2033:
                print(f"✅ Year 2033 employer_pension_p1 = ${year_2033['employer_pension_p1']:,.2f}")
            else:
                print("❌ employer_pension_p1 NOT FOUND in year_by_year")
                print("Available pension fields:", [k for k in year_2033.keys() if 'pension' in k.lower()])
else:
    print(f"❌ Error: {response.status_code}")