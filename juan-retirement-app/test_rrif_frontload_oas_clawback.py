"""
Test RRIF Frontload strategy with OAS Clawback Avoidance enhancement.

This test verifies that the RRIF-Frontload strategy automatically detects
when approaching the OAS clawback threshold and switches to TFSA/NonReg
withdrawals to avoid losing 15% to clawback.
"""

import requests
import json

# Test profile similar to Juan & Daniela
test_profile = {
    "p1": {
        "name": "Person 1",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 200000,
        "rrif_balance": 800000,
        "rrsp_balance": 0,
        "nonreg_balance": 500000,
        "corporate_balance": 0,
        "nonreg_acb": 450000,  # High ACB for favorable cap gains treatment
        "nr_cash": 50000,
        "nr_gic": 100000,
        "nr_invest": 350000,
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
    },
    "p2": {
        "name": "Person 2",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 200000,
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
        "tfsa_room_start": 7000,
        "tfsa_contribution_annual": 0,
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "rrif-frontload",  # Using the enhanced RRIF frontload strategy
    "spending_go_go": 120000,
    "go_go_end_age": 75,
    "spending_slow_go": 90000,
    "slow_go_end_age": 85,
    "spending_no_go": 70000,
    "spending_inflation": 2.0,
    "general_inflation": 2.0,
    "tfsa_room_annual_growth": 7000,
    "gap_tolerance": 1000,
    "reinvest_nonreg_dist": False,
    "income_split_rrif_fraction": 0.0,
    "hybrid_rrif_topup_per_person": 0,
    "stop_on_fail": False,
}

print("=" * 80)
print("RRIF FRONTLOAD STRATEGY WITH OAS CLAWBACK AVOIDANCE TEST")
print("=" * 80)

# Run simulation
print("\nRunning simulation with RRIF-Frontload strategy...")
response = requests.post("http://127.0.0.1:8000/api/run-simulation", json=test_profile)

if response.status_code != 200:
    print(f"❌ API Error: {response.status_code}")
    print(response.text)
    exit(1)

result = response.json()
if not result.get("success"):
    print(f"❌ Failed: {result.get('message')}")
    exit(1)

year_by_year = result["year_by_year"]
summary = result["summary"]

print(f"✅ Simulation completed successfully")
print(f"   Years simulated: {summary['years_simulated']}")
print(f"   Total tax paid: ${summary['total_tax_paid']:,.0f}")
print(f"   Total OAS clawback: ${summary.get('total_oas_clawback', 0):,.0f}")

# Find years with OAS clawback
clawback_years = []
for yd in year_by_year:
    year = yd['year']
    clawback_p1 = yd.get('oas_clawback_p1', 0) or 0
    clawback_p2 = yd.get('oas_clawback_p2', 0) or 0
    total_clawback = clawback_p1 + clawback_p2

    if total_clawback > 100:  # Threshold of $100 to filter noise
        clawback_years.append({
            'year': year,
            'age_p1': yd['age_p1'],
            'age_p2': yd['age_p2'],
            'clawback': total_clawback,
            'taxable_income_p1': yd.get('taxable_income_p1', 0),
            'taxable_income_p2': yd.get('taxable_income_p2', 0),
            'rrif_withdrawal_p1': yd.get('rrif_withdrawal_p1', 0),
            'tfsa_withdrawal_p1': yd.get('tfsa_withdrawal_p1', 0),
            'nonreg_withdrawal_p1': yd.get('nonreg_withdrawal_p1', 0),
        })

print("\n" + "=" * 80)
print("OAS CLAWBACK ANALYSIS")
print("=" * 80)

if len(clawback_years) == 0:
    print("\n✅ SUCCESS: No significant OAS clawback detected!")
    print("   The enhanced RRIF-Frontload strategy successfully avoided clawback")
    print("   by intelligently switching to TFSA/NonReg withdrawals.")
else:
    print(f"\n⚠️  Found {len(clawback_years)} years with OAS clawback:\n")
    total_clawback = 0
    for cy in clawback_years:
        print(f"Year {cy['year']} (age {cy['age_p1']}):")
        print(f"  Clawback: ${cy['clawback']:,.0f}")
        print(f"  Taxable Income P1: ${cy['taxable_income_p1']:,.0f}")
        print(f"  RRIF withdrawal: ${cy['rrif_withdrawal_p1']:,.0f}")
        print(f"  TFSA withdrawal: ${cy['tfsa_withdrawal_p1']:,.0f}")
        print(f"  NonReg withdrawal: ${cy['nonreg_withdrawal_p1']:,.0f}")
        print()
        total_clawback += cy['clawback']

    print(f"Total OAS clawback over lifetime: ${total_clawback:,.0f}")
    print("\nℹ️  Note: Some minimal clawback may still occur due to other income sources")
    print("   (NonReg distributions, CPP, etc.) but should be significantly reduced")

# Compare year 2033 specifically (the year mentioned in the original request)
year_2033 = next((y for y in year_by_year if y['year'] == 2033), None)
if year_2033:
    print("\n" + "=" * 80)
    print("YEAR 2033 ANALYSIS (Mentioned in original request)")
    print("=" * 80)
    clawback_2033 = (year_2033.get('oas_clawback_p1', 0) or 0) + (year_2033.get('oas_clawback_p2', 0) or 0)
    print(f"\nYear 2033:")
    print(f"  Age P1: {year_2033['age_p1']}")
    print(f"  OAS Clawback: ${clawback_2033:,.0f}")
    print(f"  Taxable Income P1: ${year_2033.get('taxable_income_p1', 0):,.0f}")
    print(f"  RRIF Withdrawal P1: ${year_2033.get('rrif_withdrawal_p1', 0):,.0f}")
    print(f"  TFSA Withdrawal P1: ${year_2033.get('tfsa_withdrawal_p1', 0):,.0f}")
    print(f"  NonReg Withdrawal P1: ${year_2033.get('nonreg_withdrawal_p1', 0):,.0f}")

    if clawback_2033 < 500:
        print(f"\n✅ SUCCESS: Year 2033 clawback reduced to ${clawback_2033:,.0f}")
        print("   (Previously $4,101 before enhancement)")
    else:
        print(f"\n⚠️  Year 2033 still has ${clawback_2033:,.0f} clawback")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
