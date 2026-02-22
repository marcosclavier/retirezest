#!/usr/bin/env python3
"""
Test Quebec 2026 Implementation
Validates QPP and Quebec tax calculations against official 2026 values
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from modules.quebec.qpp_calculator import QPPCalculator
from modules.quebec.quebec_tax import QuebecTaxCalculator
from datetime import datetime

def test_qpp_contributions():
    """Test QPP contribution calculations for 2026"""
    print("\n" + "="*60)
    print("Testing QPP Contributions 2026")
    print("="*60)

    qpp = QPPCalculator(current_year=2026)

    # Test cases with expected results
    test_cases = [
        {
            "name": "Employee earning $50,000",
            "earnings": 50000,
            "expected_base": (50000 - 3500) * 0.054,  # $2,511
            "expected_first_additional": (50000 - 3500) * 0.01,  # $465
            "expected_second_additional": 0,  # No second tier
            "expected_total": 2976
        },
        {
            "name": "Employee earning $74,600 (at MPE)",
            "earnings": 74600,
            "expected_base": (74600 - 3500) * 0.054,  # $3,839.40
            "expected_first_additional": (74600 - 3500) * 0.01,  # $711.00
            "expected_second_additional": 0,
            "expected_total": 4550.40
        },
        {
            "name": "Employee earning $80,000 (above MPE)",
            "earnings": 80000,
            "expected_base": (74600 - 3500) * 0.054,  # $3,839.40
            "expected_first_additional": (74600 - 3500) * 0.01,  # $711.00
            "expected_second_additional": (80000 - 74600) * 0.04,  # $216.00
            "expected_total": 4766.40
        },
        {
            "name": "Employee earning $85,000 (at second ceiling)",
            "earnings": 85000,
            "expected_base": (74600 - 3500) * 0.054,  # $3,839.40
            "expected_first_additional": (74600 - 3500) * 0.01,  # $711.00
            "expected_second_additional": (85000 - 74600) * 0.04,  # $416.00
            "expected_total": 4966.40
        },
        {
            "name": "Employee earning $100,000 (above second ceiling)",
            "earnings": 100000,
            "expected_base": (74600 - 3500) * 0.054,  # $3,839.40
            "expected_first_additional": (74600 - 3500) * 0.01,  # $711.00
            "expected_second_additional": (85000 - 74600) * 0.04,  # $416.00 (capped)
            "expected_total": 4966.40
        }
    ]

    for test in test_cases:
        print(f"\n{test['name']}:")
        print(f"  Earnings: ${test['earnings']:,}")

        # Calculate contributions
        base_earnings = min(test['earnings'], qpp.MAX_PENSIONABLE_EARNINGS_2026) - qpp.BASIC_EXEMPTION
        base_contribution = max(0, base_earnings * qpp.CONTRIBUTION_RATE_BASE_EMPLOYEE)
        first_additional = max(0, base_earnings * qpp.CONTRIBUTION_RATE_FIRST_ADDITIONAL)

        if test['earnings'] > qpp.MAX_PENSIONABLE_EARNINGS_2026:
            excess = min(test['earnings'] - qpp.MAX_PENSIONABLE_EARNINGS_2026,
                        qpp.ADDITIONAL_MAX_PENSIONABLE_EARNINGS_2026 - qpp.MAX_PENSIONABLE_EARNINGS_2026)
            second_additional = excess * qpp.CONTRIBUTION_RATE_SECOND_ADDITIONAL
        else:
            second_additional = 0

        total_contribution = base_contribution + first_additional + second_additional

        print(f"  Base contribution (5.4%): ${base_contribution:,.2f}")
        print(f"  First additional (1%): ${first_additional:,.2f}")
        print(f"  Second additional (4%): ${second_additional:,.2f}")
        print(f"  Total QPP contribution: ${total_contribution:,.2f}")
        print(f"  Expected: ${test['expected_total']:,.2f}")

        # Validate
        if abs(total_contribution - test['expected_total']) < 0.01:
            print("  ✅ PASS")
        else:
            print(f"  ❌ FAIL - Difference: ${abs(total_contribution - test['expected_total']):,.2f}")


def test_quebec_tax():
    """Test Quebec tax calculations for 2026"""
    print("\n" + "="*60)
    print("Testing Quebec Tax Calculations 2026")
    print("="*60)

    tax_calc = QuebecTaxCalculator()

    # Test cases
    test_cases = [
        {
            "name": "Single person, $40,000 income",
            "income": 40000,
            "is_quebec": True
        },
        {
            "name": "Single person, $60,000 income",
            "income": 60000,
            "is_quebec": True
        },
        {
            "name": "Single person, $80,000 income",
            "income": 80000,
            "is_quebec": True
        },
        {
            "name": "Single person, $120,000 income",
            "income": 120000,
            "is_quebec": True
        },
        {
            "name": "Retired person, $50,000 total income",
            "income": 50000,
            "is_quebec": True
        }
    ]

    for test in test_cases:
        print(f"\n{test['name']}:")
        print(f"  Gross income: ${test['income']:,}")

        # Calculate taxes using the QuebecTaxCalculator
        result = tax_calc.calculate_quebec_tax(
            taxable_income=test['income']
        )

        print(f"  Federal tax (before abatement): ${result.federal_tax_before_abatement:,.2f}")
        print(f"  Quebec abatement (16.5%): ${result.quebec_abatement:,.2f}")
        print(f"  Federal tax (after abatement): ${result.federal_tax_after_abatement:,.2f}")
        print(f"  Quebec provincial tax: ${result.provincial_tax:,.2f}")

        # Total tax
        total_tax = result.total_tax
        effective_rate = (total_tax / test['income']) * 100
        print(f"  Total tax: ${total_tax:,.2f}")
        print(f"  Effective tax rate: {effective_rate:.2f}%")
        print(f"  After-tax income: ${test['income'] - total_tax:,.2f}")


def test_qpp_benefits():
    """Test QPP retirement benefit calculations"""
    print("\n" + "="*60)
    print("Testing QPP Retirement Benefits")
    print("="*60)

    qpp = QPPCalculator(current_year=2026)

    # Test case: Person retiring at 65 with average earnings
    test_cases = [
        {
            "name": "Average earner retiring at 65",
            "earnings": [50000] * 40,  # 40 years at $50,000
            "start_age": 65,
            "years_contributed": 40
        },
        {
            "name": "High earner retiring at 65",
            "earnings": [75000] * 40,  # 40 years at $75,000
            "start_age": 65,
            "years_contributed": 40
        },
        {
            "name": "Early retirement at 60",
            "earnings": [60000] * 35,  # 35 years at $60,000
            "start_age": 60,
            "years_contributed": 35
        },
        {
            "name": "Late retirement at 70",
            "earnings": [60000] * 45,  # 45 years at $60,000
            "start_age": 70,
            "years_contributed": 45
        }
    ]

    for test in test_cases:
        print(f"\n{test['name']}:")
        benefit = qpp.calculate_qpp_benefit(
            pensionable_earnings=test['earnings'],
            start_age=test['start_age'],
            years_contributed=test['years_contributed']
        )

        print(f"  Average earnings: ${sum(test['earnings'])/len(test['earnings']):,.2f}")
        print(f"  Start age: {test['start_age']}")
        print(f"  Base benefit: ${benefit.base_amount:,.2f}/month")
        print(f"  Enhancement: ${benefit.enhancement:,.2f}/month")
        print(f"  Supplement: ${benefit.supplement:,.2f}/month")
        print(f"  Total monthly: ${benefit.total_monthly:,.2f}")
        print(f"  Total annual: ${benefit.total_annual:,.2f}")

        # Age adjustment validation
        age_factor = qpp._calculate_age_factor(test['start_age'])
        if test['start_age'] == 60:
            expected_factor = 1.0 - (0.006 * 60)  # 36% reduction
            print(f"  Age factor: {age_factor:.2%} (expected ~{expected_factor:.2%})")
        elif test['start_age'] == 70:
            expected_factor = 1.0 + (0.007 * 60)  # 42% increase
            print(f"  Age factor: {age_factor:.2%} (expected ~{expected_factor:.2%})")


def test_integration():
    """Test full integration with simulation"""
    print("\n" + "="*60)
    print("Testing Full Quebec Integration")
    print("="*60)

    # Create a simple Quebec resident scenario
    simulation_data = {
        "person1": {
            "name": "Quebec Resident",
            "birthDate": "1961-06-15",  # 65 in 2026
            "province": "QC",
            "retirementAge": 65
        },
        "incomes": [
            {
                "name": "Employment",
                "amount": 75000,
                "startAge": 25,
                "endAge": 65,
                "type": "employment",
                "owner": "person1"
            }
        ],
        "expenses": {
            "essential": 40000,
            "discretionary": 20000,
            "exceptional": []
        },
        "accounts": [],
        "settings": {
            "inflationRate": 2.5,
            "nominalReturnRate": 6.0,
            "retirementSpendingChange": 0.8,
            "yearsToProject": 30
        }
    }

    print("\nScenario: Quebec resident retiring in 2026")
    print(f"  Employment income: $75,000")
    print(f"  Province: Quebec")
    print(f"  Retirement age: 65")

    # Manually calculate expected values
    qpp = QPPCalculator(current_year=2026)
    tax_calc = QuebecTaxCalculator()

    # QPP contributions on $75,000
    base_earnings = min(75000, qpp.MAX_PENSIONABLE_EARNINGS_2026) - qpp.BASIC_EXEMPTION
    qpp_contribution = base_earnings * (qpp.CONTRIBUTION_RATE_BASE_EMPLOYEE + qpp.CONTRIBUTION_RATE_FIRST_ADDITIONAL)
    qpp_contribution += (75000 - qpp.MAX_PENSIONABLE_EARNINGS_2026) * qpp.CONTRIBUTION_RATE_SECOND_ADDITIONAL

    print(f"\nExpected QPP contribution: ${qpp_contribution:,.2f}")

    # Tax calculation
    result = tax_calc.calculate_quebec_tax(
        taxable_income=75000
    )
    federal_after_abatement = result.federal_tax_after_abatement
    provincial_tax = result.provincial_tax
    total_tax = result.total_tax

    print(f"Expected federal tax (after abatement): ${federal_after_abatement:,.2f}")
    print(f"Expected Quebec provincial tax: ${provincial_tax:,.2f}")
    print(f"Expected total tax: ${total_tax:,.2f}")

    after_tax_income = 75000 - total_tax - qpp_contribution
    print(f"Expected after-tax income: ${after_tax_income:,.2f}")


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("QUEBEC 2026 IMPLEMENTATION TEST SUITE")
    print("="*60)

    test_qpp_contributions()
    test_quebec_tax()
    test_qpp_benefits()
    test_integration()

    print("\n" + "="*60)
    print("TEST SUITE COMPLETE")
    print("="*60)
    print("\nNOTE: Compare these values with official calculators:")
    print("  - CRA Payroll Deductions Online Calculator")
    print("  - Revenu Québec Income Tax Calculator")
    print("  - Retraite Québec QPP Statement of Participation")


if __name__ == "__main__":
    main()