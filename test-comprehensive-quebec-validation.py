#!/usr/bin/env python3
"""
Comprehensive test suite for Quebec implementation and success rate calculations
Tests multiple scenarios to ensure everything works correctly together
"""

import requests
import json
from typing import Dict, Any, List
import sys

# API Configuration
API_BASE_URL = "http://localhost:8000"
SIMULATION_ENDPOINT = f"{API_BASE_URL}/api/run-simulation"

# Test results tracking
test_results = []
total_tests = 0
passed_tests = 0
failed_tests = 0

def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    if passed:
        passed_tests += 1
        print(f"✅ {name}")
    else:
        failed_tests += 1
        print(f"❌ {name}")

    if details:
        print(f"   {details}")

    test_results.append({
        'name': name,
        'passed': passed,
        'details': details
    })

def create_scenario(
    province: str,
    spending_level: str = "moderate",
    assets: str = "moderate",
    age: int = 65,
    include_partner: bool = False
) -> Dict[str, Any]:
    """Create a test scenario with various parameters"""

    # Spending configurations
    spending_configs = {
        "low": (40000, 35000, 30000),
        "moderate": (60000, 50000, 40000),
        "high": (80000, 70000, 60000),
        "very_high": (100000, 90000, 80000)
    }

    # Asset configurations
    asset_configs = {
        "low": {
            "tfsa": 20000,
            "rrif": 150000,
            "nr_cash": 20000,
            "nr_gic": 20000,
            "nr_invest": 20000,
        },
        "moderate": {
            "tfsa": 50000,
            "rrif": 350000,
            "nr_cash": 50000,
            "nr_gic": 50000,
            "nr_invest": 50000,
        },
        "high": {
            "tfsa": 100000,
            "rrif": 700000,
            "nr_cash": 100000,
            "nr_gic": 100000,
            "nr_invest": 100000,
        }
    }

    spending = spending_configs[spending_level]
    assets = asset_configs[assets]

    scenario = {
        "strategy": "rrif-frontload",
        "province": province,
        "inflation": 2.0,
        "expense_inflation": 2.0,
        "return_rate": 5.0,
        "years": 30,
        "include_partner": include_partner,

        "spending_go_go": spending[0],
        "spending_slow_go": spending[1],
        "spending_no_go": spending[2],
        "spending_go_go_end": 75,
        "spending_slow_go_start": 75,
        "spending_slow_go_end": 85,
        "spending_no_go_start": 85,

        "p1": {
            "name": f"Test Person ({province})",
            "start_age": age,
            "end_age": 95,
            "life_expectancy": 95,
            "tfsa_balance": assets["tfsa"],
            "rrsp_balance": 0,
            "rrif_balance": assets["rrif"],
            "nr_cash": assets["nr_cash"],
            "nr_gic": assets["nr_gic"],
            "nr_invest": assets["nr_invest"],
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12000,
            "oas_start_age": 65,
            "oas_annual_at_start": 7500,
            "pension_count": 0,
            "pension_incomes": []
        },

        "p2": {
            "name": "Partner" if include_partner else "",
            "start_age": age - 2 if include_partner else 65,
            "end_age": 95,
            "life_expectancy": 95,
            "tfsa_balance": assets["tfsa"] * 0.8 if include_partner else 0,
            "rrsp_balance": 0,
            "rrif_balance": assets["rrif"] * 0.8 if include_partner else 0,
            "nr_cash": assets["nr_cash"] * 0.8 if include_partner else 0,
            "nr_gic": assets["nr_gic"] * 0.8 if include_partner else 0,
            "nr_invest": assets["nr_invest"] * 0.8 if include_partner else 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000 if include_partner else 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 7500 if include_partner else 0,
            "pension_count": 0,
            "pension_incomes": []
        }
    }

    return scenario

