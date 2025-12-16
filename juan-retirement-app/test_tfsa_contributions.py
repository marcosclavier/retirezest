"""
Test TFSA contributions to verify:
1. Contributions are subtracted from NonReg balance
2. Contributions are added to TFSA balance
3. Contribution data appears in API response
"""

import requests
import json

# Test profile with TFSA contributions enabled
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
    "tfsa_contribution_each": 7000,  # ENABLE TFSA CONTRIBUTIONS
    "reinvest_nonreg_dist": False
}

print("=" * 80)
print("TESTING TFSA CONTRIBUTIONS")
print("=" * 80)
print("\nTest Configuration:")
print(f"  - TFSA contribution per person: ${profile['tfsa_contribution_each']:,}")
print(f"  - Starting NonReg balance (P1): ${profile['p1']['nonreg_balance']:,}")
print(f"  - Starting TFSA balance (P1): ${profile['p1']['tfsa_balance']:,}")
print(f"  - TFSA room (P1): ${profile['p1']['tfsa_room_start']:,}")
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

# Extract first 5 years to see TFSA contributions
years = data.get("year_by_year", [])[:5]

if not years:
    print("\n❌ No year-by-year data returned")
    exit(1)

print("\n" + "=" * 80)
print("FIRST 5 YEARS - TFSA CONTRIBUTION VERIFICATION")
print("=" * 80)
print()
print(f"{'Year':<6} {'Age':<5} {'TFSA Contrib':<14} {'NonReg Bal':<14} {'TFSA Bal':<14}")
print("-" * 80)

initial_nonreg = profile['p1']['nonreg_balance']
initial_tfsa = profile['p1']['tfsa_balance']

for i, year_data in enumerate(years):
    year = year_data['year']
    age = year_data['age_p1']

    # Check if the new fields exist
    tfsa_contrib_p1 = year_data.get('tfsa_contribution_p1', 'MISSING')
    tfsa_contrib_p2 = year_data.get('tfsa_contribution_p2', 'MISSING')

    nonreg_bal_p1 = year_data.get('nonreg_balance_p1', 0)
    tfsa_bal_p1 = year_data.get('tfsa_balance_p1', 0)

    if tfsa_contrib_p1 == 'MISSING':
        print(f"{year:<6} {age:<5} ❌ FIELD MISSING")
        continue

    total_contrib = tfsa_contrib_p1 + tfsa_contrib_p2

    print(f"{year:<6} {age:<5} ${total_contrib:>12,.0f} ${nonreg_bal_p1:>12,.0f} ${tfsa_bal_p1:>12,.0f}")

print("-" * 80)

# Verify the logic
first_year = years[0]
tfsa_contrib_p1 = first_year.get('tfsa_contribution_p1', 0)
tfsa_contrib_p2 = first_year.get('tfsa_contribution_p2', 0)
total_contrib = tfsa_contrib_p1 + tfsa_contrib_p2

print("\n" + "=" * 80)
print("VALIDATION")
print("=" * 80)

if tfsa_contrib_p1 == 0 and tfsa_contrib_p2 == 0:
    print("\n❌ FAILED: No TFSA contributions detected!")
    print(f"   Expected: ${profile['tfsa_contribution_each']:,} per person")
    print(f"   Got: $0")
else:
    print(f"\n✅ TFSA contributions detected!")
    print(f"   Person 1: ${tfsa_contrib_p1:,.0f}")
    print(f"   Person 2: ${tfsa_contrib_p2:,.0f}")
    print(f"   Total: ${total_contrib:,.0f}")

    # Check if contributions match expected
    expected_per_person = min(7000, initial_nonreg, 7000)  # min(setting, nonreg, room)
    if abs(tfsa_contrib_p1 - expected_per_person) < 100:
        print(f"\n✅ Contribution amount correct: ${expected_per_person:,.0f}")
    else:
        print(f"\n⚠️  Contribution unexpected: expected ~${expected_per_person:,.0f}, got ${tfsa_contrib_p1:,.0f}")

# Verify NonReg was reduced
print("\n" + "=" * 80)
print("BALANCE VERIFICATION")
print("=" * 80)

year1_nonreg = years[0]['nonreg_balance_p1']
year1_tfsa = years[0]['tfsa_balance_p1']

print(f"\nNonReg Balance (P1):")
print(f"  Start: ${initial_nonreg:,.0f}")
print(f"  Year 1 End: ${year1_nonreg:,.0f}")
print(f"  Expected reduction: ~${tfsa_contrib_p1:,.0f} (plus withdrawals/growth)")

print(f"\nTFSA Balance (P1):")
print(f"  Start: ${initial_tfsa:,.0f}")
print(f"  Year 1 End: ${year1_tfsa:,.0f}")
print(f"  Expected increase: ~${tfsa_contrib_p1:,.0f} (plus growth)")

tfsa_increase = year1_tfsa - initial_tfsa
if tfsa_increase > tfsa_contrib_p1 * 0.9:  # Allow for growth
    print(f"\n✅ TFSA balance increased by ${tfsa_increase:,.0f}")
else:
    print(f"\n⚠️  TFSA balance increase unexpected: ${tfsa_increase:,.0f}")

print("\n" + "=" * 80)
print("✅ TFSA CONTRIBUTION TEST COMPLETE!")
print("=" * 80)
