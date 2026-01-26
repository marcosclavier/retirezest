"""
Test API simulation endpoint with realistic data to verify functionality.
This test simulates a real API request to check if the simulation works end-to-end.
"""

import requests
import json

# API endpoint
API_URL = "http://localhost:8000/api/run-simulation"

# Create realistic household data (Rafael and Lucy)
payload = {
    "p1": {
        "name": "Rafael",
        "start_age": 64,
        "tfsa_balance": 104000,
        "rrif_balance": 306000,
        "rrsp_balance": 0,
        "nonreg_balance": 183000,
        "corporate_balance": 0,
        "cpp_annual_at_start": 15918,
        "cpp_start_age": 65,
        "oas_annual_at_start": 9020,
        "oas_start_age": 65,
        # Non-reg yields (as percentages)
        "y_nr_cash_interest": 2.0,
        "y_nr_gic_interest": 3.5,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        # Non-reg allocation
        "nr_cash_pct": 10.0,
        "nr_gic_pct": 20.0,
        "nr_invest_pct": 70.0,
        # Initialize buckets
        "nr_cash": 18300,
        "nr_gic": 36600,
        "nr_invest": 128100,
        "nonreg_acb": 150000
    },
    "p2": {
        "name": "Lucy",
        "start_age": 62,
        "tfsa_balance": 114000,
        "rrif_balance": 22000,
        "rrsp_balance": 0,
        "nonreg_balance": 183000,
        "corporate_balance": 0,
        "cpp_annual_at_start": 15918,
        "cpp_start_age": 65,
        "oas_annual_at_start": 9020,
        "oas_start_age": 65,
        # Non-reg yields
        "y_nr_cash_interest": 2.0,
        "y_nr_gic_interest": 3.5,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        # Non-reg allocation
        "nr_cash_pct": 10.0,
        "nr_gic_pct": 20.0,
        "nr_invest_pct": 70.0,
        # Initialize buckets
        "nr_cash": 18300,
        "nr_gic": 36600,
        "nr_invest": 128100,
        "nonreg_acb": 150000
    },
    "province": "AB",
    "start_year": 2026,
    "end_age": 95,
    "strategy": "rrif-frontload",
    "spending_go_go": 63480,
    "go_go_end_age": 75,
    "spending_slow_go": 47670,
    "slow_go_end_age": 85,
    "spending_no_go": 38136,
    "spending_inflation": 3.0,
    "general_inflation": 2.0,
    "reinvest_nonreg_dist": False  # Distributions available for spending
}

print("=" * 80)
print("API SIMULATION ENDPOINT TEST")
print("=" * 80)
print(f"\nTesting endpoint: {API_URL}")
print(f"Strategy: {payload['strategy']}")
print(f"Rafael: Age {payload['p1']['start_age']}, RRIF=${payload['p1']['rrif_balance']:,.0f}")
print(f"Lucy: Age {payload['p2']['start_age']}, RRIF=${payload['p2']['rrif_balance']:,.0f}")
print(f"reinvest_nonreg_dist: {payload['reinvest_nonreg_dist']}")

try:
    print("\n🔄 Sending API request...")
    response = requests.post(API_URL, json=payload, timeout=30)

    print(f"\n📡 Response Status: {response.status_code}")

    if response.status_code == 200:
        print("✅ API request successful!")

        # Parse response
        data = response.json()

        # Check if we have results
        if "year_by_year" in data and data["year_by_year"] and len(data["year_by_year"]) > 0:
            print(f"\n📊 Simulation Results:")
            print(f"   Years simulated: {len(data['year_by_year'])}")

            # Show first 3 years
            print(f"\n🔍 First 3 Years:")
            print("=" * 80)
            for i in range(min(3, len(data["year_by_year"]))):
                year_data = data["year_by_year"][i]
                year = year_data.get("year", 0)

                # Withdrawals
                rrif_p1 = year_data.get("rrif_withdrawal_p1", 0)
                rrif_p2 = year_data.get("rrif_withdrawal_p2", 0)
                nonreg_p1 = year_data.get("nonreg_withdrawal_p1", 0)
                nonreg_p2 = year_data.get("nonreg_withdrawal_p2", 0)
                tfsa_p1 = year_data.get("tfsa_withdrawal_p1", 0)
                tfsa_p2 = year_data.get("tfsa_withdrawal_p2", 0)
                corp_p1 = year_data.get("corporate_withdrawal_p1", 0)
                corp_p2 = year_data.get("corporate_withdrawal_p2", 0)

                # Distributions
                nr_distributions = year_data.get("nonreg_distributions", 0)

                total_withdrawals = rrif_p1 + rrif_p2 + nonreg_p1 + nonreg_p2 + tfsa_p1 + tfsa_p2 + corp_p1 + corp_p2

                print(f"\nYear {year}:")
                print(f"  RRIF Withdrawals: ${rrif_p1 + rrif_p2:,.0f} (P1: ${rrif_p1:,.0f}, P2: ${rrif_p2:,.0f})")
                print(f"  NonReg Withdrawals: ${nonreg_p1 + nonreg_p2:,.0f} (P1: ${nonreg_p1:,.0f}, P2: ${nonreg_p2:,.0f})")
                print(f"  Corp Withdrawals: ${corp_p1 + corp_p2:,.0f} (P1: ${corp_p1:,.0f}, P2: ${corp_p2:,.0f})")
                print(f"  TFSA Withdrawals: ${tfsa_p1 + tfsa_p2:,.0f} (P1: ${tfsa_p1:,.0f}, P2: ${tfsa_p2:,.0f})")
                print(f"  NonReg Distributions: ${nr_distributions:,.0f}")
                print(f"  Total Withdrawals: ${total_withdrawals:,.0f}")

                # Check for RRIF frontload (should be 15% for age < 65)
                if i == 0:  # First year
                    expected_rrif_p1 = payload["p1"]["rrif_balance"] * 0.15
                    expected_rrif_p2 = payload["p2"]["rrif_balance"] * 0.15
                    print(f"\n  RRIF Frontload Check:")
                    print(f"    Rafael (age 64): Expected ~${expected_rrif_p1:,.0f}, Got ${rrif_p1:,.0f} {'✅' if abs(rrif_p1 - expected_rrif_p1) < 1000 else '❌'}")
                    print(f"    Lucy (age 62): Expected ~${expected_rrif_p2:,.0f}, Got ${rrif_p2:,.0f} {'✅' if abs(rrif_p2 - expected_rrif_p2) < 1000 else '❌'}")

            print("\n" + "=" * 80)
            print("✅ API SIMULATION TEST PASSED!")
            print("=" * 80)

        else:
            print("❌ No results in response!")
            print(f"Response data: {json.dumps(data, indent=2)[:500]}...")

    elif response.status_code == 422:
        print("❌ Validation error!")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

    else:
        print(f"❌ API request failed!")
        print(f"Response: {response.text[:500]}...")

except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Could not connect to API!")
    print("   Please ensure the backend is running:")
    print("   python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload")

except requests.exceptions.Timeout:
    print("\n❌ ERROR: API request timed out!")
    print("   The simulation may be taking too long to complete.")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
