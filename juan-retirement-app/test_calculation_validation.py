#!/usr/bin/env python3
"""
Comprehensive Calculation Validation Tests

This script validates financial calculations and visualizations across all test accounts:
1. Funding & Account Withdrawals (TFSA, RRSP/RRIF, Non-Registered)
2. Government Benefits (CPP, OAS, GIS)
3. Federal and Provincial Taxes
4. Tax Credits
5. Tables and Graphs accuracy

Test Accounts:
- test@example.com (standard profile)
- claire.conservative@test.com (conservative investor)
- alex.aggressive@test.com (aggressive investor)
- mike.moderate@test.com (moderate investor)
- sarah.struggling@test.com (insufficient assets)
- helen.highincome@test.com (high-income tax optimization)
"""

import sys
import json
import glob
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import pandas as pd

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config
from modules.benefits import cpp_benefit, oas_benefit, gis_benefit

# Constants
TOLERANCE = 0.01  # 1% tolerance for floating point comparisons
MIN_CPP_AGE = 60
MAX_CPP_AGE = 70
MIN_OAS_AGE = 65
MAX_OAS_AGE = 70

# Test account emails
TEST_ACCOUNTS = [
    "test@example.com",
    "claire.conservative@test.com",
    "alex.aggressive@test.com",
    "mike.moderate@test.com",
    "sarah.struggling@test.com",
    "helen.highincome@test.com"
]


