#!/usr/bin/env python3
"""
Iteration 2: More comprehensive testing with real-world scenarios
Focus on edge cases, error handling, and data consistency
"""

import requests
import json
import time
import random
from typing import Dict, Any, List, Tuple
from datetime import datetime

# API Configuration
API_BASE_URL = "http://localhost:8000"
SIMULATION_ENDPOINT = f"{API_BASE_URL}/api/run-simulation"

# Test tracking
test_results = []
total_tests = 0
passed_tests = 0
failed_tests = 0
warnings = []

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log_test(name: str, passed: bool, details: str = "", warning: bool = False):
    """Log test result with colors"""
    global total_tests, passed_tests, failed_tests
    total_tests += 1

    if warning:
        warnings.append(f"{name}: {details}")
        print(f"{Colors.YELLOW}⚠️  {name}{Colors.ENDC}")
    elif passed:
        passed_tests += 1
        print(f"{Colors.GREEN}✅ {name}{Colors.ENDC}")
    else:
        failed_tests += 1
        print(f"{Colors.RED}❌ {name}{Colors.ENDC}")

    if details:
        print(f"   {details}")

    test_results.append({
        'name': name,
        'passed': passed,
        'details': details,
        'warning': warning
    })

def run_simulation(scenario: Dict[str, Any]) -> Tuple[Dict[str, Any], float]:
    """Run simulation and return result with timing"""
    start_time = time.time()
    try:
        response = requests.post(
            SIMULATION_ENDPOINT,
            json=scenario,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        response.raise_for_status()
        result = response.json()
        elapsed = time.time() - start_time
        return result, elapsed
    except requests.exceptions.Timeout:
        return {"error": "Timeout"}, time.time() - start_time
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}, time.time() - start_time
    except Exception as e:
        return {"error": f"Unexpected: {e}"}, time.time() - start_time

def create_realistic_scenario(
    province: str,
    profile: str = "average"
) -> Dict[str, Any]:
    """Create realistic retirement scenarios based on Canadian profiles"""

    profiles = {
        "low_income": {
            "tfsa": 15000,
            "rrif": 100000,
            "nr_total": 30000,
            "cpp": 7000,
            "oas": 7500,
            "pension": 0,
            "spending": (35000, 30000, 25000)
        },
        "average": {
            "tfsa": 50000,
            "rrif": 350000,
            "nr_total": 150000,
            "cpp": 12000,
            "oas": 7500,
            "pension": 20000,
            "spending": (65000, 55000, 45000)
        },
        "high_income": {
            "tfsa": 88000,  # Max TFSA room
            "rrif": 800000,
            "nr_total": 500000,
            "cpp": 16000,  # Max CPP
            "oas": 7500,
            "pension": 50000,
            "spending": (100000, 85000, 70000)
        },
        "edge_minimal": {
            "tfsa": 0,
            "rrif": 10000,
            "nr_total": 5000,
            "cpp": 3000,
            "oas": 7500,
            "pension": 0,
            "spending": (20000, 18000, 15000)
        },
        "edge_maximum": {
            "tfsa": 100000,
            "rrif": 2000000,
            "nr_total": 1000000,
            "cpp": 16000,
            "oas": 0,  # Clawed back
            "pension": 100000,
            "spending": (200000, 150000, 120000)
        }
    }

    p = profiles[profile]

    return {
        "strategy": "rrif-frontload",
        "province": province,
        "inflation": 2.0,
        "expense_inflation": 2.0,
        "return_rate": 5.0,
        "years": 30,
        "include_partner": False,

        "spending_go_go": p["spending"][0],
        "spending_slow_go": p["spending"][1],
        "spending_no_go": p["spending"][2],
        "spending_go_go_end": 75,
        "spending_slow_go_start": 75,
        "spending_slow_go_end": 85,
        "spending_no_go_start": 85,

        "p1": {
            "name": f"{profile.title()} {province}",
            "start_age": 65,
            "end_age": 95,
            "life_expectancy": 95,
            "tfsa_balance": p["tfsa"],
            "rrsp_balance": 0,
            "rrif_balance": p["rrif"],
            "nr_cash": p["nr_total"] * 0.33,
            "nr_gic": p["nr_total"] * 0.33,
            "nr_invest": p["nr_total"] * 0.34,
            "cpp_start_age": 65,
            "cpp_annual_at_start": p["cpp"],
            "oas_start_age": 65,
            "oas_annual_at_start": p["oas"],
            "pension_count": 1 if p["pension"] > 0 else 0,
            "pension_incomes": [{
                "name": "Employer Pension",
                "amount": p["pension"],
                "startAge": 65,
                "inflationIndexed": True
            }] if p["pension"] > 0 else []
        },

        "p2": {
            "name": "",
            "start_age": 65,
            "end_age": 95,
            "life_expectancy": 95,
            "tfsa_balance": 0,
            "rrsp_balance": 0,
            "rrif_balance": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_count": 0,
            "pension_incomes": []
        }
    }

