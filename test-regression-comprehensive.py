#!/usr/bin/env python3
"""
Comprehensive regression test suite for the simulation module
Tests various scenarios to ensure the sys fix doesn't break anything
"""

import sys
import os
import json
import traceback
from typing import Dict, List, Tuple

# Add python-api to path
sys.path.insert(0, 'python-api')

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

# Test results tracking
test_results = {
    'passed': 0,
    'failed': 0,
    'errors': []
}

def create_test_person(name: str, age: int, has_assets: bool = True) -> Person:
    """Create a test person with standard configuration"""
    if has_assets:
        return Person(
            name=name,
            start_age=age,
            tfsa_balance=100000.0,
            rrif_balance=200000.0,
            rrsp_balance=50000.0,
            nonreg_balance=75000.0,
            nonreg_acb=60000.0,
            corporate_balance=150000.0,
            primary_residence_value=500000.0,
            primary_residence_mortgage=0.0,
            cpp_start_age=age if age >= 60 else 65,
            cpp_annual_at_start=15000.0,
            oas_start_age=65,
            pension_incomes=[],
            other_incomes=[]
        )
    else:
        # Empty person for single scenarios
        return Person(
            name="",
            start_age=0,
            tfsa_balance=0.0,
            rrif_balance=0.0,
            rrsp_balance=0.0,
            nonreg_balance=0.0,
            nonreg_acb=0.0,
            corporate_balance=0.0,
            primary_residence_value=0.0,
            primary_residence_mortgage=0.0,
            cpp_start_age=0,
            cpp_annual_at_start=0.0,
            oas_start_age=0,
            pension_incomes=[],
            other_incomes=[]
        )

def run_test(test_name: str, household: Household, tax_cfg: Dict) -> bool:
    """Run a single test and track results"""
    print(f"\n🧪 Testing: {test_name}")
    print(f"   Strategy: {household.strategy}")
    print(f"   P1: {household.p1.name}, age {household.p1.start_age}")
    if household.p2 and household.p2.name:
        print(f"   P2: {household.p2.name}, age {household.p2.start_age}")

    try:
        # Run simulation
        df = simulate(household, tax_cfg)

        # Validate results
        if len(df) == 0:
            raise ValueError("Simulation returned empty DataFrame")

        expected_years = household.end_age - household.p1.start_age + 1
        if len(df) != expected_years:
            raise ValueError(f"Expected {expected_years} years, got {len(df)}")

        # Check for critical columns
        required_columns = ['year', 'age_p1', 'tfsa_p1', 'rrif_p1', 'nonreg_p1']
        for col in required_columns:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        # Check for NaN values in critical columns
        critical_cols = ['total_taxes', 'after_tax_income', 'net_spending']
        for col in critical_cols:
            if col in df.columns and df[col].isna().any():
                raise ValueError(f"NaN values found in {col}")

        # Strategy-specific validations
        if "minimize-income" in household.strategy.lower() or "gis" in household.strategy.lower():
            # Check if strategy insights were generated (if module exists)
            if hasattr(df, 'attrs') and 'strategy_insights' in df.attrs:
                print(f"   ✓ Strategy insights generated successfully")

        print(f"   ✅ PASSED - {len(df)} years simulated successfully")
        test_results['passed'] += 1
        return True

    except Exception as e:
        error_msg = f"{test_name}: {type(e).__name__}: {str(e)}"
        print(f"   ❌ FAILED - {error_msg}")
        test_results['failed'] += 1
        test_results['errors'].append(error_msg)

        # Print traceback for debugging
        if "--verbose" in sys.argv:
            traceback.print_exc()

        return False

def test_all_strategies(tax_cfg: Dict):
    """Test all available strategies"""
    strategies = [
        "Balanced",
        "TFSA-First",
        "RRIF-First",
        "NonReg-First",
        "Corporate-Optimized",
        "GIS-Optimized",
        "minimize-income",
        "rrif-frontload-65",
        "rrif-frontload-70",
        "rrif-frontload-75"
    ]

    print("\n" + "="*60)
    print("TESTING ALL STRATEGIES")
    print("="*60)

    for strategy in strategies:
        p1 = create_test_person("John", 65, True)
        p2 = create_test_person("Jane", 63, True)

        # Set corporate details for both
        for person in [p1, p2]:
            person.corporate_details = {
                'cash_percentage': 0.1,
                'gic_percentage': 0.2,
                'investment_percentage': 0.7,
                'yield_interest': 0.02,
                'yield_eligible_dividends': 0.02,
                'yield_non_eligible_dividends': 0.01,
                'yield_capital_gains': 0.03,
                'rdtoh_balance': 0.0
            }
            person.nonreg_details = {
                'interest_yield': 0.02,
                'eligible_dividend_yield': 0.015,
                'foreign_dividend_yield': 0.01,
                'other_income_yield': 0.005
            }

        household = Household(
            p1=p1, p2=p2,
            province="ON",
            start_year=2025,
            end_age=90,
            strategy=strategy,
            spending_go_go=100000.0,
            spending_slow_go=85000.0,
            spending_no_go=70000.0,
            go_go_end_age=75,
            slow_go_end_age=85,
            spending_inflation=0.02,
            general_inflation=0.02
        )

        run_test(f"Strategy: {strategy}", household, tax_cfg)

