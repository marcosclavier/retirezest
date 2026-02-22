#!/usr/bin/env python3
"""
Debug script to investigate couple scenario partner data issue
"""

import requests
import json
from typing import Dict, Any

# API Configuration
API_BASE_URL = "http://localhost:8000"
SIMULATION_ENDPOINT = f"{API_BASE_URL}/api/run-simulation"

def create_couple_scenario(province: str = "ON") -> Dict[str, Any]:
    """Create a couple scenario"""
    return {
        "strategy": "rrif-frontload",
        "province": province,
        "inflation": 2.0,
        "expense_inflation": 2.0,
        "return_rate": 5.0,
        "years": 20,
        "include_partner": True,  # This should include partner

        "spending_go_go": 80000,
        "spending_slow_go": 70000,
        "spending_no_go": 60000,
        "spending_go_go_end": 75,
        "spending_slow_go_start": 75,
        "spending_slow_go_end": 85,
        "spending_no_go_start": 85,

        "p1": {
            "name": "Primary Person",
            "start_age": 65,
            "end_age": 85,
            "life_expectancy": 95,
            "tfsa_balance": 50000,
            "rrsp_balance": 0,
            "rrif_balance": 350000,
            "nr_cash": 50000,
            "nr_gic": 50000,
            "nr_invest": 50000,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 12000,
            "oas_start_age": 65,
            "oas_annual_at_start": 7500,
            "pension_count": 0,
            "pension_incomes": []
        },

        "p2": {
            "name": "Partner",
            "start_age": 63,
            "end_age": 85,
            "life_expectancy": 95,
            "tfsa_balance": 40000,
            "rrsp_balance": 0,
            "rrif_balance": 280000,
            "nr_cash": 40000,
            "nr_gic": 40000,
            "nr_invest": 40000,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000,
            "oas_start_age": 65,
            "oas_annual_at_start": 7500,
            "pension_count": 0,
            "pension_incomes": []
        }
    }

def analyze_couple_scenario():
    """Analyze couple scenario to debug partner data"""
    print("="*80)
    print("COUPLE SCENARIO DEBUG")
    print("="*80)

    scenario = create_couple_scenario("ON")

    print("\n📊 Scenario Configuration:")
    print(f"Include Partner: {scenario['include_partner']}")
    print(f"P1 Name: {scenario['p1']['name']}")
    print(f"P2 Name: {scenario['p2']['name']}")
    print(f"P1 Assets: TFSA ${scenario['p1']['tfsa_balance']:,}, RRIF ${scenario['p1']['rrif_balance']:,}")
    print(f"P2 Assets: TFSA ${scenario['p2']['tfsa_balance']:,}, RRIF ${scenario['p2']['rrif_balance']:,}")
    print(f"P1 CPP: ${scenario['p1']['cpp_annual_at_start']:,}")
    print(f"P2 CPP: ${scenario['p2']['cpp_annual_at_start']:,}")

    # Run simulation
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
        return

    if not result.get('success'):
        print(f"❌ Simulation failed: {result.get('error')}")
        return

    print("\n✅ Simulation successful")

    # Check summary
    summary = result.get('summary', {})
    print(f"\n📈 Summary:")
    print(f"Success Rate: {summary.get('success_rate', 0):.2f}%")
    print(f"Years Funded: {summary.get('years_funded', 0)}/{summary.get('years_simulated', 0)}")

    # Check year-by-year data for partner info
    if result.get('year_by_year') and len(result['year_by_year']) > 0:
        print("\n📊 Year-by-Year Analysis:")

        # Look at first 3 years
        for i in range(min(3, len(result['year_by_year']))):
            year_data = result['year_by_year'][i]
            year = year_data.get('year', 0)
            age_p1 = year_data.get('age_p1', 0)
            age_p2 = year_data.get('age_p2', 0)

            print(f"\n--- Year {year} ---")
            print(f"Age P1: {age_p1}, Age P2: {age_p2}")

            # Check for P1 data
            cpp_p1 = year_data.get('cpp_p1', 0)
            oas_p1 = year_data.get('oas_p1', 0)
            rrif_p1 = year_data.get('rrif_withdrawal_p1', 0)
            tfsa_p1 = year_data.get('tfsa_withdrawal_p1', 0)
            tax_p1 = year_data.get('total_tax_p1', 0)

            print(f"P1 Income: CPP ${cpp_p1:,.2f}, OAS ${oas_p1:,.2f}")
            print(f"P1 Withdrawals: RRIF ${rrif_p1:,.2f}, TFSA ${tfsa_p1:,.2f}")
            print(f"P1 Tax: ${tax_p1:,.2f}")

            # Check for P2 data
            cpp_p2 = year_data.get('cpp_p2', 0)
            oas_p2 = year_data.get('oas_p2', 0)
            rrif_p2 = year_data.get('rrif_withdrawal_p2', 0)
            tfsa_p2 = year_data.get('tfsa_withdrawal_p2', 0)
            tax_p2 = year_data.get('total_tax_p2', 0)

            print(f"P2 Income: CPP ${cpp_p2:,.2f}, OAS ${oas_p2:,.2f}")
            print(f"P2 Withdrawals: RRIF ${rrif_p2:,.2f}, TFSA ${tfsa_p2:,.2f}")
            print(f"P2 Tax: ${tax_p2:,.2f}")

            # Check if partner data exists
            has_p2_data = (cpp_p2 > 0 or oas_p2 > 0 or rrif_p2 > 0 or tfsa_p2 > 0)
            print(f"Has P2 Data: {'✅ Yes' if has_p2_data else '❌ No'}")

        # Check all year_by_year keys
        print(f"\n📋 Available fields in year_by_year:")
        if result['year_by_year']:
            keys = list(result['year_by_year'][0].keys())
            p2_keys = [k for k in keys if '_p2' in k]
            print(f"P2 fields found: {p2_keys if p2_keys else 'None'}")

    # Debug: print raw first year data
    print("\n🔍 Raw first year data (selected fields):")
    if result.get('year_by_year') and len(result['year_by_year']) > 0:
        first_year = result['year_by_year'][0]
        for key in sorted(first_year.keys()):
            if '_p2' in key or key in ['year', 'age_p1', 'age_p2', 'spending_need']:
                print(f"  {key}: {first_year[key]}")

if __name__ == "__main__":
    analyze_couple_scenario()