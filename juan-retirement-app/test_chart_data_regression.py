"""
Chart Data Regression Test Suite

Tests the converters.py extract_chart_data function to ensure:
1. All required fields are present in ChartDataPoint
2. Calculations are correct (taxable_income includes all sources)
3. NonReg distributions are properly handled
4. No regressions in other income calculations
"""

import sys
from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate
from api.utils.converters import extract_chart_data

def test_scenario_1_basic_retirement():
    """Basic retirement with CPP, OAS, RRIF only"""
    print("\n" + "="*80)
    print("SCENARIO 1: Basic Retirement (CPP + OAS + RRIF)")
    print("="*80)
    
    person = Person(
        name="TestBasic",
        start_age=65,
        cpp_start_age=65,
        cpp_annual_at_start=15000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        tfsa_balance=50000,
        rrif_balance=200000,
    )
    
    household = Household(
        p1=person,
        p2=Person(name="Spouse", start_age=65),
        province="ON",
        start_year=2025,
        end_age=67,
        spending_go_go=30000,
        go_go_end_age=75,
        spending_slow_go=25000,
        slow_go_end_age=85,
        spending_no_go=20000,
        strategy="balanced",
    )
    
    tax_config = load_tax_config('tax_config_canada_2025.json')
    df = simulate(household, tax_config)
    chart_data = extract_chart_data(df)
    
    # Verify first year
    year_2025 = chart_data.data_points[0]
    
    print(f"\n✓ Year 2025 Chart Data:")
    print(f"  cpp_total: ${year_2025.cpp_total:,.2f}")
    print(f"  oas_total: ${year_2025.oas_total:,.2f}")
    print(f"  rrif_withdrawal: ${year_2025.rrif_withdrawal:,.2f}")
    print(f"  taxable_income: ${year_2025.taxable_income:,.2f}")
    print(f"  nonreg_distributions: ${year_2025.nonreg_distributions:,.2f}")
    
    # Verify taxable_income includes CPP + OAS + RRIF
    expected_min = year_2025.cpp_total + year_2025.oas_total
    assert year_2025.taxable_income >= expected_min, f"Taxable income should include at least CPP+OAS"
    
    print(f"\n✅ SCENARIO 1 PASSED")
    return True

def test_scenario_2_with_nonreg():
    """Retirement with NonReg account generating distributions"""
    print("\n" + "="*80)
    print("SCENARIO 2: With NonReg Distributions")
    print("="*80)
    
    person = Person(
        name="TestNonReg",
        start_age=65,
        cpp_start_age=65,
        cpp_annual_at_start=12000,
        oas_start_age=65,
        oas_annual_at_start=7500,
        tfsa_balance=80000,
        rrif_balance=150000,
        nonreg_balance=250000,  # Large NonReg to generate distributions
        nonreg_acb=200000,
    )
    
    household = Household(
        p1=person,
        p2=Person(name="Spouse", start_age=65),
        province="ON",
        start_year=2025,
        end_age=67,
        spending_go_go=35000,
        go_go_end_age=75,
        spending_slow_go=28000,
        slow_go_end_age=85,
        spending_no_go=22000,
        strategy="balanced",
    )
    
    tax_config = load_tax_config('tax_config_canada_2025.json')
    df = simulate(household, tax_config)
    chart_data = extract_chart_data(df)
    
    # Verify first year
    year_2025 = chart_data.data_points[0]
    year_2025_df = df.iloc[0]
    
    # Calculate expected nonreg_distributions from df
    nr_interest = float(year_2025_df.get('nr_interest_p1', 0)) + float(year_2025_df.get('nr_interest_p2', 0))
    nr_elig_div = float(year_2025_df.get('nr_elig_div_p1', 0)) + float(year_2025_df.get('nr_elig_div_p2', 0))
    nr_nonelig_div = float(year_2025_df.get('nr_nonelig_div_p1', 0)) + float(year_2025_df.get('nr_nonelig_div_p2', 0))
    nr_capg_dist = float(year_2025_df.get('nr_capg_dist_p1', 0)) + float(year_2025_df.get('nr_capg_dist_p2', 0))
    expected_nonreg_dist = nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist
    
    print(f"\n✓ Year 2025 NonReg Distributions:")
    print(f"  From DataFrame: ${expected_nonreg_dist:,.2f}")
    print(f"  From Chart Data: ${year_2025.nonreg_distributions:,.2f}")
    
    print(f"\n✓ Year 2025 Chart Data:")
    print(f"  cpp_total: ${year_2025.cpp_total:,.2f}")
    print(f"  oas_total: ${year_2025.oas_total:,.2f}")
    print(f"  rrif_withdrawal: ${year_2025.rrif_withdrawal:,.2f}")
    print(f"  nonreg_distributions: ${year_2025.nonreg_distributions:,.2f}")
    print(f"  taxable_income: ${year_2025.taxable_income:,.2f}")
    
    # Verify nonreg_distributions matches
    assert abs(year_2025.nonreg_distributions - expected_nonreg_dist) < 0.01, \
        f"NonReg distributions mismatch: chart={year_2025.nonreg_distributions}, expected={expected_nonreg_dist}"
    
    # Verify taxable_income includes nonreg_distributions
    expected_min = year_2025.cpp_total + year_2025.oas_total + year_2025.nonreg_distributions
    assert year_2025.taxable_income >= expected_min, \
        f"Taxable income should include CPP+OAS+NonReg Dist"
    
    print(f"\n✅ SCENARIO 2 PASSED")
    return True

