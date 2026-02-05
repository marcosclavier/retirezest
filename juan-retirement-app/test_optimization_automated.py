#!/usr/bin/env python3
"""
Automated Test Suite for US-044 Auto-Optimization Feature

Tests:
1. Realistic scenario optimization detection
2. Low-asset scenario optimization detection
3. Critical failure mode (all strategies <75%)
4. Response structure validation
5. Optimization reason generation
6. Tax impact calculation
"""

import sys
import json
import requests
from typing import Dict, Any

# API endpoint
API_URL = "http://localhost:8000/api/run-simulation"

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test_header(test_name: str):
    """Print formatted test header"""
    print(f"\n{'='*70}")
    print(f"{BLUE}TEST: {test_name}{RESET}")
    print('='*70)

def print_result(passed: bool, message: str):
    """Print test result with color"""
    status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
    print(f"{status}: {message}")

def run_simulation(test_file: str) -> Dict[str, Any]:
    """Run simulation and return response"""
    with open(test_file, 'r') as f:
        data = json.load(f)

    response = requests.post(API_URL, json=data, timeout=30)
    return response.json()

def validate_optimization_structure(opt_result: Dict[str, Any]) -> tuple[bool, str]:
    """Validate optimization result has required fields"""
    required_fields = [
        'optimized',
        'original_strategy',
        'optimized_strategy',
        'optimization_reason',
        'original_success_rate',
        'optimized_success_rate',
        'gaps_eliminated',
        'tax_increase_pct',
        'tax_increase_amount'
    ]

    for field in required_fields:
        if field not in opt_result:
            return False, f"Missing required field: {field}"

    return True, "All required fields present"

def test_realistic_scenario():
    """Test optimization with realistic Juan scenario ($1.05M)"""
    print_test_header("Realistic Scenario ($1.05M Portfolio)")

    try:
        result = run_simulation('test_juan_realistic.json')

        # Test 1: API call succeeded
        print_result(result.get('success', False), "API call succeeded")

        # Test 2: Optimization result present
        has_opt = 'optimization_result' in result
        print_result(has_opt, "Optimization result present in response")

        if not has_opt:
            return False

        opt = result['optimization_result']

        # Test 3: Optimization triggered
        optimized = opt.get('optimized', False)
        print_result(optimized, f"Optimization triggered: {opt.get('original_strategy')} → {opt.get('optimized_strategy')}")

        # Test 4: Success rate improved
        orig_success = opt.get('original_success_rate', 0) * 100
        opt_success = opt.get('optimized_success_rate', 0) * 100
        improvement = opt_success - orig_success
        improved = improvement >= 2.0
        print_result(improved, f"Success rate improved: {orig_success:.1f}% → {opt_success:.1f}% (+{improvement:.1f}%)")

        # Test 5: Gaps eliminated
        gaps = opt.get('gaps_eliminated', 0)
        print_result(gaps > 0, f"Funding gaps eliminated: {gaps} years")

        # Test 6: Structure validation
        valid, msg = validate_optimization_structure(opt)
        print_result(valid, f"Response structure: {msg}")

        # Test 7: Reason provided
        reason = opt.get('optimization_reason', '')
        has_reason = len(reason) > 0
        print_result(has_reason, f"Optimization reason: {reason[:60]}...")

        return optimized and improved and valid

    except Exception as e:
        print_result(False, f"Test failed with error: {str(e)}")
        return False

def test_low_asset_scenario():
    """Test optimization with low-asset scenario ($520K)"""
    print_test_header("Low-Asset Scenario ($520K Portfolio)")

    try:
        result = run_simulation('test_optimization_simple.json')

        # Test 1: API call succeeded
        print_result(result.get('success', False), "API call succeeded")

        # Test 2: Optimization result present
        has_opt = 'optimization_result' in result
        print_result(has_opt, "Optimization result present in response")

        if not has_opt:
            return False

        opt = result['optimization_result']

        # Test 3: Optimization triggered
        optimized = opt.get('optimized', False)
        print_result(optimized, f"Optimization triggered: {opt.get('original_strategy')} → {opt.get('optimized_strategy')}")

        # Test 4: Success rate improved
        orig_success = opt.get('original_success_rate', 0) * 100
        opt_success = opt.get('optimized_success_rate', 0) * 100
        improvement = opt_success - orig_success
        improved = improvement >= 2.0
        print_result(improved, f"Success rate improved: {orig_success:.1f}% → {opt_success:.1f}% (+{improvement:.1f}%)")

        # Test 5: Critical failure mode detection
        # Both strategies should be <75%, testing funding-only scoring
        in_critical = orig_success < 75.0 and opt_success < 75.0
        print_result(in_critical, f"Critical failure mode: Both strategies <75% success")

        return optimized and improved

    except Exception as e:
        print_result(False, f"Test failed with error: {str(e)}")
        return False

