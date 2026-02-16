#!/usr/bin/env python3
"""
Test to verify Python API is receiving and processing pension data
"""
import requests
import json

# Simulate exact data structure that UI sends
ui_payload = {
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
        "rrsp_balance": 0,
        "tfsa_balance": 0,
        "nonreg_balance": 0,
        "rrif_balance": 0,
        "corporate_balance": 0,
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

print("=" * 60)
print("Testing Python API with UI-like payload")
print("=" * 60)
print(f"📤 Sending pension_incomes: {json.dumps(ui_payload['p1']['pension_incomes'], indent=2)}")

try:
    response = requests.post(
        "http://localhost:8000/api/run-simulation",
        json=ui_payload,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        result = response.json()

        # Check year 2033 (pension starts)
        year_2033 = None
        for year_data in result.get("year_by_year", []):
            if year_data.get("year") == 2033:
                year_2033 = year_data
                break

        if year_2033:
            pension = year_2033.get("employer_pension_p1", 0)
            print(f"\n📊 Year 2033 Results:")
            print(f"  Age: {year_2033.get('age_p1')}")
            print(f"  CPP: ${year_2033.get('cpp_p1', 0):,.2f}")
            print(f"  OAS: ${year_2033.get('oas_p1', 0):,.2f}")
            print(f"  Pension: ${pension:,.2f}")

            if pension > 0:
                print(f"\n✅ SUCCESS: Pension is calculating correctly!")
            else:
                print(f"\n❌ PROBLEM: Pension is 0 - API not processing pension_incomes field")
                print("\n🔍 Debugging info:")
                print(f"  - employer_pension_p1: {year_2033.get('employer_pension_p1')}")
                print(f"  - pension_income_p1: {year_2033.get('pension_income_p1')}")

                # Check if there's any field with pension in the name
                for key in year_2033.keys():
                    if 'pension' in key.lower():
                        print(f"  - {key}: {year_2033[key]}")

    else:
        print(f"❌ API Error: {response.status_code}")
        print(response.text[:500])

except Exception as e:
    print(f"❌ Exception: {e}")

print("\n" + "=" * 60)
print("If pension is 0, the issue is in the Python API")
print("Check that api/models/requests.py has pension_incomes field")
print("=" * 60)