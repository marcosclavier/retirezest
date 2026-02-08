#!/usr/bin/env python3
"""
End-to-End Test Suite for Future Retirement Age Planning
Tests the complete workflow from API request to simulation results
"""

import json
import sys
from typing import Dict, Any, List

# Test scenarios
test_scenarios = [
    {
        "name": "Future Retirement Planning (60/64)",
        "description": "Person 1 plans to retire at 60 (currently 56), Person 2 at 64 (currently 60)",
        "payload": {
            "p1": {
                "name": "Person 1",
                "start_age": 60,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 15000,
                "oas_start_age": 65,
                "oas_annual_at_start": 8500,
                "tfsa_balance": 150000,
                "rrsp_balance": 400000,
                "rrif_balance": 0,
                "nonreg_balance": 200000,
                "nonreg_acb": 160000,
                "corporate_balance": 0
            },
            "p2": {
                "name": "Person 2",
                "start_age": 64,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 12000,
                "oas_start_age": 65,
                "oas_annual_at_start": 8500,
                "tfsa_balance": 100000,
                "rrsp_balance": 300000,
                "rrif_balance": 0,
                "nonreg_balance": 150000,
                "nonreg_acb": 120000,
                "corporate_balance": 0
            },
            "province": "ON",
            "start_year": 2026,
            "end_age": 95,
            "strategy": "minimize-income",
            "spending_go_go": 70000,
            "go_go_end_age": 75,
            "spending_slow_go": 55000,
            "slow_go_end_age": 85,
            "spending_no_go": 45000,
            "spending_inflation": 2.0,
            "general_inflation": 2.0
        },
        "expected": {
            "first_year_age_p1": 60,
            "first_year_age_p2": 64,
            "min_years": 31,  # 60 to 95 is 36 years
            "success": True
        }
    },
    {
        "name": "Boundary Age Test (50/90)",
        "description": "Test minimum and maximum allowed ages",
        "payload": {
            "p1": {
                "name": "Person 1",
                "start_age": 50,
                "cpp_start_age": 60,
                "cpp_annual_at_start": 10000,
                "oas_start_age": 65,
                "oas_annual_at_start": 8500,
                "tfsa_balance": 200000,
                "rrsp_balance": 500000,
                "rrif_balance": 0,
                "nonreg_balance": 300000,
                "nonreg_acb": 250000,
                "corporate_balance": 0
            },
            "p2": {
                "name": "Person 2",
                "start_age": 55,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 15000,
                "oas_start_age": 65,
                "oas_annual_at_start": 8500,
                "tfsa_balance": 150000,
                "rrsp_balance": 400000,
                "rrif_balance": 0,
                "nonreg_balance": 200000,
                "nonreg_acb": 160000,
                "corporate_balance": 0
            },
            "province": "ON",
            "start_year": 2026,
            "end_age": 90,
            "strategy": "minimize-income",
            "spending_go_go": 80000,
            "go_go_end_age": 75,
            "spending_slow_go": 60000,
            "slow_go_end_age": 85,
            "spending_no_go": 50000,
            "spending_inflation": 2.0,
            "general_inflation": 2.0
        },
        "expected": {
            "first_year_age_p1": 50,
            "first_year_age_p2": 55,
            "min_years": 35,  # 50 to 90 is 41 years
            "success": True
        }
    },
    {
        "name": "Current Age Planning (65/65)",
        "description": "Standard scenario starting at current retirement age",
        "payload": {
            "p1": {
                "name": "Person 1",
                "start_age": 65,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 15000,
                "oas_start_age": 65,
                "oas_annual_at_start": 8500,
                "tfsa_balance": 100000,
                "rrsp_balance": 300000,
                "rrif_balance": 0,
                "nonreg_balance": 150000,
                "nonreg_acb": 120000,
                "corporate_balance": 0
            },
            "p2": {
                "name": "Person 2",
                "start_age": 65,
                "cpp_start_age": 65,
                "cpp_annual_at_start": 12000,
                "oas_start_age": 65,
                "oas_annual_at_start": 8500,
                "tfsa_balance": 80000,
                "rrsp_balance": 250000,
                "rrif_balance": 0,
                "nonreg_balance": 100000,
                "nonreg_acb": 80000,
                "corporate_balance": 0
            },
            "province": "ON",
            "start_year": 2026,
            "end_age": 95,
            "strategy": "minimize-income",
            "spending_go_go": 60000,
            "go_go_end_age": 75,
            "spending_slow_go": 50000,
            "slow_go_end_age": 85,
            "spending_no_go": 40000,
            "spending_inflation": 2.0,
            "general_inflation": 2.0
        },
        "expected": {
            "first_year_age_p1": 65,
            "first_year_age_p2": 65,
            "min_years": 26,  # 65 to 95 is 31 years
            "success": True
        }
    },
    {
        "name": "Late Retirement Planning (70/72)",
        "description": "Planning to work longer and retire later",
        "payload": {
            "p1": {
                "name": "Person 1",
                "start_age": 70,
                "cpp_start_age": 70,
                "cpp_annual_at_start": 17500,
                "oas_start_age": 70,
                "oas_annual_at_start": 9500,
                "tfsa_balance": 120000,
                "rrsp_balance": 350000,
                "rrif_balance": 0,
                "nonreg_balance": 180000,
                "nonreg_acb": 140000,
                "corporate_balance": 0
            },
            "p2": {
                "name": "Person 2",
                "start_age": 72,
                "cpp_start_age": 70,
                "cpp_annual_at_start": 16000,
                "oas_start_age": 70,
                "oas_annual_at_start": 9500,
                "tfsa_balance": 90000,
                "rrsp_balance": 0,
                "rrif_balance": 280000,
                "nonreg_balance": 120000,
                "nonreg_acb": 95000,
                "corporate_balance": 0
            },
            "province": "ON",
            "start_year": 2026,
            "end_age": 95,
            "strategy": "minimize-income",
            "spending_go_go": 65000,
            "go_go_end_age": 75,
            "spending_slow_go": 55000,
            "slow_go_end_age": 85,
            "spending_no_go": 45000,
            "spending_inflation": 2.0,
            "general_inflation": 2.0
        },
        "expected": {
            "first_year_age_p1": 70,
            "first_year_age_p2": 72,
            "min_years": 20,  # 70 to 95 is 26 years
            "success": True
        }
    }
]