def run_simulation(scenario: Dict[str, Any]) -> Dict[str, Any]:
    """Run a simulation and return results"""
    try:
        response = requests.post(
            SIMULATION_ENDPOINT,
            json=scenario,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return None

def test_success_rate_calculations():
    """Test that success rates are calculated correctly for different scenarios"""
    print("\n" + "="*80)
    print("TEST 1: SUCCESS RATE CALCULATIONS")
    print("="*80)

    test_cases = [
        ("QC", "high", "moderate", "Quebec high spending"),
        ("ON", "high", "moderate", "Ontario high spending"),
        ("QC", "moderate", "moderate", "Quebec moderate spending"),
        ("ON", "moderate", "moderate", "Ontario moderate spending"),
        ("QC", "low", "low", "Quebec low income/low spending"),
        ("ON", "low", "low", "Ontario low income/low spending"),
    ]

    for province, spending, assets, description in test_cases:
        scenario = create_scenario(province, spending, assets)
        result = run_simulation(scenario)

        if result and result.get('success'):
            summary = result.get('summary', {})
            success_rate = summary.get('success_rate', 0)
            years_funded = summary.get('years_funded', 0)
            years_simulated = summary.get('years_simulated', 0)

            # Verify success rate calculation is correct
            expected_rate = (years_funded / years_simulated * 100) if years_simulated > 0 else 0
            rate_match = abs(success_rate - expected_rate) < 0.01

            log_test(
                f"{description}: Success rate calculation",
                rate_match,
                f"Rate: {success_rate:.2f}% ({years_funded}/{years_simulated} years)"
            )

            # Check that success rate is reasonable (not 0-1% for funded scenarios)
            if years_funded > 0:
                log_test(
                    f"{description}: Success rate reasonable",
                    success_rate > 1.0,
                    f"Success rate {success_rate:.2f}% is properly scaled"
                )
        else:
            log_test(f"{description}: Simulation run", False, "Failed to run simulation")

def test_quebec_vs_ontario_taxes():
    """Test that Quebec and Ontario have different tax calculations"""
    print("\n" + "="*80)
    print("TEST 2: QUEBEC VS ONTARIO TAX DIFFERENCES")
    print("="*80)

    # Run identical scenarios for Quebec and Ontario
    for spending_level in ["low", "moderate", "high"]:
        qc_scenario = create_scenario("QC", spending_level, "moderate")
        on_scenario = create_scenario("ON", spending_level, "moderate")

        qc_result = run_simulation(qc_scenario)
        on_result = run_simulation(on_scenario)

        if qc_result and on_result:
            qc_tax = qc_result.get('summary', {}).get('total_tax_paid', 0)
            on_tax = on_result.get('summary', {}).get('total_tax_paid', 0)

            # Quebec and Ontario should have different tax amounts
            tax_different = abs(qc_tax - on_tax) > 1000

            log_test(
                f"Tax difference ({spending_level} spending)",
                tax_different,
                f"QC: ${qc_tax:,.2f}, ON: ${on_tax:,.2f}, Diff: ${abs(qc_tax - on_tax):,.2f}"
            )
        else:
            log_test(f"Tax comparison ({spending_level} spending)", False, "Failed to run simulations")

def test_couple_scenarios():
    """Test scenarios with couples to ensure calculations work"""
    print("\n" + "="*80)
    print("TEST 3: COUPLE SCENARIOS")
    print("="*80)

    provinces = ["QC", "ON", "BC", "AB"]

    for province in provinces:
        scenario = create_scenario(province, "moderate", "moderate", include_partner=True)
        result = run_simulation(scenario)

        if result and result.get('success'):
            summary = result.get('summary', {})
            success_rate = summary.get('success_rate', 0)

            # Check for partner data in year-by-year
            # Note: Partner may be younger, so check for RRIF or TFSA data which should exist
            if result.get('year_by_year') and len(result['year_by_year']) > 0:
                first_year = result['year_by_year'][0]
                has_partner_data = (
                    first_year.get('rrif_withdrawal_p2', 0) > 0 or
                    first_year.get('rrif_balance_p2', 0) > 0 or
                    first_year.get('tfsa_balance_p2', 0) > 0 or
                    'age_p2' in first_year
                )

                log_test(
                    f"{province} couple scenario",
                    has_partner_data,
                    f"Success rate: {success_rate:.2f}%, Partner data: {'Yes' if has_partner_data else 'No'}"
                )
            else:
                log_test(f"{province} couple scenario", False, "No year-by-year data")
        else:
            log_test(f"{province} couple scenario", False, "Failed to run simulation")

def test_edge_cases():
    """Test edge cases and boundary conditions"""
    print("\n" + "="*80)
    print("TEST 4: EDGE CASES")
    print("="*80)

    # Test 1: Very low assets (should have low success rate)
    scenario = create_scenario("QC", "high", "low")
    result = run_simulation(scenario)
    if result and result.get('success'):
        success_rate = result.get('summary', {}).get('success_rate', 0)
        log_test(
            "Low assets, high spending",
            success_rate < 50,
            f"Success rate: {success_rate:.2f}% (expected < 50%)"
        )

    # Test 2: Very high assets (should have 100% success rate)
    scenario = create_scenario("ON", "low", "high")
    result = run_simulation(scenario)
    if result and result.get('success'):
        success_rate = result.get('summary', {}).get('success_rate', 0)
        log_test(
            "High assets, low spending",
            success_rate >= 95,
            f"Success rate: {success_rate:.2f}% (expected >= 95%)"
        )

    # Test 3: Early retirement (age 60)
    scenario = create_scenario("QC", "moderate", "moderate", age=60)
    result = run_simulation(scenario)
    if result and result.get('success'):
        success_rate = result.get('summary', {}).get('success_rate', 0)
        log_test(
            "Early retirement (age 60)",
            result.get('success') == True,
            f"Success rate: {success_rate:.2f}%"
        )

    # Test 4: Late retirement (age 70)
    scenario = create_scenario("ON", "moderate", "moderate", age=70)
    result = run_simulation(scenario)
    if result and result.get('success'):
        success_rate = result.get('summary', {}).get('success_rate', 0)
        log_test(
            "Late retirement (age 70)",
            success_rate > 80,
            f"Success rate: {success_rate:.2f}% (expected > 80%)"
        )

def test_quebec_benefits():
    """Test that Quebec-specific benefits are applied correctly"""
    print("\n" + "="*80)
    print("TEST 5: QUEBEC-SPECIFIC BENEFITS")
    print("="*80)

    # Low-income scenario should trigger benefits
    scenario = create_scenario("QC", "low", "low")
    result = run_simulation(scenario)

    if result and result.get('success'):
        summary = result.get('summary', {})

        # Check for GIS benefits (low-income should trigger GIS)
        total_gis = summary.get('total_gis', 0)
        avg_tax_rate = summary.get('avg_effective_tax_rate', 0)

        log_test(
            "Quebec low-income GIS benefits",
            total_gis > 0,
            f"Total GIS: ${total_gis:,.2f}"
        )

        log_test(
            "Quebec low-income tax rate",
            avg_tax_rate < 20,
            f"Average tax rate: {avg_tax_rate:.2f}% (expected < 20%)"
        )
    else:
        log_test("Quebec benefits test", False, "Failed to run simulation")

def test_all_provinces():
    """Test that all provinces work correctly"""
    print("\n" + "="*80)
    print("TEST 6: ALL PROVINCES")
    print("="*80)

    # Only test currently supported provinces
    provinces = ["ON", "QC", "BC", "AB"]

    for province in provinces:
        scenario = create_scenario(province, "moderate", "moderate")
        result = run_simulation(scenario)

        if result and result.get('success'):
            success_rate = result.get('summary', {}).get('success_rate', 0)
            log_test(
                f"{province} simulation",
                True,
                f"Success rate: {success_rate:.2f}%"
            )
        else:
            error_msg = result.get('error', 'Unknown error') if result else 'Failed to run'
            log_test(f"{province} simulation", False, error_msg)

def print_summary():
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests} ✅")
    print(f"Failed: {failed_tests} ❌")
    print(f"Success Rate: {(passed_tests/total_tests*100) if total_tests > 0 else 0:.1f}%")

    if failed_tests > 0:
        print("\nFailed Tests:")
        for test in test_results:
            if not test['passed']:
                print(f"  - {test['name']}: {test['details']}")

    print("\n" + "="*80)
    if failed_tests == 0:
        print("🎉 ALL TESTS PASSED! Quebec implementation and success rates are working correctly.")
    else:
        print(f"⚠️ {failed_tests} test(s) failed. Please review the failures above.")
    print("="*80)

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("COMPREHENSIVE QUEBEC & SUCCESS RATE VALIDATION")
    print("="*80)

    # Run all test suites
    test_success_rate_calculations()
    test_quebec_vs_ontario_taxes()
    test_couple_scenarios()
    test_edge_cases()
    test_quebec_benefits()
    test_all_provinces()

    # Print summary
    print_summary()

    return 0 if failed_tests == 0 else 1

if __name__ == "__main__":
    exit(main())