def test_single_vs_couple(tax_cfg: Dict):
    """Test single person vs couple scenarios"""
    print("\n" + "="*60)
    print("TESTING SINGLE VS COUPLE SCENARIOS")
    print("="*60)

    # Test single person
    p1 = create_test_person("Single Person", 67, True)
    p2 = create_test_person("", 0, False)  # Empty person

    p1.corporate_details = {
        'cash_percentage': 0.1,
        'gic_percentage': 0.2,
        'investment_percentage': 0.7,
        'yield_interest': 0.02,
        'yield_eligible_dividends': 0.02,
        'yield_non_eligible_dividends': 0.01,
        'yield_capital_gains': 0.03,
        'rdtoh_balance': 0.0
    }
    p1.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    household_single = Household(
        p1=p1, p2=p2,
        province="BC",
        start_year=2025,
        end_age=95,
        strategy="Balanced",
        spending_go_go=60000.0,
        spending_slow_go=50000.0,
        spending_no_go=40000.0,
        go_go_end_age=75,
        slow_go_end_age=85,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    run_test("Single Person Scenario", household_single, tax_cfg)

    # Test couple
    p1 = create_test_person("Spouse 1", 70, True)
    p2 = create_test_person("Spouse 2", 68, True)

    for person in [p1, p2]:
        person.corporate_details = {
            'cash_percentage': 0.1,
            'gic_percentage': 0.2,
            'investment_percentage': 0.7,
            'yield_interest': 0.02,
            'yield_eligible_dividends': 0.02,
            'yield_non_eligible_dividends': 0.01,
            'yield_capital_gains': 0.03,
            'rdtoh_balance': 0.0
        }
        person.nonreg_details = {
            'interest_yield': 0.02,
            'eligible_dividend_yield': 0.015,
            'foreign_dividend_yield': 0.01,
            'other_income_yield': 0.005
        }

    household_couple = Household(
        p1=p1, p2=p2,
        province="AB",
        start_year=2025,
        end_age=95,
        strategy="Corporate-Optimized",
        spending_go_go=120000.0,
        spending_slow_go=100000.0,
        spending_no_go=80000.0,
        go_go_end_age=78,
        slow_go_end_age=88,
        spending_inflation=0.025,
        general_inflation=0.025
    )

    run_test("Couple Scenario", household_couple, tax_cfg)

def test_edge_cases(tax_cfg: Dict):
    """Test edge cases and boundary conditions"""
    print("\n" + "="*60)
    print("TESTING EDGE CASES")
    print("="*60)

    # Test 1: Very old starting age
    p1 = create_test_person("Old Start", 85, True)
    p2 = create_test_person("", 0, False)

    p1.corporate_details = {
        'cash_percentage': 0.1,
        'gic_percentage': 0.2,
        'investment_percentage': 0.7,
        'yield_interest': 0.02,
        'yield_eligible_dividends': 0.02,
        'yield_non_eligible_dividends': 0.01,
        'yield_capital_gains': 0.03,
        'rdtoh_balance': 0.0
    }
    p1.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    household = Household(
        p1=p1, p2=p2,
        province="QC",
        start_year=2025,
        end_age=95,
        strategy="RRIF-First",
        spending_go_go=50000.0,
        spending_slow_go=45000.0,
        spending_no_go=40000.0,
        go_go_end_age=87,
        slow_go_end_age=92,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    run_test("Edge Case: Very Old Starting Age", household, tax_cfg)

    # Test 2: Low asset balances
    p1 = Person(
        name="Low Assets",
        start_age=65,
        tfsa_balance=10000.0,
        rrif_balance=20000.0,
        rrsp_balance=5000.0,
        nonreg_balance=15000.0,
        nonreg_acb=12000.0,
        corporate_balance=0.0,
        primary_residence_value=200000.0,
        primary_residence_mortgage=0.0,
        cpp_start_age=65,
        cpp_annual_at_start=8000.0,
        oas_start_age=65,
        pension_incomes=[],
        other_incomes=[]
    )
    p2 = create_test_person("", 0, False)

    p1.corporate_details = {
        'cash_percentage': 0.1,
        'gic_percentage': 0.2,
        'investment_percentage': 0.7,
        'yield_interest': 0.02,
        'yield_eligible_dividends': 0.02,
        'yield_non_eligible_dividends': 0.01,
        'yield_capital_gains': 0.03,
        'rdtoh_balance': 0.0
    }
    p1.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    household = Household(
        p1=p1, p2=p2,
        province="ON",
        start_year=2025,
        end_age=85,
        strategy="GIS-Optimized",
        spending_go_go=30000.0,
        spending_slow_go=25000.0,
        spending_no_go=20000.0,
        go_go_end_age=72,
        slow_go_end_age=80,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    run_test("Edge Case: Low Asset Balances", household, tax_cfg)

    # Test 3: High spending requirements
    p1 = create_test_person("High Spender", 60, True)
    p2 = create_test_person("", 0, False)

    p1.corporate_details = {
        'cash_percentage': 0.1,
        'gic_percentage': 0.2,
        'investment_percentage': 0.7,
        'yield_interest': 0.02,
        'yield_eligible_dividends': 0.02,
        'yield_non_eligible_dividends': 0.01,
        'yield_capital_gains': 0.03,
        'rdtoh_balance': 0.0
    }
    p1.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    household = Household(
        p1=p1, p2=p2,
        province="BC",
        start_year=2025,
        end_age=90,
        strategy="Balanced",
        spending_go_go=200000.0,  # Very high spending
        spending_slow_go=150000.0,
        spending_no_go=100000.0,
        go_go_end_age=70,
        slow_go_end_age=80,
        spending_inflation=0.03,
        general_inflation=0.03
    )

    run_test("Edge Case: High Spending Requirements", household, tax_cfg)

def test_pension_and_income(tax_cfg: Dict):
    """Test scenarios with pension and other income"""
    print("\n" + "="*60)
    print("TESTING PENSION AND OTHER INCOME")
    print("="*60)

    p1 = create_test_person("With Pension", 65, True)
    p2 = create_test_person("", 0, False)

    # Add pension income
    p1.pension_incomes = [
        {"amount": 30000, "startAge": 65, "inflationIndexed": True}
    ]

    # Add other income
    p1.other_incomes = [
        {"amount": 10000, "startAge": 65, "endAge": 70, "inflationIndexed": False}
    ]

    p1.corporate_details = {
        'cash_percentage': 0.1,
        'gic_percentage': 0.2,
        'investment_percentage': 0.7,
        'yield_interest': 0.02,
        'yield_eligible_dividends': 0.02,
        'yield_non_eligible_dividends': 0.01,
        'yield_capital_gains': 0.03,
        'rdtoh_balance': 0.0
    }
    p1.nonreg_details = {
        'interest_yield': 0.02,
        'eligible_dividend_yield': 0.015,
        'foreign_dividend_yield': 0.01,
        'other_income_yield': 0.005
    }

    household = Household(
        p1=p1, p2=p2,
        province="ON",
        start_year=2025,
        end_age=90,
        strategy="Balanced",
        spending_go_go=90000.0,
        spending_slow_go=75000.0,
        spending_no_go=60000.0,
        go_go_end_age=75,
        slow_go_end_age=85,
        spending_inflation=0.02,
        general_inflation=0.02
    )

    run_test("With Pension and Other Income", household, tax_cfg)

def test_provinces(tax_cfg: Dict):
    """Test all provinces"""
    print("\n" + "="*60)
    print("TESTING ALL PROVINCES")
    print("="*60)

    provinces = ["AB", "BC", "ON", "QC"]

    for province in provinces:
        p1 = create_test_person("Test", 65, True)
        p2 = create_test_person("", 0, False)

        p1.corporate_details = {
            'cash_percentage': 0.1,
            'gic_percentage': 0.2,
            'investment_percentage': 0.7,
            'yield_interest': 0.02,
            'yield_eligible_dividends': 0.02,
            'yield_non_eligible_dividends': 0.01,
            'yield_capital_gains': 0.03,
            'rdtoh_balance': 0.0
        }
        p1.nonreg_details = {
            'interest_yield': 0.02,
            'eligible_dividend_yield': 0.015,
            'foreign_dividend_yield': 0.01,
            'other_income_yield': 0.005
        }

        household = Household(
            p1=p1, p2=p2,
            province=province,
            start_year=2025,
            end_age=85,
            strategy="Balanced",
            spending_go_go=70000.0,
            spending_slow_go=60000.0,
            spending_no_go=50000.0,
            go_go_end_age=75,
            slow_go_end_age=82,
            spending_inflation=0.02,
            general_inflation=0.02
        )

        run_test(f"Province: {province}", household, tax_cfg)

def main():
    """Main test runner"""
    print("="*60)
    print("COMPREHENSIVE REGRESSION TEST SUITE")
    print("Testing simulation module after sys fix")
    print("="*60)

    # Load tax configuration
    try:
        tax_cfg = load_tax_config('tax_config_canada_2025.json')
        print("✅ Tax configuration loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load tax config: {e}")
        sys.exit(1)

    # Run all test suites
    test_all_strategies(tax_cfg)
    test_single_vs_couple(tax_cfg)
    test_edge_cases(tax_cfg)
    test_pension_and_income(tax_cfg)
    test_provinces(tax_cfg)

    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    print(f"📊 Total:  {test_results['passed'] + test_results['failed']}")

    if test_results['failed'] > 0:
        print(f"\nFailed Tests:")
        for error in test_results['errors']:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print("\n🎉 ALL TESTS PASSED! The fix is working correctly.")
        print("No regression issues detected.")

if __name__ == "__main__":
    main()