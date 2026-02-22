#!/usr/bin/env python3
"""
Realistic test for Corporate-Optimized strategy withdrawal order
Uses moderate spending to see withdrawal progression over multiple years
"""

import requests
import json

def test_corporate_realistic():
    """Test Corporate-Optimized with realistic spending levels"""

    print("=" * 80)
    print("CORPORATE-OPTIMIZED REALISTIC SCENARIO TEST")
    print("=" * 80)
    print("\nExpected order: Corporate → RRIF → NonReg → TFSA")
    print("Testing with realistic spending to verify order over multiple years")
    print("-" * 80)

    # Realistic test payload with substantial assets and moderate spending
    payload = {
        "p1": {
            "name": "Test",
            "start_age": 65,
            "rrif_balance": 500000,      # $500k RRIF
            "tfsa_balance": 200000,       # $200k TFSA
            "nr_cash": 100000,
            "nr_gic": 100000,
            "nr_invest": 300000,          # Total NonReg: $500k
            "corp_cash_bucket": 200000,
            "corp_gic_bucket": 200000,
            "corp_invest_bucket": 600000, # Total Corp: $1M
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
        "end_age": 75,  # 10 year simulation
        "strategy": "corporate-optimized",
        "spending_go_go": 100000,  # Realistic spending that requires withdrawals
        "spending_slow_go": 80000,
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

            # Track when each account starts withdrawing
            corp_started = False
            rrif_started = False
            nonreg_started = False
            tfsa_started = False

            # Look at first 5 years to see progression
            for year_data in data.get('five_year_plan', [])[:5]:
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
                if corp_wd > 0:
                    print(f"    Corporate: ${corp_wd:>12,.2f} ✓")
                    if not corp_started:
                        corp_started = True
                        print("      → Corporate withdrawals started (CORRECT - should be first)")
                else:
                    print(f"    Corporate: ${corp_wd:>12,.2f}")

                if rrif_wd > 0:
                    print(f"    RRIF:      ${rrif_wd:>12,.2f} ✓")
                    if not rrif_started:
                        rrif_started = True
                        if corp_bal == 0:
                            print("      → RRIF withdrawals started (Corporate depleted)")
                        else:
                            print(f"      → ⚠️ RRIF started but Corporate still has ${corp_bal:,.0f}")
                else:
                    print(f"    RRIF:      ${rrif_wd:>12,.2f}")

                if nonreg_wd > 0:
                    print(f"    NonReg:    ${nonreg_wd:>12,.2f} ✓")
                    if not nonreg_started:
                        nonreg_started = True
                        if corp_bal == 0 and rrif_bal == 0:
                            print("      → NonReg withdrawals started (Corp & RRIF depleted)")
                        elif corp_bal > 0:
                            print(f"      → ❌ ERROR: NonReg started but Corporate still has ${corp_bal:,.0f}")
                        elif rrif_bal > 0:
                            print(f"      → ⚠️ NonReg started but RRIF still has ${rrif_bal:,.0f}")
                else:
                    print(f"    NonReg:    ${nonreg_wd:>12,.2f}")

                if tfsa_wd > 0:
                    print(f"    TFSA:      ${tfsa_wd:>12,.2f} ✓")
                    if not tfsa_started:
                        tfsa_started = True
                        if corp_bal == 0 and rrif_bal == 0 and nonreg_bal == 0:
                            print("      → TFSA withdrawals started (all others depleted)")
                        else:
                            print(f"      → ⚠️ TFSA started but other accounts remain")
                else:
                    print(f"    TFSA:      ${tfsa_wd:>12,.2f}")

                print(f"\n  End Balances:")
                print(f"    Corporate: ${corp_bal:>12,.2f}")
                print(f"    RRIF:      ${rrif_bal:>12,.2f}")
                print(f"    NonReg:    ${nonreg_bal:>12,.2f}")
                print(f"    TFSA:      ${tfsa_bal:>12,.2f}")

                # Check for order violations
                if nonreg_wd > 0 and corp_bal > 1000:  # Allow small rounding
                    print("\n  ❌ VIOLATION: Withdrawing from NonReg while Corporate has balance!")
                elif tfsa_wd > 0 and (corp_bal > 1000 or rrif_bal > 1000 or nonreg_bal > 1000):
                    print("\n  ❌ VIOLATION: Withdrawing from TFSA while other accounts have balance!")

            # Summary
            print("\n" + "=" * 60)
            print("WITHDRAWAL ORDER SUMMARY:")

            # Check the order accounts started withdrawing
            order_correct = True
            if not corp_started:
                print("❌ Corporate never started withdrawing")
                order_correct = False
            elif nonreg_started and data.get('five_year_plan', [])[0].get('corporate_p1', 0) > 0:
                print("❌ NonReg started before Corporate was depleted")
                order_correct = False
            elif tfsa_started:
                # Check if TFSA started too early
                for year in data.get('five_year_plan', []):
                    if year.get('tfsa_withdrawal_p1', 0) > 0:
                        if (year.get('corporate_p1', 0) > 1000 or
                            year.get('rrif_p1', 0) > 1000 or
                            year.get('nonreg_p1', 0) > 1000):
                            print("❌ TFSA started before other accounts were depleted")
                            order_correct = False
                            break

            if order_correct:
                print("✅ Strategy appears to be following correct withdrawal order!")
                print("   Corporate → RRIF → NonReg → TFSA")
            else:
                print("\n⚠️ Strategy is NOT following expected order")
                print("   Expected: Corporate → RRIF → NonReg → TFSA")

            # Show first year details for debugging
            first_year = data.get('five_year_plan', [])[0] if data.get('five_year_plan') else None
            if first_year:
                print("\n" + "-" * 60)
                print("FIRST YEAR DETAILED ANALYSIS:")
                print(f"Total spending need: ${first_year.get('spending_p1', 0):,.2f}")
                print(f"Income (CPP+OAS): ${(first_year.get('cpp_p1', 0) + first_year.get('oas_p1', 0)):,.2f}")
                print(f"Withdrawal needed: ${first_year.get('spending_p1', 0) - (first_year.get('cpp_p1', 0) + first_year.get('oas_p1', 0)):,.2f}")
                print("\nWithdrawal allocation:")
                if first_year.get('corporate_withdrawal_p1', 0) > 0:
                    print(f"  ✅ Corporate: ${first_year.get('corporate_withdrawal_p1', 0):,.2f}")
                else:
                    print(f"  ❌ Corporate: $0 (should withdraw from here first!)")

        else:
            print(f"❌ ERROR: API returned status {response.status_code}")
            print(response.text[:500])

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_corporate_realistic()