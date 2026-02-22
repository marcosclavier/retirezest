#!/usr/bin/env python3
"""
Test Corporate-Optimized strategy withdrawal order
Should be: Corporate → RRIF → NonReg → TFSA
"""

import requests
import json
import time

def test_corporate_optimized():
    """Test that Corporate-Optimized uses correct withdrawal order"""

    print("=" * 80)
    print("CORPORATE-OPTIMIZED STRATEGY TEST")
    print("=" * 80)
    print("\nExpected order: Corporate → RRIF → NonReg → TFSA")
    print("-" * 80)

    # Wait for API to be ready
    time.sleep(3)

    # Test payload with all asset types
    payload = {
        "p1": {
            "name": "Test",
            "start_age": 65,
            "rrif_balance": 200000,
            "tfsa_balance": 100000,
            "nr_cash": 50000,
            "nr_gic": 50000,
            "nr_invest": 100000,  # Total NonReg: 200000
            "corp_cash_bucket": 100000,
            "corp_gic_bucket": 100000,
            "corp_invest_bucket": 300000,  # Total Corp: 500000
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
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
        "strategy": "corporate-optimized",  # Using Corporate-Optimized
        "spending_go_go": 150000,  # High spending to force withdrawals
        "spending_slow_go": 120000,
        "slow_go_end_age": 85,
        "spending_no_go": 100000,
        "go_go_end_age": 75,
        "spending_inflation": 2,
        "general_inflation": 2,
        "tfsa_contribution_each": 0
    }

    try:
        response = requests.post(
            "http://localhost:8000/api/run-simulation",
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()

            # Check first year withdrawals
            year_data = None
            for year in data.get('five_year_plan', []):
                if year['age_p1'] == 65:
                    year_data = year
                    break

            if year_data:
                print("\n📊 WITHDRAWAL ANALYSIS (Age 65):")
                print("-" * 40)

                # Get withdrawal amounts
                corp_withdrawal = year_data.get('corporate_withdrawal_p1', 0)
                rrif_withdrawal = year_data.get('rrif_withdrawal_p1', 0)
                nonreg_withdrawal = year_data.get('nonreg_withdrawal_p1', 0)
                tfsa_withdrawal = year_data.get('tfsa_withdrawal_p1', 0)

                print(f"Corporate: ${corp_withdrawal:,.2f}")
                print(f"RRIF: ${rrif_withdrawal:,.2f}")
                print(f"NonReg: ${nonreg_withdrawal:,.2f}")
                print(f"TFSA: ${tfsa_withdrawal:,.2f}")

                # Verify order
                print("\n✅ VERIFICATION:")
                errors = []

                # Corporate should be withdrawn first (highest amount unless depleted)
                if corp_withdrawal == 0 and (rrif_withdrawal > 0 or nonreg_withdrawal > 0 or tfsa_withdrawal > 0):
                    # Check if corporate was depleted
                    corp_balance = year_data.get('corporate_p1', 0)
                    if corp_balance > 0:
                        errors.append("❌ Corporate not withdrawn first despite having balance")

                # NonReg should NOT be withdrawn before Corporate (unless Corp is depleted)
                if nonreg_withdrawal > 0 and corp_withdrawal == 0:
                    corp_balance = year_data.get('corporate_p1', 0)
                    if corp_balance > 0:
                        errors.append("❌ NonReg withdrawn before Corporate")

                # TFSA should be last (only if everything else is depleted)
                if tfsa_withdrawal > 0:
                    corp_balance = year_data.get('corporate_p1', 0)
                    rrif_balance = year_data.get('rrif_p1', 0)
                    nonreg_balance = year_data.get('nonreg_p1', 0)
                    if corp_balance > 0 or rrif_balance > 0 or nonreg_balance > 0:
                        errors.append("❌ TFSA withdrawn before other accounts depleted")

                if errors:
                    print("ERRORS FOUND:")
                    for error in errors:
                        print(f"  {error}")
                else:
                    print("✅ Withdrawal order appears correct!")
                    print("   Corporate is being withdrawn first")
                    print("   NonReg is NOT being withdrawn before Corporate")

                # Show balances
                print("\n💰 END BALANCES:")
                print(f"Corporate: ${year_data.get('corporate_p1', 0):,.2f}")
                print(f"RRIF: ${year_data.get('rrif_p1', 0):,.2f}")
                print(f"NonReg: ${year_data.get('nonreg_p1', 0):,.2f}")
                print(f"TFSA: ${year_data.get('tfsa_p1', 0):,.2f}")

            else:
                print("❌ ERROR: Could not find year data")

        else:
            print(f"❌ ERROR: API returned status {response.status_code}")
            print(response.text[:500])

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_corporate_optimized()