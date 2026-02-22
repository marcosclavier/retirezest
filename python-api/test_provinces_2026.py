#!/usr/bin/env python3
"""
Test Suite for Canadian Provincial Tax Implementations 2026
Validates Ontario, Alberta, BC, and Quebec tax calculations
"""

import json
import sys
import os
from typing import Dict, Any

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def load_tax_config(filename: str = "tax_config_canada_2026.json") -> Dict[str, Any]:
    """Load tax configuration from JSON file"""
    with open(filename, 'r') as f:
        return json.load(f)

def calculate_federal_tax(income: float, config: Dict) -> Dict[str, float]:
    """Calculate federal tax based on 2026 brackets"""
    brackets = config['federal']['brackets']
    bpa = config['federal']['bpa_amount']
    bpa_rate = config['federal']['bpa_rate']

    # Calculate tax on brackets
    tax = 0.0
    remaining_income = income

    for i, bracket in enumerate(brackets):
        if i == len(brackets) - 1:
            # Last bracket
            tax += remaining_income * bracket['rate']
            break
        else:
            next_threshold = brackets[i + 1]['threshold']
            bracket_income = min(remaining_income, next_threshold - bracket['threshold'])
            if bracket_income > 0:
                tax += bracket_income * bracket['rate']
                remaining_income -= bracket_income
            if remaining_income <= 0:
                break

    # Apply basic personal amount credit
    bpa_credit = bpa * bpa_rate
    tax_after_credits = max(0, tax - bpa_credit)

    # Calculate marginal rate
    marginal_rate = 0.0
    for i in range(len(brackets) - 1, -1, -1):
        if income > brackets[i]['threshold']:
            marginal_rate = brackets[i]['rate']
            break

    return {
        'gross_tax': tax,
        'bpa_credit': bpa_credit,
        'net_tax': tax_after_credits,
        'marginal_rate': marginal_rate,
        'effective_rate': tax_after_credits / income if income > 0 else 0
    }

def calculate_provincial_tax(income: float, province: str, config: Dict) -> Dict[str, float]:
    """Calculate provincial tax for given province"""
    prov_config = config['provinces'][province]
    brackets = prov_config['brackets']
    bpa = prov_config['bpa_amount']
    bpa_rate = prov_config['bpa_rate']

    # Calculate tax on brackets
    tax = 0.0
    remaining_income = income

    for i, bracket in enumerate(brackets):
        if i == len(brackets) - 1:
            # Last bracket
            tax += remaining_income * bracket['rate']
            break
        else:
            next_threshold = brackets[i + 1]['threshold']
            bracket_income = min(remaining_income, next_threshold - bracket['threshold'])
            if bracket_income > 0:
                tax += bracket_income * bracket['rate']
                remaining_income -= bracket_income
            if remaining_income <= 0:
                break

    # Apply basic personal amount credit
    bpa_credit = bpa * bpa_rate
    tax_after_credits = max(0, tax - bpa_credit)

    # Calculate marginal rate
    marginal_rate = 0.0
    for i in range(len(brackets) - 1, -1, -1):
        if income > brackets[i]['threshold']:
            marginal_rate = brackets[i]['rate']
            break

    return {
        'gross_tax': tax,
        'bpa_credit': bpa_credit,
        'net_tax': tax_after_credits,
        'marginal_rate': marginal_rate,
        'effective_rate': tax_after_credits / income if income > 0 else 0
    }

def test_federal_tax_2026():
    """Test federal tax calculations with new 14% rate"""
    print("\n" + "="*60)
    print("Testing Federal Tax 2026 (with 14% first bracket)")
    print("="*60)

    config = load_tax_config()

    test_cases = [
        {"income": 30000, "name": "Low income"},
        {"income": 50000, "name": "Below first threshold"},
        {"income": 75000, "name": "Middle income"},
        {"income": 100000, "name": "Upper middle income"},
        {"income": 150000, "name": "High income"},
        {"income": 250000, "name": "Very high income"},
        {"income": 500000, "name": "Top bracket"}
    ]

    for test in test_cases:
        income = test['income']
        result = calculate_federal_tax(income, config)

        print(f"\n{test['name']} - ${income:,}:")
        print(f"  Gross tax: ${result['gross_tax']:,.2f}")
        print(f"  BPA credit: ${result['bpa_credit']:,.2f}")
        print(f"  Net federal tax: ${result['net_tax']:,.2f}")
        print(f"  Marginal rate: {result['marginal_rate']:.1%}")
        print(f"  Effective rate: {result['effective_rate']:.2%}")

        # Validate first bracket is 14%
        if income > 0 and income <= 57375:
            expected_marginal = 0.14
            if abs(result['marginal_rate'] - expected_marginal) < 0.001:
                print("  ✅ Correct 14% rate applied")
            else:
                print(f"  ❌ ERROR: Expected 14% marginal rate, got {result['marginal_rate']:.1%}")

