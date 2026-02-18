#!/usr/bin/env python3
"""
Comprehensive Test Suite for RRIF-Frontload Strategy
Ensures the application doesn't break and all features work correctly
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# API endpoint
API_URL = "http://localhost:8000/api/run-simulation"

class TestResult:
    """Track test results"""
    def __init__(self):
        self.passed = []
        self.failed = []
        self.errors = []

    def add_pass(self, test_name: str, message: str = ""):
        self.passed.append((test_name, message))
        print(f"✅ PASS: {test_name}")
        if message:
            print(f"   {message}")

    def add_fail(self, test_name: str, message: str):
        self.failed.append((test_name, message))
        print(f"❌ FAIL: {test_name}")
        print(f"   {message}")

    def add_error(self, test_name: str, error: Exception):
        self.errors.append((test_name, str(error)))
        print(f"🔥 ERROR: {test_name}")
        print(f"   {error}")

    def summary(self) -> bool:
        total = len(self.passed) + len(self.failed) + len(self.errors)
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {len(self.passed)}")
        print(f"❌ Failed: {len(self.failed)}")
        print(f"🔥 Errors: {len(self.errors)}")

        if self.failed:
            print("\nFailed Tests:")
            for test, msg in self.failed:
                print(f"  - {test}: {msg}")

        if self.errors:
            print("\nTests with Errors:")
            for test, err in self.errors:
                print(f"  - {test}: {err}")

        return len(self.failed) == 0 and len(self.errors) == 0


def run_simulation(test_data: Dict) -> Optional[Dict]:
    """Run a simulation and return results"""
    try:
        response = requests.post(API_URL, json=test_data, timeout=30)
        if response.status_code != 200:
            print(f"API Error: {response.status_code}")
            return None
        result = response.json()
        # Extract the years data from the API response structure
        if "year_by_year" in result:
            result["years"] = result["year_by_year"].get("years", [])
        return result
    except Exception as e:
        print(f"Request failed: {e}")
        return None


def test_basic_rrif_frontload(results: TestResult):
    """Test 1: Basic RRIF-Frontload functionality"""
    test_name = "Basic RRIF-Frontload (8% after OAS)"

    try:
        test_data = {
            "p1": {
                "name": "TestUser",
                "is_retired": True,
                "retirement_age": 65,
                "start_age": 70,  # Start after OAS
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 100000,
                "tfsa_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 8000,
                "oas_start_age": 65,
                "oas_amount": 7000,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 7000,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "p2": {
                "name": "",
                "is_retired": False,
                "retirement_age": 65,
                "start_age": 60,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 0,
                "tfsa_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 0,
                "oas_start_age": 65,
                "oas_amount": 0,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 0,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "household_is_couple": False,
            "withdrawal_strategy": "RRIF-Frontload (15%/8%)",
            "spending_go_go": 30000,  # Moderate spending
            "spending_slow_go": 25000,
            "spending_no_go": 20000,
            "go_go_end_age": 75,
            "slow_go_end_age": 85,
            "end_age": 85,
            "gap_tolerance": 100,
            "stop_on_fail": False,
            "general_inflation": 0.025,
            "spending_inflation": 0.025,
            "province": "ON",
            "start_year": 2025
        }

        result = run_simulation(test_data)
        if not result:
            results.add_error(test_name, Exception("Simulation failed to run"))
            return

        # Check first year RRIF withdrawal (should be ~8% of $100k = $8k)
        first_year = result.get("years", [{}])[0]
        rrif_withdrawal = first_year.get("withdraw_rrif_p1", 0)
        expected = 100000 * 0.08

        if abs(rrif_withdrawal - expected) < 1000:  # Within $1k tolerance
            results.add_pass(test_name, f"RRIF withdrawal ${rrif_withdrawal:.0f} (~8% as expected)")
        else:
            results.add_fail(test_name, f"Expected ~${expected:.0f}, got ${rrif_withdrawal:.0f}")

    except Exception as e:
        results.add_error(test_name, e)


def test_rrif_frontload_exceeds_standard(results: TestResult):
    """Test 2: RRIF withdrawals exceed standard when needed"""
    test_name = "RRIF-Frontload Exceeds Standard"

    try:
        test_data = {
            "p1": {
                "name": "HighSpender",
                "is_retired": True,
                "retirement_age": 65,
                "start_age": 70,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 200000,  # $200k RRIF
                "tfsa_balance": 10000,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 8000,
                "oas_start_age": 65,
                "oas_amount": 7000,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 7000,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "p2": {
                "name": "",
                "is_retired": False,
                "retirement_age": 65,
                "start_age": 60,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 0,
                "tfsa_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 0,
                "oas_start_age": 65,
                "oas_amount": 0,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 0,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "household_is_couple": False,
            "withdrawal_strategy": "RRIF-Frontload (15%/8%)",
            "spending_go_go": 80000,  # HIGH spending - needs more than 8% of RRIF
            "spending_slow_go": 60000,
            "spending_no_go": 40000,
            "go_go_end_age": 75,
            "slow_go_end_age": 85,
            "end_age": 85,
            "gap_tolerance": 100,
            "stop_on_fail": False,
            "general_inflation": 0.025,
            "spending_inflation": 0.025,
            "province": "ON",
            "start_year": 2025
        }

        result = run_simulation(test_data)
        if not result:
            results.add_error(test_name, Exception("Simulation failed to run"))
            return

        # Check if RRIF withdrawal exceeds 8%
        first_year = result.get("years", [{}])[0]
        rrif_withdrawal = first_year.get("withdraw_rrif_p1", 0)
        rrif_start = first_year.get("start_rrif_p1", 200000)
        percentage = (rrif_withdrawal / rrif_start * 100) if rrif_start > 0 else 0

        if percentage > 8.5:  # Should exceed 8%
            results.add_pass(test_name, f"RRIF withdrawal {percentage:.1f}% exceeds standard 8%")
        else:
            results.add_fail(test_name, f"RRIF withdrawal {percentage:.1f}% did not exceed 8% as needed")

    except Exception as e:
        results.add_error(test_name, e)


def test_rrif_frontload_indicator_fields(results: TestResult):
    """Test 3: RRIF frontload exceeded indicator fields are present"""
    test_name = "RRIF Frontload Indicator Fields"

    try:
        # Use same high-spending scenario
        test_data = {
            "p1": {
                "name": "TestIndicator",
                "is_retired": True,
                "retirement_age": 65,
                "start_age": 70,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 150000,
                "tfsa_balance": 5000,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 5000,
                "oas_start_age": 65,
                "oas_amount": 5000,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 7000,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "p2": {
                "name": "",
                "is_retired": False,
                "retirement_age": 65,
                "start_age": 60,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 0,
                "tfsa_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 0,
                "oas_start_age": 65,
                "oas_amount": 0,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 0,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "household_is_couple": False,
            "withdrawal_strategy": "RRIF-Frontload (15%/8%)",
            "spending_go_go": 70000,  # High spending
            "spending_slow_go": 50000,
            "spending_no_go": 35000,
            "go_go_end_age": 75,
            "slow_go_end_age": 85,
            "end_age": 85,
            "gap_tolerance": 100,
            "stop_on_fail": False,
            "general_inflation": 0.025,
            "spending_inflation": 0.025,
            "province": "AB",  # Alberta
            "start_year": 2025
        }

        result = run_simulation(test_data)
        if not result:
            results.add_error(test_name, Exception("Simulation failed to run"))
            return

        # Check if indicator fields exist
        first_year = result.get("years", [{}])[0]

        # Check for the new fields
        has_exceeded_field = "rrif_frontload_exceeded_p1" in first_year
        has_pct_field = "rrif_frontload_pct_p1" in first_year

        if has_exceeded_field and has_pct_field:
            exceeded = first_year.get("rrif_frontload_exceeded_p1", False)
            pct = first_year.get("rrif_frontload_pct_p1", 0)
            results.add_pass(test_name,
                f"Indicator fields present - Exceeded: {exceeded}, Pct: {pct:.1f}%")
        else:
            missing = []
            if not has_exceeded_field:
                missing.append("rrif_frontload_exceeded_p1")
            if not has_pct_field:
                missing.append("rrif_frontload_pct_p1")
            results.add_fail(test_name, f"Missing fields: {', '.join(missing)}")

    except Exception as e:
        results.add_error(test_name, e)


def test_no_false_gaps(results: TestResult):
    """Test 4: No false Gap status when assets are sufficient"""
    test_name = "No False Gap Status"

    try:
        test_data = {
            "p1": {
                "name": "NoFalseGap",
                "is_retired": False,
                "retirement_age": 67,
                "start_age": 60,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 500000,  # Plenty of assets
                "tfsa_balance": 100000,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 10000,
                "oas_start_age": 65,
                "oas_amount": 7500,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 7000,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "p2": {
                "name": "",
                "is_retired": False,
                "retirement_age": 65,
                "start_age": 60,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 0,
                "tfsa_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 0,
                "oas_start_age": 65,
                "oas_amount": 0,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 0,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "household_is_couple": False,
            "withdrawal_strategy": "RRIF-Frontload (15%/8%)",
            "spending_go_go": 60000,  # Reasonable spending
            "spending_slow_go": 50000,
            "spending_no_go": 40000,
            "go_go_end_age": 75,
            "slow_go_end_age": 85,
            "end_age": 85,
            "gap_tolerance": 100,
            "stop_on_fail": False,
            "general_inflation": 0.025,
            "spending_inflation": 0.025,
            "province": "ON",
            "start_year": 2025
        }

        result = run_simulation(test_data)
        if not result:
            results.add_error(test_name, Exception("Simulation failed to run"))
            return

        # Check first 5 retirement years for false gaps
        false_gaps = []
        for year_data in result.get("years", []):
            age = year_data.get("age_p1", 0)
            if age >= 67 and age <= 71:  # First 5 retirement years
                is_underfunded = year_data.get("is_underfunded", False)
                total_assets = (year_data.get("end_rrif_p1", 0) +
                              year_data.get("end_tfsa_p1", 0) +
                              year_data.get("end_nonreg_p1", 0) +
                              year_data.get("end_corp_p1", 0))

                if is_underfunded and total_assets > 50000:  # Has assets but showing gap
                    false_gaps.append(year_data.get("year"))

        if not false_gaps:
            results.add_pass(test_name, "No false Gap status in early retirement")
        else:
            results.add_fail(test_name, f"False gaps in years: {false_gaps}")

    except Exception as e:
        results.add_error(test_name, e)


def test_withdrawal_order(results: TestResult):
    """Test 5: RRIF is included in withdrawal order"""
    test_name = "RRIF in Withdrawal Order"

    try:
        # This test checks indirectly by ensuring RRIF can be withdrawn
        test_data = {
            "p1": {
                "name": "WithdrawalOrder",
                "is_retired": True,
                "retirement_age": 65,
                "start_age": 70,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 50000,  # Only RRIF
                "tfsa_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 0,  # No CPP
                "oas_start_age": 65,
                "oas_amount": 0,  # No OAS
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 0,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "p2": {
                "name": "",
                "is_retired": False,
                "retirement_age": 65,
                "start_age": 60,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 0,
                "tfsa_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 0,
                "oas_start_age": 65,
                "oas_amount": 0,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 0,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "household_is_couple": False,
            "withdrawal_strategy": "RRIF-Frontload (15%/8%)",
            "spending_go_go": 30000,  # Must come from RRIF
            "spending_slow_go": 25000,
            "spending_no_go": 20000,
            "go_go_end_age": 75,
            "slow_go_end_age": 85,
            "end_age": 85,
            "gap_tolerance": 100,
            "stop_on_fail": False,
            "general_inflation": 0.025,
            "spending_inflation": 0.025,
            "province": "ON",
            "start_year": 2025
        }

        result = run_simulation(test_data)
        if not result:
            results.add_error(test_name, Exception("Simulation failed to run"))
            return

        # Check that RRIF withdrawals happen
        first_year = result.get("years", [{}])[0]
        rrif_withdrawal = first_year.get("withdraw_rrif_p1", 0)

        if rrif_withdrawal > 0:
            results.add_pass(test_name, f"RRIF withdrawals working: ${rrif_withdrawal:.0f}")
        else:
            results.add_fail(test_name, "No RRIF withdrawals - order may be broken")

    except Exception as e:
        results.add_error(test_name, e)


def test_alberta_tax_rates(results: TestResult):
    """Test 6: Alberta tax rates are applied correctly"""
    test_name = "Alberta Tax Rates"

    try:
        test_data = {
            "p1": {
                "name": "AlbertaTax",
                "is_retired": True,
                "retirement_age": 65,
                "start_age": 70,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 100000,
                "tfsa_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 10000,
                "oas_start_age": 65,
                "oas_amount": 7500,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 7000,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "p2": {
                "name": "",
                "is_retired": False,
                "retirement_age": 65,
                "start_age": 60,
                "life_expectancy": 85,
                "rrsp_balance": 0,
                "rrif_balance": 0,
                "tfsa_balance": 0,
                "nonreg_balance": 0,
                "corporate_balance": 0,
                "cpp_start_age": 65,
                "cpp_amount": 0,
                "oas_start_age": 65,
                "oas_amount": 0,
                "gis_amount": 0,
                "yield_rrsp_growth": 0.04,
                "yield_rrif_growth": 0.04,
                "yield_tfsa_growth": 0.04,
                "yield_nonreg_growth": 0.04,
                "tfsa_room_start": 0,
                "tfsa_room_annual_growth": 0,
                "nonreg_acb": 0,
                "pension_incomes": [],
                "other_incomes": []
            },
            "household_is_couple": False,
            "withdrawal_strategy": "RRIF-Frontload (15%/8%)",
            "spending_go_go": 40000,
            "spending_slow_go": 35000,
            "spending_no_go": 30000,
            "go_go_end_age": 75,
            "slow_go_end_age": 85,
            "end_age": 85,
            "gap_tolerance": 100,
            "stop_on_fail": False,
            "general_inflation": 0.025,
            "spending_inflation": 0.025,
            "province": "AB",  # Alberta
            "start_year": 2025
        }

        # Run for Alberta
        result_ab = run_simulation(test_data)

        # Run same scenario for Ontario
        test_data["province"] = "ON"
        result_on = run_simulation(test_data)

        if not result_ab or not result_on:
            results.add_error(test_name, Exception("Simulation failed"))
            return

        # Compare tax amounts - Alberta should be lower
        ab_tax = result_ab.get("years", [{}])[0].get("total_tax_after_split", 0)
        on_tax = result_on.get("years", [{}])[0].get("total_tax_after_split", 0)

        if ab_tax < on_tax:
            results.add_pass(test_name,
                f"Alberta tax ${ab_tax:.0f} < Ontario tax ${on_tax:.0f}")
        else:
            results.add_fail(test_name,
                f"Alberta tax ${ab_tax:.0f} not less than Ontario ${on_tax:.0f}")

    except Exception as e:
        results.add_error(test_name, e)


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("RRIF-FRONTLOAD COMPREHENSIVE TEST SUITE")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    print("\nThis test suite ensures the application doesn't break")
    print("and all RRIF-Frontload features work correctly.\n")

    results = TestResult()

    # Run all tests
    print("Running tests...\n")
    test_basic_rrif_frontload(results)
    test_rrif_frontload_exceeds_standard(results)
    test_rrif_frontload_indicator_fields(results)
    test_no_false_gaps(results)
    test_withdrawal_order(results)
    test_alberta_tax_rates(results)

    # Print summary
    success = results.summary()

    print("\n" + "="*80)
    if success:
        print("🎉 ALL TESTS PASSED - Application is stable!")
    else:
        print("⚠️  SOME TESTS FAILED - Please review and fix issues")
    print("="*80)

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())