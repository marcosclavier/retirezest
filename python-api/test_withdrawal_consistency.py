#!/usr/bin/env python3
"""
Test suite for withdrawal consistency in retirement simulations.
Ensures no alternating Gap/OK patterns and logical withdrawal behavior.
"""

import sys
import json
import requests
from typing import Dict, List, Any

def run_simulation(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Run a simulation with the given payload."""
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload)

    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None

    data = response.json()

    if not data.get("success"):
        print(f"❌ Simulation failed: {data.get('message')}")
        return None

    return data

def analyze_withdrawal_pattern(year_by_year: List[Dict]) -> Dict[str, Any]:
    """Analyze year-by-year results for alternating patterns and issues."""

    analysis = {
        "total_years": len(year_by_year),
        "gap_years": 0,
        "ok_years": 0,
        "alternating_count": 0,
        "illogical_gaps": [],
        "withdrawal_variance": [],
        "pattern_detected": False,
    }

    previous_status = None
    previous_withdrawals = None

    for i, year_data in enumerate(year_by_year):
        year = year_data.get("year", 0)
        status = "OK" if year_data.get("plan_success") else "Gap"
        withdrawals = year_data.get("total_withdrawals", 0)
        net_worth = year_data.get("total_value", 0)
        spending_need = year_data.get("spending_need", 0)

        # Count status types
        if status == "OK":
            analysis["ok_years"] += 1
        else:
            analysis["gap_years"] += 1

        # Check for illogical gaps (gap with significant assets remaining)
        if status == "Gap" and net_worth > 10000:
            analysis["illogical_gaps"].append({
                "year": year,
                "net_worth": net_worth,
                "withdrawals": withdrawals,
                "spending_need": spending_need,
            })

        # Detect alternating pattern
        if previous_status is not None and status != previous_status:
            analysis["alternating_count"] += 1

        # Track withdrawal variance
        if previous_withdrawals is not None and previous_withdrawals > 0:
            variance = abs(withdrawals - previous_withdrawals) / previous_withdrawals
            if variance > 0.5:  # More than 50% change
                analysis["withdrawal_variance"].append({
                    "year": year,
                    "variance_pct": variance * 100,
                    "prev_withdrawal": previous_withdrawals,
                    "curr_withdrawal": withdrawals,
                })

        previous_status = status
        previous_withdrawals = withdrawals

    # Determine if alternating pattern exists
    if analysis["alternating_count"] >= len(year_by_year) * 0.3:  # 30%+ alternations
        analysis["pattern_detected"] = True

    return analysis

def test_scenario(name: str, payload: Dict[str, Any]) -> bool:
    """Test a specific scenario for withdrawal consistency."""

    print(f"\n{'=' * 70}")
    print(f"Testing: {name}")
    print(f"{'=' * 70}")

    # Run simulation
    result = run_simulation(payload)
    if not result:
        return False

    # Analyze results
    year_by_year = result.get("year_by_year", [])
    analysis = analyze_withdrawal_pattern(year_by_year)

    # Print analysis
    print(f"\n📊 ANALYSIS RESULTS:")
    print(f"Total years: {analysis['total_years']}")
    print(f"OK years: {analysis['ok_years']} ({analysis['ok_years']/analysis['total_years']*100:.1f}%)")
    print(f"Gap years: {analysis['gap_years']} ({analysis['gap_years']/analysis['total_years']*100:.1f}%)")
    print(f"Status changes: {analysis['alternating_count']}")

    # Check for issues
    test_passed = True

    if analysis["pattern_detected"]:
        print(f"\n⚠️ ALTERNATING PATTERN DETECTED!")
        print(f"   {analysis['alternating_count']} status changes in {analysis['total_years']} years")
        test_passed = False

    if analysis["illogical_gaps"]:
        print(f"\n⚠️ ILLOGICAL GAPS FOUND!")
        for gap in analysis["illogical_gaps"][:5]:  # Show first 5
            print(f"   Year {gap['year']}: Gap with ${gap['net_worth']:,.0f} assets remaining")
            print(f"      Withdrawals: ${gap['withdrawals']:,.0f}, Need: ${gap['spending_need']:,.0f}")
        test_passed = False

    if analysis["withdrawal_variance"]:
        high_variance = [v for v in analysis["withdrawal_variance"] if v["variance_pct"] > 100]
        if high_variance:
            print(f"\n⚠️ HIGH WITHDRAWAL VARIANCE!")
            for v in high_variance[:5]:  # Show first 5
                print(f"   Year {v['year']}: {v['variance_pct']:.0f}% change")
                print(f"      Prev: ${v['prev_withdrawal']:,.0f}, Curr: ${v['curr_withdrawal']:,.0f}")
            test_passed = False

    # Summary
    if test_passed:
        print(f"\n✅ TEST PASSED: {name}")
    else:
        print(f"\n❌ TEST FAILED: {name}")

    return test_passed

def main():
    """Run all test scenarios."""

    print("\n" + "=" * 70)
    print("WITHDRAWAL CONSISTENCY TEST SUITE")
    print("=" * 70)

    # Test scenarios
    scenarios = [
        # Rafael Quebec scenario (the problematic one)
        {
            "name": "Rafael - Quebec Single RRIF",
            "payload": {
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
                "p2": {},  # Empty p2 for single person
                "spending_target": 90000,
                "inflation_rate": 2.5,
                "year_start": 2031,
                "year_end": 2051,
                "province": "QC",
                "strategy": "rrif-frontload"
            }
        },
        # Ontario comparison
        {
            "name": "Rafael - Ontario Single RRIF",
            "payload": {
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
                "p2": {},  # Empty p2 for single person
                "spending_target": 90000,
                "inflation_rate": 2.5,
                "year_start": 2031,
                "year_end": 2051,
                "province": "ON",
                "strategy": "rrif-frontload"
            }
        },
        # Balanced portfolio test
        {
            "name": "Mixed Assets - Quebec",
            "payload": {
                "p1": {
                    "name": "TestUser",
                    "start_age": 65,
                    "life_expectancy": 90,
                    "cpp_start_age": 65,
                    "oas_start_age": 65,
                    "income": 0,
                    "rrsp_balance": 0,
                    "rrif_balance": 200000,
                    "tfsa_balance": 100000,
                    "nonreg_balance": 100000,
                    "cpp_estimates": {"age60": 0, "age65": 1000, "age70": 0},
                    "oas_estimate": 700,
                    "employer_pension": 0,
                    "other_income": 0
                },
                "p2": {},  # Empty p2 for single person
                "spending_target": 70000,
                "inflation_rate": 2.5,
                "year_start": 2031,
                "year_end": 2051,
                "province": "QC",
                "strategy": "balanced"
            }
        },
    ]

    # Run tests
    results = []
    for scenario in scenarios:
        passed = test_scenario(scenario["name"], scenario["payload"])
        results.append((scenario["name"], passed))

    # Final summary
    print("\n" + "=" * 70)
    print("TEST SUITE SUMMARY")
    print("=" * 70)

    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)

    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {name}")

    print(f"\nOverall: {passed_count}/{total_count} tests passed")

    if passed_count == total_count:
        print("\n🎉 All tests passed! Withdrawal consistency is working correctly.")
        return 0
    else:
        print(f"\n⚠️ {total_count - passed_count} test(s) failed. Withdrawal strategy needs attention.")
        return 1

if __name__ == "__main__":
    sys.exit(main())