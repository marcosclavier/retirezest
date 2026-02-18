#!/usr/bin/env python3
"""
Test script for Juan and Daniela's Corporate withdrawal issue.
They have $2.5M in Corporate but it shows $0 withdrawals.
"""

import requests
import json

# API endpoint
API_URL = "http://localhost:8000/api/run-simulation"

def test_juan_daniela():
    """Test Juan and Daniela's scenario"""

    print("\n" + "="*80)
    print("JUAN & DANIELA CORPORATE WITHDRAWAL TEST")
    print("="*80)

    payload = {
        "strategy": "rrif-frontload",
        "province": "ON",
        "start_year": 2026,
        "include_partner": True,
        "p1": {
            "name": "Juan",
            "start_age": 65,
            "cpp_start_age": 70,
            "cpp_annual_at_start": 6000.0,
            "oas_start_age": 70,
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 45000.0,
            "rrif_balance": 0.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 73680.0,
            "corporate_balance": 1502354.0,
            "nonreg_acb": 36840.0,
            "nr_cash": 0.0,
            "nr_gic": 0.0,
            "nr_invest": 73680.0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "p2": {
            "name": "Daniela",
            "start_age": 58,
            "cpp_start_age": 70,
            "cpp_annual_at_start": 1000.0,
            "oas_start_age": 70,
            "oas_annual_at_start": 8000.0,
            "tfsa_balance": 20000.0,
            "rrif_balance": 0.0,
            "rrsp_balance": 0.0,
            "nonreg_balance": 0.0,
            "corporate_balance": 1063236.0,
            "nonreg_acb": 0.0,
            "nr_cash": 0.0,
            "nr_gic": 0.0,
            "nr_invest": 0.0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "spending_go_go": 153700.0,
        "go_go_end_age": 75,
        "spending_slow_go": 153700.0,
        "slow_go_end_age": 85,
        "spending_no_go": 153700.0,
        "spending_inflation": 2.0,
        "general_inflation": 2.0
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years and len(years) > 0:
                # Check first few years
                print("\nFirst 5 Years Results:")
                print("-" * 60)

                for i in range(min(5, len(years))):
                    year = years[i]
                    print(f"\nYear {i+1} ({year.get('year', 'N/A')}):")
                    print(f"  Juan (age {year.get('age_p1', 'N/A')}):")
                    print(f"    Corporate: ${year.get('corporate_withdrawal_p1', 0):,.0f}")
                    print(f"    NonReg: ${year.get('nonreg_withdrawal_p1', 0):,.0f}")
                    print(f"    TFSA: ${year.get('tfsa_withdrawal_p1', 0):,.0f}")
                    print(f"  Daniela (age {year.get('age_p2', 'N/A')}):")
                    print(f"    Corporate: ${year.get('corporate_withdrawal_p2', 0):,.0f}")
                    print(f"    NonReg: ${year.get('nonreg_withdrawal_p2', 0):,.0f}")
                    print(f"    TFSA: ${year.get('tfsa_withdrawal_p2', 0):,.0f}")

                    # Check balances
                    print(f"  Ending balances:")
                    print(f"    Juan Corp: ${year.get('end_corp_p1', 0):,.0f}")
                    print(f"    Juan NonReg: ${year.get('end_nonreg_p1', 0):,.0f}")
                    print(f"    Daniela Corp: ${year.get('end_corp_p2', 0):,.0f}")

                # Check if Corporate is being used at all
                year1 = years[0]
                corp_p1 = year1.get("corporate_withdrawal_p1", 0)
                corp_p2 = year1.get("corporate_withdrawal_p2", 0)

                if corp_p1 == 0 and corp_p2 == 0:
                    print("\n❌ ISSUE: Corporate withdrawals are $0 for both Juan and Daniela in year 1")
                    print("   Despite having $1.5M and $1.06M in Corporate accounts respectively")
                else:
                    print(f"\n✅ Corporate withdrawals working: Juan=${corp_p1:,.0f}, Daniela=${corp_p2:,.0f}")

                return corp_p1 > 0 or corp_p2 > 0
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def main():
    """Run the test"""
    success = test_juan_daniela()

    print("\n" + "="*80)
    if success:
        print("✅ Corporate withdrawals are working correctly")
    else:
        print("❌ Corporate withdrawal issue confirmed")
        print("\nProblem: The rrif-frontload strategy should use Corporate before NonReg")
        print("Expected order: RRIF → Corporate → NonReg → TFSA")
        print("Current behavior: Using NonReg before Corporate (wrong order)")

    return 0 if success else 1

if __name__ == "__main__":
    exit(main())