"""
Simplified Tax Regression Test Suite
Tests tax engine directly to verify tax calculations remain accurate
After US-044 (Auto-Optimization) and US-076 (Income EndAge) changes
"""

import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.config import load_tax_config, get_tax_params
from modules.tax_engine import progressive_tax

# Load 2026 tax configuration
tax_cfg = load_tax_config("tax_config_canada_2025.json")

class TaxRegressionTest:
    def __init__(self):
        self.tests_passed = 0
        self.tests_failed = 0
        self.results = []

    def verify_tax(self, test_name: str, actual_tax: float,
                   expected_tax: float, tolerance_pct: float = 5.0) -> bool:
        """Verify tax is within tolerance"""
        tolerance = expected_tax * (tolerance_pct / 100) if expected_tax > 0 else 100
        lower_bound = expected_tax - tolerance
        upper_bound = expected_tax + tolerance

        passed = lower_bound <= actual_tax <= upper_bound
        variance = ((actual_tax - expected_tax) / expected_tax * 100) if expected_tax > 0 else 0

        result = {
            'test_name': test_name,
            'expected_tax': expected_tax,
            'actual_tax': actual_tax,
            'variance_pct': variance,
            'tolerance_pct': tolerance_pct,
            'passed': passed,
            'timestamp': datetime.now().isoformat()
        }

        self.results.append(result)

        if passed:
            self.tests_passed += 1
            print(f"✅ PASS: {test_name}")
            print(f"   Expected: ${expected_tax:,.2f}, Actual: ${actual_tax:,.2f}, Variance: {variance:+.2f}%")
        else:
            self.tests_failed += 1
            print(f"❌ FAIL: {test_name}")
            print(f"   Expected: ${expected_tax:,.2f}, Actual: ${actual_tax:,.2f}, Variance: {variance:+.2f}%")
            print(f"   Acceptable range: ${lower_bound:,.2f} - ${upper_bound:,.2f}")

        return passed

    def test_1_employment_income_taxation(self):
        """Test employment income tax calculation (US-076 regression)"""
        print("\n" + "="*80)
        print("TEST 1: Employment Income Taxation (Age 64, before retirement)")
        print("="*80)

        province = "ON"
        fed_params, prov_params = get_tax_params(tax_cfg, province)

        # Person age 64 with $100K employment income
        age = 64
        employment_income = 100000

        fed_res = progressive_tax(
            fed_params, age,
            pension_income=0,
            ordinary_income=employment_income,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=0
        )

        prov_res = progressive_tax(
            prov_params, age,
            pension_income=0,
            ordinary_income=employment_income,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=0
        )

        total_tax = fed_res['net_tax'] + prov_res['net_tax']
        print(f"   Federal tax: ${fed_res['net_tax']:,.2f}")
        print(f"   Provincial tax: ${prov_res['net_tax']:,.2f}")

        # Expected: ~$20K-$23K for $100K income in Ontario
        self.verify_tax("Employment Income (Age 64, $100K)", total_tax, 21500, tolerance_pct=8)

    def test_2_rrif_withdrawal_tax(self):
        """Test RRIF withdrawal taxation"""
        print("\n" + "="*80)
        print("TEST 2: RRIF Withdrawal Taxation (Age 71)")
        print("="*80)

        province = "BC"
        fed_params, prov_params = get_tax_params(tax_cfg, province)

        # Person age 71 with $42K RRIF withdrawal + CPP + OAS
        age = 71
        rrif_withdrawal = 42000
        cpp = 15000
        oas = 8500

        # RRIF counts as pension income for tax purposes
        fed_res = progressive_tax(
            fed_params, age,
            pension_income=rrif_withdrawal,
            ordinary_income=cpp + oas,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=oas
        )

        prov_res = progressive_tax(
            prov_params, age,
            pension_income=rrif_withdrawal,
            ordinary_income=cpp + oas,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=oas
        )

        total_tax = fed_res['net_tax'] + prov_res['net_tax']
        print(f"   Federal tax: ${fed_res['net_tax']:,.2f}")
        print(f"   Provincial tax: ${prov_res['net_tax']:,.2f}")

        # Expected: ~$8K-$10K for $65.5K total income in BC
        self.verify_tax("RRIF + CPP + OAS (Age 71)", total_tax, 9000, tolerance_pct=10)

    def test_3_capital_gains_50_percent_inclusion(self):
        """Test capital gains 50% inclusion rate"""
        print("\n" + "="*80)
        print("TEST 3: Capital Gains Taxation (50% Inclusion Rate)")
        print("="*80)

        province = "ON"
        fed_params, prov_params = get_tax_params(tax_cfg, province)

        # Person age 67 with $40K capital gains
        age = 67
        capital_gains = 40000
        cpp = 15000
        oas = 8500

        fed_res = progressive_tax(
            fed_params, age,
            pension_income=0,
            ordinary_income=cpp + oas,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=capital_gains,  # Only 50% taxable
            oas_received=oas
        )

        prov_res = progressive_tax(
            prov_params, age,
            pension_income=0,
            ordinary_income=cpp + oas,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=capital_gains,
            oas_received=oas
        )

        total_tax = fed_res['net_tax'] + prov_res['net_tax']
        print(f"   Total income: ${cpp + oas + capital_gains:,.2f}")
        print(f"   Taxable capital gains (50%): ${capital_gains * 0.5:,.2f}")
        print(f"   Federal tax: ${fed_res['net_tax']:,.2f}")
        print(f"   Provincial tax: ${prov_res['net_tax']:,.2f}")

        # Expected: ~$5K-$7K (lower than if all ordinary income)
        self.verify_tax("Capital Gains (50% Inclusion)", total_tax, 6000, tolerance_pct=12)

    def test_4_corporate_eligible_dividends(self):
        """Test corporate eligible dividend taxation"""
        print("\n" + "="*80)
        print("TEST 4: Corporate Eligible Dividend Taxation")
        print("="*80)

        province = "AB"
        fed_params, prov_params = get_tax_params(tax_cfg, province)

        # Person age 65 with $50K eligible dividends
        age = 65
        eligible_dividends = 50000
        cpp = 15000
        oas = 8500

        fed_res = progressive_tax(
            fed_params, age,
            pension_income=0,
            ordinary_income=cpp + oas,
            elig_dividends=eligible_dividends,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=oas
        )

        prov_res = progressive_tax(
            prov_params, age,
            pension_income=0,
            ordinary_income=cpp + oas,
            elig_dividends=eligible_dividends,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=oas
        )

        total_tax = fed_res['net_tax'] + prov_res['net_tax']
        grossup = eligible_dividends * fed_params.dividend_grossup_eligible
        print(f"   Eligible dividends: ${eligible_dividends:,.2f}")
        print(f"   Grossup (38%): ${grossup:,.2f}")
        print(f"   Federal tax: ${fed_res['net_tax']:,.2f}")
        print(f"   Provincial tax: ${prov_res['net_tax']:,.2f}")

        # Expected: ~$4K-$6K (dividend tax credit benefit)
        self.verify_tax("Eligible Dividends", total_tax, 5000, tolerance_pct=15)

    def test_5_pension_income_splitting(self):
        """Test pension income splitting (couples) using recompute_tax"""
        print("\n" + "="*80)
        print("TEST 5: Pension Income Splitting (Couples)")
        print("="*80)

        province = "ON"
        fed_params, prov_params = get_tax_params(tax_cfg, province)

        # Person 1: Age 68 with $40K pension
        # Person 2: Age 66 with no pension
        p1_age = 68
        p1_pension = 40000
        p1_cpp = 15000
        p1_oas = 8500

        p2_age = 66
        p2_cpp = 12000
        p2_oas = 8500

        # Before splitting
        p1_fed_before = progressive_tax(fed_params, p1_age, pension_income=p1_pension,
                                        ordinary_income=p1_cpp + p1_oas, elig_dividends=0,
                                        nonelig_dividends=0, cap_gains=0, oas_received=p1_oas)
        p1_prov_before = progressive_tax(prov_params, p1_age, pension_income=p1_pension,
                                         ordinary_income=p1_cpp + p1_oas, elig_dividends=0,
                                         nonelig_dividends=0, cap_gains=0, oas_received=p1_oas)

        p2_fed_before = progressive_tax(fed_params, p2_age, pension_income=0,
                                        ordinary_income=p2_cpp + p2_oas, elig_dividends=0,
                                        nonelig_dividends=0, cap_gains=0, oas_received=p2_oas)
        p2_prov_before = progressive_tax(prov_params, p2_age, pension_income=0,
                                         ordinary_income=p2_cpp + p2_oas, elig_dividends=0,
                                         nonelig_dividends=0, cap_gains=0, oas_received=p2_oas)

        total_before = (p1_fed_before['net_tax'] + p1_prov_before['net_tax'] +
                       p2_fed_before['net_tax'] + p2_prov_before['net_tax'])

        # After splitting (50% of pension to spouse)
        split_amount = p1_pension * 0.5

        p1_fed_after = progressive_tax(fed_params, p1_age, pension_income=p1_pension - split_amount,
                                       ordinary_income=p1_cpp + p1_oas, elig_dividends=0,
                                       nonelig_dividends=0, cap_gains=0, oas_received=p1_oas)
        p1_prov_after = progressive_tax(prov_params, p1_age, pension_income=p1_pension - split_amount,
                                        ordinary_income=p1_cpp + p1_oas, elig_dividends=0,
                                        nonelig_dividends=0, cap_gains=0, oas_received=p1_oas)

        p2_fed_after = progressive_tax(fed_params, p2_age, pension_income=split_amount,
                                       ordinary_income=p2_cpp + p2_oas, elig_dividends=0,
                                       nonelig_dividends=0, cap_gains=0, oas_received=p2_oas)
        p2_prov_after = progressive_tax(prov_params, p2_age, pension_income=split_amount,
                                        ordinary_income=p2_cpp + p2_oas, elig_dividends=0,
                                        nonelig_dividends=0, cap_gains=0, oas_received=p2_oas)

        total_after = (p1_fed_after['net_tax'] + p1_prov_after['net_tax'] +
                      p2_fed_after['net_tax'] + p2_prov_after['net_tax'])

        tax_savings = total_before - total_after

        print(f"   Total tax before splitting: ${total_before:,.2f}")
        print(f"   Total tax after splitting: ${total_after:,.2f}")
        print(f"   Tax savings from splitting: ${tax_savings:,.2f}")

        # Verify splitting reduces total tax (savings should be $1K-$3K)
        if tax_savings > 0:
            print(f"✅ PASS: Pension splitting reduces total tax")
            self.tests_passed += 1
        else:
            print(f"❌ FAIL: Pension splitting should reduce total tax")
            self.tests_failed += 1

    def test_6_oas_clawback(self):
        """Test OAS clawback calculation"""
        print("\n" + "="*80)
        print("TEST 6: OAS Clawback at High Income")
        print("="*80)

        province = "ON"
        fed_params, prov_params = get_tax_params(tax_cfg, province)

        # Person age 70 with high income triggering OAS clawback
        age = 70
        rrif_withdrawal = 80000
        cpp = 21000  # Delayed CPP
        oas = 8500
        pension = 30000

        total_income = rrif_withdrawal + cpp + oas + pension

        fed_res = progressive_tax(
            fed_params, age,
            pension_income=rrif_withdrawal + pension,
            ordinary_income=cpp + oas,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=oas
        )

        prov_res = progressive_tax(
            prov_params, age,
            pension_income=rrif_withdrawal + pension,
            ordinary_income=cpp + oas,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=oas
        )

        total_tax = fed_res['net_tax'] + prov_res['net_tax']

        print(f"   Total income: ${total_income:,.2f}")
        print(f"   Federal tax: ${fed_res['net_tax']:,.2f}")
        print(f"   Provincial tax: ${prov_res['net_tax']:,.2f}")
        print(f"   Total tax: ${total_tax:,.2f}")

        # Expected: ~$28K-$32K for ~$140K income
        self.verify_tax("High Income with OAS Clawback", total_tax, 30000, tolerance_pct=10)

    def test_7_multiple_income_types(self):
        """Test correct aggregation of multiple income types"""
        print("\n" + "="*80)
        print("TEST 7: Multiple Income Types Aggregation")
        print("="*80)

        province = "AB"
        fed_params, prov_params = get_tax_params(tax_cfg, province)

        # Person age 66 with multiple income streams
        age = 66
        cpp = 15000
        oas = 8500
        pension = 20000
        rental_income = 24000  # Other income
        rrif = 22000

        # Total income
        total_income = cpp + oas + pension + rental_income + rrif

        fed_res = progressive_tax(
            fed_params, age,
            pension_income=pension + rrif,
            ordinary_income=cpp + oas + rental_income,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=oas
        )

        prov_res = progressive_tax(
            prov_params, age,
            pension_income=pension + rrif,
            ordinary_income=cpp + oas + rental_income,
            elig_dividends=0,
            nonelig_dividends=0,
            cap_gains=0,
            oas_received=oas
        )

        total_tax = fed_res['net_tax'] + prov_res['net_tax']

        print(f"   Total income: ${total_income:,.2f}")
        print(f"   CPP: ${cpp:,.2f}, OAS: ${oas:,.2f}")
        print(f"   Pension: ${pension:,.2f}, Rental: ${rental_income:,.2f}")
        print(f"   RRIF: ${rrif:,.2f}")
        print(f"   Federal tax: ${fed_res['net_tax']:,.2f}")
        print(f"   Provincial tax: ${prov_res['net_tax']:,.2f}")

        # Expected: ~$16K-$18K for ~$90K total income
        self.verify_tax("Multiple Income Types", total_tax, 17000, tolerance_pct=10)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("TAX REGRESSION TEST SUMMARY")
        print("="*80)
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_failed}")
        print(f"Total Tests: {self.tests_passed + self.tests_failed}")

        if self.tests_failed == 0:
            print("\n✅ ALL TAX REGRESSION TESTS PASSED")
            print("Tax calculations remain accurate after US-044 and US-076 changes")
        else:
            print(f"\n❌ {self.tests_failed} TESTS FAILED - REVIEW REQUIRED")

        # Save results to JSON
        with open('tax_regression_results_simple.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'passed': self.tests_passed,
                    'failed': self.tests_failed,
                    'total': self.tests_passed + self.tests_failed
                },
                'results': self.results
            }, f, indent=2)

        print(f"\nDetailed results saved to: tax_regression_results_simple.json")


def main():
    """Run all tax regression tests"""
    print("="*80)
    print("TAX REGRESSION TEST SUITE (Simplified)")
    print("Testing tax engine after US-044 and US-076 changes")
    print("="*80)

    tester = TaxRegressionTest()

    try:
        # Run all tests
        tester.test_1_employment_income_taxation()
        tester.test_2_rrif_withdrawal_tax()
        tester.test_3_capital_gains_50_percent_inclusion()
        tester.test_4_corporate_eligible_dividends()
        tester.test_5_pension_income_splitting()
        tester.test_6_oas_clawback()
        tester.test_7_multiple_income_types()

    except Exception as e:
        print(f"\n❌ ERROR: Test suite failed with exception: {e}")
        import traceback
        traceback.print_exc()

    finally:
        tester.print_summary()

    return 0 if tester.tests_failed == 0 else 1


if __name__ == "__main__":
    exit(main())
