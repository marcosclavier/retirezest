#!/usr/bin/env python3
"""Test Rafael's case with minimize income strategy to check TFSA contribution."""

import sys
import json
import requests

def test_rafael_minimize_income():
    """Run Rafael's simulation with minimize income strategy."""

    # Rafael's scenario with minimize income strategy
    payload = {
        "p1": {
            "name": "Rafael",
            "start_age": 65,
            "life_expectancy": 90,
            "cpp_start_age": 65,
            "oas_start_age": 65,
            "income": 0,
            "rrsp_balance": 0,
            "rrif_balance": 350000,
            "tfsa_balance": 40600,
            "nonreg_balance": 0,
            "cpp_annual_at_start": 9600,  # $800/month * 12
            "oas_annual_at_start": 8400,  # $700/month * 12
            "employer_pension": 0,
            "other_income": 0
        },
        "p2": {},  # Single person - empty dict
        "spending_target": 90000,
        "inflation_rate": 2.5,
        "year_start": 2031,
        "year_end": 2051,
        "province": "QC",
        "strategy": "minimize-income"  # Using minimize income strategy
    }

    # Make request
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload)

    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return

    data = response.json()

    if not data.get("success"):
        print(f"❌ Simulation failed: {data.get('message')}")
        return

    # Analyze year-by-year results
    year_by_year = data.get("year_by_year", [])

    print("\n📊 RAFAEL'S MINIMIZE INCOME STRATEGY ANALYSIS")
    print("=" * 100)
    print(f"{'Year':<6} {'Age':<5} {'Spending':<12} {'RRIF WD':<12} {'TFSA WD':<12} {'TFSA Contrib':<12} {'TFSA Bal':<12} {'Tax':<12} {'Status':<8}")
    print("-" * 100)

    # Focus on years around 2033 where TFSA contribution is expected
    for year_data in year_by_year:
        year = year_data.get("year", 0)

        # Show years 2031-2040
        if year >= 2031 and year <= 2040:
            age = year_data.get("age_p1", 0)
            spending = year_data.get("spending_need", 0)
            rrif_wd = year_data.get("rrif_withdrawal_p1", 0)
            tfsa_wd = year_data.get("tfsa_withdrawal_p1", 0)
            tfsa_contrib = year_data.get("tfsa_contribution_p1", 0)
            tfsa_bal = year_data.get("tfsa_balance_p1", 0)
            tax = year_data.get("total_tax", 0)
            status = "OK" if year_data.get("plan_success") else "GAP"

            # Highlight year 2033
            prefix = ">>> " if year == 2033 else "    "

            print(f"{prefix}{year:<6} {age:<5} ${spending:>10,.0f} ${rrif_wd:>10,.0f} ${tfsa_wd:>10,.0f} ${tfsa_contrib:>10,.0f} ${tfsa_bal:>10,.0f} ${tax:>10,.0f} {status:<8}")

            # Additional detail for year 2033
            if year == 2033:
                print(f"    💰 TFSA Contribution Details for {year}:")
                print(f"       - TFSA contribution P1: ${tfsa_contrib:,.0f}")
                print(f"       - TFSA balance end of year: ${tfsa_bal:,.0f}")
                print(f"       - Total withdrawals: ${year_data.get('total_withdrawals', 0):,.0f}")
                print(f"       - NonReg balance P1: ${year_data.get('nonreg_balance_p1', 0):,.0f}")

                # Check for TFSA reinvestment
                tfsa_reinvest = year_data.get("tfsa_reinvest_p1", 0)
                if tfsa_reinvest > 0:
                    print(f"       - TFSA reinvestment from surplus: ${tfsa_reinvest:,.0f}")

    # Summary
    print("\n📈 SUMMARY")
    print("=" * 100)

    # Count years with TFSA contributions
    years_with_contrib = sum(1 for y in year_by_year if y.get("tfsa_contribution_p1", 0) > 0)
    total_contrib = sum(y.get("tfsa_contribution_p1", 0) for y in year_by_year)

    print(f"Years with TFSA contributions: {years_with_contrib}")
    print(f"Total TFSA contributions: ${total_contrib:,.0f}")

    # Check specific year 2033
    year_2033 = next((y for y in year_by_year if y.get("year") == 2033), None)
    if year_2033:
        print(f"\n🔍 Year 2033 Analysis:")
        print(f"  TFSA Contribution P1: ${year_2033.get('tfsa_contribution_p1', 0):,.0f}")
        print(f"  TFSA Balance P1: ${year_2033.get('tfsa_balance_p1', 0):,.0f}")
        print(f"  NonReg Balance P1: ${year_2033.get('nonreg_balance_p1', 0):,.0f}")
        print(f"  Plan Success: {year_2033.get('plan_success')}")

        if year_2033.get('tfsa_contribution_p1', 0) == 0:
            print("\n⚠️ WARNING: TFSA contribution is $0 in year 2033!")
            print("  This might be because:")
            print("  1. There's no NonReg balance to transfer from")
            print("  2. There's a spending gap preventing contributions")
            print("  3. The TFSA contribution limit is set to 0")
        elif year_2033.get('tfsa_contribution_p1', 0) == 50000:
            print("\n✅ SUCCESS: TFSA contribution of $50,000 found in year 2033!")

if __name__ == "__main__":
    test_rafael_minimize_income()