#!/usr/bin/env python3
"""
Production Validation: NonReg Distributions Bug Fix

Direct testing with production-like scenarios to validate the fix
Tests real-world cases where NonReg distributions matter
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
from api.utils.converters import extract_chart_data

class ProductionValidator:
    def __init__(self):
        self.tax_cfg = load_tax_config("tax_config_canada_2025.json")
        self.results = []

    def test_scenario_1_high_nonreg(self):
        """
        Scenario 1: Retiree with substantial NonReg account

        Profile: $500k NonReg account (typical inheritance or sale of business)
        Expected: Significant NonReg distributions ($20k+ annually)
        Critical: These distributions MUST be in chart taxable_income
        """
        print("="*80)
        print("SCENARIO 1: High NonReg Balance ($500k)")
        print("="*80)
        print("Profile: Retired professional with large non-registered investment account")
        print("Expected: $20k+ annual NonReg distributions")
        print()

        p1 = Person(
            name="Production User 1",
            start_age=65,
            tfsa_balance=100000,
            rrif_balance=300000,
            nonreg_balance=500000,  # Large NonReg
            nonreg_acb=400000,      # 80% ACB
            cpp_start_age=65,
            cpp_annual_at_start=14000,
            oas_start_age=65,
            oas_annual_at_start=7500,
        )

        p2 = Person(name="No Partner", start_age=65)

        household = Household(
            p1=p1,
            p2=p2,
            province='ON',
            start_year=2025,
            end_age=90,
            spending_go_go=50000,
            spending_slow_go=40000,
            spending_no_go=30000,
            strategy='balanced',
        )

        # Run simulation
        print("Running simulation...")
        results_df = simulate(household, self.tax_cfg)
        chart_data = extract_chart_data(results_df)
        print(f"✅ Complete: {len(results_df)} years\n")

        return self.validate_results("High NonReg Balance", results_df, chart_data, min_expected_dist=15000)

    def test_scenario_2_moderate_nonreg(self):
        """
        Scenario 2: Retiree with moderate NonReg account

        Profile: $200k NonReg account (typical savings outside RRSP/TFSA)
        Expected: $8k-12k annual NonReg distributions
        Critical: Even moderate distributions must be included
        """
        print("="*80)
        print("SCENARIO 2: Moderate NonReg Balance ($200k)")
        print("="*80)
        print("Profile: Typical retiree with non-registered savings")
        print("Expected: $8k-12k annual NonReg distributions")
        print()

        p1 = Person(
            name="Production User 2",
            start_age=65,
            tfsa_balance=90000,
            rrif_balance=250000,
            nonreg_balance=200000,  # Moderate NonReg
            nonreg_acb=170000,      # 85% ACB
            cpp_start_age=65,
            cpp_annual_at_start=12000,
            oas_start_age=65,
            oas_annual_at_start=7500,
        )

        p2 = Person(name="No Partner", start_age=65)

        household = Household(
            p1=p1,
            p2=p2,
            province='BC',
            start_year=2025,
            end_age=95,
            spending_go_go=45000,
            spending_slow_go=38000,
            spending_no_go=30000,
            strategy='minimize-income',
        )

        # Run simulation
        print("Running simulation...")
        results_df = simulate(household, self.tax_cfg)
        chart_data = extract_chart_data(results_df)
        print(f"✅ Complete: {len(results_df)} years\n")

        return self.validate_results("Moderate NonReg Balance", results_df, chart_data, min_expected_dist=6000)

    def test_scenario_3_married_couple_nonreg(self):
        """
        Scenario 3: Married couple with NonReg accounts

        Profile: Both spouses have NonReg accounts
        Expected: Combined household NonReg distributions
        Critical: Household-level aggregation must be correct
        """
        print("="*80)
        print("SCENARIO 3: Married Couple with NonReg Accounts")
        print("="*80)
        print("Profile: Both partners have non-registered accounts")
        print("Expected: Combined household NonReg distributions")
        print()

        p1 = Person(
            name="Partner 1",
            start_age=65,
            tfsa_balance=100000,
            rrif_balance=250000,
            nonreg_balance=300000,  # P1 NonReg
            nonreg_acb=250000,
            cpp_start_age=65,
            cpp_annual_at_start=14000,
            oas_start_age=65,
            oas_annual_at_start=7500,
        )

        p2 = Person(
            name="Partner 2",
            start_age=63,
            tfsa_balance=90000,
            rrif_balance=150000,
            nonreg_balance=200000,  # P2 NonReg
            nonreg_acb=180000,
            cpp_start_age=65,
            cpp_annual_at_start=11000,
            oas_start_age=65,
            oas_annual_at_start=7500,
        )

        household = Household(
            p1=p1,
            p2=p2,
            province='AB',
            start_year=2025,
            end_age=92,
            spending_go_go=70000,
            spending_slow_go=55000,
            spending_no_go=45000,
            strategy='balanced',
        )

        # Run simulation
        print("Running simulation...")
        results_df = simulate(household, self.tax_cfg)
        chart_data = extract_chart_data(results_df)
        print(f"✅ Complete: {len(results_df)} years\n")

        return self.validate_results("Married Couple NonReg", results_df, chart_data, min_expected_dist=15000)

    def validate_results(self, scenario_name, results_df, chart_data, min_expected_dist):
        """Validate that NonReg distributions fix is working correctly"""
        print(f"{'='*80}")
        print(f"VALIDATION: {scenario_name}")
        print(f"{'='*80}")

        test_passed = True
        issues = []

        # Check first 5 years (most critical period)
        for i in range(min(5, len(chart_data.data_points))):
            year_data = chart_data.data_points[i]
            df_row = results_df.iloc[i]

            # Calculate expected nonreg_distributions from DataFrame
            nr_interest = float(df_row.get('nr_interest_p1', 0)) + float(df_row.get('nr_interest_p2', 0))
            nr_elig_div = float(df_row.get('nr_elig_div_p1', 0)) + float(df_row.get('nr_elig_div_p2', 0))
            nr_nonelig_div = float(df_row.get('nr_nonelig_div_p1', 0)) + float(df_row.get('nr_nonelig_div_p2', 0))
            nr_capg_dist = float(df_row.get('nr_capg_dist_p1', 0)) + float(df_row.get('nr_capg_dist_p2', 0))
            expected_nonreg_dist = nr_interest + nr_elig_div + nr_nonelig_div + nr_capg_dist

            year = int(df_row['year'])
            age = int(df_row['age_p1'])

            print(f"\nYear {year} (Age {age}):")
            print(f"  DataFrame NonReg Dist: ${expected_nonreg_dist:>10,.2f}")
            print(f"  Chart NonReg Dist:     ${year_data.nonreg_distributions:>10,.2f}")
            print(f"  Chart Taxable Income:  ${year_data.taxable_income:>10,.2f}")

            # TEST 1: Chart data must capture nonreg_distributions
            if abs(year_data.nonreg_distributions - expected_nonreg_dist) > 0.01:
                test_passed = False
                issues.append(f"Year {year}: Chart nonreg_distributions mismatch (expected ${expected_nonreg_dist:,.2f}, got ${year_data.nonreg_distributions:,.2f})")
                print(f"  ❌ FAIL: Chart data doesn't match DataFrame")
            else:
                print(f"  ✅ PASS: Chart data matches DataFrame")

            # TEST 2: Taxable income MUST include nonreg_distributions
            if expected_nonreg_dist > 0:
                # Taxable income should be >= nonreg_distributions
                if year_data.taxable_income < expected_nonreg_dist - 0.01:
                    test_passed = False
                    issues.append(f"Year {year}: Taxable income (${year_data.taxable_income:,.2f}) < NonReg dist (${expected_nonreg_dist:,.2f})")
                    print(f"  ❌ FAIL: Taxable income does NOT include NonReg distributions")
                else:
                    print(f"  ✅ PASS: Taxable income includes NonReg distributions")

            # Show breakdown if distributions exist
            if expected_nonreg_dist > 1:
                print(f"  NonReg Distribution Breakdown:")
                if nr_interest > 0:
                    print(f"    Interest:      ${nr_interest:>10,.2f}")
                if nr_elig_div > 0:
                    print(f"    Elig Div:      ${nr_elig_div:>10,.2f}")
                if nr_nonelig_div > 0:
                    print(f"    NonElig Div:   ${nr_nonelig_div:>10,.2f}")
                if nr_capg_dist > 0:
                    print(f"    Cap Gains:     ${nr_capg_dist:>10,.2f}")

        # TEST 3: Distributions should be meaningful (not all zeros)
        avg_dist = sum(point.nonreg_distributions for point in chart_data.data_points[:5]) / min(5, len(chart_data.data_points))
        if avg_dist < min_expected_dist:
            test_passed = False
            issues.append(f"Average NonReg distributions (${avg_dist:,.2f}) < expected minimum (${min_expected_dist:,.2f})")
            print(f"\n  ❌ FAIL: NonReg distributions too low (avg ${avg_dist:,.2f})")
        else:
            print(f"\n  ✅ PASS: NonReg distributions at expected levels (avg ${avg_dist:,.2f})")

        # Log result
        self.results.append({
            'scenario': scenario_name,
            'passed': test_passed,
            'issues': issues,
            'avg_nonreg_dist': avg_dist,
            'timestamp': datetime.now().isoformat()
        })

        print(f"\n{'='*80}")
        if test_passed:
            print(f"✅ SCENARIO PASSED: {scenario_name}")
        else:
            print(f"❌ SCENARIO FAILED: {scenario_name}")
            for issue in issues:
                print(f"   - {issue}")
        print(f"{'='*80}\n")

        return test_passed

    def save_results(self):
        """Save validation results"""
        output_file = "production_nonreg_validation_results.json"

        summary = {
            "passed": sum(1 for r in self.results if r['passed']),
            "failed": sum(1 for r in self.results if not r['passed']),
            "total": len(self.results)
        }

        output = {
            "timestamp": datetime.now().isoformat(),
            "summary": summary,
            "results": self.results
        }

        with open(output_file, 'w') as f:
            json.dump(output, f, indent=2)

        print(f"\n📄 Results saved to: {output_file}")

def main():
    print("\n" + "="*80)
    print("PRODUCTION VALIDATION: NONREG DISTRIBUTIONS BUG FIX")
    print("Testing with production-like scenarios")
    print("="*80 + "\n")

    validator = ProductionValidator()

    # Run all scenarios
    scenarios = [
        validator.test_scenario_1_high_nonreg,
        validator.test_scenario_2_moderate_nonreg,
        validator.test_scenario_3_married_couple_nonreg,
    ]

    passed = 0
    failed = 0

    for scenario_func in scenarios:
        try:
            if scenario_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"\n❌ SCENARIO CRASHED: {scenario_func.__name__}")
            print(f"   Error: {str(e)}")
            failed += 1

    # Save results
    validator.save_results()

    # Print summary
    print("\n" + "="*80)
    print("PRODUCTION VALIDATION SUMMARY")
    print("="*80)
    print(f"✅ Passed: {passed}/{len(scenarios)}")
    print(f"❌ Failed: {failed}/{len(scenarios)}")
    print()

    if failed == 0:
        print("✅ ALL PRODUCTION SCENARIOS PASSED")
        print("\nConclusion:")
        print("  ✓ NonReg distributions correctly captured in chart data")
        print("  ✓ Taxable income includes NonReg distributions")
        print("  ✓ Calculations accurate across all scenarios")
        print("  ✓ Fix works with high/moderate/married couple cases")
        print("  ✓ FIX IS READY FOR PRODUCTION DEPLOYMENT")
        return 0
    else:
        print(f"❌ {failed} SCENARIO(S) FAILED")
        print("\nConclusion:")
        print("  ✗ Fix has issues with production scenarios")
        print("  ✗ DO NOT DEPLOY - needs investigation")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
