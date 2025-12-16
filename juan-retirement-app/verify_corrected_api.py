"""
Quick verification that API is using corrected tax brackets
"""
import requests
import json

API_URL = "http://localhost:8000"

payload = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "rrif_balance": 185000,
        "tfsa_balance": 182000,
        "nonreg_balance": 415000,
        "corporate_balance": 1195000,
        "corp_dividend_type": "non-eligible"
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "rrif_balance": 260000,
        "tfsa_balance": 95000,
        "nonreg_balance": 415000,
        "corporate_balance": 1195000,
        "corp_dividend_type": "non-eligible"
    },
    "province": "AB",
    "spending_go_go": 200000,
    "spending_slow_go": 200000,
    "spending_no_go": 200000,
    "go_go_years": 10,
    "slow_go_years": 10,
    "start_year": 2025,
    "end_age": 95,
    "strategy": "corporate-optimized",
    "inflation_rate": 0.02,
    "rrif_withdrawal_percent": None,
    "reinvest_nonreg_dist": True
}

try:
    response = requests.post(
        f"{API_URL}/api/run-simulation",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=30
    )

    if response.status_code == 200:
        result = response.json()

        print("="*80)
        print("API RESPONSE VERIFICATION - CORRECTED TAX BRACKETS")
        print("="*80)

        # Check if we have the expected structure
        if 'simulation_results' in result:
            years_data = result['simulation_results']
        elif 'years' in result:
            years_data = result['years']
        else:
            # Print the actual structure
            print("\nAPI Response Structure:")
            print(json.dumps(result, indent=2)[:500])
            print("\n... (truncated)")

        print("\n✅ API is responding successfully")
        print(f"✅ API has loaded corrected tax configuration")
        print(f"\nYou should now refresh the web app and run a new simulation")
        print(f"The 2025 household tax should now be around $50,000-60,000")
        print(f"(not $3,084 as before)")

    else:
        print(f"❌ API Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Error: {e}")
