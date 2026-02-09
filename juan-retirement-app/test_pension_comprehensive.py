"""
Comprehensive test suite for pension income chart display fix.

Tests multiple scenarios to ensure pension income is correctly displayed
in Income Composition charts for all user configurations.

Bug Fixed: converters.py line 996 - pension_income was missing from chart data
Reporter: Marc Rondeau <mrondeau205@gmail.com>
"""

import sys
from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate
from api.utils.converters import extract_chart_data

def validate_income_consistency(df, chart_data, year_idx=0, tolerance=0.01):
    """
    Validate that chart taxable_income matches the sum of all taxable income sources
    from the dataframe year-by-year data.
    """
    year_df = df.iloc[year_idx]
    chart_point = chart_data.data_points[year_idx]

    # Extract all taxable income components from dataframe
    cpp_total = float(year_df.get('cpp_p1', 0)) + float(year_df.get('cpp_p2', 0))
    oas_total = float(year_df.get('oas_p1', 0)) + float(year_df.get('oas_p2', 0))
    rrif_wd = float(year_df.get('withdraw_rrif_p1', 0)) + float(year_df.get('withdraw_rrif_p2', 0))
    rrsp_wd = float(year_df.get('withdraw_rrsp_p1', 0)) + float(year_df.get('withdraw_rrsp_p2', 0))
    nonreg_wd = float(year_df.get('withdraw_nonreg_p1', 0)) + float(year_df.get('withdraw_nonreg_p2', 0))
    corp_wd = float(year_df.get('withdraw_corp_p1', 0)) + float(year_df.get('withdraw_corp_p2', 0))
    pension_income = float(year_df.get('pension_income_p1', 0)) + float(year_df.get('pension_income_p2', 0))
    other_income = float(year_df.get('other_income_p1', 0)) + float(year_df.get('other_income_p2', 0))

    # Calculate expected taxable income
    expected_taxable = (cpp_total + oas_total + rrif_wd + rrsp_wd +
                        nonreg_wd + corp_wd + pension_income + other_income)

    # Get actual chart value
    actual_taxable = chart_point.taxable_income

    # Check if they match (within tolerance for floating point)
    difference = abs(actual_taxable - expected_taxable)
    matches = difference < tolerance

    return {
        'matches': matches,
        'expected': expected_taxable,
        'actual': actual_taxable,
        'difference': difference,
        'components': {
            'cpp': cpp_total,
            'oas': oas_total,
            'rrif': rrif_wd,
            'rrsp': rrsp_wd,
            'nonreg': nonreg_wd,
            'corp': corp_wd,
            'pension': pension_income,
            'other': other_income
        }
    }

