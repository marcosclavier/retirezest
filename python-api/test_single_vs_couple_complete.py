#!/usr/bin/env python3
"""
Complete test for single vs couple retirement simulations.
"""

import json
import requests

API_URL = "http://localhost:8000/api/run-simulation"

def test_single():
    """Test single person simulation"""
    payload = {
        "p1": {
            "name": "John",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000,
            "tfsa_balance": 50000,
            "rrif_balance": 100000,
            "rrsp_balance": 0,
            "nonreg_balance": 25000,
            "corporate_balance": 0,
            "nonreg_acb": 20000,
        },
        "p2": {
            "name": "",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "tfsa_balance": 0,
            "rrif_balance": 0,
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "nonreg_acb": 0,
        },
        "province": "AB",
        "start_year": 2025,
        "include_partner": False,  # SINGLE PERSON
        "end_age": 95,
        "strategy": "minimize-income",
        "spending_go_go": 40000,
        "spending_slow_go": 35000,
        "spending_no_go": 30000,
    }

    response = requests.post(API_URL, json=payload)
    return response.json()

def test_couple():
    """Test couple simulation"""
    payload = {
        "p1": {
            "name": "John",
            "start_age": 65,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000,
            "tfsa_balance": 50000,
            "rrif_balance": 100000,
            "rrsp_balance": 0,
            "nonreg_balance": 25000,
            "corporate_balance": 0,
            "nonreg_acb": 20000,
        },
        "p2": {
            "name": "Jane",
            "start_age": 63,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 10000,
            "oas_start_age": 65,
            "oas_annual_at_start": 8000,
            "tfsa_balance": 50000,
            "rrif_balance": 100000,
            "rrsp_balance": 0,
            "nonreg_balance": 25000,
            "corporate_balance": 0,
            "nonreg_acb": 20000,
        },
        "province": "AB",
        "start_year": 2025,
        "include_partner": True,  # COUPLE
        "end_age": 95,
        "strategy": "minimize-income",
        "spending_go_go": 60000,
        "spending_slow_go": 50000,
        "spending_no_go": 40000,
    }

    response = requests.post(API_URL, json=payload)
    return response.json()

print("🧪 FINAL SINGLE VS COUPLE TEST")
print("=" * 60)

print("\n📊 SINGLE PERSON SIMULATION")
print("-" * 40)
single_result = test_single()
if single_result.get('success'):
    print("✅ Single person simulation: SUCCESS")
    summary = single_result.get('summary', {})
    print(f"  • Health Score: {summary.get('health_score')}")
    print(f"  • Success Rate: {summary.get('success_rate')}%")
    print(f"  • Years Funded: {summary.get('years_funded')}/{summary.get('years_simulated')}")
    print(f"  • Final Estate: ${summary.get('final_estate_after_tax', 0):,.0f}")
    print(f"  • Total GIS: ${summary.get('total_gis', 0):,.0f}")
else:
    print("❌ Single person simulation: FAILED")
    print(f"  • Error: {single_result.get('error')}")

print("\n📊 COUPLE SIMULATION")
print("-" * 40)
couple_result = test_couple()
if couple_result.get('success'):
    print("✅ Couple simulation: SUCCESS")
    summary = couple_result.get('summary', {})
    print(f"  • Health Score: {summary.get('health_score')}")
    print(f"  • Success Rate: {summary.get('success_rate')}%")
    print(f"  • Years Funded: {summary.get('years_funded')}/{summary.get('years_simulated')}")
    print(f"  • Final Estate: ${summary.get('final_estate_after_tax', 0):,.0f}")
    print(f"  • Total GIS: ${summary.get('total_gis', 0):,.0f}")
else:
    print("❌ Couple simulation: FAILED")
    print(f"  • Error: {couple_result.get('error')}")

print("\n" + "=" * 60)
print("✨ TEST COMPLETE")

# Show key differences
if single_result.get('success') and couple_result.get('success'):
    print("\n🔍 KEY DIFFERENCES:")
    print("-" * 40)

    single_gis = single_result['summary'].get('total_gis', 0)
    couple_gis = couple_result['summary'].get('total_gis', 0)

    print(f"GIS Benefits:")
    print(f"  • Single: ${single_gis:,.0f}")
    print(f"  • Couple: ${couple_gis:,.0f}")
    print(f"  • Difference: ${abs(single_gis - couple_gis):,.0f}")

    single_estate = single_result['summary'].get('final_estate_after_tax', 0)
    couple_estate = couple_result['summary'].get('final_estate_after_tax', 0)

    print(f"\nFinal Estate:")
    print(f"  • Single: ${single_estate:,.0f}")
    print(f"  • Couple: ${couple_estate:,.0f}")
    print(f"  • Difference: ${abs(single_estate - couple_estate):,.0f}")