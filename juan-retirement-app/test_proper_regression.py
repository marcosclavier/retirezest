#!/usr/bin/env python3
"""
PROPER Tax Regression Test Suite

This test suite uses BASELINE DATA from documented pre-change scenarios
to verify that US-044 (Auto-Optimization) and US-076 (Income EndAge)
did not introduce regressions in tax calculations.

Methodology:
1. Use exact scenarios from pre-change documentation
2. Compare outputs against documented baseline values
3. Mark test as PASS only if outputs match baselines within tolerance
4. Document any discrepancies for investigation

Baseline Sources:
- test_daniel_direct.py (Daniel Gonzalez employment income scenario)
- US044_VERIFICATION_REPORT.md (Optimization test scenarios)
"""

import sys
from pathlib import Path
import json
from datetime import datetime

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

class ProperRegressionTest:
    def __init__(self):
        self.tax_cfg = load_tax_config("tax_config_canada_2025.json")
        self.results = []

    def log_result(self, test_name: str, passed: bool, expected: dict, actual: dict, notes: str = ""):
        """Log a test result with full details."""
        result = {
            "test_name": test_name,
            "passed": passed,
            "expected": expected,
            "actual": actual,
            "notes": notes,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        return result

    def test_1_daniel_gonzalez_employment_income(self):
        """
        Test: Daniel Gonzalez Employment Income Scenario

        BASELINE (from test_daniel_direct.py):
        - Year 2026 (age 64): Tax > $50,000 (employment income counted)
        - Year 2027 (age 65): Tax > $50,000 (employment income counted)
        - Year 2028 (age 66): Tax ~$10,000 (employment stopped at retirement)
        - Success rate > 90%

        This tests:
        - Employment income properly counted before retirement
        - Employment stops at retirement (cpp_start_age)
        - Tax calculations accurate for high-income working years
        - Tax calculations accurate for retirement years with CPP/OAS only
        """
        print("="*80)
        print("TEST 1: Daniel Gonzalez Employment Income (Baseline from test_daniel_direct.py)")
        print("="*80)

        # Create Daniel's profile (exact copy from baseline test)
        p1 = Person(
            name="Daniel Gonzalez",
            start_age=64,
            tfsa_balance=100000,
            rrsp_balance=500000,
            rrif_balance=0,
            nonreg_balance=50000,
            corporate_balance=0,
            cpp_start_age=66,
            cpp_annual_at_start=15000,
            oas_start_age=65,
            oas_annual_at_start=8000,
            other_incomes=[{
                'type': 'employment',
                'amount': 200000,
                'startAge': None,
                'endAge': None,
                'inflationIndexed': False,
            }]
        )

        p2 = Person(name="No Partner", start_age=65)

        household = Household(
            p1=p1,
            p2=p2,
            province='AB',
            start_year=2026,
            end_age=85,
            strategy='minimize-income',
            spending_go_go=58000,
            spending_slow_go=58000,
            spending_no_go=58000,
            spending_inflation=0.02,
            general_inflation=0.02,
        )

        # Run simulation
        print("Running simulation...")
        results_df = simulate(household, self.tax_cfg)
        print("✅ Simulation complete\n")

        # Analyze results
        test_passed = True
        issues = []

        print(f"{'Year':<6} {'Age':<5} {'Tax':<15} {'Status':<10} {'Result'}")
        print("-" * 80)

        for idx in range(min(3, len(results_df))):
            row = results_df.iloc[idx]
            year = int(row.get('year', 2026 + idx))
            age = int(row.get('age_p1', 64 + idx))
            tax = row.get('total_tax_after_split', row.get('total_tax', 0))

            if age == 64 or age == 65:
                # BASELINE: Tax > $50,000 (employment income counted)
                expected_min = 50000
                has_employment = tax > expected_min
                status = "✅ PASS" if has_employment else "❌ FAIL"
                result = f"Tax=${tax:,.0f} (expected >${expected_min:,})"

                if not has_employment:
                    test_passed = False
                    issues.append(f"Age {age}: Tax ${tax:,.0f} < ${expected_min:,} - Employment income NOT counted")

                print(f"{year:<6} {age:<5} ${tax:>13,.0f} {status:<10} {result}")

            elif age == 66:
                # BASELINE: Tax ~$10,000 (employment stopped)
                expected_max = 20000
                employment_stopped = tax < expected_max
                status = "✅ PASS" if employment_stopped else "❌ FAIL"
                result = f"Tax=${tax:,.0f} (expected <${expected_max:,})"

                if not employment_stopped:
                    test_passed = False
                    issues.append(f"Age {age}: Tax ${tax:,.0f} > ${expected_max:,} - Employment still counting")

                print(f"{year:<6} {age:<5} ${tax:>13,.0f} {status:<10} {result}")

        # Check success rate
        failed_years = len(results_df[results_df['plan_success'] == False])
        total_years = len(results_df)
        success_rate = (total_years - failed_years) / total_years if total_years > 0 else 0

        print(f"\n📈 Success Rate: {success_rate:.1%} (expected >90%)")

        if success_rate < 0.90:
            test_passed = False
            issues.append(f"Success rate {success_rate:.1%} < 90%")
            print("❌ FAIL: Success rate too low")
        else:
            print("✅ PASS: Success rate acceptable")

        # Log result
        expected = {
            "age_64_tax": ">$50,000",
            "age_65_tax": ">$50,000",
            "age_66_tax": "<$20,000",
            "success_rate": ">90%"
        }

        actual = {
            "age_64_tax": f"${results_df.iloc[0]['total_tax_after_split']:,.0f}" if len(results_df) > 0 else "N/A",
            "age_65_tax": f"${results_df.iloc[1]['total_tax_after_split']:,.0f}" if len(results_df) > 1 else "N/A",
            "age_66_tax": f"${results_df.iloc[2]['total_tax_after_split']:,.0f}" if len(results_df) > 2 else "N/A",
            "success_rate": f"{success_rate:.1%}"
        }

        notes = "; ".join(issues) if issues else "All tax values match baseline"
        self.log_result("Daniel Gonzalez Employment Income", test_passed, expected, actual, notes)

        print("\n" + ("✅ TEST PASSED" if test_passed else "❌ TEST FAILED"))
        print("="*80 + "\n")

        return test_passed

    def test_2_optimization_scenario_insufficient_assets(self):
        """
        Test: Optimization Scenario 1 - Insufficient Assets

        BASELINE (from US044_VERIFICATION_REPORT.md):
        - Original strategy: rrif-frontload
        - Success rate: 9.5% (2/21 years funded)
        - Assets: $520k total (TFSA=$180k, RRIF=$280k, NonReg=$60k)
        - Tax: $0 (insufficient income)
        - Benefits: $626,901
        - Estate: $1,058,365

        This tests:
        - Tax calculations remain consistent for low-asset scenarios
        - Success rate calculations accurate
        - Benefit and estate calculations unchanged
        """
        print("="*80)
        print("TEST 2: Optimization Scenario - Insufficient Assets (Baseline from US044)")
        print("="*80)

        # Create profile matching US044 test scenario 1
        p1 = Person(
            name="Test User",
            start_age=65,
            tfsa_balance=180000,
            rrsp_balance=0,
            rrif_balance=280000,
            nonreg_balance=60000,
            corporate_balance=0,
            cpp_start_age=65,
            cpp_annual_at_start=15000,
            oas_start_age=65,
            oas_annual_at_start=8000,
        )

        p2 = Person(name="No Partner", start_age=65)

        household = Household(
            p1=p1,
            p2=p2,
            province='ON',
            start_year=2026,
            end_age=85,
            strategy='rrif-frontload',
            spending_go_go=45000,
            spending_slow_go=40000,
            spending_no_go=35000,
            spending_inflation=0.02,
            general_inflation=0.02,
        )

        # Run simulation
        print("Running simulation...")
        results_df = simulate(household, self.tax_cfg)
        print("✅ Simulation complete\n")

        # Calculate metrics
        failed_years = len(results_df[results_df['plan_success'] == False])
        total_years = len(results_df)
        success_rate = (total_years - failed_years) / total_years if total_years > 0 else 0
        total_tax = results_df['total_tax_after_split'].sum()
        total_benefits = (results_df['cpp_p1'].sum() + results_df['oas_p1'].sum() +
                         results_df['cpp_p2'].sum() + results_df['oas_p2'].sum())
        final_estate = (results_df.iloc[-1]['tfsa_p1'] + results_df.iloc[-1]['rrif_p1'] +
                       results_df.iloc[-1]['nonreg_p1'])

        # BASELINE VALUES
        expected_success_rate = 0.095  # 9.5%
        expected_tax = 0  # $0
        expected_benefits = 626901
        expected_estate = 1058365

        # Compare against baseline (10% tolerance)
        success_rate_match = abs(success_rate - expected_success_rate) < 0.02  # ±2 percentage points
        tax_match = abs(total_tax - expected_tax) < 1000  # ±$1,000
        benefits_match = abs(total_benefits - expected_benefits) / expected_benefits < 0.10  # ±10%
        estate_match = abs(final_estate - expected_estate) / expected_estate < 0.10  # ±10%

        test_passed = success_rate_match and tax_match and benefits_match and estate_match

        print(f"{'Metric':<20} {'Expected':<20} {'Actual':<20} {'Status'}")
        print("-" * 80)
        print(f"{'Success Rate':<20} {expected_success_rate:.1%} ({2}/21 yrs)    {success_rate:.1%} ({total_years-failed_years}/{total_years} yrs)   {'✅' if success_rate_match else '❌'}")
        print(f"{'Total Tax':<20} ${expected_tax:>16,}  ${total_tax:>17,.0f}  {'✅' if tax_match else '❌'}")
        print(f"{'Total Benefits':<20} ${expected_benefits:>16,}  ${total_benefits:>17,.0f}  {'✅' if benefits_match else '❌'}")
        print(f"{'Final Estate':<20} ${expected_estate:>16,}  ${final_estate:>17,.0f}  {'✅' if estate_match else '❌'}")

        # Log result
        expected = {
            "success_rate": "9.5%",
            "total_tax": "$0",
            "total_benefits": "$626,901",
            "final_estate": "$1,058,365"
        }

        actual = {
            "success_rate": f"{success_rate:.1%}",
            "total_tax": f"${total_tax:,.0f}",
            "total_benefits": f"${total_benefits:,.0f}",
            "final_estate": f"${final_estate:,.0f}"
        }

        issues = []
        if not success_rate_match:
            issues.append(f"Success rate {success_rate:.1%} vs baseline 9.5%")
        if not tax_match:
            issues.append(f"Tax ${total_tax:,.0f} vs baseline $0")
        if not benefits_match:
            issues.append(f"Benefits ${total_benefits:,.0f} vs baseline $626,901")
        if not estate_match:
            issues.append(f"Estate ${final_estate:,.0f} vs baseline $1,058,365")

        notes = "; ".join(issues) if issues else "All metrics match baseline within tolerance"
        self.log_result("Optimization Scenario - Insufficient Assets", test_passed, expected, actual, notes)

        print("\n" + ("✅ TEST PASSED" if test_passed else "❌ TEST FAILED"))
        print("="*80 + "\n")

        return test_passed

    def test_3_optimization_scenario_all_strategies_equivalent(self):
        """
        Test: Optimization Scenario 2 - All Strategies Equivalent

        BASELINE (from US044_VERIFICATION_REPORT.md):
        - All strategies: Success=38.1% (8/21 years funded)
        - Tax: $0
        - Benefits: $742,926
        - Estate: $1,226,311
        - Assets: $450k total

        This tests:
        - Tax calculations consistent across different strategies
        - Success rate calculations accurate for moderate-asset scenarios
        """
        print("="*80)
        print("TEST 3: Optimization Scenario - All Strategies Equivalent (Baseline from US044)")
        print("="*80)

        # Create profile matching US044 test scenario 2
        p1 = Person(
            name="Test User",
            start_age=65,
            tfsa_balance=150000,
            rrsp_balance=0,
            rrif_balance=200000,
            nonreg_balance=100000,
            corporate_balance=0,
            cpp_start_age=65,
            cpp_annual_at_start=15000,
            oas_start_age=65,
            oas_annual_at_start=8000,
        )

        p2 = Person(name="No Partner", start_age=65)

        household = Household(
            p1=p1,
            p2=p2,
            province='ON',
            start_year=2026,
            end_age=85,
            strategy='minimize-income',
            spending_go_go=45000,
            spending_slow_go=40000,
            spending_no_go=35000,
            spending_inflation=0.02,
            general_inflation=0.02,
        )

        # Run simulation
        print("Running simulation...")
        results_df = simulate(household, self.tax_cfg)
        print("✅ Simulation complete\n")

        # Calculate metrics
        failed_years = len(results_df[results_df['plan_success'] == False])
        total_years = len(results_df)
        success_rate = (total_years - failed_years) / total_years if total_years > 0 else 0
        total_tax = results_df['total_tax_after_split'].sum()
        total_benefits = (results_df['cpp_p1'].sum() + results_df['oas_p1'].sum() +
                         results_df['cpp_p2'].sum() + results_df['oas_p2'].sum())
        final_estate = (results_df.iloc[-1]['tfsa_p1'] + results_df.iloc[-1]['rrif_p1'] +
                       results_df.iloc[-1]['nonreg_p1'])

        # BASELINE VALUES
        expected_success_rate = 0.381  # 38.1%
        expected_tax = 0  # $0
        expected_benefits = 742926
        expected_estate = 1226311

        # Compare against baseline (10% tolerance)
        success_rate_match = abs(success_rate - expected_success_rate) < 0.05  # ±5 percentage points
        tax_match = abs(total_tax - expected_tax) < 1000  # ±$1,000
        benefits_match = abs(total_benefits - expected_benefits) / expected_benefits < 0.10  # ±10%
        estate_match = abs(final_estate - expected_estate) / expected_estate < 0.10  # ±10%

        test_passed = success_rate_match and tax_match and benefits_match and estate_match

        print(f"{'Metric':<20} {'Expected':<20} {'Actual':<20} {'Status'}")
        print("-" * 80)
        print(f"{'Success Rate':<20} {expected_success_rate:.1%} ({8}/21 yrs)    {success_rate:.1%} ({total_years-failed_years}/{total_years} yrs)   {'✅' if success_rate_match else '❌'}")
        print(f"{'Total Tax':<20} ${expected_tax:>16,}  ${total_tax:>17,.0f}  {'✅' if tax_match else '❌'}")
        print(f"{'Total Benefits':<20} ${expected_benefits:>16,}  ${total_benefits:>17,.0f}  {'✅' if benefits_match else '❌'}")
        print(f"{'Final Estate':<20} ${expected_estate:>16,}  ${final_estate:>17,.0f}  {'✅' if estate_match else '❌'}")

        # Log result
        expected = {
            "success_rate": "38.1%",
            "total_tax": "$0",
            "total_benefits": "$742,926",
            "final_estate": "$1,226,311"
        }

        actual = {
            "success_rate": f"{success_rate:.1%}",
            "total_tax": f"${total_tax:,.0f}",
            "total_benefits": f"${total_benefits:,.0f}",
            "final_estate": f"${final_estate:,.0f}"
        }

        issues = []
        if not success_rate_match:
            issues.append(f"Success rate {success_rate:.1%} vs baseline 38.1%")
        if not tax_match:
            issues.append(f"Tax ${total_tax:,.0f} vs baseline $0")
        if not benefits_match:
            issues.append(f"Benefits ${total_benefits:,.0f} vs baseline $742,926")
        if not estate_match:
            issues.append(f"Estate ${final_estate:,.0f} vs baseline $1,226,311")

        notes = "; ".join(issues) if issues else "All metrics match baseline within tolerance"
        self.log_result("Optimization Scenario - All Strategies Equivalent", test_passed, expected, actual, notes)

        print("\n" + ("✅ TEST PASSED" if test_passed else "❌ TEST FAILED"))
        print("="*80 + "\n")

        return test_passed

    def save_results(self):
        """Save detailed results to JSON file."""
        output_file = "proper_regression_results.json"

        summary = {
            "passed": sum(1 for r in self.results if r["passed"]),
            "failed": sum(1 for r in self.results if not r["passed"]),
            "total": len(self.results)
        }

        output = {
            "timestamp": datetime.now().isoformat(),
            "summary": summary,
            "results": self.results
        }

        with open(output_file, 'w') as f:
            json.dump(output, f, indent=2)

        print(f"\n📄 Detailed results saved to: {output_file}")
        return output_file

def main():
    """Run all proper regression tests."""
    print("\n" + "="*80)
    print("PROPER TAX REGRESSION TEST SUITE")
    print("Using baseline data from pre-change documentation")
    print("="*80 + "\n")

    tester = ProperRegressionTest()

    # Run all tests
    tests = [
        tester.test_1_daniel_gonzalez_employment_income,
        tester.test_2_optimization_scenario_insufficient_assets,
        tester.test_3_optimization_scenario_all_strategies_equivalent,
    ]

    passed = 0
    failed = 0

    for test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"\n❌ ERROR: Test '{test_func.__name__}' crashed with exception:")
            print(f"   {str(e)}")
            failed += 1

    # Save results
    tester.save_results()

    # Print summary
    print("\n" + "="*80)
    print("PROPER REGRESSION TEST SUMMARY")
    print("="*80)
    print(f"Tests Passed: {passed}")
    print(f"Tests Failed: {failed}")
    print(f"Total Tests: {passed + failed}")
    print()

    if failed == 0:
        print("✅ ALL TESTS PASSED - NO REGRESSIONS DETECTED")
        print("\nConclusion:")
        print("  Tax calculations match pre-change baseline values")
        print("  US-044 (Auto-Optimization) did not affect tax calculations")
        print("  US-076 (Income EndAge) did not affect tax calculations")
        return 0
    else:
        print(f"❌ {failed} TEST(S) FAILED - REGRESSIONS DETECTED")
        print("\nConclusion:")
        print("  Tax calculations DO NOT match baseline values")
        print("  Investigation required to determine if this indicates bugs")
        print("  Review proper_regression_results.json for details")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
