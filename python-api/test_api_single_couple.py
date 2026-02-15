#!/usr/bin/env python3
"""
Test script for single vs couple retirement simulations via API
Tests the actual API endpoints that the frontend uses
"""

import json
import requests

API_URL = "http://localhost:8000/api/run-simulation"

def create_test_person(name: str, age: int = 65, with_assets: bool = True):
    """Create a test person data for API"""
    if not name:  # Empty person for single mode
        return {
            "name": "",
            "start_age": age,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_incomes": [],
            "other_incomes": [],
            "tfsa_balance": 0,
            "rrif_balance": 0,
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "nonreg_acb": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "y_nr_cash_interest": 2.0,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 6.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0.5,
            "y_nr_inv_capg": 3.0,
            "y_nr_inv_roc_pct": 0.5,
            "nr_cash_pct": 10.0,
            "nr_gic_pct": 20.0,
            "nr_invest_pct": 70.0,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.0,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 6.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 3.5,
            "corp_cash_pct": 5.0,
            "corp_gic_pct": 10.0,
            "corp_invest_pct": 85.0,
            "corp_dividend_type": "eligible",
            "tfsa_room_start": 0,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        }

    return {
        "name": name,
        "start_age": age,
        "cpp_start_age": 65,
        "cpp_annual_at_start": 10000 if with_assets else 8000,
        "oas_start_age": 65,
        "oas_annual_at_start": 8000 if with_assets else 7000,
        "pension_incomes": [],
        "other_incomes": [],
        "tfsa_balance": 50000 if with_assets else 30000,
        "rrif_balance": 100000 if with_assets else 50000,
        "rrsp_balance": 0,
        "nonreg_balance": 25000 if with_assets else 0,
        "corporate_balance": 0,
        "nonreg_acb": 20000 if with_assets else 0,
        "nr_cash": 2500 if with_assets else 0,
        "nr_gic": 5000 if with_assets else 0,
        "nr_invest": 17500 if with_assets else 0,
        "y_nr_cash_interest": 2.0,
        "y_nr_gic_interest": 3.5,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 10.0,
        "nr_gic_pct": 20.0,
        "nr_invest_pct": 70.0,
        "corp_cash_bucket": 0,
        "corp_gic_bucket": 0,
        "corp_invest_bucket": 0,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 2.0,
        "y_corp_gic_interest": 3.5,
        "y_corp_inv_total_return": 6.0,
        "y_corp_inv_elig_div": 2.0,
        "y_corp_inv_capg": 3.5,
        "corp_cash_pct": 5.0,
        "corp_gic_pct": 10.0,
        "corp_invest_pct": 85.0,
        "corp_dividend_type": "eligible",
        "tfsa_room_start": 7000,
        "tfsa_contribution_annual": 0,
        "enable_early_rrif_withdrawal": True,
        "early_rrif_withdrawal_start_age": 65,
        "early_rrif_withdrawal_end_age": 70,
        "early_rrif_withdrawal_annual": 20000,
        "early_rrif_withdrawal_percentage": 5.0,
        "early_rrif_withdrawal_mode": "percentage"
    }

