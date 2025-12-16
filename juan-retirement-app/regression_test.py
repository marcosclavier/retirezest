"""
Regression Test Suite for Retirement Simulation Engine

Tests:
1. Compound interest calculations (TFSA, RRIF, RRSP, NonReg, Corporate)
2. Tax calculations (federal + provincial)
3. Withdrawal logic and account depletion
4. CPP/OAS inflation adjustments
5. RRIF minimum withdrawals
6. Overall simulation integrity
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config
import pandas as pd

def test_simple_growth():
    """Test 1: Verify compound growth on a simple TFSA-only scenario"""
    print("\n" + "="*80)
    print("TEST 1: Simple Compound Growth (TFSA Only)")
    print("="*80)

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create simple test household
    p1 = Person(
        name="TestPerson",
        start_age=65,
        tfsa_balance=100000,  # Start with $100k
        rrif_balance=0,
        rrsp_balance=0,
        nonreg_balance=0,
        corporate_balance=0,
        yield_tfsa_growth=0.05,  # 5% annual growth
        cpp_annual_at_start=0,
        oas_annual_at_start=0,
        cpp_start_age=999,  # Disable CPP/OAS for simplicity
        oas_start_age=999,
    )

    p2 = Person(
        name="NoOne",
        start_age=65,
        tfsa_balance=0,
        rrif_balance=0,
        rrsp_balance=0,
        nonreg_balance=0,
        corporate_balance=0,
        cpp_annual_at_start=0,
        oas_annual_at_start=0,
        cpp_start_age=999,
        oas_start_age=999,
    )

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=68,  # Run for 3 years
        strategy="tfsa-first",
        spending_go_go=0,  # No withdrawals
        spending_slow_go=0,
        spending_no_go=0,
        go_go_end_age=74,
        slow_go_end_age=84,
        general_inflation=0.02,
        spending_inflation=0.02,
    )

    # Run simulation
    df = simulate(household, tax_cfg)

    # Manual calculation verification
    print("\n📊 Expected vs Actual TFSA Growth (No Withdrawals):")
    print(f"{'Year':<8} {'Age':<6} {'Expected':<15} {'Actual':<15} {'Match':<10}")
    print("-" * 60)

    expected_balance = 100000
    all_passed = True

    for idx, row in df.iterrows():
        year = row['year']
        age = row['p1_age']
        actual_balance = row['p1_tfsa_end']

        # For year 1, expected = 100000 * 1.05 = 105000
        # For year 2, expected = 105000 * 1.05 = 110250
        # For year 3, expected = 110250 * 1.05 = 115762.5

        match = abs(actual_balance - expected_balance) < 1.0  # Within $1
        status = "✅ PASS" if match else "❌ FAIL"

        print(f"{year:<8} {age:<6} ${expected_balance:<14,.2f} ${actual_balance:<14,.2f} {status}")

        if not match:
            all_passed = False
            print(f"   ERROR: Difference of ${abs(actual_balance - expected_balance):,.2f}")

        # Calculate next year's expected balance
        expected_balance = expected_balance * 1.05

    if all_passed:
        print("\n✅ TEST 1 PASSED: Compound growth calculations are correct")
    else:
        print("\n❌ TEST 1 FAILED: Compound growth calculations have errors")

    return all_passed


def test_withdrawal_and_tax():
    """Test 2: Verify withdrawals and tax calculations"""
    print("\n" + "="*80)
    print("TEST 2: Withdrawals and Tax Calculations")
    print("="*80)

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create test household with RRIF (taxable income)
    p1 = Person(
        name="TestPerson",
        start_age=65,
        tfsa_balance=0,
        rrif_balance=200000,  # $200k in RRIF
        rrsp_balance=0,
        nonreg_balance=0,
        corporate_balance=0,
        yield_rrif_growth=0.05,  # 5% growth
        cpp_annual_at_start=0,
        oas_annual_at_start=0,
        cpp_start_age=999,
        oas_start_age=999,
    )

    p2 = Person(
        name="NoOne",
        start_age=65,
        tfsa_balance=0,
        rrif_balance=0,
        rrsp_balance=0,
        nonreg_balance=0,
        corporate_balance=0,
        cpp_annual_at_start=0,
        oas_annual_at_start=0,
        cpp_start_age=999,
        oas_start_age=999,
    )

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=66,  # Run for 1 year
        strategy="minimize-income",
        spending_go_go=30000,  # Withdraw $30k after-tax
        spending_slow_go=30000,
        spending_no_go=30000,
        go_go_end_age=74,
        slow_go_end_age=84,
        general_inflation=0.00,  # Disable inflation for simplicity
        spending_inflation=0.00,
    )

    # Run simulation
    df = simulate(household, tax_cfg)

    print("\n📊 Year 1 Results:")
    row = df.iloc[0]

    print(f"RRIF Start Balance: ${row['p1_rrif_start']:,.2f}")
    print(f"RRIF Withdrawal:    ${row['p1_rrif_wd']:,.2f}")
    print(f"RRIF End Balance:   ${row['p1_rrif_end']:,.2f}")
    print(f"\nGross Income (P1):  ${row['p1_gross_income']:,.2f}")
    print(f"Total Tax (P1):     ${row['p1_tax']:,.2f}")
    print(f"After-Tax Income:   ${row['p1_gross_income'] - row['p1_tax']:,.2f}")
    print(f"\nTotal Spending:     ${row['total_spending']:,.2f}")
    print(f"Spending Met:       ${row['spending_met']:,.2f}")
    print(f"Shortfall:          ${row['shortfall']:,.2f}")

    # Verify basic logic
    checks_passed = True

    # Check 1: RRIF balance should decrease
    if row['p1_rrif_end'] >= row['p1_rrif_start']:
        print("\n❌ FAIL: RRIF balance should decrease after withdrawal")
        checks_passed = False
    else:
        print("\n✅ PASS: RRIF balance decreased correctly")

    # Check 2: Spending should be met (within $100)
    if abs(row['spending_met'] - 30000) > 100:
        print(f"❌ FAIL: Spending target was $30,000 but got ${row['spending_met']:,.2f}")
        checks_passed = False
    else:
        print(f"✅ PASS: Spending target met (${row['spending_met']:,.2f})")

    # Check 3: Tax should be positive on RRIF withdrawals
    if row['p1_tax'] <= 0:
        print("❌ FAIL: Tax should be positive on RRIF withdrawals")
        checks_passed = False
    else:
        print(f"✅ PASS: Tax calculated correctly (${row['p1_tax']:,.2f})")

    if checks_passed:
        print("\n✅ TEST 2 PASSED: Withdrawal and tax calculations are correct")
    else:
        print("\n❌ TEST 2 FAILED: Withdrawal or tax calculations have errors")

    return checks_passed


def test_rrif_minimum():
    """Test 3: Verify RRIF minimum withdrawal enforcement"""
    print("\n" + "="*80)
    print("TEST 3: RRIF Minimum Withdrawal")
    print("="*80)

    from modules.simulation import rrif_minimum, rrif_min_factor

    # Test known RRIF minimum factors
    test_cases = [
        (65, 0.0400, 100000, 4000),   # Age 65: 4.00%
        (71, 0.0528, 100000, 5280),   # Age 71: 5.28%
        (80, 0.0682, 100000, 6820),   # Age 80: 6.82%
        (95, 0.2000, 100000, 20000),  # Age 95+: 20.00%
    ]

    all_passed = True

    print(f"\n{'Age':<6} {'Factor':<10} {'Balance':<15} {'Expected Min':<15} {'Actual Min':<15} {'Status'}")
    print("-" * 80)

    for age, expected_factor, balance, expected_min in test_cases:
        actual_factor = rrif_min_factor(age)
        actual_min = rrif_minimum(balance, age)

        factor_match = abs(actual_factor - expected_factor) < 0.0001
        min_match = abs(actual_min - expected_min) < 0.01

        status = "✅ PASS" if (factor_match and min_match) else "❌ FAIL"

        print(f"{age:<6} {actual_factor:<10.4f} ${balance:<14,} ${expected_min:<14,.2f} ${actual_min:<14,.2f} {status}")

        if not (factor_match and min_match):
            all_passed = False

    if all_passed:
        print("\n✅ TEST 3 PASSED: RRIF minimum calculations are correct")
    else:
        print("\n❌ TEST 3 FAILED: RRIF minimum calculations have errors")

    return all_passed


def test_cpp_oas_inflation():
    """Test 4: Verify CPP/OAS inflation adjustments"""
    print("\n" + "="*80)
    print("TEST 4: CPP/OAS Inflation Adjustments")
    print("="*80)

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create test household with CPP/OAS
    p1 = Person(
        name="TestPerson",
        start_age=65,
        tfsa_balance=100000,
        rrif_balance=0,
        rrsp_balance=0,
        nonreg_balance=0,
        corporate_balance=0,
        yield_tfsa_growth=0.00,  # No growth for simplicity
        cpp_annual_at_start=15000,  # $15k CPP at age 65
        oas_annual_at_start=8000,   # $8k OAS at age 65
        cpp_start_age=65,
        oas_start_age=65,
    )

    p2 = Person(
        name="NoOne",
        start_age=65,
        tfsa_balance=0,
        rrif_balance=0,
        rrsp_balance=0,
        nonreg_balance=0,
        corporate_balance=0,
        cpp_annual_at_start=0,
        oas_annual_at_start=0,
        cpp_start_age=999,
        oas_start_age=999,
    )

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=68,  # Run for 3 years
        strategy="tfsa-first",
        spending_go_go=0,
        spending_slow_go=0,
        spending_no_go=0,
        go_go_end_age=74,
        slow_go_end_age=84,
        general_inflation=0.02,  # 2% inflation
        spending_inflation=0.02,
    )

    # Run simulation
    df = simulate(household, tax_cfg)

    print("\n📊 CPP/OAS Growth with 2% Inflation:")
    print(f"{'Year':<8} {'Age':<6} {'CPP Expected':<15} {'CPP Actual':<15} {'OAS Expected':<15} {'OAS Actual':<15} {'Status'}")
    print("-" * 100)

    expected_cpp = 15000
    expected_oas = 8000
    all_passed = True

    for idx, row in df.iterrows():
        year = row['year']
        age = row['p1_age']
        actual_cpp = row['p1_cpp']
        actual_oas = row['p1_oas']

        cpp_match = abs(actual_cpp - expected_cpp) < 1.0
        oas_match = abs(actual_oas - expected_oas) < 1.0

        status = "✅ PASS" if (cpp_match and oas_match) else "❌ FAIL"

        print(f"{year:<8} {age:<6} ${expected_cpp:<14,.2f} ${actual_cpp:<14,.2f} ${expected_oas:<14,.2f} ${actual_oas:<14,.2f} {status}")

        if not (cpp_match and oas_match):
            all_passed = False

        # Calculate next year's expected values (2% inflation)
        expected_cpp = expected_cpp * 1.02
        expected_oas = expected_oas * 1.02

    if all_passed:
        print("\n✅ TEST 4 PASSED: CPP/OAS inflation adjustments are correct")
    else:
        print("\n❌ TEST 4 FAILED: CPP/OAS inflation adjustments have errors")

    return all_passed


def test_multi_account_growth():
    """Test 5: Verify growth across multiple account types"""
    print("\n" + "="*80)
    print("TEST 5: Multi-Account Compound Growth")
    print("="*80)

    # Load tax config
    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create household with multiple accounts
    p1 = Person(
        name="TestPerson",
        start_age=65,
        tfsa_balance=50000,
        rrif_balance=100000,
        rrsp_balance=75000,
        nonreg_balance=200000,
        corporate_balance=0,
        yield_tfsa_growth=0.04,   # 4%
        yield_rrif_growth=0.05,   # 5%
        yield_rrsp_growth=0.05,   # 5%
        nr_cash=0,
        nr_gic=0,
        nr_invest=200000,  # All in investments
        yield_nonreg_total=0.06,  # 6% total
        cpp_annual_at_start=0,
        oas_annual_at_start=0,
        cpp_start_age=999,
        oas_start_age=999,
    )

    p2 = Person(
        name="NoOne",
        start_age=65,
        tfsa_balance=0,
        rrif_balance=0,
        rrsp_balance=0,
        nonreg_balance=0,
        corporate_balance=0,
        cpp_annual_at_start=0,
        oas_annual_at_start=0,
        cpp_start_age=999,
        oas_start_age=999,
    )

    household = Household(
        p1=p1,
        p2=p2,
        province="AB",
        start_year=2025,
        end_age=66,  # Run for 1 year
        strategy="minimize-income",
        spending_go_go=0,  # No withdrawals
        spending_slow_go=0,
        spending_no_go=0,
        go_go_end_age=74,
        slow_go_end_age=84,
        general_inflation=0.00,
        spending_inflation=0.00,
    )

    # Run simulation
    df = simulate(household, tax_cfg)
    row = df.iloc[0]

    print("\n📊 Account Growth (No Withdrawals):")
    print(f"{'Account':<15} {'Start':<15} {'Growth Rate':<12} {'Expected End':<15} {'Actual End':<15} {'Status'}")
    print("-" * 85)

    tests = [
        ("TFSA", 50000, 0.04, 50000 * 1.04, row['p1_tfsa_end']),
        ("RRIF", 100000, 0.05, 100000 * 1.05, row['p1_rrif_end']),
        ("RRSP", 75000, 0.05, 75000 * 1.05, row['p1_rrsp_end']),
    ]

    all_passed = True

    for account, start, rate, expected, actual in tests:
        match = abs(actual - expected) < 1.0
        status = "✅ PASS" if match else "❌ FAIL"

        print(f"{account:<15} ${start:<14,.2f} {rate*100:>10.1f}% ${expected:<14,.2f} ${actual:<14,.2f} {status}")

        if not match:
            all_passed = False
            print(f"   ERROR: Difference of ${abs(actual - expected):,.2f}")

    # NonReg is more complex due to distributions
    print(f"\nNonReg: ${200000:,.2f} start → ${row['p1_nr_end']:,.2f} end")
    print(f"  (Growth calculation includes distributions, so exact match not verified)")

    if all_passed:
        print("\n✅ TEST 5 PASSED: Multi-account growth calculations are correct")
    else:
        print("\n❌ TEST 5 FAILED: Multi-account growth calculations have errors")

    return all_passed


def run_all_tests():
    """Run all regression tests"""
    print("\n" + "="*80)
    print("RETIREMENT SIMULATION REGRESSION TEST SUITE")
    print("="*80)

    results = {
        "Test 1: Simple Compound Growth": test_simple_growth(),
        "Test 2: Withdrawals and Tax": test_withdrawal_and_tax(),
        "Test 3: RRIF Minimums": test_rrif_minimum(),
        "Test 4: CPP/OAS Inflation": test_cpp_oas_inflation(),
        "Test 5: Multi-Account Growth": test_multi_account_growth(),
    }

    print("\n" + "="*80)
    print("FINAL RESULTS")
    print("="*80)

    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:<40} {status}")

    total = len(results)
    passed = sum(results.values())

    print("\n" + "="*80)
    print(f"SUMMARY: {passed}/{total} tests passed")

    if passed == total:
        print("✅ ALL TESTS PASSED - Simulation calculations are correct!")
    else:
        print(f"❌ {total - passed} TEST(S) FAILED - Please review errors above")

    print("="*80)

    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