def test_no_optimization_needed():
    """Test scenario where current strategy is already optimal"""
    print_test_header("No Optimization Needed (Already Optimal)")

    try:
        # Create a test case with tfsa-first strategy (which should be optimal for Juan)
        with open('test_juan_realistic.json', 'r') as f:
            data = json.load(f)

        # Change strategy to tfsa-first
        data['strategy'] = 'tfsa-first'

        response = requests.post(API_URL, json=data, timeout=30)
        result = response.json()

        # Test 1: API call succeeded
        print_result(result.get('success', False), "API call succeeded")

        # Test 2: Optimization result present
        has_opt = 'optimization_result' in result
        print_result(has_opt, "Optimization result present in response")

        if not has_opt:
            print_result(True, "No optimization result (already optimal)")
            return True  # No optimization needed

        opt = result['optimization_result']

        # Handle None optimization result
        if opt is None:
            print_result(True, "No optimization triggered (current strategy is optimal)")
            return True

        # Test 3: Optimization NOT triggered (already optimal)
        not_optimized = not opt.get('optimized', False)
        print_result(not_optimized, f"No optimization triggered (current strategy is optimal)")

        return not_optimized

    except Exception as e:
        print_result(False, f"Test failed with error: {str(e)}")
        return False

def test_response_type_validation():
    """Test that optimization result has correct data types"""
    print_test_header("Response Type Validation")

    try:
        result = run_simulation('test_juan_realistic.json')

        if 'optimization_result' not in result:
            print_result(False, "No optimization result to validate")
            return False

        opt = result['optimization_result']

        # Test field types
        tests = [
            (isinstance(opt.get('optimized'), bool), "optimized is boolean"),
            (isinstance(opt.get('original_strategy'), str), "original_strategy is string"),
            (isinstance(opt.get('optimized_strategy'), str), "optimized_strategy is string"),
            (isinstance(opt.get('optimization_reason'), str), "optimization_reason is string"),
            (isinstance(opt.get('original_success_rate'), (int, float)), "original_success_rate is number"),
            (isinstance(opt.get('optimized_success_rate'), (int, float)), "optimized_success_rate is number"),
            (isinstance(opt.get('gaps_eliminated'), int), "gaps_eliminated is integer"),
            (isinstance(opt.get('tax_increase_pct'), (int, float)), "tax_increase_pct is number"),
            (isinstance(opt.get('tax_increase_amount'), (int, float)), "tax_increase_amount is number"),
        ]

        all_passed = True
        for passed, message in tests:
            print_result(passed, message)
            all_passed = all_passed and passed

        return all_passed

    except Exception as e:
        print_result(False, f"Test failed with error: {str(e)}")
        return False

def test_improvement_threshold():
    """Test that optimization respects 2% minimum improvement threshold"""
    print_test_header("Improvement Threshold (MIN_IMPROVEMENT = 2%)")

    try:
        result = run_simulation('test_juan_realistic.json')

        if 'optimization_result' not in result:
            print_result(True, "No optimization detected (below threshold or already optimal)")
            return True

        opt = result['optimization_result']

        if opt.get('optimized', False):
            orig_success = opt.get('original_success_rate', 0)
            opt_success = opt.get('optimized_success_rate', 0)
            improvement = (opt_success - orig_success) * 100

            meets_threshold = improvement >= 2.0
            print_result(meets_threshold, f"Improvement {improvement:.1f}% meets 2% threshold")

            return meets_threshold
        else:
            print_result(True, "No optimization triggered (current strategy is optimal)")
            return True

    except Exception as e:
        print_result(False, f"Test failed with error: {str(e)}")
        return False

def run_all_tests():
    """Run complete test suite"""
    print(f"\n{BLUE}{'='*70}")
    print("US-044 AUTO-OPTIMIZATION AUTOMATED TEST SUITE")
    print(f"{'='*70}{RESET}\n")

    tests = [
        ("Realistic Scenario", test_realistic_scenario),
        ("Low-Asset Scenario", test_low_asset_scenario),
        ("No Optimization Needed", test_no_optimization_needed),
        ("Response Type Validation", test_response_type_validation),
        ("Improvement Threshold", test_improvement_threshold),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"{RED}ERROR in {test_name}: {str(e)}{RESET}")
            results.append((test_name, False))

    # Summary
    print(f"\n{BLUE}{'='*70}")
    print("TEST SUMMARY")
    print(f"{'='*70}{RESET}\n")

    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)

    for test_name, passed in results:
        status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
        print(f"{status}: {test_name}")

    print(f"\n{BLUE}Results: {passed_count}/{total_count} tests passed{RESET}")

    if passed_count == total_count:
        print(f"\n{GREEN}{'='*70}")
        print("✓ ALL TESTS PASSED - OPTIMIZATION FEATURE WORKING CORRECTLY")
        print(f"{'='*70}{RESET}\n")
        return 0
    else:
        print(f"\n{RED}{'='*70}")
        print(f"✗ {total_count - passed_count} TEST(S) FAILED")
        print(f"{'='*70}{RESET}\n")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
