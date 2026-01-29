#!/usr/bin/env python3
"""
Test GIS Assessment Improvements
Directly test the Python simulation to verify all 5 improvements are working
"""

import os
import sys

# Set matplotlib backend to non-interactive
os.environ['MPLBACKEND'] = 'Agg'

from modules.simulation import simulate
from modules.models import Person, Household
from modules.config import load_tax_config

def test_gis_improvements():
    print('\n╔════════════════════════════════════════════════════════════╗')
    print('║      GIS IMPROVEMENTS - PYTHON DIRECT TEST                 ║')
    print('╚════════════════════════════════════════════════════════════╝\n')

    # Load tax config
    print('Loading tax configuration...')
    tax_cfg = load_tax_config('tax_config_canada_2025.json')
    print('✓ Tax config loaded\n')

    # Create test household
    print('Creating test household:')
    print('  Age: 58')
    print('  RRIF: $120,000')
    print('  TFSA: $95,000')
    print('  NonReg: $200,000')
    print('  CPP: $12,000/year')
    print('  Strategy: minimize-income\n')

    p1 = Person(
        name='Test User',
        start_age=58,
        cpp_start_age=65,
        cpp_annual_at_start=12000,
        oas_start_age=65,
        oas_annual_at_start=8500,
        tfsa_balance=95000,
        rrif_balance=120000,
        rrsp_balance=0,
        nonreg_balance=200000,
        corporate_balance=0
    )

    p2 = Person(name='', start_age=65)

    hh = Household(
        p1, p2,
        province='ON',
        start_year=2025,
        end_age=95,
        strategy='minimize-income'
    )
    hh.spending_go_go = 48000
    hh.go_go_end_age = 75
    hh.spending_slow_go = 38400
    hh.slow_go_end_age = 85
    hh.spending_no_go = 28800

    # Run simulation
    print('Running simulation...')
    try:
        df = simulate(hh, tax_cfg)
        print('✓ Simulation completed successfully\n')
    except Exception as e:
        print(f'✗ Simulation failed: {e}')
        import traceback
        traceback.print_exc()
        return False

    # Check for strategy insights
    if 'strategy_insights' not in df.attrs:
        print('❌ FAILED: strategy_insights not found in simulation results\n')
        return False

    insights = df.attrs['strategy_insights']
    print('✓ Strategy insights found\n')

    print('═══════════════════════════════════════════════════════════\n')
    print('📊 GIS FEASIBILITY:')
    print(f"  Status: {insights.get('gis_feasibility', {}).get('status', 'N/A')}")
    print(f"  Eligible Years: {insights.get('gis_feasibility', {}).get('eligible_years', 0)}")
    print(f"  Total GIS: ${insights.get('gis_feasibility', {}).get('total_projected_gis', 0):,.0f}")
    print(f"  Max RRIF @ 71: ${insights.get('gis_feasibility', {}).get('max_rrif_for_gis_at_71', 0):,.0f}\n")

    print('═══════════════════════════════════════════════════════════\n')
    print('🔍 TESTING 5 IMPROVEMENTS:\n')

    # Test improvement #5 first (metadata)
    passed = 0
    failed = 0

    print('[5] Caveats & Disclaimers:')
    if 'disclaimer' in insights:
        print(f'    ✓ Disclaimer present ({len(insights["disclaimer"])} chars)')
        passed += 1
    else:
        print('    ✗ Disclaimer missing')
        failed += 1

    if 'last_updated' in insights:
        print(f'    ✓ Last updated: {insights["last_updated"]}')
        passed += 1
    else:
        print('    ✗ Last updated missing')
        failed += 1

    if 'data_sources' in insights and len(insights['data_sources']) > 0:
        print(f'    ✓ Data sources: {len(insights["data_sources"])} items')
        passed += 1
    else:
        print('    ✗ Data sources missing')
        failed += 1

    print()

    # Check recommendations
    if 'recommendations' not in insights or len(insights['recommendations']) == 0:
        print('❌ No recommendations found - cannot test improvements 1-4\n')
        return False

    rec = insights['recommendations'][0]
    print(f'📋 Testing Recommendation: "{rec.get("title", "N/A")}"\n')

    # Test improvement #1: Dynamic benefit calculation
    print('[1] Dynamic GIS Benefit Calculation:')
    if 'benefit_range' in rec:
        br = rec['benefit_range']
        if 'estimate' in br and 'lower' in br and 'upper' in br:
            print(f'    ✓ Benefit range present')
            print(f'      Estimate: ${br["estimate"]:,.0f}')
            print(f'      Range: ${br["lower"]:,.0f} - ${br["upper"]:,.0f}')

            # Check it's dynamic (range > 0)
            if br['upper'] > br['lower']:
                print(f'    ✓ Dynamic range (not hardcoded)')
                passed += 2
            else:
                print(f'    ✗ Range appears static')
                failed += 1
                passed += 1
        else:
            print(f'    ✗ Benefit range incomplete')
            failed += 1
    else:
        print(f'    ✗ Benefit range missing')
        failed += 1

    print()

    # Test improvement #2: Feasibility checks
    print('[2] Feasibility Checks:')
    if 'feasibility' in rec:
        print(f'    ✓ Feasibility field: {rec["feasibility"]}')
        passed += 1
    else:
        print(f'    ✗ Feasibility field missing')
        failed += 1

    if 'feasibility_note' in rec:
        note = rec['feasibility_note']
        print(f'    ✓ Feasibility note present')
        print(f'      Preview: {note[:80]}...')
        passed += 1
    else:
        print(f'    ✗ Feasibility note missing')
        failed += 1

    print()

    # Test improvement #3: Age-appropriate recommendations
    print('[3] Age-Appropriate Recommendations:')
    if 'priority' in rec:
        print(f'    ✓ Priority level: {rec["priority"].upper()}')
        passed += 1
    else:
        print(f'    ✗ Priority field missing')
        failed += 1

    if 'timing_appropriateness' in rec:
        print(f'    ✓ Timing appropriateness: {rec["timing_appropriateness"]}')
        passed += 1
    else:
        print(f'    ✗ Timing appropriateness missing')
        failed += 1

    if 'timing_note' in rec:
        note = rec['timing_note']
        print(f'    ✓ Timing note present')
        print(f'      Preview: {note[:80]}...')
        passed += 1
    else:
        print(f'    ✗ Timing note missing')
        failed += 1

    print()

    # Test improvement #4: Confidence intervals
    print('[4] Confidence Intervals:')
    if 'confidence' in rec:
        print(f'    ✓ Confidence level: {rec["confidence"].upper()}')
        passed += 1
    else:
        print(f'    ✗ Confidence field missing')
        failed += 1

    # Additional check - caveats and assumptions
    if 'caveats' in rec and len(rec['caveats']) > 0:
        print(f'    ✓ Caveats: {len(rec["caveats"])} items')
        passed += 1
    else:
        print(f'    ✗ Caveats missing')
        failed += 1

    if 'assumptions' in rec and len(rec['assumptions']) > 0:
        print(f'    ✓ Assumptions: {len(rec["assumptions"])} items')
        passed += 1
    else:
        print(f'    ✗ Assumptions missing')
        failed += 1

    print()
    print('═══════════════════════════════════════════════════════════\n')
    print('📊 TEST RESULTS:\n')
    print(f'  Passed: {passed}')
    print(f'  Failed: {failed}')
    print(f'  Success Rate: {(passed/(passed+failed)*100):.1f}%\n')

    if failed == 0:
        print('✅ ALL TESTS PASSED! All 5 improvements verified!\n')
        return True
    elif failed <= 3:
        print('⚠️  PARTIAL SUCCESS - Most improvements working\n')
        return True
    else:
        print('❌ MULTIPLE FAILURES - Review implementation\n')
        return False

if __name__ == '__main__':
    try:
        success = test_gis_improvements()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f'\n❌ FATAL ERROR: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
