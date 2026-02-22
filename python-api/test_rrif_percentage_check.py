#!/usr/bin/env python3
"""
Direct test to verify RRIF frontload percentages
"""

import requests
import json

def test_rrif_frontload_percentage():
    """Test that RRIF withdrawals are exactly 8% after OAS"""

    # Rafael's scenario at age 80 (after OAS)
    payload = {
        "p1": {
            "name": "Rafael",
            "start_age": 80,
            "rrif_balance": 200000,  # Simple round number for easy calculation
            "tfsa_balance": 100000,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 16000,
            "oas_start_age": 65,
            "oas_annual_at_start": 12000,
            "pension_incomes": [],
            "other_incomes": []
        },
        "p2": {
            "name": "",
            "start_age": 80,
            "rrif_balance": 0,
            "tfsa_balance": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "cpp_start_age": 65,
            "cpp_annual_at_start": 0,
            "oas_start_age": 65,
            "oas_annual_at_start": 0,
            "pension_incomes": [],
            "other_incomes": []
        },
        "include_partner": False,
        "province": "AB",
        "start_year": 2026,
        "end_age": 82,
        "strategy": "rrif-frontload",
        "spending_go_go": 80000,
        "go_go_end_age": 85,
        "spending_slow_go": 70000,
        "slow_go_end_age": 90,
        "spending_no_go": 60000,
        "spending_inflation": 2,
        "general_inflation": 2,
        "tfsa_contribution_each": 0
    }

    print("=" * 80)
    print("RRIF FRONTLOAD PERCENTAGE TEST")
    print("=" * 80)
    print("\nTest Parameters:")
    print(f"  Age: 80 (OAS already started at 65)")
    print(f"  RRIF Balance: $200,000")
    print(f"  Expected RRIF withdrawal: 8% of $200,000 = $16,000")
    print(f"  Strategy: rrif-frontload")
    print("\n" + "-" * 80)

    try:
        response = requests.post(
            "http://localhost:8000/api/run-simulation",
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()

            # Find year 1 (age 80)
            year_data = None
            for year in data.get('five_year_plan', []):
                if year['age_p1'] == 80:
                    year_data = year
                    break

            if year_data:
                rrif_withdrawal = year_data.get('rrif_withdrawal_p1', 0)
                rrif_start = 200000  # Our test starting balance
                percentage = (rrif_withdrawal / rrif_start) * 100 if rrif_start > 0 else 0

                print("\n📊 RESULTS:")
                print(f"  RRIF Withdrawal: ${rrif_withdrawal:,.2f}")
                print(f"  Withdrawal Percentage: {percentage:.2f}%")
                print(f"  Expected: 8.00%")

                if abs(percentage - 8.0) < 0.5:
                    print("\n✅ TEST PASSED: RRIF withdrawal is approximately 8%")
                else:
                    print(f"\n❌ TEST FAILED: RRIF withdrawal is {percentage:.2f}%, not 8%")

                    # Check if it's the mandatory minimum causing the issue
                    mandatory_min_rate = 0.067  # Age 80 mandatory minimum is 6.7%
                    mandatory_min = rrif_start * mandatory_min_rate

                    if rrif_withdrawal >= mandatory_min:
                        print(f"\n   Note: Withdrawal exceeds mandatory minimum ({mandatory_min_rate*100:.2f}% = ${mandatory_min:,.2f})")

                    print("\n   POSSIBLE CAUSES:")
                    print("   1. Extra RRIF withdrawals are being added for shortfalls")
                    print("   2. The frontload percentage calculation has an error")
                    print("   3. Strategy name is not being recognized correctly")

                # Check if gaps are shown
                plan_success = year_data.get('plan_success', '')
                if 'gap' in plan_success.lower():
                    print("\n📌 Gap Status: ✅ Showing GAP (correct behavior)")
                else:
                    print(f"\n📌 Gap Status: {plan_success}")

            else:
                print("\n❌ ERROR: Could not find data for age 80")
        else:
            print(f"\n❌ ERROR: API returned status {response.status_code}")
            print(response.text[:500])

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_rrif_frontload_percentage()