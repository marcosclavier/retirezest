#!/usr/bin/env python3
"""
Direct test of pension calculation in Python API
"""
import requests
import json

# Rafael's data with pension
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

print("🚀 Testing pension calculation directly...")
print(f"📊 Sending pension data: {json.dumps(payload['p1']['pension_incomes'], indent=2)}")

try:
    response = requests.post(
        "http://localhost:8000/api/run-simulation",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        result = response.json()
        print("\n✅ Simulation completed successfully!")

        # Check 5-year plan
        if "five_year_plan" in result and result["five_year_plan"]:
            print("\n📅 5-Year Plan Pension Values:")
            for year in result["five_year_plan"][:5]:
                pension = year.get("employer_pension_p1", 0)
                print(f"  Year {year['year']} (Age {year['age_p1']}): Pension = ${pension:,.2f}")

        # Check year-by-year for age 67 (2033)
        if "year_by_year" in result:
            print("\n📊 Year-by-year Pension Values at Age 67+:")
            for year in result["year_by_year"]:
                if year["age_p1"] >= 67:
                    pension = year.get("employer_pension_p1", 0)
                    print(f"  Year {year['year']} (Age {year['age_p1']}): Pension = ${pension:,.2f}")
                    if year["age_p1"] > 70:
                        break
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Exception: {e}")