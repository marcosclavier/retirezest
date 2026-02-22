#!/usr/bin/env python3
"""
Test to reproduce the RRIF frontload strategy bug.
Based on the screenshot showing Age 65, RRIF=$338k, Pension=$50k, Spending=$90k
Expected: 15% RRIF withdrawal (~$50k)
Actual: $28k RRIF withdrawal (GAP)
"""

import requests
import json

# API endpoint
API_URL = "http://localhost:8000/api/run-simulation"

# Test payload matching the screenshot scenario
payload = {
    "p1": {
        "name": "Person 1",
        "start_age": 65,
        "end_age": 75,  # Test through age 75
        "cpp_start_age": 70,  # CPP starts at 70
        "oas_start_age": 70,  # OAS starts at 70
        "cpp_amount": 12502,
        "oas_amount": 8904,
        "tfsa_balance": 52500,
        "rrsp_balance": 0,
        "rrif_balance": 338100,
        "nonreg_balance": 154950,
        "nonreg_acb": 154950,  # Full ACB = no capital gains
        "corporate_balance": 0,
        "pension_incomes": [
            {
                "name": "Employer Pension",
                "amount": 50000,
                "start_age": 65,
                "indexed_to_inflation": True
            }
        ],
        "other_incomes": []
    },
    "p2": {
        "name": "",
        "is_retired": False
    },
    "hh": {
        "province": "ON",
        "start_year": 2025,
        "spending_target": 90000,
        "strategy": "rrif-frontload",  # The strategy being tested
        "contribution_start_year": 2024,
        "inflation_general": 2.0,
        "inflation_cpp": 2.0,
        "inflation_oas": 2.0,
        "return_tfsa": 5.0,
        "return_rrsp": 5.0,
        "return_rrif": 5.0,
        "return_nonreg": 5.0,
        "return_corp": 5.0,
        "nonreg_interest_pct": 25.0,
        "nonreg_elig_div_pct": 25.0,
        "nonreg_nonelig_div_pct": 0.0,
        "nonreg_capg_dist_pct": 50.0
    }
}

def main():
    print("=" * 80)
    print("RRIF FRONTLOAD STRATEGY BUG TEST")
    print("=" * 80)
    print("\nScenario:")
    print(f"  Age: 65 (OAS starts at 70)")
    print(f"  RRIF Balance: ${payload['p1']['rrif_balance']:,}")
    print(f"  NonReg Balance: ${payload['p1']['nonreg_balance']:,}")
    print(f"  TFSA Balance: ${payload['p1']['tfsa_balance']:,}")
    print(f"  Pension: ${payload['p1']['pension_incomes'][0]['amount']:,}")
    print(f"  Spending Target: ${payload['hh']['spending_target']:,}")
    print(f"  Strategy: {payload['hh']['strategy']}")
    print("\nExpected Behavior:")
    print(f"  RRIF withdrawal = 15% of ${payload['p1']['rrif_balance']:,} = ${payload['p1']['rrif_balance'] * 0.15:,.0f}")
    print(f"  (Should withdraw 15% BEFORE OAS starts to reduce RRIF balance)")
    print("\nSending request to API...")
    print("-" * 80)

    try:
        response = requests.post(API_URL, json=payload, timeout=120)

        if response.status_code != 200:
            print(f"❌ ERROR: API returned status {response.status_code}")
            print(f"Response: {response.text}")
            return

        data = response.json()

        # Check year 2025 (age 65)
        year_2025 = next((y for y in data.get('years', []) if y['year'] == 2025), None)

        if not year_2025:
            print("❌ ERROR: Year 2025 not found in response")
            return

        print("\nRESULTS FOR YEAR 2025 (Age 65, BEFORE OAS):")
        print("=" * 80)

        rrif_withdrawal = year_2025.get('total_withdrawals', {}).get('rrif', 0)
        rrif_start_balance = year_2025.get('start_balances', {}).get('rrif', payload['p1']['rrif_balance'])
        expected_withdrawal = rrif_start_balance * 0.15

        print(f"  RRIF Start Balance: ${rrif_start_balance:,.0f}")
        print(f"  Expected 15% Withdrawal: ${expected_withdrawal:,.0f}")
        print(f"  Actual RRIF Withdrawal: ${rrif_withdrawal:,.0f}")
        print(f"  Difference: ${rrif_withdrawal - expected_withdrawal:,.0f}")

        if abs(rrif_withdrawal - expected_withdrawal) / expected_withdrawal > 0.10:  # >10% difference
            print(f"\n❌ BUG CONFIRMED: RRIF withdrawal is {((rrif_withdrawal / expected_withdrawal - 1) * 100):+.1f}% off expected")
            print(f"\n  The strategy should withdraw 15% of RRIF to reduce balance before OAS,")
            print(f"  but it's only withdrawing ${rrif_withdrawal:,.0f} instead of ${expected_withdrawal:,.0f}")
        else:
            print(f"\n✅ WORKING: RRIF withdrawal matches expected 15% frontload")

        # Show other relevant data
        print(f"\n  Other Withdrawals:")
        print(f"    NonReg: ${year_2025.get('total_withdrawals', {}).get('nonreg', 0):,.0f}")
        print(f"    TFSA: ${year_2025.get('total_withdrawals', {}).get('tfsa', 0):,.0f}")
        print(f"    Corp: ${year_2025.get('total_withdrawals', {}).get('corp', 0):,.0f}")

        print(f"\n  Income:")
        print(f"    CPP: ${year_2025.get('cpp', 0):,.0f} (starts at 70)")
        print(f"    OAS: ${year_2025.get('oas', 0):,.0f} (starts at 70)")
        print(f"    NonReg Passive: ${year_2025.get('total_withdrawals', {}).get('nonreg_passive', 0):,.0f}")
        print(f"    Tax Paid: ${year_2025.get('tax_paid', 0):,.0f}")

        print(f"\n  Status: {year_2025.get('status', 'Unknown')}")

        if year_2025.get('status') == 'Gap':
            print(f"  ⚠️  GAP detected - withdrawals insufficient to meet spending target!")

        print("\n" + "=" * 80)
        print("Check the Python API logs above for detailed DEBUG output")
        print("=" * 80)

    except requests.exceptions.Timeout:
        print("❌ ERROR: Request timed out")
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Could not connect to API. Is the Python backend running?")
        print("Start it with: cd python-api && uvicorn api.main:app --reload --port 8000")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

if __name__ == "__main__":
    main()
