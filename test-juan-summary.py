#!/usr/bin/env python3
"""
Test RRIF-frontload strategy - check summary data
"""
import requests
import json

# High-value assets couple scenario
payload = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "end_age": 95,
        "cpp_start_age": 65,
        "cpp_amount": 15000,
        "oas_start_age": 70,  # Deferred OAS
        "oas_amount": 8904,
        "tfsa_balance": 250000,
        "rrif_balance": 1500000,
        "rrsp_balance": 0,
        "nonreg_balance": 800000,
        "nonreg_acb": 600000,
        "corporate_balance": 500000,
        "pension_incomes": [{
            "name": "DB Pension",
            "amount": 80000,
            "start_age": 65,
            "indexed_to_inflation": True
        }],
        "other_incomes": []
    },
    "p2": {
        "name": "Daniela",
        "start_age": 62,
        "end_age": 95,
        "cpp_start_age": 65,
        "cpp_amount": 10000,
        "oas_start_age": 67,
        "oas_amount": 8904,
        "tfsa_balance": 200000,
        "rrif_balance": 800000,
        "rrsp_balance": 0,
        "nonreg_balance": 400000,
        "nonreg_acb": 350000,
        "corporate_balance": 300000,
        "pension_incomes": [],
        "other_incomes": [{
            "name": "Rental Income",
            "amount": 36000,
            "start_age": 62,
            "end_age": 75,
            "indexed_to_inflation": False
        }]
    },
    "hh": {
        "province": "ON",
        "start_year": 2025,
        "spending_target": 180000,
        "strategy": "rrif-frontload",
        "inflation_general": 2.0,
        "return_rrif": 5.0,
        "return_nonreg": 5.0,
        "return_tfsa": 4.0,
        "return_corporate": 5.0,
        "nonreg_interest_pct": 20.0,
        "nonreg_elig_div_pct": 30.0,
        "nonreg_capg_dist_pct": 50.0,
        "reinvest_nonreg_dist": False
    }
}

print("=" * 80)
print("RRIF-FRONTLOAD TEST - Juan and Daniela")
print("=" * 80)

try:
    response = requests.post("http://localhost:8000/api/run-simulation", json=payload, timeout=120)

    if response.status_code != 200:
        print(f"❌ ERROR: {response.status_code}")
    else:
        data = response.json()

        # Check success
        print(f"\n✅ Success: {data.get('success', False)}")
        print(f"Message: {data.get('message', '')}")

        # Check summary data
        if 'summary' in data:
            summary = data['summary']
            print(f"\n📊 SUMMARY:")
            print(f"  Years funded: {summary.get('years_funded', 'N/A')}")
            print(f"  Success rate: {summary.get('success_rate', 'N/A')}%")
            print(f"  Total tax: ${summary.get('total_tax_paid', 0):,.0f}")
            print(f"  Final estate: ${summary.get('final_estate_value', 0):,.0f}")

        # Check five-year plan for RRIF withdrawals
        if 'five_year_plan' in data:
            print(f"\n📅 FIVE-YEAR RRIF WITHDRAWALS:")
            for year_data in data['five_year_plan'][:3]:
                year = year_data.get('year', 'N/A')

                # Try different possible field names
                rrif_p1 = year_data.get('rrif_withdrawal_p1',
                         year_data.get('rrif_p1',
                         year_data.get('withdrawals_rrif_p1', 0)))
                rrif_p2 = year_data.get('rrif_withdrawal_p2',
                         year_data.get('rrif_p2',
                         year_data.get('withdrawals_rrif_p2', 0)))

                print(f"  Year {year}:")
                print(f"    Juan RRIF: ${rrif_p1:,.0f}")
                print(f"    Daniela RRIF: ${rrif_p2:,.0f}")
                print(f"    Total RRIF: ${(rrif_p1 + rrif_p2):,.0f}")

        # Check optimization result
        if 'optimization_result' in data:
            opt = data['optimization_result']
            print(f"\n🔄 OPTIMIZATION:")
            print(f"  Original strategy: {opt.get('original_strategy', 'N/A')}")
            print(f"  Best strategy: {opt.get('recommended_strategy', opt.get('best_strategy', 'N/A'))}")
            if opt.get('changed', False):
                print(f"  Strategy was changed!")

except Exception as e:
    print(f"❌ ERROR: {str(e)}")

print("\n" + "=" * 80)