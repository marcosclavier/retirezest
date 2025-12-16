"""Quick API test to see actual response"""
import requests
import json

# Juan & Daniela data
payload = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 0,
        "oas_start_age": 65,
        "oas_annual_at_start": 0,
        "tfsa_balance": 100000,
        "rrif_balance": 150000,
        "rrsp_balance": 0,
        "nonreg_balance": 215000,
        "corporate_balance": 2000000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 0,
        "oas_start_age": 65,
        "oas_annual_at_start": 0,
        "tfsa_balance": 100000,
        "rrif_balance": 150000,
        "rrsp_balance": 0,
        "nonreg_balance": 215000,
        "corporate_balance": 2000000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "corporate-optimized",
    "spending_go_go": 200000,
    "spending_slow_go": 200000,
    "spending_no_go": 200000,
    "go_go_end_age": 75,
    "slow_go_end_age": 85
}

print("Calling API...")
response = requests.post("http://localhost:8000/api/run-simulation", json=payload)

if response.status_code == 200:
    data = response.json()
    print(f"✅ API Success: {response.status_code}")

    if data.get("year_by_year"):
        year_2025 = data["year_by_year"][0]
        print("\n" + "=" * 80)
        print("2025 DATA:")
        print("=" * 80)
        print(f"total_tax:             ${year_2025.get('total_tax', 0):,.2f}")
        print(f"total_tax_p1:          ${year_2025.get('total_tax_p1', 0):,.2f}")
        print(f"total_tax_p2:          ${year_2025.get('total_tax_p2', 0):,.2f}")
        print(f"taxable_income_p1:     ${year_2025.get('taxable_income_p1', 0):,.2f}")
        print(f"taxable_income_p2:     ${year_2025.get('taxable_income_p2', 0):,.2f}")
        print(f"corporate_withdrawal_p1: ${year_2025.get('corporate_withdrawal_p1', 0):,.2f}")
        print(f"corporate_withdrawal_p2: ${year_2025.get('corporate_withdrawal_p2', 0):,.2f}")
        print(f"rrif_withdrawal_p1:    ${year_2025.get('rrif_withdrawal_p1', 0):,.2f}")
        print(f"rrif_withdrawal_p2:    ${year_2025.get('rrif_withdrawal_p2', 0):,.2f}")
        print(f"spending_need:         ${year_2025.get('spending_need', 0):,.2f}")
        print(f"spending_met:          ${year_2025.get('spending_met', 0):,.2f}")
        print()
        print("Expected: $19,750.37")
        print(f"Actual:   ${year_2025.get('total_tax'):,.2f}")
        print()

        if abs(year_2025.get('total_tax', 0) - 19750.37) < 1:
            print("✅ CORRECT!")
        else:
            print(f"❌ WRONG! Difference: ${abs(year_2025.get('total_tax', 0) - 19750.37):,.2f}")
            print("\nDumping full year data:")
            print(json.dumps(year_2025, indent=2))
    else:
        print("❌ No year_by_year data")
else:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)