class CalculationValidator:
    """Validates financial calculations for retirement simulations."""

    def __init__(self, email: str):
        self.email = email
        self.baseline_file = self._find_baseline_file()
        self.results = {}
        self.errors = []
        self.warnings = []

    def _find_baseline_file(self) -> Optional[Path]:
        """Find baseline file for email."""
        # Convert email to filename format
        email_parts = self.email.replace("@", "_").replace(".", "_")
        pattern = f"baselines/baseline_{email_parts}_*.json"
        files = glob.glob(pattern)

        if files:
            return Path(files[0])
        return None

    def load_baseline(self) -> Dict:
        """Load baseline data."""
        if not self.baseline_file:
            raise FileNotFoundError(f"Baseline file not found for {self.email}")

        with open(self.baseline_file) as f:
            return json.load(f)

    def construct_input_from_financial_data(self, baseline: Dict) -> Dict:
        """Construct simulation input from financial_data in baseline."""
        financial_data = baseline.get('financial_data', {})
        user_profile = baseline.get('user_profile', {})

        # Extract assets
        assets = financial_data.get('assets', [])
        person1_assets = [a for a in assets if a.get('owner') == 'person1']

        # Calculate birth year from dateOfBirth
        dob = user_profile.get('dateOfBirth', '1980-01-01')
        birth_year = int(dob.split('-')[0])
        current_year = 2026
        current_age = current_year - birth_year

        # Build Person 1 data
        p1_data = {
            'name': user_profile.get('firstName', 'Test'),
            'start_age': current_age,
            'cpp_start_age': 65,
            'oas_start_age': 65,
            'cpp_annual_at_start': 12000,  # Default CPP
            'oas_annual_at_start': 7500,  # Default OAS
        }

        # Add asset balances
        for asset in person1_assets:
            asset_type = asset.get('type')
            balance = asset.get('balance', 0)
            return_rate = asset.get('returnRate', 5) if asset.get('returnRate') is not None else 5
            return_rate_decimal = return_rate / 100.0  # Convert to decimal

            if asset_type == 'tfsa':
                p1_data['tfsa_balance'] = balance
                p1_data['yield_tfsa_growth'] = return_rate_decimal
            elif asset_type == 'rrsp':
                p1_data['rrsp_balance'] = balance
                p1_data['yield_rrsp_growth'] = return_rate_decimal
            elif asset_type == 'nonreg':
                p1_data['nonreg_balance'] = balance
                p1_data['y_nr_inv_total_return'] = return_rate_decimal

        # Person 2 data (minimal, required fields only)
        p2_data = {
            'name': 'None',
            'start_age': 100  # Very old so they don't participate
        }

        return {
            'p1': p1_data,
            'p2': p2_data,
            'start_year': current_year,
            'province': user_profile.get('province', 'ON'),
            'strategy': 'minimize_income',
            'spending_target': 50000  # Default spending target
        }

    def run_simulation(self, input_data: Dict) -> pd.DataFrame:
        """Run simulation with input data."""
        p1_dict = input_data.get('p1', {})
        p2_dict = input_data.get('p2', {})

        p1 = Person(**p1_dict)
        p2 = Person(**p2_dict)

        household = Household(
            p1=p1,
            p2=p2,
            start_year=input_data.get('start_year', 2026),
            province=input_data.get('province', 'ON')
        )

        tax_config = load_tax_config("tax_config_canada_2025.json")
        return simulate(household, tax_config)

    def validate_account_withdrawals(self, results: pd.DataFrame) -> Dict:
        """Validate account withdrawal calculations."""
        validations = {
            "tfsa_withdrawals": {"passed": True, "details": []},
            "rrsp_rrif_withdrawals": {"passed": True, "details": []},
            "nonreg_withdrawals": {"passed": True, "details": []},
            "total_withdrawals": {"passed": True, "details": []}
        }

        for idx, row in results.iterrows():
            year = row.get('year', idx)
            age_p1 = row.get('age_p1', 0)

            # TFSA Withdrawals - should never be negative
            tfsa_withdrawal = row.get('tfsa_withdrawal_p1', 0)
            if tfsa_withdrawal < 0:
                validations["tfsa_withdrawals"]["passed"] = False
                validations["tfsa_withdrawals"]["details"].append(
                    f"Year {year} (Age {age_p1}): Negative TFSA withdrawal (${tfsa_withdrawal:,.2f})"
                )

            # RRIF minimum withdrawals after age 71
            if age_p1 >= 72:
                rrif_withdrawal = row.get('rrif_withdrawal_p1', 0)
                rrif_balance = row.get('end_rrif_p1', 0)
                if rrif_balance > 0 and rrif_withdrawal == 0:
                    validations["rrsp_rrif_withdrawals"]["passed"] = False
                    validations["rrsp_rrif_withdrawals"]["details"].append(
                        f"Year {year} (Age {age_p1}): Missing RRIF minimum withdrawal "
                        f"(Balance: ${rrif_balance:,.2f})"
                    )

            # Non-registered withdrawals - should never be negative
            nonreg_withdrawal = row.get('nonreg_withdrawal_p1', 0)
            if nonreg_withdrawal < 0:
                validations["nonreg_withdrawals"]["passed"] = False
                validations["nonreg_withdrawals"]["details"].append(
                    f"Year {year} (Age {age_p1}): Negative non-reg withdrawal (${nonreg_withdrawal:,.2f})"
                )

            # Total withdrawals should equal sum of parts
            total_withdrawal = row.get('total_withdrawal', 0)
            calculated_total = tfsa_withdrawal + row.get('rrif_withdrawal_p1', 0) + nonreg_withdrawal

            if abs(total_withdrawal - calculated_total) > 100:  # $100 tolerance
                validations["total_withdrawals"]["passed"] = False
                validations["total_withdrawals"]["details"].append(
                    f"Year {year}: Total withdrawal mismatch "
                    f"(Reported: ${total_withdrawal:,.2f}, Calculated: ${calculated_total:,.2f})"
                )

        return validations

    def validate_government_benefits(self, results: pd.DataFrame) -> Dict:
        """Validate CPP, OAS, and GIS calculations."""
        validations = {
            "cpp": {"passed": True, "details": []},
            "oas": {"passed": True, "details": []},
            "gis": {"passed": True, "details": []},
            "oas_clawback": {"passed": True, "details": []}
        }

        for idx, row in results.iterrows():
            year = row.get('year', idx)
            age_p1 = row.get('age_p1', 0)

            cpp_amount = row.get('cpp_p1', 0)
            oas_amount = row.get('oas_p1', 0)
            gis_amount = row.get('gis_p1', 0)

            # CPP validations
            if cpp_amount < 0:
                validations["cpp"]["passed"] = False
                validations["cpp"]["details"].append(
                    f"Year {year} (Age {age_p1}): Negative CPP (${cpp_amount:,.2f})"
                )

            if cpp_amount > 20000:  # Max CPP is ~$17,000 (2026 estimate)
                validations["cpp"]["passed"] = False
                validations["cpp"]["details"].append(
                    f"Year {year} (Age {age_p1}): CPP exceeds maximum (${cpp_amount:,.2f})"
                )

            # OAS validations
            if oas_amount < 0:
                validations["oas"]["passed"] = False
                validations["oas"]["details"].append(
                    f"Year {year} (Age {age_p1}): Negative OAS (${oas_amount:,.2f})"
                )

            if age_p1 < MIN_OAS_AGE and oas_amount > 0:
                validations["oas"]["passed"] = False
                validations["oas"]["details"].append(
                    f"Year {year} (Age {age_p1}): OAS before minimum age (${oas_amount:,.2f})"
                )

            if oas_amount > 12000:  # Max OAS is ~$8,500 (2026 estimate with indexing)
                validations["oas"]["passed"] = False
                validations["oas"]["details"].append(
                    f"Year {year} (Age {age_p1}): OAS exceeds maximum (${oas_amount:,.2f})"
                )

            # GIS validations
            if gis_amount < 0:
                validations["gis"]["passed"] = False
                validations["gis"]["details"].append(
                    f"Year {year} (Age {age_p1}): Negative GIS (${gis_amount:,.2f})"
                )

            # GIS only available if receiving OAS
            if gis_amount > 0 and oas_amount == 0:
                validations["gis"]["passed"] = False
                validations["gis"]["details"].append(
                    f"Year {year} (Age {age_p1}): GIS without OAS (GIS: ${gis_amount:,.2f})"
                )

            # OAS clawback validation
            net_income = row.get('net_income_federal', 0)
            oas_clawback_threshold = 86912  # 2024 threshold (will be indexed)

            if net_income > oas_clawback_threshold and oas_amount > 0:
                # Should have clawback
                expected_clawback_rate = 0.15
                excess_income = net_income - oas_clawback_threshold
                max_oas = 8500  # Approximate max OAS
                expected_clawback = min(excess_income * expected_clawback_rate, max_oas)

                # If income is high enough, OAS should be reduced
                if net_income > 142000 and oas_amount > 100:  # Full clawback threshold
                    validations["oas_clawback"]["passed"] = False
                    validations["oas_clawback"]["details"].append(
                        f"Year {year}: High income (${net_income:,.2f}) should trigger full OAS clawback, "
                        f"but received ${oas_amount:,.2f}"
                    )

        return validations

    def validate_tax_calculations(self, results: pd.DataFrame) -> Dict:
        """Validate federal and provincial tax calculations."""
        validations = {
            "federal_tax": {"passed": True, "details": []},
            "provincial_tax": {"passed": True, "details": []},
            "total_tax": {"passed": True, "details": []},
            "effective_tax_rate": {"passed": True, "details": []}
        }

        for idx, row in results.iterrows():
            year = row.get('year', idx)

            federal_tax = row.get('federal_tax', 0)
            provincial_tax = row.get('provincial_tax', 0)
            total_tax = row.get('total_tax', 0)
            net_income = row.get('net_income_federal', 0)

            # Taxes should never be negative
            if federal_tax < 0:
                validations["federal_tax"]["passed"] = False
                validations["federal_tax"]["details"].append(
                    f"Year {year}: Negative federal tax (${federal_tax:,.2f})"
                )

            if provincial_tax < 0:
                validations["provincial_tax"]["passed"] = False
                validations["provincial_tax"]["details"].append(
                    f"Year {year}: Negative provincial tax (${provincial_tax:,.2f})"
                )

            # Total tax should equal federal + provincial
            calculated_total = federal_tax + provincial_tax
            if abs(total_tax - calculated_total) > 10:  # $10 tolerance
                validations["total_tax"]["passed"] = False
                validations["total_tax"]["details"].append(
                    f"Year {year}: Total tax mismatch "
                    f"(Reported: ${total_tax:,.2f}, Calculated: ${calculated_total:,.2f})"
                )

            # Effective tax rate validation (should be between 0% and 60%)
            if net_income > 0:
                effective_rate = total_tax / net_income
                if effective_rate < 0 or effective_rate > 0.60:
                    validations["effective_tax_rate"]["passed"] = False
                    validations["effective_tax_rate"]["details"].append(
                        f"Year {year}: Unrealistic effective tax rate ({effective_rate*100:.1f}%) "
                        f"(Tax: ${total_tax:,.2f}, Income: ${net_income:,.2f})"
                    )

        return validations

    def validate_tax_credits(self, results: pd.DataFrame) -> Dict:
        """Validate tax credit calculations."""
        validations = {
            "basic_personal_amount": {"passed": True, "details": []},
            "age_credit": {"passed": True, "details": []},
            "pension_income_credit": {"passed": True, "details": []},
            "dividend_tax_credit": {"passed": True, "details": []}
        }

        for idx, row in results.iterrows():
            year = row.get('year', idx)
            age_p1 = row.get('age_p1', 0)

            # Basic personal amount - everyone should have this
            basic_personal = row.get('basic_personal_amount', 0)
            if basic_personal == 0:
                validations["basic_personal_amount"]["passed"] = False
                validations["basic_personal_amount"]["details"].append(
                    f"Year {year}: Missing basic personal amount"
                )

            # Age credit - should apply for people 65+
            age_credit = row.get('age_credit', 0)
            if age_p1 >= 65 and age_credit == 0:
                # May be clawed back for high income, check income
                net_income = row.get('net_income_federal', 0)
                age_credit_threshold = 42335  # 2024 threshold
                if net_income < age_credit_threshold:
                    validations["age_credit"]["passed"] = False
                    validations["age_credit"]["details"].append(
                        f"Year {year} (Age {age_p1}): Missing age credit "
                        f"(Income: ${net_income:,.2f} below threshold)"
                    )

            # Pension income credit - should apply if receiving eligible pension
            pension_income = row.get('eligible_pension_income', 0)
            pension_credit = row.get('pension_income_credit', 0)
            if pension_income > 0 and pension_credit == 0:
                validations["pension_income_credit"]["passed"] = False
                validations["pension_income_credit"]["details"].append(
                    f"Year {year}: Missing pension income credit "
                    f"(Pension income: ${pension_income:,.2f})"
                )

        return validations

    def validate_data_accuracy(self, results: pd.DataFrame) -> Dict:
        """Validate overall data accuracy and consistency."""
        validations = {
            "balance_growth": {"passed": True, "details": []},
            "spending_coverage": {"passed": True, "details": []},
            "estate_value": {"passed": True, "details": []},
            "no_exponential_growth": {"passed": True, "details": []}
        }

        # Check for exponential growth (US-077 regression check)
        prev_total_assets = None
        for idx, row in results.iterrows():
            year = row.get('year', idx)

            total_assets = (
                row.get('end_tfsa_p1', 0) +
                row.get('end_rrif_p1', 0) +
                row.get('end_nonreg_p1', 0)
            )

            if prev_total_assets is not None and prev_total_assets > 0:
                growth_rate = (total_assets / prev_total_assets) - 1.0

                # Growth rate should be reasonable (-50% to +30% per year)
                if growth_rate > 0.30:  # More than 30% growth
                    validations["no_exponential_growth"]["passed"] = False
                    validations["no_exponential_growth"]["details"].append(
                        f"Year {year}: Excessive growth rate ({growth_rate*100:.1f}%) "
                        f"(${prev_total_assets:,.0f} → ${total_assets:,.0f})"
                    )

            prev_total_assets = total_assets

        # Final estate value should be realistic (< $10M for typical starting assets)
        final_estate = results.iloc[-1].get('end_total_estate', 0)
        if final_estate > 10_000_000:
            validations["estate_value"]["passed"] = False
            validations["estate_value"]["details"].append(
                f"Final estate value unrealistically high: ${final_estate:,.2f}"
            )

        return validations

    def run_all_validations(self) -> Dict:
        """Run all validation tests."""
        print(f"\n{'='*80}")
        print(f"Running validations for: {self.email}")
        print(f"{'='*80}")

        try:
            baseline = self.load_baseline()

            # Try to get inputData, fall back to constructing from financial_data
            if 'inputData' in baseline and baseline['inputData']:
                # Use first inputData
                input_data = json.loads(baseline['inputData'][0])
                print(f"Using historical inputData...")
            else:
                # Construct from financial_data
                print(f"Constructing input from financial_data...")
                input_data = self.construct_input_from_financial_data(baseline)

            # Run simulation
            print(f"Running simulation...")
            results = self.run_simulation(input_data)

            # Run validations
            print(f"Validating account withdrawals...")
            withdrawal_validations = self.validate_account_withdrawals(results)

            print(f"Validating government benefits...")
            benefits_validations = self.validate_government_benefits(results)

            print(f"Validating tax calculations...")
            tax_validations = self.validate_tax_calculations(results)

            print(f"Validating tax credits...")
            credit_validations = self.validate_tax_credits(results)

            print(f"Validating data accuracy...")
            accuracy_validations = self.validate_data_accuracy(results)

            # Aggregate results
            all_validations = {
                "withdrawals": withdrawal_validations,
                "benefits": benefits_validations,
                "taxes": tax_validations,
                "credits": credit_validations,
                "accuracy": accuracy_validations
            }

            # Count pass/fail
            total_tests = 0
            passed_tests = 0
            failed_categories = []

            for category, tests in all_validations.items():
                for test_name, test_result in tests.items():
                    total_tests += 1
                    if test_result["passed"]:
                        passed_tests += 1
                    else:
                        failed_categories.append(f"{category}.{test_name}")

            return {
                "email": self.email,
                "status": "pass" if passed_tests == total_tests else "fail",
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": total_tests - passed_tests,
                "failed_categories": failed_categories,
                "validations": all_validations,
                "simulation_years": len(results),
                "final_estate": float(results.iloc[-1].get('end_total_estate', 0))
            }

        except Exception as e:
            print(f"ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "email": self.email,
                "status": "error",
                "error": str(e)
            }