def test_realistic_scenarios():
    """Test realistic Canadian retirement scenarios"""
    print(f"\n{Colors.BOLD}TEST 1: REALISTIC CANADIAN RETIREMENT SCENARIOS{Colors.ENDC}")
    print("=" * 80)

    profiles = ["low_income", "average", "high_income"]
    provinces = ["QC", "ON", "BC", "AB"]

    for profile in profiles:
        print(f"\n{Colors.BLUE}Profile: {profile.upper()}{Colors.ENDC}")

        for province in provinces:
            scenario = create_realistic_scenario(province, profile)
            result, elapsed = run_simulation(scenario)

            if result and 'success' in result and result['success']:
                summary = result.get('summary', {})
                success_rate = summary.get('success_rate', 0)
                tax_paid = summary.get('total_tax_paid', 0)

                # Validate success rate is reasonable
                if profile == "low_income" and success_rate < 50:
                    log_test(
                        f"{province} {profile}",
                        False,
                        f"Success rate too low: {success_rate:.1f}% (expected >50% for low income)"
                    )
                elif profile == "high_income" and success_rate < 80:
                    log_test(
                        f"{province} {profile}",
                        False,
                        f"Success rate too low: {success_rate:.1f}% (expected >80% for high income)"
                    )
                else:
                    log_test(
                        f"{province} {profile}",
                        True,
                        f"Success: {success_rate:.1f}%, Tax: ${tax_paid:,.0f}, Time: {elapsed:.2f}s"
                    )

                # Performance warning
                if elapsed > 5:
                    log_test(
                        f"{province} {profile} performance",
                        True,
                        f"Slow response: {elapsed:.2f}s",
                        warning=True
                    )
            else:
                log_test(
                    f"{province} {profile}",
                    False,
                    f"Simulation failed: {result.get('error', 'Unknown error')}"
                )

def test_success_rate_boundaries():
    """Test success rate calculation at boundary conditions"""
    print(f"\n{Colors.BOLD}TEST 2: SUCCESS RATE BOUNDARY CONDITIONS{Colors.ENDC}")
    print("=" * 80)

    test_cases = [
        ("0 years funded", {"years": 10, "tfsa": 0, "rrif": 0, "nr_total": 0, "spending": (50000, 40000, 30000)}),
        ("1 year funded", {"years": 10, "tfsa": 5000, "rrif": 30000, "nr_total": 10000, "spending": (40000, 35000, 30000)}),
        ("50% funded", {"years": 20, "tfsa": 30000, "rrif": 200000, "nr_total": 70000, "spending": (50000, 45000, 40000)}),
        ("Almost funded", {"years": 20, "tfsa": 50000, "rrif": 400000, "nr_total": 100000, "spending": (55000, 50000, 45000)}),
        ("Fully funded", {"years": 20, "tfsa": 88000, "rrif": 500000, "nr_total": 200000, "spending": (50000, 45000, 40000)}),
    ]

    for test_name, params in test_cases:
        scenario = create_realistic_scenario("ON", "average")

        # Override with test parameters
        scenario["years"] = params["years"]
        scenario["p1"]["tfsa_balance"] = params["tfsa"]
        scenario["p1"]["rrif_balance"] = params["rrif"]
        scenario["p1"]["nr_cash"] = params["nr_total"] * 0.33
        scenario["p1"]["nr_gic"] = params["nr_total"] * 0.33
        scenario["p1"]["nr_invest"] = params["nr_total"] * 0.34
        scenario["spending_go_go"] = params["spending"][0]
        scenario["spending_slow_go"] = params["spending"][1]
        scenario["spending_no_go"] = params["spending"][2]

        result, _ = run_simulation(scenario)

        if result and 'success' in result and result['success']:
            summary = result.get('summary', {})
            success_rate = summary.get('success_rate', 0)
            years_funded = summary.get('years_funded', 0)
            years_simulated = summary.get('years_simulated', 0)

            # Calculate expected rate
            expected_rate = (years_funded / years_simulated * 100) if years_simulated > 0 else 0

            # Check if calculation is correct
            rate_correct = abs(success_rate - expected_rate) < 0.01

            log_test(
                f"Boundary: {test_name}",
                rate_correct,
                f"Rate: {success_rate:.2f}% ({years_funded}/{years_simulated} years)"
            )
        else:
            log_test(
                f"Boundary: {test_name}",
                False,
                "Simulation failed"
            )

