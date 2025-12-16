"""
Detailed tax investigation for year 2025.
This script calls the API and displays all income components and tax calculations
to verify if taxes are being calculated correctly.
"""

import requests
import json

API_URL = "http://localhost:8000/api/run-simulation"

# Test with the current user scenario (both persons age 65, no government benefits yet)
test_input = {
    "p1": {
        "name": "Person 1",
        "start_age": 65,
        "cpp_start_age": 70,  # Not receiving yet in 2025
        "cpp_annual_at_start": 15000,
        "oas_start_age": 70,  # Not receiving yet in 2025
        "oas_annual_at_start": 8500,
        "tfsa_balance": 100000,
        "rrif_balance": 200000,
        "rrsp_balance": 0,
        "nonreg_balance": 300000,
        "corporate_balance": 1000000,
        "nonreg_acb": 0,
        "nr_cash": 0,
        "nr_gic": 0,
        "nr_invest": 300000,
        "y_nr_cash_interest": 2.0,
        "y_nr_gic_interest": 3.5,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 0.0,
        "nr_gic_pct": 0.0,
        "nr_invest_pct": 100.0,
        "corp_cash_bucket": 0,
        "corp_gic_bucket": 0,
        "corp_invest_bucket": 1000000,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 2.0,
        "y_corp_gic_interest": 3.5,
        "y_corp_inv_total_return": 6.0,
        "y_corp_inv_elig_div": 2.0,
        "y_corp_inv_capg": 3.5,
        "corp_cash_pct": 0.0,
        "corp_gic_pct": 0.0,
        "corp_invest_pct": 100.0,
        "corp_dividend_type": "eligible",
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "p2": {
        "name": "Person 2",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 15000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 100000,
        "rrif_balance": 200000,
        "rrsp_balance": 0,
        "nonreg_balance": 300000,
        "corporate_balance": 1000000,
        "nonreg_acb": 0,
        "nr_cash": 0,
        "nr_gic": 0,
        "nr_invest": 300000,
        "y_nr_cash_interest": 2.0,
        "y_nr_gic_interest": 3.5,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 0.0,
        "nr_gic_pct": 0.0,
        "nr_invest_pct": 100.0,
        "corp_cash_bucket": 0,
        "corp_gic_bucket": 0,
        "corp_invest_bucket": 1000000,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 2.0,
        "y_corp_gic_interest": 3.5,
        "y_corp_inv_total_return": 6.0,
        "y_corp_inv_elig_div": 2.0,
        "y_corp_inv_capg": 3.5,
        "corp_cash_pct": 0.0,
        "corp_gic_pct": 0.0,
        "corp_invest_pct": 100.0,
        "corp_dividend_type": "eligible",
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "corporate-optimized",
    "spending_go_go": 200100,
    "go_go_end_age": 75,
    "spending_slow_go": 90000,
    "slow_go_end_age": 85,
    "spending_no_go": 70000,
    "spending_inflation": 2.0,
    "general_inflation": 2.0,
    "gap_tolerance": 1000,
    "tfsa_contribution_each": 0,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0.0,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False
}

print("=" * 100)
print("DETAILED TAX INVESTIGATION - YEAR 2025")
print("=" * 100)
print("\nSending simulation request...")

try:
    response = requests.post(API_URL, json=test_input, timeout=30)
    response.raise_for_status()

    result = response.json()

    if not result.get("success"):
        print(f"\n❌ API Error: {result.get('message')}")
        print(f"   Error details: {result.get('error_details')}")
        exit(1)

    # Get year 2025 data
    year_results = result.get("year_by_year", [])
    five_year_plan = result.get("five_year_plan", [])

    if not year_results or not five_year_plan:
        print("\n❌ No results returned")
        exit(1)

    year_2025 = year_results[0]
    plan_2025 = five_year_plan[0]

    print("\n" + "=" * 100)
    print("YEAR 2025 - INCOME COMPONENTS")
    print("=" * 100)

    print("\n📊 Government Benefits:")
    cpp_total = year_2025["cpp_p1"] + year_2025["cpp_p2"]
    oas_total = year_2025["oas_p1"] + year_2025["oas_p2"]
    print(f"  CPP (P1): ${year_2025['cpp_p1']:>12,.2f}")
    print(f"  CPP (P2): ${year_2025['cpp_p2']:>12,.2f}")
    print(f"  CPP Total: ${cpp_total:>11,.2f}")
    print(f"  OAS (P1): ${year_2025['oas_p1']:>12,.2f}")
    print(f"  OAS (P2): ${year_2025['oas_p2']:>12,.2f}")
    print(f"  OAS Total: ${oas_total:>11,.2f}")

    print("\n💰 Withdrawals:")
    rrif_total = year_2025["rrif_withdrawal_p1"] + year_2025["rrif_withdrawal_p2"]
    nonreg_total = year_2025["nonreg_withdrawal_p1"] + year_2025["nonreg_withdrawal_p2"]
    tfsa_total = year_2025["tfsa_withdrawal_p1"] + year_2025["tfsa_withdrawal_p2"]
    corp_total = year_2025["corporate_withdrawal_p1"] + year_2025["corporate_withdrawal_p2"]

    print(f"  RRIF (P1): ${year_2025['rrif_withdrawal_p1']:>12,.2f}")
    print(f"  RRIF (P2): ${year_2025['rrif_withdrawal_p2']:>12,.2f}")
    print(f"  RRIF Total: ${rrif_total:>11,.2f}")

    print(f"  NonReg (P1): ${year_2025['nonreg_withdrawal_p1']:>10,.2f}")
    print(f"  NonReg (P2): ${year_2025['nonreg_withdrawal_p2']:>10,.2f}")
    print(f"  NonReg Total: ${nonreg_total:>9,.2f}")

    print(f"  TFSA (P1): ${year_2025['tfsa_withdrawal_p1']:>12,.2f}")
    print(f"  TFSA (P2): ${year_2025['tfsa_withdrawal_p2']:>12,.2f}")
    print(f"  TFSA Total: ${tfsa_total:>11,.2f}")

    print(f"  Corporate (P1): ${year_2025['corporate_withdrawal_p1']:>8,.2f}")
    print(f"  Corporate (P2): ${year_2025['corporate_withdrawal_p2']:>8,.2f}")
    print(f"  Corporate Total: ${corp_total:>7,.2f}")

    print("\n📈 NonReg Distributions (from 5-year plan):")
    nr_dist_p1 = plan_2025.get("nonreg_distributions_p1", 0)
    nr_dist_p2 = plan_2025.get("nonreg_distributions_p2", 0)
    nr_dist_total = plan_2025.get("nonreg_distributions_total", 0)
    print(f"  NonReg Dist (P1): ${nr_dist_p1:>9,.2f}")
    print(f"  NonReg Dist (P2): ${nr_dist_p2:>9,.2f}")
    print(f"  NonReg Dist Total: ${nr_dist_total:>8,.2f}")

    print("\n" + "=" * 100)
    print("TAX CALCULATION ANALYSIS")
    print("=" * 100)

    print("\n💸 Taxes Reported:")
    tax_p1 = year_2025.get("total_tax_p1", 0)
    tax_p2 = year_2025.get("total_tax_p2", 0)
    total_tax = year_2025["total_tax"]
    print(f"  Tax (P1): ${tax_p1:>15,.2f}")
    print(f"  Tax (P2): ${tax_p2:>15,.2f}")
    print(f"  Total Tax: ${total_tax:>14,.2f}")

    print("\n📋 Taxable Income Components per Person:")
    taxable_p1 = year_2025.get("taxable_income_p1", 0)
    taxable_p2 = year_2025.get("taxable_income_p2", 0)
    print(f"  Taxable Income (P1): ${taxable_p1:>10,.2f}")
    print(f"  Taxable Income (P2): ${taxable_p2:>10,.2f}")

    print("\n🧮 Expected Taxable Income Breakdown (Manual Calculation):")
    print("\n  Person 1:")
    print(f"    CPP: ${year_2025['cpp_p1']:>20,.2f}")
    print(f"    OAS: ${year_2025['oas_p1']:>20,.2f}")
    print(f"    RRIF: ${year_2025['rrif_withdrawal_p1']:>19,.2f}")
    print(f"    NonReg Distributions: ${nr_dist_p1:>8,.2f}  (interest, dividends, cap gains)")
    print(f"    Corporate Dividends: ${year_2025['corporate_withdrawal_p1']:>9,.2f}  (eligible dividends)")
    expected_taxable_p1 = (
        year_2025['cpp_p1'] +
        year_2025['oas_p1'] +
        year_2025['rrif_withdrawal_p1'] +
        nr_dist_p1 +
        year_2025['corporate_withdrawal_p1']
    )
    print(f"    Expected Taxable (before grossup): ${expected_taxable_p1:>5,.2f}")

    print("\n  Person 2:")
    print(f"    CPP: ${year_2025['cpp_p2']:>20,.2f}")
    print(f"    OAS: ${year_2025['oas_p2']:>20,.2f}")
    print(f"    RRIF: ${year_2025['rrif_withdrawal_p2']:>19,.2f}")
    print(f"    NonReg Distributions: ${nr_dist_p2:>8,.2f}")
    print(f"    Corporate Dividends: ${year_2025['corporate_withdrawal_p2']:>9,.2f}")
    expected_taxable_p2 = (
        year_2025['cpp_p2'] +
        year_2025['oas_p2'] +
        year_2025['rrif_withdrawal_p2'] +
        nr_dist_p2 +
        year_2025['corporate_withdrawal_p2']
    )
    print(f"    Expected Taxable (before grossup): ${expected_taxable_p2:>5,.2f}")

    print("\n" + "=" * 100)
    print("SPENDING ANALYSIS")
    print("=" * 100)

    spending_need = year_2025["spending_need"]
    spending_met = year_2025["spending_met"]
    spending_gap = year_2025["spending_gap"]

    total_inflows = cpp_total + oas_total + rrif_total + nonreg_total + tfsa_total + corp_total + nr_dist_total
    after_tax_available = total_inflows - total_tax

    print(f"\n  Total Inflows: ${total_inflows:>15,.2f}")
    print(f"  Total Tax: ${total_tax:>19,.2f}")
    print(f"  ─────────────────────────────────")
    print(f"  After-Tax Available: ${after_tax_available:>9,.2f}")
    print(f"\n  Spending Need: ${spending_need:>15,.2f}")
    print(f"  Spending Met: ${spending_met:>16,.2f}")
    print(f"  Spending Gap: ${spending_gap:>16,.2f}")

    print("\n" + "=" * 100)
    print("TAX DISCREPANCY ANALYSIS")
    print("=" * 100)

    # Rough estimate of expected taxes
    # Alberta 2024 rates (simplified):
    # Combined federal + provincial on first ~$55k: ~25%
    # Combined federal + provincial on next ~$60k: ~36%
    # Combined federal + provincial on next ~$100k: ~42%
    # Eligible dividends get ~38% grossup, then dividend tax credit

    print("\n💡 Expected Tax Estimate (rough calculation):")
    print("   Note: This is a simplified estimate. Actual calculation considers:")
    print("   - Eligible dividend grossup (38%) and tax credit (~25% of grossed-up amount)")
    print("   - Progressive tax brackets (federal + provincial)")
    print("   - Non-eligible dividend grossup (15%) and tax credit (~18% of grossed-up amount)")
    print("   - Capital gains inclusion rate (50%)")

    # Simplified estimate for each person
    for person_num in [1, 2]:
        if person_num == 1:
            cpp = year_2025['cpp_p1']
            oas = year_2025['oas_p1']
            rrif = year_2025['rrif_withdrawal_p1']
            corp = year_2025['corporate_withdrawal_p1']
            nr_dist = nr_dist_p1
        else:
            cpp = year_2025['cpp_p2']
            oas = year_2025['oas_p2']
            rrif = year_2025['rrif_withdrawal_p2']
            corp = year_2025['corporate_withdrawal_p2']
            nr_dist = nr_dist_p2

        # Rough approximation (not exact due to tax credits on dividends)
        ordinary_income = cpp + oas + rrif + (nr_dist * 0.5)  # Assume half of nr_dist is capital gains (50% inclusion)

        # Eligible dividends: $171,380
        # After grossup (38%): $171,380 * 1.38 = $236,504
        # This gets added to taxable income, then dividend tax credit applied
        # Effective rate on eligible dividends in AB: ~15-20% depending on bracket

        print(f"\n   Person {person_num}:")
        print(f"     Ordinary income (CPP+OAS+RRIF+nr_dist): ${ordinary_income:,.2f}")
        print(f"     Corporate eligible dividends: ${corp:,.2f}")
        print(f"     → After grossup (38%): ${corp * 1.38:,.2f}")
        print(f"     → Estimated tax on eligible dividends (~17% effective): ${corp * 0.17:,.2f}")
        print(f"     → Estimated tax on ordinary income (~25-30%): ${ordinary_income * 0.275:,.2f}")
        est_tax = (ordinary_income * 0.275) + (corp * 0.17)
        print(f"     → Total estimated tax: ${est_tax:,.2f}")

    print("\n" + "=" * 100)
    print("🔍 CONCLUSION")
    print("=" * 100)

    if total_tax < 20000:
        print(f"\n⚠️  WARNING: Reported total tax of ${total_tax:,.2f} seems LOW for this income level.")
        print("   Expected taxes: ~$27,000 - $30,000 based on:")
        print("   - Two people each receiving ~$185,000 in taxable income")
        print("   - Including $171,380 in corporate eligible dividends per person")
        print("   - RRIF withdrawals, NonReg distributions")
        print("\n   Possible issues to investigate:")
        print("   1. Are corporate dividends being included in taxable income?")
        print("   2. Are NonReg distributions being included in taxable income?")
        print("   3. Is the dividend tax credit calculation correct?")
        print("   4. Are there any tax deductions being applied incorrectly?")
    else:
        print(f"\n✅ Total tax of ${total_tax:,.2f} appears reasonable for this income level.")

    print("\n" + "=" * 100)

except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Could not connect to API")
    print("   Make sure the FastAPI server is running on port 8000")
except requests.exceptions.Timeout:
    print("\n❌ ERROR: API request timed out")
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
