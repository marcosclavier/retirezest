#!/usr/bin/env python3
"""
Debug test for Corporate-Optimized strategy
Print raw response to understand what's happening
"""

import requests
import json

def test_corporate_debug():
    """Debug test to see raw API response"""

    print("=" * 80)
    print("CORPORATE-OPTIMIZED DEBUG TEST")
    print("=" * 80)

    # Simple test with clear values
    payload = {
        "p1": {
            "name": "Test",
            "start_age": 65,
            "rrif_balance": 100000,      # $100k RRIF
            "tfsa_balance": 50000,        # $50k TFSA
            "nr_cash": 25000,
            "nr_gic": 25000,
            "nr_invest": 50000,           # Total NonReg: $100k
            "corp_cash_bucket": 50000,
            "corp_gic_bucket": 50000,
            "corp_invest_bucket": 100000, # Total Corp: $200k
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000,
            "pension_incomes": [],
            "other_incomes": []
        },
        "p2": {
            "name": "",
            "start_age": 65,
            "rrif_balance": 0,
            "tfsa_balance": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "include_partner": False,
        "province": "ON",
        "start_year": 2026,
        "end_age": 70,  # Minimum allowed
        "strategy": "corporate-optimized",
        "spending_go_go": 60000,  # $60k spending (need $42k after CPP/OAS)
        "spending_slow_go": 50000,
        "slow_go_end_age": 85,
        "spending_no_go": 40000,
        "go_go_end_age": 75,
        "spending_inflation": 2,
        "general_inflation": 2,
        "tfsa_contribution_each": 0
    }

    print("\n📊 INPUT SUMMARY:")
    print(f"Corporate: $200,000")
    print(f"RRIF: $100,000")
    print(f"NonReg: $100,000")
    print(f"TFSA: $50,000")
    print(f"Total Assets: $450,000")
    print(f"\nSpending: $60,000/year")
    print(f"CPP+OAS: $18,000/year")
    print(f"Net withdrawal needed: ~$42,000/year")
    print(f"Strategy: corporate-optimized")
    print("-" * 80)

    try:
        response = requests.post(
            "http://localhost:8000/api/run-simulation",
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()

            # Print raw first year data
            if data.get('five_year_plan'):
                first_year = data['five_year_plan'][0]
                print("\n📝 RAW FIRST YEAR DATA:")
                print(json.dumps(first_year, indent=2, sort_keys=True))

                print("\n🔍 KEY FIELDS ANALYSIS:")
                print(f"Strategy used: {data.get('strategy', 'NOT FOUND')}")
                print(f"Year: {first_year.get('year', 'N/A')}")
                print(f"Age: {first_year.get('age_p1', 'N/A')}")
                print("\nWithdrawals:")
                print(f"  Corporate: ${first_year.get('corporate_withdrawal_p1', 0):,.2f}")
                print(f"  RRIF: ${first_year.get('rrif_withdrawal_p1', 0):,.2f}")
                print(f"  NonReg: ${first_year.get('nonreg_withdrawal_p1', 0):,.2f}")
                print(f"  TFSA: ${first_year.get('tfsa_withdrawal_p1', 0):,.2f}")
                print("\nEnd Balances:")
                print(f"  Corporate: ${first_year.get('corporate_p1', 0):,.2f}")
                print(f"  RRIF: ${first_year.get('rrif_p1', 0):,.2f}")
                print(f"  NonReg: ${first_year.get('nonreg_p1', 0):,.2f}")
                print(f"  TFSA: ${first_year.get('tfsa_p1', 0):,.2f}")

                # Check for any withdrawal-related fields
                print("\n🔎 CHECKING ALL WITHDRAWAL FIELDS:")
                for key in first_year.keys():
                    if 'withdrawal' in key.lower() or 'withdraw' in key.lower():
                        print(f"  {key}: {first_year[key]}")

                # Check for any corporate-related fields
                print("\n🔎 CHECKING ALL CORPORATE FIELDS:")
                for key in first_year.keys():
                    if 'corp' in key.lower():
                        print(f"  {key}: {first_year[key]}")

        else:
            print(f"❌ ERROR: API returned status {response.status_code}")
            print(response.text[:500])

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_corporate_debug()