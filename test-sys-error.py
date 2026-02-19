#!/usr/bin/env python3
"""
Test to reproduce the sys UnboundLocalError
"""

import requests
import json

# Test data for simulation
test_data = {
    "p1": {
        "name": "Test",
        "start_age": 65,
        "tfsa_balance": 100000,
        "rrif_balance": 200000,
        "rrsp_balance": 0,
        "nonreg_balance": 50000,
        "corporate_balance": 0,
        "nonreg_acb": 40000,
        "home_value": 500000,
        "home_mortgage": 0,
        "cpp_start_age": 65,
        "cpp_amount": 15000,
        "oas_start_age": 65,
        "real_estate": [],
        "pension_incomes": [],
        "other_incomes": [],
        "corporate_details": {
            "cash_percentage": 0.1,
            "gic_percentage": 0.2,
            "investment_percentage": 0.7,
            "yield_interest": 0.02,
            "yield_eligible_dividends": 0.02,
            "yield_non_eligible_dividends": 0.01,
            "yield_capital_gains": 0.03,
            "rdtoh_balance": 0.0
        },
        "nonreg_details": {
            "interest_yield": 0.02,
            "eligible_dividend_yield": 0.015,
            "foreign_dividend_yield": 0.01,
            "other_income_yield": 0.005
        },
        "rrif_min_withdrawal_percentage": {
            "71": 5.28,
            "72": 5.40,
            "73": 5.53,
            "74": 5.67,
            "75": 5.82,
            "76": 5.98,
            "77": 6.17,
            "78": 6.36,
            "79": 6.58,
            "80": 6.82,
            "81": 7.08,
            "82": 7.38,
            "83": 7.71,
            "84": 8.08,
            "85": 8.51,
            "86": 8.99,
            "87": 9.55,
            "88": 10.21,
            "89": 10.99,
            "90": 11.92,
            "91": 13.06,
            "92": 14.49,
            "93": 16.34,
            "94": 18.79,
            "95": 20.00
        }
    },
    "p2": {
        "name": "",
        "start_age": 0,
        "tfsa_balance": 0,
        "rrif_balance": 0,
        "rrsp_balance": 0,
        "nonreg_balance": 0,
        "corporate_balance": 0,
        "nonreg_acb": 0,
        "home_value": 0,
        "home_mortgage": 0,
        "cpp_start_age": 0,
        "cpp_amount": 0,
        "oas_start_age": 0,
        "real_estate": [],
        "pension_incomes": [],
        "other_incomes": [],
        "corporate_details": {
            "cash_percentage": 0.1,
            "gic_percentage": 0.2,
            "investment_percentage": 0.7,
            "yield_interest": 0.02,
            "yield_eligible_dividends": 0.02,
            "yield_non_eligible_dividends": 0.01,
            "yield_capital_gains": 0.03,
            "rdtoh_balance": 0.0
        },
        "nonreg_details": {
            "interest_yield": 0.02,
            "eligible_dividend_yield": 0.015,
            "foreign_dividend_yield": 0.01,
            "other_income_yield": 0.005
        },
        "rrif_min_withdrawal_percentage": {}
    },
    "province": "ON",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "Balanced",
    "spending_go_go": 80000,
    "spending_slow_go": 70000,
    "spending_no_go": 60000,
    "go_go_end_age": 75,
    "slow_go_end_age": 85,
    "spending_inflation": 0.02,
    "asset_inflation": 0.05,
    "inflation": 0.02,
    "hybrid_rrif_topup_per_person": False,
    "spending_safety_buffer_percentage": 0.05
}

def test_local_api():
    """Test the local API"""
    url = "http://localhost:8000/api/run-simulation"

    print("Testing local API...")
    try:
        response = requests.post(url, json=test_data)
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Simulation successful!")
            else:
                print(f"❌ Simulation failed: {result.get('error')}")
                print(f"   Details: {result.get('error_details')}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to local API. Make sure it's running on port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_production_api():
    """Test the production API"""
    url = "https://www.retirezest.com/api/run-simulation"

    print("\nTesting production API...")
    try:
        response = requests.post(url, json=test_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Simulation successful!")
            else:
                print(f"❌ Simulation failed: {result.get('error')}")
                print(f"   Details: {result.get('error_details')}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Test local first
    test_local_api()

    # Then test production
    test_production_api()