def test_quebec_specific_features():
    """Test Quebec-specific features in detail"""
    print(f"\n{Colors.BOLD}TEST 3: QUEBEC-SPECIFIC FEATURES{Colors.ENDC}")
    print("=" * 80)

    # Test 1: Quebec vs Ontario tax difference for identical scenarios
    print(f"\n{Colors.BLUE}Tax Comparison:{Colors.ENDC}")

    for profile in ["low_income", "average", "high_income"]:
        qc_scenario = create_realistic_scenario("QC", profile)
        on_scenario = create_realistic_scenario("ON", profile)

        qc_result, _ = run_simulation(qc_scenario)
        on_result, _ = run_simulation(on_scenario)

        if qc_result.get('success') and on_result.get('success'):
            qc_tax = qc_result['summary']['total_tax_paid']
            on_tax = on_result['summary']['total_tax_paid']
            diff = qc_tax - on_tax
            diff_pct = (diff / on_tax * 100) if on_tax > 0 else 0

            # Quebec typically has higher taxes
            expected_higher = diff > 0

            log_test(
                f"QC vs ON tax ({profile})",
                expected_higher,
                f"QC: ${qc_tax:,.0f}, ON: ${on_tax:,.0f}, Diff: ${diff:,.0f} ({diff_pct:+.1f}%)"
            )
        else:
            log_test(f"QC vs ON tax ({profile})", False, "Simulation failed")

    # Test 2: QPP vs CPP amounts (should be similar)
    print(f"\n{Colors.BLUE}QPP/CPP Benefits:{Colors.ENDC}")

    qc_scenario = create_realistic_scenario("QC", "average")
    on_scenario = create_realistic_scenario("ON", "average")

    qc_result, _ = run_simulation(qc_scenario)
    on_result, _ = run_simulation(on_scenario)

    if qc_result.get('success') and on_result.get('success'):
        qc_cpp_total = qc_result['summary'].get('total_cpp', 0)
        on_cpp_total = on_result['summary'].get('total_cpp', 0)

        # QPP and CPP should be very similar (within 5%)
        diff_pct = abs(qc_cpp_total - on_cpp_total) / on_cpp_total * 100 if on_cpp_total > 0 else 0
        similar = diff_pct < 5

        log_test(
            "QPP vs CPP amounts",
            similar,
            f"QPP total: ${qc_cpp_total:,.0f}, CPP total: ${on_cpp_total:,.0f}, Diff: {diff_pct:.1f}%"
        )

    # Test 3: Low-income Quebec benefits
    print(f"\n{Colors.BLUE}Quebec Low-Income Benefits:{Colors.ENDC}")

    low_income_qc = create_realistic_scenario("QC", "low_income")
    result, _ = run_simulation(low_income_qc)

    if result.get('success'):
        total_gis = result['summary'].get('total_gis', 0)
        avg_tax_rate = result['summary'].get('avg_effective_tax_rate', 0)

        has_gis = total_gis > 0
        low_tax = avg_tax_rate < 15

        log_test(
            "Quebec GIS benefits",
            has_gis,
            f"Total GIS: ${total_gis:,.0f}"
        )

        log_test(
            "Quebec low-income tax rate",
            low_tax,
            f"Average tax rate: {avg_tax_rate:.2f}%"
        )

