#!/usr/bin/env python3
"""
Debug Rafael's Quebec scenario showing 3810/100
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"
SIMULATION_ENDPOINT = f"{API_BASE_URL}/api/run-simulation"

def create_rafael_quebec_scenario():
    """Create Rafael's scenario for Quebec"""
    return {
        "strategy": "rrif-frontload",
        "province": "QC",
        "inflation": 2.0,
        "expense_inflation": 2.0,
        "return_rate": 5.0,
        "years": 20,  # Age 65 to 85
        "include_partner": False,

        "spending_go_go": 80000,
        "spending_slow_go": 70000,
        "spending_no_go": 60000,
        "spending_go_go_end": 75,
        "spending_slow_go_start": 75,
        "spending_slow_go_end": 85,
        "spending_no_go_start": 85,

        "p1": {
            "name": "Rafael",
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

def main():
    print("="*80)
    print("DEBUGGING RAFAEL'S QUEBEC SCENARIO")
    print("="*80)

    scenario = create_rafael_quebec_scenario()

    print("\n📊 Scenario Configuration:")
    print(f"Province: Quebec (QC)")
    print(f"Assets: TFSA $50k, RRIF $350k, Non-Reg $150k = $550k total")
    print(f"Income: QPP $15k, OAS $8k, Pension $30k = $53k/year")
    print(f"Spending: Go-Go $80k, Slow-Go $70k, No-Go $60k")

    response = requests.post(SIMULATION_ENDPOINT, json=scenario)
    result = response.json()

    if result.get('success'):
        summary = result.get('summary', {})

        print("\n📈 API Response - Summary:")
        print(f"Success: {result['success']}")
        print(f"Years Simulated: {summary.get('years_simulated', 'N/A')}")
        print(f"Years Funded: {summary.get('years_funded', 'N/A')}")
        print(f"Success Rate: {summary.get('success_rate', 'N/A')}%")

        # Check health score
        health_score = summary.get('health_score', 'N/A')
        health_rating = summary.get('health_rating', 'N/A')

        print(f"\n🏥 Health Metrics:")
        print(f"Health Score: {health_score}")
        print(f"Health Rating: {health_rating}")

        # Check if health score is being mistakenly used as success rate
        if health_score and isinstance(health_score, (int, float)):
            print(f"\n⚠️ Potential Issue:")
            if health_score > 100:
                print(f"Health score ({health_score}) is greater than 100!")
                print("This might be displayed incorrectly as success rate")

        # Check raw success rate value
        print(f"\n🔍 Raw Values:")
        print(f"success_rate type: {type(summary.get('success_rate'))}")
        print(f"success_rate value: {summary.get('success_rate')}")
        print(f"health_score type: {type(health_score)}")
        print(f"health_score value: {health_score}")

        # Check for any unusual fields
        print(f"\n📋 All Summary Fields:")
        for key, value in summary.items():
            if 'score' in key.lower() or 'rate' in key.lower():
                print(f"  {key}: {value}")

    else:
        print(f"\n❌ Simulation failed:")
        print(f"Error: {result.get('error', 'Unknown')}")
        print(f"Message: {result.get('message', 'N/A')}")

if __name__ == "__main__":
    main()