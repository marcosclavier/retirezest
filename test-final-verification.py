#!/usr/bin/env python3
"""
Final verification test for pension and TFSA surplus allocation fixes
Tests Rafael's scenario to ensure correct surplus calculation
"""
import requests
import json
import sys

def test_simulation():
    print("=" * 70)
    print("FINAL VERIFICATION: PENSION & TFSA SURPLUS ALLOCATION")
    print("=" * 70)

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
            "tfsa_room_start": 157500,  # Accumulated room since 2009
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
            # Corporate details (all zeros)
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
        "spending_go_go": 60000,  # After-tax spending need
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
    print(f"  • Rafael, age 67, retiring 2033")
    print(f"  • Employer Pension: $100,000/year")
    print(f"  • CPP: $12,492/year")
    print(f"  • OAS: $8,904/year")
    print(f"  • RRIF Balance: $350,000")
    print(f"  • TFSA Room: $157,500 (accumulated)")
    print(f"  • After-tax spending: $60,000/year")
    print()

    # Call backend API
    response = requests.post(
        "http://localhost:8000/api/run-simulation",
        json=test_payload
    )

    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        print(response.text)
        return False

    result = response.json()
    years = result.get("year_by_year", [])

    if not years:
        print("❌ No year data returned")
        return False

    year_2033 = years[0]

    print("=" * 70)
    print("YEAR 2033 RESULTS")
    print("=" * 70)

    # Extract key values
    employer_pension = year_2033.get("employer_pension_p1", 0)
    cpp = year_2033.get("cpp_p1", 0)
    oas = year_2033.get("oas_p1", 0)
    gis = year_2033.get("gis_p1", 0)
    rrif_wd = year_2033.get("rrif_withdrawal_p1", 0)
    tfsa_wd = year_2033.get("tfsa_withdrawal_p1", 0)
    nonreg_wd = year_2033.get("nonreg_withdrawal_p1", 0)
    nonreg_dist = year_2033.get("nonreg_distributions", 0)

    # Calculate total inflows
    total_benefits = cpp + oas + gis
    total_withdrawals = rrif_wd + tfsa_wd + nonreg_wd
    total_inflows = employer_pension + total_benefits + total_withdrawals + nonreg_dist

    # Get spending and taxes
    spending = year_2033.get("spending_need", 0)
    total_tax = year_2033.get("total_tax", 0)

    # Calculate net cash flow (surplus)
    net_cash_flow = total_inflows - spending - total_tax

    # Get reinvestments
    tfsa_reinvest = year_2033.get("tfsa_reinvest_p1", 0)
    nonreg_reinvest = year_2033.get("reinvest_nonreg_p1", 0)
    total_reinvest = tfsa_reinvest + nonreg_reinvest

    print(f"\n1️⃣  INCOME SOURCES")
    print(f"   Employer Pension: ${employer_pension:,.0f}")
    print(f"   CPP:             ${cpp:,.0f}")
    print(f"   OAS:             ${oas:,.0f}")
    print(f"   GIS:             ${gis:,.0f}")
    print(f"   RRIF Withdrawal: ${rrif_wd:,.0f}")
    print(f"   ─────────────────────────")
    print(f"   Total Inflows:   ${total_inflows:,.0f}")

    print(f"\n2️⃣  OUTFLOWS")
    print(f"   Spending Need:   ${spending:,.0f}")
    print(f"   Total Tax:       ${total_tax:,.0f}")
    print(f"   ─────────────────────────")
    print(f"   Total Outflows:  ${spending + total_tax:,.0f}")

    print(f"\n3️⃣  NET CASH FLOW (SURPLUS)")
    print(f"   Calculated:      ${net_cash_flow:,.0f}")
    print(f"   Reinvested:      ${total_reinvest:,.0f}")

    print(f"\n4️⃣  SURPLUS ALLOCATION")
    print(f"   → TFSA:          ${tfsa_reinvest:,.0f}")
    print(f"   → Non-Reg:       ${nonreg_reinvest:,.0f}")

    # Verify results
    print("\n" + "=" * 70)
    print("VERIFICATION")
    print("=" * 70)

    tests_passed = 0
    tests_failed = 0

    # Test 1: Pension included
    if employer_pension == 100000:
        print("✅ Test 1: Pension correctly included ($100,000)")
        tests_passed += 1
    else:
        print(f"❌ Test 1: Pension incorrect (got ${employer_pension:,.0f}, expected $100,000)")
        tests_failed += 1

    # Test 2: Total inflows reasonable
    if total_inflows > 120000 and total_inflows < 160000:
        print(f"✅ Test 2: Total inflows reasonable (${total_inflows:,.0f})")
        tests_passed += 1
    else:
        print(f"❌ Test 2: Total inflows unexpected (${total_inflows:,.0f})")
        tests_failed += 1

    # Test 3: Surplus reasonable (should be ~$30k after fixing the bug)
    if net_cash_flow > 20000 and net_cash_flow < 40000:
        print(f"✅ Test 3: Surplus reasonable (${net_cash_flow:,.0f})")
        tests_passed += 1
    else:
        print(f"⚠️  Test 3: Surplus unexpected (${net_cash_flow:,.0f})")
        if net_cash_flow > 100000:
            print("   (Likely still has the bug - pension subtracted from target)")
        tests_failed += 1

    # Test 4: TFSA allocation matches surplus
    if abs(total_reinvest - net_cash_flow) < 100:  # Allow small rounding difference
        print(f"✅ Test 4: Reinvestment matches surplus (diff: ${abs(total_reinvest - net_cash_flow):.0f})")
        tests_passed += 1
    else:
        print(f"❌ Test 4: Reinvestment mismatch (reinvest: ${total_reinvest:,.0f}, surplus: ${net_cash_flow:,.0f})")
        tests_failed += 1

    # Test 5: TFSA gets priority over Non-Reg
    if tfsa_reinvest > 0 and tfsa_reinvest <= 157500:
        print(f"✅ Test 5: TFSA gets priority (${tfsa_reinvest:,.0f})")
        tests_passed += 1
    else:
        print(f"❌ Test 5: TFSA allocation issue (${tfsa_reinvest:,.0f})")
        tests_failed += 1

    print("\n" + "=" * 70)
    print(f"RESULTS: {tests_passed} passed, {tests_failed} failed")
    print("=" * 70)

    if tests_failed == 0:
        print("\n🎉 ALL TESTS PASSED! The fixes are working correctly.")
        print("\nKey achievements:")
        print("• Pension income properly included in calculations")
        print("• Spending target not incorrectly reduced by pension")
        print("• Surplus calculation matches net cash flow")
        print("• TFSA allocation uses accumulated room correctly")
        return True
    else:
        print(f"\n⚠️  {tests_failed} test(s) failed. Please review the results.")
        return False

if __name__ == "__main__":
    success = test_simulation()
    sys.exit(0 if success else 1)