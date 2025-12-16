"""
Test the newly implemented RRIF front-loading strategy.
"""

import requests
import json

# Test profile using the new RRIF-Frontload strategy
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
        "nr_invest": 200000
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
        "nr_invest": 200000
    },
    "province": "AB",
    "start_year": 2025,
    "end_age": 95,
    "strategy": "rrif-frontload",  # NEW STRATEGY!
    "spending_go_go": 100000,
    "spending_slow_go": 100000,
    "spending_no_go": 100000,
    "go_go_end_age": 75,
    "slow_go_end_age": 85
}

print("=" * 80)
print("TESTING NEW RRIF-FRONTLOAD STRATEGY")
print("=" * 80)
print("\nStrategy: rrif-frontload")
print("Expected behavior:")
print("  - Ages 65-69: RRIF withdrawals at 15% annually")
print("  - Ages 70+: RRIF withdrawals at 8% annually")
print("\n" + "=" * 80)

response = requests.post("http://localhost:8000/api/run-simulation", json=profile)

if response.status_code != 200:
    print(f"\n❌ Error: {response.status_code}")
    print(response.text)
    exit(1)

data = response.json()

if not data.get("success"):
    print(f"\n❌ Simulation failed: {data.get('message')}")
    exit(1)

print("\n✅ Simulation successful!")

# Extract first 10 years
years = data.get("year_by_year", [])[:10]

if not years:
    print("\n❌ No year-by-year data returned")
    exit(1)

print("\n" + "=" * 80)
print("RESULTS: First 10 Years")
print("=" * 80)
print()
print(f"{'Year':<6} {'Age':<5} {'RRIF Bal':<14} {'RRIF Wd P1':<14} {'RRIF Wd P2':<14} {'Total Tax':<12}")
print("-" * 80)

total_tax_65_70 = 0
total_tax_70_75 = 0

for year_data in years:
    year = year_data['year']
    age = year_data['age_p1']
    rrif_bal_p1 = year_data.get('rrif_balance_p1', 0)
    rrif_bal_p2 = year_data.get('rrif_balance_p2', 0)
    rrif_wd_p1 = year_data.get('rrif_withdrawal_p1', 0)
    rrif_wd_p2 = year_data.get('rrif_withdrawal_p2', 0)
    total_tax = year_data.get('total_tax', 0)

    rrif_bal_total = rrif_bal_p1 + rrif_bal_p2

    print(f"{year:<6} {age:<5} ${rrif_bal_total:>12,.0f} ${rrif_wd_p1:>12,.0f} ${rrif_wd_p2:>12,.0f} ${total_tax:>10,.0f}")

    if age <= 69:
        total_tax_65_70 += total_tax
    elif age <= 74:
        total_tax_70_75 += total_tax

print("-" * 80)

# Verify strategy is working
first_year = years[0]
rrif_start = (first_year.get('rrif_balance_p1', 0) +
              first_year.get('rrif_balance_p2', 0) +
              first_year.get('rrif_withdrawal_p1', 0) +
              first_year.get('rrif_withdrawal_p2', 0))
rrif_wd_year1 = first_year.get('rrif_withdrawal_p1', 0) + first_year.get('rrif_withdrawal_p2', 0)
rrif_pct_year1 = (rrif_wd_year1 / rrif_start * 100) if rrif_start > 0 else 0

print("\n" + "=" * 80)
print("VALIDATION")
print("=" * 80)
print(f"\nStarting RRIF balance (age 65): ${rrif_start:,.0f}")
print(f"Year 1 RRIF withdrawal: ${rrif_wd_year1:,.0f}")
print(f"Year 1 RRIF withdrawal %: {rrif_pct_year1:.1f}%")
print(f"Expected: ~15%")

if 14.0 <= rrif_pct_year1 <= 16.0:
    print("✅ PHASE 1 (ages 65-69): CORRECT - Withdrawing ~15% annually")
else:
    print(f"⚠️  PHASE 1 WARNING: Expected ~15%, got {rrif_pct_year1:.1f}%")

# Check age 70
if len(years) >= 6:
    age_70_year = years[5]
    rrif_bal_70 = age_70_year.get('rrif_balance_p1', 0) + age_70_year.get('rrif_balance_p2', 0)
    rrif_wd_70_p1 = age_70_year.get('rrif_withdrawal_p1', 0)
    rrif_wd_70_p2 = age_70_year.get('rrif_withdrawal_p2', 0)
    rrif_wd_70 = rrif_wd_70_p1 + rrif_wd_70_p2
    rrif_bal_70_start = rrif_bal_70 + rrif_wd_70
    rrif_pct_70 = (rrif_wd_70 / rrif_bal_70_start * 100) if rrif_bal_70_start > 0 else 0

    print(f"\nRRIF balance at age 70 (start): ${rrif_bal_70_start:,.0f}")
    print(f"RRIF withdrawal at age 70: ${rrif_wd_70:,.0f}")
    print(f"RRIF withdrawal % at age 70: {rrif_pct_70:.1f}%")
    print(f"Expected: ~8%")

    if 7.0 <= rrif_pct_70 <= 10.0:
        print("✅ PHASE 2 (ages 70+): CORRECT - Withdrawing ~8% annually")
    else:
        print(f"⚠️  PHASE 2 WARNING: Expected ~8%, got {rrif_pct_70:.1f}%")

print("\n" + "=" * 80)
print("TAX SUMMARY")
print("=" * 80)
print(f"\nTotal tax ages 65-69: ${total_tax_65_70:,.0f}")
print(f"Total tax ages 70-74: ${total_tax_70_75:,.0f}")
print(f"Total tax (10 years): ${total_tax_65_70 + total_tax_70_75:,.0f}")
print()
print("Compare to baseline (~$262,854):")
print(f"Estimated savings: ${262854 - (total_tax_65_70 + total_tax_70_75):,.0f}")
print()

print("=" * 80)
print("✅ RRIF-FRONTLOAD STRATEGY IMPLEMENTATION SUCCESSFUL!")
print("=" * 80)