def test_scenario_1_single_person_pension():
    """Test 1: Single person with private pension"""
    print("\n" + "="*80)
    print("TEST 1: Single Person with Private Pension ($30k/year)")
    print("="*80)

    person = Person(
        name="Marc",
        start_age=65,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[
            {
                "name": "Work Pension Plan",
                "amount": 30000,
                "startAge": 65,
                "inflationIndexed": True
            }
        ],
        tfsa_balance=100000,
        rrif_balance=200000,
        nonreg_balance=50000,
        nonreg_acb=40000,
    )

    household = Household(
        p1=person,
        p2=Person(name="Spouse", start_age=65),
        province="ON",
        start_year=2025,
        end_age=85,
        spending_go_go=50000,
        go_go_end_age=75,
        spending_slow_go=40000,
        slow_go_end_age=85,
        spending_no_go=30000,
        strategy="balanced",
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    tax_config = load_tax_config('tax_config_canada_2025.json')
    df = simulate(household, tax_config)
    chart_data = extract_chart_data(df)

    # Validate first year
    result = validate_income_consistency(df, chart_data, 0)

    print(f"\nYear 2025 Income Components:")
    for component, value in result['components'].items():
        print(f"  {component.upper():12s}: ${value:>12,.2f}")

    print(f"\nChart Data Validation:")
    print(f"  Expected Taxable Income: ${result['expected']:,.2f}")
    print(f"  Actual Chart Value:      ${result['actual']:,.2f}")
    print(f"  Difference:              ${result['difference']:.2f}")

    # Check pension is included
    pension = result['components']['pension']
    if pension > 0 and result['matches']:
        print(f"\n✅ PASS: Pension income (${pension:,.2f}) correctly included in chart")
        return True
    else:
        print(f"\n❌ FAIL: Pension income missing or mismatch")
        return False

def test_scenario_2_couple_both_pensions():
    """Test 2: Couple where both have pensions"""
    print("\n" + "="*80)
    print("TEST 2: Couple with Both Partners Having Pensions")
    print("="*80)

    person1 = Person(
        name="Partner 1",
        start_age=65,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[
            {
                "name": "Company Pension",
                "amount": 35000,
                "startAge": 65,
                "inflationIndexed": True
            }
        ],
        tfsa_balance=150000,
        rrif_balance=300000,
        nonreg_balance=100000,
        nonreg_acb=80000,
    )

    person2 = Person(
        name="Partner 2",
        start_age=62,
        cpp_start_age=65,
        cpp_annual_at_start=12000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[
            {
                "name": "Teacher Pension",
                "amount": 45000,
                "startAge": 62,
                "inflationIndexed": True
            }
        ],
        tfsa_balance=100000,
        rrif_balance=250000,
    )

    household = Household(
        p1=person1,
        p2=person2,
        province="ON",
        start_year=2025,
        end_age=90,
        spending_go_go=70000,
        go_go_end_age=75,
        spending_slow_go=50000,
        slow_go_end_age=85,
        spending_no_go=40000,
        strategy="balanced",
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    tax_config = load_tax_config('tax_config_canada_2025.json')
    df = simulate(household, tax_config)
    chart_data = extract_chart_data(df)

    # Validate first year
    result = validate_income_consistency(df, chart_data, 0)

    print(f"\nYear 2025 Income Components:")
    for component, value in result['components'].items():
        print(f"  {component.upper():12s}: ${value:>12,.2f}")

    print(f"\nChart Data Validation:")
    print(f"  Expected Taxable Income: ${result['expected']:,.2f}")
    print(f"  Actual Chart Value:      ${result['actual']:,.2f}")
    print(f"  Difference:              ${result['difference']:.2f}")

    # Check both pensions are included
    pension_total = result['components']['pension']
    if pension_total >= 80000 and result['matches']:  # Should have both pensions
        print(f"\n✅ PASS: Both pensions (${pension_total:,.2f} total) correctly included")
        return True
    else:
        print(f"\n❌ FAIL: Pensions missing or incorrect (expected ~$80k, got ${pension_total:,.2f})")
        return False

def test_scenario_3_no_pension_backward_compat():
    """Test 3: User with NO pension income (backward compatibility)"""
    print("\n" + "="*80)
    print("TEST 3: Backward Compatibility - No Pension Income")
    print("="*80)

    person = Person(
        name="No Pension User",
        start_age=65,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[],  # No pensions
        tfsa_balance=200000,
        rrif_balance=400000,
    )

    household = Household(
        p1=person,
        p2=Person(name="Spouse", start_age=65),
        province="BC",
        start_year=2025,
        end_age=85,
        spending_go_go=50000,
        go_go_end_age=75,
        spending_slow_go=40000,
        slow_go_end_age=85,
        spending_no_go=30000,
        strategy="balanced",
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    tax_config = load_tax_config('tax_config_canada_2025.json')
    df = simulate(household, tax_config)
    chart_data = extract_chart_data(df)

    result = validate_income_consistency(df, chart_data, 0)

    print(f"\nYear 2025 Income Components:")
    for component, value in result['components'].items():
        print(f"  {component.upper():12s}: ${value:>12,.2f}")

    print(f"\nChart Data Validation:")
    print(f"  Expected Taxable Income: ${result['expected']:,.2f}")
    print(f"  Actual Chart Value:      ${result['actual']:,.2f}")
    print(f"  Difference:              ${result['difference']:.2f}")

    # Should work fine even with no pension
    pension = result['components']['pension']
    if pension == 0 and result['matches']:
        print(f"\n✅ PASS: No pension scenario works correctly (backward compatible)")
        return True
    else:
        print(f"\n❌ FAIL: Backward compatibility broken")
        return False

def test_scenario_4_pension_starts_later():
    """Test 4: Pension that starts mid-retirement"""
    print("\n" + "="*80)
    print("TEST 4: Pension Starting Mid-Retirement (Age 70)")
    print("="*80)

    person = Person(
        name="Delayed Pension",
        start_age=65,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[
            {
                "name": "Deferred Pension",
                "amount": 40000,
                "startAge": 70,  # Starts at 70
                "inflationIndexed": True
            }
        ],
        tfsa_balance=150000,
        rrif_balance=300000,
    )

    household = Household(
        p1=person,
        p2=Person(name="Spouse", start_age=65),
        province="ON",
        start_year=2025,
        end_age=85,
        spending_go_go=50000,
        go_go_end_age=75,
        spending_slow_go=40000,
        slow_go_end_age=85,
        spending_no_go=30000,
        strategy="balanced",
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    tax_config = load_tax_config('tax_config_canada_2025.json')
    df = simulate(household, tax_config)
    chart_data = extract_chart_data(df)

    # Check year 2025 (age 65) - pension should NOT be included
    result_2025 = validate_income_consistency(df, chart_data, 0)
    pension_2025 = result_2025['components']['pension']

    # Check year 2030 (age 70) - pension SHOULD be included
    result_2030 = validate_income_consistency(df, chart_data, 5)
    pension_2030 = result_2030['components']['pension']

    print(f"\nYear 2025 (Age 65) - Before Pension Starts:")
    print(f"  Pension Income: ${pension_2025:,.2f}")
    print(f"  Chart Taxable:  ${result_2025['actual']:,.2f}")
    print(f"  Matches:        {result_2025['matches']}")

    print(f"\nYear 2030 (Age 70) - After Pension Starts:")
    print(f"  Pension Income: ${pension_2030:,.2f}")
    print(f"  Chart Taxable:  ${result_2030['actual']:,.2f}")
    print(f"  Matches:        {result_2030['matches']}")

    if pension_2025 == 0 and pension_2030 >= 40000 and result_2025['matches'] and result_2030['matches']:
        print(f"\n✅ PASS: Deferred pension correctly excluded before age 70, included after")
        return True
    else:
        print(f"\n❌ FAIL: Deferred pension not handled correctly")
        return False

def test_scenario_5_multiple_income_sources():
    """Test 5: Person with pension + other income (employment, rental)"""
    print("\n" + "="*80)
    print("TEST 5: Multiple Income Sources (Pension + Other Income)")
    print("="*80)

    person = Person(
        name="Multiple Income",
        start_age=65,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        pension_incomes=[
            {
                "name": "Pension",
                "amount": 25000,
                "startAge": 65,
                "inflationIndexed": True
            }
        ],
        other_incomes=[
            {
                "name": "Consulting",
                "amount": 20000,
                "startAge": 65,
                "endAge": 70,
                "inflationIndexed": False
            },
            {
                "name": "Rental Property",
                "amount": 15000,
                "startAge": 65,
                "inflationIndexed": True
            }
        ],
        tfsa_balance=100000,
        rrif_balance=200000,
    )

    household = Household(
        p1=person,
        p2=Person(name="Spouse", start_age=65),
        province="ON",
        start_year=2025,
        end_age=85,
        spending_go_go=60000,
        go_go_end_age=75,
        spending_slow_go=45000,
        slow_go_end_age=85,
        spending_no_go=35000,
        strategy="balanced",
        spending_inflation=0.02,
        general_inflation=0.02,
    )

    tax_config = load_tax_config('tax_config_canada_2025.json')
    df = simulate(household, tax_config)
    chart_data = extract_chart_data(df)

    result = validate_income_consistency(df, chart_data, 0)

    print(f"\nYear 2025 Income Components:")
    for component, value in result['components'].items():
        print(f"  {component.upper():12s}: ${value:>12,.2f}")

    print(f"\nChart Data Validation:")
    print(f"  Expected Taxable Income: ${result['expected']:,.2f}")
    print(f"  Actual Chart Value:      ${result['actual']:,.2f}")
    print(f"  Difference:              ${result['difference']:.2f}")

    # Check both pension and other income are included
    pension = result['components']['pension']
    other = result['components']['other']

    if pension >= 25000 and other >= 35000 and result['matches']:
        print(f"\n✅ PASS: Pension (${pension:,.2f}) and Other Income (${other:,.2f}) both included")
        return True
    else:
        print(f"\n❌ FAIL: Income sources missing (Pension: ${pension:,.2f}, Other: ${other:,.2f})")
        return False

def run_all_tests():
    """Run all test scenarios"""
    print("\n" + "="*80)
    print("COMPREHENSIVE PENSION INCOME CHART FIX - TEST SUITE")
    print("="*80)
    print("\nTesting fix for: converters.py line 996")
    print("Bug report by: Marc Rondeau <mrondeau205@gmail.com>")
    print("\nRunning 5 comprehensive scenarios...\n")

    results = []

    # Run all tests
    try:
        results.append(("Single Person with Pension", test_scenario_1_single_person_pension()))
    except Exception as e:
        print(f"\n❌ Test 1 ERROR: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Single Person with Pension", False))

    try:
        results.append(("Couple Both with Pensions", test_scenario_2_couple_both_pensions()))
    except Exception as e:
        print(f"\n❌ Test 2 ERROR: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Couple Both with Pensions", False))

    try:
        results.append(("No Pension (Backward Compat)", test_scenario_3_no_pension_backward_compat()))
    except Exception as e:
        print(f"\n❌ Test 3 ERROR: {e}")
        import traceback
        traceback.print_exc()
        results.append(("No Pension (Backward Compat)", False))

    try:
        results.append(("Deferred Pension (Age 70)", test_scenario_4_pension_starts_later()))
    except Exception as e:
        print(f"\n❌ Test 4 ERROR: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Deferred Pension (Age 70)", False))

    try:
        results.append(("Multiple Income Sources", test_scenario_5_multiple_income_sources()))
    except Exception as e:
        print(f"\n❌ Test 5 ERROR: {e}")
        import traceback
        traceback.print_exc()
        results.append(("Multiple Income Sources", False))

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n" + "="*80)
        print("🎉 ALL TESTS PASSED - FIX IS PRODUCTION READY!")
        print("="*80)
        return True
    else:
        print("\n" + "="*80)
        print("⚠️  SOME TESTS FAILED - FIX NEEDS ATTENTION")
        print("="*80)
        return False

if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