def run_test(scenario: Dict[str, Any]) -> Dict[str, Any]:
    """Run a single test scenario"""
    import subprocess
    import tempfile

    print(f"\n{'='*80}")
    print(f"TEST: {scenario['name']}")
    print(f"{'='*80}")
    print(f"Description: {scenario['description']}")
    print(f"Ages: P1={scenario['payload']['p1']['start_age']}, P2={scenario['payload']['p2']['start_age']}")

    # Write payload to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(scenario['payload'], f)
        temp_file = f.name

    try:
        # Call API
        cmd = [
            'curl', '-s', '-X', 'POST',
            'http://localhost:8000/api/run-simulation',
            '-H', 'Content-Type: application/json',
            '-d', f'@{temp_file}'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

        if result.returncode != 0:
            return {
                "passed": False,
                "error": f"API call failed: {result.stderr}",
                "scenario": scenario['name']
            }

        # Parse response
        try:
            response = json.loads(result.stdout)
        except json.JSONDecodeError as e:
            return {
                "passed": False,
                "error": f"Failed to parse JSON response: {e}",
                "scenario": scenario['name']
            }

        # Validate response
        checks = []

        # Check success
        if response.get('success') == scenario['expected']['success']:
            checks.append(("✅", "Simulation succeeded"))
        else:
            checks.append(("❌", f"Expected success={scenario['expected']['success']}, got {response.get('success')}"))

        # Check year_by_year data exists
        if 'year_by_year' in response and len(response['year_by_year']) > 0:
            checks.append(("✅", f"Year-by-year data present ({len(response['year_by_year'])} years)"))

            first_year = response['year_by_year'][0]

            # Check first year ages
            if first_year.get('age_p1') == scenario['expected']['first_year_age_p1']:
                checks.append(("✅", f"P1 starts at age {first_year['age_p1']}"))
            else:
                checks.append(("❌", f"P1 age mismatch: expected {scenario['expected']['first_year_age_p1']}, got {first_year.get('age_p1')}"))

            if first_year.get('age_p2') == scenario['expected']['first_year_age_p2']:
                checks.append(("✅", f"P2 starts at age {first_year['age_p2']}"))
            else:
                checks.append(("❌", f"P2 age mismatch: expected {scenario['expected']['first_year_age_p2']}, got {first_year.get('age_p2')}"))

            # Check minimum number of years
            if len(response['year_by_year']) >= scenario['expected']['min_years']:
                checks.append(("✅", f"Sufficient years simulated ({len(response['year_by_year'])} >= {scenario['expected']['min_years']})"))
            else:
                checks.append(("❌", f"Too few years: {len(response['year_by_year'])} < {scenario['expected']['min_years']}"))

            # Show first 3 years
            print("\n📊 First 3 Years:")
            for year in response['year_by_year'][:3]:
                print(f"  Year {year['year']}: P1 Age {year['age_p1']}, P2 Age {year['age_p2']}, " +
                      f"Spending: ${year.get('spending_met', 0):,.0f}")

            # Show last year
            last_year = response['year_by_year'][-1]
            print(f"\n📊 Last Year ({last_year['year']}):")
            print(f"  P1 Age: {last_year['age_p1']}, P2 Age: {last_year['age_p2']}")
            print(f"  Portfolio: ${response.get('final_portfolio', 0):,.0f}")

        else:
            checks.append(("❌", "No year-by-year data in response"))

        # Print check results
        print("\n🔍 Validation Checks:")
        for status, message in checks:
            print(f"  {status} {message}")

        # Determine if test passed
        passed = all(status == "✅" for status, _ in checks)

        return {
            "passed": passed,
            "scenario": scenario['name'],
            "checks": checks,
            "response": response
        }

    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "error": "API call timed out after 30 seconds",
            "scenario": scenario['name']
        }
    except Exception as e:
        return {
            "passed": False,
            "error": f"Unexpected error: {str(e)}",
            "scenario": scenario['name']
        }
    finally:
        import os
        try:
            os.unlink(temp_file)
        except:
            pass

def main():
    """Run all test scenarios"""
    print("🧪 END-TO-END TEST SUITE: Future Retirement Age Planning")
    print("=" * 80)

    results = []

    for scenario in test_scenarios:
        result = run_test(scenario)
        results.append(result)

    # Print summary
    print("\n" + "=" * 80)
    print("📋 TEST SUMMARY")
    print("=" * 80)

    passed = sum(1 for r in results if r['passed'])
    total = len(results)

    for result in results:
        status = "✅ PASSED" if result['passed'] else "❌ FAILED"
        print(f"{status}: {result['scenario']}")
        if 'error' in result:
            print(f"  Error: {result['error']}")

    print("\n" + "=" * 80)
    print(f"TOTAL: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
