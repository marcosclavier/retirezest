#!/usr/bin/env python3
"""
Fixed test for Corporate-Optimized strategy
Ensures we need withdrawals beyond CPP/OAS
"""

import requests
import json

def test_corporate_fixed():
    """Test Corporate-Optimized with guaranteed withdrawal need"""

    print("=" * 80)
    print("CORPORATE-OPTIMIZED FIXED TEST")
    print("=" * 80)

    # Test with high spending that requires withdrawals
    payload = {
        "p1": {
            "name": "Test",
            "start_age": 65,
            "rrif_balance": 100000,
            "tfsa_balance": 50000,
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
        "end_age": 70,
        "strategy": "corporate-optimized",
        # HIGH SPENDING to ensure withdrawals are needed
        "spending_go_go": 80000,  # $80k spending ensures we need ~$62k withdrawals after CPP/OAS
        "spending_slow_go": 70000,
        "slow_go_end_age": 85,
        "spending_no_go": 60000,
        "go_go_end_age": 75,
        "spending_inflation": 2,
        "general_inflation": 2,
        "tfsa_contribution_each": 0
    }

    print("\n📊 TEST SETUP:")
    print(f"Corporate: $200,000 (should withdraw first)")
    print(f"RRIF: $100,000")
    print(f"NonReg: $100,000")
    print(f"TFSA: $50,000")
    print(f"\nSpending: $80,000/year")
    print(f"CPP+OAS: $18,000/year")
    print(f"Expected withdrawal need: ~$62,000/year")
    print(f"Strategy: corporate-optimized")
    print(f"Expected order: Corporate → RRIF → NonReg → TFSA")
    print("-" * 80)

    try:
        response = requests.post(
            "http://localhost:8000/api/run-simulation",
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()

            # Check first year withdrawals
            if data.get('five_year_plan'):
                first_year = data['five_year_plan'][0]

                print("\n✅ FIRST YEAR RESULTS (Age 65):")
                print("-" * 40)

                corp_wd = first_year.get('corp_withdrawal_p1', 0)
                rrif_wd = first_year.get('rrif_withdrawal_p1', 0)
                nonreg_wd = first_year.get('nonreg_withdrawal_p1', 0)
                tfsa_wd = first_year.get('tfsa_withdrawal_p1', 0)

                total_wd = corp_wd + rrif_wd + nonreg_wd + tfsa_wd

                print(f"\nWithdrawals:")
                print(f"  Corporate: ${corp_wd:,.2f} {'✅' if corp_wd > 0 else '❌'}")
                print(f"  RRIF:      ${rrif_wd:,.2f}")
                print(f"  NonReg:    ${nonreg_wd:,.2f}")
                print(f"  TFSA:      ${tfsa_wd:,.2f}")
                print(f"  TOTAL:     ${total_wd:,.2f}")

                print(f"\nEnd Balances:")
                print(f"  Corporate: ${first_year.get('corporate_p1', 0):,.2f}")
                print(f"  RRIF:      ${first_year.get('rrif_p1', 0):,.2f}")
                print(f"  NonReg:    ${first_year.get('nonreg_p1', 0):,.2f}")
                print(f"  TFSA:      ${first_year.get('tfsa_p1', 0):,.2f}")

                # Verify corporate is being used first
                print("\n" + "=" * 40)
                print("VERIFICATION:")
                if corp_wd > 0:
                    print("✅ SUCCESS: Corporate is being withdrawn from!")
                    print(f"   Amount: ${corp_wd:,.2f}")

                    # Check if it's the primary withdrawal source
                    if corp_wd > rrif_wd and corp_wd > nonreg_wd:
                        print("✅ Corporate is the primary withdrawal source")
                    else:
                        print("⚠️ Corporate is not the largest withdrawal")
                else:
                    print("❌ FAILURE: Corporate withdrawal is $0")
                    print("   This violates the Corporate-Optimized strategy")

                    # Check if corporate has balance
                    if first_year.get('corporate_p1', 0) > 0:
                        print("   ERROR: Corporate has balance but not being used!")

                # Check order violation
                if nonreg_wd > 0 and first_year.get('corporate_p1', 0) > 1000:
                    print("\n❌ ORDER VIOLATION: Withdrawing from NonReg while Corporate has balance")

        else:
            print(f"❌ ERROR: API returned status {response.status_code}")
            print(response.text[:500])

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_corporate_fixed()