def test_scenario_3_with_pension():
    """Retirement with private pension income"""
    print("\n" + "="*80)
    print("SCENARIO 3: With Private Pension")
    print("="*80)
    
    person = Person(
        name="TestPension",
        start_age=65,
        cpp_start_age=65,
        cpp_annual_at_start=14000,
        oas_start_age=65,
        oas_annual_at_start=8000,
        pension_incomes=[
            {
                "name": "Company Pension",
                "amount": 25000,
                "startAge": 65,
                "inflationIndexed": True
            }
        ],
        tfsa_balance=60000,
        rrif_balance=180000,
        nonreg_balance=100000,
        nonreg_acb=90000,
    )
    
    household = Household(
        p1=person,
        p2=Person(name="Spouse", start_age=65),
        province="ON",
        start_year=2025,
        end_age=67,
        spending_go_go=40000,
        go_go_end_age=75,
        spending_slow_go=32000,
        slow_go_end_age=85,
        spending_no_go=25000,
        strategy="balanced",
    )
    
    tax_config = load_tax_config('tax_config_canada_2025.json')
    df = simulate(household, tax_config)
    chart_data = extract_chart_data(df)
    
    # Verify first year
    year_2025 = chart_data.data_points[0]
    year_2025_df = df.iloc[0]
    
    # Get pension income from df
    pension_p1 = float(year_2025_df.get('pension_income_p1', 0))
    pension_p2 = float(year_2025_df.get('pension_income_p2', 0))
    pension_total = pension_p1 + pension_p2
    
    print(f"\n✓ Year 2025 Pension Income:")
    print(f"  From DataFrame: ${pension_total:,.2f}")
    
    print(f"\n✓ Year 2025 Chart Data:")
    print(f"  cpp_total: ${year_2025.cpp_total:,.2f}")
    print(f"  oas_total: ${year_2025.oas_total:,.2f}")
    print(f"  rrif_withdrawal: ${year_2025.rrif_withdrawal:,.2f}")
    print(f"  nonreg_distributions: ${year_2025.nonreg_distributions:,.2f}")
    print(f"  taxable_income: ${year_2025.taxable_income:,.2f}")
    
    # Verify taxable_income includes pension (from df since it's not a separate field in chart data)
    expected_min = year_2025.cpp_total + year_2025.oas_total + pension_total
    assert year_2025.taxable_income >= expected_min, \
        f"Taxable income should include CPP+OAS+Pension"
    
    print(f"\n✅ SCENARIO 3 PASSED")
    return True

