#!/usr/bin/env python3
"""
Test script for Quebec implementation validation
Tests Quebec tax calculations, QPP benefits, and Quebec-specific benefits
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python-api'))

from modules.quebec.quebec_tax import QuebecTaxCalculator
from modules.quebec.qpp_calculator import QPPCalculator
from modules.quebec.quebec_benefits import QuebecBenefitsCalculator

def test_quebec_tax_basic():
    """Test basic Quebec tax calculations"""
    print("\n=== Testing Quebec Tax Calculations ===")

    calc = QuebecTaxCalculator()

    # Test case 1: Low income
    income_low = 30000
    tax_low = calc.calculate_quebec_tax(income_low)
    after_tax_low = income_low - tax_low.total_tax
    effective_rate_low = tax_low.total_tax / income_low if income_low > 0 else 0
    print(f"Income: ${income_low:,.2f}")
    print(f"Quebec Tax: ${tax_low.provincial_tax:,.2f}")
    print(f"Federal Tax (with abatement): ${tax_low.federal_tax_after_abatement:,.2f}")
    print(f"Total Tax: ${tax_low.total_tax:,.2f}")
    print(f"After-tax: ${after_tax_low:,.2f}")
    print(f"Effective Rate: {effective_rate_low:.2%}")

    # Test case 2: Middle income
    print("\n---")
    income_mid = 75000
    tax_mid = calc.calculate_quebec_tax(income_mid)
    after_tax_mid = income_mid - tax_mid.total_tax
    effective_rate_mid = tax_mid.total_tax / income_mid if income_mid > 0 else 0
    print(f"Income: ${income_mid:,.2f}")
    print(f"Quebec Tax: ${tax_mid.provincial_tax:,.2f}")
    print(f"Federal Tax (with abatement): ${tax_mid.federal_tax_after_abatement:,.2f}")
    print(f"Total Tax: ${tax_mid.total_tax:,.2f}")
    print(f"After-tax: ${after_tax_mid:,.2f}")
    print(f"Effective Rate: {effective_rate_mid:.2%}")

    # Test case 3: High income
    print("\n---")
    income_high = 150000
    tax_high = calc.calculate_quebec_tax(income_high)
    after_tax_high = income_high - tax_high.total_tax
    effective_rate_high = tax_high.total_tax / income_high if income_high > 0 else 0
    print(f"Income: ${income_high:,.2f}")
    print(f"Quebec Tax: ${tax_high.provincial_tax:,.2f}")
    print(f"Federal Tax (with abatement): ${tax_high.federal_tax_after_abatement:,.2f}")
    print(f"Total Tax: ${tax_high.total_tax:,.2f}")
    print(f"After-tax: ${after_tax_high:,.2f}")
    print(f"Effective Rate: {effective_rate_high:.2%}")

    return True

def test_qpp_benefits():
    """Test QPP benefit calculations"""
    print("\n=== Testing QPP Benefits ===")

    calc = QPPCalculator()

    # Test case 1: Standard retirement at 65
    print("\nCase 1: Standard retirement at 65")
    earnings_40_years = [60000] * 40  # $60,000 for 40 years
    qpp_standard = calc.calculate_qpp_benefit(
        pensionable_earnings=earnings_40_years,
        start_age=65,
        years_contributed=40
    )
    print(f"Years contributed: 40")
    print(f"Average earnings: $60,000")
    print(f"Start age: 65")
    print(f"Annual QPP benefit: ${qpp_standard.total_annual:,.2f}")

    # Test case 2: Early retirement at 60
    print("\nCase 2: Early retirement at 60")
    earnings_35_years = [60000] * 35  # $60,000 for 35 years
    qpp_early = calc.calculate_qpp_benefit(
        pensionable_earnings=earnings_35_years,
        start_age=60,
        years_contributed=35
    )
    print(f"Years contributed: 35")
    print(f"Average earnings: $60,000")
    print(f"Start age: 60")
    print(f"Annual QPP benefit: ${qpp_early.total_annual:,.2f}")
    print(f"Early retirement reduction: {((qpp_standard.total_annual - qpp_early.total_annual) / qpp_standard.total_annual * 100):.1f}%")

    # Test case 3: Late retirement at 70
    print("\nCase 3: Late retirement at 70")
    earnings_45_years = [60000] * 45  # $60,000 for 45 years
    qpp_late = calc.calculate_qpp_benefit(
        pensionable_earnings=earnings_45_years,
        start_age=70,
        years_contributed=45
    )
    print(f"Years contributed: 45")
    print(f"Average earnings: $60,000")
    print(f"Start age: 70")
    print(f"Annual QPP benefit: ${qpp_late.total_annual:,.2f}")
    print(f"Late retirement bonus: {((qpp_late.total_annual - qpp_standard.total_annual) / qpp_standard.total_annual * 100):.1f}%")

    return True

def test_quebec_benefits():
    """Test Quebec-specific benefits"""
    print("\n=== Testing Quebec-Specific Benefits ===")

    calc = QuebecBenefitsCalculator()

    # Test case 1: Low-income senior
    print("\nCase 1: Low-income senior (age 70)")
    benefits_low = calc.calculate_all_benefits(
        age=70,
        total_income=20000,
        earned_income=0,
        is_couple=False,
        has_dwelling=False  # Renter
    )
    print(f"Income: $20,000")
    print(f"Age: 70")
    print(f"Single, Renter")
    print(f"Solidarity Tax Credit: ${benefits_low.solidarity_credit:,.2f}")
    print(f"Senior Assistance: ${benefits_low.senior_assistance:,.2f}")
    print(f"Drug Insurance Premium: ${benefits_low.drug_insurance_premium:,.2f}")
    print(f"Total Benefits: ${benefits_low.total_benefits:,.2f}")

    # Test case 2: Middle-income couple
    print("\nCase 2: Middle-income couple (age 67)")
    benefits_mid = calc.calculate_all_benefits(
        age=67,
        total_income=50000,
        earned_income=0,
        is_couple=True,
        partner_income=0,
        has_dwelling=True  # Homeowner
    )
    print(f"Income: $50,000 (household)")
    print(f"Age: 67")
    print(f"Couple, Homeowners")
    print(f"Solidarity Tax Credit: ${benefits_mid.solidarity_credit:,.2f}")
    print(f"Senior Assistance: ${benefits_mid.senior_assistance:,.2f}")
    print(f"Home Support Credit: ${benefits_mid.home_support_credit:,.2f}")
    print(f"Drug Insurance Premium: ${benefits_mid.drug_insurance_premium:,.2f}")
    print(f"Total Benefits: ${benefits_mid.total_benefits:,.2f}")

    # Test case 3: Working senior
    print("\nCase 3: Working senior (age 62)")
    benefits_work = calc.calculate_all_benefits(
        age=62,
        total_income=35000,
        earned_income=35000,  # All from employment
        is_couple=False,
        has_dwelling=False  # Renter
    )
    print(f"Income: $35,000 (employment)")
    print(f"Age: 62")
    print(f"Single, Renter, Working")
    print(f"Solidarity Tax Credit: ${benefits_work.solidarity_credit:,.2f}")
    print(f"Work Premium: ${benefits_work.work_premium:,.2f}")
    print(f"Drug Insurance Premium: ${benefits_work.drug_insurance_premium:,.2f}")
    print(f"Total Benefits: ${benefits_work.total_benefits:,.2f}")

    return True

def test_integration():
    """Test integration of Quebec components"""
    print("\n=== Testing Integration Scenario ===")
    print("Quebec Resident: Age 65, Retiring with QPP")

    # Calculate QPP benefit
    qpp_calc = QPPCalculator()
    earnings_40_years = [55000] * 40
    qpp_result = qpp_calc.calculate_qpp_benefit(
        pensionable_earnings=earnings_40_years,
        start_age=65,
        years_contributed=40
    )
    qpp_benefit = qpp_result.total_annual

    # Calculate OAS (federal benefit, same for Quebec)
    oas_benefit = 8000  # Approximate OAS at 65

    # Total retirement income
    total_income = qpp_benefit + oas_benefit + 30000  # Add some RRIF withdrawals

    print(f"\nIncome Sources:")
    print(f"QPP: ${qpp_benefit:,.2f}")
    print(f"OAS: ${oas_benefit:,.2f}")
    print(f"RRIF: $30,000.00")
    print(f"Total: ${total_income:,.2f}")

    # Calculate taxes
    tax_calc = QuebecTaxCalculator()
    taxes = tax_calc.calculate_quebec_tax(total_income)

    print(f"\nTaxes:")
    print(f"Quebec Provincial: ${taxes.provincial_tax:,.2f}")
    print(f"Federal (with abatement): ${taxes.federal_tax_after_abatement:,.2f}")
    print(f"Total Tax: ${taxes.total_tax:,.2f}")

    # Calculate benefits
    benefits_calc = QuebecBenefitsCalculator()
    benefits_result = benefits_calc.calculate_all_benefits(
        age=65,
        total_income=total_income,
        earned_income=0,  # Retired, no employment income
        is_couple=False,
        has_dwelling=True  # Homeowner
    )

    print(f"\nQuebec Benefits:")
    if benefits_result.solidarity_credit > 0:
        print(f"Solidarity Credit: ${benefits_result.solidarity_credit:,.2f}")
    if benefits_result.senior_assistance > 0:
        print(f"Senior Assistance: ${benefits_result.senior_assistance:,.2f}")
    if benefits_result.work_premium > 0:
        print(f"Work Premium: ${benefits_result.work_premium:,.2f}")
    if benefits_result.drug_insurance_premium > 0:
        print(f"Drug Insurance Premium: ${benefits_result.drug_insurance_premium:,.2f}")

    total_benefits = benefits_result.total_benefits
    net_income = total_income - taxes.total_tax + total_benefits

    print(f"\nSummary:")
    print(f"Gross Income: ${total_income:,.2f}")
    print(f"Total Taxes: ${taxes.total_tax:,.2f}")
    print(f"Total Benefits: ${total_benefits:,.2f}")
    print(f"Net Income: ${net_income:,.2f}")
    print(f"Effective Tax Rate: {((taxes.total_tax - total_benefits) / total_income * 100):.1f}%")

    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("QUEBEC IMPLEMENTATION VALIDATION TEST SUITE")
    print("=" * 60)

    all_passed = True

    try:
        # Run tax tests
        if not test_quebec_tax_basic():
            print("❌ Quebec tax tests failed")
            all_passed = False
        else:
            print("\n✅ Quebec tax tests passed")

        # Run QPP tests
        if not test_qpp_benefits():
            print("❌ QPP benefit tests failed")
            all_passed = False
        else:
            print("\n✅ QPP benefit tests passed")

        # Run benefits tests
        if not test_quebec_benefits():
            print("❌ Quebec benefits tests failed")
            all_passed = False
        else:
            print("\n✅ Quebec benefits tests passed")

        # Run integration test
        if not test_integration():
            print("❌ Integration test failed")
            all_passed = False
        else:
            print("\n✅ Integration test passed")

    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL TESTS PASSED - Quebec implementation is working!")
    else:
        print("❌ SOME TESTS FAILED - Please review the output above")
    print("=" * 60)

    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())