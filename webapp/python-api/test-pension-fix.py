#!/usr/bin/env python3
import requests
import json

# Test payload with Rafael's $100,000 pension
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
    "general_inflation": 2,
    "tfsa_contribution_each": 0,
    "early_rrif_withdrawal_end_age": 70
}

print("Testing Python API directly at http://localhost:8000/api/run-simulation")
print("Sending Rafael with $100,000 pension...\n")

try:
    response = requests.post(
        "http://localhost:8000/api/run-simulation",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        data = response.json()

        # Check year 2033 (first year)
        if data.get("year_by_year") and len(data["year_by_year"]) > 0:
            year_2033 = data["year_by_year"][0]
            pension_value = year_2033.get("employer_pension_p1", 0)
            health_score = data.get("summary", {}).get("health_score", "N/A")

            print(f"✅ Response received from Python API")
            print(f"📊 Year 2033 employer_pension_p1: ${pension_value:,.0f}")
            print(f"📊 Health Score: {health_score}/100")

            if pension_value == 100000:
                print("✅ SUCCESS: Python API returns correct pension value!")
            elif pension_value == 0:
                print("❌ FAIL: Python API still returns 0 for pension")
            else:
                print(f"⚠️ Unexpected pension value: ${pension_value:,.0f}")

            # Also check RRIF withdrawal amount
            rrif_withdrawal = year_2033.get("rrif_withdrawal_p1", 0)
            print(f"\n💰 RRIF Withdrawal in 2033: ${rrif_withdrawal:,.0f}")
            if rrif_withdrawal > 50000:
                print("⚠️ RRIF withdrawal seems high (should be minimal with $100k pension)")
        else:
            print("❌ No year_by_year data in response")
    else:
        print(f"❌ API returned error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Error calling API: {e}")