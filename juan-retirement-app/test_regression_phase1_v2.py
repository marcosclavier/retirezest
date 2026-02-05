#!/usr/bin/env python3
"""
Phase 1 Regression Testing: Test Accounts (V2 - Using InputData)

This script uses the EXACT inputData from historical simulations to ensure
perfect regression testing. Instead of reconstructing simulation inputs from
the database schema, we use the actual inputs that were used in previous runs.

Test Accounts:
1. test@example.com (181 simulations - most active!)
2. claire.conservative@test.com (conservative profile)
3. alex.aggressive@test.com (aggressive profile)
4. mike.moderate@test.com (moderate profile)
5. sarah.struggling@test.com (insufficient assets scenario)
6. helen.highincome@test.com (high-income tax optimization)
"""

import sys
import json
import glob
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

class Phase1RegressionTester:
    def __init__(self):
        self.tax_cfg = load_tax_config("tax_config_canada_2025.json")
        self.results = []
        self.baselines_dir = Path(__file__).parent / "baselines"

    def load_baseline(self, email: str) -> Optional[Dict]:
        """Load the most recent baseline file for a user."""
        pattern = f"baseline_{email.replace('@', '_').replace('.', '_')}_*.json"
        files = sorted(glob.glob(str(self.baselines_dir / pattern)))

        if not files:
            print(f"⚠️ No baseline found for {email}")
            return None

        # Get most recent baseline
        baseline_file = files[-1]
        print(f"📂 Loading baseline: {Path(baseline_file).name}")

        with open(baseline_file, 'r') as f:
            return json.load(f)

    def convert_inputdata_to_household(self, input_data_json: str) -> Optional[Household]:
        """Convert simulation inputData JSON to Household model.

        This uses the EXACT input that was used in the original simulation,
        ensuring perfect regression testing.

        The inputData format has some legacy fields that need to be transformed:
        - employer_pension_annual -> pension_incomes list (if non-zero)
        - other_income_annual -> other_incomes list (if non-zero)
        """
        try:
            input_data = json.loads(input_data_json)

            # Helper to convert person data
            def convert_person_data(p_data: Dict) -> Dict:
                """Convert person data, handling legacy fields."""
                result = p_data.copy()

                # Handle employer_pension_annual -> pension_incomes
                if 'employer_pension_annual' in result:
                    pension_amount = result.pop('employer_pension_annual')
                    if pension_amount > 0 and 'pension_incomes' not in result:
                        result['pension_incomes'] = [{
                            'name': 'Employer Pension',
                            'amount': pension_amount,
                            'startAge': None,  # Will start at retirement
                            'inflationIndexed': True
                        }]

                # Handle other_income_annual -> other_incomes
                if 'other_income_annual' in result:
                    other_amount = result.pop('other_income_annual')
                    if other_amount > 0 and 'other_incomes' not in result:
                        result['other_incomes'] = [{
                            'type': 'other',
                            'amount': other_amount,
                            'startAge': None,
                            'endAge': None,
                            'inflationIndexed': False
                        }]

                return result

            # Create Person 1
            p1_data = convert_person_data(input_data['p1'])
            p1 = Person(**p1_data)

            # Create Person 2
            p2_data = convert_person_data(input_data['p2'])
            p2 = Person(**p2_data)

            # Create Household - remove p1/p2 from input_data dict
            household_data = {k: v for k, v in input_data.items() if k not in ['p1', 'p2']}
            household = Household(p1=p1, p2=p2, **household_data)

            return household

        except Exception as e:
            print(f"❌ Error converting input data: {e}")
            import traceback
            traceback.print_exc()
            return None

    def run_simulation(self, household: Household) -> Dict:
        """Run simulation and extract key metrics."""
        results_df = simulate(household, self.tax_cfg)

        # Calculate success rate - count years where plan_success is True
        successful_years = len(results_df[results_df['plan_success'] == True])
        total_years = len(results_df)
        success_rate = successful_years / total_years if total_years > 0 else 0

        total_tax = results_df['total_tax_after_split'].sum()
        total_benefits = (results_df['cpp_p1'].sum() + results_df['oas_p1'].sum() +
                         results_df['cpp_p2'].sum() + results_df['oas_p2'].sum())

        # Final estate (if plan succeeded to the end)
        # Use correct column names: end_tfsa_p1, end_rrif_p1, end_nonreg_p1, end_corp_p1
        if len(results_df) > 0:
            final_estate = (results_df.iloc[-1]['end_tfsa_p1'] +
                          results_df.iloc[-1]['end_rrif_p1'] +
                          results_df.iloc[-1]['end_nonreg_p1'] +
                          results_df.iloc[-1]['end_corp_p1'])
        else:
            final_estate = 0

        return {
            'success_rate': success_rate,
            'total_years': total_years,
            'successful_years': successful_years,
            'total_tax': total_tax,
            'total_benefits': total_benefits,
            'final_estate': final_estate,
            'results_df': results_df
        }

    def compare_with_baseline(self, current: Dict, baseline_success_rate: float) -> Dict:
        """Compare current simulation with baseline success rate."""
        # Compare success rates (±5% tolerance)
        success_rate_diff = abs(current['success_rate'] - baseline_success_rate)
        success_rate_match = success_rate_diff < 0.05

        passed = success_rate_match

        notes = []
        if not success_rate_match:
            notes.append(f"Success rate changed: {baseline_success_rate:.1%} → {current['success_rate']:.1%}")

        return {
            'passed': passed,
            'baseline_success_rate': baseline_success_rate,
            'current_success_rate': current['success_rate'],
            'success_rate_diff': success_rate_diff,
            'notes': '; '.join(notes) if notes else 'Success rate matches baseline'
        }

    def test_user(self, email: str) -> Dict:
        """Run regression test for a single user."""
        print("="*80)
        print(f"TESTING: {email}")
        print("="*80)

        # Load baseline
        baseline = self.load_baseline(email)
        if not baseline:
            return {
                'email': email,
                'status': 'skipped',
                'reason': 'No baseline data found'
            }

        print(f"✅ Baseline loaded: {baseline['user_profile']['firstName']} {baseline['user_profile'].get('lastName', '')}")

        # Get recent simulations
        recent_sims = baseline.get('recent_simulations', [])
        if not recent_sims:
            return {
                'email': email,
                'status': 'skipped',
                'reason': 'No historical simulations found'
            }

        print(f"   Found {len(recent_sims)} historical simulations")

        # Use most recent simulation
        baseline_sim = recent_sims[0]
        input_data_json = baseline_sim.get('inputData')
        baseline_success_rate = baseline_sim.get('successRate', 0)

        if not input_data_json:
            return {
                'email': email,
                'status': 'skipped',
                'reason': 'No inputData in baseline simulation'
            }

        print(f"   Baseline success rate: {baseline_success_rate:.1%}")
        print()

        # Convert to household
        household = self.convert_inputdata_to_household(input_data_json)
        if not household:
            return {
                'email': email,
                'status': 'error',
                'reason': 'Failed to convert inputData to household'
            }

        print("🚀 Running simulation with baseline inputs...")

        # Run simulation
        try:
            current_results = self.run_simulation(household)
            print("✅ Simulation complete")
            print()

            print(f"📊 Results:")
            print(f"   Success Rate: {current_results['success_rate']:.1%} ({current_results['successful_years']}/{current_results['total_years']} years)")
            print(f"   Total Tax: ${current_results['total_tax']:,.0f}")
            print(f"   Total Benefits: ${current_results['total_benefits']:,.0f}")
            print(f"   Final Estate: ${current_results['final_estate']:,.0f}")
            print()

            # Compare with baseline
            comparison = self.compare_with_baseline(current_results, baseline_success_rate)

            status = "✅ PASS" if comparison['passed'] else "❌ FAIL"
            print(f"🔍 Comparison: {status}")
            print(f"   Baseline Success: {comparison['baseline_success_rate']:.1%}")
            print(f"   Current Success: {comparison['current_success_rate']:.1%}")
            print(f"   Difference: {comparison['success_rate_diff']:.1%}")
            print(f"   Notes: {comparison['notes']}")

            print()
            print(status)
            print("="*80)
            print()

            return {
                'email': email,
                'status': 'pass' if comparison['passed'] else 'fail',
                'current_results': {
                    'success_rate': current_results['success_rate'],
                    'total_tax': current_results['total_tax'],
                    'total_benefits': current_results['total_benefits'],
                    'final_estate': current_results['final_estate']
                },
                'comparison': comparison
            }

        except Exception as e:
            print(f"❌ Simulation failed: {e}")
            import traceback
            traceback.print_exc()
            print()

            return {
                'email': email,
                'status': 'error',
                'reason': str(e)
            }

    def run_phase1(self):
        """Run all Phase 1 tests."""
        print("\n" + "="*80)
        print("PHASE 1 REGRESSION TESTING: TEST ACCOUNTS (V2)")
        print("="*80)
        print()

        test_accounts = [
            "test@example.com",
            "claire.conservative@test.com",
            "alex.aggressive@test.com",
            "mike.moderate@test.com",
            "sarah.struggling@test.com",
            "helen.highincome@test.com"
        ]

        results = []
        for email in test_accounts:
            result = self.test_user(email)
            results.append(result)

        # Summary
        passed = sum(1 for r in results if r['status'] == 'pass')
        failed = sum(1 for r in results if r['status'] == 'fail')
        errors = sum(1 for r in results if r['status'] == 'error')
        skipped = sum(1 for r in results if r['status'] == 'skipped')

        print("\n" + "="*80)
        print("PHASE 1 REGRESSION TEST SUMMARY (V2)")
        print("="*80)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Errors: {errors}")
        print(f"⏭️  Skipped: {skipped}")
        print(f"📊 Total: {len(results)}")
        print()

        # Save results
        output_file = "phase1_regression_results_v2.json"
        output = {
            'timestamp': datetime.now().isoformat(),
            'test_accounts': test_accounts,
            'summary': {
                'passed': passed,
                'failed': failed,
                'errors': errors,
                'skipped': skipped,
                'total': len(results)
            },
            'results': results
        }

        with open(output_file, 'w') as f:
            json.dump(output, f, indent=2, default=str)

        print(f"💾 Results saved to: {output_file}")
        print()

        if failed > 0:
            print("❌ REGRESSION TESTS FAILED")
            print("   Some tests did not match baseline expectations")
            return 1
        elif errors > 0:
            print("⚠️  REGRESSION TESTS HAD ERRORS")
            print("   Some tests could not complete")
            return 1
        elif skipped == len(results):
            print("⏭️  ALL TESTS SKIPPED")
            print("   No historical simulation data available")
            return 1
        else:
            print("✅ ALL REGRESSION TESTS PASSED")
            print("   No regressions detected in test accounts")
            return 0

def main():
    tester = Phase1RegressionTester()
    exit_code = tester.run_phase1()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
