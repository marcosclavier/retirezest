#!/usr/bin/env python3
"""Test script to verify pension_income_p1 column mapping fix"""
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
                    "name": "Rafael's Pension",
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
    "early_rrif_withdrawal_end_age": 70  # Fixed validation error
}

print("=" * 70)
print("TESTING PENSION COLUMN FIX")
print("=" * 70)
print("\n📋 Test Details:")
print("- Rafael starts at age 67 in 2033")
print("- Pension: $100,000/year starting at age 67")
print("- RRIF balance: $350,000")
print("- Strategy: RRIF-frontload")
print("- Spending: $60,000/year (inflation adjusted)")

print("\n🔄 Sending request to Python API...")
try:
    response = requests.post(
        "http://localhost:8000/api/run-simulation",
        json=payload,
        timeout=10
    )

    if response.status_code == 200:
        data = response.json()

        # Check if we have year-by-year results
        if "year_by_year" in data and data["year_by_year"]:
            year_2033 = data["year_by_year"][0]

            # Check pension field
            pension_amount = year_2033.get('employer_pension_p1', 0)

            print("\n✅ API Response Success!")
            print("\n📊 Year 2033 Income Breakdown:")
            print(f"  💼 Pension: ${pension_amount:,.2f}", end="")
            if pension_amount == 100000:
                print(" ✅ CORRECT!")
            elif pension_amount == 0:
                print(" ❌ STILL ZERO - Column mapping not working")
            else:
                print(f" ⚠️ Unexpected value")

            print(f"  🍁 CPP: ${year_2033.get('cpp_p1', 0):,.2f}")
            print(f"  🍁 OAS: ${year_2033.get('oas_p1', 0):,.2f}")
            print(f"  📈 RRIF Withdrawal: ${year_2033.get('rrif_withdrawal_p1', 0):,.2f}")
            print(f"  💰 Total Income: ${year_2033.get('total_income_p1', 0):,.2f}")

            # Check if RRIF withdrawal is reduced
            rrif_withdrawal = year_2033.get('rrif_withdrawal_p1', 0)
            print("\n📊 Withdrawal Analysis:")
            if rrif_withdrawal < 10000 and pension_amount == 100000:
                print(f"  ✅ SUCCESS: RRIF withdrawal is minimal (${rrif_withdrawal:,.2f})")
                print("  ✅ Pension is properly reducing portfolio withdrawals!")
            elif rrif_withdrawal > 40000:
                print(f"  ❌ PROBLEM: RRIF withdrawal still excessive (${rrif_withdrawal:,.2f})")
                print("  ❌ Pension not being used to reduce withdrawals")

            # Check health score
            print(f"\n🏥 Health Score: {data.get('health_score', 0)}/100")
            if data.get('health_score', 0) > 70:
                print("  ✅ Good health score!")
            else:
                print("  ❌ Low health score - indicates calculation issues")

            # Check shortfall
            shortfall = data.get('cumulative_shortfall', 0)
            if shortfall > 0:
                print(f"\n⚠️ WARNING: Plan shows ${shortfall:,.2f} shortfall")
                print("  This should be $0 with the $100k pension!")
            else:
                print("\n✅ No shortfall - plan is fully funded!")

            # Save full response for debugging
            with open('pension-fix-test-response.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("\n📝 Full response saved to pension-fix-test-response.json")

        else:
            print("\n❌ No year_by_year data in response")

    else:
        print(f"\n❌ Error {response.status_code}: {response.text[:500]}")

except Exception as e:
    print(f"\n❌ Request failed: {e}")
    print("Make sure the Python backend is running on port 8000")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)