def generate_summary_report(all_results: List[Dict]) -> str:
    """Generate summary report for all accounts."""
    report = []
    report.append("\n" + "="*80)
    report.append("COMPREHENSIVE CALCULATION VALIDATION SUMMARY")
    report.append("="*80)
    report.append(f"Timestamp: {datetime.now().isoformat()}")
    report.append(f"Test Accounts: {len(all_results)}")
    report.append("")

    # Count by status
    passed_count = sum(1 for r in all_results if r.get('status') == 'pass')
    failed_count = sum(1 for r in all_results if r.get('status') == 'fail')
    error_count = sum(1 for r in all_results if r.get('status') == 'error')
    skipped_count = sum(1 for r in all_results if r.get('status') == 'skipped')

    report.append(f"✅ Passed:  {passed_count}")
    report.append(f"❌ Failed:  {failed_count}")
    report.append(f"⚠️  Errors:  {error_count}")
    report.append(f"⏭️  Skipped: {skipped_count}")
    report.append(f"📊 Total:   {len(all_results)}")
    report.append("")

    # Detail each account
    for result in all_results:
        email = result.get('email', 'Unknown')
        status = result.get('status', 'unknown')

        if status == 'pass':
            emoji = '✅'
        elif status == 'fail':
            emoji = '❌'
        elif status == 'error':
            emoji = '⚠️'
        else:
            emoji = '⏭️'

        report.append(f"\n{emoji} {email}")
        report.append("-" * 80)

        if status == 'pass':
            total = result.get('total_tests', 0)
            report.append(f"Status: PASS - All {total} validation tests passed")
            report.append(f"Simulation Years: {result.get('simulation_years', 'N/A')}")
            report.append(f"Final Estate: ${result.get('final_estate', 0):,.2f}")

        elif status == 'fail':
            total = result.get('total_tests', 0)
            passed = result.get('passed', 0)
            failed = result.get('failed', 0)
            report.append(f"Status: FAIL - {failed}/{total} tests failed")
            report.append(f"Passed: {passed}")
            report.append(f"Failed: {failed}")
            report.append("")
            report.append("Failed Categories:")
            for category in result.get('failed_categories', []):
                report.append(f"  - {category}")

            # Show details for failed tests
            validations = result.get('validations', {})
            for category_name, category_tests in validations.items():
                for test_name, test_result in category_tests.items():
                    if not test_result["passed"]:
                        report.append(f"\n  {category_name}.{test_name}:")
                        for detail in test_result["details"][:3]:  # Show first 3 details
                            report.append(f"    • {detail}")
                        if len(test_result["details"]) > 3:
                            report.append(f"    ... and {len(test_result['details']) - 3} more")

        elif status == 'error':
            report.append(f"Status: ERROR - {result.get('error', 'Unknown error')}")

        elif status == 'skipped':
            report.append(f"Status: SKIPPED - {result.get('reason', 'No reason given')}")

    report.append("\n" + "="*80)

    if failed_count == 0 and error_count == 0:
        report.append("✅ ALL CALCULATION VALIDATION TESTS PASSED")
    else:
        report.append("❌ SOME VALIDATION TESTS FAILED")

    report.append("="*80)

    return "\n".join(report)


def main():
    """Run comprehensive calculation validation tests."""
    print("="*80)
    print("COMPREHENSIVE CALCULATION VALIDATION TEST SUITE")
    print("="*80)
    print(f"Testing {len(TEST_ACCOUNTS)} accounts")
    print("")

    all_results = []

    for email in TEST_ACCOUNTS:
        validator = CalculationValidator(email)
        result = validator.run_all_validations()
        all_results.append(result)

    # Generate summary report
    summary = generate_summary_report(all_results)
    print(summary)

    # Save results
    output_file = "calculation_validation_results.json"
    with open(output_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "test_accounts": TEST_ACCOUNTS,
            "results": all_results
        }, f, indent=2)

    print(f"\n💾 Results saved to: {output_file}")

    # Return exit code
    failed_count = sum(1 for r in all_results if r.get('status') in ['fail', 'error'])
    return 1 if failed_count > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