def test_ontario_tax():
    """Test Ontario provincial tax calculations"""
    print("\n" + "="*60)
    print("Testing Ontario Provincial Tax 2026")
    print("="*60)

    config = load_tax_config()

    test_cases = [
        {"income": 40000, "name": "Low income"},
        {"income": 60000, "name": "Middle income"},
        {"income": 80000, "name": "Upper middle"},
        {"income": 120000, "name": "High income"},
        {"income": 200000, "name": "Very high income"}
    ]

    for test in test_cases:
        income = test['income']
        fed_result = calculate_federal_tax(income, config)
        prov_result = calculate_provincial_tax(income, 'ON', config)

        combined_tax = fed_result['net_tax'] + prov_result['net_tax']
        combined_marginal = fed_result['marginal_rate'] + prov_result['marginal_rate']

        print(f"\n{test['name']} - ${income:,}:")
        print(f"  Federal tax: ${fed_result['net_tax']:,.2f}")
        print(f"  Ontario tax: ${prov_result['net_tax']:,.2f}")
        print(f"  Combined tax: ${combined_tax:,.2f}")
        print(f"  Combined marginal rate: {combined_marginal:.2%}")
        print(f"  After-tax income: ${income - combined_tax:,.2f}")
        print(f"  Effective tax rate: {(combined_tax/income)*100:.2f}%")

def test_alberta_tax():
    """Test Alberta provincial tax calculations"""
    print("\n" + "="*60)
    print("Testing Alberta Provincial Tax 2026")
    print("="*60)

    config = load_tax_config()

    test_cases = [
        {"income": 40000, "name": "Low income"},
        {"income": 60000, "name": "Middle income"},
        {"income": 80000, "name": "Upper middle"},
        {"income": 120000, "name": "High income"},
        {"income": 200000, "name": "Very high income"}
    ]

    for test in test_cases:
        income = test['income']
        fed_result = calculate_federal_tax(income, config)
        prov_result = calculate_provincial_tax(income, 'AB', config)

        combined_tax = fed_result['net_tax'] + prov_result['net_tax']
        combined_marginal = fed_result['marginal_rate'] + prov_result['marginal_rate']

        print(f"\n{test['name']} - ${income:,}:")
        print(f"  Federal tax: ${fed_result['net_tax']:,.2f}")
        print(f"  Alberta tax: ${prov_result['net_tax']:,.2f}")
        print(f"  Combined tax: ${combined_tax:,.2f}")
        print(f"  Combined marginal rate: {combined_marginal:.2%}")
        print(f"  After-tax income: ${income - combined_tax:,.2f}")
        print(f"  Effective tax rate: {(combined_tax/income)*100:.2f}%")

def test_bc_tax():
    """Test British Columbia provincial tax calculations"""
    print("\n" + "="*60)
    print("Testing British Columbia Provincial Tax 2026")
    print("="*60)

    config = load_tax_config()

    test_cases = [
        {"income": 40000, "name": "Low income"},
        {"income": 60000, "name": "Middle income"},
        {"income": 80000, "name": "Upper middle"},
        {"income": 120000, "name": "High income"},
        {"income": 200000, "name": "Very high income"}
    ]

    for test in test_cases:
        income = test['income']
        fed_result = calculate_federal_tax(income, config)
        prov_result = calculate_provincial_tax(income, 'BC', config)

        combined_tax = fed_result['net_tax'] + prov_result['net_tax']
        combined_marginal = fed_result['marginal_rate'] + prov_result['marginal_rate']

        print(f"\n{test['name']} - ${income:,}:")
        print(f"  Federal tax: ${fed_result['net_tax']:,.2f}")
        print(f"  BC tax: ${prov_result['net_tax']:,.2f}")
        print(f"  Combined tax: ${combined_tax:,.2f}")
        print(f"  Combined marginal rate: {combined_marginal:.2%}")
        print(f"  After-tax income: ${income - combined_tax:,.2f}")
        print(f"  Effective tax rate: {(combined_tax/income)*100:.2f}%")

def test_quebec_with_abatement():
    """Test Quebec tax with federal abatement"""
    print("\n" + "="*60)
    print("Testing Quebec Tax with Federal Abatement 2026")
    print("="*60)

    config = load_tax_config()

    test_cases = [
        {"income": 40000, "name": "Low income"},
        {"income": 60000, "name": "Middle income"},
        {"income": 80000, "name": "Upper middle"},
        {"income": 120000, "name": "High income"}
    ]

    for test in test_cases:
        income = test['income']
        fed_result = calculate_federal_tax(income, config)

        # Apply Quebec abatement
        quebec_abatement_rate = config['provinces']['QC'].get('quebec_abatement', 0.165)
        fed_tax_before_abatement = fed_result['net_tax']
        quebec_abatement = fed_tax_before_abatement * quebec_abatement_rate
        fed_tax_after_abatement = fed_tax_before_abatement - quebec_abatement

        prov_result = calculate_provincial_tax(income, 'QC', config)

        combined_tax = fed_tax_after_abatement + prov_result['net_tax']

        print(f"\n{test['name']} - ${income:,}:")
        print(f"  Federal tax (before abatement): ${fed_tax_before_abatement:,.2f}")
        print(f"  Quebec abatement (16.5%): ${quebec_abatement:,.2f}")
        print(f"  Federal tax (after abatement): ${fed_tax_after_abatement:,.2f}")
        print(f"  Quebec provincial tax: ${prov_result['net_tax']:,.2f}")
        print(f"  Combined tax: ${combined_tax:,.2f}")
        print(f"  After-tax income: ${income - combined_tax:,.2f}")
        print(f"  Effective tax rate: {(combined_tax/income)*100:.2f}%")