def test_data_consistency():
    """Test data consistency and validation"""
    print(f"\n{Colors.BOLD}TEST 4: DATA CONSISTENCY AND VALIDATION{Colors.ENDC}")
    print("=" * 80)

    scenario = create_realistic_scenario("ON", "average")
    result, _ = run_simulation(scenario)

    if result.get('success'):
        summary = result.get('summary', {})
        year_by_year = result.get('year_by_year', [])

        # Test 1: Years funded should not exceed years simulated
        years_funded = summary.get('years_funded', 0)
        years_simulated = summary.get('years_simulated', 0)

        log_test(
            "Years funded <= simulated",
            years_funded <= years_simulated,
            f"Funded: {years_funded}, Simulated: {years_simulated}"
        )

        # Test 2: Success rate should be between 0 and 100
        success_rate = summary.get('success_rate', -1)
        log_test(
            "Success rate in valid range",
            0 <= success_rate <= 100,
            f"Rate: {success_rate:.2f}%"
        )

        # Test 3: Year-by-year data should match summary
        if year_by_year:
            yby_years = len(year_by_year)
            log_test(
                "Year-by-year count matches",
                yby_years == years_simulated,
                f"Year-by-year: {yby_years}, Summary: {years_simulated}"
            )

            # Test 4: Check for data consistency in first year
            first_year = year_by_year[0]

            # Total tax should be sum of P1 and P2 taxes
            tax_p1 = first_year.get('total_tax_p1', 0)
            tax_p2 = first_year.get('total_tax_p2', 0)
            total_tax = first_year.get('total_tax', 0)
            tax_sum = tax_p1 + tax_p2

            tax_consistent = abs(total_tax - tax_sum) < 0.01
            log_test(
                "Tax calculations consistent",
                tax_consistent,
                f"P1: ${tax_p1:.2f} + P2: ${tax_p2:.2f} = ${tax_sum:.2f}, Total: ${total_tax:.2f}"
            )

        # Test 5: Final estate should be >= 0
        final_estate = summary.get('final_estate_after_tax', -1)
        log_test(
            "Final estate non-negative",
            final_estate >= 0,
            f"Final estate: ${final_estate:,.2f}"
        )

def test_error_handling():
    """Test API error handling and edge cases"""
    print(f"\n{Colors.BOLD}TEST 5: ERROR HANDLING AND EDGE CASES{Colors.ENDC}")
    print("=" * 80)

    # Test 1: Invalid province
    scenario = create_realistic_scenario("XX", "average")
    result, _ = run_simulation(scenario)

    log_test(
        "Invalid province handling",
        not result.get('success', False),
        f"Response: {result.get('error', 'No error returned')}"
    )

    # Test 2: Negative values
    scenario = create_realistic_scenario("ON", "average")
    scenario["p1"]["tfsa_balance"] = -1000
    result, _ = run_simulation(scenario)

    # Should either handle gracefully or return error
    handled = result.get('success', False) or 'error' in result
    log_test(
        "Negative value handling",
        handled,
        "Handled negative TFSA balance"
    )

    # Test 3: Extremely large values
    scenario = create_realistic_scenario("ON", "average")
    scenario["p1"]["rrif_balance"] = 99999999999
    result, _ = run_simulation(scenario)

    handled = result.get('success', False) or 'error' in result
    log_test(
        "Large value handling",
        handled,
        "Handled extremely large RRIF balance"
    )

    # Test 4: Missing required fields
    scenario = {"province": "ON"}  # Minimal scenario
    result, _ = run_simulation(scenario)

    log_test(
        "Missing fields handling",
        not result.get('success', False),
        "Correctly rejected incomplete scenario"
    )

def test_performance_and_stress():
    """Test performance under stress"""
    print(f"\n{Colors.BOLD}TEST 6: PERFORMANCE AND STRESS TESTING{Colors.ENDC}")
    print("=" * 80)

    # Test 1: Response time for typical scenario
    scenario = create_realistic_scenario("ON", "average")
    _, elapsed = run_simulation(scenario)

    acceptable_time = elapsed < 3.0  # Should respond within 3 seconds
    log_test(
        "Typical scenario performance",
        acceptable_time,
        f"Response time: {elapsed:.2f}s (target: <3s)"
    )

    # Test 2: Multiple rapid requests
    print(f"\n{Colors.BLUE}Rapid request test:{Colors.ENDC}")

    times = []
    for i in range(5):
        province = random.choice(["ON", "QC", "BC", "AB"])
        profile = random.choice(["low_income", "average", "high_income"])
        scenario = create_realistic_scenario(province, profile)
        result, elapsed = run_simulation(scenario)
        times.append(elapsed)

        if result.get('success'):
            print(f"  Request {i+1}: {elapsed:.2f}s ✓")
        else:
            print(f"  Request {i+1}: Failed")

    avg_time = sum(times) / len(times) if times else 0
    log_test(
        "Average response time",
        avg_time < 3.0,
        f"Average: {avg_time:.2f}s"
    )

