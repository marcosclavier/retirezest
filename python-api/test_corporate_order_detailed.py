#!/usr/bin/env python3
"""
Detailed test for Corporate-Optimized strategy withdrawal order
Shows year-by-year withdrawals to verify order
"""

import requests
import json

def test_corporate_order():
    """Test Corporate-Optimized withdrawal order with detailed output"""

    print("=" * 80)
    print("CORPORATE-OPTIMIZED DETAILED TEST")
    print("=" * 80)
    print("\nExpected order: Corporate → RRIF → NonReg → TFSA")
    print("Testing with moderate spending to see withdrawal progression")
    print("-" * 80)

    # Test payload with balanced assets and moderate spending
    payload = {
        "p1": {
            "name": "Test",
            "start_age": 65,
            "rrif_balance": 200000,
            "tfsa_balance": 100000,
            "nr_cash": 50000,
            "nr_gic": 50000,
            "nr_invest": 100000,  # Total NonReg: 200000
            "corp_cash_bucket": 50000,
            "corp_gic_bucket": 50000,
            "corp_invest_bucket": 200000,  # Total Corp: 300000
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
        "strategy": "corporate-optimized",
        "spending_go_go": 80000,  # Moderate spending
        "spending_slow_go": 70000,
        "slow_go_end_age": 85,
        "spending_no_go": 60000,
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

            print("\n📊 YEAR-BY-YEAR WITHDRAWAL ANALYSIS:")
            print("-" * 60)

            # Look at first 3 years
            years_to_check = []
            for year in data.get('five_year_plan', [])[:3]:
                years_to_check.append(year)

            for year_data in years_to_check:
                age = year_data.get('age_p1', 0)
                year = year_data.get('year', 2026)

                corp_wd = year_data.get('corporate_withdrawal_p1', 0)
                rrif_wd = year_data.get('rrif_withdrawal_p1', 0)
                nonreg_wd = year_data.get('nonreg_withdrawal_p1', 0)
                tfsa_wd = year_data.get('tfsa_withdrawal_p1', 0)

                corp_bal = year_data.get('corporate_p1', 0)
                rrif_bal = year_data.get('rrif_p1', 0)
                nonreg_bal = year_data.get('nonreg_p1', 0)
                tfsa_bal = year_data.get('tfsa_p1', 0)

                print(f"\nYear {year} (Age {age}):")
                print(f"  Withdrawals:")
                print(f"    Corporate: ${corp_wd:,.2f}")
                print(f"    RRIF:      ${rrif_wd:,.2f}")
                print(f"    NonReg:    ${nonreg_wd:,.2f}")
                print(f"    TFSA:      ${tfsa_wd:,.2f}")
                print(f"  End Balances:")
                print(f"    Corporate: ${corp_bal:,.2f}")
                print(f"    RRIF:      ${rrif_bal:,.2f}")
                print(f"    NonReg:    ${nonreg_bal:,.2f}")
                print(f"    TFSA:      ${tfsa_bal:,.2f}")

                # Verify order
                if corp_wd > 0 and nonreg_wd > 0:
                    print("  ⚠️ WARNING: Withdrawing from both Corporate and NonReg")
                elif nonreg_wd > 0 and corp_bal > 0:
                    print("  ❌ ERROR: Withdrawing from NonReg while Corporate has balance!")
                elif corp_wd > 0:
                    print("  ✅ Correctly withdrawing from Corporate first")
                elif rrif_wd > 0 and corp_bal == 0:
                    print("  ✅ Corporate depleted, now using RRIF")
                elif nonreg_wd > 0 and corp_bal == 0 and rrif_bal == 0:
                    print("  ✅ Corp and RRIF depleted, now using NonReg")

            # Summary
            print("\n" + "=" * 60)
            print("SUMMARY:")

            # Check first year
            if years_to_check:
                first_year = years_to_check[0]
                if first_year.get('corporate_withdrawal_p1', 0) > 0:
                    print("✅ Strategy correctly withdraws from Corporate first")
                elif first_year.get('nonreg_withdrawal_p1', 0) > 0:
                    print("❌ Strategy incorrectly withdraws from NonReg first")
                else:
                    print("⚠️ Check withdrawal pattern above")

        else:
            print(f"❌ ERROR: API returned status {response.status_code}")
            print(response.text[:500])

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_corporate_order()