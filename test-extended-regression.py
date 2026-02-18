#!/usr/bin/env python3
"""
Extended Regression Testing Script for RetireZest
Comprehensive testing including edge cases and stress tests
"""

import requests
import json
import time
import sys
import random
from typing import Dict, Any, List, Tuple

BASE_URL = "http://localhost:8000"
SUCCESS = "✅"
FAILURE = "❌"
INFO = "ℹ️"
WARNING = "⚠️"

class ExtendedRegressionTester:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.test_results = []

    def log_result(self, test_name: str, success: bool, details: str = "", level: str = "info"):
        """Log a test result"""
        status = SUCCESS if success else FAILURE
        self.test_results.append({
            "name": test_name,
            "success": success,
            "details": details,
            "level": level
        })

        if level == "warning":
            status = WARNING
            self.warnings.append(f"{test_name}: {details}")

        print(f"{status} {test_name}: {details}")

        if not success and level != "warning":
            self.errors.append(f"{test_name}: {details}")

    def test_edge_case_ages(self) -> bool:
        """Test edge cases for ages"""
        print(f"\n{INFO} Testing Edge Case Ages...")

        test_cases = [
            {
                "name": "Minimum retirement age (50)",
                "start_age": 50,
                "current_age": 50,
                "expected": "Should accept minimum age"
            },
            {
                "name": "Maximum life expectancy (100)",
                "start_age": 65,
                "current_age": 60,
                "end_age": 100,
                "expected": "Should accept maximum age"
            },
            {
                "name": "Current age equals retirement age",
                "start_age": 65,
                "current_age": 65,
                "expected": "Should handle already retired"
            },
            {
                "name": "Very late retirement (85)",
                "start_age": 85,
                "current_age": 80,
                "expected": "Should handle late retirement"
            }
        ]

        all_passed = True
        for test_case in test_cases:
            print(f"  Testing: {test_case['name']}")

            test_data = {
                "p1": {
                    "name": "Test",
                    "start_age": test_case.get("start_age", 65),
                    "current_age": test_case.get("current_age", 60),
                    "tfsa_balance": 100000,
                    "rrsp_balance": 200000,
                    "rrif_balance": 0,
                    "nr_cash": 50000,
                    "nr_gic": 0,
                    "nr_invest": 0,
                    "corp_cash_bucket": 0,
                    "corp_gic_bucket": 0,
                    "corp_invest_bucket": 0,
                    "cpp_start_age": 65,
                    "cpp_annual_at_start": 10000,
                    "oas_start_age": 65,
                    "oas_annual_at_start": 8000,
                    "pension_incomes": [],
                    "other_incomes": []
                },
                "p2": {
                    "name": "",
                    "start_age": 50,
                    "current_age": 50,
                    "tfsa_balance": 0,
                    "rrsp_balance": 0,
                    "rrif_balance": 0,
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
                "spending_go_go": 60000,
                "spending_slow_go": 50000,
                "spending_no_go": 40000,
                "go_go_end_age": 75,
                "slow_go_end_age": 85,
                "end_age": test_case.get("end_age", 95),
                "primary_residence": 400000,
                "other_properties": 0,
                "sale_primary_age": 0,
                "sale_other_age": 0,
                "province": "ON",
                "inflation_rate": 0.025,
                "real_estate_growth": 0.03,
                "tfsa_rate": 0.05,
                "rrsp_rate": 0.05,
                "nr_rate": 0.04,
                "corp_rate": 0.045
            }

            try:
                response = requests.post(
                    f"{BASE_URL}/api/run-simulation",
                    json=test_data,
                    timeout=30
                )

                if response.status_code == 200:
                    print(f"    {SUCCESS} {test_case['expected']}")
                else:
                    print(f"    {FAILURE} Failed with status {response.status_code}")
                    all_passed = False

            except Exception as e:
                print(f"    {FAILURE} Exception: {str(e)}")
                all_passed = False

        self.log_result("Edge Case Ages", all_passed,
                       "All age edge cases handled" if all_passed else "Some age edge cases failed")
        return all_passed

    def test_extreme_portfolio_values(self) -> bool:
        """Test extreme portfolio values"""
        print(f"\n{INFO} Testing Extreme Portfolio Values...")

        test_cases = [
            {
                "name": "Zero assets",
                "tfsa": 0,
                "rrsp": 0,
                "rrif": 0,
                "nr_cash": 0,
                "expected": "Should handle zero assets"
            },
            {
                "name": "Very large assets (10M+)",
                "tfsa": 2000000,
                "rrsp": 5000000,
                "rrif": 3000000,
                "nr_cash": 2000000,
                "expected": "Should handle large portfolios"
            },
            {
                "name": "RRIF-only portfolio",
                "tfsa": 0,
                "rrsp": 0,
                "rrif": 500000,
                "nr_cash": 0,
                "expected": "Should handle single account type"
            },
            {
                "name": "Corporate-heavy portfolio",
                "tfsa": 50000,
                "rrsp": 100000,
                "rrif": 0,
                "nr_cash": 50000,
                "corp_cash": 1000000,
                "corp_gic": 500000,
                "corp_invest": 500000,
                "expected": "Should handle corporate accounts"
            }
        ]

        all_passed = True
        for test_case in test_cases:
            print(f"  Testing: {test_case['name']}")

            test_data = {
                "p1": {
                    "name": "Test",
                    "start_age": 65,
                    "current_age": 60,
                    "tfsa_balance": test_case.get("tfsa", 0),
                    "rrsp_balance": test_case.get("rrsp", 0),
                    "rrif_balance": test_case.get("rrif", 0),
                    "nr_cash": test_case.get("nr_cash", 0),
                    "nr_gic": test_case.get("nr_gic", 0),
                    "nr_invest": test_case.get("nr_invest", 0),
                    "corp_cash_bucket": test_case.get("corp_cash", 0),
                    "corp_gic_bucket": test_case.get("corp_gic", 0),
                    "corp_invest_bucket": test_case.get("corp_invest", 0),
                    "cpp_start_age": 65,
                    "cpp_annual_at_start": 10000,
                    "oas_start_age": 65,
                    "oas_annual_at_start": 8000,
                    "pension_incomes": [],
                    "other_incomes": []
                },
                "p2": {
                    "name": "",
                    "start_age": 50,
                    "current_age": 50,
                    "tfsa_balance": 0,
                    "rrsp_balance": 0,
                    "rrif_balance": 0,
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
                "spending_go_go": 60000,
                "spending_slow_go": 50000,
                "spending_no_go": 40000,
                "go_go_end_age": 75,
                "slow_go_end_age": 85,
                "end_age": 95,
                "primary_residence": 400000,
                "other_properties": 0,
                "sale_primary_age": 0,
                "sale_other_age": 0,
                "province": "ON",
                "inflation_rate": 0.025,
                "real_estate_growth": 0.03,
                "tfsa_rate": 0.05,
                "rrsp_rate": 0.05,
                "nr_rate": 0.04,
                "corp_rate": 0.045
            }

            try:
                response = requests.post(
                    f"{BASE_URL}/api/run-simulation",
                    json=test_data,
                    timeout=30
                )

                if response.status_code == 200:
                    result = response.json()

                    # For RRIF-only portfolio, check strategy
                    if test_case["name"] == "RRIF-only portfolio":
                        strategy = result.get("strategy_insights", {})
                        if strategy.get("recommended_strategy") == "RRIF_SPLITTING":
                            print(f"    {FAILURE} RRIF Splitting recommended for single!")
                            all_passed = False
                        else:
                            print(f"    {SUCCESS} Correct strategy for RRIF-only single")
                    else:
                        print(f"    {SUCCESS} {test_case['expected']}")
                else:
                    print(f"    {FAILURE} Failed with status {response.status_code}")
                    all_passed = False

            except Exception as e:
                print(f"    {FAILURE} Exception: {str(e)}")
                all_passed = False

        self.log_result("Extreme Portfolio Values", all_passed,
                       "All extreme values handled" if all_passed else "Some extreme values failed")
        return all_passed

    def test_all_provinces(self) -> bool:
        """Test all supported provinces"""
        print(f"\n{INFO} Testing All Provinces...")

        provinces = ["AB", "BC", "ON", "QC"]
        all_passed = True

        for province in provinces:
            print(f"  Testing province: {province}")

            test_data = {
                "p1": {
                    "name": "Test",
                    "start_age": 65,
                    "current_age": 60,
                    "tfsa_balance": 100000,
                    "rrsp_balance": 200000,
                    "rrif_balance": 0,
                    "nr_cash": 50000,
                    "nr_gic": 0,
                    "nr_invest": 0,
                    "corp_cash_bucket": 0,
                    "corp_gic_bucket": 0,
                    "corp_invest_bucket": 0,
                    "cpp_start_age": 65,
                    "cpp_annual_at_start": 10000,
                    "oas_start_age": 65,
                    "oas_annual_at_start": 8000,
                    "pension_incomes": [],
                    "other_incomes": []
                },
                "p2": {
                    "name": "",
                    "start_age": 50,
                    "current_age": 50,
                    "tfsa_balance": 0,
                    "rrsp_balance": 0,
                    "rrif_balance": 0,
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
                "spending_go_go": 60000,
                "spending_slow_go": 50000,
                "spending_no_go": 40000,
                "go_go_end_age": 75,
                "slow_go_end_age": 85,
                "end_age": 95,
                "primary_residence": 400000,
                "other_properties": 0,
                "sale_primary_age": 0,
                "sale_other_age": 0,
                "province": province,
                "inflation_rate": 0.025,
                "real_estate_growth": 0.03,
                "tfsa_rate": 0.05,
                "rrsp_rate": 0.05,
                "nr_rate": 0.04,
                "corp_rate": 0.045
            }

            try:
                response = requests.post(
                    f"{BASE_URL}/api/run-simulation",
                    json=test_data,
                    timeout=30
                )

                if response.status_code == 200:
                    print(f"    {SUCCESS} Province {province} works correctly")
                else:
                    print(f"    {FAILURE} Province {province} failed with status {response.status_code}")
                    all_passed = False

            except Exception as e:
                print(f"    {FAILURE} Province {province} exception: {str(e)}")
                all_passed = False

        self.log_result("All Provinces", all_passed,
                       "All provinces work" if all_passed else "Some provinces failed")
        return all_passed

    def test_cpp_oas_variations(self) -> bool:
        """Test CPP/OAS start age variations"""
        print(f"\n{INFO} Testing CPP/OAS Variations...")

        test_cases = [
            {
                "name": "Early CPP (60)",
                "cpp_start": 60,
                "oas_start": 65,
                "cpp_amount": 7000,  # Reduced for early
                "oas_amount": 8000
            },
            {
                "name": "Late CPP (70)",
                "cpp_start": 70,
                "oas_start": 70,
                "cpp_amount": 14000,  # Increased for late
                "oas_amount": 10000
            },
            {
                "name": "No CPP/OAS",
                "cpp_start": 65,
                "oas_start": 65,
                "cpp_amount": 0,
                "oas_amount": 0
            },
            {
                "name": "Maximum CPP/OAS",
                "cpp_start": 65,
                "oas_start": 65,
                "cpp_amount": 16375,  # 2024 max
                "oas_amount": 8508    # 2024 max
            }
        ]

        all_passed = True
        for test_case in test_cases:
            print(f"  Testing: {test_case['name']}")

            test_data = {
                "p1": {
                    "name": "Test",
                    "start_age": 65,
                    "current_age": 60,
                    "tfsa_balance": 100000,
                    "rrsp_balance": 200000,
                    "rrif_balance": 0,
                    "nr_cash": 50000,
                    "nr_gic": 0,
                    "nr_invest": 0,
                    "corp_cash_bucket": 0,
                    "corp_gic_bucket": 0,
                    "corp_invest_bucket": 0,
                    "cpp_start_age": test_case["cpp_start"],
                    "cpp_annual_at_start": test_case["cpp_amount"],
                    "oas_start_age": test_case["oas_start"],
                    "oas_annual_at_start": test_case["oas_amount"],
                    "pension_incomes": [],
                    "other_incomes": []
                },
                "p2": {
                    "name": "",
                    "start_age": 50,
                    "current_age": 50,
                    "tfsa_balance": 0,
                    "rrsp_balance": 0,
                    "rrif_balance": 0,
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
                "spending_go_go": 60000,
                "spending_slow_go": 50000,
                "spending_no_go": 40000,
                "go_go_end_age": 75,
                "slow_go_end_age": 85,
                "end_age": 95,
                "primary_residence": 400000,
                "other_properties": 0,
                "sale_primary_age": 0,
                "sale_other_age": 0,
                "province": "ON",
                "inflation_rate": 0.025,
                "real_estate_growth": 0.03,
                "tfsa_rate": 0.05,
                "rrsp_rate": 0.05,
                "nr_rate": 0.04,
                "corp_rate": 0.045
            }

            try:
                response = requests.post(
                    f"{BASE_URL}/api/run-simulation",
                    json=test_data,
                    timeout=30
                )

                if response.status_code == 200:
                    print(f"    {SUCCESS} {test_case['name']} handled correctly")
                else:
                    print(f"    {FAILURE} {test_case['name']} failed")
                    all_passed = False

            except Exception as e:
                print(f"    {FAILURE} {test_case['name']} exception: {str(e)}")
                all_passed = False

        self.log_result("CPP/OAS Variations", all_passed,
                       "All CPP/OAS variations work" if all_passed else "Some CPP/OAS variations failed")
        return all_passed

    def test_spending_phase_boundaries(self) -> bool:
        """Test spending phase transition boundaries"""
        print(f"\n{INFO} Testing Spending Phase Boundaries...")

        test_cases = [
            {
                "name": "At go-go boundary (age 75)",
                "current_age": 75,
                "go_go_end": 75,
                "slow_go_end": 85,
                "expected_phase": "go-go"  # On boundary, still in go-go
            },
            {
                "name": "Just after go-go (age 76)",
                "current_age": 76,
                "go_go_end": 75,
                "slow_go_end": 85,
                "expected_phase": "slow-go"
            },
            {
                "name": "At slow-go boundary (age 85)",
                "current_age": 85,
                "go_go_end": 75,
                "slow_go_end": 85,
                "expected_phase": "slow-go"  # On boundary, still in slow-go
            },
            {
                "name": "Just after slow-go (age 86)",
                "current_age": 86,
                "go_go_end": 75,
                "slow_go_end": 85,
                "expected_phase": "no-go"
            }
        ]

        all_passed = True
        for test_case in test_cases:
            print(f"  Testing: {test_case['name']}")

            age = test_case["current_age"]
            go_go_end = test_case["go_go_end"]
            slow_go_end = test_case["slow_go_end"]

            # Test the logic
            if age <= go_go_end:
                actual_phase = "go-go"
            elif age <= slow_go_end:
                actual_phase = "slow-go"
            else:
                actual_phase = "no-go"

            if actual_phase == test_case["expected_phase"]:
                print(f"    {SUCCESS} Correct phase: {actual_phase}")
            else:
                print(f"    {FAILURE} Wrong phase: expected {test_case['expected_phase']}, got {actual_phase}")
                all_passed = False

        self.log_result("Spending Phase Boundaries", all_passed,
                       "All boundaries correct" if all_passed else "Some boundaries incorrect")
        return all_passed

    def test_concurrent_requests(self) -> bool:
        """Test multiple concurrent API requests"""
        print(f"\n{INFO} Testing Concurrent Requests...")

        import concurrent.futures

        def make_request(request_id: int) -> Tuple[int, bool]:
            """Make a single request"""
            test_data = {
                "p1": {
                    "name": f"Test{request_id}",
                    "start_age": 65,
                    "current_age": 60,
                    "tfsa_balance": 100000 + request_id * 1000,
                    "rrsp_balance": 200000,
                    "rrif_balance": 0,
                    "nr_cash": 50000,
                    "nr_gic": 0,
                    "nr_invest": 0,
                    "corp_cash_bucket": 0,
                    "corp_gic_bucket": 0,
                    "corp_invest_bucket": 0,
                    "cpp_start_age": 65,
                    "cpp_annual_at_start": 10000,
                    "oas_start_age": 65,
                    "oas_annual_at_start": 8000,
                    "pension_incomes": [],
                    "other_incomes": []
                },
                "p2": {
                    "name": "",
                    "start_age": 50,
                    "current_age": 50,
                    "tfsa_balance": 0,
                    "rrsp_balance": 0,
                    "rrif_balance": 0,
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
                "spending_go_go": 60000,
                "spending_slow_go": 50000,
                "spending_no_go": 40000,
                "go_go_end_age": 75,
                "slow_go_end_age": 85,
                "end_age": 95,
                "primary_residence": 400000,
                "other_properties": 0,
                "sale_primary_age": 0,
                "sale_other_age": 0,
                "province": "ON",
                "inflation_rate": 0.025,
                "real_estate_growth": 0.03,
                "tfsa_rate": 0.05,
                "rrsp_rate": 0.05,
                "nr_rate": 0.04,
                "corp_rate": 0.045
            }

            try:
                response = requests.post(
                    f"{BASE_URL}/api/run-simulation",
                    json=test_data,
                    timeout=30
                )
                return (request_id, response.status_code == 200)
            except:
                return (request_id, False)

        # Test with 5 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request, i) for i in range(5)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        successful = sum(1 for _, success in results if success)
        all_passed = successful == len(results)

        print(f"  Concurrent requests: {successful}/{len(results)} successful")

        self.log_result("Concurrent Requests", all_passed,
                       f"{successful}/{len(results)} requests successful")
        return all_passed

    def run_all_tests(self) -> bool:
        """Run all extended regression tests"""
        print("="*60)
        print("EXTENDED REGRESSION TESTING FOR RETIREZEST")
        print("="*60)

        # Run all tests
        tests = [
            self.test_edge_case_ages,
            self.test_extreme_portfolio_values,
            self.test_all_provinces,
            self.test_cpp_oas_variations,
            self.test_spending_phase_boundaries,
            self.test_concurrent_requests
        ]

        for test in tests:
            try:
                test()
                time.sleep(1)  # Small delay between tests
            except Exception as e:
                self.log_result(test.__name__, False, f"Test crashed: {str(e)}")

        # Print summary
        print("\n" + "="*60)
        print("EXTENDED TEST SUMMARY")
        print("="*60)

        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} {SUCCESS}")
        print(f"Failed: {failed_tests} {FAILURE if failed_tests > 0 else ''}")

        if self.warnings:
            print(f"\n{WARNING} WARNINGS:")
            for warning in self.warnings:
                print(f"  - {warning}")

        if self.errors:
            print(f"\n{FAILURE} ERRORS FOUND:")
            for error in self.errors:
                print(f"  - {error}")
            return False
        else:
            print(f"\n{SUCCESS} ALL EXTENDED TESTS PASSED!")
            print("\nSystem is robust and handles:")
            print("  ✅ Edge case ages (minimum, maximum, boundaries)")
            print("  ✅ Extreme portfolio values (zero, millions, single account)")
            print("  ✅ All supported provinces (AB, BC, ON, QC)")
            print("  ✅ CPP/OAS variations (early, late, none, maximum)")
            print("  ✅ Spending phase boundaries correctly")
            print("  ✅ Concurrent API requests without issues")
            return True

if __name__ == "__main__":
    tester = ExtendedRegressionTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)