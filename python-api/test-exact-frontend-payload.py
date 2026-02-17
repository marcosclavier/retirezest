#!/usr/bin/env python3
"""Test with exact payload structure that frontend sends"""
import requests
import json

# Exact payload structure from Next.js frontend
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
        "corporate_balance": 0
    },
    "p2": {
        "name": "",
        "start_age": 60,
        "birth_year": 1960,
        "rrsp_balance": 0,
        "tfsa_balance": 0,
        "nonreg_balance": 0,
        "rrif_balance": 0,
        "corporate_balance": 0,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 0,
        "oas_start_age": 65,
        "oas_annual_at_start": 0,
        "avg_career_income": 0,
        "years_of_cpp": 0,
        "years_in_canada": 0,
        "pension_income": 0,
        "other_income": 0,
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
    "tfsa_contribution_each": 0,  # Frontend sets this to 0
    "early_rrif_withdrawal_end_age": 70
}

print("=" * 70)
print("TESTING WITH EXACT FRONTEND PAYLOAD STRUCTURE")
print("=" * 70)
print("\n📋 Test Details:")
print("- Rafael starts at age 67 in 2033")
print("- Private Pension: $100,000/year starting at age 67")
print("- RRIF balance: $350,000")
print("- Strategy: RRIF-frontload")
print("- Spending: $60,000/year (inflation adjusted)")

print("\n🔄 Sending request to Python API directly...")
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
            print(f"  💼 Pension (employer_pension_p1): ${pension_amount:,.2f}", end="")
            if pension_amount == 100000:
                print(" ✅ CORRECT!")
            elif pension_amount == 0:
                print(" ❌ STILL ZERO - Backend not returning pension")
            else:
                print(f" ⚠️ Unexpected value")

            print(f"  🍁 CPP: ${year_2033.get('cpp_p1', 0):,.2f}")
            print(f"  🍁 OAS: ${year_2033.get('oas_p1', 0):,.2f}")
            print(f"  📈 RRIF Withdrawal: ${year_2033.get('rrif_withdrawal_p1', 0):,.2f}")
            print(f"  💰 Total Income: ${year_2033.get('total_income_p1', 0):,.2f}")

            # Check health score
            print(f"\n🏥 Health Score: {data.get('summary', {}).get('health_score', 0)}/100")

            # Check for pension in any year
            years_with_pension = [y for y in data["year_by_year"] if y.get('employer_pension_p1', 0) > 0]
            print(f"\n📊 Years with pension income: {len(years_with_pension)}/{len(data['year_by_year'])}")

            if len(years_with_pension) == 0:
                print("❌ NO PENSION DATA IN ANY YEAR OF RESPONSE")
                # Check raw response for debugging
                print("\n🔍 Checking first 3 years of raw data:")
                for i, year in enumerate(data["year_by_year"][:3]):
                    print(f"  Year {year.get('year', 'N/A')}: employer_pension_p1 = {year.get('employer_pension_p1', 'NOT FOUND')}")

            # Save response for analysis
            with open('frontend-payload-test-response.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("\n📝 Full response saved to frontend-payload-test-response.json")

        else:
            print("\n❌ No year_by_year data in response")

    else:
        print(f"\n❌ Error {response.status_code}: {response.text[:500]}")

except Exception as e:
    print(f"\n❌ Request failed: {e}")
    print("Make sure the Python backend is running on port 8000")

print("\n" + "==" * 70)
print("TEST COMPLETE")
print("=" * 70)