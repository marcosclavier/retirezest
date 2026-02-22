#!/usr/bin/env python3
"""Test script to debug the alternating Gap/OK pattern issue."""

import sys
import json
import requests

def test_quebec_simulation():
    """Run Quebec simulation and analyze the alternating pattern."""

    # Rafael's Quebec scenario (single person)
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
        "p2": {},  # Single person - empty dict, not None
        "spending_target": 90000,
        "inflation_rate": 2.5,
        "year_start": 2031,
        "year_end": 2051,
        "province": "QC",
        "strategy": "rrif-frontload"  # Use valid strategy
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

    # Debug: Print first year's data to understand the issue
    if year_by_year:
        first_year = year_by_year[0]
        print(f"\n🔍 FIRST YEAR DEBUG DATA:")
        print(f"  Year: {first_year.get('year')}")
        print(f"  Spending need: ${first_year.get('spending_need', 0):,.0f}")
        # Try different field names for CPP/OAS
        cpp_val = first_year.get('cpp_annual_p1', 0) or first_year.get('cpp_p1', 0) or first_year.get('cpp_income_p1', 0)
        oas_val = first_year.get('oas_annual_p1', 0) or first_year.get('oas_p1', 0) or first_year.get('oas_income_p1', 0)
        print(f"  CPP: ${cpp_val:,.0f}")
        print(f"  OAS: ${oas_val:,.0f}")
        print(f"  Total withdrawals: ${first_year.get('total_withdrawals', 0):,.0f}")
        print(f"  RRIF withdrawal: ${first_year.get('rrif_withdrawal_p1', 0):,.0f}")
        print(f"  TFSA withdrawal: ${first_year.get('tfsa_withdrawal_p1', 0):,.0f}")
        # Also print all keys that contain 'cpp' or 'oas'
        cpp_keys = [k for k in first_year.keys() if 'cpp' in k.lower()]
        oas_keys = [k for k in first_year.keys() if 'oas' in k.lower()]
        print(f"  CPP-related keys: {cpp_keys}")
        print(f"  OAS-related keys: {oas_keys}")

    print("\n📊 ALTERNATING PATTERN ANALYSIS")
    print("=" * 80)
    print(f"{'Year':<6} {'Age':<5} {'Spending':<12} {'Withdrawals':<12} {'Tax':<12} {'Net Worth':<12} {'Status':<8}")
    print("-" * 80)

    for i, year_data in enumerate(year_by_year[:15]):  # First 15 years
        year = year_data.get("year", 0)
        age = year_data.get("age_p1", 0)
        spending = year_data.get("spending_need", 0)
        withdrawals = year_data.get("total_withdrawals", 0)
        tax = year_data.get("total_tax", 0)
        net_worth = year_data.get("total_value", 0)
        status = "OK" if year_data.get("plan_success") else "GAP"

        # Calculate withdrawal components
        rrif_w = year_data.get("rrif_withdrawal_p1", 0)
        tfsa_w = year_data.get("tfsa_withdrawal_p1", 0)

        print(f"{year:<6} {age:<5} ${spending:>10,.0f} ${withdrawals:>10,.0f} ${tax:>10,.0f} ${net_worth:>10,.0f} {status:<8}")

        # Detailed breakdown for Gap years
        if status == "GAP":
            print(f"       ⚠️  RRIF: ${rrif_w:,.0f}, TFSA: ${tfsa_w:,.0f}")

        # Check for alternating pattern
        if i > 0:
            prev_status = "OK" if year_by_year[i-1].get("plan_success") else "GAP"
            if prev_status != status:
                print(f"       🔄 Status changed from {prev_status} to {status}")

    # Summary statistics
    print("\n📈 SUMMARY STATISTICS")
    print("=" * 80)

    ok_years = sum(1 for y in year_by_year if y.get("plan_success"))
    gap_years = len(year_by_year) - ok_years

    print(f"Total years: {len(year_by_year)}")
    print(f"OK years: {ok_years} ({ok_years/len(year_by_year)*100:.1f}%)")
    print(f"GAP years: {gap_years} ({gap_years/len(year_by_year)*100:.1f}%)")

    # Check for alternating pattern
    alternating_count = 0
    for i in range(1, len(year_by_year)):
        curr_status = year_by_year[i].get("plan_success")
        prev_status = year_by_year[i-1].get("plan_success")
        if curr_status != prev_status:
            alternating_count += 1

    print(f"\nStatus changes: {alternating_count}")
    if alternating_count > len(year_by_year) * 0.4:  # More than 40% changes suggests alternating
        print("⚠️  WARNING: High frequency of status changes suggests alternating pattern!")

    # Analyze withdrawal patterns
    print("\n💰 WITHDRAWAL PATTERN ANALYSIS")
    print("=" * 80)

    gap_withdrawals = []
    ok_withdrawals = []

    for y in year_by_year:
        if y.get("plan_success"):
            ok_withdrawals.append(y.get("total_withdrawals", 0))
        else:
            gap_withdrawals.append(y.get("total_withdrawals", 0))

    if gap_withdrawals:
        avg_gap_withdrawal = sum(gap_withdrawals) / len(gap_withdrawals)
        print(f"Average withdrawal in GAP years: ${avg_gap_withdrawal:,.0f}")

    if ok_withdrawals:
        avg_ok_withdrawal = sum(ok_withdrawals) / len(ok_withdrawals)
        print(f"Average withdrawal in OK years: ${avg_ok_withdrawal:,.0f}")

    if gap_withdrawals and ok_withdrawals:
        ratio = avg_ok_withdrawal / avg_gap_withdrawal if avg_gap_withdrawal > 0 else 0
        print(f"Withdrawal ratio (OK/GAP): {ratio:.2f}x")

        if ratio > 2:
            print("⚠️  WARNING: OK years have significantly higher withdrawals than GAP years!")
            print("   This suggests a problematic biennial withdrawal pattern.")

if __name__ == "__main__":
    test_quebec_simulation()