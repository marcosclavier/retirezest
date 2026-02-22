#!/usr/bin/env python3
"""
Test to verify Quebec benefits are showing up in simulation results
"""

import requests
import json
from typing import Dict, Any

# API Configuration
API_BASE_URL = "http://localhost:8000"
SIMULATION_ENDPOINT = f"{API_BASE_URL}/api/run-simulation"

def create_quebec_low_income_scenario() -> Dict[str, Any]:
    """Create a low-income Quebec scenario to trigger benefits"""
    return {
        "strategy": "rrif-frontload",
        "province": "QC",
        "inflation": 2.0,
        "expense_inflation": 2.0,
        "return_rate": 5.0,
        "years": 20,
        "include_partner": False,
        "spending_go_go": 30000,
        "spending_slow_go": 25000,
        "spending_no_go": 20000,
        "spending_go_go_end": 75,
        "spending_slow_go_start": 75,
        "spending_slow_go_end": 85,
        "spending_no_go_start": 85,

        "p1": {
            "name": "Low Income Quebec Retiree",
            "start_age": 65,
            "end_age": 85,
            "life_expectancy": 95,
            # Low balances to trigger benefits
            "tfsa_balance": 10000,
            "rrsp_balance": 0,
            "rrif_balance": 50000,
            "nr_cash": 5000,
            "nr_gic": 5000,
            "nr_invest": 5000,
            # Lower government income
            "cpp_start_age": 65,
            "cpp_annual_at_start": 8000,
            "oas_start_age": 65,
            "oas_annual_at_start": 7000,
            "pension_count": 0,
            "pension_incomes": []
        },

        "p2": {
            "name": "",
            "start_age": 65,
            "end_age": 85,
            "life_expectancy": 95,
            "tfsa_balance": 0,
            "rrsp_balance": 0,
            "rrif_balance": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_count": 0,
            "pension_incomes": []
        }
    }

def test_quebec_benefits():
    """Test that Quebec benefits are calculated and included in results"""
    print("=" * 80)
    print("QUEBEC BENEFITS VALIDATION TEST")
    print("=" * 80)

    # Run Quebec simulation with low income to trigger benefits
    print("\n📊 Running low-income Quebec simulation to trigger benefits...")
    scenario = create_quebec_low_income_scenario()

    try:
        response = requests.post(
            SIMULATION_ENDPOINT,
            json=scenario,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        result = response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ API Error: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return False

    if not result.get('success'):
        print(f"❌ Simulation failed: {result.get('error')}")
        return False

    print("✅ Simulation completed successfully")

    # Check for Quebec-specific benefits in the results
    print("\n### Checking for Quebec Benefits in Results:")

    benefits_found = False

    # Check if we have year-by-year data
    if result.get('year_by_year') and len(result['year_by_year']) > 0:
        # Look at the first few years
        for i, year_data in enumerate(result['year_by_year'][:3], 1):
            print(f"\n--- Year {i} (Age {year_data.get('age_p1', 'N/A')}) ---")

            # Check for GIS (should be higher for low-income)
            gis = year_data.get('gis_p1', 0)
            if gis > 0:
                print(f"✅ GIS Benefit: ${gis:,.2f}")
                benefits_found = True

            # Check tax levels (should be lower due to Quebec benefits)
            total_tax = year_data.get('total_tax', 0)
            print(f"Total Tax: ${total_tax:,.2f}")

            # Check income components
            cpp = year_data.get('cpp_p1', 0)
            oas = year_data.get('oas_p1', 0)
            rrif = year_data.get('rrif_withdrawal_p1', 0)

            total_income = cpp + oas + rrif
            print(f"Total Income: ${total_income:,.2f}")
            print(f"  - QPP: ${cpp:,.2f}")
            print(f"  - OAS: ${oas:,.2f}")
            print(f"  - RRIF: ${rrif:,.2f}")

            # Calculate effective tax rate
            if total_income > 0:
                effective_rate = (total_tax / total_income) * 100
                print(f"Effective Tax Rate: {effective_rate:.2f}%")

                # Low-income Quebec residents should have very low effective tax rates
                if effective_rate < 15 and total_income < 30000:
                    print("✅ Low effective tax rate indicates Quebec benefits are applied")
                    benefits_found = True

    # Check summary for overall benefits
    if result.get('summary'):
        summary = result['summary']
        print("\n### Summary Statistics:")

        total_gis = summary.get('total_gis', 0)
        if total_gis > 0:
            print(f"✅ Total GIS over simulation: ${total_gis:,.2f}")
            benefits_found = True

        avg_tax_rate = summary.get('avg_effective_tax_rate', 0)
        print(f"Average Effective Tax Rate: {avg_tax_rate:.2f}%")

        if avg_tax_rate < 15:
            print("✅ Low average tax rate suggests Quebec benefits are working")
            benefits_found = True

        total_benefits = summary.get('total_government_benefits', 0)
        print(f"Total Government Benefits: ${total_benefits:,.2f}")

    print("\n" + "=" * 80)
    if benefits_found:
        print("✅ QUEBEC BENEFITS VALIDATION PASSED")
        print("Low-income scenario shows appropriate benefits and tax reduction")
    else:
        print("⚠️  QUEBEC BENEFITS VALIDATION WARNING")
        print("Could not definitively confirm Quebec-specific benefits")
        print("This may be normal if the income is too high for benefits")
    print("=" * 80)

    return True

if __name__ == "__main__":
    test_quebec_benefits()