def test_single_retiree():
    """Test simulation for single retiree via API"""
    print("\n" + "="*60)
    print("TESTING SINGLE RETIREE via API")
    print("="*60)

    payload = {
        "p1": create_test_person("John", 65),
        "p2": create_test_person("", 65),  # Empty for single
        "province": "AB",
        "start_year": 2025,
        "include_partner": False,  # SINGLE
        "end_age": 95,
        "strategy": "minimize-income",
        "spending_go_go": 40000,
        "go_go_end_age": 75,
        "spending_slow_go": 35000,
        "slow_go_end_age": 85,
        "spending_no_go": 30000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
        "gap_tolerance": 1000,
        "reinvest_nonreg_dist": False,
        "income_split_rrif_fraction": 0.0,
        "hybrid_rrif_topup_per_person": 0,
        "stop_on_fail": False,
        "tfsa_room_annual_growth": 7000
    }

    print(f"Sending request to: {API_URL}")
    print(f"Include partner: {payload['include_partner']}")
    print(f"P1 name: {payload['p1']['name']}")
    print(f"P2 name: {payload['p2']['name']}")
    print(f"Strategy: {payload['strategy']}")

    try:
        response = requests.post(API_URL, json=payload)

        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Single retiree simulation SUCCEEDED")

            if "summary" in data:
                summary = data["summary"]
                print(f"\nSummary:")
                print(f"  Health Score: {summary.get('health_score', 'N/A')}")
                print(f"  Success Rate: {summary.get('success_rate', 'N/A')}%")
                print(f"  Years Funded: {summary.get('years_funded', 'N/A')}/{summary.get('years_simulated', 'N/A')}")
                print(f"  Final Estate: ${summary.get('final_estate_after_tax', 0):,.0f}")
                print(f"  Total Tax Paid: ${summary.get('total_tax_paid', 0):,.0f}")
                print(f"  Avg Tax Rate: {summary.get('avg_effective_tax_rate', 0):.1f}%")

                # Check GIS
                print(f"\nGovernment Benefits:")
                print(f"  Total CPP: ${summary.get('total_cpp', 0):,.0f}")
                print(f"  Total OAS: ${summary.get('total_oas', 0):,.0f}")
                print(f"  Total GIS: ${summary.get('total_gis', 0):,.0f}")
                print(f"  Total Benefits: ${summary.get('total_government_benefits', 0):,.0f}")

            if "year_by_year" in data and len(data["year_by_year"]) > 0:
                first_year = data["year_by_year"][0]
                print(f"\nFirst Year Details:")
                print(f"  Year: {first_year.get('year')}")
                print(f"  Age P1: {first_year.get('age_p1')}")
                print(f"  GIS P1: ${first_year.get('gis_p1', 0):,.0f}")
                print(f"  Total Tax P1: ${first_year.get('total_tax_p1', 0):,.0f}")
                print(f"  Spending Target: ${first_year.get('spending_need', 0):,.0f}")
                print(f"  Spending Met: ${first_year.get('spending_met', 0):,.0f}")
        else:
            print(f"\n❌ Single retiree simulation FAILED")
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text[:500]}")

    except Exception as e:
        print(f"\n❌ Error calling API: {e}")

def test_couple():
    """Test simulation for couple via API"""
    print("\n" + "="*60)
    print("TESTING COUPLE via API")
    print("="*60)

    payload = {
        "p1": create_test_person("John", 65),
        "p2": create_test_person("Jane", 63),  # Partner with assets
        "province": "AB",
        "start_year": 2025,
        "include_partner": True,  # COUPLE
        "end_age": 95,
        "strategy": "minimize-income",
        "spending_go_go": 60000,
        "go_go_end_age": 75,
        "spending_slow_go": 50000,
        "slow_go_end_age": 85,
        "spending_no_go": 40000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
        "gap_tolerance": 1000,
        "reinvest_nonreg_dist": False,
        "income_split_rrif_fraction": 0.5,
        "hybrid_rrif_topup_per_person": 0,
        "stop_on_fail": False,
        "tfsa_room_annual_growth": 7000
    }

    print(f"Sending request to: {API_URL}")
    print(f"Include partner: {payload['include_partner']}")
    print(f"P1 name: {payload['p1']['name']}")
    print(f"P2 name: {payload['p2']['name']}")
    print(f"Income splitting: {payload['income_split_rrif_fraction']*100}%")

    try:
        response = requests.post(API_URL, json=payload)

        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Couple simulation SUCCEEDED")

            if "summary" in data:
                summary = data["summary"]
                print(f"\nSummary:")
                print(f"  Health Score: {summary.get('health_score', 'N/A')}")
                print(f"  Success Rate: {summary.get('success_rate', 'N/A')}%")
                print(f"  Years Funded: {summary.get('years_funded', 'N/A')}/{summary.get('years_simulated', 'N/A')}")
                print(f"  Final Estate: ${summary.get('final_estate_after_tax', 0):,.0f}")
                print(f"  Total Tax Paid: ${summary.get('total_tax_paid', 0):,.0f}")
                print(f"  Avg Tax Rate: {summary.get('avg_effective_tax_rate', 0):.1f}%")

                # Check GIS
                print(f"\nGovernment Benefits:")
                print(f"  Total CPP: ${summary.get('total_cpp', 0):,.0f}")
                print(f"  Total OAS: ${summary.get('total_oas', 0):,.0f}")
                print(f"  Total GIS: ${summary.get('total_gis', 0):,.0f}")
                print(f"  Total Benefits: ${summary.get('total_government_benefits', 0):,.0f}")

            if "year_by_year" in data and len(data["year_by_year"]) > 0:
                first_year = data["year_by_year"][0]
                print(f"\nFirst Year Details:")
                print(f"  Year: {first_year.get('year')}")
                print(f"  Age P1: {first_year.get('age_p1')}")
                print(f"  Age P2: {first_year.get('age_p2')}")
                print(f"  GIS P1: ${first_year.get('gis_p1', 0):,.0f}")
                print(f"  GIS P2: ${first_year.get('gis_p2', 0):,.0f}")
                print(f"  Total Tax P1: ${first_year.get('total_tax_p1', 0):,.0f}")
                print(f"  Total Tax P2: ${first_year.get('total_tax_p2', 0):,.0f}")
                print(f"  Spending Target: ${first_year.get('spending_need', 0):,.0f}")
                print(f"  Spending Met: ${first_year.get('spending_met', 0):,.0f}")
        else:
            print(f"\n❌ Couple simulation FAILED")
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text[:500]}")

    except Exception as e:
        print(f"\n❌ Error calling API: {e}")

