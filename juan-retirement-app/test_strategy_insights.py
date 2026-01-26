"""
Test script for AI-powered strategy insights.

Tests the insights generation for the minimize-income strategy.
"""

import json
from modules.models import Person, Household
from modules.config import load_tax_config
from modules.simulation import simulate
from modules.strategy_insights import format_insights_for_display


def test_insights_generation():
    """Test AI-powered insights generation with Rafael & Lucy scenario."""
    print("="*80)
    print("AI-POWERED INSIGHTS TEST: Rafael & Lucy Scenario")
    print("="*80)

    # Load test scenario
    with open('api/test_rafael_lucy_minimize_income.json', 'r') as f:
        data = json.load(f)

    # Load tax config
    tax_config = load_tax_config('tax_config_canada_2025.json')

    # Create persons
    p1_data = data['p1']
    p1 = Person(
        name=p1_data['name'],
        start_age=p1_data['start_age'],
        tfsa_balance=p1_data['tfsa_balance'],
        rrif_balance=p1_data['rrif_balance'],
        rrsp_balance=p1_data['rrsp_balance'],
        nonreg_balance=p1_data['nonreg_balance'],
        corporate_balance=p1_data['corporate_balance'],
        cpp_annual_at_start=p1_data['cpp_annual_at_start'],
        cpp_start_age=p1_data['cpp_start_age'],
        oas_annual_at_start=p1_data['oas_annual_at_start'],
        oas_start_age=p1_data['oas_start_age']
    )

    p2_data = data['p2']
    p2 = Person(
        name=p2_data['name'],
        start_age=p2_data['start_age'],
        tfsa_balance=p2_data['tfsa_balance'],
        rrif_balance=p2_data['rrif_balance'],
        rrsp_balance=p2_data['rrsp_balance'],
        nonreg_balance=p2_data['nonreg_balance'],
        corporate_balance=p2_data['corporate_balance'],
        cpp_annual_at_start=p2_data['cpp_annual_at_start'],
        cpp_start_age=p2_data['cpp_start_age'],
        oas_annual_at_start=p2_data['oas_annual_at_start'],
        oas_start_age=p2_data['oas_start_age']
    )

    # Create household
    hh_data = data['household']
    household = Household(
        p1=p1,
        p2=p2,
        province=hh_data['province'],
        start_year=hh_data['start_year'],
        end_age=hh_data['end_age'],
        spending_go_go=hh_data['spending_go_go'],
        spending_slow_go=hh_data['spending_slow_go'],
        spending_no_go=hh_data['spending_no_go'],
        go_go_end_age=hh_data['go_go_end_age'],
        slow_go_end_age=hh_data['slow_go_end_age'],
        general_inflation=hh_data['general_inflation'],
        spending_inflation=hh_data['spending_inflation']
    )
    household.strategy = hh_data['strategy']

    print(f'\nScenario: {p1.name} (age {p1.start_age}) & {p2.name} (age {p2.start_age})')
    print(f'Strategy: {household.strategy}')
    print(f'Province: {household.province}')
    print(f'RRIF balances: ${p1.rrif_balance:,.0f} + ${p2.rrif_balance:,.0f} = ${p1.rrif_balance + p2.rrif_balance:,.0f}')
    print(f'CPP+OAS: ${p1.cpp_annual_at_start + p1.oas_annual_at_start:,.0f} + ${p2.cpp_annual_at_start + p2.oas_annual_at_start:,.0f}')

    print(f'\nRunning simulation with insights generation...')

    # Run simulation
    results = simulate(household, tax_config)

    print(f'✓ Simulation completed: {len(results)} years')

    # Check if insights were generated
    if 'strategy_insights' in results.attrs:
        print(f'✓ Insights generated successfully')

        insights = results.attrs['strategy_insights']
        gis_feasibility = results.attrs['gis_feasibility']

        print(f'\n')
        print("="*80)
        print("GIS FEASIBILITY ANALYSIS")
        print("="*80)
        print(f"Status: {gis_feasibility['status']}")
        print(f"Eligible years: {gis_feasibility['eligible_years']}")
        print(f"Projected GIS: ${gis_feasibility['total_projected_gis']:,.0f}")
        print(f"Current RRIF: ${gis_feasibility['combined_rrif']:,.0f}")
        print(f"Max RRIF for GIS at 71: ${gis_feasibility['max_rrif_for_gis_at_71']:,.0f}")

        print(f'\n')
        print("="*80)
        print("AI-POWERED INSIGHTS")
        print("="*80)
        print(format_insights_for_display(insights))

        print(f'\n')
        print("="*80)
        print("✓ TEST PASSED: Insights generation working correctly")
        print("="*80)

        return True
    else:
        print(f'❌ TEST FAILED: Insights not generated')
        return False


if __name__ == "__main__":
    import sys
    success = test_insights_generation()
    sys.exit(0 if success else 1)
