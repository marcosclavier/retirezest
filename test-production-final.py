#!/usr/bin/env python3
"""
Final production test to verify all critical fixes are deployed
"""
import requests
import json
from datetime import datetime

def test_production():
    print("=" * 80)
    print("PRODUCTION DEPLOYMENT VERIFICATION TEST")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    # Rafael's test scenario
    test_payload = {
        "p1": {
            "name": "Rafael",
            "start_age": 67,
            "cpp_start_age": 67,
            "cpp_annual_at_start": 12492,
            "oas_start_age": 67,
            "oas_annual_at_start": 8904,
            "pension_incomes": [{
                "name": "Employer Pension",
                "amount": 100000,
                "startAge": 67,
                "inflationIndexed": True
            }],
            "other_incomes": [],
            "tfsa_balance": 0,
            "rrif_balance": 350000,
            "rrsp_balance": 0,
            "nonreg_balance": 0,
            "corporate_balance": 0,
            "tfsa_room_start": 157500,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            # NonReg details
            "nonreg_acb": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            # Corporate details
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "p2": {
            "name": "",
            "start_age": 67,
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
            "tfsa_room_start": 0,
            "tfsa_contribution_annual": 0,
            "enable_early_rrif_withdrawal": False,
            # NonReg details
            "nonreg_acb": 0,
            "nr_cash": 0,
            "nr_gic": 0,
            "nr_invest": 0,
            "y_nr_cash_interest": 2.5,
            "y_nr_gic_interest": 3.5,
            "y_nr_inv_total_return": 5.0,
            "y_nr_inv_elig_div": 2.0,
            "y_nr_inv_nonelig_div": 0,
            "y_nr_inv_capg": 2.0,
            "y_nr_inv_roc_pct": 0,
            "nr_cash_pct": 10,
            "nr_gic_pct": 30,
            "nr_invest_pct": 60,
            # Corporate details
            "corp_cash_bucket": 0,
            "corp_gic_bucket": 0,
            "corp_invest_bucket": 0,
            "corp_rdtoh": 0,
            "y_corp_cash_interest": 2.5,
            "y_corp_gic_interest": 3.5,
            "y_corp_inv_total_return": 5.0,
            "y_corp_inv_elig_div": 2.0,
            "y_corp_inv_capg": 2.0,
            "corp_cash_pct": 10,
            "corp_gic_pct": 30,
            "corp_invest_pct": 60,
            "corp_dividend_type": "eligible",
            "early_rrif_withdrawal_start_age": 65,
            "early_rrif_withdrawal_end_age": 70,
            "early_rrif_withdrawal_annual": 0,
            "early_rrif_withdrawal_percentage": 0,
            "early_rrif_withdrawal_mode": "fixed"
        },
        "include_partner": False,
        "province": "AB",
        "start_year": 2033,
        "end_age": 85,
        "strategy": "rrif-frontload",
        "spending_go_go": 60000,
        "go_go_end_age": 75,
        "spending_slow_go": 60000,
        "slow_go_end_age": 85,
        "spending_no_go": 50000,
        "spending_inflation": 2.0,
        "general_inflation": 2.0,
        "tfsa_room_annual_growth": 2.0,
        "gap_tolerance": 0.01,
        "reinvest_nonreg_dist": False,
        "income_split_rrif_fraction": 0.5,
        "hybrid_rrif_topup_per_person": 0,
        "stop_on_fail": False
    }

    print("\n📊 Test Scenario:")
    print("  • Rafael, age 67, retiring 2033")
    print("  • Employer Pension: $100,000/year")
    print("  • CPP: $12,492/year")
    print("  • OAS: $8,904/year")
    print("  • RRIF Balance: $350,000")
    print("  • TFSA Room: $157,500")
    print("  • After-tax spending: $60,000/year")
    print()

    # Test direct Python API on Railway
    print("Testing Railway Python API directly...")
    try:
        response = requests.post(
            "https://astonishing-learning-production.up.railway.app/api/run-simulation",
            json=test_payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"API Response Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            years = result.get("year_by_year", [])

            if years:
                year_2033 = years[0]

                # Extract key values
                employer_pension = year_2033.get("employer_pension_p1", 0)
                cpp = year_2033.get("cpp_p1", 0)
                oas = year_2033.get("oas_p1", 0)
                gis = year_2033.get("gis_p1", 0)
                rrif_wd = year_2033.get("rrif_withdrawal_p1", 0)
                tfsa_wd = year_2033.get("tfsa_withdrawal_p1", 0)
                tfsa_contrib = year_2033.get("tfsa_contribution_p1", 0)
                tfsa_reinvest = year_2033.get("tfsa_reinvest_p1", 0)
                spending = year_2033.get("spending_need", 0)
                total_tax = year_2033.get("total_tax", 0)

                # Calculate totals
                total_income = employer_pension + cpp + oas + gis
                total_tfsa = tfsa_contrib + tfsa_reinvest

                print("\n" + "=" * 80)
                print("YEAR 2033 PRODUCTION RESULTS")
                print("=" * 80)

                print("\n📈 INCOME SOURCES:")
                print(f"  Employer Pension: ${employer_pension:,.0f}")
                print(f"  CPP:             ${cpp:,.0f}")
                print(f"  OAS:             ${oas:,.0f}")
                print(f"  GIS:             ${gis:,.0f}")
                print(f"  ─────────────────────────")
                print(f"  Total Income:    ${total_income:,.0f}")

                print("\n💰 WITHDRAWALS & ALLOCATIONS:")
                print(f"  RRIF Withdrawal: ${rrif_wd:,.0f}")
                print(f"  TFSA Regular:    ${tfsa_contrib:,.0f}")
                print(f"  TFSA Reinvest:   ${tfsa_reinvest:,.0f}")
                print(f"  Total TFSA:      ${total_tfsa:,.0f}")

                print("\n💸 EXPENSES:")
                print(f"  Spending Need:   ${spending:,.0f}")
                print(f"  Total Tax:       ${total_tax:,.0f}")

                # Test critical fixes
                print("\n" + "=" * 80)
                print("CRITICAL FIX VERIFICATION")
                print("=" * 80)

                all_passed = True

                # Fix 1: GIS Eligibility
                print("\n1️⃣ GIS Eligibility Fix:")
                if gis == 0:
                    print("  ✅ PASS: GIS correctly $0 for high-income individual")
                else:
                    print(f"  ❌ FAIL: GIS is ${gis:,.0f} (should be $0)")
                    all_passed = False

                # Fix 2: TFSA Allocation
                print("\n2️⃣ TFSA Surplus Allocation Fix:")
                if 25000 <= total_tfsa <= 45000:
                    print(f"  ✅ PASS: TFSA allocation reasonable (${total_tfsa:,.0f})")
                elif total_tfsa > 100000:
                    print(f"  ❌ FAIL: TFSA over-allocated (${total_tfsa:,.0f})")
                    all_passed = False
                else:
                    print(f"  ⚠️  WARNING: TFSA unexpected (${total_tfsa:,.0f})")
                    all_passed = False

                # Fix 3: Spending Target
                print("\n3️⃣ Spending Target Fix:")
                if spending == 60000:
                    print("  ✅ PASS: Spending target correctly maintained at $60,000")
                else:
                    print(f"  ❌ FAIL: Spending target is ${spending:,.0f} (should be $60,000)")
                    all_passed = False

                # Fix 4: Pension Included
                print("\n4️⃣ Pension Income Fix:")
                if employer_pension == 100000:
                    print("  ✅ PASS: Pension correctly included at $100,000")
                else:
                    print(f"  ❌ FAIL: Pension is ${employer_pension:,.0f} (should be $100,000)")
                    all_passed = False

                print("\n" + "=" * 80)
                if all_passed:
                    print("🎉 ALL CRITICAL FIXES VERIFIED IN PRODUCTION!")
                    print("\nSummary of successful fixes:")
                    print("  ✅ GIS eligibility working correctly")
                    print("  ✅ Surplus allocation working correctly")
                    print("  ✅ Spending target preserved correctly")
                    print("  ✅ Pension income included correctly")
                    return True
                else:
                    print("⚠️  Some fixes may not be fully deployed")
                    return False
            else:
                print("❌ No year data in response")
                return False
        else:
            print(f"❌ API returned status {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False

    except Exception as e:
        print(f"❌ Error testing production: {e}")
        return False

if __name__ == "__main__":
    print("\n🚀 Starting Production Test...\n")
    success = test_production()
    print("\n" + "=" * 80)
    if success:
        print("✅ PRODUCTION DEPLOYMENT SUCCESSFUL!")
        print("All critical fixes are live and working correctly.")
    else:
        print("❌ Production test failed - please check deployment")
    print("=" * 80)