def test_strategy_comparison():
    """Compare different withdrawal strategies for single person"""
    print("\n" + "="*60)
    print("TESTING WITHDRAWAL STRATEGIES (Single Person)")
    print("="*60)

    strategies = [
        "minimize-income",
        "rrif-frontload",
        "Balanced",
        "tfsa-first",
        "corporate-optimized"
    ]

    base_payload = {
        "p1": create_test_person("TestUser", 65),
        "p2": create_test_person("", 65),
        "province": "ON",
        "start_year": 2025,
        "include_partner": False,
        "end_age": 95,
        "spending_go_go": 50000,
        "go_go_end_age": 75,
        "spending_slow_go": 40000,
        "slow_go_end_age": 85,
        "spending_no_go": 35000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
        "gap_tolerance": 1000,
        "reinvest_nonreg_dist": False,
        "income_split_rrif_fraction": 0.0,
        "hybrid_rrif_topup_per_person": 0,
        "stop_on_fail": False,
        "tfsa_room_annual_growth": 7000
    }

    results = []
    for strategy in strategies:
        payload = {**base_payload, "strategy": strategy}

        try:
            response = requests.post(API_URL, json=payload)
            if response.status_code == 200:
                data = response.json()
                if "summary" in data:
                    results.append({
                        "strategy": strategy,
                        "health_score": data["summary"].get("health_score", 0),
                        "success_rate": data["summary"].get("success_rate", 0),
                        "final_estate": data["summary"].get("final_estate_after_tax", 0),
                        "total_tax": data["summary"].get("total_tax_paid", 0),
                        "total_gis": data["summary"].get("total_gis", 0)
                    })
                    print(f"✅ {strategy:20} - Score: {results[-1]['health_score']}")
            else:
                print(f"❌ {strategy:20} - Failed with status {response.status_code}")
        except Exception as e:
            print(f"❌ {strategy:20} - Error: {e}")

    if results:
        print("\n" + "-"*60)
        print("STRATEGY COMPARISON RESULTS:")
        print("-"*60)
        print(f"{'Strategy':<20} {'Score':<8} {'Success%':<10} {'Tax Paid':<15} {'GIS':<15} {'Estate':<15}")
        print("-"*60)

        for r in sorted(results, key=lambda x: x['health_score'], reverse=True):
            print(f"{r['strategy']:<20} {r['health_score']:<8} {r['success_rate']:<10.1f} "
                  f"${r['total_tax']:>13,.0f} ${r['total_gis']:>13,.0f} ${r['final_estate']:>13,.0f}")

if __name__ == "__main__":
    print("\n🧪 Testing Single vs Couple Retirement Simulations via API")
    print("=" * 60)
    print("This test verifies the API endpoints work correctly")
    print("for both single and couple retirement scenarios.\n")

    # Test single person
    test_single_retiree()

    # Test couple
    test_couple()

    # Compare strategies
    test_strategy_comparison()

    print("\n" + "="*60)
    print("API TESTS COMPLETE")
    print("="*60)