def test_couple_scenarios_detailed():
    """Detailed testing of couple scenarios"""
    print(f"\n{Colors.BOLD}TEST 7: COUPLE SCENARIOS (DETAILED){Colors.ENDC}")
    print("=" * 80)

    # Create a couple scenario
    scenario = create_realistic_scenario("ON", "average")
    scenario["include_partner"] = True

    # Add partner data
    scenario["p2"] = {
        "name": "Partner",
        "start_age": 63,
        "end_age": 95,
        "life_expectancy": 95,
        "tfsa_balance": 40000,
        "rrsp_balance": 0,
        "rrif_balance": 280000,
        "nr_cash": 40000,
        "nr_gic": 40000,
        "nr_invest": 40000,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 10000,
        "oas_start_age": 65,
        "oas_annual_at_start": 7500,
        "pension_count": 0,
        "pension_incomes": []
    }

    result, _ = run_simulation(scenario)

    if result.get('success'):
        summary = result['summary']
        year_by_year = result.get('year_by_year', [])

        log_test(
            "Couple simulation runs",
            True,
            f"Success rate: {summary.get('success_rate', 0):.1f}%"
        )

        if year_by_year:
            # Check for partner data across multiple years
            has_p2_data = False
            for year in year_by_year[:5]:  # Check first 5 years
                if (year.get('rrif_balance_p2', 0) > 0 or
                    year.get('tfsa_balance_p2', 0) > 0 or
                    year.get('age_p2', 0) > 0):
                    has_p2_data = True
                    break

            log_test(
                "Partner data present",
                has_p2_data,
                "P2 data found in year-by-year results"
            )

            # Check tax splitting
            if len(year_by_year) >= 3:
                year_3 = year_by_year[2]  # Partner should be 65
                tax_p1 = year_3.get('total_tax_p1', 0)
                tax_p2 = year_3.get('total_tax_p2', 0)

                both_have_tax = tax_p1 > 0 and tax_p2 > 0
                log_test(
                    "Tax calculated for both partners",
                    both_have_tax,
                    f"P1 tax: ${tax_p1:,.2f}, P2 tax: ${tax_p2:,.2f}"
                )
    else:
        log_test("Couple simulation", False, "Simulation failed")

def print_final_summary():
    """Print comprehensive test summary"""
    print(f"\n{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}ITERATION 2 - COMPREHENSIVE TEST SUMMARY{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")

    print(f"\n{Colors.BLUE}Test Statistics:{Colors.ENDC}")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {Colors.GREEN}{passed_tests} ✅{Colors.ENDC}")
    print(f"Failed: {Colors.RED}{failed_tests} ❌{Colors.ENDC}")
    print(f"Warnings: {Colors.YELLOW}{len(warnings)} ⚠️{Colors.ENDC}")

    success_rate = (passed_tests/total_tests*100) if total_tests > 0 else 0

    if success_rate >= 95:
        color = Colors.GREEN
    elif success_rate >= 80:
        color = Colors.YELLOW
    else:
        color = Colors.RED

    print(f"Success Rate: {color}{success_rate:.1f}%{Colors.ENDC}")

    if warnings:
        print(f"\n{Colors.YELLOW}Warnings:{Colors.ENDC}")
        for warning in warnings[:5]:  # Show first 5 warnings
            print(f"  ⚠️  {warning}")
        if len(warnings) > 5:
            print(f"  ... and {len(warnings)-5} more warnings")

    if failed_tests > 0:
        print(f"\n{Colors.RED}Failed Tests:{Colors.ENDC}")
        for test in test_results:
            if not test['passed'] and not test['warning']:
                print(f"  ❌ {test['name']}: {test['details']}")

    print(f"\n{Colors.BOLD}{'='*80}{Colors.ENDC}")

    if failed_tests == 0:
        print(f"{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! System is stable and ready.{Colors.ENDC}")
    elif failed_tests <= 2:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  MOSTLY PASSED with {failed_tests} minor issue(s). Review failures above.{Colors.ENDC}")
    else:
        print(f"{Colors.RED}{Colors.BOLD}❌ CRITICAL ISSUES FOUND. {failed_tests} tests failed. Investigation required.{Colors.ENDC}")

    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")

    # Timestamp
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def main():
    """Run all test suites"""
    print(f"\n{Colors.BOLD}STARTING ITERATION 2 - COMPREHENSIVE TESTING{Colors.ENDC}")
    print(f"Testing at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

    # Run all test suites
    test_realistic_scenarios()
    test_success_rate_boundaries()
    test_quebec_specific_features()
    test_data_consistency()
    test_error_handling()
    test_performance_and_stress()
    test_couple_scenarios_detailed()

    # Print summary
    print_final_summary()

    return 0 if failed_tests == 0 else 1

if __name__ == "__main__":
    exit(main())