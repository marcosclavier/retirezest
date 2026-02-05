#!/usr/bin/env python3
"""
Phase 1 Regression Testing: Test Accounts

This script runs automated regression tests against the Priority 1 test accounts
using their extracted baseline data. It verifies that recent changes (US-044, US-076)
did not introduce regressions in simulation outputs.

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

    def convert_baseline_to_household(self, baseline: Dict) -> Optional[Household]:
        """Convert baseline data to Household model for simulation."""
        try:
            financial_data = baseline['financial_data']
            user_profile = baseline['user_profile']
            scenarios = baseline.get('scenarios', [])

            if not scenarios:
                print(f"⚠️  No scenarios found in baseline")
                return None

            # Use first scenario
            scenario = scenarios[0]

            # Build Person 1
            p1_data = {
                'name': f"{user_profile.get('firstName', 'User')} {user_profile.get('lastName', '')}".strip(),
                'start_age': self._calculate_age(user_profile.get('dateOfBirth')),
                'tfsa_balance': 0,
                'rrsp_balance': 0,
                'rrif_balance': 0,
                'nonreg_balance': 0,
                'corporate_balance': 0,
                'cpp_start_age': None,
                'cpp_annual_at_start': 0,
                'oas_start_age': None,
                'oas_annual_at_start': 0,
                'other_incomes': []
            }

            # Map assets
            for asset in financial_data.get('assets', []):
                asset_type = asset.get('type', '').lower()
                amount = float(asset.get('value', 0))

                if asset_type == 'tfsa':
                    p1_data['tfsa_balance'] += amount
                elif asset_type in ['rrsp', 'rrif']:
                    if asset_type == 'rrsp':
                        p1_data['rrsp_balance'] += amount
                    else:
                        p1_data['rrif_balance'] += amount
                elif asset_type == 'nonreg':
                    p1_data['nonreg_balance'] += amount
                elif asset_type == 'corporate':
                    p1_data['corporate_balance'] += amount

            # Map income sources
            for income in financial_data.get('incomeSources', []):
                income_type = income.get('type', '').lower()
                amount = float(income.get('amount', 0))
                start_age = income.get('startAge')
                end_age = income.get('endAge')

                if income_type == 'cpp':
                    p1_data['cpp_annual_at_start'] = amount
                    p1_data['cpp_start_age'] = start_age or 65
                elif income_type == 'oas':
                    p1_data['oas_annual_at_start'] = amount
                    p1_data['oas_start_age'] = start_age or 65
                else:
                    p1_data['other_incomes'].append({
                        'type': income_type,
                        'amount': amount,
                        'startAge': start_age,
                        'endAge': end_age,
                        'inflationIndexed': income.get('inflationIndexed', False)
                    })

            # Create Person 1
            p1 = Person(**p1_data)

            # Create Person 2 (no partner for now)
            p2 = Person(name="No Partner", start_age=p1.start_age)

            # Create Household
            household = Household(
                p1=p1,
                p2=p2,
                province=user_profile.get('province', 'ON'),
                start_year=datetime.now().year,
                end_age=scenario.get('endAge', 85),
                strategy=scenario.get('strategy', 'minimize-income'),
                spending_go_go=scenario.get('spendingGoGo', 50000),
                spending_slow_go=scenario.get('spendingSlowGo', 40000),
                spending_no_go=scenario.get('spendingNoGo', 30000),
                spending_inflation=0.02,
                general_inflation=0.02
            )

            return household

        except Exception as e:
            print(f"❌ Error converting baseline: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _calculate_age(self, date_of_birth: Optional[str]) -> int:
        """Calculate age from date of birth."""
        if not date_of_birth:
            return 65  # Default

        try:
            dob = datetime.fromisoformat(date_of_birth.replace('Z', '+00:00'))
            today = datetime.now()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            return age
        except:
            return 65  # Default

    def run_simulation(self, household: Household) -> Dict:
        """Run simulation and extract key metrics."""
        results_df = simulate(household, self.tax_cfg)

        failed_years = len(results_df[results_df['plan_success'] == False])
        total_years = len(results_df)
        success_rate = (total_years - failed_years) / total_years if total_years > 0 else 0

        total_tax = results_df['total_tax_after_split'].sum()
        total_benefits = (results_df['cpp_p1'].sum() + results_df['oas_p1'].sum() +
                         results_df['cpp_p2'].sum() + results_df['oas_p2'].sum())

        # Final estate (if plan succeeded to the end)
        if len(results_df) > 0:
            final_estate = (results_df.iloc[-1]['tfsa_p1'] +
                          results_df.iloc[-1]['rrif_p1'] +
                          results_df.iloc[-1]['nonreg_p1'])
        else:
            final_estate = 0

        return {
            'success_rate': success_rate,
            'total_years': total_years,
            'successful_years': total_years - failed_years,
            'total_tax': total_tax,
            'total_benefits': total_benefits,
            'final_estate': final_estate,
            'results_df': results_df
        }

    def compare_with_baseline(self, current: Dict, baseline_sims: List[Dict]) -> Dict:
        """Compare current simulation with baseline simulations."""
        if not baseline_sims:
            return {
                'has_baseline': False,
                'passed': None,
                'notes': 'No baseline simulations found'
            }

        # Get most recent baseline simulation
        baseline_sim = baseline_sims[0]
        baseline_output = baseline_sim.get('outputData', {})

        if not baseline_output:
            return {
                'has_baseline': False,
                'passed': None,
                'notes': 'No baseline output data'
            }

        # Extract baseline metrics
        baseline_success_rate = baseline_output.get('successRate', baseline_sim.get('successRate', 0))

        # Compare success rates (±5% tolerance)
        success_rate_diff = abs(current['success_rate'] - baseline_success_rate)
        success_rate_match = success_rate_diff < 0.05

        passed = success_rate_match

        notes = []
        if not success_rate_match:
            notes.append(f"Success rate changed: {baseline_success_rate:.1%} → {current['success_rate']:.1%}")

        return {
            'has_baseline': True,
            'passed': passed,
            'baseline_success_rate': baseline_success_rate,
            'current_success_rate': current['success_rate'],
            'success_rate_diff': success_rate_diff,
            'notes': '; '.join(notes) if notes else 'All metrics match baseline'
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
        print(f"   Assets: {len(baseline['financial_data']['assets'])}")
        print(f"   Income: {len(baseline['financial_data']['incomeSources'])}")
        print(f"   Scenarios: {len(baseline.get('scenarios', []))}")
        print(f"   Baseline Sims: {len(baseline.get('recent_simulations', []))}")
        print()

        # Convert to household
        household = self.convert_baseline_to_household(baseline)
        if not household:
            return {
                'email': email,
                'status': 'error',
                'reason': 'Failed to convert baseline to household'
            }

        print("🚀 Running simulation...")

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
            comparison = self.compare_with_baseline(
                current_results,
                baseline.get('recent_simulations', [])
            )

            if comparison['has_baseline']:
                status = "✅ PASS" if comparison['passed'] else "❌ FAIL"
                print(f"🔍 Comparison: {status}")
                print(f"   Baseline Success: {comparison['baseline_success_rate']:.1%}")
                print(f"   Current Success: {comparison['current_success_rate']:.1%}")
                print(f"   Difference: {comparison['success_rate_diff']:.1%}")
                print(f"   Notes: {comparison['notes']}")
            else:
                print("⚠️  No baseline comparison available (first simulation)")
                status = "⚠️ NO BASELINE"

            print()
            print(status)
            print("="*80)
            print()

            return {
                'email': email,
                'status': 'pass' if comparison.get('passed', True) else 'fail',
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
        print("PHASE 1 REGRESSION TESTING: TEST ACCOUNTS")
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
        print("PHASE 1 REGRESSION TEST SUMMARY")
        print("="*80)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Errors: {errors}")
        print(f"⏭️  Skipped: {skipped}")
        print(f"📊 Total: {len(results)}")
        print()

        # Save results
        output_file = "phase1_regression_results.json"
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
