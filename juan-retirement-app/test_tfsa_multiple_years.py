"""
Test TFSA contributions over multiple years to ensure consistency
"""

import requests

profile = {
    "p1": {
        "name": "Juan",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 14500,
        "oas_start_age": 70,
        "oas_annual_at_start": 8200,
        "tfsa_balance": 100000,
        "rrif_balance": 300000,
        "rrsp_balance": 0,
        "nonreg_balance": 215000,
        "corporate_balance": 500000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000,
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "p2": {
        "name": "Daniela",
        "start_age": 65,
        "cpp_start_age": 70,
        "cpp_annual_at_start": 14500,
        "oas_start_age": 70,
        "oas_annual_at_start": 8200,
        "tfsa_balance": 100000,
        "rrif_balance": 300000,
        "rrsp_balance": 0,
        "nonreg_balance": 215000,
        "corporate_balance": 500000,
        "nonreg_acb": 200000,
        "nr_cash": 5000,
        "nr_gic": 10000,
        "nr_invest": 200000,
        "tfsa_room_start": 7000,
        "tfsa_room_annual_growth": 7000
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "rrif-frontload",
    "spending_go_go": 100000,
    "spending_slow_go": 100000,
    "spending_no_go": 100000,
    "go_go_end_age": 75,
    "slow_go_end_age": 85,
    "tfsa_contribution_each": 7000,
    "reinvest_nonreg_dist": False
}

print("=" * 100)
print("TESTING: TFSA CONTRIBUTIONS CONSISTENCY OVER 10 YEARS")
print("=" * 100)

response = requests.post("http://localhost:8000/api/run-simulation", json=profile)

if response.status_code != 200:
    print(f"\n❌ Error: {response.status_code}")
    print(response.text)
    exit(1)

data = response.json()
if not data.get("success"):
    print(f"\n❌ Simulation failed")
    exit(1)

years = data.get("year_by_year", [])[:10]

print("\n" + "=" * 100)
print(f"{'Year':<6} {'Age':<5} {'Spending':<12} {'Spending':<12} {'TFSA':<12} {'Total':<12} {'Gap':<10}")
print(f"{'':6} {'':5} {'Need':<12} {'Met':<12} {'Contrib':<12} {'Cash':<12} {'':<10}")
print("-" * 100)

all_passed = True
for year_data in years:
    year = year_data['year']
    age = year_data['age_p1']
    spending_need = year_data['spending_need']
    spending_met = year_data['spending_met']
    spending_gap = year_data['spending_gap']
    tfsa_contrib = year_data.get('tfsa_contribution_p1', 0) + year_data.get('tfsa_contribution_p2', 0)

    # Calculate total after-tax cash
    gov_benefits = (year_data['cpp_p1'] + year_data['cpp_p2'] +
                   year_data['oas_p1'] + year_data['oas_p2'])
    withdrawals = (year_data['rrif_withdrawal_p1'] + year_data['rrif_withdrawal_p2'] +
                  year_data['nonreg_withdrawal_p1'] + year_data['nonreg_withdrawal_p2'] +
                  year_data['corporate_withdrawal_p1'] + year_data['corporate_withdrawal_p2'] +
                  year_data['tfsa_withdrawal_p1'] + year_data['tfsa_withdrawal_p2'])
    nonreg_dist = year_data.get('nonreg_distributions', 0)
    total_tax = year_data['total_tax']

    total_cash = gov_benefits + withdrawals + nonreg_dist - total_tax

    # Check if spending is met
    spending_ok = abs(spending_met - spending_need) < 100
    tfsa_ok = abs(tfsa_contrib - 14000) < 100
    gap_ok = spending_gap < 10

    status = "✅" if (spending_ok and tfsa_ok and gap_ok) else "❌"
    if not (spending_ok and tfsa_ok and gap_ok):
        all_passed = False

    print(f"{year:<6} {age:<5} ${spending_need:>10,.0f} ${spending_met:>10,.0f} ${tfsa_contrib:>10,.0f} ${total_cash:>10,.0f} ${spending_gap:>8,.0f} {status}")

print("-" * 100)

if all_passed:
    print("\n✅ ALL YEARS PASSED!")
    print("✅ Spending fully met in all years")
    print("✅ TFSA contributions consistent at $14,000/year")
    print("✅ No spending gaps")
else:
    print("\n❌ SOME YEARS FAILED")

print("=" * 100)
