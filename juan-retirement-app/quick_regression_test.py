"""
Quick Regression Test for Retirement Simulation
Tests key calculations: compound growth, taxes, withdrawals
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from modules.models import Person, Household
from modules.simulation import simulate, rrif_minimum, rrif_min_factor
from modules.config import load_tax_config
import pandas as pd

def test_compound_growth():
    """Test 1: Verify TFSA compound growth (no withdrawals)"""
    print("\n" + "="*80)
    print("TEST 1: Compound Growth Verification")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create test with $100k TFSA, 5% growth, no withdrawals
    p1 = Person(
        name="Test", start_age=65,
        tfsa_balance=100000, yield_tfsa_growth=0.05,
        rrif_balance=0, rrsp_balance=0, nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    p2 = Person(
        name="None", start_age=65,
        tfsa_balance=0, rrif_balance=0, rrsp_balance=0, nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=68,
        strategy="tfsa-first", spending_go_go=0, spending_slow_go=0, spending_no_go=0
    )

    df = simulate(household, tax_cfg)

    print(f"\n{'Year':<8} {'Age':<6} {'Start':<15} {'Growth':<15} {'End':<15} {'Expected End':<15} {'Status'}")
    print("-" * 95)

    expected_balance = 100000
    all_passed = True

    for idx, row in df.iterrows():
        year = row['year']
        age = row['age_p1']
        # Start balance = previous end (or initial for year 1)
        start_balance = expected_balance
        growth = row['growth_tfsa_p1']
        actual_end = row['end_tfsa_p1']

        # Expected end = start * 1.05 (5% growth, no withdrawals)
        expected_end = start_balance * 1.05

        match = abs(actual_end - expected_end) < 1.0
        status = "✅ PASS" if match else "❌ FAIL"

        print(f"{year:<8} {age:<6} ${start_balance:<14,.2f} ${growth:<14,.2f} ${actual_end:<14,.2f} ${expected_end:<14,.2f} {status}")

        if not match:
            all_passed = False
            print(f"   ERROR: Expected ${expected_end:,.2f}, got ${actual_end:,.2f}, diff ${abs(actual_end - expected_end):,.2f}")

        # Next year's start balance = this year's end
        expected_balance = expected_end

    return all_passed


def test_rrif_minimum():
    """Test 2: Verify RRIF minimum withdrawal factors"""
    print("\n" + "="*80)
    print("TEST 2: RRIF Minimum Withdrawal Factors")
    print("="*80)

    test_cases = [
        (65, 0.0400, "Age 65: 4.00%"),
        (71, 0.0528, "Age 71: 5.28%"),
        (80, 0.0682, "Age 80: 6.82%"),
        (95, 0.2000, "Age 95+: 20.00%"),
    ]

    print(f"\n{'Test Case':<25} {'Expected':<12} {'Actual':<12} {'Status'}")
    print("-" * 60)

    all_passed = True
    for age, expected, desc in test_cases:
        actual = rrif_min_factor(age)
        match = abs(actual - expected) < 0.0001
        status = "✅ PASS" if match else "❌ FAIL"

        print(f"{desc:<25} {expected:<12.4f} {actual:<12.4f} {status}")

        if not match:
            all_passed = False

    # Test minimum calculation
    print(f"\nRRIF Minimum on $100k at age 71:")
    min_wd = rrif_minimum(100000, 71)
    expected_min = 5280
    match = abs(min_wd - expected_min) < 0.01
    status = "✅ PASS" if match else "❌ FAIL"
    print(f"  Expected: ${expected_min:,.2f}")
    print(f"  Actual:   ${min_wd:,.2f}")
    print(f"  Status:   {status}")

    if not match:
        all_passed = False

    return all_passed


def test_tax_and_withdrawals():
    """Test 3: Verify tax calculations and withdrawals"""
    print("\n" + "="*80)
    print("TEST 3: Tax and Withdrawal Calculations")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create test with RRIF only, $30k spending
    p1 = Person(
        name="Test", start_age=65,
        tfsa_balance=0, rrif_balance=200000, yield_rrif_growth=0.05,
        rrsp_balance=0, nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    p2 = Person(
        name="None", start_age=65,
        tfsa_balance=0, rrif_balance=0, rrsp_balance=0, nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=66,
        strategy="minimize-income",
        spending_go_go=50000, spending_slow_go=50000, spending_no_go=50000,
        general_inflation=0.00, spending_inflation=0.00
    )

    df = simulate(household, tax_cfg)
    row = df.iloc[0]

    print(f"\nYear 1 Results:")
    print(f"  RRIF Start:       $200,000.00")
    print(f"  RRIF Withdrawal:  ${row['withdraw_rrif_p1']:,.2f}")
    print(f"  RRIF End:         ${row['end_rrif_p1']:,.2f}")
    print(f"  RRIF Growth:      ${row['growth_rrif_p1']:,.2f}")
    print(f"\n  Taxable Income:   ${row['taxable_inc_p1']:,.2f}")
    print(f"  Tax Paid:         ${row['tax_p1']:,.2f}")
    print(f"  Total Withdrawals:${row['total_withdrawals']:,.2f}")
    print(f"  Total Tax:        ${row['total_tax']:,.2f}")
    print(f"  Underfunded:      ${row['underfunded_after_tax']:,.2f}")
    print(f"  Is Underfunded:   {row['is_underfunded']}")

    checks_passed = True

    # Check 1: RRIF balance should decrease
    if row['end_rrif_p1'] >= 200000:
        print("\n❌ FAIL: RRIF balance should decrease")
        checks_passed = False
    else:
        print("\n✅ PASS: RRIF balance decreased")

    # Check 2: Should withdraw something from RRIF
    if row['withdraw_rrif_p1'] <= 0:
        print("❌ FAIL: RRIF withdrawal should be > 0")
        checks_passed = False
    else:
        print(f"✅ PASS: RRIF withdrawal = ${row['withdraw_rrif_p1']:,.2f}")

    # Check 3: Tax calculation (with $50k withdrawal, should have tax in AB)
    # With ~$50k taxable income, expect roughly $3-5k tax in Alberta
    if row['taxable_inc_p1'] > 25000 and row['tax_p1'] <= 100:
        print(f"❌ FAIL: Tax should be > $100 on ${row['taxable_inc_p1']:,.2f} taxable income")
        checks_passed = False
    elif row['taxable_inc_p1'] > 0:
        print(f"✅ PASS: Tax calculated = ${row['tax_p1']:,.2f} on ${row['taxable_inc_p1']:,.2f} income")
    else:
        print(f"✅ PASS: No taxable income, so $0 tax is correct")

    # Check 4: Spending should be close to target ($50k after-tax)
    after_tax_received = row['total_withdrawals'] - row['total_tax']
    spending_diff = abs(50000 - after_tax_received)
    if spending_diff > 1000:
        print(f"❌ FAIL: After-tax amount ${after_tax_received:,.2f} is ${spending_diff:,.2f} from $50,000 target")
        checks_passed = False
    else:
        print(f"✅ PASS: After-tax amount ${after_tax_received:,.2f} close to $50,000 target (within ${spending_diff:,.2f})")

    return checks_passed


def test_cpp_oas_inflation():
    """Test 4: Verify CPP/OAS inflation adjustments"""
    print("\n" + "="*80)
    print("TEST 4: CPP/OAS Inflation Adjustments")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Create test with CPP/OAS, 2% inflation
    p1 = Person(
        name="Test", start_age=65,
        tfsa_balance=100000, yield_tfsa_growth=0.0,
        rrif_balance=0, rrsp_balance=0, nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=15000, oas_annual_at_start=8000,
        cpp_start_age=65, oas_start_age=65
    )

    p2 = Person(
        name="None", start_age=65,
        tfsa_balance=0, rrif_balance=0, rrsp_balance=0, nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=68,
        strategy="tfsa-first", spending_go_go=0, spending_slow_go=0, spending_no_go=0,
        general_inflation=0.02
    )

    df = simulate(household, tax_cfg)

    print(f"\n{'Year':<8} {'Age':<6} {'CPP Exp.':<12} {'CPP Act.':<12} {'OAS Exp.':<12} {'OAS Act.':<12} {'Status'}")
    print("-" * 80)

    expected_cpp = 15000
    expected_oas = 8000
    all_passed = True

    for idx, row in df.iterrows():
        year = row['year']
        age = row['age_p1']
        actual_cpp = row['cpp_p1']
        actual_oas = row['oas_p1']

        cpp_match = abs(actual_cpp - expected_cpp) < 1.0
        oas_match = abs(actual_oas - expected_oas) < 1.0
        status = "✅ PASS" if (cpp_match and oas_match) else "❌ FAIL"

        print(f"{year:<8} {age:<6} ${expected_cpp:<11,.2f} ${actual_cpp:<11,.2f} ${expected_oas:<11,.2f} ${actual_oas:<11,.2f} {status}")

        if not (cpp_match and oas_match):
            all_passed = False

        expected_cpp *= 1.02
        expected_oas *= 1.02

    return all_passed


def run_tests():
    """Run all tests"""
    print("\n" + "="*80)
    print("RETIREMENT SIMULATION - QUICK REGRESSION TEST")
    print("="*80)

    results = {
        "Compound Growth": test_compound_growth(),
        "RRIF Minimums": test_rrif_minimum(),
        "Tax & Withdrawals": test_tax_and_withdrawals(),
        "CPP/OAS Inflation": test_cpp_oas_inflation(),
    }

    print("\n" + "="*80)
    print("FINAL RESULTS")
    print("="*80)

    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:<30} {status}")

    total = len(results)
    passed = sum(results.values())

    print("\n" + "="*80)
    print(f"SUMMARY: {passed}/{total} tests passed")

    if passed == total:
        print("✅ ALL TESTS PASSED - Calculations are correct!")
    else:
        print(f"❌ {total - passed} TEST(S) FAILED - Please review errors")

    print("="*80 + "\n")

    return passed == total


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
