#!/usr/bin/env python3
"""
Test script to verify surplus allocation to Non-Reg accounts
"""
import requests
import json

# Test data - Rafael's scenario with surplus
test_data = {
    "person1": {
        "birthDate": "1966-01-01",
        "retirementDate": "2033-01-01",
        "rrsp_balance": 100000,
        "tfsa_balance": 1000,
        "nonreg_balance": 0,
        "tfsa_room_start": 157500,  # Properly calculated TFSA room
        "cpp_start_age": 67,
        "oas_start_age": 67,
        "employer_pension_amount": 100000,
        "employer_pension_start_age": 67,
        "spending": 70000
    },
    "person2": None,
    "simulation": {
        "years": 30,
        "inflation": 2.0,
        "nominal_return": 5.0
    }
}

# Call the API
print("Testing surplus allocation with proper TFSA room...")
print(f"TFSA Room: ${test_data['person1']['tfsa_room_start']:,}")
print(f"Expected surplus: ~$40,000/year")
print("-" * 50)

response = requests.post(
    "http://localhost:8000/api/v1/simulation/run",
    json=test_data
)

if response.status_code == 200:
    result = response.json()

    # Check year 2033 (first retirement year)
    year_2033 = next((y for y in result['years'] if y['year'] == 2033), None)

    if year_2033:
        print(f"\nYear 2033 Results:")
        print(f"Total Inflows: ${year_2033.get('total_inflows', 0):,.0f}")
        print(f"Total Outflows: ${year_2033.get('total_outflows', 0):,.0f}")
        print(f"Net Cash Flow: ${year_2033.get('net_cashflow', 0):,.0f}")
        print(f"\nSurplus Reinvestment:")
        print(f"→ TFSA: ${year_2033.get('tfsa_reinvest_p1', 0):,.0f}")
        print(f"→ Non-Reg: ${year_2033.get('reinvest_nonreg_p1', 0):,.0f}")
        print(f"\nEnd Balances:")
        print(f"TFSA: ${year_2033.get('tfsa_balance_p1', 0):,.0f}")
        print(f"Non-Reg: ${year_2033.get('nonreg_balance_p1', 0):,.0f}")

        # Check if surplus was properly allocated
        surplus = year_2033.get('net_cashflow', 0)
        tfsa_reinvest = year_2033.get('tfsa_reinvest_p1', 0)
        nonreg_reinvest = year_2033.get('reinvest_nonreg_p1', 0)

        print(f"\n✓ Total surplus allocated: ${tfsa_reinvest + nonreg_reinvest:,.0f}")

        if surplus > 0 and (tfsa_reinvest + nonreg_reinvest) < surplus - 100:
            print(f"⚠️  Warning: Surplus of ${surplus:,.0f} but only ${tfsa_reinvest + nonreg_reinvest:,.0f} allocated!")
        else:
            print(f"✅ Surplus properly allocated!")

    else:
        print("Error: Year 2033 not found in results")
else:
    print(f"API Error: {response.status_code}")
    print(response.text)