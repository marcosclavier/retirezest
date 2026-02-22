#!/usr/bin/env python3
"""
Debug script to investigate low success rates in simulations
"""

import requests
import json
from typing import Dict, Any

# API Configuration
API_BASE_URL = "http://localhost:8000"
SIMULATION_ENDPOINT = f"{API_BASE_URL}/api/run-simulation"

def create_rafael_scenario(spending_level: str = "high") -> Dict[str, Any]:
    """Create Rafael's scenario with different spending levels"""

    if spending_level == "high":
        spending_go = 80000
        spending_slow = 70000
        spending_no = 60000
    elif spending_level == "moderate":
        spending_go = 60000
        spending_slow = 50000
        spending_no = 40000
    else:  # low
        spending_go = 40000
        spending_slow = 35000
        spending_no = 30000

    return {
        "strategy": "rrif-frontload",
        "province": "ON",  # Test with Ontario first
        "inflation": 2.0,
        "expense_inflation": 2.0,
        "return_rate": 5.0,
        "years": 20,
        "include_partner": False,

        # Spending phases
        "spending_go_go": spending_go,
        "spending_slow_go": spending_slow,
        "spending_no_go": spending_no,
        "spending_go_go_end": 75,
        "spending_slow_go_start": 75,
        "spending_slow_go_end": 85,
        "spending_no_go_start": 85,

        # Person 1 (Rafael - age 60, retiring at 65)
        "p1": {
            "name": "Rafael",
            "start_age": 65,  # Retirement age
            "end_age": 85,
            "life_expectancy": 95,

            # Assets (total ~$600k)
            "tfsa_balance": 50000,
            "rrsp_balance": 0,
            "rrif_balance": 350000,
            "nr_cash": 50000,
            "nr_gic": 50000,
            "nr_invest": 50000,

            # Income
            "cpp_start_age": 65,
            "cpp_annual_at_start": 15000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000,
            "pension_count": 1,
            "pension_incomes": [{
                "name": "Employer Pension",
                "amount": 30000,
                "startAge": 65,
                "inflationIndexed": True
            }]
        },

        # Person 2 (empty for single person)
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

def analyze_scenario(scenario: Dict[str, Any], scenario_name: str) -> None:
    """Run and analyze a scenario"""
    print(f"\n{'='*80}")
    print(f"Testing: {scenario_name}")
    print(f"{'='*80}")

    # Calculate total assets
    p1 = scenario['p1']
    total_assets = (p1['tfsa_balance'] + p1['rrif_balance'] +
                   p1['nr_cash'] + p1['nr_gic'] + p1['nr_invest'])

    # Calculate total annual income
    annual_income = (p1['cpp_annual_at_start'] +
                    p1['oas_annual_at_start'] +
                    p1['pension_incomes'][0]['amount'] if p1['pension_incomes'] else 0)

    print(f"\n📊 Scenario Parameters:")
    print(f"Total Assets: ${total_assets:,.0f}")
    print(f"Annual Income (CPP+OAS+Pension): ${annual_income:,.0f}")
    print(f"Spending (Go-Go/Slow-Go/No-Go): ${scenario['spending_go_go']:,.0f}/${scenario['spending_slow_go']:,.0f}/${scenario['spending_no_go']:,.0f}")
    print(f"Return Rate: {scenario['return_rate']}%")
    print(f"Inflation: {scenario['inflation']}%")

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

    # Analyze results
    summary = result.get('summary', {})
    success_rate = summary.get('success_rate', 0)
    years_funded = summary.get('years_funded', 0)
    years_simulated = summary.get('years_simulated', 0)

    print(f"\n📈 Results:")
    print(f"Success Rate: {success_rate:.2f}%")
    print(f"Years Funded: {years_funded} / {years_simulated}")
    print(f"Total Tax Paid: ${summary.get('total_tax_paid', 0):,.2f}")
    print(f"Final Estate: ${summary.get('final_estate_after_tax', 0):,.2f}")

    # Analyze year-by-year for failure point
    if result.get('year_by_year') and success_rate < 100:
        print(f"\n⚠️ Analyzing Failure Point:")

        failure_year = None
        last_balance = None

        for year_data in result['year_by_year']:
            year = year_data.get('year', 0)
            age = year_data.get('age_p1', 0)
            total_value = year_data.get('total_value', 0)
            spending_need = year_data.get('spending_need', 0)
            spending_met = year_data.get('spending_met', 0)
            success = year_data.get('plan_success', False)

            if not success and failure_year is None:
                failure_year = year
                print(f"\n💔 First Failure at Year {year} (Age {age}):")
                print(f"   Portfolio Value: ${total_value:,.2f}")
                print(f"   Spending Need: ${spending_need:,.2f}")
                print(f"   Spending Met: ${spending_met:,.2f}")
                print(f"   Shortfall: ${spending_need - spending_met:,.2f}")

                # Show previous year for context
                if year > 1 and last_balance:
                    print(f"\n   Previous Year (Age {age-1}):")
                    print(f"   Portfolio Value: ${last_balance:,.2f}")
                break

            last_balance = total_value

        # Calculate required assets for success
        if failure_year:
            years_to_failure = failure_year - 1
            total_spending = sum([
                scenario['spending_go_go'] * min(years_to_failure, 10),
                scenario['spending_slow_go'] * max(0, min(years_to_failure - 10, 10)),
                scenario['spending_no_go'] * max(0, years_to_failure - 20)
            ])

            print(f"\n📊 Analysis:")
            print(f"   Years sustained: {years_to_failure}")
            print(f"   Estimated additional assets needed: ${(total_spending - total_assets):,.2f}")

def main():
    print("=" * 80)
    print("SUCCESS RATE DEBUG ANALYSIS")
    print("=" * 80)

    # Test with different spending levels
    spending_levels = [
        ("High Spending ($80k/$70k/$60k)", "high"),
        ("Moderate Spending ($60k/$50k/$40k)", "moderate"),
        ("Low Spending ($40k/$35k/$30k)", "low")
    ]

    for name, level in spending_levels:
        scenario = create_rafael_scenario(level)
        analyze_scenario(scenario, name)

    # Test with different return rates
    print("\n" + "="*80)
    print("TESTING DIFFERENT RETURN RATES (with moderate spending)")
    print("="*80)

    for return_rate in [3.0, 5.0, 7.0]:
        scenario = create_rafael_scenario("moderate")
        scenario['return_rate'] = return_rate
        analyze_scenario(scenario, f"Return Rate {return_rate}%")

    # Test Quebec vs Ontario
    print("\n" + "="*80)
    print("TESTING QUEBEC VS ONTARIO (moderate spending)")
    print("="*80)

    for province in ["ON", "QC"]:
        scenario = create_rafael_scenario("moderate")
        scenario['province'] = province
        analyze_scenario(scenario, f"Province: {province}")

if __name__ == "__main__":
    main()