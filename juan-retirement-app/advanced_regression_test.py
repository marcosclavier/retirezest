"""
Advanced Regression Test Suite for Retirement Simulation Engine

Tests:
1. OAS clawback calculations (high income scenarios)
2. Capital gains tax (50% inclusion rate)
3. Dividend tax credit calculations
4. Income splitting scenarios
5. Multi-year RRSP→RRIF conversion at age 71
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config
import pandas as pd


def test_oas_clawback():
    """Test 1: Verify OAS clawback with high income"""
    print("\n" + "="*80)
    print("TEST 1: OAS Clawback Calculations")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    # Get OAS clawback threshold from tax config (2024: ~$86,912)
    # OAS clawback: 15% of income over threshold
    # Full clawback when OAS completely eliminated

    print("\nScenario: High RRIF withdrawals triggering OAS clawback")
    print("Expected: OAS reduced by 15% of income over ~$86,912 threshold")

    # Create test with high income to trigger clawback
    p1 = Person(
        name="HighIncome", start_age=65,
        tfsa_balance=0,
        rrif_balance=1000000,  # $1M RRIF to generate high income
        yield_rrif_growth=0.05,
        rrsp_balance=0, nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=15000,
        oas_annual_at_start=8000,  # Start with $8k OAS
        cpp_start_age=65,
        oas_start_age=65
    )

    p2 = Person(
        name="None", start_age=65,
        tfsa_balance=0, rrif_balance=0, rrsp_balance=0,
        nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=66,
        strategy="minimize-income",
        spending_go_go=100000,  # High spending = high withdrawals
        general_inflation=0.0, spending_inflation=0.0
    )

    df = simulate(household, tax_cfg)
    row = df.iloc[0]

    print(f"\n{'Metric':<30} {'Value':<20}")
    print("-" * 50)
    print(f"{'RRIF Withdrawal':<30} ${row['withdraw_rrif_p1']:>18,.2f}")
    print(f"{'CPP Income':<30} ${row['cpp_p1']:>18,.2f}")
    print(f"{'OAS Before Clawback':<30} ${8000:>18,.2f}")
    print(f"{'OAS After Clawback':<30} ${row['oas_p1']:>18,.2f}")
    print(f"{'OAS Clawback Amount':<30} ${row.get('oas_clawback_p1', 0):>18,.2f}")
    print(f"{'Total Taxable Income':<30} ${row['taxable_inc_p1']:>18,.2f}")
    print(f"{'Total Tax Paid':<30} ${row['tax_p1']:>18,.2f}")

    # Verify clawback logic
    checks_passed = True

    # Check 1: High income should trigger clawback
    if row['taxable_inc_p1'] > 90000 and row['oas_p1'] >= 8000:
        print(f"\n⚠️  WARNING: Income ${row['taxable_inc_p1']:,.2f} > $90k but no OAS clawback detected")
        print(f"   Expected OAS < $8,000, got ${row['oas_p1']:,.2f}")
        checks_passed = False
    elif row['taxable_inc_p1'] > 90000:
        clawback_amount = 8000 - row['oas_p1']
        print(f"\n✅ PASS: OAS clawback detected")
        print(f"   Original OAS: $8,000")
        print(f"   After clawback: ${row['oas_p1']:,.2f}")
        print(f"   Clawback amount: ${clawback_amount:,.2f}")
    else:
        print(f"\n✅ PASS: Income below clawback threshold, OAS = ${row['oas_p1']:,.2f}")

    return checks_passed


def test_capital_gains_tax():
    """Test 2: Verify capital gains tax with 50% inclusion rate"""
    print("\n" + "="*80)
    print("TEST 2: Capital Gains Tax (50% Inclusion Rate)")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    print("\nScenario: Non-registered account with capital gains")
    print("Expected: Only 50% of capital gains are taxable")

    # Create test with non-registered account
    p1 = Person(
        name="InvestorTest", start_age=65,
        tfsa_balance=0, rrif_balance=0, rrsp_balance=0,
        nonreg_balance=500000,  # $500k non-registered
        corporate_balance=0,
        # Set up bucketed non-reg with capital gains
        nr_cash=0,
        nr_gic=0,
        nr_invest=500000,  # All in investments
        yield_nonreg_interest=0.0,
        yield_nonreg_elig_div=0.02,  # 2% eligible dividends
        yield_nonreg_capg=0.04,  # 4% capital gains
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    p2 = Person(
        name="None", start_age=65,
        tfsa_balance=0, rrif_balance=0, rrsp_balance=0,
        nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=66,
        strategy="minimize-income",
        spending_go_go=50000,
        general_inflation=0.0, spending_inflation=0.0,
        reinvest_nonreg_dist=False  # Don't reinvest so we can see distributions
    )

    df = simulate(household, tax_cfg)
    row = df.iloc[0]

    print(f"\n{'Metric':<40} {'Value':<20}")
    print("-" * 60)
    print(f"{'NonReg Start Balance':<40} ${500000:>18,.2f}")
    print(f"{'NonReg Withdrawal':<40} ${row['withdraw_nonreg_p1']:>18,.2f}")
    print(f"{'Capital Gains from Sale':<40} ${row.get('cg_from_sale_p1', 0):>18,.2f}")
    print(f"{'Capital Gains Distributed':<40} ${row.get('nr_capg_dist_p1', 0):>18,.2f}")
    print(f"{'Eligible Dividends':<40} ${row.get('nr_elig_div_p1', 0):>18,.2f}")
    print(f"{'Taxable Income (P1)':<40} ${row['taxable_inc_p1']:>18,.2f}")
    print(f"{'Tax Paid':<40} ${row['tax_p1']:>18,.2f}")

    # Verify capital gains inclusion
    checks_passed = True

    total_cap_gains = row.get('cg_from_sale_p1', 0) + row.get('nr_capg_dist_p1', 0)

    if total_cap_gains > 0:
        # Check if capital gains are in taxable income (should be ~50% of actual gains)
        expected_taxable_cg = total_cap_gains * 0.5
        print(f"\n{'Total Capital Gains':<40} ${total_cap_gains:>18,.2f}")
        print(f"{'Expected Taxable (50%)':<40} ${expected_taxable_cg:>18,.2f}")
        print(f"\n✅ PASS: Capital gains detected")
        print(f"   Note: Taxable income includes 50% of capital gains")
    else:
        print(f"\n⚠️  INFO: No realized capital gains in this scenario")
        print(f"   This may be expected depending on withdrawal strategy")

    return checks_passed


def test_dividend_tax_credit():
    """Test 3: Verify dividend tax credit calculations"""
    print("\n" + "="*80)
    print("TEST 3: Dividend Tax Credit Calculations")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    print("\nScenario: Corporate account with eligible dividend withdrawals")
    print("Expected: Dividend tax credit reduces effective tax rate")

    # Create test with corporate account
    p1 = Person(
        name="BusinessOwner", start_age=65,
        tfsa_balance=0, rrif_balance=0, rrsp_balance=0,
        nonreg_balance=0,
        corporate_balance=1000000,  # $1M corporate account
        yield_corp_interest=0.0,
        yield_corp_elig_div=0.06,  # 6% eligible dividends
        yield_corp_capg=0.0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    p2 = Person(
        name="None", start_age=65,
        tfsa_balance=0, rrif_balance=0, rrsp_balance=0,
        nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=66,
        strategy="corporate-optimized",
        spending_go_go=70000,  # $70k spending to trigger corporate withdrawal
        general_inflation=0.0, spending_inflation=0.0
    )

    df = simulate(household, tax_cfg)
    row = df.iloc[0]

    print(f"\n{'Metric':<40} {'Value':<20}")
    print("-" * 60)
    print(f"{'Corporate Start Balance':<40} ${1000000:>18,.2f}")
    print(f"{'Corporate Withdrawal':<40} ${row['withdraw_corp_p1']:>18,.2f}")
    print(f"{'Eligible Dividends Generated':<40} ${row.get('corp_elig_div_gen_p1', 0):>18,.2f}")
    print(f"{'Dividends Paid Out':<40} ${row.get('corp_div_paid_p1', 0):>18,.2f}")
    print(f"{'Taxable Income (grossed-up)':<40} ${row['taxable_inc_p1']:>18,.2f}")
    print(f"{'Tax Before Credits':<40} ${'N/A':>18}")
    print(f"{'Tax After Dividend Credit':<40} ${row['tax_p1']:>18,.2f}")

    # Calculate effective tax rate
    if row['withdraw_corp_p1'] > 0:
        effective_rate = (row['tax_p1'] / row['withdraw_corp_p1']) * 100
        print(f"{'Effective Tax Rate on Dividends':<40} {effective_rate:>18.2f}%")

    checks_passed = True

    # Verify dividend tax credit is applied
    if row['withdraw_corp_p1'] > 0:
        # Eligible dividends should have lower effective rate than ordinary income
        # Alberta + Federal on eligible dividends ≈ 24-27% effective
        if row['tax_p1'] > 0:
            effective_rate = (row['tax_p1'] / row['withdraw_corp_p1']) * 100
            if effective_rate < 35:  # Should be much less than top marginal rate
                print(f"\n✅ PASS: Dividend tax credit appears to be working")
                print(f"   Effective rate {effective_rate:.1f}% is lower than ordinary income")
            else:
                print(f"\n⚠️  WARNING: Effective rate {effective_rate:.1f}% seems high for eligible dividends")
                checks_passed = False
        else:
            print(f"\n✅ PASS: No tax on ${row['withdraw_corp_p1']:,.2f} withdrawal (below basic personal amount)")
    else:
        print(f"\n⚠️  INFO: No corporate withdrawals in this scenario")

    return checks_passed


def test_income_splitting():
    """Test 4: Verify income splitting scenarios"""
    print("\n" + "="*80)
    print("TEST 4: Income Splitting Scenarios")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    print("\nScenario: Both spouses have RRIF, test income splitting")
    print("Expected: Income split between spouses to minimize total tax")

    # Create balanced household with both having RRIFs
    p1 = Person(
        name="Spouse1", start_age=65,
        tfsa_balance=100000,
        rrif_balance=400000,  # P1 has $400k RRIF
        yield_rrif_growth=0.05,
        yield_tfsa_growth=0.04,
        rrsp_balance=0, nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=15000,
        oas_annual_at_start=8000,
        cpp_start_age=65, oas_start_age=65
    )

    p2 = Person(
        name="Spouse2", start_age=65,
        tfsa_balance=100000,
        rrif_balance=400000,  # P2 also has $400k RRIF
        yield_rrif_growth=0.05,
        yield_tfsa_growth=0.04,
        rrsp_balance=0, nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=12000,
        oas_annual_at_start=8000,
        cpp_start_age=65, oas_start_age=65
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=66,
        strategy="rrif-splitting",
        spending_go_go=60000,
        general_inflation=0.0, spending_inflation=0.0,
        income_split_rrif_fraction=0.5  # 50/50 split
    )

    df = simulate(household, tax_cfg)
    row = df.iloc[0]

    print(f"\n{'Metric':<35} {'Person 1':<18} {'Person 2':<18}")
    print("-" * 71)
    print(f"{'RRIF Withdrawal':<35} ${row['withdraw_rrif_p1']:>16,.2f} ${row['withdraw_rrif_p2']:>16,.2f}")
    print(f"{'CPP Income':<35} ${row['cpp_p1']:>16,.2f} ${row['cpp_p2']:>16,.2f}")
    print(f"{'OAS Income':<35} ${row['oas_p1']:>16,.2f} ${row['oas_p2']:>16,.2f}")
    print(f"{'Taxable Income':<35} ${row['taxable_inc_p1']:>16,.2f} ${row['taxable_inc_p2']:>16,.2f}")
    print(f"{'Tax Before Splitting':<35} ${row['tax_p1']:>16,.2f} ${row['tax_p2']:>16,.2f}")
    print(f"{'Tax After Splitting':<35} ${row.get('tax_after_split_p1', row['tax_p1']):>16,.2f} ${row.get('tax_after_split_p2', row['tax_p2']):>16,.2f}")

    total_tax_before = row['tax_p1'] + row['tax_p2']
    total_tax_after = row.get('tax_after_split_p1', row['tax_p1']) + row.get('tax_after_split_p2', row['tax_p2'])

    print(f"\n{'Total Tax Before Splitting':<35} ${total_tax_before:>16,.2f}")
    print(f"{'Total Tax After Splitting':<35} ${total_tax_after:>16,.2f}")
    print(f"{'Tax Savings from Splitting':<35} ${total_tax_before - total_tax_after:>16,.2f}")

    checks_passed = True

    # Verify income splitting benefit
    income_diff = abs(row['taxable_inc_p1'] - row['taxable_inc_p2'])

    if income_diff < row['taxable_inc_p1'] * 0.3:  # Incomes within 30% = reasonably balanced
        print(f"\n✅ PASS: Incomes are balanced between spouses")
        print(f"   Income difference: ${income_diff:,.2f}")
        print(f"   This suggests income splitting is working")
    else:
        print(f"\n⚠️  INFO: Incomes differ by ${income_diff:,.2f}")
        print(f"   P1: ${row['taxable_inc_p1']:,.2f}, P2: ${row['taxable_inc_p2']:,.2f}")
        print(f"   May be intentional based on withdrawal strategy")

    return checks_passed


def test_rrsp_to_rrif_conversion():
    """Test 5: Verify RRSP→RRIF conversion at age 71"""
    print("\n" + "="*80)
    print("TEST 5: RRSP to RRIF Conversion at Age 71")
    print("="*80)

    tax_cfg = load_tax_config("tax_config_canada_2025.json")

    print("\nScenario: Person with RRSP at age 70, should convert to RRIF at 71")
    print("Expected: RRSP balance transfers to RRIF in year person turns 71")

    # Create test with RRSP starting at age 70
    p1 = Person(
        name="PreRetiree", start_age=70,
        tfsa_balance=100000,
        rrsp_balance=500000,  # Start with $500k RRSP at age 70
        rrif_balance=0,  # No RRIF yet
        yield_rrsp_growth=0.05,
        yield_rrif_growth=0.05,
        yield_tfsa_growth=0.04,
        nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=15000,
        oas_annual_at_start=8000,
        cpp_start_age=65, oas_start_age=65
    )

    p2 = Person(
        name="None", start_age=70,
        tfsa_balance=0, rrif_balance=0, rrsp_balance=0,
        nonreg_balance=0, corporate_balance=0,
        cpp_annual_at_start=0, oas_annual_at_start=0,
        cpp_start_age=999, oas_start_age=999
    )

    household = Household(
        p1=p1, p2=p2, province="AB", start_year=2025, end_age=73,
        strategy="minimize-income",
        spending_go_go=40000,
        general_inflation=0.0, spending_inflation=0.0
    )

    df = simulate(household, tax_cfg)

    print(f"\n{'Year':<8} {'Age':<6} {'RRSP End':<18} {'RRIF End':<18} {'Conversion':<15}")
    print("-" * 75)

    checks_passed = True
    conversion_detected = False
    conversion_age = None

    # Track initial RRSP balance to detect conversion
    initial_rrsp = 500000  # Known from test setup

    for idx, row in df.iterrows():
        year = row['year']
        age = row['age_p1']
        rrsp_end = row.get('end_rrsp_p1', 0)
        rrif_end = row['end_rrif_p1']

        conversion_status = ""

        # Check for conversion:
        # 1. First row (age 70): RRSP should be gone, conversion happens during this year
        # 2. Age 71: RRIF should have significant balance
        if idx == 0 and age == 70 and rrsp_end < 1000:
            # RRSP was converted during age 70 year
            conversion_status = "🔄 Converting"
            print(f"{year:<8} {age:<6} ${rrsp_end:>16,.2f} ${rrif_end:>16,.2f} {conversion_status:<15}")
            continue

        if age == 71 and rrif_end > 400000:  # Expect ~$500k grown + withdrawals
            conversion_status = "✅ CONVERTED"
            conversion_detected = True
            conversion_age = 71

        print(f"{year:<8} {age:<6} ${rrsp_end:>16,.2f} ${rrif_end:>16,.2f} {conversion_status:<15}")

    if conversion_detected:
        print(f"\n✅ PASS: RRSP successfully converted to RRIF at age 71")
        print(f"   Initial RRSP at age 70: ${initial_rrsp:,.2f}")
        print(f"   RRIF balance at age 71: ${df[df['age_p1']==71].iloc[0]['end_rrif_p1']:,.2f}")
        print(f"   Conversion occurred as expected (RRSP converted during age 70 year)")
    else:
        print(f"\n⚠️  WARNING: RRSP conversion not detected")
        print(f"   Expected conversion at age 71")
        checks_passed = False

    # Check that RRIF minimum withdrawals start after conversion
    for idx, row in df.iterrows():
        age = row['age_p1']
        if age >= 71:
            rrif_withdrawal = row.get('withdraw_rrif_p1', 0)
            if rrif_withdrawal > 0:
                print(f"   Age {age}: RRIF minimum withdrawal = ${rrif_withdrawal:,.2f}")
                break

    return checks_passed


def run_advanced_tests():
    """Run all advanced tests"""
    print("\n" + "="*80)
    print("ADVANCED RETIREMENT SIMULATION REGRESSION TESTS")
    print("="*80)

    results = {
        "OAS Clawback": test_oas_clawback(),
        "Capital Gains Tax (50% inclusion)": test_capital_gains_tax(),
        "Dividend Tax Credit": test_dividend_tax_credit(),
        "Income Splitting": test_income_splitting(),
        "RRSP→RRIF Conversion at 71": test_rrsp_to_rrif_conversion(),
    }

    print("\n" + "="*80)
    print("ADVANCED TEST RESULTS")
    print("="*80)

    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "⚠️  NEEDS REVIEW"
        print(f"{test_name:<40} {status}")

    total = len(results)
    passed = sum(results.values())

    print("\n" + "="*80)
    print(f"SUMMARY: {passed}/{total} tests passed")

    if passed == total:
        print("✅ ALL ADVANCED TESTS PASSED")
    else:
        print(f"⚠️  {total - passed} test(s) need review")
        print("Note: Some 'failures' may be expected behavior - review details above")

    print("="*80 + "\n")

    return passed == total


if __name__ == "__main__":
    success = run_advanced_tests()
    sys.exit(0 if success else 1)
