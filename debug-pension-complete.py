#!/usr/bin/env python3
"""
Complete debug test for pension issue
Tests the exact payload that Next.js sends to the Python API
"""
import requests
import json

# Exact payload from Next.js (based on Rafael's profile)
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
                "name": "Private Pension",
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
        # Additional fields that might be sent
        "rental_properties": [],
        "rental_income": 0,
        "estate_value_today": 0,
        "real_estate_growth_rate": 2,
        "sell_real_estate_age": None,
        "new_home_value": 0
    },
    "p2": {
        "name": "",
        "start_age": 60,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 0,
        "oas_start_age": 65,
        "oas_annual_at_start": 0,
        "pension_incomes": [],
        "other_incomes": [],
        "tfsa_balance": 0,
        "rrif_balance": 0,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 0,
        "rental_properties": [],
        "rental_income": 0,
        "estate_value_today": 0,
        "real_estate_growth_rate": 2,
        "sell_real_estate_age": None,
        "new_home_value": 0
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
    "capital_gains_inclusion_rate": 50,
    "average_tax_rate_retirement": 25,
    "average_tax_rate_estate": 30
}

print("=" * 60)
print("Testing Python API with COMPLETE payload from Next.js")
print("=" * 60)

# Test direct Python API
response = requests.post(
    "http://localhost:8000/api/run-simulation",
    json=payload
)

if response.status_code == 200:
    data = response.json()

    # Check year_by_year
    if "year_by_year" in data and data["year_by_year"]:
        year_2033 = data["year_by_year"][0]
        print(f"\n📊 Year {year_2033.get('year', 'N/A')} Results:")
        print(f"  Age: {year_2033.get('age_p1', 'N/A')}")
        print(f"  CPP: ${year_2033.get('cpp_p1', 0):,.2f}")
        print(f"  OAS: ${year_2033.get('oas_p1', 0):,.2f}")
        print(f"  Pension: ${year_2033.get('employer_pension_p1', 0):,.2f}")

        if year_2033.get('employer_pension_p1', 0) > 0:
            print("\n✅ SUCCESS: Pension is in year_by_year!")
        else:
            print("\n❌ FAIL: Pension is 0 in year_by_year")
            print(f"Available fields: {list(year_2033.keys())}")

    # Check five_year_plan
    if "five_year_plan" in data and data["five_year_plan"]:
        year_2033_5y = data["five_year_plan"][0]
        pension_5y = year_2033_5y.get('employer_pension_p1', 0)
        print(f"\n📊 5-Year Plan Year 2033:")
        print(f"  Pension: ${pension_5y:,.2f}")

        if pension_5y > 0:
            print("✅ SUCCESS: Pension is in five_year_plan!")
        else:
            print("❌ FAIL: Pension is 0 in five_year_plan")

    # Save full response for analysis
    with open('debug-response.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("\n📁 Full response saved to debug-response.json")

else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)

print("\n" + "=" * 60)