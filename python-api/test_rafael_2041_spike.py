#!/usr/bin/env python3
"""Test Rafael's RRIF-frontload strategy to investigate the $50k TFSA contribution spike in 2041."""

import sys
import json
import requests

def test_rafael_rrif_frontload():
    """Run Rafael's simulation with RRIF-frontload strategy to examine the 2041 spike."""

    # Rafael's scenario with RRIF-frontload strategy
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
            "tfsa_balance": 50000,  # Starting TFSA balance
            "nonreg_balance": 150000,  # NonReg balance
            "cpp_annual_at_start": 12000,  # Approximate from screenshot
            "oas_annual_at_start": 9000,   # Approximate from screenshot
            "employer_pension": 50000,  # $50k pension visible in screenshot
            "other_income": 0
        },
        "p2": {},  # Single person
        "spending_target": 90000,  # Approximate from screenshot spending levels
        "inflation_rate": 2.0,
        "year_start": 2031,
        "year_end": 2051,
        "province": "QC",
        "strategy": "rrif-frontload"
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

    print("\n📊 RAFAEL'S RRIF-FRONTLOAD STRATEGY - TFSA CONTRIBUTION ANALYSIS")
    print("=" * 120)
    print(f"{'Year':<6} {'Age':<5} {'RRIF Bal':<12} {'TFSA Bal':<12} {'NonReg Bal':<12} {'TFSA Contrib':<12} {'TFSA Reinv':<12} {'Total TFSA':<12} {'Net Worth':<12}")
    print("-" * 120)

    # Focus on years 2038-2044 around the spike
    for year_data in year_by_year:
        year = year_data.get("year", 0)

        if year >= 2038 and year <= 2044:
            age = year_data.get("age_p1", 0)
            rrif_bal = year_data.get("rrif_balance_p1", 0)
            tfsa_bal = year_data.get("tfsa_balance_p1", 0)
            nonreg_bal = year_data.get("nonreg_balance_p1", 0)
            tfsa_contrib = year_data.get("tfsa_contribution_p1", 0)
            tfsa_reinvest = year_data.get("tfsa_reinvest_p1", 0)
            total_tfsa = tfsa_contrib + tfsa_reinvest
            net_worth = year_data.get("total_value", 0)

            # Highlight year 2041
            prefix = ">>> " if year == 2041 else "    "

            print(f"{prefix}{year:<6} {age:<5} ${rrif_bal:>10,.0f} ${tfsa_bal:>10,.0f} ${nonreg_bal:>10,.0f} ${tfsa_contrib:>10,.0f} ${tfsa_reinvest:>10,.0f} ${total_tfsa:>10,.0f} ${net_worth:>10,.0f}")

    print("\n💰 DETAILED ANALYSIS FOR YEARS 2040-2042")
    print("=" * 120)

    for year_data in year_by_year:
        year = year_data.get("year", 0)

        if year >= 2040 and year <= 2042:
            print(f"\n📅 Year {year} (Age {year_data.get('age_p1', 0)}):")
            print(f"  Income Sources:")
            print(f"    - CPP: ${year_data.get('cpp_p1', 0):,.0f}")
            print(f"    - OAS: ${year_data.get('oas_p1', 0):,.0f}")
            print(f"    - Pension: ${year_data.get('employer_pension_p1', 0):,.0f}")
            print(f"    - Total Gov + Pension: ${year_data.get('cpp_p1', 0) + year_data.get('oas_p1', 0) + year_data.get('employer_pension_p1', 0):,.0f}")

            print(f"  Withdrawals:")
            print(f"    - RRIF: ${year_data.get('rrif_withdrawal_p1', 0):,.0f}")
            print(f"    - TFSA: ${year_data.get('tfsa_withdrawal_p1', 0):,.0f}")
            print(f"    - NonReg: ${year_data.get('nonreg_withdrawal_p1', 0):,.0f}")
            print(f"    - Total Withdrawals: ${year_data.get('total_withdrawals', 0):,.0f}")

            print(f"  TFSA Activity:")
            print(f"    - Regular Contribution: ${year_data.get('tfsa_contribution_p1', 0):,.0f}")
            print(f"    - Reinvestment from Surplus: ${year_data.get('tfsa_reinvest_p1', 0):,.0f}")
            print(f"    - TOTAL TFSA IN: ${year_data.get('tfsa_contribution_p1', 0) + year_data.get('tfsa_reinvest_p1', 0):,.0f}")

            print(f"  Balances (End of Year):")
            print(f"    - RRIF: ${year_data.get('rrif_balance_p1', 0):,.0f}")
            print(f"    - TFSA: ${year_data.get('tfsa_balance_p1', 0):,.0f}")
            print(f"    - NonReg: ${year_data.get('nonreg_balance_p1', 0):,.0f}")

            print(f"  Financial Summary:")
            print(f"    - Spending Need: ${year_data.get('spending_need', 0):,.0f}")
            print(f"    - Total Tax: ${year_data.get('total_tax', 0):,.0f}")
            print(f"    - Net Worth: ${year_data.get('total_value', 0):,.0f}")
            print(f"    - Plan Success: {'✅ OK' if year_data.get('plan_success') else '❌ GAP'}")

    # Calculate some statistics
    print("\n📈 TFSA CONTRIBUTION STATISTICS")
    print("=" * 120)

    tfsa_contribs = []
    for year_data in year_by_year:
        year = year_data.get("year", 0)
        if year >= 2038 and year <= 2044:
            total = year_data.get("tfsa_contribution_p1", 0) + year_data.get("tfsa_reinvest_p1", 0)
            tfsa_contribs.append((year, total))

    if tfsa_contribs:
        avg_contrib = sum(c[1] for c in tfsa_contribs) / len(tfsa_contribs)
        max_contrib = max(tfsa_contribs, key=lambda x: x[1])
        min_contrib = min(tfsa_contribs, key=lambda x: x[1])

        print(f"Average TFSA contribution (2038-2044): ${avg_contrib:,.0f}")
        print(f"Maximum: ${max_contrib[1]:,.0f} in year {max_contrib[0]}")
        print(f"Minimum: ${min_contrib[1]:,.0f} in year {min_contrib[0]}")

        # Check for spike
        year_2041 = next((c for c in tfsa_contribs if c[0] == 2041), None)
        if year_2041 and year_2041[1] > avg_contrib * 2:
            print(f"\n⚠️ WARNING: 2041 contribution (${year_2041[1]:,.0f}) is {year_2041[1]/avg_contrib:.1f}x the average!")
            print("This could lead to:")
            print("  - Higher taxes due to large withdrawal from NonReg to fund TFSA")
            print("  - Suboptimal tax smoothing")
            print("  - Unnecessary volatility in cash flows")

if __name__ == "__main__":
    test_rafael_rrif_frontload()