"""
Test RRIF-Frontload strategy with Corporate accounts to verify OAS clawback protection.

This test verifies that when Corporate accounts exist, the strategy automatically
uses the clawback-aware withdrawal order (NonReg -> TFSA -> Corp) to avoid
OAS clawback from grossed-up dividend income.
"""

import requests
import json

# Test profile with Corporate accounts (like Juan & Daniela)
test_profile = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 150000,
        "rrif_balance": 185000,
        "rrsp_balance": 0,
        "nonreg_balance": 441500,
        "corporate_balance": 1207500,  # Large corporate balance
        "nonreg_acb": 397350,
        "nr_cash": 44150,
        "nr_gic": 88300,
        "nr_invest": 309050,
        "y_nr_cash_interest": 1.0,
        "y_nr_gic_interest": 3.0,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 10.0,
        "nr_gic_pct": 20.0,
        "nr_invest_pct": 70.0,
        "corp_cash_bucket": 60375,
        "corp_gic_bucket": 120750,
        "corp_invest_bucket": 1026375,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 1.0,
        "y_corp_gic_interest": 3.0,
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
        "name": "Daniela",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 16000,
        "oas_start_age": 70,
        "oas_annual_at_start": 8500,
        "tfsa_balance": 220000,
        "rrif_balance": 260000,
        "rrsp_balance": 0,
        "nonreg_balance": 441500,
        "corporate_balance": 1207500,  # Large corporate balance
        "nonreg_acb": 397350,
        "nr_cash": 44150,
        "nr_gic": 88300,
        "nr_invest": 309050,
        "y_nr_cash_interest": 1.0,
        "y_nr_gic_interest": 3.0,
        "y_nr_inv_total_return": 6.0,
        "y_nr_inv_elig_div": 2.0,
        "y_nr_inv_nonelig_div": 0.5,
        "y_nr_inv_capg": 3.0,
        "y_nr_inv_roc_pct": 0.5,
        "nr_cash_pct": 10.0,
        "nr_gic_pct": 20.0,
        "nr_invest_pct": 70.0,
        "corp_cash_bucket": 60375,
        "corp_gic_bucket": 120750,
        "corp_invest_bucket": 1026375,
        "corp_rdtoh": 0,
        "y_corp_cash_interest": 1.0,
        "y_corp_gic_interest": 3.0,
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
    "strategy": "rrif-frontload",
    "spending_go_go": 207000,
    "go_go_end_age": 75,
    "spending_slow_go": 155250,
    "slow_go_end_age": 85,
    "spending_no_go": 124200,
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
print("TESTING: OAS CLAWBACK PROTECTION WITH CORPORATE ACCOUNTS")
print("=" * 80)
print()
print("Profile:")
print(f"  Juan: TFSA=$150K, RRIF=$185K, NonReg=$441K, Corp=$1.2M")
print(f"  Daniela: TFSA=$220K, RRIF=$260K, NonReg=$441K, Corp=$1.2M")
print(f"  Strategy: rrif-frontload")
print(f"  OAS starts: Age 70")
print(f"  Spending: $207K (go-go)")
print()

# Run simulation
print("Running simulation...")
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

print("✅ Simulation completed successfully")
print()

# Check for OAS clawback
print("=" * 80)
print("OAS CLAWBACK ANALYSIS")
print("=" * 80)
print()

total_clawback = summary.get('total_oas_clawback', 0)
print(f"Total OAS clawback over lifetime: ${total_clawback:,.0f}")

# Find years with OAS clawback
clawback_years = []
for yd in year_by_year:
    year = yd['year']
    clawback_p1 = yd.get('oas_clawback_p1', 0) or 0
    clawback_p2 = yd.get('oas_clawback_p2', 0) or 0
    total_year_clawback = clawback_p1 + clawback_p2

    if total_year_clawback > 100:  # Threshold of $100 to filter noise
        clawback_years.append({
            'year': year,
            'age': yd['age_p1'],
            'clawback': total_year_clawback,
            'corp_wd_p1': yd.get('corporate_withdrawal_p1', 0),
            'corp_wd_p2': yd.get('corporate_withdrawal_p2', 0),
            'tfsa_wd_p1': yd.get('tfsa_withdrawal_p1', 0),
            'tfsa_wd_p2': yd.get('tfsa_withdrawal_p2', 0),
            'nonreg_wd_p1': yd.get('nonreg_withdrawal_p1', 0),
            'nonreg_wd_p2': yd.get('nonreg_withdrawal_p2', 0),
        })

if len(clawback_years) == 0:
    print("✅ SUCCESS: No OAS clawback detected!")
    print("   The enhanced strategy successfully avoided clawback by using")
    print("   the protective withdrawal order (NonReg -> TFSA -> Corp).")
else:
    print(f"⚠️  Found {len(clawback_years)} years with OAS clawback:")
    print()
    for cy in clawback_years[:10]:  # Show first 10
        print(f"Year {cy['year']} (age {cy['age']}):")
        print(f"  Total clawback: ${cy['clawback']:,.0f}")
        print(f"  Corp withdrawals: P1=${cy['corp_wd_p1']:,.0f}, P2=${cy['corp_wd_p2']:,.0f}")
        print(f"  TFSA withdrawals: P1=${cy['tfsa_wd_p1']:,.0f}, P2=${cy['tfsa_wd_p2']:,.0f}")
        print(f"  NonReg withdrawals: P1=${cy['nonreg_wd_p1']:,.0f}, P2=${cy['nonreg_wd_p2']:,.0f}")
        print()

    print(f"Total OAS clawback: ${total_clawback:,.0f}")
    print()
    print("❌ FAILED: Clawback protection should have prevented this!")

# Check year 2033 specifically
year_2033 = next((y for y in year_by_year if y['year'] == 2033), None)
if year_2033:
    print()
    print("=" * 80)
    print("YEAR 2033 DETAIL (previously showed $5,272 clawback)")
    print("=" * 80)
    print()

    clawback_2033 = (year_2033.get('oas_clawback_p1', 0) or 0) + (year_2033.get('oas_clawback_p2', 0) or 0)
    print(f"OAS Clawback: ${clawback_2033:,.0f}")
    print(f"Corp WD P1: ${year_2033.get('corporate_withdrawal_p1', 0):,.0f}")
    print(f"Corp WD P2: ${year_2033.get('corporate_withdrawal_p2', 0):,.0f}")
    print(f"TFSA WD P1: ${year_2033.get('tfsa_withdrawal_p1', 0):,.0f}")
    print(f"TFSA WD P2: ${year_2033.get('tfsa_withdrawal_p2', 0):,.0f}")
    print(f"NonReg WD P1: ${year_2033.get('nonreg_withdrawal_p1', 0):,.0f}")
    print(f"NonReg WD P2: ${year_2033.get('nonreg_withdrawal_p2', 0):,.0f}")

    if clawback_2033 < 100:
        print()
        print("✅ SUCCESS: Year 2033 clawback eliminated!")
    else:
        print()
        print(f"⚠️  Year 2033 still has ${clawback_2033:,.0f} clawback")

print()
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)