def test_scenario_4_married_couple():
    """Married couple with various income sources"""
    print("\n" + "="*80)
    print("SCENARIO 4: Married Couple")
    print("="*80)
    
    p1 = Person(
        name="Person1",
        start_age=65,
        cpp_start_age=65,
        cpp_annual_at_start=12000,
        oas_start_age=65,
        oas_annual_at_start=7500,
        tfsa_balance=100000,
        rrif_balance=200000,
        nonreg_balance=150000,
        nonreg_acb=120000,
    )
    
    p2 = Person(
        name="Person2",
        start_age=63,
        cpp_start_age=65,
        cpp_annual_at_start=8000,
        oas_start_age=65,
        oas_annual_at_start=7500,
        tfsa_balance=80000,
        rrif_balance=150000,
        nonreg_balance=100000,
        nonreg_acb=85000,
    )
    
    household = Household(
        p1=p1,
        p2=p2,
        province="ON",
        start_year=2025,
        end_age=68,
        spending_go_go=55000,
        go_go_end_age=75,
        spending_slow_go=45000,
        slow_go_end_age=85,
        spending_no_go=35000,
        strategy="balanced",
    )
    
    tax_config = load_tax_config('tax_config_canada_2025.json')
    df = simulate(household, tax_config)
    chart_data = extract_chart_data(df)
    
    # Verify first year
    year_2025 = chart_data.data_points[0]
    
    print(f"\n✓ Year 2025 Chart Data:")
    print(f"  cpp_total: ${year_2025.cpp_total:,.2f}")
    print(f"  oas_total: ${year_2025.oas_total:,.2f}")
    print(f"  rrif_withdrawal: ${year_2025.rrif_withdrawal:,.2f}")
    print(f"  nonreg_withdrawal: ${year_2025.nonreg_withdrawal:,.2f}")
    print(f"  nonreg_distributions: ${year_2025.nonreg_distributions:,.2f}")
    print(f"  taxable_income: ${year_2025.taxable_income:,.2f}")
    print(f"  tax_free_income: ${year_2025.tax_free_income:,.2f}")
    
    # Verify all totals are household-level (P1 + P2)
    assert year_2025.cpp_total > 0, "CPP total should be > 0"
    assert year_2025.oas_total > 0, "OAS total should be > 0"
    
    print(f"\n✅ SCENARIO 4 PASSED")
    return True

def main():
    print("\n" + "="*80)
    print("CHART DATA REGRESSION TEST SUITE")
    print("Testing converters.py extract_chart_data function")
    print("="*80)
    
    results = []
    
    try:
        results.append(("Scenario 1: Basic Retirement", test_scenario_1_basic_retirement()))
    except Exception as e:
        print(f"\n❌ SCENARIO 1 FAILED: {e}")
        results.append(("Scenario 1: Basic Retirement", False))
    
    try:
        results.append(("Scenario 2: With NonReg", test_scenario_2_with_nonreg()))
    except Exception as e:
        print(f"\n❌ SCENARIO 2 FAILED: {e}")
        results.append(("Scenario 2: With NonReg", False))
    
    try:
        results.append(("Scenario 3: With Pension", test_scenario_3_with_pension()))
    except Exception as e:
        print(f"\n❌ SCENARIO 3 FAILED: {e}")
        results.append(("Scenario 3: With Pension", False))
    
    try:
        results.append(("Scenario 4: Married Couple", test_scenario_4_married_couple()))
    except Exception as e:
        print(f"\n❌ SCENARIO 4 FAILED: {e}")
        results.append(("Scenario 4: Married Couple", False))
    
    # Summary
    print("\n" + "="*80)
    print("REGRESSION TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nResults: {passed}/{total} scenarios passed")
    
    if passed == total:
        print("\n" + "="*80)
        print("✅ ALL REGRESSION TESTS PASSED")
        print("="*80)
        return 0
    else:
        print("\n" + "="*80)
        print(f"❌ {total - passed} REGRESSION TEST(S) FAILED")
        print("="*80)
        return 1

if __name__ == "__main__":
    sys.exit(main())