def compare_provinces():
    """Compare tax burden across all provinces"""
    print("\n" + "="*60)
    print("Provincial Tax Comparison 2026")
    print("="*60)

    config = load_tax_config()
    provinces = ['AB', 'BC', 'ON', 'QC']
    test_incomes = [50000, 75000, 100000, 150000]

    for income in test_incomes:
        print(f"\nIncome: ${income:,}")
        print("-" * 40)

        results = []
        for province in provinces:
            fed_result = calculate_federal_tax(income, config)
            prov_result = calculate_provincial_tax(income, province, config)

            # Apply Quebec abatement if applicable
            if province == 'QC':
                quebec_abatement = fed_result['net_tax'] * 0.165
                fed_tax = fed_result['net_tax'] - quebec_abatement
            else:
                fed_tax = fed_result['net_tax']

            combined_tax = fed_tax + prov_result['net_tax']
            after_tax = income - combined_tax

            results.append({
                'province': province,
                'combined_tax': combined_tax,
                'after_tax': after_tax,
                'effective_rate': (combined_tax/income)*100
            })

        # Sort by tax burden (lowest to highest)
        results.sort(key=lambda x: x['combined_tax'])

        print(f"{'Province':<10} {'Total Tax':<12} {'After-Tax':<12} {'Eff. Rate':<10}")
        for r in results:
            print(f"{r['province']:<10} ${r['combined_tax']:>10,.0f} ${r['after_tax']:>10,.0f} {r['effective_rate']:>8.1f}%")

        print(f"\nBest: {results[0]['province']} (saves ${results[-1]['combined_tax'] - results[0]['combined_tax']:,.0f} vs {results[-1]['province']})")

def validate_cpp_parameters():
    """Validate CPP parameters for 2026"""
    print("\n" + "="*60)
    print("Validating CPP Parameters 2026")
    print("="*60)

    config = load_tax_config()

    if 'cpp' in config:
        cpp = config['cpp']
        print(f"\nCPP Configuration:")
        print(f"  Max Pensionable Earnings: ${cpp['max_pensionable_earnings']:,}")
        print(f"  Basic Exemption: ${cpp['basic_exemption']:,}")
        print(f"  Employee Contribution Rate: {cpp['contribution_rate_employee']:.2%}")
        print(f"  Max Annual Contribution: ${cpp['max_contribution']:,.2f}")

        # Validate calculation
        expected_max = (cpp['max_pensionable_earnings'] - cpp['basic_exemption']) * cpp['contribution_rate_employee']
        print(f"\n  Calculated Max: ${expected_max:,.2f}")

        if abs(expected_max - cpp['max_contribution']) < 1:
            print("  ✅ CPP parameters are consistent")
        else:
            print(f"  ❌ ERROR: Max contribution mismatch!")
    else:
        print("  ⚠️ CPP configuration not found in tax config")

def main():
    """Run all tax validation tests"""
    print("\n" + "="*60)
    print("CANADIAN TAX IMPLEMENTATION TEST SUITE 2026")
    print("="*60)

    # Check if 2026 config exists
    if not os.path.exists("tax_config_canada_2026.json"):
        print("\n❌ ERROR: tax_config_canada_2026.json not found!")
        print("Please ensure the 2026 tax configuration file exists.")
        return

    # Run all tests
    test_federal_tax_2026()
    test_ontario_tax()
    test_alberta_tax()
    test_bc_tax()
    test_quebec_with_abatement()
    compare_provinces()
    validate_cpp_parameters()

    print("\n" + "="*60)
    print("TEST SUITE COMPLETE")
    print("="*60)
    print("\nIMPORTANT: Compare these results with official calculators:")
    print("  - CRA Payroll Deductions Online Calculator")
    print("  - Provincial tax calculators for each province")
    print("\n2026 KEY CHANGES:")
    print("  ✅ Federal first bracket: 14% (reduced from 15%)")
    print("  ✅ All brackets indexed for ~2.85% inflation")
    print("  ✅ CPP max pensionable earnings: $74,600")
    print("  ✅ Quebec abatement: 16.5% of federal tax")

if __name__ == "__main__":
    main()