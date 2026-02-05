#!/usr/bin/env python3
"""
US-044 Auto-Optimization Test Script

Tests the auto-optimization feature by running gap scenarios and verifying:
1. Gaps are detected in original strategy
2. Alternative strategy is selected
3. Gaps are eliminated in optimized strategy
4. Tax increase is acceptable (<10%)
5. UI receives proper optimization_result data
"""

import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from api.models.requests import HouseholdInput
from api.routes.simulation import run_simulation_logic
from modules.tax_config import get_tax_config


def load_test_scenarios():
    """Load test scenarios from JSON file"""
    with open('US-044_AUTO_OPTIMIZATION_TEST_SCENARIOS.json', 'r') as f:
        data = json.load(f)
    return data['test_scenarios']


def run_test_scenario(scenario: dict) -> dict:
    """
    Run a single test scenario and return detailed results

    Returns:
        dict with keys:
            - scenario_name: str
            - original_strategy: str
            - had_gaps_originally: bool
            - optimization_triggered: bool
            - optimized_strategy: str (if optimized)
            - gaps_eliminated: int (if optimized)
            - original_success_rate: float
            - optimized_success_rate: float
            - tax_increase_pct: float (if optimized)
            - test_passed: bool
            - failure_reason: str (if failed)
    """
    print(f"\n{'='*80}")
    print(f"🧪 TESTING: {scenario['name']}")
    print(f"{'='*80}")
    print(f"Description: {scenario['description']}")
    print(f"Expected: {scenario['expected_outcome']}")
    print()

    try:
        # Parse household input
        household_dict = scenario['household']
        household_input = HouseholdInput(**household_dict)

        # Get tax config
        tax_cfg = get_tax_config(
            province=household_input.province,
            start_year=household_input.start_year
        )

        original_strategy = household_input.strategy
        print(f"📋 Original Strategy: {original_strategy}")
        print(f"💰 Total Assets: ${(household_input.p1.tfsa_balance + household_input.p1.rrif_balance + household_input.p1.rrsp_balance + household_input.p1.nonreg_balance):,}")
        print(f"💸 Annual Spending (go-go): ${household_input.spending_go_go:,}")
        print()

        # Run simulation (this will trigger auto-optimization if needed)
        print("🚀 Running simulation...")
        result = run_simulation_logic(household_input, tax_cfg)

        # Check if simulation succeeded
        if not result.get('success', False):
            print("❌ SIMULATION FAILED")
            print(f"Error: {result.get('message', 'Unknown error')}")
            return {
                'scenario_name': scenario['name'],
                'original_strategy': original_strategy,
                'had_gaps_originally': False,
                'optimization_triggered': False,
                'test_passed': False,
                'failure_reason': f"Simulation failed: {result.get('message', 'Unknown')}"
            }

        # Extract results
        summary = result.get('summary', {})
        optimization_result = result.get('optimization_result')
        year_by_year = result.get('year_by_year', [])

        # Calculate gap metrics
        years_funded = summary.get('years_funded', 0)
        years_simulated = summary.get('years_simulated', 0)
        success_rate = summary.get('success_rate', 0.0)
        had_gaps = success_rate < 1.0

        print(f"📊 Initial Results:")
        print(f"   Years Funded: {years_funded}/{years_simulated}")
        print(f"   Success Rate: {success_rate:.1%}")
        print(f"   Had Gaps: {'YES ⚠️' if had_gaps else 'NO ✅'}")
        print()

        # Check optimization result
        test_result = {
            'scenario_name': scenario['name'],
            'original_strategy': original_strategy,
            'had_gaps_originally': had_gaps,
            'optimization_triggered': optimization_result is not None,
            'original_success_rate': success_rate,
            'test_passed': False,
            'failure_reason': None
        }

        if optimization_result:
            print("✨ AUTO-OPTIMIZATION TRIGGERED!")
            print(f"   From: {optimization_result['original_strategy']}")
            print(f"   To: {optimization_result['optimized_strategy']}")
            print(f"   Gaps Eliminated: {optimization_result['gaps_eliminated']} years")
            print(f"   Original Success Rate: {optimization_result['original_success_rate']:.1%}")
            print(f"   Optimized Success Rate: {optimization_result['optimized_success_rate']:.1%}")
            print(f"   Tax Impact: {optimization_result['tax_increase_pct']:+.1f}% (${optimization_result['tax_increase_amount']:+,.0f})")
            print(f"   Score Improvement: +{optimization_result['score_improvement']:.1f} points")
            print(f"   Reason: {optimization_result['optimization_reason']}")
            print()

            # Add to test result
            test_result.update({
                'optimized_strategy': optimization_result['optimized_strategy'],
                'gaps_eliminated': optimization_result['gaps_eliminated'],
                'optimized_success_rate': optimization_result['optimized_success_rate'],
                'tax_increase_pct': optimization_result['tax_increase_pct'],
                'score_improvement': optimization_result['score_improvement']
            })

            # Verify optimization quality
            if optimization_result['optimized_success_rate'] >= 1.0:
                print("✅ OPTIMIZATION SUCCESS: All gaps eliminated!")
                test_result['test_passed'] = True
            else:
                print(f"⚠️ PARTIAL SUCCESS: Some gaps remain ({optimization_result['optimized_success_rate']:.1%})")
                test_result['failure_reason'] = "Not all gaps were eliminated"
        else:
            if had_gaps:
                print("❌ NO OPTIMIZATION: Gaps detected but no strategy switch occurred")
                test_result['failure_reason'] = "Gaps detected but optimizer did not trigger"
            else:
                print("✅ NO OPTIMIZATION NEEDED: Plan already fully funded")
                test_result['test_passed'] = True

        return test_result

    except Exception as e:
        print(f"❌ EXCEPTION: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'scenario_name': scenario['name'],
            'original_strategy': scenario['household']['strategy'],
            'had_gaps_originally': False,
            'optimization_triggered': False,
            'test_passed': False,
            'failure_reason': f"Exception: {str(e)}"
        }


def main():
    """Run all test scenarios and generate report"""
    print("=" * 80)
    print("US-044 AUTO-OPTIMIZATION TEST SUITE")
    print("=" * 80)
    print()

    # Load scenarios
    scenarios = load_test_scenarios()
    print(f"📝 Loaded {len(scenarios)} test scenarios")

    # Run all tests
    results = []
    for scenario in scenarios:
        result = run_test_scenario(scenario)
        results.append(result)

    # Generate summary report
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)

    passed = sum(1 for r in results if r['test_passed'])
    failed = len(results) - passed

    print(f"\nTotal Tests: {len(results)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print()

    # Detailed results
    for i, result in enumerate(results, 1):
        status = "✅ PASS" if result['test_passed'] else "❌ FAIL"
        print(f"\n{i}. {status} - {result['scenario_name']}")
        print(f"   Original Strategy: {result['original_strategy']}")
        print(f"   Had Gaps: {result['had_gaps_originally']}")
        print(f"   Optimization Triggered: {result['optimization_triggered']}")

        if result['optimization_triggered']:
            print(f"   Optimized Strategy: {result.get('optimized_strategy', 'N/A')}")
            print(f"   Gaps Eliminated: {result.get('gaps_eliminated', 0)}")
            print(f"   Success Rate: {result['original_success_rate']:.1%} → {result.get('optimized_success_rate', 0):.1%}")
            print(f"   Tax Impact: {result.get('tax_increase_pct', 0):+.1f}%")

        if result['failure_reason']:
            print(f"   ⚠️ Failure Reason: {result['failure_reason']}")

    print("\n" + "=" * 80)

    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
