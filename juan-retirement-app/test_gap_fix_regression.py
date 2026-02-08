#!/usr/bin/env python3
"""
Regression test for household gap calculation fix.

Tests all baseline scenarios to ensure the fix doesn't break existing simulations.
Validates that:
1. Simulations complete without errors
2. Gap calculations are reasonable
3. Plan success rates match expectations
"""

import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from modules.models import Person, Household
from modules.simulation import simulate
from modules.config import load_tax_config

def load_baseline(filepath):
    """Load baseline JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)

def create_household_from_baseline(baseline):
    """Create Household object from baseline data"""
    data = baseline.get('household_data', {})

    # Create Person 1
    p1_data = data.get('person1', {})
    p1 = Person(
        name=p1_data.get('name', 'Person1'),
        start_age=p1_data.get('age', 65),
        rrsp_balance=p1_data.get('rrsp_balance', 0),
        tfsa_balance=p1_data.get('tfsa_balance', 0),
        nonreg_balance=p1_data.get('nonreg_balance', 0),
        corporate_balance=p1_data.get('corporate_balance', 0),
        cpp_start_age=p1_data.get('cpp_start_age', 65),
        cpp_annual_at_start=p1_data.get('cpp_benefit_at_65', 0),
        oas_start_age=p1_data.get('oas_start_age', 65),
        oas_annual_at_start=p1_data.get('oas_benefit_max', 0)
    )

    # Create Person 2
    p2_data = data.get('person2', {})
    p2 = Person(
        name=p2_data.get('name', 'Person2'),
        start_age=p2_data.get('age', 65),
        rrsp_balance=p2_data.get('rrsp_balance', 0),
        tfsa_balance=p2_data.get('tfsa_balance', 0),
        nonreg_balance=p2_data.get('nonreg_balance', 0),
        corporate_balance=p2_data.get('corporate_balance', 0),
        cpp_start_age=p2_data.get('cpp_start_age', 65),
        cpp_annual_at_start=p2_data.get('cpp_benefit_at_65', 0),
        oas_start_age=p2_data.get('oas_start_age', 65),
        oas_annual_at_start=p2_data.get('oas_benefit_max', 0)
    )

    # Create Household
    hh_data = data.get('household', {})
    household = Household(
        p1=p1,
        p2=p2,
        province=hh_data.get('province', 'BC'),
        start_year=hh_data.get('start_year', 2026),
        end_age=hh_data.get('end_age', 95),
        spending_go_go=hh_data.get('spending_go_go', 60000),
        spending_slow_go=hh_data.get('spending_slow_go', 50000),
        spending_no_go=hh_data.get('spending_no_go', 40000),
        go_go_end_age=hh_data.get('go_go_end_age', 75),
        slow_go_end_age=hh_data.get('slow_go_end_age', 85),
        strategy=hh_data.get('strategy', 'Balanced'),
        gap_tolerance=hh_data.get('gap_tolerance', 100)
    )

    return household

def test_baseline(filepath, tax_cfg):
    """Test a single baseline scenario"""
    baseline = load_baseline(filepath)
    name = baseline.get('name', Path(filepath).stem)

    print(f"\n{'='*80}")
    print(f"Testing: {name}")
    print(f"{'='*80}")

    try:
        # Create household from baseline
        household = create_household_from_baseline(baseline)

        print(f"  {household.p1.name} (P1): Age {household.p1.start_age}")
        print(f"    RRSP: ${household.p1.rrsp_balance:,.0f}")
        print(f"    TFSA: ${household.p1.tfsa_balance:,.0f}")
        print(f"    NonReg: ${household.p1.nonreg_balance:,.0f}")
        print(f"  {household.p2.name} (P2): Age {household.p2.start_age}")
        print(f"    RRSP: ${household.p2.rrsp_balance:,.0f}")
        print(f"    TFSA: ${household.p2.tfsa_balance:,.0f}")
        print(f"    NonReg: ${household.p2.nonreg_balance:,.0f}")
        print(f"  Spending: ${household.spending_go_go:,.0f} (go-go)")
        print(f"  Strategy: {household.strategy}")

        # Run simulation
        result = simulate(household, tax_cfg, custom_df=None)

        # Analyze results
        total_years = len(result)
        years_with_gaps = len(result[result['spending_gap'] > household.gap_tolerance])
        success_rate = len(result[result['plan_success'] == True]) / total_years * 100

        print(f"\n  Results:")
        print(f"    Total years: {total_years}")
        print(f"    Years with gaps: {years_with_gaps}")
        print(f"    Plan success rate: {success_rate:.1f}%")

        # Check for anomalies
        if result['spending_gap'].isnull().any():
            print(f"  ⚠️  WARNING: Found null gaps")
            return False

        max_gap = result['spending_gap'].max()
        print(f"    Max gap: ${max_gap:,.0f}")

        # Check baseline expectations if available
        baseline_success = baseline.get('plan_success_rate')
        if baseline_success is not None:
            diff = abs(success_rate - baseline_success)
            if diff > 1.0:  # Allow 1% tolerance
                print(f"  ❌ FAIL: Success rate changed significantly")
                print(f"     Baseline: {baseline_success:.1f}%")
                print(f"     Current: {success_rate:.1f}%")
                print(f"     Difference: {diff:.1f}%")
                return False
            else:
                print(f"  ✅ PASS: Success rate matches baseline ({baseline_success:.1f}%)")
        else:
            print(f"  ✅ PASS: Simulation completed successfully")

        return True

    except Exception as e:
        print(f"  ❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run regression tests on all baselines"""
    print("="*80)
    print("HOUSEHOLD GAP FIX - REGRESSION TESTING".center(80))
    print("="*80)

    # Load tax config
    tax_cfg = load_tax_config('tax_config_canada_2025.json')

    # Find all baseline files
    baselines_dir = Path(__file__).parent / 'baselines'
    baseline_files = list(baselines_dir.glob('*.json'))

    print(f"\nFound {len(baseline_files)} baseline scenarios")

    # Test each baseline
    results = {}
    for baseline_file in sorted(baseline_files):
        try:
            passed = test_baseline(baseline_file, tax_cfg)
            results[baseline_file.name] = 'PASS' if passed else 'FAIL'
        except Exception as e:
            print(f"\n❌ EXCEPTION testing {baseline_file.name}: {str(e)}")
            results[baseline_file.name] = 'ERROR'

    # Print summary
    print(f"\n{'='*80}")
    print("REGRESSION TEST SUMMARY".center(80))
    print(f"{'='*80}\n")

    passed = sum(1 for r in results.values() if r == 'PASS')
    failed = sum(1 for r in results.values() if r == 'FAIL')
    errors = sum(1 for r in results.values() if r == 'ERROR')

    for name, status in sorted(results.items()):
        emoji = '✅' if status == 'PASS' else ('❌' if status == 'FAIL' else '⚠️')
        print(f"{emoji} {name:<60} {status}")

    print(f"\n{'='*80}")
    print(f"Total: {len(results)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⚠️  Errors: {errors}")
    print(f"{'='*80}\n")

    if failed == 0 and errors == 0:
        print("🎉 ALL REGRESSION TESTS PASSED")
        print("   Household gap fix does not break existing simulations")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED")
        print("   Review failures above")
        return 1

if __name__ == "__main__":
    sys.exit(main())
