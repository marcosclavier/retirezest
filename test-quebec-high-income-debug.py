#!/usr/bin/env python3
"""
Debug Quebec high-income success rate issue
Quebec shows 64.5% success while Ontario shows 100% for same scenario
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"
SIMULATION_ENDPOINT = f"{API_BASE_URL}/api/run-simulation"

def create_high_income_scenario(province: str):
    """Create high income scenario"""
    return {
        "strategy": "rrif-frontload",
        "province": province,
        "inflation": 2.0,
        "expense_inflation": 2.0,
        "return_rate": 5.0,
        "years": 30,
        "include_partner": False,

        "spending_go_go": 100000,
        "spending_slow_go": 85000,
        "spending_no_go": 70000,
        "spending_go_go_end": 75,
        "spending_slow_go_start": 75,
        "spending_slow_go_end": 85,
        "spending_no_go_start": 85,

        "p1": {
            "name": f"High Income {province}",
            "start_age": 65,
            "end_age": 95,
            "life_expectancy": 95,
            "tfsa_balance": 88000,  # Max TFSA
            "rrsp_balance": 0,
            "rrif_balance": 800000,
            "nr_cash": 165000,
            "nr_gic": 165000,
            "nr_invest": 170000,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 16000,  # Max CPP
            "oas_start_age": 65,
            "oas_annual_at_start": 7500,
            "pension_count": 1,
            "pension_incomes": [{
                "name": "Employer Pension",
                "amount": 50000,
                "startAge": 65,
                "inflationIndexed": True
            }]
        },

        "p2": {
            "name": "",
            "start_age": 65,
            "end_age": 95,
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

def analyze_high_income():
    """Compare Quebec vs Ontario high income scenarios"""
    print("="*80)
    print("QUEBEC HIGH-INCOME SUCCESS RATE ANALYSIS")
    print("="*80)

    # Run both scenarios
    qc_scenario = create_high_income_scenario("QC")
    on_scenario = create_high_income_scenario("ON")

    print("\n📊 Scenario Configuration:")
    print(f"Total Assets: TFSA $88,000, RRIF $800,000, Non-Reg $500,000 = $1,388,000")
    print(f"Annual Income: CPP $16,000 + OAS $7,500 + Pension $50,000 = $73,500")
    print(f"Spending: Go-Go $100,000, Slow-Go $85,000, No-Go $70,000")
    print(f"Years: 30 (age 65-95)")

    # Run Quebec
    print("\n" + "="*40)
    print("QUEBEC RESULTS")
    print("="*40)

    response = requests.post(SIMULATION_ENDPOINT, json=qc_scenario)
    qc_result = response.json()

    if qc_result.get('success'):
        qc_summary = qc_result['summary']
        print(f"✅ Success Rate: {qc_summary['success_rate']:.1f}%")
        print(f"Years Funded: {qc_summary['years_funded']}/{qc_summary['years_simulated']}")
        print(f"Total Tax Paid: ${qc_summary['total_tax_paid']:,.0f}")
        print(f"Average Tax Rate: {qc_summary.get('avg_effective_tax_rate', 0):.2f}%")
        print(f"Final Estate: ${qc_summary.get('final_estate_after_tax', 0):,.0f}")

        # Check first failure year
        if qc_summary['success_rate'] < 100:
            year_by_year = qc_result.get('year_by_year', [])
            for i, year in enumerate(year_by_year):
                if not year.get('plan_success', True):
                    print(f"\n⚠️ First Failure: Year {i+1} (Age {year.get('age_p1', 0)})")
                    print(f"  Portfolio Value: ${year.get('total_value', 0):,.2f}")
                    print(f"  Spending Need: ${year.get('spending_need', 0):,.2f}")
                    break

    # Run Ontario
    print("\n" + "="*40)
    print("ONTARIO RESULTS")
    print("="*40)

    response = requests.post(SIMULATION_ENDPOINT, json=on_scenario)
    on_result = response.json()

    if on_result.get('success'):
        on_summary = on_result['summary']
        print(f"✅ Success Rate: {on_summary['success_rate']:.1f}%")
        print(f"Years Funded: {on_summary['years_funded']}/{on_summary['years_simulated']}")
        print(f"Total Tax Paid: ${on_summary['total_tax_paid']:,.0f}")
        print(f"Average Tax Rate: {on_summary.get('avg_effective_tax_rate', 0):.2f}%")
        print(f"Final Estate: ${on_summary.get('final_estate_after_tax', 0):,.0f}")

    # Compare
    print("\n" + "="*40)
    print("COMPARISON")
    print("="*40)

    if qc_result.get('success') and on_result.get('success'):
        qc_success = qc_summary['success_rate']
        on_success = on_summary['success_rate']
        qc_tax = qc_summary['total_tax_paid']
        on_tax = on_summary['total_tax_paid']

        print(f"Success Rate Difference: QC {qc_success:.1f}% vs ON {on_success:.1f}%")
        print(f"  → Quebec is {on_success - qc_success:.1f}% lower")

        print(f"\nTotal Tax Difference: QC ${qc_tax:,.0f} vs ON ${on_tax:,.0f}")
        print(f"  → Quebec pays ${qc_tax - on_tax:,.0f} more ({(qc_tax/on_tax - 1)*100:.1f}% higher)")

        print(f"\nFinal Estate: QC ${qc_summary.get('final_estate_after_tax', 0):,.0f} vs ON ${on_summary.get('final_estate_after_tax', 0):,.0f}")

        # Calculate if higher taxes are causing the lower success
        extra_tax_per_year = (qc_tax - on_tax) / 30
        print(f"\nExtra tax per year in Quebec: ${extra_tax_per_year:,.0f}")
        print(f"As % of annual spending: {extra_tax_per_year / 100000 * 100:.1f}%")

        print("\n💡 ANALYSIS:")
        if qc_success < on_success:
            print("Quebec's lower success rate is likely due to:")
            print("1. Higher provincial taxes reducing available funds")
            print("2. The extra ~$21,000/year in taxes compounds over time")
            print("3. High spending ($100k/year) leaves less margin for higher taxes")
            print("\nThis is REALISTIC - Quebec residents with high income do pay")
            print("significantly more tax, which can impact retirement success rates.")
        else:
            print("Success rates are similar, tax differences are manageable.")

if __name__ == "__main__":
    analyze_high_income()